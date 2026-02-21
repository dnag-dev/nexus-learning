/**
 * Stripe Client — Phase 10: Billing
 *
 * Singleton Stripe SDK instance for server-side usage.
 * Uses STRIPE_SECRET_KEY env var.
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Get or create the Stripe client singleton.
 * Returns null if STRIPE_SECRET_KEY is not configured.
 */
export function getStripeClient(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeInstance;
}

// ─── Plan Configuration ───

export type PlanKey = "SPARK" | "PRO" | "FAMILY" | "ANNUAL";

export interface PlanConfig {
  key: PlanKey;
  name: string;
  priceINR: number; // Monthly price in INR
  priceId: string | null; // Stripe price ID (set after seeding)
  interval: "month" | "year";
  description: string;
  features: string[];
  childLimit: number;
  dailyMinutesLimit: number; // 0 = unlimited
  hasAvatar: boolean;
  hasVoice: boolean;
  hasBossChallenge: boolean;
  hasDetailedReports: boolean;
  hasNarrativeReports: boolean;
  popular?: boolean;
}

export const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
  SPARK: {
    key: "SPARK",
    name: "Spark",
    priceINR: 0,
    priceId: null,
    interval: "month",
    description: "Get started with the basics",
    features: [
      "1 child profile",
      "1 subject (Math)",
      "20 min/day learning",
      "Text-only tutor",
      "Basic progress tracking",
    ],
    childLimit: 1,
    dailyMinutesLimit: 20,
    hasAvatar: false,
    hasVoice: false,
    hasBossChallenge: false,
    hasDetailedReports: false,
    hasNarrativeReports: false,
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceINR: 599,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    interval: "month",
    description: "Full access for one child",
    features: [
      "2 child profiles",
      "All subjects",
      "Unlimited learning time",
      "Animated avatar + voice",
      "Boss challenges",
      "Detailed reports",
      "Weekly narrative reports",
      "Priority support",
    ],
    childLimit: 2,
    dailyMinutesLimit: 0,
    hasAvatar: true,
    hasVoice: true,
    hasBossChallenge: true,
    hasDetailedReports: true,
    hasNarrativeReports: true,
    popular: true,
  },
  FAMILY: {
    key: "FAMILY",
    name: "Family",
    priceINR: 899,
    priceId: process.env.STRIPE_PRICE_FAMILY || null,
    interval: "month",
    description: "Perfect for families with multiple children",
    features: [
      "Up to 4 child profiles",
      "All subjects",
      "Unlimited learning time",
      "Animated avatar + voice",
      "Boss challenges",
      "Detailed reports",
      "Weekly narrative reports",
      "Family progress dashboard",
      "Priority support",
    ],
    childLimit: 4,
    dailyMinutesLimit: 0,
    hasAvatar: true,
    hasVoice: true,
    hasBossChallenge: true,
    hasDetailedReports: true,
    hasNarrativeReports: true,
  },
  ANNUAL: {
    key: "ANNUAL",
    name: "Annual Pro",
    priceINR: 4999,
    priceId: process.env.STRIPE_PRICE_ANNUAL || null,
    interval: "year",
    description: "Best value — save 2 months!",
    features: [
      "Everything in Pro",
      "2 child profiles",
      "All subjects",
      "Unlimited learning time",
      "Animated avatar + voice",
      "Boss challenges",
      "Detailed reports",
      "Weekly narrative reports",
      "Priority support",
      "2 months free",
    ],
    childLimit: 2,
    dailyMinutesLimit: 0,
    hasAvatar: true,
    hasVoice: true,
    hasBossChallenge: true,
    hasDetailedReports: true,
    hasNarrativeReports: true,
  },
};

/**
 * Get plan config by key, defaults to SPARK.
 */
export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIGS[plan as PlanKey] ?? PLAN_CONFIGS.SPARK;
}

/**
 * Map Stripe price ID → PlanKey
 */
export function planKeyFromPriceId(priceId: string): PlanKey | null {
  for (const [key, config] of Object.entries(PLAN_CONFIGS)) {
    if (config.priceId === priceId) return key as PlanKey;
  }
  return null;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event | null {
  const stripe = getStripeClient();
  if (!stripe) return null;
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}
