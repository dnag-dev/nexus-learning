/**
 * Subscription Service — Phase 10: Billing
 *
 * Core subscription lifecycle management:
 *  - createCheckoutSession: redirect to Stripe Checkout
 *  - createCustomerPortalSession: manage subscription
 *  - getSubscription: fetch current subscription
 *  - getFeatureGates: check what features are available
 *  - handleTrialExpiry: downgrade expired trials
 *  - canAddChild: check child limit
 *  - checkDailyMinutesLimit: check time limit
 */

import { prisma } from "@aauti/db";
import { getStripeClient, getPlanConfig, PLAN_CONFIGS, type PlanKey } from "./stripe-client";

// ─── Types ───

export interface FeatureGates {
  childLimit: number;
  dailyMinutesLimit: number; // 0 = unlimited
  hasAvatar: boolean;
  hasVoice: boolean;
  hasBossChallenge: boolean;
  hasDetailedReports: boolean;
  hasNarrativeReports: boolean;
  plan: PlanKey;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
}

export interface CheckoutResult {
  url: string | null;
  error?: string;
}

export interface PortalResult {
  url: string | null;
  error?: string;
}

export interface SubscriptionInfo {
  plan: PlanKey;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  stripeCustomerId: string | null;
}

// ─── Checkout ───

/**
 * Create a Stripe Checkout Session for a given plan.
 * Returns the Checkout URL to redirect the user.
 */
export async function createCheckoutSession(
  userId: string,
  planKey: PlanKey,
  successUrl: string,
  cancelUrl: string,
  withTrial: boolean = false
): Promise<CheckoutResult> {
  const stripe = getStripeClient();
  if (!stripe) return { url: null, error: "Stripe not configured" };

  const plan = PLAN_CONFIGS[planKey];
  if (!plan || !plan.priceId) {
    return { url: null, error: `Invalid plan or no price ID for ${planKey}` };
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) return { url: null, error: "User not found" };

  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const sessionParams: Record<string, unknown> = {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, planKey },
    currency: "inr",
    allow_promotion_codes: true,
  };

  if (withTrial) {
    sessionParams.subscription_data = {
      trial_period_days: 14,
      metadata: { userId, planKey },
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );
    return { url: session.url };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Checkout failed",
    };
  }
}

// ─── Customer Portal ───

/**
 * Create a Stripe Customer Portal session for managing subscription.
 */
export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<PortalResult> {
  const stripe = getStripeClient();
  if (!stripe) return { url: null, error: "Stripe not configured" };

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    return { url: null, error: "No Stripe customer found" };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : "Portal session failed",
    };
  }
}

// ─── Subscription Info ───

/**
 * Get the current subscription info for a user.
 */
export async function getSubscription(
  userId: string
): Promise<SubscriptionInfo | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) return null;

  const isTrialing = subscription.status === "TRIALING";
  const trialDaysRemaining = isTrialing && subscription.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    plan: subscription.plan as PlanKey,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    isTrialing,
    trialDaysRemaining,
    stripeCustomerId: subscription.stripeCustomerId,
  };
}

// ─── Feature Gates ───

/**
 * Get what features are available for a user's current plan.
 */
export async function getFeatureGates(
  userId: string
): Promise<FeatureGates> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const plan = (subscription?.plan ?? "SPARK") as PlanKey;
  const config = getPlanConfig(plan);

  const isTrialing = subscription?.status === "TRIALING";
  const trialDaysRemaining =
    isTrialing && subscription?.trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (subscription.trialEndsAt.getTime() - Date.now()) /
              (24 * 60 * 60 * 1000)
          )
        )
      : null;

  return {
    childLimit: config.childLimit,
    dailyMinutesLimit: config.dailyMinutesLimit,
    hasAvatar: config.hasAvatar,
    hasVoice: config.hasVoice,
    hasBossChallenge: config.hasBossChallenge,
    hasDetailedReports: config.hasDetailedReports,
    hasNarrativeReports: config.hasNarrativeReports,
    plan,
    isTrialing,
    trialDaysRemaining,
  };
}

/**
 * Check if a user can add another child profile.
 */
export async function canAddChild(userId: string): Promise<boolean> {
  const gates = await getFeatureGates(userId);
  const childCount = await prisma.student.count({
    where: { parentId: userId },
  });
  return childCount < gates.childLimit;
}

/**
 * Check daily minutes remaining for a student today.
 * Returns minutes remaining (0 = limit reached, -1 = unlimited).
 */
export async function checkDailyMinutesRemaining(
  studentId: string
): Promise<number> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parent: { include: { subscription: true } } },
  });

  if (!student) return 0;

  const plan = (student.parent.subscription?.plan ?? "SPARK") as PlanKey;
  const config = getPlanConfig(plan);

  if (config.dailyMinutesLimit === 0) return -1; // Unlimited

  // Calculate minutes used today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      startedAt: { gte: todayStart },
    },
    select: { durationSeconds: true },
  });

  const minutesUsed = todaySessions.reduce(
    (sum, s) => sum + Math.ceil(s.durationSeconds / 60),
    0
  );

  return Math.max(0, config.dailyMinutesLimit - minutesUsed);
}

// ─── Trial Management ───

/**
 * Start a 14-day free trial on the Pro plan.
 * Creates or updates the subscription record.
 */
export async function startFreeTrial(userId: string): Promise<boolean> {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  // Don't restart trial if one already exists
  if (existing && existing.plan !== "SPARK") return false;

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: "PRO",
      status: "TRIALING",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    },
    update: {
      plan: "PRO",
      status: "TRIALING",
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    },
  });

  return true;
}

/**
 * Handle expired trials — downgrade to SPARK.
 * Called by a scheduled job or on-demand.
 */
export async function handleExpiredTrials(): Promise<number> {
  const now = new Date();

  const expired = await prisma.subscription.findMany({
    where: {
      status: "TRIALING",
      trialEndsAt: { lt: now },
    },
  });

  let count = 0;
  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan: "SPARK",
        status: "ACTIVE",
        trialEndsAt: null,
      },
    });
    count++;
  }

  return count;
}

// ─── Subscription Updates (called from webhook) ───

/**
 * Activate or update a subscription from Stripe webhook data.
 */
export async function activateSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  planKey: PlanKey,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  trialEnd: Date | null,
  status: "ACTIVE" | "TRIALING"
): Promise<void> {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planKey,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: trialEnd,
    },
    update: {
      plan: planKey,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: trialEnd,
    },
  });
}

/**
 * Cancel a subscription (set cancelAtPeriodEnd).
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });
}

/**
 * Mark subscription as canceled (period ended).
 */
export async function deactivateSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: "SPARK",
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Mark subscription as past due.
 */
export async function markPastDue(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: { status: "PAST_DUE" },
  });
}
