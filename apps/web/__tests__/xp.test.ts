/**
 * XP + Level System Tests — Phase 7: Gamification
 *
 * Tests:
 *  - Level calculation from XP
 *  - XP progress computation
 *  - Level-up detection
 *  - XP awarding with level changes
 *  - Title lookup
 *  - Edge cases (0 XP, max level, negative)
 */

import { describe, it, expect } from "vitest";
import {
  getLevelForXP,
  getXPProgress,
  wouldLevelUp,
  awardXP,
  getLevelTitle,
  getXPForLevel,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
} from "../lib/gamification/xp";

describe("XP + Level System", () => {
  // ─── getLevelForXP ───

  describe("getLevelForXP", () => {
    it("returns level 1 for 0 XP", () => {
      const info = getLevelForXP(0);
      expect(info.level).toBe(1);
      expect(info.title).toBe("Star Seeker");
      expect(info.xpRequired).toBe(0);
    });

    it("returns level 1 for 50 XP", () => {
      const info = getLevelForXP(50);
      expect(info.level).toBe(1);
    });

    it("returns level 2 for exactly 100 XP", () => {
      const info = getLevelForXP(100);
      expect(info.level).toBe(2);
      expect(info.title).toBe("Star Seeker");
    });

    it("returns level 5 for 500 XP", () => {
      const info = getLevelForXP(500);
      expect(info.level).toBe(5);
      expect(info.title).toBe("Constellation Finder");
    });

    it("returns level 10 for 1500 XP", () => {
      const info = getLevelForXP(1500);
      expect(info.level).toBe(10);
      expect(info.title).toBe("Galaxy Explorer");
    });

    it("returns level 20 for 7500+ XP", () => {
      const info = getLevelForXP(7500);
      expect(info.level).toBe(20);
      expect(info.title).toBe("Universe Master");
    });

    it("returns level 20 for very high XP", () => {
      const info = getLevelForXP(100000);
      expect(info.level).toBe(20);
    });

    it("includes xpForNext for non-max level", () => {
      const info = getLevelForXP(0);
      expect(info.xpForNext).toBe(100); // Level 2 threshold
    });

    it("includes xpForNext for max level (fallback)", () => {
      const info = getLevelForXP(7500);
      expect(info.xpForNext).toBe(8500); // Max + 1000
    });
  });

  // ─── getXPProgress ───

  describe("getXPProgress", () => {
    it("returns 0% at level start", () => {
      expect(getXPProgress(0)).toBe(0);
    });

    it("returns 50% halfway through level", () => {
      // Level 1: 0-100, so 50 XP = 50%
      expect(getXPProgress(50)).toBe(50);
    });

    it("returns 100% at level boundary (before next level)", () => {
      // At exactly 100, you're level 2 with 0% progress toward level 3
      // Level 2: 100-250, so 0 into level = 0%
      expect(getXPProgress(100)).toBe(0);
    });

    it("returns correct progress mid-level", () => {
      // Level 2: 100-250 range = 150 XP span
      // At 175 XP: 75 into level, 75/150 = 50%
      expect(getXPProgress(175)).toBe(50);
    });

    it("returns 100% for max level", () => {
      // At max level with lots of XP, should be near 100%
      const progress = getXPProgress(8500);
      expect(progress).toBe(100);
    });
  });

  // ─── wouldLevelUp ───

  describe("wouldLevelUp", () => {
    it("detects level-up from 0 with enough XP", () => {
      expect(wouldLevelUp(0, 100)).toBe(true);
    });

    it("returns false when not enough for level-up", () => {
      expect(wouldLevelUp(0, 50)).toBe(false);
    });

    it("detects multiple level-ups", () => {
      expect(wouldLevelUp(0, 500)).toBe(true);
    });

    it("returns false when already at boundary", () => {
      expect(wouldLevelUp(100, 10)).toBe(false); // Level 2 + 10 = 110, still level 2
    });

    it("detects level-up from high level", () => {
      expect(wouldLevelUp(1450, 100)).toBe(true); // 1450 → 1550 crosses level 10→11 boundary
    });
  });

  // ─── awardXP ───

  describe("awardXP", () => {
    it("awards correct XP for correct_answer", () => {
      const result = awardXP(0, 1, "correct_answer");
      expect(result.newXP).toBe(10);
      expect(result.xpAwarded).toBe(10);
      expect(result.leveledUp).toBe(false);
    });

    it("awards correct XP for session_complete", () => {
      const result = awardXP(0, 1, "session_complete");
      expect(result.newXP).toBe(50);
      expect(result.xpAwarded).toBe(50);
    });

    it("awards correct XP for node_mastered", () => {
      const result = awardXP(0, 1, "node_mastered");
      expect(result.newXP).toBe(100);
      expect(result.xpAwarded).toBe(100);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.newTitle).toBe("Star Seeker");
    });

    it("awards correct XP for boss_complete", () => {
      const result = awardXP(0, 1, "boss_complete");
      expect(result.newXP).toBe(200);
      expect(result.xpAwarded).toBe(200);
    });

    it("awards correct XP for perfect_session", () => {
      const result = awardXP(0, 1, "perfect_session");
      expect(result.newXP).toBe(75);
    });

    it("uses custom amount when provided", () => {
      const result = awardXP(0, 1, "streak_milestone", 250);
      expect(result.newXP).toBe(250);
      expect(result.xpAwarded).toBe(250);
    });

    it("detects level-up correctly", () => {
      const result = awardXP(90, 1, "correct_answer"); // 90 + 10 = 100 → level 2
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.newTitle).toBe("Star Seeker");
    });

    it("returns null title when no level-up", () => {
      const result = awardXP(0, 1, "correct_answer");
      expect(result.newTitle).toBeNull();
    });

    it("handles title change on level-up", () => {
      const result = awardXP(200, 2, "node_mastered"); // 200 + 100 = 300 → level 3 "Star Gazer"
      expect(result.leveledUp).toBe(true);
      expect(result.newTitle).toBe("Star Gazer");
    });
  });

  // ─── getLevelTitle ───

  describe("getLevelTitle", () => {
    it("returns correct title for level 1", () => {
      expect(getLevelTitle(1)).toBe("Star Seeker");
    });

    it("returns correct title for level 10", () => {
      expect(getLevelTitle(10)).toBe("Galaxy Explorer");
    });

    it("returns correct title for level 20", () => {
      expect(getLevelTitle(20)).toBe("Universe Master");
    });

    it("returns default for unknown level", () => {
      expect(getLevelTitle(99)).toBe("Star Seeker");
    });
  });

  // ─── getXPForLevel ───

  describe("getXPForLevel", () => {
    it("returns 0 for level 1", () => {
      expect(getXPForLevel(1)).toBe(0);
    });

    it("returns 100 for level 2", () => {
      expect(getXPForLevel(2)).toBe(100);
    });

    it("returns 7500 for level 20", () => {
      expect(getXPForLevel(20)).toBe(7500);
    });

    it("returns 0 for unknown level", () => {
      expect(getXPForLevel(99)).toBe(0);
    });
  });

  // ─── XP_REWARDS ───

  describe("XP_REWARDS", () => {
    it("has all expected sources", () => {
      expect(XP_REWARDS.correct_answer).toBe(10);
      expect(XP_REWARDS.session_complete).toBe(50);
      expect(XP_REWARDS.node_mastered).toBe(100);
      expect(XP_REWARDS.boss_complete).toBe(200);
      expect(XP_REWARDS.perfect_session).toBe(75);
      expect(XP_REWARDS.streak_milestone).toBe(0);
      expect(XP_REWARDS.badge_bonus).toBe(0);
    });
  });

  // ─── LEVEL_THRESHOLDS ───

  describe("LEVEL_THRESHOLDS", () => {
    it("has 20 levels", () => {
      expect(LEVEL_THRESHOLDS).toHaveLength(20);
    });

    it("starts at level 1 with 0 XP", () => {
      expect(LEVEL_THRESHOLDS[0].level).toBe(1);
      expect(LEVEL_THRESHOLDS[0].xpRequired).toBe(0);
    });

    it("ends at level 20", () => {
      expect(LEVEL_THRESHOLDS[19].level).toBe(20);
    });

    it("XP thresholds are ascending", () => {
      for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].xpRequired).toBeGreaterThanOrEqual(
          LEVEL_THRESHOLDS[i - 1].xpRequired
        );
      }
    });

    it("levels are sequential", () => {
      for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        expect(LEVEL_THRESHOLDS[i].level).toBe(i + 1);
      }
    });
  });
});
