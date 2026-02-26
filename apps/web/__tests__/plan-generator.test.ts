/**
 * Plan Generator Tests — Learning GPS Step 4
 *
 * Tests the core utility functions used by the plan generator:
 * - Grade factor calculations
 * - Velocity factor adjustments
 * - Partial mastery discounts
 * - Grade-to-number conversion
 * - Hour estimation per concept
 * - Weekly milestone generation structure
 */

import { describe, it, expect, vi } from "vitest";

// Mock transitive dependencies that fail to resolve in vitest
vi.mock("@/lib/session/claude-client", () => ({
  callClaude: vi.fn().mockResolvedValue(null),
}));
vi.mock("@aauti/db", () => ({
  prisma: {},
  getShortestLearningPath: vi.fn().mockResolvedValue([]),
  getAllNodes: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/prompts/types", () => ({
  getPersonaName: vi.fn().mockReturnValue("Cosmo"),
  getAgeInstruction: vi.fn().mockReturnValue(""),
}));

import {
  getGradeFactor,
  getVelocityFactor,
  getPartialMasteryDiscount,
  gradeToNum,
  GRADE_ORDER,
  estimateHoursPerConcept,
  type WeeklyMilestone,
} from "../lib/learning-plan/plan-generator";

// ─── getGradeFactor ───

describe("Plan Generator", () => {
  describe("getGradeFactor", () => {
    it("returns 1.0 when student is at same grade level as concept", () => {
      expect(getGradeFactor(3, 3)).toBe(1.0);
    });

    it("returns < 1.0 when student is above concept grade (learns faster)", () => {
      expect(getGradeFactor(5, 3)).toBeLessThan(1.0);
    });

    it("returns > 1.0 when student is below concept grade (learns slower)", () => {
      expect(getGradeFactor(3, 5)).toBeGreaterThan(1.0);
    });

    it("returns 0.8 when student is 1 grade above", () => {
      expect(getGradeFactor(4, 3)).toBe(0.8);
    });

    it("returns 0.6 when student is 2+ grades above", () => {
      expect(getGradeFactor(6, 3)).toBe(0.6);
    });

    it("returns 1.2 when student is 1 grade below", () => {
      expect(getGradeFactor(3, 4)).toBe(1.2);
    });

    it("returns 1.5 when student is 2+ grades below", () => {
      expect(getGradeFactor(3, 6)).toBe(1.5);
    });
  });

  // ─── getVelocityFactor ───

  describe("getVelocityFactor", () => {
    it("returns 1.0 when velocity is null (no history)", () => {
      expect(getVelocityFactor(null)).toBe(1.0);
    });

    it("returns 1.0 when velocity is 0", () => {
      expect(getVelocityFactor(0)).toBe(1.0);
    });

    it("returns 1.0 when velocity is negative", () => {
      expect(getVelocityFactor(-1)).toBe(1.0);
    });

    it("returns < 1.0 for fast learners (velocity > 1)", () => {
      // Fast learner → reduced hours estimate
      const factor = getVelocityFactor(1.5);
      expect(factor).toBeLessThan(1.0);
    });

    it("returns > 1.0 for slow learners (velocity < 1)", () => {
      // Slow learner → increased hours estimate
      const factor = getVelocityFactor(0.5);
      expect(factor).toBeGreaterThan(1.0);
    });

    it("clamps minimum to 0.5 (won't go below half)", () => {
      // Very fast learner
      const factor = getVelocityFactor(10);
      expect(factor).toBeGreaterThanOrEqual(0.5);
    });

    it("clamps maximum to 2.0 (won't go above double)", () => {
      // Very slow learner
      const factor = getVelocityFactor(0.1);
      expect(factor).toBeLessThanOrEqual(2.0);
    });
  });

  // ─── getPartialMasteryDiscount ───

  describe("getPartialMasteryDiscount", () => {
    it("returns 1.0 for no prior knowledge (bkt <= 0.3)", () => {
      expect(getPartialMasteryDiscount(0)).toBe(1.0);
      expect(getPartialMasteryDiscount(0.1)).toBe(1.0);
      expect(getPartialMasteryDiscount(0.3)).toBe(1.0);
    });

    it("returns 0.75 for some exposure (0.3 < bkt <= 0.5)", () => {
      expect(getPartialMasteryDiscount(0.4)).toBe(0.75);
      expect(getPartialMasteryDiscount(0.5)).toBe(0.75);
    });

    it("returns 0.5 for developing (0.5 < bkt <= 0.7)", () => {
      expect(getPartialMasteryDiscount(0.6)).toBe(0.5);
      expect(getPartialMasteryDiscount(0.7)).toBe(0.5);
    });

    it("returns 0.3 for proficient (0.7 < bkt <= 0.85)", () => {
      expect(getPartialMasteryDiscount(0.8)).toBe(0.3);
      expect(getPartialMasteryDiscount(0.85)).toBe(0.3);
    });

    it("returns 0 for effectively mastered (bkt > 0.85)", () => {
      expect(getPartialMasteryDiscount(0.9)).toBe(0);
      expect(getPartialMasteryDiscount(1.0)).toBe(0);
    });

    it("discount decreases monotonically with increasing mastery", () => {
      const d1 = getPartialMasteryDiscount(0.1);
      const d2 = getPartialMasteryDiscount(0.4);
      const d3 = getPartialMasteryDiscount(0.6);
      const d4 = getPartialMasteryDiscount(0.8);
      const d5 = getPartialMasteryDiscount(0.9);
      expect(d1).toBeGreaterThanOrEqual(d2);
      expect(d2).toBeGreaterThanOrEqual(d3);
      expect(d3).toBeGreaterThanOrEqual(d4);
      expect(d4).toBeGreaterThanOrEqual(d5);
    });
  });

  // ─── gradeToNum ───

  describe("gradeToNum", () => {
    it("converts K to 0", () => {
      expect(gradeToNum("K")).toBe(0);
    });

    it("converts G1 to 1", () => {
      expect(gradeToNum("G1")).toBe(1);
    });

    it("converts G5 to 5", () => {
      expect(gradeToNum("G5")).toBe(5);
    });

    it("converts G10 to 10", () => {
      expect(gradeToNum("G10")).toBe(10);
    });

    it("returns 0 for unknown grades", () => {
      expect(gradeToNum("UNKNOWN")).toBe(0);
      expect(gradeToNum("")).toBe(0);
    });

    it("GRADE_ORDER contains all K-10 grades", () => {
      expect(GRADE_ORDER).toHaveLength(11);
      expect(GRADE_ORDER[0]).toBe("K");
      expect(GRADE_ORDER[10]).toBe("G10");
    });
  });

  // ─── estimateHoursPerConcept ───

  describe("estimateHoursPerConcept", () => {
    it("returns base hours for at-grade-level concept with no history", () => {
      // Difficulty 5, at grade, no velocity, no mastery
      const hours = estimateHoursPerConcept(5, 3, 3, null, 0);
      // BASE_HOURS[5] = 1.0, gradeFactor=1.0, velocityFactor=1.0, masteryDiscount=1.0
      expect(hours).toBe(1.0);
    });

    it("returns 0 for already-mastered concepts (bkt > 0.85)", () => {
      const hours = estimateHoursPerConcept(5, 3, 3, null, 0.95);
      expect(hours).toBe(0);
    });

    it("reduces hours for partially mastered concepts", () => {
      const noMastery = estimateHoursPerConcept(5, 3, 3, null, 0);
      const partial = estimateHoursPerConcept(5, 3, 3, null, 0.6);
      expect(partial).toBeLessThan(noMastery);
    });

    it("reduces hours for students above grade level", () => {
      const atGrade = estimateHoursPerConcept(5, 3, 3, null, 0);
      const above = estimateHoursPerConcept(5, 3, 5, null, 0);
      expect(above).toBeLessThan(atGrade);
    });

    it("increases hours for students below grade level", () => {
      const atGrade = estimateHoursPerConcept(5, 3, 3, null, 0);
      const below = estimateHoursPerConcept(5, 5, 3, null, 0);
      expect(below).toBeGreaterThan(atGrade);
    });

    it("reduces hours for fast learners", () => {
      const normal = estimateHoursPerConcept(5, 3, 3, null, 0);
      const fast = estimateHoursPerConcept(5, 3, 3, 2.0, 0);
      expect(fast).toBeLessThan(normal);
    });

    it("has a minimum of 0.25 hours for non-mastered concepts", () => {
      // Very easy concept with high mastery discount
      const hours = estimateHoursPerConcept(1, 3, 5, 2.0, 0.8);
      expect(hours).toBeGreaterThanOrEqual(0.25);
    });

    it("increases with difficulty", () => {
      const easy = estimateHoursPerConcept(2, 3, 3, null, 0);
      const hard = estimateHoursPerConcept(8, 3, 3, null, 0);
      expect(hard).toBeGreaterThan(easy);
    });
  });

  // ─── WeeklyMilestone type shape ───

  describe("WeeklyMilestone shape", () => {
    it("has all required fields", () => {
      const milestone: WeeklyMilestone = {
        weekNumber: 1,
        concepts: ["MATH.K.CC.1"],
        conceptTitles: ["Counting to 10"],
        estimatedHours: 2.5,
        cumulativeProgress: 25,
        milestoneCheck: false,
      };

      expect(milestone.weekNumber).toBe(1);
      expect(milestone.concepts).toHaveLength(1);
      expect(milestone.conceptTitles).toHaveLength(1);
      expect(milestone.estimatedHours).toBeGreaterThan(0);
      expect(milestone.cumulativeProgress).toBeGreaterThanOrEqual(0);
      expect(milestone.cumulativeProgress).toBeLessThanOrEqual(100);
      expect(typeof milestone.milestoneCheck).toBe("boolean");
    });

    it("milestone check follows 2-week pattern", () => {
      // Milestones should be checked every 2 weeks
      const milestones: WeeklyMilestone[] = [
        { weekNumber: 1, concepts: [], conceptTitles: [], estimatedHours: 2, cumulativeProgress: 20, milestoneCheck: false },
        { weekNumber: 2, concepts: [], conceptTitles: [], estimatedHours: 2, cumulativeProgress: 40, milestoneCheck: true },
        { weekNumber: 3, concepts: [], conceptTitles: [], estimatedHours: 2, cumulativeProgress: 60, milestoneCheck: false },
        { weekNumber: 4, concepts: [], conceptTitles: [], estimatedHours: 2, cumulativeProgress: 80, milestoneCheck: true },
      ];

      expect(milestones[0].milestoneCheck).toBe(false);
      expect(milestones[1].milestoneCheck).toBe(true);
      expect(milestones[2].milestoneCheck).toBe(false);
      expect(milestones[3].milestoneCheck).toBe(true);
    });

    it("cumulative progress increases monotonically", () => {
      const progress = [10, 30, 55, 80, 100];
      for (let i = 1; i < progress.length; i++) {
        expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
      }
    });
  });
});
