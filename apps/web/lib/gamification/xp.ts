/**
 * XP + Level System — Phase 7: Gamification
 *
 * Experience points and student level progression.
 * XP is awarded for various learning activities.
 * Levels unlock titles and cosmetic rewards.
 */

// ─── Types ───

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpForNext: number;
}

export interface XPAward {
  amount: number;
  reason: string;
  source: XPSource;
}

export type XPSource =
  | "correct_answer"
  | "session_complete"
  | "node_mastered"
  | "boss_complete"
  | "perfect_session"
  | "streak_milestone"
  | "badge_bonus";

// ─── XP Reward Amounts ───

export const XP_REWARDS: Record<XPSource, number> = {
  correct_answer: 10,
  session_complete: 50,
  node_mastered: 100,
  boss_complete: 200,
  perfect_session: 75,
  streak_milestone: 0, // Variable — set by streak system
  badge_bonus: 0, // Variable — set by badge system
};

// ─── Level Thresholds ───

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, title: "Star Seeker" },
  { level: 2, xpRequired: 100, title: "Star Seeker" },
  { level: 3, xpRequired: 250, title: "Star Gazer" },
  { level: 4, xpRequired: 400, title: "Star Gazer" },
  { level: 5, xpRequired: 500, title: "Constellation Finder" },
  { level: 6, xpRequired: 700, title: "Constellation Finder" },
  { level: 7, xpRequired: 900, title: "Orbit Runner" },
  { level: 8, xpRequired: 1100, title: "Orbit Runner" },
  { level: 9, xpRequired: 1300, title: "Orbit Runner" },
  { level: 10, xpRequired: 1500, title: "Galaxy Explorer" },
  { level: 11, xpRequired: 1900, title: "Galaxy Explorer" },
  { level: 12, xpRequired: 2300, title: "Galaxy Explorer" },
  { level: 13, xpRequired: 2700, title: "Nebula Navigator" },
  { level: 14, xpRequired: 3100, title: "Nebula Navigator" },
  { level: 15, xpRequired: 3500, title: "Cosmic Navigator" },
  { level: 16, xpRequired: 4200, title: "Cosmic Navigator" },
  { level: 17, xpRequired: 5000, title: "Solar Sage" },
  { level: 18, xpRequired: 5800, title: "Solar Sage" },
  { level: 19, xpRequired: 6600, title: "Solar Sage" },
  { level: 20, xpRequired: 7500, title: "Universe Master" },
];

// ─── Core Functions ───

/**
 * Get the level info for a given XP amount.
 */
export function getLevelForXP(xp: number): LevelInfo {
  let currentLevel = LEVEL_THRESHOLDS[0];

  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      currentLevel = threshold;
    } else {
      break;
    }
  }

  // Find XP needed for next level
  const nextIndex = LEVEL_THRESHOLDS.findIndex(
    (t) => t.level === currentLevel.level + 1
  );
  const xpForNext =
    nextIndex >= 0
      ? LEVEL_THRESHOLDS[nextIndex].xpRequired
      : currentLevel.xpRequired + 1000; // Max level

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpRequired: currentLevel.xpRequired,
    xpForNext,
  };
}

/**
 * Calculate XP progress as a percentage toward next level.
 */
export function getXPProgress(xp: number): number {
  const levelInfo = getLevelForXP(xp);
  const xpIntoLevel = xp - levelInfo.xpRequired;
  const xpNeeded = levelInfo.xpForNext - levelInfo.xpRequired;
  if (xpNeeded <= 0) return 100;
  return Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
}

/**
 * Check if adding XP would cause a level-up.
 */
export function wouldLevelUp(currentXP: number, xpToAdd: number): boolean {
  const currentLevel = getLevelForXP(currentXP);
  const newLevel = getLevelForXP(currentXP + xpToAdd);
  return newLevel.level > currentLevel.level;
}

/**
 * Award XP and return the result including any level changes.
 */
export function awardXP(
  currentXP: number,
  currentLevel: number,
  source: XPSource,
  customAmount?: number
): {
  newXP: number;
  newLevel: number;
  xpAwarded: number;
  leveledUp: boolean;
  newTitle: string | null;
} {
  const amount = customAmount ?? XP_REWARDS[source];
  const newXP = currentXP + amount;
  const newLevelInfo = getLevelForXP(newXP);
  const leveledUp = newLevelInfo.level > currentLevel;

  return {
    newXP,
    newLevel: newLevelInfo.level,
    xpAwarded: amount,
    leveledUp,
    newTitle: leveledUp ? newLevelInfo.title : null,
  };
}

/**
 * Get the title for a specific level.
 */
export function getLevelTitle(level: number): string {
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  return threshold?.title ?? "Star Seeker";
}

/**
 * Get total XP needed for a specific level.
 */
export function getXPForLevel(level: number): number {
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  return threshold?.xpRequired ?? 0;
}
