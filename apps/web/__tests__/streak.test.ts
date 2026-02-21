/**
 * Streak System Tests — Phase 7: Gamification
 *
 * Tests:
 *  - Daily streak updates (same day, next day, gap, freeze)
 *  - Concept streak tracking
 *  - Perfect session detection
 *  - Speed session detection
 *  - Comeback detection
 *  - Milestone checks
 *  - Freeze management
 *  - Display helpers
 */

import { describe, it, expect } from "vitest";
import {
  updateDailyStreak,
  updateConceptStreak,
  isPerfectSession,
  isSpeedSession,
  isComeback,
  checkMilestone,
  getNextMilestone,
  getReachedMilestones,
  getFreezesEarned,
  applyStreakFreeze,
  addFreezes,
  getStreakMessage,
  getStreakIntensity,
  getStreakProgress,
  createDefaultStreak,
  daysBetween,
  STREAK_MILESTONES,
  MAX_FREEZES,
  type StreakStatus,
} from "../lib/gamification/streak";

// ─── Helper ───

function makeStreak(overrides: Partial<StreakStatus> = {}): StreakStatus {
  return {
    type: "daily",
    current: 5,
    longest: 10,
    lastActiveDate: "2024-01-10",
    isActive: true,
    freezesAvailable: 1,
    freezesUsed: 0,
    ...overrides,
  };
}

// ─── Tests ───

describe("Streak System", () => {
  // ─── updateDailyStreak ───

  describe("updateDailyStreak", () => {
    it("does nothing on same day", () => {
      const status = makeStreak({ lastActiveDate: "2024-01-10" });
      const result = updateDailyStreak(status, "2024-01-10");
      expect(result.updated).toBe(false);
      expect(result.newCurrent).toBe(5);
      expect(result.streakBroken).toBe(false);
      expect(result.freezeUsed).toBe(false);
    });

    it("increments streak on next day", () => {
      const status = makeStreak({ current: 5, lastActiveDate: "2024-01-10" });
      const result = updateDailyStreak(status, "2024-01-11");
      expect(result.updated).toBe(true);
      expect(result.newCurrent).toBe(6);
      expect(result.streakBroken).toBe(false);
    });

    it("updates longest streak when current exceeds it", () => {
      const status = makeStreak({ current: 10, longest: 10, lastActiveDate: "2024-01-10" });
      const result = updateDailyStreak(status, "2024-01-11");
      expect(result.newLongest).toBe(11);
    });

    it("uses freeze for 2-day gap", () => {
      const status = makeStreak({
        current: 5,
        lastActiveDate: "2024-01-10",
        freezesAvailable: 2,
      });
      const result = updateDailyStreak(status, "2024-01-12");
      expect(result.updated).toBe(true);
      expect(result.newCurrent).toBe(6); // Streak maintained
      expect(result.freezeUsed).toBe(true);
      expect(result.streakBroken).toBe(false);
    });

    it("breaks streak for 2-day gap without freeze", () => {
      const status = makeStreak({
        current: 5,
        lastActiveDate: "2024-01-10",
        freezesAvailable: 0,
      });
      const result = updateDailyStreak(status, "2024-01-12");
      expect(result.updated).toBe(true);
      expect(result.newCurrent).toBe(1); // Reset
      expect(result.streakBroken).toBe(true);
    });

    it("breaks streak for 3+ day gap", () => {
      const status = makeStreak({
        current: 20,
        longest: 20,
        lastActiveDate: "2024-01-10",
        freezesAvailable: 3,
      });
      const result = updateDailyStreak(status, "2024-01-15");
      expect(result.newCurrent).toBe(1);
      expect(result.streakBroken).toBe(true);
      expect(result.newLongest).toBe(20); // Preserved
    });

    it("detects milestone on streak increment", () => {
      const status = makeStreak({ current: 6, lastActiveDate: "2024-01-10" });
      const result = updateDailyStreak(status, "2024-01-11");
      expect(result.newCurrent).toBe(7);
      expect(result.milestoneReached).not.toBeNull();
      expect(result.milestoneReached!.label).toBe("Week Warrior!");
    });

    it("returns null milestone for non-milestone counts", () => {
      const status = makeStreak({ current: 4, lastActiveDate: "2024-01-10" });
      const result = updateDailyStreak(status, "2024-01-11");
      expect(result.milestoneReached).toBeNull();
    });
  });

  // ─── updateConceptStreak ───

  describe("updateConceptStreak", () => {
    it("increments count", () => {
      const result = updateConceptStreak(2, 3);
      expect(result.newCount).toBe(3);
    });

    it("detects goal reached", () => {
      const result = updateConceptStreak(2, 3);
      expect(result.goalReached).toBe(true);
      expect(result.xpReward).toBe(100);
    });

    it("returns no reward when goal not reached", () => {
      const result = updateConceptStreak(1, 3);
      expect(result.goalReached).toBe(false);
      expect(result.xpReward).toBe(0);
    });

    it("exceeds goal", () => {
      const result = updateConceptStreak(5, 3);
      expect(result.goalReached).toBe(true);
    });
  });

  // ─── isPerfectSession ───

  describe("isPerfectSession", () => {
    it("returns true for all correct, no hints", () => {
      expect(isPerfectSession(10, 10, 0)).toBe(true);
    });

    it("returns false if any wrong", () => {
      expect(isPerfectSession(10, 9, 0)).toBe(false);
    });

    it("returns false if hints used", () => {
      expect(isPerfectSession(10, 10, 1)).toBe(false);
    });

    it("returns false for empty session", () => {
      expect(isPerfectSession(0, 0, 0)).toBe(false);
    });
  });

  // ─── isSpeedSession ───

  describe("isSpeedSession", () => {
    it("returns true when 30% faster than average", () => {
      expect(isSpeedSession(600, 1000)).toBe(true); // 60% of average
    });

    it("returns false when slower than threshold", () => {
      expect(isSpeedSession(800, 1000)).toBe(false); // 80% of average
    });

    it("returns true at exactly threshold", () => {
      expect(isSpeedSession(700, 1000)).toBe(true); // 70% = exactly threshold
    });

    it("returns false for zero average", () => {
      expect(isSpeedSession(500, 0)).toBe(false);
    });

    it("supports custom threshold", () => {
      expect(isSpeedSession(500, 1000, 0.6)).toBe(true); // 50% < 60% threshold
    });
  });

  // ─── isComeback ───

  describe("isComeback", () => {
    it("returns true for 3+ days away with correct first answer", () => {
      expect(isComeback(3, true)).toBe(true);
    });

    it("returns false for short absence", () => {
      expect(isComeback(2, true)).toBe(false);
    });

    it("returns false if first answer wrong", () => {
      expect(isComeback(5, false)).toBe(false);
    });

    it("supports custom minimum days", () => {
      expect(isComeback(5, true, 7)).toBe(false);
      expect(isComeback(7, true, 7)).toBe(true);
    });
  });

  // ─── checkMilestone ───

  describe("checkMilestone", () => {
    it("returns milestone for exact match", () => {
      const m = checkMilestone(7);
      expect(m).not.toBeNull();
      expect(m!.label).toBe("Week Warrior!");
      expect(m!.xpReward).toBe(75);
    });

    it("returns null for non-milestone count", () => {
      expect(checkMilestone(8)).toBeNull();
    });

    it("returns milestone for 30-day streak", () => {
      const m = checkMilestone(30);
      expect(m!.label).toBe("Monthly Master!");
    });
  });

  // ─── getNextMilestone ───

  describe("getNextMilestone", () => {
    it("returns first milestone for 0 streak", () => {
      const m = getNextMilestone(0);
      expect(m!.streakCount).toBe(3);
    });

    it("returns next milestone after current", () => {
      const m = getNextMilestone(7);
      expect(m!.streakCount).toBe(14);
    });

    it("returns null past all milestones", () => {
      expect(getNextMilestone(400)).toBeNull();
    });
  });

  // ─── getReachedMilestones ───

  describe("getReachedMilestones", () => {
    it("returns empty for 0 streak", () => {
      expect(getReachedMilestones(0)).toHaveLength(0);
    });

    it("returns milestones up to current streak", () => {
      const reached = getReachedMilestones(15);
      expect(reached).toHaveLength(3); // 3, 7, 14
    });
  });

  // ─── Freeze Management ───

  describe("freeze management", () => {
    it("getFreezesEarned returns correct freeze for milestone", () => {
      expect(getFreezesEarned(7)).toBe(1);
      expect(getFreezesEarned(30)).toBe(2);
      expect(getFreezesEarned(100)).toBe(3);
    });

    it("getFreezesEarned returns 0 for non-milestone", () => {
      expect(getFreezesEarned(5)).toBe(0);
    });

    it("applyStreakFreeze decrements available", () => {
      const result = applyStreakFreeze(2, 0);
      expect(result.newAvailable).toBe(1);
      expect(result.newUsed).toBe(1);
      expect(result.applied).toBe(true);
    });

    it("applyStreakFreeze fails with 0 available", () => {
      const result = applyStreakFreeze(0, 3);
      expect(result.applied).toBe(false);
      expect(result.newAvailable).toBe(0);
      expect(result.newUsed).toBe(3);
    });

    it("addFreezes caps at MAX_FREEZES", () => {
      expect(addFreezes(4, 3)).toBe(MAX_FREEZES);
    });

    it("addFreezes adds normally under cap", () => {
      expect(addFreezes(1, 2)).toBe(3);
    });
  });

  // ─── Display Helpers ───

  describe("display helpers", () => {
    it("getStreakMessage returns appropriate messages", () => {
      expect(getStreakMessage(0)).toContain("Start");
      expect(getStreakMessage(1)).toContain("start");
      expect(getStreakMessage(5)).toContain("week");
      expect(getStreakMessage(10)).toContain("fire");
      expect(getStreakMessage(20)).toContain("dedication");
      expect(getStreakMessage(60)).toContain("explorer");
      expect(getStreakMessage(150)).toContain("Legendary");
    });

    it("getStreakIntensity returns correct levels", () => {
      expect(getStreakIntensity(0)).toBe("none");
      expect(getStreakIntensity(1)).toBe("low");
      expect(getStreakIntensity(5)).toBe("medium");
      expect(getStreakIntensity(20)).toBe("high");
      expect(getStreakIntensity(60)).toBe("legendary");
    });

    it("getStreakProgress returns percentage toward next milestone", () => {
      const progress = getStreakProgress(5);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it("getStreakProgress returns 100 past all milestones", () => {
      expect(getStreakProgress(500)).toBe(100);
    });
  });

  // ─── createDefaultStreak ───

  describe("createDefaultStreak", () => {
    it("creates streak with zero values", () => {
      const streak = createDefaultStreak();
      expect(streak.type).toBe("daily");
      expect(streak.current).toBe(0);
      expect(streak.longest).toBe(0);
      expect(streak.isActive).toBe(false);
      expect(streak.freezesAvailable).toBe(0);
    });

    it("accepts custom type", () => {
      expect(createDefaultStreak("concept").type).toBe("concept");
    });
  });

  // ─── daysBetween ───

  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2024-01-10", "2024-01-10")).toBe(0);
    });

    it("returns 1 for adjacent days", () => {
      expect(daysBetween("2024-01-10", "2024-01-11")).toBe(1);
    });

    it("handles order independence", () => {
      expect(daysBetween("2024-01-15", "2024-01-10")).toBe(5);
    });
  });

  // ─── STREAK_MILESTONES ───

  describe("STREAK_MILESTONES", () => {
    it("has ascending streak counts", () => {
      for (let i = 1; i < STREAK_MILESTONES.length; i++) {
        expect(STREAK_MILESTONES[i].streakCount).toBeGreaterThan(
          STREAK_MILESTONES[i - 1].streakCount
        );
      }
    });

    it("all have positive XP rewards", () => {
      for (const m of STREAK_MILESTONES) {
        expect(m.xpReward).toBeGreaterThan(0);
      }
    });

    it("all have labels", () => {
      for (const m of STREAK_MILESTONES) {
        expect(m.label.length).toBeGreaterThan(0);
      }
    });
  });
});
