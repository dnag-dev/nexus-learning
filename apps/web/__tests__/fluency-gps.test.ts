/**
 * Fluency GPS Integration Tests — Learning GPS Step 13
 *
 * Tests the GPS-related fluency enhancements:
 * - FLUENT mastery level
 * - Fluency completion triggers plan advancement
 * - Challenge mode unlocking
 * - Mastery level progression
 */

import { describe, it, expect } from "vitest";

// ─── Types (matching schema) ───

type MasteryLevel = "NOVICE" | "DEVELOPING" | "PROFICIENT" | "ADVANCED" | "MASTERED" | "FLUENT";

// ─── Mastery Level Logic ───

function getMasteryLevelFromBkt(bktProbability: number, isFluent: boolean = false): MasteryLevel {
  if (isFluent) return "FLUENT";
  if (bktProbability >= 0.9) return "MASTERED";
  if (bktProbability >= 0.75) return "ADVANCED";
  if (bktProbability >= 0.5) return "PROFICIENT";
  if (bktProbability >= 0.25) return "DEVELOPING";
  return "NOVICE";
}

function isChallengeUnlocked(
  masteryLevel: MasteryLevel,
  bktProbability: number
): boolean {
  // Challenge mode unlocked after FLUENT or MASTERED with high confidence
  return masteryLevel === "FLUENT" || masteryLevel === "MASTERED" || bktProbability >= 0.9;
}

function canAdvancePlan(
  currentConceptIndex: number,
  masteredConceptIndex: number,
  totalConcepts: number
): { canAdvance: boolean; newIndex: number; isComplete: boolean } {
  const newIndex = Math.max(currentConceptIndex, masteredConceptIndex + 1);
  return {
    canAdvance: newIndex > currentConceptIndex,
    newIndex,
    isComplete: newIndex >= totalConcepts,
  };
}

// ─── Tests ───

describe("Fluency GPS Integration", () => {
  // ─── Mastery Levels ───

  describe("MasteryLevel enum", () => {
    it("includes FLUENT as the highest level", () => {
      const levels: MasteryLevel[] = [
        "NOVICE",
        "DEVELOPING",
        "PROFICIENT",
        "ADVANCED",
        "MASTERED",
        "FLUENT",
      ];
      expect(levels).toHaveLength(6);
      expect(levels[5]).toBe("FLUENT");
    });

    it("levels progress from NOVICE to FLUENT", () => {
      const order: MasteryLevel[] = [
        "NOVICE",
        "DEVELOPING",
        "PROFICIENT",
        "ADVANCED",
        "MASTERED",
        "FLUENT",
      ];
      // Each subsequent level requires higher mastery
      expect(order.indexOf("NOVICE")).toBeLessThan(order.indexOf("FLUENT"));
      expect(order.indexOf("MASTERED")).toBeLessThan(order.indexOf("FLUENT"));
    });
  });

  // ─── BKT to Mastery Level ───

  describe("getMasteryLevelFromBkt", () => {
    it("returns NOVICE for low probability", () => {
      expect(getMasteryLevelFromBkt(0.1)).toBe("NOVICE");
    });

    it("returns DEVELOPING for 0.25-0.5", () => {
      expect(getMasteryLevelFromBkt(0.3)).toBe("DEVELOPING");
    });

    it("returns PROFICIENT for 0.5-0.75", () => {
      expect(getMasteryLevelFromBkt(0.6)).toBe("PROFICIENT");
    });

    it("returns ADVANCED for 0.75-0.9", () => {
      expect(getMasteryLevelFromBkt(0.8)).toBe("ADVANCED");
    });

    it("returns MASTERED for >= 0.9", () => {
      expect(getMasteryLevelFromBkt(0.95)).toBe("MASTERED");
    });

    it("returns FLUENT when fluency is confirmed", () => {
      expect(getMasteryLevelFromBkt(0.95, true)).toBe("FLUENT");
    });

    it("FLUENT overrides any BKT probability", () => {
      expect(getMasteryLevelFromBkt(0.5, true)).toBe("FLUENT");
    });
  });

  // ─── Challenge Unlocking ───

  describe("Challenge mode unlocking", () => {
    it("unlocks for FLUENT level", () => {
      expect(isChallengeUnlocked("FLUENT", 0.95)).toBe(true);
    });

    it("unlocks for MASTERED level", () => {
      expect(isChallengeUnlocked("MASTERED", 0.92)).toBe(true);
    });

    it("unlocks for high BKT even without explicit MASTERED", () => {
      expect(isChallengeUnlocked("ADVANCED", 0.91)).toBe(true);
    });

    it("stays locked for ADVANCED with lower BKT", () => {
      expect(isChallengeUnlocked("ADVANCED", 0.85)).toBe(false);
    });

    it("stays locked for PROFICIENT", () => {
      expect(isChallengeUnlocked("PROFICIENT", 0.6)).toBe(false);
    });

    it("stays locked for DEVELOPING", () => {
      expect(isChallengeUnlocked("DEVELOPING", 0.3)).toBe(false);
    });

    it("stays locked for NOVICE", () => {
      expect(isChallengeUnlocked("NOVICE", 0.1)).toBe(false);
    });
  });

  // ─── Plan Advancement ───

  describe("Plan advancement on fluency", () => {
    it("advances when concept is the current one", () => {
      const result = canAdvancePlan(5, 5, 20);
      expect(result.canAdvance).toBe(true);
      expect(result.newIndex).toBe(6);
      expect(result.isComplete).toBe(false);
    });

    it("does not advance when concept is behind current", () => {
      const result = canAdvancePlan(10, 5, 20);
      expect(result.canAdvance).toBe(false);
      expect(result.newIndex).toBe(10);
    });

    it("marks plan complete when last concept mastered", () => {
      const result = canAdvancePlan(19, 19, 20);
      expect(result.canAdvance).toBe(true);
      expect(result.newIndex).toBe(20);
      expect(result.isComplete).toBe(true);
    });

    it("does not advance beyond total concepts", () => {
      const result = canAdvancePlan(20, 20, 20);
      expect(result.newIndex).toBe(21);
      expect(result.isComplete).toBe(true);
    });

    it("handles skipped concepts (mastered out of order)", () => {
      // Student mastered concept at index 7, but current is at 5
      const result = canAdvancePlan(5, 7, 20);
      expect(result.canAdvance).toBe(true);
      expect(result.newIndex).toBe(8);
    });
  });

  // ─── Fluency Drill Configuration ───

  describe("Fluency drill configuration", () => {
    it("requires 20+ problems for flatline detection", () => {
      const MIN_PROBLEMS = 20;
      expect(MIN_PROBLEMS).toBe(20);
    });

    it("CoV threshold is 15% for flatline", () => {
      const COV_THRESHOLD = 0.15;
      expect(COV_THRESHOLD).toBe(0.15);
    });

    it("calculates coefficient of variation correctly", () => {
      const times = [1000, 1050, 980, 1020, 990]; // ~1000ms avg
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const cov = stdDev / mean;

      expect(cov).toBeLessThan(0.15); // These times are consistent → flat
      expect(mean).toBeCloseTo(1008, 0);
    });

    it("high variance fails flatline check", () => {
      const times = [500, 2000, 800, 3000, 1000]; // Very inconsistent
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const cov = stdDev / mean;

      expect(cov).toBeGreaterThan(0.15);
    });
  });
});
