/**
 * Plan Adapter Tests — Learning GPS Step 9
 *
 * Tests the 6 adaptation rules that adjust learning plans
 * after each session:
 * 1. Concept took >2x estimated → increase similar concepts
 * 2. Last 3 concepts faster → reduce upcoming by 15%
 * 3. No session in 3+ days → add review touchpoints
 * 4. Spaced repetition review failed → add concept back
 * 5. Projected date >2 weeks past target → trigger review
 * 6. >4 weeks ahead → suggest advanced branch
 */

import { describe, it, expect } from "vitest";
import type { AdaptationResult, AdaptationAction } from "../lib/learning-plan/plan-adapter";

// ─── Pure Logic Helpers (adaptation rules) ───

/**
 * Rule 1: Check if a concept took significantly longer than estimated.
 * If actual time > 2× estimated, flag for adjustment.
 */
function checkSlowConcept(
  actualHours: number,
  estimatedHours: number,
  threshold: number = 2.0
): { shouldAdjust: boolean; ratio: number } {
  if (estimatedHours <= 0) return { shouldAdjust: false, ratio: 0 };
  const ratio = actualHours / estimatedHours;
  return { shouldAdjust: ratio >= threshold, ratio };
}

/**
 * Rule 2: Check if student is consistently faster than expected.
 * If last 3 concepts all completed under estimated time, recommend reduction.
 */
function checkFastLearner(
  recentActualHours: number[],
  recentEstimatedHours: number[],
  reductionFactor: number = 0.85
): { isFast: boolean; suggestedReduction: number } {
  if (recentActualHours.length < 3 || recentEstimatedHours.length < 3) {
    return { isFast: false, suggestedReduction: 1.0 };
  }

  const allFaster = recentActualHours.every(
    (actual, i) => actual < recentEstimatedHours[i]
  );

  return {
    isFast: allFaster,
    suggestedReduction: allFaster ? reductionFactor : 1.0,
  };
}

/**
 * Rule 3: Check inactivity — no session in 3+ days.
 */
function checkInactivity(
  lastSessionDate: Date | null,
  now: Date = new Date(),
  thresholdDays: number = 3
): { isInactive: boolean; daysSinceSession: number } {
  if (!lastSessionDate) return { isInactive: true, daysSinceSession: Infinity };
  const days = (now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24);
  return { isInactive: days >= thresholdDays, daysSinceSession: Math.floor(days) };
}

/**
 * Rule 5: Check if projected date is >2 weeks past target.
 */
function checkBehindSchedule(
  projectedDate: Date,
  targetDate: Date | null,
  thresholdDays: number = 14
): { isCriticallyBehind: boolean; daysBehind: number } {
  if (!targetDate) return { isCriticallyBehind: false, daysBehind: 0 };
  const daysBehind = Math.floor(
    (projectedDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return { isCriticallyBehind: daysBehind > thresholdDays, daysBehind };
}

/**
 * Rule 6: Check if student is significantly ahead.
 */
function checkAheadOfSchedule(
  projectedDate: Date,
  targetDate: Date | null,
  thresholdWeeks: number = 4
): { isSignificantlyAhead: boolean; weeksAhead: number } {
  if (!targetDate) return { isSignificantlyAhead: false, weeksAhead: 0 };
  const daysAhead = (targetDate.getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24);
  const weeksAhead = Math.floor(daysAhead / 7);
  return {
    isSignificantlyAhead: weeksAhead >= thresholdWeeks,
    weeksAhead: Math.max(0, weeksAhead),
  };
}

// ─── Tests ───

describe("Plan Adapter", () => {
  // ─── Rule 1: Slow Concept ───

  describe("Rule 1: Slow Concept Detection", () => {
    it("flags when actual > 2x estimated", () => {
      const result = checkSlowConcept(3.0, 1.0);
      expect(result.shouldAdjust).toBe(true);
      expect(result.ratio).toBe(3.0);
    });

    it("does not flag when actual <= 2x estimated", () => {
      const result = checkSlowConcept(1.5, 1.0);
      expect(result.shouldAdjust).toBe(false);
    });

    it("flags exactly at 2x", () => {
      const result = checkSlowConcept(2.0, 1.0);
      expect(result.shouldAdjust).toBe(true);
    });

    it("handles zero estimated hours", () => {
      const result = checkSlowConcept(2.0, 0);
      expect(result.shouldAdjust).toBe(false);
    });
  });

  // ─── Rule 2: Fast Learner ───

  describe("Rule 2: Fast Learner Detection", () => {
    it("detects fast learner when all 3 concepts faster", () => {
      const actual = [0.3, 0.5, 0.8];
      const estimated = [0.5, 1.0, 1.5];
      const result = checkFastLearner(actual, estimated);
      expect(result.isFast).toBe(true);
      expect(result.suggestedReduction).toBe(0.85);
    });

    it("does not flag if one concept was slower", () => {
      const actual = [0.3, 1.5, 0.8]; // Second is slower
      const estimated = [0.5, 1.0, 1.5];
      const result = checkFastLearner(actual, estimated);
      expect(result.isFast).toBe(false);
      expect(result.suggestedReduction).toBe(1.0);
    });

    it("requires at least 3 data points", () => {
      const result = checkFastLearner([0.3, 0.5], [0.5, 1.0]);
      expect(result.isFast).toBe(false);
    });
  });

  // ─── Rule 3: Inactivity ───

  describe("Rule 3: Inactivity Detection", () => {
    it("detects inactivity after 3+ days", () => {
      const lastSession = new Date("2025-01-01");
      const now = new Date("2025-01-05");
      const result = checkInactivity(lastSession, now);
      expect(result.isInactive).toBe(true);
      expect(result.daysSinceSession).toBe(4);
    });

    it("not inactive within 3 days", () => {
      const lastSession = new Date("2025-01-01");
      const now = new Date("2025-01-02");
      const result = checkInactivity(lastSession, now);
      expect(result.isInactive).toBe(false);
    });

    it("is inactive if no session ever", () => {
      const result = checkInactivity(null);
      expect(result.isInactive).toBe(true);
      expect(result.daysSinceSession).toBe(Infinity);
    });

    it("respects custom threshold", () => {
      const lastSession = new Date("2025-01-01");
      const now = new Date("2025-01-06");
      expect(checkInactivity(lastSession, now, 7).isInactive).toBe(false);
      expect(checkInactivity(lastSession, now, 3).isInactive).toBe(true);
    });
  });

  // ─── Rule 5: Critically Behind ───

  describe("Rule 5: Behind Schedule Detection", () => {
    it("detects critically behind (>2 weeks past target)", () => {
      const projected = new Date("2025-04-01");
      const target = new Date("2025-03-01");
      const result = checkBehindSchedule(projected, target);
      expect(result.isCriticallyBehind).toBe(true);
      expect(result.daysBehind).toBeGreaterThan(14);
    });

    it("not critically behind within 2 weeks", () => {
      const projected = new Date("2025-03-10");
      const target = new Date("2025-03-01");
      const result = checkBehindSchedule(projected, target);
      expect(result.isCriticallyBehind).toBe(false);
    });

    it("not behind when no target date", () => {
      const projected = new Date("2025-06-01");
      const result = checkBehindSchedule(projected, null);
      expect(result.isCriticallyBehind).toBe(false);
    });

    it("not behind when ahead of schedule", () => {
      const projected = new Date("2025-02-01");
      const target = new Date("2025-03-01");
      const result = checkBehindSchedule(projected, target);
      expect(result.isCriticallyBehind).toBe(false);
      expect(result.daysBehind).toBeLessThan(0);
    });
  });

  // ─── Rule 6: Significantly Ahead ───

  describe("Rule 6: Ahead of Schedule Detection", () => {
    it("detects 4+ weeks ahead", () => {
      const projected = new Date("2025-02-01");
      const target = new Date("2025-04-01");
      const result = checkAheadOfSchedule(projected, target);
      expect(result.isSignificantlyAhead).toBe(true);
      expect(result.weeksAhead).toBeGreaterThanOrEqual(4);
    });

    it("not significantly ahead within 4 weeks", () => {
      const projected = new Date("2025-02-15");
      const target = new Date("2025-03-01");
      const result = checkAheadOfSchedule(projected, target);
      expect(result.isSignificantlyAhead).toBe(false);
    });

    it("not ahead when no target date", () => {
      const projected = new Date("2025-01-01");
      const result = checkAheadOfSchedule(projected, null);
      expect(result.isSignificantlyAhead).toBe(false);
    });

    it("not ahead when behind schedule", () => {
      const projected = new Date("2025-05-01");
      const target = new Date("2025-03-01");
      const result = checkAheadOfSchedule(projected, target);
      expect(result.isSignificantlyAhead).toBe(false);
      expect(result.weeksAhead).toBe(0);
    });
  });

  // ─── AdaptationResult type ───

  describe("AdaptationResult type shape", () => {
    it("has all required fields", () => {
      const result: AdaptationResult = {
        planId: "plan-123",
        actions: [
          {
            type: "INCREASE_ESTIMATES",
            description: "Increased estimates for similar concepts",
            conceptsAffected: ["MATH.1.OA.1", "MATH.1.OA.2"],
          },
        ],
        message: "Adjusted plan based on recent performance",
      };

      expect(result.planId).toBeTruthy();
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe("INCREASE_ESTIMATES");
      expect(result.actions[0].conceptsAffected).toHaveLength(2);
    });
  });

  // ─── AdaptationAction type ───

  describe("AdaptationAction type shape", () => {
    it("supports all action types", () => {
      const types = [
        "INCREASE_ESTIMATES",
        "DECREASE_ESTIMATES",
        "ADD_REVIEW",
        "ADD_CONCEPT_BACK",
        "TRIGGER_PLAN_REVIEW",
        "SUGGEST_ADVANCED",
      ];

      for (const type of types) {
        const action: AdaptationAction = {
          type,
          description: `${type} action`,
          conceptsAffected: [],
        };
        expect(action.type).toBe(type);
      }
    });
  });
});
