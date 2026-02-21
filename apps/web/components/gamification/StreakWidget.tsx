"use client";

/**
 * Streak Widget — Displays current streak with animation and freeze info.
 */

import {
  getStreakMessage,
  getStreakIntensity,
  getStreakProgress,
  getNextMilestone,
  type StreakStatus,
} from "@/lib/gamification/streak";

interface StreakWidgetProps {
  streak: StreakStatus;
  compact?: boolean;
  className?: string;
}

const INTENSITY_STYLES = {
  none: "bg-gray-100 text-gray-500 border-gray-200",
  low: "bg-orange-50 text-orange-600 border-orange-200",
  medium: "bg-orange-100 text-orange-700 border-orange-300",
  high: "bg-red-50 text-red-600 border-red-300",
  legendary: "bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-yellow-400",
};

const FIRE_SIZES = {
  none: "text-xl",
  low: "text-2xl",
  medium: "text-3xl",
  high: "text-4xl",
  legendary: "text-5xl",
};

export default function StreakWidget({
  streak,
  compact = false,
  className = "",
}: StreakWidgetProps) {
  const intensity = getStreakIntensity(streak.current);
  const message = getStreakMessage(streak.current);
  const progress = getStreakProgress(streak.current);
  const nextMilestone = getNextMilestone(streak.current);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${INTENSITY_STYLES[intensity]} ${className}`}
      >
        <span role="img" aria-label="fire">
          {streak.current > 0 ? "🔥" : "💤"}
        </span>
        <span className="font-semibold text-sm">
          {streak.current > 0 ? `${streak.current} day streak` : "No streak"}
        </span>
        {streak.freezesAvailable > 0 && (
          <span className="text-xs text-blue-500" title={`${streak.freezesAvailable} freezes`}>
            ❄️ {streak.freezesAvailable}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${INTENSITY_STYLES[intensity]} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70">
          Daily Streak
        </h3>
        {streak.freezesAvailable > 0 && (
          <span
            className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full"
            title={`${streak.freezesAvailable} streak freezes available`}
          >
            ❄️ {streak.freezesAvailable} freeze{streak.freezesAvailable > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Big streak number */}
      <div className="flex items-center gap-3 mb-3">
        <span className={FIRE_SIZES[intensity]} role="img" aria-label="fire">
          {streak.current > 0 ? "🔥" : "💤"}
        </span>
        <div>
          <div className="text-3xl font-bold">{streak.current}</div>
          <div className="text-xs opacity-60">
            days {streak.current > 0 ? "in a row" : "— start today!"}
          </div>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm mb-3">{message}</p>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mb-2">
          <div className="flex justify-between text-xs opacity-60 mb-1">
            <span>Next: {nextMilestone.label}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-current rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Longest streak */}
      <div className="text-xs opacity-50 mt-2">
        Longest streak: {streak.longest} day{streak.longest !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
