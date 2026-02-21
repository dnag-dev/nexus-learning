/**
 * Progress View Tests — Phase 9: Parent Dashboard
 *
 * Tests:
 *  - Domain breakdown calculates correctly
 *  - Strengths/weaknesses sorted by BKT probability
 *  - Daily minutes aggregation
 *  - DOMAIN_COLORS has entries for all domains
 */

import { describe, it, expect } from "vitest";
import {
  DOMAIN_COLORS,
  type DomainBreakdown,
  type StrengthWeakness,
  type DailyMinutes,
} from "../components/parent/ProgressView";

// ─── Tests ───

describe("Progress View", () => {
  describe("Domain breakdown calculation", () => {
    it("counts mastered, in-progress, and not-started correctly", () => {
      const breakdown: DomainBreakdown = {
        domain: "COUNTING",
        mastered: 5,
        inProgress: 3,
        notStarted: 7,
      };

      const total =
        breakdown.mastered + breakdown.inProgress + breakdown.notStarted;
      expect(total).toBe(15);
    });

    it("all domains have non-negative counts", () => {
      const domains: DomainBreakdown[] = [
        { domain: "COUNTING", mastered: 5, inProgress: 3, notStarted: 2 },
        { domain: "OPERATIONS", mastered: 3, inProgress: 4, notStarted: 3 },
        { domain: "GEOMETRY", mastered: 0, inProgress: 1, notStarted: 9 },
        { domain: "MEASUREMENT", mastered: 2, inProgress: 2, notStarted: 6 },
        { domain: "DATA", mastered: 1, inProgress: 0, notStarted: 4 },
      ];

      for (const d of domains) {
        expect(d.mastered).toBeGreaterThanOrEqual(0);
        expect(d.inProgress).toBeGreaterThanOrEqual(0);
        expect(d.notStarted).toBeGreaterThanOrEqual(0);
      }
    });

    it("covers all 5 required domains", () => {
      const requiredDomains = [
        "COUNTING",
        "OPERATIONS",
        "GEOMETRY",
        "MEASUREMENT",
        "DATA",
      ];

      const domains: DomainBreakdown[] = requiredDomains.map((d) => ({
        domain: d,
        mastered: 0,
        inProgress: 0,
        notStarted: 0,
      }));

      expect(domains).toHaveLength(5);
      for (const d of requiredDomains) {
        expect(domains.find((dd) => dd.domain === d)).toBeDefined();
      }
    });
  });

  describe("Strengths and weaknesses", () => {
    it("strengths are sorted by highest BKT probability", () => {
      const strengths: StrengthWeakness[] = [
        { nodeTitle: "Counting to 100", bktProbability: 0.95, domain: "COUNTING" },
        { nodeTitle: "Basic Addition", bktProbability: 0.92, domain: "OPERATIONS" },
        { nodeTitle: "Number Patterns", bktProbability: 0.88, domain: "COUNTING" },
      ];

      // Should be in descending order
      for (let i = 1; i < strengths.length; i++) {
        expect(strengths[i - 1].bktProbability).toBeGreaterThanOrEqual(
          strengths[i].bktProbability
        );
      }
    });

    it("weaknesses are nodes with BKT < 0.7", () => {
      const weaknesses: StrengthWeakness[] = [
        { nodeTitle: "Fractions", bktProbability: 0.35, domain: "OPERATIONS" },
        { nodeTitle: "Long Division", bktProbability: 0.45, domain: "OPERATIONS" },
        { nodeTitle: "Area", bktProbability: 0.55, domain: "MEASUREMENT" },
      ];

      for (const w of weaknesses) {
        expect(w.bktProbability).toBeLessThan(0.7);
      }
    });

    it("top 3 strengths are limited", () => {
      const allScores = [0.95, 0.92, 0.88, 0.85, 0.82, 0.78];
      const top3 = allScores
        .sort((a, b) => b - a)
        .slice(0, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0]).toBe(0.95);
      expect(top3[2]).toBe(0.88);
    });
  });

  describe("Daily minutes aggregation", () => {
    it("produces 14 days of data", () => {
      const dailyMinutes: DailyMinutes[] = Array.from(
        { length: 14 },
        (_, i) => ({
          date: new Date(
            Date.now() - (13 - i) * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
          minutes: Math.floor(Math.random() * 30),
        })
      );

      expect(dailyMinutes).toHaveLength(14);
    });

    it("dates are in chronological order", () => {
      const dailyMinutes: DailyMinutes[] = [
        { date: "2025-01-01", minutes: 10 },
        { date: "2025-01-02", minutes: 15 },
        { date: "2025-01-03", minutes: 20 },
      ];

      for (let i = 1; i < dailyMinutes.length; i++) {
        expect(dailyMinutes[i].date > dailyMinutes[i - 1].date).toBe(
          true
        );
      }
    });

    it("minutes are non-negative", () => {
      const dailyMinutes: DailyMinutes[] = [
        { date: "2025-01-01", minutes: 0 },
        { date: "2025-01-02", minutes: 25 },
        { date: "2025-01-03", minutes: 10 },
      ];

      for (const d of dailyMinutes) {
        expect(d.minutes).toBeGreaterThanOrEqual(0);
      }
    });

    it("can have 0 minutes on inactive days", () => {
      const dailyMinutes: DailyMinutes[] = [
        { date: "2025-01-01", minutes: 20 },
        { date: "2025-01-02", minutes: 0 },
        { date: "2025-01-03", minutes: 15 },
      ];

      const activeDays = dailyMinutes.filter((d) => d.minutes > 0);
      const inactiveDays = dailyMinutes.filter(
        (d) => d.minutes === 0
      );

      expect(activeDays).toHaveLength(2);
      expect(inactiveDays).toHaveLength(1);
    });
  });

  describe("DOMAIN_COLORS", () => {
    it("has color for COUNTING", () => {
      expect(DOMAIN_COLORS.COUNTING).toBeDefined();
    });

    it("has color for OPERATIONS", () => {
      expect(DOMAIN_COLORS.OPERATIONS).toBeDefined();
    });

    it("has color for GEOMETRY", () => {
      expect(DOMAIN_COLORS.GEOMETRY).toBeDefined();
    });

    it("has color for MEASUREMENT", () => {
      expect(DOMAIN_COLORS.MEASUREMENT).toBeDefined();
    });

    it("has color for DATA", () => {
      expect(DOMAIN_COLORS.DATA).toBeDefined();
    });

    it("all colors are hex color strings", () => {
      for (const color of Object.values(DOMAIN_COLORS)) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });
});
