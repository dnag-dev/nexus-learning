/**
 * Bayesian Knowledge Tracing — Pure Math Functions
 *
 * Extracted from apps/web/lib/session/bkt-engine.ts.
 * Only the pure math — no database access.
 */

// ─── BKT Parameters ───
// Research-validated values for K-12 adaptive learning.
// DO NOT change without running the full BKT test suite.
//
// With these parameters:
// - 4-6 consecutive correct → mastery (>=0.85)
// - 1 wrong answer drops ~10-15%, never resets to 0
// - Floor at 0.05 ensures students never feel "back to zero"

export const BKT_PARAMS = {
  /** Probability of learning on each opportunity (L) — 20% per attempt */
  pLearn: 0.20,
  /** Probability of guessing correctly without mastery (G) — 20% for 4-choice MCQs */
  pGuess: 0.20,
  /** Probability of slipping (wrong answer despite mastery) (S) — 10% */
  pSlip: 0.10,
  /** Prior probability of knowing the concept (L0) — student starts at 10% */
  pKnownPrior: 0.10,
  /** Mastery threshold — node "complete" at or above this probability */
  masteryThreshold: 0.85,
  /** Minimum questions before mastery can be declared */
  minQuestions: 3,
  /** Maximum questions per node per session */
  maxQuestions: 15,
  /** Floor — mastery never drops below this on wrong answers */
  floor: 0.05,
} as const;

// ─── Mastery Level Thresholds ───

export type MasteryLevelValue =
  | "NOVICE"
  | "DEVELOPING"
  | "PROFICIENT"
  | "ADVANCED"
  | "MASTERED";

export const MASTERY_THRESHOLDS: { max: number; level: MasteryLevelValue }[] = [
  { max: 0.2, level: "NOVICE" },
  { max: 0.4, level: "DEVELOPING" },
  { max: 0.6, level: "PROFICIENT" },
  { max: 0.85, level: "ADVANCED" },
  { max: 1.01, level: "MASTERED" },
];

/**
 * Get mastery level from BKT probability.
 */
export function getMasteryLevel(bktProbability: number): MasteryLevelValue {
  for (const threshold of MASTERY_THRESHOLDS) {
    if (bktProbability < threshold.max) {
      return threshold.level;
    }
  }
  return "MASTERED";
}

/**
 * Pure BKT update — calculates new mastery probability after an observation.
 *
 * @param prior - Current P(known) before this observation
 * @param correct - Whether the student answered correctly
 * @returns New P(known) after the observation
 */
export function updateBKT(prior: number, correct: boolean): number {
  const { pGuess, pSlip, pLearn, floor } = BKT_PARAMS;

  // Step 1: posterior update (Bayesian update given observation)
  let pKnownGivenObs: number;
  if (correct) {
    // P(known | correct) = P(correct | known) * P(known) / P(correct)
    const pCorrectIfKnown = 1 - pSlip;
    const pCorrect = pCorrectIfKnown * prior + pGuess * (1 - prior);
    pKnownGivenObs = (pCorrectIfKnown * prior) / pCorrect;
  } else {
    // P(known | wrong) = P(wrong | known) * P(known) / P(wrong)
    const pWrongIfKnown = pSlip;
    const pWrong = pWrongIfKnown * prior + (1 - pGuess) * (1 - prior);
    pKnownGivenObs = (pWrongIfKnown * prior) / pWrong;
  }

  // Step 2: learning transition
  const pKnownNew =
    pKnownGivenObs + (1 - pKnownGivenObs) * pLearn;

  // Step 3: apply floor
  return Math.max(floor, Math.min(1, pKnownNew));
}
