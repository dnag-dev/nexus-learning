"use client";

/**
 * XP Progress Bar — Shows current XP, level, and progress to next level.
 */

import {
  getLevelForXP,
  getXPProgress,
  type LevelInfo,
} from "@/lib/gamification/xp";

interface XPBarProps {
  xp: number;
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "#6B7280",  // gray
  2: "#6B7280",
  3: "#3B82F6",  // blue
  4: "#3B82F6",
  5: "#10B981",  // green
  6: "#10B981",
  7: "#8B5CF6",  // purple
  8: "#8B5CF6",
  9: "#8B5CF6",
  10: "#F59E0B", // amber
  11: "#F59E0B",
  12: "#F59E0B",
  13: "#EF4444", // red
  14: "#EF4444",
  15: "#EC4899", // pink
  16: "#EC4899",
  17: "#F97316", // orange
  18: "#F97316",
  19: "#F97316",
  20: "#FFD700", // gold
};

export default function XPBar({
  xp,
  compact = false,
  showTitle = true,
  className = "",
}: XPBarProps) {
  const levelInfo: LevelInfo = getLevelForXP(xp);
  const progress = getXPProgress(xp);
  const color = LEVEL_COLORS[levelInfo.level] ?? "#F59E0B";
  const xpIntoLevel = xp - levelInfo.xpRequired;
  const xpNeeded = levelInfo.xpForNext - levelInfo.xpRequired;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {levelInfo.level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {xp} XP
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}>
      {/* Level + Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold shadow-sm"
            style={{ backgroundColor: color }}
          >
            {levelInfo.level}
          </span>
          <div>
            {showTitle && (
              <h4 className="font-semibold text-gray-800">
                {levelInfo.title}
              </h4>
            )}
            <p className="text-xs text-gray-500">Level {levelInfo.level}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color }}>
            {xp.toLocaleString()}
          </span>
          <p className="text-xs text-gray-400">Total XP</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}66`,
            }}
          />
        </div>
      </div>

      {/* XP details */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {xpIntoLevel}/{xpNeeded} XP
        </span>
        <span>{progress}% to Level {levelInfo.level + 1}</span>
      </div>
    </div>
  );
}
