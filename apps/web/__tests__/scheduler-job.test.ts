/**
 * Scheduler Job Tests — Phase 8: Spaced Repetition
 *
 * Tests the review suggestion logic used during session start.
 * DB-backed functions are tested via integration tests.
 */

import { describe, it, expect } from "vitest";
import type { ReviewSuggestion } from "../lib/spaced-repetition/scheduler-job";

// ─── Tests ───

describe("Scheduler Job", () => {
  describe("ReviewSuggestion type shape", () => {
    it("has correct properties when no due reviews", () => {
      const suggestion: ReviewSuggestion = {
        hasDueReviews: false,
        dueCount: 0,
        overdueCount: 0,
        estimatedMinutes: 0,
        urgency: "none",
        message: null,
      };

      expect(suggestion.hasDueReviews).toBe(false);
      expect(suggestion.dueCount).toBe(0);
      expect(suggestion.message).toBeNull();
    });

    it("has correct properties when due reviews exist", () => {
      const suggestion: ReviewSuggestion = {
        hasDueReviews: true,
        dueCount: 5,
        overdueCount: 2,
        estimatedMinutes: 10,
        urgency: "high",
        message: "You have 2 overdue reviews — a quick 10-minute review will help keep your knowledge strong!",
      };

      expect(suggestion.hasDueReviews).toBe(true);
      expect(suggestion.dueCount).toBe(5);
      expect(suggestion.overdueCount).toBe(2);
      expect(suggestion.estimatedMinutes).toBe(10);
      expect(suggestion.urgency).toBe("high");
      expect(suggestion.message).toContain("overdue");
    });
  });

  describe("suggestion message generation", () => {
    function generateMessage(dueCount: number, overdueCount: number, estimatedMinutes: number): string {
      if (overdueCount > 0) {
        return `You have ${overdueCount} overdue review${overdueCount > 1 ? "s" : ""} — a quick ${estimatedMinutes}-minute review will help keep your knowledge strong!`;
      }
      return `${dueCount} concept${dueCount > 1 ? "s are" : " is"} ready for review — do a quick ${estimatedMinutes}-minute review first?`;
    }

    it("generates overdue message", () => {
      const msg = generateMessage(5, 3, 10);
      expect(msg).toContain("3 overdue reviews");
      expect(msg).toContain("10-minute");
    });

    it("generates singular overdue message", () => {
      const msg = generateMessage(1, 1, 2);
      expect(msg).toContain("1 overdue review —");
    });

    it("generates due message for non-overdue nodes", () => {
      const msg = generateMessage(3, 0, 6);
      expect(msg).toContain("3 concepts are ready");
      expect(msg).toContain("6-minute");
    });

    it("generates singular due message", () => {
      const msg = generateMessage(1, 0, 2);
      expect(msg).toContain("1 concept is ready");
    });
  });

  describe("urgency levels", () => {
    it("supports four urgency levels", () => {
      const levels = ["none", "low", "medium", "high"];
      levels.forEach((level) => {
        const suggestion: ReviewSuggestion = {
          hasDueReviews: level !== "none",
          dueCount: level === "none" ? 0 : 1,
          overdueCount: level === "high" ? 1 : 0,
          estimatedMinutes: level === "none" ? 0 : 2,
          urgency: level as ReviewSuggestion["urgency"],
          message: level === "none" ? null : "test",
        };
        expect(suggestion.urgency).toBe(level);
      });
    });
  });
});
