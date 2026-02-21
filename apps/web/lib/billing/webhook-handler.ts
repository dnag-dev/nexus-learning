/**
 * Stripe Webhook Handler — Phase 10: Billing
 *
 * Handles Stripe webhook events:
 *  - checkout.session.completed → activate subscription
 *  - customer.subscription.updated → sync plan changes
 *  - customer.subscription.deleted → deactivate
 *  - invoice.payment_succeeded → extend period
 *  - invoice.payment_failed → mark past due
 *
 * Each event is logged to WebhookLog for auditing.
 * Duplicate events (same eventId) are skipped.
 */

import { prisma } from "@aauti/db";
import { planKeyFromPriceId, type PlanKey } from "./stripe-client";
import {
  activateSubscription,
  cancelSubscription,
  deactivateSubscription,
  markPastDue,
} from "./subscription-service";

// ─── Types ───

export interface WebhookResult {
  success: boolean;
  action: string;
  error?: string;
}

export type StripeEventType =
  | "checkout.session.completed"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed";

export const HANDLED_EVENTS: StripeEventType[] = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
];

// ─── Webhook Processing ───

/**
 * Process a Stripe webhook event.
 * Returns result with action taken.
 */
export async function processWebhookEvent(
  eventId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<WebhookResult> {
  // Check for duplicate
  const existing = await prisma.webhookLog.findUnique({
    where: { eventId },
  });

  if (existing) {
    return { success: true, action: "duplicate_skipped" };
  }

  let result: WebhookResult;

  try {
    switch (eventType) {
      case "checkout.session.completed":
        result = await handleCheckoutComplete(data);
        break;
      case "customer.subscription.updated":
        result = await handleSubscriptionUpdated(data);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(data);
        break;
      case "invoice.payment_succeeded":
        result = await handlePaymentSucceeded(data);
        break;
      case "invoice.payment_failed":
        result = await handlePaymentFailed(data);
        break;
      default:
        result = { success: true, action: "unhandled_event_type" };
    }
  } catch (err) {
    result = {
      success: false,
      action: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Log the event
  await prisma.webhookLog.create({
    data: {
      eventId,
      eventType,
      payload: JSON.parse(JSON.stringify(data)),
      success: result.success,
      error: result.error ?? null,
    },
  });

  return result;
}

// ─── Event Handlers ───

async function handleCheckoutComplete(
  data: Record<string, unknown>
): Promise<WebhookResult> {
  const session = data as {
    metadata?: { userId?: string; planKey?: string };
    customer?: string;
    subscription?: string;
  };

  const userId = session.metadata?.userId;
  const planKey = (session.metadata?.planKey ?? "PRO") as PlanKey;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    return { success: false, action: "checkout_complete", error: "No userId in metadata" };
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await activateSubscription(
    userId,
    customerId,
    subscriptionId,
    "", // price ID filled on subscription.updated
    planKey,
    now,
    periodEnd,
    null,
    "ACTIVE"
  );

  return { success: true, action: "subscription_activated" };
}

async function handleSubscriptionUpdated(
  data: Record<string, unknown>
): Promise<WebhookResult> {
  const sub = data as {
    id?: string;
    customer?: string;
    metadata?: { userId?: string };
    items?: { data?: Array<{ price?: { id?: string } }> };
    current_period_start?: number;
    current_period_end?: number;
    trial_end?: number | null;
    status?: string;
    cancel_at_period_end?: boolean;
  };

  // Find user by Stripe customer ID
  const customerId = sub.customer as string;
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  const userId = sub.metadata?.userId ?? subscription?.userId;
  if (!userId) {
    return { success: false, action: "subscription_updated", error: "Cannot find user" };
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? "";
  const planKey = planKeyFromPriceId(priceId) ?? (subscription?.plan as PlanKey) ?? "PRO";
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000)
    : new Date();
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  const stripeStatus = sub.status ?? "active";
  const status: "ACTIVE" | "TRIALING" =
    stripeStatus === "trialing" ? "TRIALING" : "ACTIVE";

  if (sub.cancel_at_period_end) {
    await cancelSubscription(userId);
    return { success: true, action: "subscription_cancel_scheduled" };
  }

  await activateSubscription(
    userId,
    customerId,
    sub.id ?? "",
    priceId,
    planKey,
    periodStart,
    periodEnd,
    trialEnd,
    status
  );

  return { success: true, action: "subscription_updated" };
}

async function handleSubscriptionDeleted(
  data: Record<string, unknown>
): Promise<WebhookResult> {
  const sub = data as {
    customer?: string;
    metadata?: { userId?: string };
  };

  const customerId = sub.customer as string;
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  const userId = sub.metadata?.userId ?? subscription?.userId;
  if (!userId) {
    return { success: false, action: "subscription_deleted", error: "Cannot find user" };
  }

  await deactivateSubscription(userId);
  return { success: true, action: "subscription_deactivated" };
}

async function handlePaymentSucceeded(
  data: Record<string, unknown>
): Promise<WebhookResult> {
  const invoice = data as {
    customer?: string;
    subscription?: string;
    lines?: { data?: Array<{ period?: { start?: number; end?: number } }> };
  };

  const customerId = invoice.customer as string;
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    return { success: true, action: "payment_succeeded_no_sub" };
  }

  const period = invoice.lines?.data?.[0]?.period;
  if (period?.end) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodEnd: new Date(period.end * 1000),
        status: "ACTIVE",
      },
    });
  }

  return { success: true, action: "period_extended" };
}

async function handlePaymentFailed(
  data: Record<string, unknown>
): Promise<WebhookResult> {
  const invoice = data as {
    customer?: string;
  };

  const customerId = invoice.customer as string;
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    return { success: true, action: "payment_failed_no_sub" };
  }

  await markPastDue(subscription.userId);
  return { success: true, action: "marked_past_due" };
}
