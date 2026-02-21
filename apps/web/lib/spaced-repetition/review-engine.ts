/**
 * Review Session Engine — Phase 8: Spaced Repetition
 *
 * Dedicated session type for spaced repetition reviews.
 * Builds review sessions from due nodes, processes answers,
 * and updates scheduler state.
 */

import { prisma } from "@aauti/db";
import { updateMastery, getMasteryLevel } from "../session/bkt-engine";
import type { MasteryData } from "../session/bkt-engine";
import {
  calculateNextReview,
  getDueNodes,
  addDays,
  type SchedulerInput,
} from "./scheduler";
import { awardXP, type XPSource } from "../gamification/xp";
import { getEventBus, createEvent } from "../gamification/event-bus";

// ─── Types ───

export interface ReviewSession {
  sessionId: string;
  studentId: string;
  nodeCount: number;
  nodes: ReviewNode[];
  estimatedMinutes: number;
}

export interface ReviewNode {
  nodeId: string;
  nodeCode: string;
  title: string;
  description: string;
  domain: string;
  gradeLevel: string;
  difficulty: number;
  bktProbability: number;
  isOverdue: boolean;
  isRefresher: boolean;
}

export interface ReviewResult {
  correct: boolean;
  nodeId: string;
  nodeCode: string;
  nodeTitle: string;
  previousBKT: number;
  newBKT: number;
  newLevel: string;
  nextReviewAt: Date;
  newInterval: number;
  xpAwarded: number;
  newXP: number;
}

export interface ReviewSummary {
  sessionId: string;
  totalNodes: number;
  reviewedNodes: number;
  correctCount: number;
  incorrectCount: number;
  retentionRate: number;
  xpEarned: number;
  results: Array<{
    nodeCode: string;
    nodeTitle: string;
    correct: boolean;
    nextReviewAt: Date;
    newInterval: number;
  }>;
}

// ─── Constants ───

const MAX_REVIEW_NODES = 10;
const REFRESHER_COUNT = 3;
const REFRESHER_STALE_DAYS = 14;
const MINUTES_PER_NODE = 2;

// XP amounts for review answers
export const REVIEW_XP = {
  correct: 15,
  incorrect: 5, // Showing up counts
} as const;

// ─── Build Review Session ───

/**
 * Build a review session from due and refresher nodes.
 *
 * 1. Fetch all due nodes, sort by overdue first + lowest BKT
 * 2. Cap at MAX_REVIEW_NODES
 * 3. Mix in REFRESHER_COUNT "refresher" nodes (mastered but stale)
 */
export async function buildReviewSession(
  studentId: string,
  now?: Date
): Promise<ReviewSession | null> {
  const currentTime = now ?? new Date();

  // 1. Get due nodes
  const dueScores = await getDueNodes(studentId, currentTime);

  if (dueScores.length === 0) {
    // No due nodes — check if there are any refresher candidates
    const refreshers = await getRefresherNodes(studentId, currentTime, REFRESHER_COUNT);
    if (refreshers.length === 0) return null;

    // Create session with only refreshers
    return await createReviewSession(studentId, [], refreshers);
  }

  // 2. Sort: overdue first (by how overdue), then by lowest BKT
  const oneDayAgo = addDays(currentTime, -1);
  const sortedDue = dueScores.sort((a, b) => {
    const aOverdue = a.nextReviewAt && a.nextReviewAt < oneDayAgo;
    const bOverdue = b.nextReviewAt && b.nextReviewAt < oneDayAgo;

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return a.bktProbability - b.bktProbability;
  });

  // 3. Cap at MAX_REVIEW_NODES - REFRESHER_COUNT
  const mainSlots = MAX_REVIEW_NODES - REFRESHER_COUNT;
  const mainNodes = sortedDue.slice(0, mainSlots);

  // 4. Get refresher nodes (mastered but not reviewed recently)
  const mainNodeIds = new Set(mainNodes.map((n) => n.nodeId));
  const refreshers = await getRefresherNodes(
    studentId,
    currentTime,
    REFRESHER_COUNT,
    mainNodeIds
  );

  return await createReviewSession(studentId, mainNodes, refreshers);
}

/**
 * Get refresher nodes — mastered but not reviewed in 14+ days.
 */
async function getRefresherNodes(
  studentId: string,
  now: Date,
  count: number,
  excludeIds?: Set<string>
) {
  const staleDate = addDays(now, -REFRESHER_STALE_DAYS);

  const candidates = await prisma.masteryScore.findMany({
    where: {
      studentId,
      level: "MASTERED",
      lastPracticed: { lte: staleDate },
      practiceCount: { gte: 1 },
    },
    include: { node: true },
    orderBy: { lastPracticed: "asc" },
    take: count * 2, // Fetch more to filter
  });

  return candidates
    .filter((c) => !excludeIds || !excludeIds.has(c.nodeId))
    .slice(0, count);
}

/**
 * Create the review session in DB and return ReviewSession object.
 */
async function createReviewSession(
  studentId: string,
  mainScores: Array<{
    nodeId: string;
    bktProbability: number;
    nextReviewAt: Date | null;
    node: { nodeCode: string; title: string; description: string; domain: string; gradeLevel: string; difficulty: number };
  }>,
  refresherScores: Array<{
    nodeId: string;
    bktProbability: number;
    nextReviewAt: Date | null;
    node: { nodeCode: string; title: string; description: string; domain: string; gradeLevel: string; difficulty: number };
  }>
): Promise<ReviewSession> {
  const now = new Date();
  const allNodeIds = [
    ...mainScores.map((s) => s.nodeId),
    ...refresherScores.map((s) => s.nodeId),
  ];

  // Create the session in DB
  const session = await prisma.learningSession.create({
    data: {
      studentId,
      sessionType: "REVIEW",
      state: "REVIEW",
      reviewNodeIds: allNodeIds,
      completedNodeIds: [],
    },
  });

  // Build review nodes
  const nodes: ReviewNode[] = [
    ...mainScores.map((s) => ({
      nodeId: s.nodeId,
      nodeCode: s.node.nodeCode,
      title: s.node.title,
      description: s.node.description,
      domain: s.node.domain,
      gradeLevel: s.node.gradeLevel,
      difficulty: s.node.difficulty,
      bktProbability: s.bktProbability,
      isOverdue: s.nextReviewAt ? s.nextReviewAt < now : false,
      isRefresher: false,
    })),
    ...refresherScores.map((s) => ({
      nodeId: s.nodeId,
      nodeCode: s.node.nodeCode,
      title: s.node.title,
      description: s.node.description,
      domain: s.node.domain,
      gradeLevel: s.node.gradeLevel,
      difficulty: s.node.difficulty,
      bktProbability: s.bktProbability,
      isOverdue: false,
      isRefresher: true,
    })),
  ];

  return {
    sessionId: session.id,
    studentId,
    nodeCount: nodes.length,
    nodes,
    estimatedMinutes: nodes.length * MINUTES_PER_NODE,
  };
}

// ─── Process Review Answer ───

/**
 * Process a review answer for a specific node.
 *
 * 1. Update BKT mastery
 * 2. Calculate next review via scheduler
 * 3. Award XP (correct: 15, incorrect: 5)
 * 4. Fire gamification events
 * 5. Update session progress
 */
export async function processReviewAnswer(
  sessionId: string,
  nodeId: string,
  correct: boolean
): Promise<ReviewResult> {
  // Fetch session
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { student: true },
  });
  if (!session) throw new Error("Review session not found");

  // Fetch mastery score
  const mastery = await prisma.masteryScore.findUnique({
    where: { studentId_nodeId: { studentId: session.studentId, nodeId } },
    include: { node: true },
  });
  if (!mastery) throw new Error("Mastery score not found for node");

  const previousBKT = mastery.bktProbability;

  // 1. Update BKT
  const currentMastery: MasteryData = {
    bktProbability: mastery.bktProbability,
    level: mastery.level as MasteryData["level"],
    practiceCount: mastery.practiceCount,
    correctCount: mastery.correctCount,
    lastPracticed: mastery.lastPracticed,
    nextReviewAt: mastery.nextReviewAt,
  };

  const updatedMastery = updateMastery(currentMastery, correct);

  // 2. Calculate next review via SM-2 scheduler
  const schedulerInput: SchedulerInput = {
    reviewCount: mastery.reviewCount,
    reviewInterval: mastery.reviewInterval,
    easinessFactor: mastery.easinessFactor,
    bktProbability: updatedMastery.bktProbability,
    nextReviewAt: mastery.nextReviewAt,
    lastPracticed: mastery.lastPracticed,
  };

  const schedulerResult = calculateNextReview(schedulerInput, correct);

  // 3. Update mastery score in DB with both BKT and scheduler data
  await prisma.masteryScore.update({
    where: { studentId_nodeId: { studentId: session.studentId, nodeId } },
    data: {
      bktProbability: updatedMastery.bktProbability,
      level: updatedMastery.level,
      practiceCount: updatedMastery.practiceCount,
      correctCount: updatedMastery.correctCount,
      lastPracticed: updatedMastery.lastPracticed,
      nextReviewAt: schedulerResult.nextReviewAt,
      easinessFactor: schedulerResult.newEasinessFactor,
      reviewCount: schedulerResult.newReviewCount,
      reviewInterval: schedulerResult.newInterval,
    },
  });

  // 4. Award XP
  const xpAmount = correct ? REVIEW_XP.correct : REVIEW_XP.incorrect;
  const student = session.student;
  const xpResult = awardXP(student.xp, student.level, "correct_answer", xpAmount);

  await prisma.student.update({
    where: { id: session.studentId },
    data: { xp: xpResult.newXP, level: xpResult.newLevel },
  });

  // 5. Fire gamification events
  const bus = getEventBus();
  const eventType = correct ? "review_passed" : "review_failed";
  bus.fire(
    createEvent(eventType, session.studentId, {
      nodeId,
      nodeCode: mastery.node.nodeCode,
      nodeTitle: mastery.node.title,
      xpAwarded: xpAmount,
      previousBKT,
      newBKT: updatedMastery.bktProbability,
    })
  );

  if (xpResult.leveledUp) {
    bus.fire(
      createEvent("level_up", session.studentId, {
        newLevel: xpResult.newLevel,
        newTitle: xpResult.newTitle,
      })
    );
  }

  // 6. Update session progress
  await prisma.learningSession.update({
    where: { id: sessionId },
    data: {
      questionsAnswered: { increment: 1 },
      correctAnswers: { increment: correct ? 1 : 0 },
      completedNodeIds: { push: nodeId },
    },
  });

  return {
    correct,
    nodeId,
    nodeCode: mastery.node.nodeCode,
    nodeTitle: mastery.node.title,
    previousBKT,
    newBKT: updatedMastery.bktProbability,
    newLevel: updatedMastery.level,
    nextReviewAt: schedulerResult.nextReviewAt,
    newInterval: schedulerResult.newInterval,
    xpAwarded: xpAmount,
    newXP: xpResult.newXP,
  };
}

// ─── Review Summary ───

/**
 * Get summary of a completed review session.
 */
export async function getReviewSummary(
  sessionId: string
): Promise<ReviewSummary | null> {
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) return null;

  // Get mastery scores for all reviewed nodes
  const completedIds = session.completedNodeIds;
  const masteryScores = await prisma.masteryScore.findMany({
    where: {
      studentId: session.studentId,
      nodeId: { in: completedIds },
    },
    include: { node: true },
  });

  const correctCount = session.correctAnswers;
  const totalReviewed = session.questionsAnswered;
  const incorrectCount = totalReviewed - correctCount;
  const retentionRate =
    totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0;

  const xpEarned =
    correctCount * REVIEW_XP.correct + incorrectCount * REVIEW_XP.incorrect;

  const results = masteryScores.map((ms) => ({
    nodeCode: ms.node.nodeCode,
    nodeTitle: ms.node.title,
    correct: true, // We don't track per-node correctness in session, will be approximate
    nextReviewAt: ms.nextReviewAt ?? new Date(),
    newInterval: ms.reviewInterval,
  }));

  // Update session with retention rate
  await prisma.learningSession.update({
    where: { id: sessionId },
    data: { retentionRate },
  });

  return {
    sessionId,
    totalNodes: session.reviewNodeIds.length,
    reviewedNodes: totalReviewed,
    correctCount,
    incorrectCount,
    retentionRate,
    xpEarned,
    results,
  };
}
