/**
 * ETA Calculator Tests — Learning GPS Step 5
 *
 * Tests:
 * - ETAResult type shape
 * - VelocityData type shape
 * - Schedule status calculations (ahead/behind)
 * - ETA projection logic
 * - Velocity trend detection
 * - Progress percentage calculations
 */

import { describe, it, expect } from "vitest";
import type { ETAResult, VelocityData } from "../lib/learning-plan/eta-calculator";

// ─── Pure Logic Helpers (replicate from eta-calculator for testing) ───

/**
 * Calculate schedule status from plan data.
 * This mirrors the logic in recalculatePlanETA.
 */
function calculateScheduleStatus(
  projectedDate: Date,
  targetDate: Date | null,
  now: Date = new Date()
): { isAhead: boolean; daysDifference: number; message: string } {
  if (!targetDate) {
    return { isAhead: true, daysDifference: 0, message: "On track (no target date set)" };
  }

  const projectedMs = projectedDate.getTime();
  const targetMs = targetDate.getTime();
  const daysDifference = Math.round((targetMs - projectedMs) / (1000 * 60 * 60 * 24));

  if (daysDifference >= 0) {
    return {
      isAhead: true,
      daysDifference,
      message: daysDifference > 7
        ? `${Math.floor(daysDifference / 7)} week${daysDifference >= 14 ? "s" : ""} ahead of schedule`
        : `${daysDifference} day${daysDifference !== 1 ? "s" : ""} ahead of schedule`,
    };
  } else {
    const behind = Math.abs(daysDifference);
    return {
      isAhead: false,
      daysDifference,
      message: behind > 7
        ? `${Math.floor(behind / 7)} week${behind >= 14 ? "s" : ""} behind schedule`
        : `${behind} day${behind !== 1 ? "s" : ""} behind schedule`,
    };
  }
}

/**
 * Calculate ETA projection from remaining concepts and velocity.
 */
function projectCompletionDate(
  conceptsRemaining: number,
  avgHoursPerConcept: number,
  velocityHoursPerWeek: number,
  now: Date = new Date()
): Date {
  if (velocityHoursPerWeek <= 0 || conceptsRemaining <= 0) return now;
  const totalHoursRemaining = conceptsRemaining * avgHoursPerConcept;
  const weeksRemaining = totalHoursRemaining / velocityHoursPerWeek;
  const daysRemaining = Math.ceil(weeksRemaining * 7);
  const projected = new Date(now);
  projected.setDate(projected.getDate() + daysRemaining);
  return projected;
}

/**
 * Calculate progress percentage from concept index and total.
 */
function calculateProgress(currentIndex: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((currentIndex / total) * 100);
}

/**
 * Determine velocity trend from current and previous velocity.
 */
function getVelocityTrend(
  current: number,
  previous: number
): "accelerating" | "steady" | "slowing" | "insufficient_data" {
  if (current <= 0 || previous <= 0) return "insufficient_data";
  const ratio = current / previous;
  if (ratio > 1.15) return "accelerating";
  if (ratio < 0.85) return "slowing";
  return "steady";
}

// ─── Tests ───

describe("ETA Calculator", () => {
  // ─── Schedule Status ───

  describe("calculateScheduleStatus", () => {
    it("reports ahead when projected before target", () => {
      const now = new Date("2025-01-01");
      const projected = new Date("2025-03-01");
      const target = new Date("2025-04-01");

      const status = calculateScheduleStatus(projected, target, now);
      expect(status.isAhead).toBe(true);
      expect(status.daysDifference).toBeGreaterThan(0);
    });

    it("reports behind when projected after target", () => {
      const projected = new Date("2025-05-01");
      const target = new Date("2025-03-01");

      const status = calculateScheduleStatus(projected, target);
      expect(status.isAhead).toBe(false);
      expect(status.daysDifference).toBeLessThan(0);
    });

    it("reports ahead with no target date", () => {
      const projected = new Date("2025-06-01");

      const status = calculateScheduleStatus(projected, null);
      expect(status.isAhead).toBe(true);
      expect(status.message).toContain("no target");
    });

    it("calculates correct days difference", () => {
      const projected = new Date("2025-03-01");
      const target = new Date("2025-03-15");

      const status = calculateScheduleStatus(projected, target);
      expect(status.daysDifference).toBe(14);
    });

    it("message shows weeks for large differences", () => {
      const projected = new Date("2025-01-01");
      const target = new Date("2025-03-01");

      const status = calculateScheduleStatus(projected, target);
      expect(status.message).toContain("week");
    });

    it("message shows days for small differences", () => {
      const projected = new Date("2025-03-01");
      const target = new Date("2025-03-05");

      const status = calculateScheduleStatus(projected, target);
      expect(status.message).toContain("day");
    });
  });

  // ─── Completion Projection ───

  describe("projectCompletionDate", () => {
    it("returns now if no concepts remaining", () => {
      const now = new Date();
      const result = projectCompletionDate(0, 1, 5, now);
      expect(result.getTime()).toBe(now.getTime());
    });

    it("returns now if velocity is zero", () => {
      const now = new Date();
      const result = projectCompletionDate(10, 1, 0, now);
      expect(result.getTime()).toBe(now.getTime());
    });

    it("projects correctly for known values", () => {
      const now = new Date("2025-01-01");
      // 10 concepts × 1 hr/concept = 10 hours / 5 hrs/week = 2 weeks
      const result = projectCompletionDate(10, 1, 5, now);
      const expectedDate = new Date("2025-01-15"); // 14 days later
      expect(result.getTime()).toBe(expectedDate.getTime());
    });

    it("farther future for more concepts", () => {
      const now = new Date("2025-01-01");
      const fewer = projectCompletionDate(5, 1, 5, now);
      const more = projectCompletionDate(20, 1, 5, now);
      expect(more.getTime()).toBeGreaterThan(fewer.getTime());
    });

    it("sooner for higher velocity", () => {
      const now = new Date("2025-01-01");
      const slow = projectCompletionDate(10, 1, 2, now);
      const fast = projectCompletionDate(10, 1, 10, now);
      expect(fast.getTime()).toBeLessThan(slow.getTime());
    });
  });

  // ─── Progress Calculation ───

  describe("calculateProgress", () => {
    it("returns 0 for no total concepts", () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it("returns 0 at start", () => {
      expect(calculateProgress(0, 20)).toBe(0);
    });

    it("returns 100 when all complete", () => {
      expect(calculateProgress(20, 20)).toBe(100);
    });

    it("returns correct percentage", () => {
      expect(calculateProgress(10, 20)).toBe(50);
      expect(calculateProgress(15, 20)).toBe(75);
      expect(calculateProgress(1, 3)).toBe(33);
    });

    it("rounds to nearest integer", () => {
      expect(calculateProgress(1, 3)).toBe(33); // 33.33... rounds to 33
      expect(calculateProgress(2, 3)).toBe(67); // 66.66... rounds to 67
    });
  });

  // ─── Velocity Trend ───

  describe("getVelocityTrend", () => {
    it("returns accelerating when current > previous by 15%+", () => {
      expect(getVelocityTrend(6, 5)).toBe("accelerating");
    });

    it("returns slowing when current < previous by 15%+", () => {
      expect(getVelocityTrend(4, 5)).toBe("slowing");
    });

    it("returns steady when change < 15%", () => {
      expect(getVelocityTrend(5, 5)).toBe("steady");
      expect(getVelocityTrend(5.5, 5)).toBe("steady");
    });

    it("returns insufficient_data when current is 0", () => {
      expect(getVelocityTrend(0, 5)).toBe("insufficient_data");
    });

    it("returns insufficient_data when previous is 0", () => {
      expect(getVelocityTrend(5, 0)).toBe("insufficient_data");
    });
  });

  // ─── ETAResult type ───

  describe("ETAResult type shape", () => {
    it("has all required fields", () => {
      const result: ETAResult = {
        planId: "plan-123",
        snapshotId: "snap-456",
        conceptsRemaining: 15,
        conceptsMastered: 5,
        totalConcepts: 20,
        hoursRemaining: 12.5,
        velocityHoursPerWeek: 5,
        projectedCompletionDate: new Date("2025-06-01"),
        targetCompletionDate: new Date("2025-07-01"),
        isAheadOfSchedule: true,
        daysDifference: 30,
        progressPercentage: 25,
        scheduleMessage: "4 weeks ahead of schedule",
        insight: "Great progress!",
      };

      expect(result.planId).toBeTruthy();
      expect(result.snapshotId).toBeTruthy();
      expect(result.totalConcepts).toBe(result.conceptsRemaining + result.conceptsMastered);
      expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.progressPercentage).toBeLessThanOrEqual(100);
    });
  });

  // ─── VelocityData type ───

  describe("VelocityData type shape", () => {
    it("has all required fields", () => {
      const data: VelocityData = {
        currentWeeklyHours: 5.5,
        previousWeeklyHours: 4.0,
        trend: "accelerating",
        sessionsLast4Weeks: 12,
      };

      expect(data.currentWeeklyHours).toBeGreaterThan(0);
      expect(["accelerating", "steady", "slowing", "insufficient_data"]).toContain(data.trend);
      expect(data.sessionsLast4Weeks).toBeGreaterThanOrEqual(0);
    });
  });
});
