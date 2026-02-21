/**
 * Bayesian Knowledge Tracing (BKT) Engine
 *
 * Tracks mastery probability for each student-node pair using
 * the standard BKT model with 4 parameters.
 */

import { prisma } from "@aauti/db";
import { getSuccessors } from "@aauti/db";

// ─── BKT Parameters ───

export const BKT_PARAMS = {
  /** Probability of learning on each opportunity */
  pLearn: 0.3,
  /** Probability of guessing correctly without mastery */
  pGuess: 0.2,
  /** Probability of slipping (wrong answer despite mastery) */
  pSlip: 0.1,
  /** Prior probability of knowing the concept */
  pKnownPrior: 0.3,
} as const;

// ─── Mastery Level Thresholds ───

export type MasteryLevelValue =
  | "NOVICE"
  | "DEVELOPING"
  | "PROFICIENT"
  | "ADVANCED"
  | "MASTERED";

const MASTERY_THRESHOLDS: { max: number; level: MasteryLevelValue }[] = [
  { max: 0.3, level: "NOVICE" },
  { max: 0.5, level: "DEVELOPING" },
  { max: 0.7, level: "PROFICIENT" },
  { max: 0.9, level: "ADVANCED" },
  { max: 1.01, level: "MASTERED" },
];

const ADVANCE_THRESHOLD = 0.9;
const REVIEW_BKT_THRESHOLD = 0.7;
const REVIEW_DAYS_THRESHOLD = 3;

// ─── Core BKT Update ───

export interface MasteryData {
  bktProbability: number;
  level: MasteryLevelValue;
  practiceCount: number;
  correctCount: number;
  lastPracticed: Date;
  nextReviewAt: Date | null;
}

/**
 * Update mastery using the BKT formula.
 *
 * Step 1: Compute posterior P(Known | observation)
 *   If correct: P(K|correct) = P(K) * (1 - pSlip) / [P(K)*(1-pSlip) + (1-P(K))*pGuess]
 *   If wrong:   P(K|wrong)   = P(K) * pSlip / [P(K)*pSlip + (1-P(K))*(1-pGuess)]
 *
 * Step 2: Apply learning  P(K_new) = P(K|obs) + (1 - P(K|obs)) * pLearn
 */
export function updateMastery(
  current: MasteryData,
  correct: boolean
): MasteryData {
  const pK = current.bktProbability;
  const { pLearn, pGuess, pSlip } = BKT_PARAMS;

  // Step 1: Posterior
  let pPosterior: number;
  if (correct) {
    const numerator = pK * (1 - pSlip);
    const denominator = pK * (1 - pSlip) + (1 - pK) * pGuess;
    pPosterior = denominator > 0 ? numerator / denominator : pK;
  } else {
    const numerator = pK * pSlip;
    const denominator = pK * pSlip + (1 - pK) * (1 - pGuess);
    pPosterior = denominator > 0 ? numerator / denominator : pK;
  }

  // Step 2: Learning
  const pNew = pPosterior + (1 - pPosterior) * pLearn;

  // Clamp to [0, 1]
  const clamped = Math.max(0, Math.min(1, pNew));

  const newLevel = getMasteryLevel(clamped);
  const now = new Date();

  return {
    bktProbability: clamped,
    level: newLevel,
    practiceCount: current.practiceCount + 1,
    correctCount: current.correctCount + (correct ? 1 : 0),
    lastPracticed: now,
    nextReviewAt: computeNextReview(clamped, now),
  };
}

/**
 * Map a BKT probability to a MasteryLevel.
 */
export function getMasteryLevel(bktProbability: number): MasteryLevelValue {
  for (const { max, level } of MASTERY_THRESHOLDS) {
    if (bktProbability < max) return level;
  }
  return "MASTERED";
}

/**
 * Should the student advance to the next node?
 * Threshold: bktProbability >= 0.9
 */
export function shouldAdvanceNode(mastery: MasteryData): boolean {
  return mastery.bktProbability >= ADVANCE_THRESHOLD;
}

/**
 * Should this node be reviewed?
 * Condition: lastPracticed > 3 days ago AND bktProbability < 0.7
 */
export function shouldReviewNode(mastery: MasteryData): boolean {
  const daysSincePractice =
    (Date.now() - new Date(mastery.lastPracticed).getTime()) /
    (1000 * 60 * 60 * 24);
  return (
    daysSincePractice > REVIEW_DAYS_THRESHOLD &&
    mastery.bktProbability < REVIEW_BKT_THRESHOLD
  );
}

/**
 * Compute the next review date based on current mastery.
 * Higher mastery = longer intervals (spaced repetition).
 */
function computeNextReview(bkt: number, now: Date): Date | null {
  if (bkt < 0.5) return addDays(now, 1); // Review tomorrow
  if (bkt < 0.7) return addDays(now, 3); // Review in 3 days
  if (bkt < 0.9) return addDays(now, 7); // Review in a week
  return addDays(now, 21); // Mastered — review in 3 weeks
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─── DB-backed Functions ───

/**
 * Update a student's mastery score in the database.
 */
export async function updateMasteryInDB(
  studentId: string,
  nodeId: string,
  correct: boolean
): Promise<MasteryData> {
  // Fetch or create current mastery
  const existing = await prisma.masteryScore.findUnique({
    where: { studentId_nodeId: { studentId, nodeId } },
  });

  const current: MasteryData = existing
    ? {
        bktProbability: existing.bktProbability,
        level: existing.level as MasteryLevelValue,
        practiceCount: existing.practiceCount,
        correctCount: existing.correctCount,
        lastPracticed: existing.lastPracticed,
        nextReviewAt: existing.nextReviewAt,
      }
    : {
        bktProbability: BKT_PARAMS.pKnownPrior,
        level: "NOVICE",
        practiceCount: 0,
        correctCount: 0,
        lastPracticed: new Date(),
        nextReviewAt: null,
      };

  const updated = updateMastery(current, correct);

  await prisma.masteryScore.upsert({
    where: { studentId_nodeId: { studentId, nodeId } },
    update: {
      bktProbability: updated.bktProbability,
      level: updated.level,
      practiceCount: updated.practiceCount,
      correctCount: updated.correctCount,
      lastPracticed: updated.lastPracticed,
      nextReviewAt: updated.nextReviewAt,
    },
    create: {
      studentId,
      nodeId,
      bktProbability: updated.bktProbability,
      level: updated.level,
      practiceCount: updated.practiceCount,
      correctCount: updated.correctCount,
      lastPracticed: updated.lastPracticed,
      nextReviewAt: updated.nextReviewAt,
    },
  });

  return updated;
}

/**
 * Recommend the next knowledge node for a student.
 * Uses Neo4j successors of the current node, filters by mastery.
 */
export async function recommendNextNode(
  studentId: string,
  currentNodeCode: string
): Promise<{ nodeCode: string; title: string } | null> {
  // Get successors from Neo4j
  const successors = await getSuccessors(currentNodeCode);

  if (successors.length === 0) return null;

  // Check mastery for each successor
  for (const successor of successors) {
    const node = await prisma.knowledgeNode.findUnique({
      where: { nodeCode: successor.nodeCode },
    });
    if (!node) continue;

    const mastery = await prisma.masteryScore.findUnique({
      where: { studentId_nodeId: { studentId, nodeId: node.id } },
    });

    // Recommend the first successor that isn't mastered
    if (!mastery || mastery.bktProbability < ADVANCE_THRESHOLD) {
      return { nodeCode: node.nodeCode, title: node.title };
    }
  }

  // All successors mastered — return the first one for further practice
  return {
    nodeCode: successors[0].nodeCode,
    title: successors[0].title,
  };
}
