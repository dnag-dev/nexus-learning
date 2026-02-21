/**
 * Badge System Tests — Phase 7: Gamification
 *
 * Tests:
 *  - Badge definitions and lookups
 *  - Mastery badge checks
 *  - Session badge checks
 *  - Boss badge checks
 *  - Time-of-day badges
 *  - Streak badges
 *  - Display helpers (colors, sorting, progress)
 */

import { describe, it, expect } from "vitest";
import {
  BADGE_DEFINITIONS,
  getBadgeById,
  getBadgesByCategory,
  getBadgesByRarity,
  checkMasteryBadges,
  checkSessionBadges,
  checkBossBadges,
  checkTimeOfDayBadge,
  checkStreakBadge,
  getRarityColor,
  getRarityBg,
  getRarityBorder,
  sortByRarity,
  getBadgeProgress,
} from "../lib/gamification/badges";

describe("Badge System", () => {
  // ─── Badge Definitions ───

  describe("BADGE_DEFINITIONS", () => {
    it("has at least 30 badges", () => {
      expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(30);
    });

    it("all have unique IDs", () => {
      const ids = BADGE_DEFINITIONS.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("all have required fields", () => {
      for (const badge of BADGE_DEFINITIONS) {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.category).toBeTruthy();
        expect(badge.rarity).toBeTruthy();
        expect(badge.icon).toBeTruthy();
        expect(badge.xpReward).toBeGreaterThanOrEqual(0);
        expect(badge.condition).toBeTruthy();
      }
    });

    it("has badges in all categories", () => {
      const categories = new Set(BADGE_DEFINITIONS.map((b) => b.category));
      expect(categories.has("MASTERY")).toBe(true);
      expect(categories.has("STREAK")).toBe(true);
      expect(categories.has("SPEED")).toBe(true);
      expect(categories.has("EMOTIONAL")).toBe(true);
      expect(categories.has("BOSS")).toBe(true);
      expect(categories.has("EXPLORER")).toBe(true);
    });
  });

  // ─── Badge Lookup ───

  describe("getBadgeById", () => {
    it("returns badge for valid ID", () => {
      const badge = getBadgeById("first_star");
      expect(badge).toBeDefined();
      expect(badge!.name).toBe("First Star");
    });

    it("returns undefined for invalid ID", () => {
      expect(getBadgeById("nonexistent")).toBeUndefined();
    });
  });

  describe("getBadgesByCategory", () => {
    it("returns only badges in category", () => {
      const mastery = getBadgesByCategory("MASTERY");
      expect(mastery.length).toBeGreaterThan(0);
      expect(mastery.every((b) => b.category === "MASTERY")).toBe(true);
    });

    it("returns empty for category with no badges", () => {
      const social = getBadgesByCategory("SOCIAL");
      expect(social).toHaveLength(0);
    });
  });

  describe("getBadgesByRarity", () => {
    it("returns only badges of given rarity", () => {
      const common = getBadgesByRarity("common");
      expect(common.length).toBeGreaterThan(0);
      expect(common.every((b) => b.rarity === "common")).toBe(true);
    });

    it("returns legendary badges", () => {
      const legendary = getBadgesByRarity("legendary");
      expect(legendary.length).toBeGreaterThan(0);
    });
  });

  // ─── Mastery Badge Checks ───

  describe("checkMasteryBadges", () => {
    it("awards first_star for 1 mastered concept", () => {
      const results = checkMasteryBadges(1, new Set());
      expect(results.length).toBe(1);
      expect(results[0].badgeId).toBe("first_star");
    });

    it("awards multiple badges for 10 mastered", () => {
      const results = checkMasteryBadges(10, new Set());
      expect(results.length).toBe(3); // first_star, five_stars, ten_stars
    });

    it("skips already-earned badges", () => {
      const earned = new Set(["first_star", "five_stars"]);
      const results = checkMasteryBadges(10, earned);
      expect(results.length).toBe(1);
      expect(results[0].badgeId).toBe("ten_stars");
    });

    it("returns empty when all earned", () => {
      const earned = new Set(["first_star", "five_stars", "ten_stars"]);
      const results = checkMasteryBadges(10, earned);
      expect(results).toHaveLength(0);
    });

    it("returns empty when not enough mastered", () => {
      const results = checkMasteryBadges(0, new Set());
      expect(results).toHaveLength(0);
    });
  });

  // ─── Session Badge Checks ───

  describe("checkSessionBadges", () => {
    it("awards first_session for 1 session", () => {
      const results = checkSessionBadges(1, new Set());
      expect(results.length).toBe(1);
      expect(results[0].badgeId).toBe("first_session");
    });

    it("awards ten_sessions for 10 sessions", () => {
      const results = checkSessionBadges(10, new Set());
      const ids = results.map((r) => r.badgeId);
      expect(ids).toContain("first_session");
      expect(ids).toContain("ten_sessions");
    });

    it("skips already-earned session badges", () => {
      const results = checkSessionBadges(10, new Set(["first_session"]));
      expect(results.length).toBe(1);
      expect(results[0].badgeId).toBe("ten_sessions");
    });
  });

  // ─── Boss Badge Checks ───

  describe("checkBossBadges", () => {
    it("awards boss_first_win for first win", () => {
      const results = checkBossBadges(1, 0.8, null, null, new Set());
      const ids = results.map((r) => r.badgeId);
      expect(ids).toContain("boss_first_win");
    });

    it("awards boss_perfect for 100% score", () => {
      const results = checkBossBadges(1, 1.0, null, null, new Set());
      const ids = results.map((r) => r.badgeId);
      expect(ids).toContain("boss_perfect");
    });

    it("awards boss_speed for fast completion", () => {
      const results = checkBossBadges(1, 0.8, 300000, 900000, new Set());
      const ids = results.map((r) => r.badgeId);
      expect(ids).toContain("boss_speed");
    });

    it("awards boss_five_wins for 5 wins", () => {
      const results = checkBossBadges(5, 0.8, null, null, new Set());
      const ids = results.map((r) => r.badgeId);
      expect(ids).toContain("boss_five_wins");
    });

    it("skips already-earned boss badges", () => {
      const earned = new Set(["boss_first_win"]);
      const results = checkBossBadges(1, 0.8, null, null, earned);
      expect(results.every((r) => r.badgeId !== "boss_first_win")).toBe(true);
    });
  });

  // ─── Time of Day Badges ───

  describe("checkTimeOfDayBadge", () => {
    it("awards early_bird before 8 AM", () => {
      const result = checkTimeOfDayBadge(6, new Set());
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe("early_bird");
    });

    it("awards night_owl after 8 PM", () => {
      const result = checkTimeOfDayBadge(21, new Set());
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe("night_owl");
    });

    it("returns null during normal hours", () => {
      expect(checkTimeOfDayBadge(12, new Set())).toBeNull();
    });

    it("skips already earned", () => {
      expect(checkTimeOfDayBadge(6, new Set(["early_bird"]))).toBeNull();
    });
  });

  // ─── Streak Badge Checks ───

  describe("checkStreakBadge", () => {
    it("returns badge for valid streak badge type", () => {
      const result = checkStreakBadge("streak_7", new Set());
      expect(result).not.toBeNull();
      expect(result!.badgeId).toBe("streak_7");
    });

    it("returns null for already earned", () => {
      expect(checkStreakBadge("streak_7", new Set(["streak_7"]))).toBeNull();
    });

    it("returns null for null badge type", () => {
      expect(checkStreakBadge(null, new Set())).toBeNull();
    });
  });

  // ─── Display Helpers ───

  describe("display helpers", () => {
    it("getRarityColor returns valid class strings", () => {
      expect(getRarityColor("common")).toContain("text-");
      expect(getRarityColor("legendary")).toContain("text-");
    });

    it("getRarityBg returns valid class strings", () => {
      expect(getRarityBg("common")).toContain("bg-");
      expect(getRarityBg("epic")).toContain("bg-");
    });

    it("getRarityBorder returns valid class strings", () => {
      expect(getRarityBorder("common")).toContain("border-");
      expect(getRarityBorder("rare")).toContain("border-");
    });

    it("sortByRarity puts legendary first", () => {
      const badges = [
        getBadgeById("first_star")!, // common
        getBadgeById("streak_100")!, // legendary
        getBadgeById("ten_stars")!, // uncommon
      ];
      const sorted = sortByRarity(badges);
      expect(sorted[0].rarity).toBe("legendary");
      expect(sorted[sorted.length - 1].rarity).toBe("common");
    });

    it("getBadgeProgress returns correct counts", () => {
      const earned = new Set(["first_star", "first_session"]);
      const progress = getBadgeProgress(earned);
      expect(progress.earned).toBe(2);
      expect(progress.total).toBe(BADGE_DEFINITIONS.length);
      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.percentage).toBeLessThan(100);
    });

    it("getBadgeProgress returns 0% for empty set", () => {
      const progress = getBadgeProgress(new Set());
      expect(progress.earned).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });
});
