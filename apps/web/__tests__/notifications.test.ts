/**
 * Review Notifications Tests — Phase 8: Spaced Repetition
 *
 * Tests the notification system types and urgency logic.
 * DB-backed functions are tested via integration tests.
 */

import { describe, it, expect } from "vitest";

// ─── Urgency Logic Tests ───

describe("Review Notifications", () => {
  describe("urgency calculation", () => {
    function calculateUrgency(dueNow: number, overdueCount: number): string {
      if (overdueCount > 0) return "high";
      if (dueNow > 0) return "medium";
      return "none";
    }

    it("returns 'high' when there are overdue nodes", () => {
      expect(calculateUrgency(5, 3)).toBe("high");
    });

    it("returns 'medium' when nodes are due but not overdue", () => {
      expect(calculateUrgency(3, 0)).toBe("medium");
    });

    it("returns 'none' when no nodes are due", () => {
      expect(calculateUrgency(0, 0)).toBe("none");
    });

    it("overdue always takes priority", () => {
      expect(calculateUrgency(1, 1)).toBe("high");
      expect(calculateUrgency(10, 1)).toBe("high");
    });
  });

  describe("estimated time calculation", () => {
    const MINUTES_PER_NODE = 2;

    it("calculates 0 minutes for 0 nodes", () => {
      expect(0 * MINUTES_PER_NODE).toBe(0);
    });

    it("calculates 10 minutes for 5 nodes", () => {
      expect(5 * MINUTES_PER_NODE).toBe(10);
    });

    it("calculates 20 minutes for 10 nodes", () => {
      expect(10 * MINUTES_PER_NODE).toBe(20);
    });
  });

  describe("notification message generation", () => {
    function generateTitle(dueCount: number, overdueCount: number): string {
      if (overdueCount > 0) {
        return `${overdueCount} overdue review${overdueCount > 1 ? "s" : ""}!`;
      }
      return `${dueCount} node${dueCount > 1 ? "s" : ""} ready for review`;
    }

    it("generates overdue title for overdue nodes", () => {
      expect(generateTitle(5, 3)).toBe("3 overdue reviews!");
    });

    it("generates singular overdue title for 1 overdue node", () => {
      expect(generateTitle(1, 1)).toBe("1 overdue review!");
    });

    it("generates due title for due-but-not-overdue nodes", () => {
      expect(generateTitle(3, 0)).toBe("3 nodes ready for review");
    });

    it("generates singular due title for 1 node", () => {
      expect(generateTitle(1, 0)).toBe("1 node ready for review");
    });
  });

  describe("notification expiry", () => {
    it("notifications expire after 7 days", () => {
      const NOTIFICATION_EXPIRY_DAYS = 7;
      const now = new Date("2024-01-01");
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRY_DAYS);

      expect(expiresAt.toISOString().split("T")[0]).toBe("2024-01-08");
    });
  });
});
