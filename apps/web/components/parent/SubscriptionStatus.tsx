/**
 * SubscriptionStatus — Phase 10: Billing
 *
 * Displays current subscription plan badge + status.
 * Shows trial info, upgrade prompt, and manage link.
 */

"use client";

// ─── Types ───

export interface SubscriptionStatusData {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
}

export interface SubscriptionStatusProps {
  subscription: SubscriptionStatusData | null;
  onManage: () => void;
  onUpgrade: () => void;
}

// ─── Display Helpers ───

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-600 bg-green-50",
  TRIALING: "text-blue-600 bg-blue-50",
  PAST_DUE: "text-red-600 bg-red-50",
  CANCELED: "text-gray-600 bg-gray-50",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trial",
  PAST_DUE: "Past Due",
  CANCELED: "Canceled",
};

export const PLAN_DISPLAY: Record<string, { name: string; icon: string; color: string }> = {
  SPARK: { name: "Spark", icon: "⚡", color: "bg-gray-100 text-gray-700" },
  PRO: { name: "Pro", icon: "🚀", color: "bg-purple-100 text-purple-700" },
  FAMILY: { name: "Family", icon: "👨‍👩‍👧‍👦", color: "bg-blue-100 text-blue-700" },
  ANNUAL: { name: "Annual Pro", icon: "🏆", color: "bg-amber-100 text-amber-700" },
};

/**
 * Format a date string for display.
 */
export function formatBillingDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get trial countdown message.
 */
export function getTrialMessage(daysRemaining: number | null): string {
  if (daysRemaining === null) return "";
  if (daysRemaining <= 0) return "Trial expired";
  if (daysRemaining === 1) return "Trial ends tomorrow";
  return `${daysRemaining} days left in trial`;
}

// ─── Component ───

export default function SubscriptionStatus({
  subscription,
  onManage,
  onUpgrade,
}: SubscriptionStatusProps) {
  // No subscription = SPARK (free)
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-semibold text-gray-900">Free Plan</h3>
              <p className="text-sm text-gray-500">
                Basic features with limited usage
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  const planInfo = PLAN_DISPLAY[subscription.plan] ?? PLAN_DISPLAY.SPARK;
  const statusColor = STATUS_COLORS[subscription.status] ?? STATUS_COLORS.ACTIVE;
  const statusLabel = STATUS_LABELS[subscription.status] ?? subscription.status;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Plan + Status Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{planInfo.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{planInfo.name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-600 mt-0.5">
                Cancels on {formatBillingDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {subscription.plan === "SPARK" ? (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Upgrade
            </button>
          ) : (
            <button
              onClick={onManage}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Trial Banner */}
      {subscription.isTrialing && subscription.trialDaysRemaining !== null && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">🎉</span>
              <span className="text-sm text-blue-700 font-medium">
                {getTrialMessage(subscription.trialDaysRemaining)}
              </span>
            </div>
            {subscription.trialDaysRemaining <= 3 && (
              <button
                onClick={onUpgrade}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Subscribe now
              </button>
            )}
          </div>
          {/* Trial Progress */}
          <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${Math.max(0, ((14 - (subscription.trialDaysRemaining ?? 0)) / 14) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Period Info */}
      {subscription.plan !== "SPARK" && !subscription.cancelAtPeriodEnd && (
        <div className="text-sm text-gray-500">
          {subscription.status === "PAST_DUE" ? (
            <span className="text-red-600">
              Payment failed. Please update your payment method.
            </span>
          ) : (
            <span>
              Next billing: {formatBillingDate(subscription.currentPeriodEnd)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
