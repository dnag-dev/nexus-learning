"use client";

/**
 * Review Due Widget — Shows due count with urgency color and CTA button.
 * Used in the dashboard and constellation sidebar.
 */

interface ReviewDueWidgetProps {
  dueNow: number;
  overdueCount: number;
  estimatedMinutes: number;
  urgency: "none" | "low" | "medium" | "high";
  onStartReview: () => void;
  compact?: boolean;
  className?: string;
}

const URGENCY_STYLES = {
  none: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
    text: "text-gray-600",
    button: "bg-gray-400 hover:bg-gray-500",
  },
  low: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    text: "text-green-700",
    button: "bg-green-500 hover:bg-green-600",
  },
  medium: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  high: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    text: "text-red-700",
    button: "bg-red-500 hover:bg-red-600",
  },
};

export default function ReviewDueWidget({
  dueNow,
  overdueCount,
  estimatedMinutes,
  urgency,
  onStartReview,
  compact = false,
  className = "",
}: ReviewDueWidgetProps) {
  const styles = URGENCY_STYLES[urgency];

  if (dueNow === 0 && !compact) {
    return (
      <div className={`rounded-xl p-4 bg-green-50 border border-green-200 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-medium text-green-700">All caught up!</p>
            <p className="text-xs text-green-600">No reviews due right now.</p>
          </div>
        </div>
      </div>
    );
  }

  if (dueNow === 0) return null;

  if (compact) {
    return (
      <button
        onClick={onStartReview}
        className={`w-full rounded-lg p-3 border ${styles.bg} ${styles.border} ${className} transition-all hover:shadow-sm`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{urgency === "high" ? "🔴" : urgency === "medium" ? "🟡" : "🟢"}</span>
            <span className={`text-sm font-medium ${styles.text}`}>
              {dueNow} review{dueNow > 1 ? "s" : ""} due
            </span>
          </div>
          <span className="text-xs text-gray-500">{estimatedMinutes}m</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`rounded-xl p-4 border ${styles.bg} ${styles.border} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{urgency === "high" ? "🔥" : "📚"}</span>
            <h3 className="text-sm font-semibold text-gray-800">
              {overdueCount > 0
                ? `${overdueCount} overdue review${overdueCount > 1 ? "s" : ""}!`
                : `${dueNow} node${dueNow > 1 ? "s" : ""} due for review`}
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            ~{estimatedMinutes} min · Quick review keeps knowledge fresh
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
          {urgency === "high" ? "Overdue" : urgency === "medium" ? "Due" : "Ready"}
        </span>
      </div>

      <button
        onClick={onStartReview}
        className={`w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${styles.button}`}
      >
        Review Now
      </button>
    </div>
  );
}
