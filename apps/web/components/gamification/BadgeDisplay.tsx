"use client";

/**
 * Badge Display — Shows earned and locked badges in a grid.
 */

import {
  BADGE_DEFINITIONS,
  getBadgeById,
  getRarityColor,
  getRarityBg,
  getRarityBorder,
  sortByRarity,
  getBadgeProgress,
  type BadgeDefinition,
  type BadgeCategory,
} from "@/lib/gamification/badges";
import { useState } from "react";

// ─── Types ───

interface BadgeDisplayProps {
  earnedBadgeIds: string[];
  showLocked?: boolean;
  filterCategory?: BadgeCategory | null;
  compact?: boolean;
  className?: string;
}

// ─── Category Labels ───

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  MASTERY: "Mastery",
  STREAK: "Streaks",
  SPEED: "Speed",
  EMOTIONAL: "Resilience",
  BOSS: "Boss",
  EXPLORER: "Explorer",
  SOCIAL: "Social",
};

const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  MASTERY: "⭐",
  STREAK: "🔥",
  SPEED: "⚡",
  EMOTIONAL: "💪",
  BOSS: "🐉",
  EXPLORER: "🧭",
  SOCIAL: "🤝",
};

// ─── Component ───

export default function BadgeDisplay({
  earnedBadgeIds,
  showLocked = true,
  filterCategory = null,
  compact = false,
  className = "",
}: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | null>(
    filterCategory
  );

  const earnedSet = new Set(earnedBadgeIds);
  const { total, earned, percentage } = getBadgeProgress(earnedSet);

  // Filter badges
  let displayBadges = activeCategory
    ? BADGE_DEFINITIONS.filter((b) => b.category === activeCategory)
    : BADGE_DEFINITIONS;

  if (!showLocked) {
    displayBadges = displayBadges.filter((b) => earnedSet.has(b.id));
  }

  displayBadges = sortByRarity(displayBadges);

  // Category list
  const categories: BadgeCategory[] = [
    "MASTERY",
    "STREAK",
    "SPEED",
    "EMOTIONAL",
    "BOSS",
    "EXPLORER",
  ];

  return (
    <div className={className}>
      {/* Progress header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
            Badges
          </h3>
          <span className="text-sm text-gray-500">
            {earned}/{total} ({percentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Category tabs */}
      {!compact && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Badge grid */}
      <div
        className={`grid gap-3 ${
          compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
        }`}
      >
        {displayBadges.map((badge) => {
          const isEarned = earnedSet.has(badge.id);
          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                ${
                  isEarned
                    ? `${getRarityBg(badge.rarity)} ${getRarityBorder(badge.rarity)} hover:scale-105`
                    : "bg-gray-50 border-gray-200 opacity-40 hover:opacity-60"
                }
              `}
              title={badge.name}
            >
              <span className={compact ? "text-2xl" : "text-3xl"}>
                {isEarned ? badge.icon : "🔒"}
              </span>
              {!compact && (
                <span
                  className={`mt-1 text-xs text-center font-medium ${
                    isEarned ? getRarityColor(badge.rarity) : "text-gray-400"
                  }`}
                >
                  {badge.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className={`w-80 rounded-2xl border-2 p-6 shadow-xl ${
              earnedSet.has(selectedBadge.id)
                ? `bg-white ${getRarityBorder(selectedBadge.rarity)}`
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-center">
              <span className="text-5xl mb-3 block">
                {earnedSet.has(selectedBadge.id) ? selectedBadge.icon : "🔒"}
              </span>
              <h4
                className={`text-lg font-bold ${
                  earnedSet.has(selectedBadge.id)
                    ? getRarityColor(selectedBadge.rarity)
                    : "text-gray-400"
                }`}
              >
                {selectedBadge.name}
              </h4>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {selectedBadge.rarity} • {CATEGORY_LABELS[selectedBadge.category]}
              </p>
              <p className="text-sm text-gray-600 mt-3">
                {selectedBadge.description}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {selectedBadge.condition}
              </p>
              {earnedSet.has(selectedBadge.id) && (
                <p className="text-xs text-amber-500 mt-2">
                  +{selectedBadge.xpReward} XP earned
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-4 w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
