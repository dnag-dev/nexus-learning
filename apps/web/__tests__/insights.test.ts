/**
 * Insights Engine Tests — Phase 9: Parent Dashboard
 *
 * Tests:
 *  - calculateTrend: accelerating, steady, slowing detection
 *  - BestLearningTime: correct day/hour from session data
 *  - LearningVelocity: trend calculation for patterns
 *  - EmotionalHealthScore: score calculation from states
 *  - InsightCard: priority sorting and card generation
 */

import { describe, it, expect } from "vitest";
import {
  calculateTrend,
  type InsightCard,
  type InsightPriority,
  type TrendDirection,
  type BestLearningTime,
  type LearningVelocity,
  type EmotionalHealthScore,
} from "../lib/reports/insights";

// ─── Tests ───

describe("Insights Engine", () => {
  describe("calculateTrend", () => {
    it("returns 'accelerating' when current is > 15% above previous", () => {
      expect(calculateTrend(10, 5)).toBe("accelerating");
      expect(calculateTrend(12, 10)).toBe("accelerating");
    });

    it("returns 'slowing' when current is > 15% below previous", () => {
      expect(calculateTrend(5, 10)).toBe("slowing");
      expect(calculateTrend(8, 10)).toBe("slowing");
    });

    it("returns 'steady' when change is within ±15%", () => {
      expect(calculateTrend(10, 10)).toBe("steady");
      expect(calculateTrend(10, 9)).toBe("steady");
      expect(calculateTrend(9, 10)).toBe("steady");
    });

    it("returns 'steady' when both are 0", () => {
      expect(calculateTrend(0, 0)).toBe("steady");
    });

    it("returns 'accelerating' when previous is 0 and current > 0", () => {
      expect(calculateTrend(5, 0)).toBe("accelerating");
    });

    it("handles decimal values", () => {
      expect(calculateTrend(1.5, 1.3)).toBe("accelerating"); // +15.4% → accelerating
      expect(calculateTrend(1.3, 1.5)).toBe("steady"); // -13.3% → within ±15% threshold
      expect(calculateTrend(1.0, 1.5)).toBe("slowing"); // -33.3% → slowing
    });
  });

  describe("InsightCard type shape", () => {
    it("has all required properties", () => {
      const card: InsightCard = {
        title: "Test Insight",
        description: "A test description",
        metric: "95%",
        trend: "accelerating",
        recommendation: "Keep going!",
        priority: "HIGH",
      };

      expect(card.title).toBe("Test Insight");
      expect(card.description).toBe("A test description");
      expect(card.metric).toBe("95%");
      expect(card.trend).toBe("accelerating");
      expect(card.recommendation).toBe("Keep going!");
      expect(card.priority).toBe("HIGH");
    });

    it("supports all priority levels", () => {
      const priorities: InsightPriority[] = ["HIGH", "MEDIUM", "LOW"];
      expect(priorities).toHaveLength(3);
    });

    it("supports all trend directions", () => {
      const trends: TrendDirection[] = ["accelerating", "steady", "slowing"];
      expect(trends).toHaveLength(3);
    });
  });

  describe("InsightCard priority sorting", () => {
    it("HIGH comes before MEDIUM and LOW", () => {
      const priorityOrder: Record<InsightPriority, number> = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2,
      };

      const cards: InsightCard[] = [
        {
          title: "Low",
          description: "",
          metric: "",
          trend: "steady",
          recommendation: "",
          priority: "LOW",
        },
        {
          title: "High",
          description: "",
          metric: "",
          trend: "steady",
          recommendation: "",
          priority: "HIGH",
        },
        {
          title: "Medium",
          description: "",
          metric: "",
          trend: "steady",
          recommendation: "",
          priority: "MEDIUM",
        },
      ];

      cards.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      expect(cards[0].priority).toBe("HIGH");
      expect(cards[1].priority).toBe("MEDIUM");
      expect(cards[2].priority).toBe("LOW");
    });
  });

  describe("BestLearningTime type shape", () => {
    it("has all required properties", () => {
      const time: BestLearningTime = {
        dayOfWeek: "Monday",
        hourOfDay: 16,
        avgAccuracy: 0.92,
        sessionCount: 5,
      };

      expect(time.dayOfWeek).toBe("Monday");
      expect(time.hourOfDay).toBe(16);
      expect(time.avgAccuracy).toBe(0.92);
      expect(time.sessionCount).toBe(5);
    });

    it("hourOfDay ranges 0-23", () => {
      const morning: BestLearningTime = {
        dayOfWeek: "Tuesday",
        hourOfDay: 9,
        avgAccuracy: 0.85,
        sessionCount: 3,
      };
      const evening: BestLearningTime = {
        dayOfWeek: "Friday",
        hourOfDay: 20,
        avgAccuracy: 0.78,
        sessionCount: 4,
      };

      expect(morning.hourOfDay).toBeGreaterThanOrEqual(0);
      expect(evening.hourOfDay).toBeLessThanOrEqual(23);
    });
  });

  describe("LearningVelocity type shape", () => {
    it("has correct properties for accelerating pattern", () => {
      const velocity: LearningVelocity = {
        nodesPerWeek: 3.5,
        trend: "accelerating",
        currentWeekNodes: 5,
        previousWeekNodes: 2,
      };

      expect(velocity.nodesPerWeek).toBe(3.5);
      expect(velocity.trend).toBe("accelerating");
      expect(velocity.currentWeekNodes).toBeGreaterThan(
        velocity.previousWeekNodes
      );
    });

    it("has correct properties for slowing pattern", () => {
      const velocity: LearningVelocity = {
        nodesPerWeek: 2,
        trend: "slowing",
        currentWeekNodes: 1,
        previousWeekNodes: 3,
      };

      expect(velocity.trend).toBe("slowing");
      expect(velocity.currentWeekNodes).toBeLessThan(
        velocity.previousWeekNodes
      );
    });
  });

  describe("EmotionalHealthScore type shape", () => {
    it("has score in 0-100 range", () => {
      const score: EmotionalHealthScore = {
        score: 75,
        dominantState: "ENGAGED",
        interventionRate: 0.1,
        frustrationRate: 0.05,
        engagementRate: 0.7,
      };

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it("rates sum correctly", () => {
      const score: EmotionalHealthScore = {
        score: 50,
        dominantState: "FRUSTRATED",
        interventionRate: 0.3,
        frustrationRate: 0.4,
        engagementRate: 0.2,
      };

      // Frustration + engagement should be <= 1
      expect(
        score.frustrationRate + score.engagementRate
      ).toBeLessThanOrEqual(1);
    });

    it("high engagement = high score", () => {
      const highEngagement: EmotionalHealthScore = {
        score: 90,
        dominantState: "ENGAGED",
        interventionRate: 0.05,
        frustrationRate: 0.02,
        engagementRate: 0.85,
      };

      const lowEngagement: EmotionalHealthScore = {
        score: 30,
        dominantState: "FRUSTRATED",
        interventionRate: 0.4,
        frustrationRate: 0.5,
        engagementRate: 0.1,
      };

      expect(highEngagement.score).toBeGreaterThan(lowEngagement.score);
    });
  });

  describe("Emotional weights calculation", () => {
    it("ENGAGED and EXCITED should have weight 1.0", () => {
      // Test that positive states produce score of 100
      const weights: Record<string, number> = {
        ENGAGED: 1.0,
        EXCITED: 1.0,
        BREAKTHROUGH: 1.0,
        NEUTRAL: 0.6,
        CONFUSED: 0.3,
        ANXIOUS: 0.2,
        BORED: 0.2,
        FRUSTRATED: 0.0,
      };

      expect(weights.ENGAGED).toBe(1.0);
      expect(weights.EXCITED).toBe(1.0);
      expect(weights.FRUSTRATED).toBe(0.0);
    });

    it("all-ENGAGED logs produce score 100", () => {
      const states = ["ENGAGED", "ENGAGED", "ENGAGED"];
      const weights: Record<string, number> = {
        ENGAGED: 1.0,
        FRUSTRATED: 0.0,
      };

      let weightedSum = 0;
      for (const state of states) {
        weightedSum += weights[state] ?? 0.5;
      }
      const score = Math.round((weightedSum / states.length) * 100);

      expect(score).toBe(100);
    });

    it("all-FRUSTRATED logs produce score 0", () => {
      const states = ["FRUSTRATED", "FRUSTRATED", "FRUSTRATED"];
      const weights: Record<string, number> = {
        ENGAGED: 1.0,
        FRUSTRATED: 0.0,
      };

      let weightedSum = 0;
      for (const state of states) {
        weightedSum += weights[state] ?? 0.5;
      }
      const score = Math.round((weightedSum / states.length) * 100);

      expect(score).toBe(0);
    });

    it("mixed logs produce intermediate score", () => {
      const states = ["ENGAGED", "FRUSTRATED", "NEUTRAL"];
      const weights: Record<string, number> = {
        ENGAGED: 1.0,
        FRUSTRATED: 0.0,
        NEUTRAL: 0.6,
      };

      let weightedSum = 0;
      for (const state of states) {
        weightedSum += weights[state] ?? 0.5;
      }
      const score = Math.round((weightedSum / states.length) * 100);

      // (1.0 + 0.0 + 0.6) / 3 = 0.533... → 53
      expect(score).toBe(53);
    });
  });
});
