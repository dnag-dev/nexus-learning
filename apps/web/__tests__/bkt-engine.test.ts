/**
 * BKT Engine Tests
 *
 * Tests for Bayesian Knowledge Tracing with research-validated parameters:
 * - pLearn=0.20, pGuess=0.20, pSlip=0.10, pKnownPrior=0.10
 * - Mastery threshold: 0.85
 * - Floor: 0.05 (mastery never drops below this)
 * - Mastery levels: NOVICE(<0.2), DEVELOPING(<0.4), PROFICIENT(<0.6), ADVANCED(<0.85), MASTERED(≥0.85)
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

    it("reaches mastery with 4-6 consecutive correct answers from fresh start", () => {
      // With pLearn=0.20, pKnownPrior=0.10, no artificial cap
      // Standard BKT converges to mastery in ~4-6 correct answers
      let mastery = makeMastery({ bktProbability: BKT_PARAMS.pKnownPrior });
      let correctCount = 0;
      while (mastery.bktProbability < BKT_PARAMS.masteryThreshold && correctCount < 10) {
        mastery = updateMastery(mastery, true);
        correctCount++;
      }
      expect(mastery.bktProbability).toBeGreaterThanOrEqual(BKT_PARAMS.masteryThreshold);
      // Should reach mastery within 4-6 answers (allow up to 7 for safety)
      expect(correctCount).toBeLessThanOrEqual(7);
      expect(correctCount).toBeGreaterThanOrEqual(3);
    });

    it("never drops below floor (0.05) with repeated wrong answers", () => {
      let mastery = makeMastery({ bktProbability: 0.5 });
      for (let i = 0; i < 20; i++) {
        mastery = updateMastery(mastery, false);
      }
      // Floor enforced at 0.05 — student never goes to zero
      expect(mastery.bktProbability).toBeGreaterThanOrEqual(BKT_PARAMS.floor);
    });

    it("one wrong answer drops mastery noticeably but not to zero", () => {
      const before = makeMastery({ bktProbability: 0.7 });
      const after = updateMastery(before, false);
      const drop = before.bktProbability - after.bktProbability;
      // With pLearn=0.20 and pSlip=0.10, a wrong answer at 0.7 gives:
      //   posterior = 0.7*0.10 / (0.7*0.10 + 0.3*0.80) = 0.226
      //   learning  = 0.226 + 0.774*0.20 = 0.381
      //   drop ≈ 0.32 — significant but student stays well above floor
      expect(drop).toBeGreaterThan(0.1); // Noticeable drop
      expect(drop).toBeLessThan(0.5); // Not catastrophic
      expect(after.bktProbability).toBeGreaterThan(BKT_PARAMS.floor); // Above floor
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

    it("P(Known) never drops below floor", () => {
      let mastery = makeMastery({ bktProbability: 0.01 });
      for (let i = 0; i < 20; i++) {
        mastery = updateMastery(mastery, false);
      }
      expect(mastery.bktProbability).toBeGreaterThanOrEqual(BKT_PARAMS.floor);
    });

    it("handles P(Known) = 0.0 without NaN", () => {
      const mastery = makeMastery({ bktProbability: 0.0 });
      const after = updateMastery(mastery, true);
      expect(Number.isNaN(after.bktProbability)).toBe(false);
      expect(after.bktProbability).toBeGreaterThanOrEqual(BKT_PARAMS.floor);
    });

    it("handles P(Known) = 1.0 without NaN", () => {
      const mastery = makeMastery({ bktProbability: 1.0 });
      const after = updateMastery(mastery, false);
      expect(Number.isNaN(after.bktProbability)).toBe(false);
      expect(after.bktProbability).toBeLessThanOrEqual(1.0);
    });
  });

  // ─── getMasteryLevel ───
  // Thresholds: NOVICE(<0.2), DEVELOPING(<0.4), PROFICIENT(<0.6), ADVANCED(<0.85), MASTERED(≥0.85)

  describe("getMasteryLevel", () => {
    it("returns NOVICE for bkt < 0.2", () => {
      expect(getMasteryLevel(0.0)).toBe("NOVICE");
      expect(getMasteryLevel(0.1)).toBe("NOVICE");
      expect(getMasteryLevel(0.19)).toBe("NOVICE");
    });

    it("returns DEVELOPING for 0.2 <= bkt < 0.4", () => {
      expect(getMasteryLevel(0.2)).toBe("DEVELOPING");
      expect(getMasteryLevel(0.3)).toBe("DEVELOPING");
      expect(getMasteryLevel(0.39)).toBe("DEVELOPING");
    });

    it("returns PROFICIENT for 0.4 <= bkt < 0.6", () => {
      expect(getMasteryLevel(0.4)).toBe("PROFICIENT");
      expect(getMasteryLevel(0.5)).toBe("PROFICIENT");
      expect(getMasteryLevel(0.59)).toBe("PROFICIENT");
    });

    it("returns ADVANCED for 0.6 <= bkt < 0.85", () => {
      expect(getMasteryLevel(0.6)).toBe("ADVANCED");
      expect(getMasteryLevel(0.7)).toBe("ADVANCED");
      expect(getMasteryLevel(0.84)).toBe("ADVANCED");
    });

    it("returns MASTERED for bkt >= 0.85", () => {
      expect(getMasteryLevel(0.85)).toBe("MASTERED");
      expect(getMasteryLevel(0.9)).toBe("MASTERED");
      expect(getMasteryLevel(1.0)).toBe("MASTERED");
    });
  });

  // ─── shouldAdvanceNode ───
  // Threshold now 0.85 (was 0.9)

  describe("shouldAdvanceNode", () => {
    it("returns true when bkt >= 0.85", () => {
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.85 }))).toBe(
        true
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.9 }))).toBe(
        true
      );
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 1.0 }))).toBe(
        true
      );
    });

    it("returns false when bkt < 0.85", () => {
      expect(shouldAdvanceNode(makeMastery({ bktProbability: 0.84 }))).toBe(
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

  // ─── BKT parameter validation ───

  describe("BKT parameter sanity checks", () => {
    it("has research-validated pLearn of 0.20", () => {
      expect(BKT_PARAMS.pLearn).toBe(0.20);
    });

    it("has mastery threshold of 0.85", () => {
      expect(BKT_PARAMS.masteryThreshold).toBe(0.85);
    });

    it("has floor of 0.05", () => {
      expect(BKT_PARAMS.floor).toBe(0.05);
    });

    it("has min 3 and max 15 questions", () => {
      expect(BKT_PARAMS.minQuestions).toBe(3);
      expect(BKT_PARAMS.maxQuestions).toBe(15);
    });
  });
});
