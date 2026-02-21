/**
 * Feature Gate Middleware — Phase 10: Billing
 *
 * Utility functions for checking feature access based on subscription plan.
 * Used in API routes and UI components to enforce plan limits.
 */

import { getPlanConfig, type PlanKey, type PlanConfig } from "./stripe-client";

// ─── Types ───

export type GatedFeature =
  | "avatar"
  | "voice"
  | "boss_challenge"
  | "detailed_reports"
  | "narrative_reports"
  | "unlimited_time"
  | "extra_children";

export interface GateCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanKey;
}

// ─── Feature Check Functions ───

/**
 * Check if a specific feature is available for a plan.
 */
export function isFeatureAvailable(
  plan: string,
  feature: GatedFeature
): GateCheckResult {
  const config = getPlanConfig(plan);

  switch (feature) {
    case "avatar":
      return config.hasAvatar
        ? { allowed: true }
        : { allowed: false, reason: "Animated avatars require Pro or higher", requiredPlan: "PRO" };

    case "voice":
      return config.hasVoice
        ? { allowed: true }
        : { allowed: false, reason: "Voice tutoring requires Pro or higher", requiredPlan: "PRO" };

    case "boss_challenge":
      return config.hasBossChallenge
        ? { allowed: true }
        : { allowed: false, reason: "Boss Challenges require Pro or higher", requiredPlan: "PRO" };

    case "detailed_reports":
      return config.hasDetailedReports
        ? { allowed: true }
        : { allowed: false, reason: "Detailed reports require Pro or higher", requiredPlan: "PRO" };

    case "narrative_reports":
      return config.hasNarrativeReports
        ? { allowed: true }
        : { allowed: false, reason: "Narrative reports require Pro or higher", requiredPlan: "PRO" };

    case "unlimited_time":
      return config.dailyMinutesLimit === 0
        ? { allowed: true }
        : { allowed: false, reason: "Unlimited time requires Pro or higher", requiredPlan: "PRO" };

    case "extra_children":
      return config.childLimit > 1
        ? { allowed: true }
        : { allowed: false, reason: "Additional children require Pro or higher", requiredPlan: "PRO" };

    default:
      return { allowed: true };
  }
}

/**
 * Check if a user can add another child based on plan limits.
 */
export function canAddChildForPlan(
  plan: string,
  currentChildCount: number
): GateCheckResult {
  const config = getPlanConfig(plan);

  if (currentChildCount < config.childLimit) {
    return { allowed: true };
  }

  // Suggest the next plan up
  const requiredPlan: PlanKey =
    config.childLimit < 2 ? "PRO" : config.childLimit < 4 ? "FAMILY" : "FAMILY";

  return {
    allowed: false,
    reason: `Your ${config.name} plan allows ${config.childLimit} child${
      config.childLimit === 1 ? "" : "ren"
    }. Upgrade to add more.`,
    requiredPlan,
  };
}

/**
 * Check daily time limit for a plan.
 * Returns remaining minutes or -1 for unlimited.
 */
export function getDailyMinutesLimit(plan: string): number {
  const config = getPlanConfig(plan);
  return config.dailyMinutesLimit === 0 ? -1 : config.dailyMinutesLimit;
}

/**
 * Get all features available for a plan.
 */
export function getAvailableFeatures(plan: string): GatedFeature[] {
  const features: GatedFeature[] = [];
  const allFeatures: GatedFeature[] = [
    "avatar",
    "voice",
    "boss_challenge",
    "detailed_reports",
    "narrative_reports",
    "unlimited_time",
    "extra_children",
  ];

  for (const feature of allFeatures) {
    if (isFeatureAvailable(plan, feature).allowed) {
      features.push(feature);
    }
  }

  return features;
}

/**
 * Get features that are NOT available for a plan (for upgrade prompts).
 */
export function getLockedFeatures(plan: string): GatedFeature[] {
  const allFeatures: GatedFeature[] = [
    "avatar",
    "voice",
    "boss_challenge",
    "detailed_reports",
    "narrative_reports",
    "unlimited_time",
    "extra_children",
  ];

  return allFeatures.filter((f) => !isFeatureAvailable(plan, f).allowed);
}

/**
 * Compare two plans and return features gained by upgrading.
 */
export function getUpgradeGains(
  currentPlan: string,
  targetPlan: string
): GatedFeature[] {
  const current = getAvailableFeatures(currentPlan);
  const target = getAvailableFeatures(targetPlan);

  return target.filter((f) => !current.includes(f));
}

/**
 * Get plan config enriched with feature availability.
 * Useful for rendering plan comparison tables.
 */
export function getEnrichedPlanConfig(
  plan: string
): PlanConfig & { availableFeatures: GatedFeature[]; lockedFeatures: GatedFeature[] } {
  const config = getPlanConfig(plan);
  return {
    ...config,
    availableFeatures: getAvailableFeatures(plan),
    lockedFeatures: getLockedFeatures(plan),
  };
}
