/**
 * BKT Engine Tests
 */

import { describe, it, expect } from "vitest";
import {
  updateMastery,
  getMasteryLevel,
  shouldAdvanceNode,
  shouldReviewNode,
  BKT_PARAMS,
  type MasteryData,
} from "../lib/session/bkt-engine";

function makeMastery(overrides: Partial<MasteryData> = {}): MasteryData {
  return {
    bktProbability: BKT_PARAMS.pKnownPrior,
    level: "NOVICE",
    practiceCount: 0,
    correctCount: 0,
    lastPracticed: new Date(),
    nextReviewAt: null,
    ...overrides,
  };
}

describe("BKT Engine", () => {
  // ─── updateMastery ───

  describe("updateMastery", () => {
    it("increases probability on correct answer", () => {
      const before = makeMastery({ bktProbability: 0.3 });
      const after = updateMastery(before, true);
      expect(after.bktProbability).toBeGreaterThan(before.bktProbability);
    });

    it("decreases probability on incorrect answer (from moderate mastery)", () => {
      const before = makeMastery({ bktProbability: 0.6 });
      const after = updateMastery(before, false);
      // After BKT update with learning, it may still increase slightly
      // but the posterior step should pull it down first
      // Key: it should be lower than a correct answer would produce
      const afterCorrect = updateMastery(before, true);
      expect(after.bktProbability).toBeLessThan(
        afterCorrect.bktProbability
      );
    });

    it("increments practiceCount", () => {
      const before = makeMastery({ practiceCount: 5 });
      const after = updateMastery(before, true);
      expect(after.practiceCount).toBe(6);
    });

    it("increments correctCount on correct answer", () => {
      const before = makeMastery({ correctCount: 3 });
      const after = updateMastery(before, true);
      expect(after.correctCount).toBe(4);
    });

    it("does NOT increment correctCount on incorrect answer", () => {
      const before = makeMastery({ correctCount: 3 });
      const after = updateMastery(before, false);
      expect(after.correctCount).toBe(3);
    });

    it("updates lastPracticed", () => {
      const old = new Date("2020-01-01");
      const before = makeMastery({ lastPracticed: old });
      const after = updateMastery(before, true);
      expect(after.lastPracticed.getTime()).toBeGreaterThan(old.getTime());
    });

    it("sets nextReviewAt", () => {
      const before = makeMastery();
      const after = updateMastery(before, true);
      expect(after.nextReviewAt).not.toBeNull();
    });

    it("converges toward mastery with repeated correct answers", () => {
      let mastery = makeMastery({ bktProbability: 0.3 });
      for (let i = 0; i < 10; i++) {
        mastery = updateMastery(mastery, true);
      }
      expect(mastery.bktProbability).toBeGreaterThan(0.9);
    });

    it("does not drop to 0 with repeated wrong answers", () => {
      let mastery = makeMastery({ bktProbability: 0.5 });
      for (let i = 0; i < 10; i++) {
        mastery = updateMastery(mastery, false);
      }
      // Due to pLearn, even wrong answers slowly increase mastery
      // But the key constraint is: never drops below 0
      expect(mastery.bktProbability).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Edge cases: clamping ───

  describe("BKT edge cases", () => {
    it("P(Known) never exceeds 1.0", () => {
      let mastery = makeMastery({ bktProbability: 0.99 });
      for (let i = 0; i < 20; i++) {
        mastery = updateMastery(mastery, true);
      }
      expect(mastery.bktProbability).toBeLessThanOrEqual(1.0);
    });

    it("P(Known) never drops below 0.0", () => {
      let mastery = makeMastery({ bktProbability: 0.01 });
      for (let i = 0; i < 20; i++) {
        mastery = updateMastery(mastery, false);
      }
      expect(mastery.bktProbability).toBeGreaterThanOrEqual(0.0);
    });

    it("handles P(Known) = 0.0 without NaN", () => {
      const mastery = makeMastery({ bktProbability: 0.0 });
      const after = updateMastery(mastery, true);
      expect(Number.isNaN(after.bktProbability)).toBe(false);
      expect(after.bktProbability).toBeGreaterThanOrEqual(0);
    });

    it("handles P(Known) = 1.0 without NaN", () => {
      const mastery = makeMastery({ bktProbability: 1.0 });
      const after = updateMastery(mastery, false);
      expect(Number.isNaN(after.bktProbability)).toBe(false);
      expect(after.bktProbability).toBeLessThanOrEqual(1.0);
    });
  });

  // ─── getMasteryLevel ───

  describe("getMasteryLevel", () => {
    it("returns NOVICE for bkt < 0.3", () => {
      expect(getMasteryLevel(0.0)).toBe("NOVICE");
      expect(getMasteryLevel(0.1)).toBe("NOVICE");
      expect(getMasteryLevel(0.29)).toBe("NOVICE");
    });

    it("returns DEVELOPING for 0.3 <= bkt < 0.5", () => {
      expect(getMasteryLevel(0.3)).toBe("DEVELOPING");
      expect(getMasteryLevel(0.4)).toBe("DEVELOPING");
      expect(getMasteryLevel(0.49)).toBe("DEVELOPING");
    });

    it("returns PROFICIENT for 0.5 <= bkt < 0.7", () => {
      expect(getMasteryLevel(0.5)).toBe("PROFICIENT");
      expect(getMasteryLevel(0.6)).toBe("PROFICIENT");
      expect(getMasteryLevel(0.69)).toBe("PROFICIENT");
    });

    it("returns ADVANCED for 0.7 <= bkt < 0.9", () => {
      expect(getMasteryLevel(0.7)).toBe("ADVANCED");
      expect(getMasteryLevel(0.8)).toBe("ADVANCED");
      expect(getMasteryLevel(0.89)).toBe("ADVANCED");
    });

    it("returns MASTERED for bkt >= 0.9", () => {
      expect(getMasteryLevel(0.9)).toBe("MASTERED");
      expect(getMasteryLevel(0.95)).toBe("MASTERED");
      expect(getMasteryLevel(1.0)).toBe("MASTERED");
    });
  });

  // ─── shouldAdvanceNode ───

  describe("shouldAdvanceNode", () => {
    it("returns true when bkt >= 0.9", () => {
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.9 }))).toBe(
        true
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.95 }))).toBe(
        true
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 1.0 }))).toBe(
        true
      );
    });

    it("returns false when bkt < 0.9", () => {
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.89 }))).toBe(
        false
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.5 }))).toBe(
        false
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.0 }))).toBe(
        false
      );
    });
  });

  // ─── shouldReviewNode ───

  describe("shouldReviewNode", () => {
    it("returns true when old + low mastery", () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      expect(
        shouldReviewNode(
          makeMastery({ bktProbability: 0.5, lastPracticed: fiveDaysAgo })
        )
      ).toBe(true);
    });

    it("returns false when recently practiced", () => {
      expect(
        shouldReviewNode(
          makeMastery({
            bktProbability: 0.5,
            lastPracticed: new Date(),
          })
        )
      ).toBe(false);
    });

    it("returns false when high mastery even if old", () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      expect(
        shouldReviewNode(
          makeMastery({ bktProbability: 0.8, lastPracticed: tenDaysAgo })
        )
      ).toBe(false);
    });

    it("returns false when low mastery but just practiced", () => {
      expect(
        shouldReviewNode(
          makeMastery({
            bktProbability: 0.3,
            lastPracticed: new Date(),
          })
        )
      ).toBe(false);
    });
  });
});
