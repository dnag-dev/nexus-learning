/**
 * Spaced Repetition Scheduler Tests — Phase 8
 *
 * Tests:
 *  - Correct interval progression (1→3→7→16→exponential)
 *  - Easiness factor decrements on incorrect
 *  - Easiness factor floors at MIN_EASINESS (1.3)
 *  - Easiness factor unchanged on correct
 *  - Interval resets to 1 on incorrect answer
 *  - Review count increments
 *  - Next review date calculated correctly
 *  - Exponential growth after 4th review
 */

import { describe, it, expect } from "vitest";
import {
  calculateNextReview,
  getEasinessFactor,
  addDays,
  MIN_EASINESS,
  MAX_EASINESS,
  DEFAULT_EASINESS,
  EASINESS_DECREMENT,
  FIXED_INTERVALS,
  type SchedulerInput,
} from "../lib/spaced-repetition/scheduler";

// ─── Helpers ───

function makeInput(overrides: Partial<SchedulerInput> = {}): SchedulerInput {
  return {
    reviewCount: 0,
    reviewInterval: 1,
    easinessFactor: DEFAULT_EASINESS,
    bktProbability: 0.5,
    nextReviewAt: new Date("2024-01-01"),
    lastPracticed: new Date("2024-01-01"),
    ...overrides,
  };
}

const NOW = new Date("2024-01-15T12:00:00Z");

// ─── Tests ───

describe("Spaced Repetition Scheduler", () => {
  describe("calculateNextReview — correct answers", () => {
    it("first review: interval = 1 day", () => {
      const input = makeInput({ reviewCount: 0 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(1);
      expect(result.newReviewCount).toBe(1);
      expect(result.newEasinessFactor).toBe(DEFAULT_EASINESS);
    });

    it("second review: interval = 3 days", () => {
      const input = makeInput({ reviewCount: 1, reviewInterval: 1 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(3);
      expect(result.newReviewCount).toBe(2);
    });

    it("third review: interval = 7 days", () => {
      const input = makeInput({ reviewCount: 2, reviewInterval: 3 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(7);
      expect(result.newReviewCount).toBe(3);
    });

    it("fourth review: interval = 16 days", () => {
      const input = makeInput({ reviewCount: 3, reviewInterval: 7 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(16);
      expect(result.newReviewCount).toBe(4);
    });

    it("fifth review: interval = previous * easinessFactor (exponential)", () => {
      const input = makeInput({
        reviewCount: 4,
        reviewInterval: 16,
        easinessFactor: 2.5,
      });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(Math.round(16 * 2.5)); // 40
      expect(result.newReviewCount).toBe(5);
    });

    it("sixth review: continues exponential growth", () => {
      const input = makeInput({
        reviewCount: 5,
        reviewInterval: 40,
        easinessFactor: 2.5,
      });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newInterval).toBe(Math.round(40 * 2.5)); // 100
      expect(result.newReviewCount).toBe(6);
    });

    it("does not change easiness factor on correct", () => {
      const input = makeInput({ easinessFactor: 2.0 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newEasinessFactor).toBe(2.0);
    });

    it("calculates correct nextReviewAt date", () => {
      const input = makeInput({ reviewCount: 0 });
      const result = calculateNextReview(input, true, NOW);

      const expected = addDays(NOW, 1);
      expect(result.nextReviewAt.toISOString().split("T")[0]).toBe(
        expected.toISOString().split("T")[0]
      );
    });

    it("full interval progression: 1 → 3 → 7 → 16 → 40 → 100", () => {
      let input = makeInput({ reviewCount: 0, reviewInterval: 1 });
      const intervals: number[] = [];

      for (let i = 0; i < 6; i++) {
        const result = calculateNextReview(input, true, NOW);
        intervals.push(result.newInterval);
        input = makeInput({
          reviewCount: result.newReviewCount,
          reviewInterval: result.newInterval,
          easinessFactor: result.newEasinessFactor,
        });
      }

      expect(intervals).toEqual([1, 3, 7, 16, 40, 100]);
    });
  });

  describe("calculateNextReview — incorrect answers", () => {
    it("resets interval to 1 on incorrect answer", () => {
      const input = makeInput({
        reviewCount: 3,
        reviewInterval: 7,
      });
      const result = calculateNextReview(input, false, NOW);

      expect(result.newInterval).toBe(1);
    });

    it("decreases easiness factor by 0.2 on incorrect", () => {
      const input = makeInput({ easinessFactor: 2.5 });
      const result = calculateNextReview(input, false, NOW);

      expect(result.newEasinessFactor).toBe(2.5 - EASINESS_DECREMENT);
      expect(result.newEasinessFactor).toBe(2.3);
    });

    it("easiness factor floors at MIN_EASINESS (1.3)", () => {
      const input = makeInput({ easinessFactor: 1.4 });
      const result = calculateNextReview(input, false, NOW);

      expect(result.newEasinessFactor).toBe(MIN_EASINESS);
    });

    it("easiness factor does not go below 1.3 after multiple incorrects", () => {
      let input = makeInput({ easinessFactor: 2.5 });
      let ef = 2.5;

      for (let i = 0; i < 10; i++) {
        const result = calculateNextReview(input, false, NOW);
        ef = result.newEasinessFactor;
        input = makeInput({ ...input, easinessFactor: ef });
      }

      expect(ef).toBe(MIN_EASINESS);
    });

    it("increments review count on incorrect", () => {
      const input = makeInput({ reviewCount: 5 });
      const result = calculateNextReview(input, false, NOW);

      expect(result.newReviewCount).toBe(6);
    });

    it("sets nextReviewAt to tomorrow on incorrect", () => {
      const input = makeInput({ reviewCount: 5, reviewInterval: 40 });
      const result = calculateNextReview(input, false, NOW);

      const expected = addDays(NOW, 1);
      expect(result.nextReviewAt.toISOString().split("T")[0]).toBe(
        expected.toISOString().split("T")[0]
      );
    });
  });

  describe("calculateNextReview — edge cases", () => {
    it("handles reviewCount = 0 correctly", () => {
      const input = makeInput({ reviewCount: 0 });
      const result = calculateNextReview(input, true, NOW);

      expect(result.newReviewCount).toBe(1);
      expect(result.newInterval).toBe(FIXED_INTERVALS[0]);
    });

    it("uses default now when not provided", () => {
      const input = makeInput();
      const before = new Date();
      const result = calculateNextReview(input, true);
      const after = new Date();

      expect(result.nextReviewAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.nextReviewAt.getTime()).toBeLessThanOrEqual(
        after.getTime() + 24 * 60 * 60 * 1000 + 1000
      );
    });

    it("low easiness factor produces shorter intervals", () => {
      const lowEF = makeInput({
        reviewCount: 5,
        reviewInterval: 16,
        easinessFactor: 1.3,
      });
      const highEF = makeInput({
        reviewCount: 5,
        reviewInterval: 16,
        easinessFactor: 2.5,
      });

      const lowResult = calculateNextReview(lowEF, true, NOW);
      const highResult = calculateNextReview(highEF, true, NOW);

      expect(lowResult.newInterval).toBeLessThan(highResult.newInterval);
    });
  });

  describe("getEasinessFactor", () => {
    it("returns easiness factor within bounds", () => {
      expect(getEasinessFactor({ easinessFactor: 2.5 })).toBe(2.5);
      expect(getEasinessFactor({ easinessFactor: 1.3 })).toBe(1.3);
    });

    it("clamps below MIN_EASINESS", () => {
      expect(getEasinessFactor({ easinessFactor: 0.5 })).toBe(MIN_EASINESS);
    });

    it("clamps above MAX_EASINESS", () => {
      expect(getEasinessFactor({ easinessFactor: 5.0 })).toBe(MAX_EASINESS);
    });
  });

  describe("addDays helper", () => {
    it("adds positive days", () => {
      const base = new Date("2024-01-01");
      const result = addDays(base, 5);
      expect(result.toISOString().split("T")[0]).toBe("2024-01-06");
    });

    it("adds negative days", () => {
      const base = new Date("2024-01-10");
      const result = addDays(base, -3);
      expect(result.toISOString().split("T")[0]).toBe("2024-01-07");
    });

    it("does not mutate original date", () => {
      const base = new Date("2024-01-01");
      const original = base.toISOString();
      addDays(base, 5);
      expect(base.toISOString()).toBe(original);
    });
  });

  describe("constants", () => {
    it("FIXED_INTERVALS has 4 entries: [1, 3, 7, 16]", () => {
      expect(FIXED_INTERVALS).toEqual([1, 3, 7, 16]);
      expect(FIXED_INTERVALS.length).toBe(4);
    });

    it("MIN_EASINESS = 1.3", () => {
      expect(MIN_EASINESS).toBe(1.3);
    });

    it("MAX_EASINESS = 2.5", () => {
      expect(MAX_EASINESS).toBe(2.5);
    });

    it("DEFAULT_EASINESS = 2.5", () => {
      expect(DEFAULT_EASINESS).toBe(2.5);
    });

    it("EASINESS_DECREMENT = 0.2", () => {
      expect(EASINESS_DECREMENT).toBe(0.2);
    });
  });
});
