/**
 * Streak System — Phase 7: Gamification
 *
 * Tracks daily learning streaks with freeze protection,
 * milestone rewards, and multiple streak types.
 *
 * Streak Types:
 *  - daily: Consecutive days of learning
 *  - concept: Concepts mastered this week
 *  - perfect: Consecutive perfect sessions (no hints, all correct)
 *  - speed: Sessions completed faster than personal average
 *  - comeback: Returning after a break and succeeding
 */

// ─── Types ───

export type StreakType =
  | "daily"
  | "concept"
  | "perfect"
  | "speed"
  | "comeback";

export interface StreakStatus {
  type: StreakType;
  current: number;
  longest: number;
  lastActiveDate: string; // ISO date string (YYYY-MM-DD)
  isActive: boolean;
  freezesAvailable: number;
  freezesUsed: number;
}

export interface StreakMilestone {
  streakCount: number;
  label: string;
  xpReward: number;
  badgeType: string | null;
}

export interface StreakUpdateResult {
  updated: boolean;
  newCurrent: number;
  newLongest: number;
  milestoneReached: StreakMilestone | null;
  streakBroken: boolean;
  freezeUsed: boolean;
}

// ─── Milestones ───

export const STREAK_MILESTONES: StreakMilestone[] = [
  { streakCount: 3, label: "3-Day Streak!", xpReward: 25, badgeType: null },
  { streakCount: 7, label: "Week Warrior!", xpReward: 75, badgeType: "streak_7" },
  { streakCount: 14, label: "Two-Week Titan!", xpReward: 150, badgeType: "streak_14" },
  { streakCount: 21, label: "Triple Week!", xpReward: 200, badgeType: "streak_21" },
  { streakCount: 30, label: "Monthly Master!", xpReward: 300, badgeType: "streak_30" },
  { streakCount: 50, label: "Fifty Star Explorer!", xpReward: 500, badgeType: "streak_50" },
  { streakCount: 100, label: "Century Legend!", xpReward: 1000, badgeType: "streak_100" },
  { streakCount: 365, label: "Year of Stars!", xpReward: 5000, badgeType: "streak_365" },
];

// ─── Freeze Configuration ───

/** How many freezes a student earns per milestone. */
export const FREEZE_REWARDS: Record<number, number> = {
  7: 1, // Earn 1 freeze at 7-day streak
  14: 1,
  30: 2,
  50: 2,
  100: 3,
};

/** Maximum freezes a student can hold at once. */
export const MAX_FREEZES = 5;

// ─── Core Functions ───

/**
 * Get today's date as a YYYY-MM-DD string.
 */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get a date string for N days ago.
 */
export function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/**
 * Calculate the day difference between two ISO date strings.
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Update a daily streak. Call this when a student completes any learning activity.
 *
 * Logic:
 *  - Same day: no change
 *  - Next day: increment streak
 *  - 2 days gap + freeze available: use freeze, maintain streak
 *  - 2+ days gap, no freeze: break streak (but track comeback potential)
 */
export function updateDailyStreak(
  status: StreakStatus,
  today?: string
): StreakUpdateResult {
  const currentDate = today ?? getToday();
  const gap = daysBetween(status.lastActiveDate, currentDate);

  // Same day — no change
  if (gap === 0) {
    return {
      updated: false,
      newCurrent: status.current,
      newLongest: status.longest,
      milestoneReached: null,
      streakBroken: false,
      freezeUsed: false,
    };
  }

  // Next day — increment
  if (gap === 1) {
    const newCurrent = status.current + 1;
    const newLongest = Math.max(status.longest, newCurrent);
    const milestone = checkMilestone(newCurrent);

    return {
      updated: true,
      newCurrent,
      newLongest,
      milestoneReached: milestone,
      streakBroken: false,
      freezeUsed: false,
    };
  }

  // 2-day gap — try to use a freeze
  if (gap === 2 && status.freezesAvailable > 0) {
    const newCurrent = status.current + 1; // Freeze covers the missed day
    const newLongest = Math.max(status.longest, newCurrent);
    const milestone = checkMilestone(newCurrent);

    return {
      updated: true,
      newCurrent,
      newLongest,
      milestoneReached: milestone,
      streakBroken: false,
      freezeUsed: true,
    };
  }

  // Gap > 1 (or 2 with no freeze) — streak broken, restart
  return {
    updated: true,
    newCurrent: 1, // Start fresh from today
    newLongest: Math.max(status.longest, 1), // At least 1 since they're active today
    milestoneReached: null,
    streakBroken: true,
    freezeUsed: false,
  };
}

/**
 * Update a concept mastery streak.
 * Called when a student masters a concept — tracks weekly mastery count.
 */
export function updateConceptStreak(
  currentWeeklyCount: number,
  weeklyGoal: number = 3
): { newCount: number; goalReached: boolean; xpReward: number } {
  const newCount = currentWeeklyCount + 1;
  const goalReached = newCount >= weeklyGoal;

  return {
    newCount,
    goalReached,
    xpReward: goalReached ? 100 : 0,
  };
}

/**
 * Check if a session qualifies as "perfect" (no hints, all correct).
 */
export function isPerfectSession(
  totalQuestions: number,
  correctAnswers: number,
  hintsUsed: number
): boolean {
  return totalQuestions > 0 && correctAnswers === totalQuestions && hintsUsed === 0;
}

/**
 * Check if a session qualifies as a "speed" streak entry.
 * Speed = completed 30% faster than personal average.
 */
export function isSpeedSession(
  sessionDurationMs: number,
  averageDurationMs: number,
  threshold: number = 0.7
): boolean {
  if (averageDurationMs <= 0) return false;
  return sessionDurationMs <= averageDurationMs * threshold;
}

/**
 * Check if this is a comeback — student was inactive for 3+ days
 * and then got a correct answer on their first question back.
 */
export function isComeback(
  daysSinceLastActive: number,
  firstQuestionCorrect: boolean,
  minDaysAway: number = 3
): boolean {
  return daysSinceLastActive >= minDaysAway && firstQuestionCorrect;
}

// ─── Milestone Check ───

/**
 * Check if the new streak count hits a milestone.
 * Returns the milestone if exactly reached, null otherwise.
 */
export function checkMilestone(streakCount: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.streakCount === streakCount) ?? null;
}

/**
 * Get the next milestone for a given streak count.
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  return (
    STREAK_MILESTONES.find((m) => m.streakCount > currentStreak) ?? null
  );
}

/**
 * Get all milestones reached so far.
 */
export function getReachedMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => m.streakCount <= currentStreak);
}

// ─── Freeze Management ───

/**
 * Calculate freezes earned for a streak milestone.
 */
export function getFreezesEarned(streakCount: number): number {
  return FREEZE_REWARDS[streakCount] ?? 0;
}

/**
 * Apply a streak freeze. Returns updated freeze counts.
 */
export function applyStreakFreeze(
  freezesAvailable: number,
  freezesUsed: number
): { newAvailable: number; newUsed: number; applied: boolean } {
  if (freezesAvailable <= 0) {
    return { newAvailable: 0, newUsed: freezesUsed, applied: false };
  }

  return {
    newAvailable: freezesAvailable - 1,
    newUsed: freezesUsed + 1,
    applied: true,
  };
}

/**
 * Add freezes (e.g., from a milestone reward). Capped at MAX_FREEZES.
 */
export function addFreezes(
  currentFreezes: number,
  toAdd: number
): number {
  return Math.min(MAX_FREEZES, currentFreezes + toAdd);
}

// ─── Streak Display Helpers ───

/**
 * Get a motivational message for the current streak.
 */
export function getStreakMessage(streakCount: number): string {
  if (streakCount === 0) return "Start your streak today!";
  if (streakCount === 1) return "Great start! Keep it going!";
  if (streakCount < 3) return `${streakCount} days strong!`;
  if (streakCount < 7) return `${streakCount} days! Almost a full week!`;
  if (streakCount < 14) return `${streakCount} days! You're on fire! 🔥`;
  if (streakCount < 30) return `${streakCount} days! Incredible dedication!`;
  if (streakCount < 100) return `${streakCount} days! You're a star explorer!`;
  return `${streakCount} days! Legendary!`;
}

/**
 * Get the streak emoji/icon intensity based on streak length.
 */
export function getStreakIntensity(
  streakCount: number
): "none" | "low" | "medium" | "high" | "legendary" {
  if (streakCount === 0) return "none";
  if (streakCount < 3) return "low";
  if (streakCount < 14) return "medium";
  if (streakCount < 50) return "high";
  return "legendary";
}

/**
 * Get progress toward next milestone as a percentage.
 */
export function getStreakProgress(currentStreak: number): number {
  const next = getNextMilestone(currentStreak);
  if (!next) return 100; // Past all milestones

  const prev = getReachedMilestones(currentStreak);
  const prevCount = prev.length > 0 ? prev[prev.length - 1].streakCount : 0;
  const range = next.streakCount - prevCount;
  const progress = currentStreak - prevCount;

  if (range <= 0) return 100;
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Create a default (empty) streak status.
 */
export function createDefaultStreak(type: StreakType = "daily"): StreakStatus {
  return {
    type,
    current: 0,
    longest: 0,
    lastActiveDate: getToday(),
    isActive: false,
    freezesAvailable: 0,
    freezesUsed: 0,
  };
}
