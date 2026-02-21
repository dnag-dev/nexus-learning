/**
 * UpgradePrompt — Phase 10: Billing
 *
 * A dismissible prompt shown to free/SPARK users when they try
 * to access a gated feature. Also used as an inline CTA.
 */

"use client";

// ─── Types ───

export interface UpgradePromptProps {
  feature: string; // e.g., "Boss Challenges", "Voice Tutor", etc.
  currentPlan: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  variant?: "banner" | "inline" | "modal";
}

// ─── Feature Descriptions ───

export const FEATURE_UPGRADE_MESSAGES: Record<string, string> = {
  avatar: "Animated avatar tutors bring learning to life with engaging visuals and expressions.",
  voice: "Voice-powered tutoring makes sessions feel like having a real tutor by your side.",
  boss_challenge: "Boss Challenges test your child's knowledge with fun, timed assessments each week.",
  detailed_reports: "Detailed reports give you deep insights into your child's learning patterns.",
  narrative_reports: "AI-generated narrative reports tell the story of your child's learning journey.",
  extra_children: "Add more child profiles so all your children can learn with Aauti.",
  unlimited_time: "Unlimited learning time means your child can explore at their own pace.",
};

/**
 * Get the upgrade message for a feature.
 */
export function getUpgradeMessage(feature: string): string {
  return (
    FEATURE_UPGRADE_MESSAGES[feature] ??
    `Upgrade to unlock ${feature} and supercharge your child's learning!`
  );
}

/**
 * Get the recommended plan for a feature.
 */
export function getRecommendedPlan(feature: string): string {
  if (feature === "extra_children") return "FAMILY";
  return "PRO";
}

// ─── Component ───

export default function UpgradePrompt({
  feature,
  currentPlan,
  onUpgrade,
  onDismiss,
  variant = "banner",
}: UpgradePromptProps) {
  const message = getUpgradeMessage(feature);
  const recommended = getRecommendedPlan(feature);

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <span className="text-lg">🔒</span>
        <div className="flex-1">
          <p className="text-sm text-purple-800">{message}</p>
        </div>
        <button
          onClick={onUpgrade}
          className="shrink-0 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
        >
          Upgrade to {recommended === "FAMILY" ? "Family" : "Pro"}
        </button>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center mb-4">
            <span className="text-4xl">🚀</span>
            <h3 className="text-xl font-bold text-gray-900 mt-3">
              Unlock This Feature
            </h3>
            <p className="text-sm text-gray-500 mt-2">{message}</p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={onUpgrade}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              Upgrade to {recommended === "FAMILY" ? "Family" : "Pro"}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Currently on{" "}
            <span className="font-medium text-gray-500">
              {currentPlan === "SPARK" ? "Free" : currentPlan} plan
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h4 className="font-semibold text-sm">Upgrade to unlock more</h4>
            <p className="text-xs text-purple-100 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-white text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-50 transition-colors"
          >
            Upgrade
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-purple-200 hover:text-white p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
