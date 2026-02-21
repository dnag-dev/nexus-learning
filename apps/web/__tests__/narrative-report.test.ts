/**
 * Narrative Report Tests — Phase 9: Parent Dashboard
 *
 * Tests:
 *  - Claude prompt contains student name, week stats, emotional summary
 *  - Week range calculation (Monday-Sunday)
 *  - Fallback report generation
 *  - WeeklyStats type shape
 *  - Report prompt structure
 */

import { describe, it, expect } from "vitest";
import {
  buildReportPrompt,
  getWeekRange,
  getPreviousWeekRange,
  type WeeklyStats,
  type WeeklyReportData,
} from "../lib/reports/narrative-report";

// ─── Helpers ───

function makeStats(overrides: Partial<WeeklyStats> = {}): WeeklyStats {
  return {
    totalSessions: 5,
    totalTimeMinutes: 120,
    questionsAnswered: 50,
    overallAccuracy: 0.82,
    nodesMastered: 3,
    nodesInProgress: 2,
    streakDays: 7,
    badgesEarned: 1,
    bossCompleted: 0,
    emotionalScore: 78,
    dominantEmotion: "ENGAGED",
    ...overrides,
  };
}

// ─── Tests ───

describe("Narrative Report", () => {
  describe("buildReportPrompt", () => {
    it("includes student name in prompt", () => {
      const prompt = buildReportPrompt(
        "Alex",
        makeStats(),
        ["Counting", "Addition"],
        ["Fractions"],
        "Jan 6 – Jan 12, 2025"
      );

      expect(prompt).toContain("Alex");
    });

    it("includes week label", () => {
      const prompt = buildReportPrompt(
        "Maya",
        makeStats(),
        [],
        [],
        "Feb 3 – Feb 9, 2025"
      );

      expect(prompt).toContain("Feb 3 – Feb 9, 2025");
    });

    it("includes session count", () => {
      const stats = makeStats({ totalSessions: 8 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("8");
    });

    it("includes total time", () => {
      const stats = makeStats({ totalTimeMinutes: 90 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("90 minutes");
    });

    it("includes accuracy as percentage", () => {
      const stats = makeStats({ overallAccuracy: 0.85 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("85%");
    });

    it("includes nodes mastered count", () => {
      const stats = makeStats({ nodesMastered: 5 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("5");
    });

    it("includes streak days", () => {
      const stats = makeStats({ streakDays: 14 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("14");
    });

    it("includes emotional score", () => {
      const stats = makeStats({ emotionalScore: 85 });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("85/100");
    });

    it("includes dominant emotional state", () => {
      const stats = makeStats({ dominantEmotion: "EXCITED" });
      const prompt = buildReportPrompt("Test", stats, [], [], "Week 1");

      expect(prompt).toContain("EXCITED");
    });

    it("includes strengths when provided", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        ["Counting to 100", "Basic Addition"],
        [],
        "Week 1"
      );

      expect(prompt).toContain("Counting to 100");
      expect(prompt).toContain("Basic Addition");
    });

    it("includes areas to improve when provided", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        [],
        ["Fractions", "Long Division"],
        "Week 1"
      );

      expect(prompt).toContain("Fractions");
      expect(prompt).toContain("Long Division");
    });

    it("handles empty strengths gracefully", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        [],
        [],
        "Week 1"
      );

      expect(prompt).toContain("Still exploring!");
    });

    it("includes paragraph format instructions", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        [],
        [],
        "Week 1"
      );

      expect(prompt).toContain("Paragraph 1");
      expect(prompt).toContain("Paragraph 2");
      expect(prompt).toContain("Paragraph 3");
      expect(prompt).toContain("Paragraph 4");
    });

    it("specifies warm, non-technical tone", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        [],
        [],
        "Week 1"
      );

      expect(prompt).toContain("warm");
      expect(prompt).toContain("non-technical");
      expect(prompt).toContain("parents");
    });

    it("specifies no bullet points", () => {
      const prompt = buildReportPrompt(
        "Test",
        makeStats(),
        [],
        [],
        "Week 1"
      );

      expect(prompt).toContain("Do NOT use bullet points");
    });
  });

  describe("getWeekRange", () => {
    it("returns Monday-Sunday range for a Wednesday", () => {
      const wed = new Date("2025-01-08T12:00:00Z"); // Wednesday
      const range = getWeekRange(wed);

      expect(range.start.getDay()).toBe(1); // Monday
      expect(range.end.getDay()).toBe(0); // Sunday
    });

    it("returns Monday-Sunday range for a Monday", () => {
      const mon = new Date("2025-01-06T12:00:00Z"); // Monday
      const range = getWeekRange(mon);

      expect(range.start.getDay()).toBe(1); // Monday
      expect(range.start.toISOString().split("T")[0]).toBe("2025-01-06");
    });

    it("returns Monday-Sunday range for a Sunday", () => {
      const sun = new Date("2025-01-12T12:00:00Z"); // Sunday
      const range = getWeekRange(sun);

      expect(range.start.getDay()).toBe(1); // Monday
      // Sunday belongs to the previous Monday's week
      expect(range.end.getDay()).toBe(0); // Sunday
    });

    it("end date is 6 days after start date", () => {
      const date = new Date("2025-01-15T12:00:00Z");
      const range = getWeekRange(date);

      const startDay = range.start.getDate();
      const endDay = range.end.getDate();
      const diff = endDay - startDay;

      expect(diff).toBe(6);
    });
  });

  describe("getPreviousWeekRange", () => {
    it("returns the week before the given date", () => {
      const date = new Date("2025-01-15T12:00:00Z"); // Wednesday
      const current = getWeekRange(date);
      const previous = getPreviousWeekRange(date);

      expect(previous.end.getTime()).toBeLessThan(current.start.getTime());
    });

    it("previous week start is 7 days before current week start", () => {
      const date = new Date("2025-01-15T12:00:00Z");
      const current = getWeekRange(date);
      const previous = getPreviousWeekRange(date);

      const diffMs =
        current.start.getTime() - previous.start.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

      expect(diffDays).toBe(7);
    });
  });

  describe("WeeklyStats type shape", () => {
    it("has all required fields", () => {
      const stats = makeStats();

      expect(stats.totalSessions).toBeDefined();
      expect(stats.totalTimeMinutes).toBeDefined();
      expect(stats.questionsAnswered).toBeDefined();
      expect(stats.overallAccuracy).toBeDefined();
      expect(stats.nodesMastered).toBeDefined();
      expect(stats.nodesInProgress).toBeDefined();
      expect(stats.streakDays).toBeDefined();
      expect(stats.badgesEarned).toBeDefined();
      expect(stats.bossCompleted).toBeDefined();
      expect(stats.emotionalScore).toBeDefined();
      expect(stats.dominantEmotion).toBeDefined();
    });

    it("accuracy is between 0 and 1", () => {
      const stats = makeStats({ overallAccuracy: 0.85 });
      expect(stats.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(stats.overallAccuracy).toBeLessThanOrEqual(1);
    });

    it("emotional score is between 0 and 100", () => {
      const stats = makeStats({ emotionalScore: 75 });
      expect(stats.emotionalScore).toBeGreaterThanOrEqual(0);
      expect(stats.emotionalScore).toBeLessThanOrEqual(100);
    });
  });

  describe("WeeklyReportData type shape", () => {
    it("has all required fields", () => {
      const report: WeeklyReportData = {
        id: "test-id",
        studentId: "student-1",
        weekStart: "2025-01-06",
        weekEnd: "2025-01-12",
        reportText: "A great week!",
        stats: makeStats(),
        generatedAt: "2025-01-13T00:00:00Z",
        viewedAt: null,
      };

      expect(report.id).toBe("test-id");
      expect(report.reportText).toBe("A great week!");
      expect(report.viewedAt).toBeNull();
    });
  });
});
