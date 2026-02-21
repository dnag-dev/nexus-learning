/**
 * Ebbinghaus Scheduler — Phase 8: Spaced Repetition
 *
 * Implements the forgetting curve with SM-2 inspired intervals.
 *
 * Interval progression (correct reviews):
 *   Review 0 → 1 day  (new node)
 *   Review 1 → 3 days
 *   Review 2 → 7 days
 *   Review 3 → 16 days
 *   Review 4+ → interval * easinessFactor
 *
 * Incorrect review:
 *   Reset interval to 1 day
 *   Reduce easinessFactor by 0.2 (min 1.3)
 *
 * Easiness factor range: 1.3 – 2.5
 */

import { prisma } from "@aauti/db";

// ─── Types ───

export interface SchedulerInput {
  reviewCount: number;
  reviewInterval: number; // days
  easinessFactor: number;
  bktProbability: number;
  nextReviewAt: Date | null;
  lastPracticed: Date;
}

export interface SchedulerResult {
  nextReviewAt: Date;
  newInterval: number; // days
  newEasinessFactor: number;
  newReviewCount: number;
}

export interface ReviewForecast {
  date: string; // YYYY-MM-DD
  nodeCount: number;
  nodes: Array<{
    nodeId: string;
    nodeCode: string;
    nodeTitle: string;
    bktProbability: number;
    isOverdue: boolean;
  }>;
}

// ─── Constants ───

export const MIN_EASINESS = 1.3;
export const MAX_EASINESS = 2.5;
export const DEFAULT_EASINESS = 2.5;
export const EASINESS_DECREMENT = 0.2;

/** Fixed intervals for first 4 reviews (days) */
export const FIXED_INTERVALS = [1, 3, 7, 16] as const;

// ─── Core Algorithm ───

/**
 * Calculate the next review date after a review attempt.
 *
 * SM-2 inspired: fixed intervals for first few reviews,
 * then exponential growth via easiness factor.
 */
export function calculateNextReview(
  input: SchedulerInput,
  correct: boolean,
  now?: Date
): SchedulerResult {
  const currentTime = now ?? new Date();

  if (!correct) {
    // Incorrect: reset interval to 1, decrease easiness
    const newEasiness = Math.max(
      MIN_EASINESS,
      input.easinessFactor - EASINESS_DECREMENT
    );

    return {
      nextReviewAt: addDays(currentTime, 1),
      newInterval: 1,
      newEasinessFactor: newEasiness,
      newReviewCount: input.reviewCount + 1,
    };
  }

  // Correct: advance to next interval
  const newReviewCount = input.reviewCount + 1;
  let newInterval: number;

  if (newReviewCount <= FIXED_INTERVALS.length) {
    // Use fixed interval schedule for first 4 reviews
    newInterval = FIXED_INTERVALS[newReviewCount - 1];
  } else {
    // After 4th review: interval * easinessFactor
    newInterval = Math.round(input.reviewInterval * input.easinessFactor);
  }

  return {
    nextReviewAt: addDays(currentTime, newInterval),
    newInterval,
    newEasinessFactor: input.easinessFactor, // No change on correct
    newReviewCount,
  };
}

/**
 * Get the easiness factor for a mastery score.
 * Easiness ranges from 1.3 (hard) to 2.5 (easy).
 */
export function getEasinessFactor(input: {
  easinessFactor: number;
}): number {
  return Math.max(
    MIN_EASINESS,
    Math.min(MAX_EASINESS, input.easinessFactor)
  );
}

// ─── DB-backed Functions ───

/**
 * Get all nodes that are due for review (nextReviewAt <= now).
 */
export async function getDueNodes(studentId: string, now?: Date) {
  const currentTime = now ?? new Date();

  return prisma.masteryScore.findMany({
    where: {
      studentId,
      nextReviewAt: { lte: currentTime },
      // Only include nodes that have been practiced at least once
      practiceCount: { gte: 1 },
    },
    include: { node: true },
    orderBy: [{ nextReviewAt: "asc" }, { bktProbability: "asc" }],
  });
}

/**
 * Get overdue nodes (nextReviewAt more than 1 day past).
 */
export async function getOverdueNodes(studentId: string, now?: Date) {
  const currentTime = now ?? new Date();
  const oneDayAgo = addDays(currentTime, -1);

  return prisma.masteryScore.findMany({
    where: {
      studentId,
      nextReviewAt: { lte: oneDayAgo },
      practiceCount: { gte: 1 },
    },
    include: { node: true },
    orderBy: [{ nextReviewAt: "asc" }, { bktProbability: "asc" }],
  });
}

/**
 * Get upcoming reviews forecast for the next N days.
 */
export async function getUpcomingReviews(
  studentId: string,
  days: number = 7,
  now?: Date
): Promise<ReviewForecast[]> {
  const currentTime = now ?? new Date();
  const endDate = addDays(currentTime, days);

  const masteryScores = await prisma.masteryScore.findMany({
    where: {
      studentId,
      nextReviewAt: { lte: endDate },
      practiceCount: { gte: 1 },
    },
    include: { node: true },
    orderBy: { nextReviewAt: "asc" },
  });

  // Group by date
  const byDate = new Map<string, ReviewForecast>();

  for (let d = 0; d < days; d++) {
    const date = addDays(currentTime, d);
    const dateStr = date.toISOString().split("T")[0];
    byDate.set(dateStr, { date: dateStr, nodeCount: 0, nodes: [] });
  }

  for (const ms of masteryScores) {
    if (!ms.nextReviewAt) continue;

    const reviewDate = ms.nextReviewAt.toISOString().split("T")[0];
    const todayStr = currentTime.toISOString().split("T")[0];

    // If overdue, assign to today
    const assignDate = reviewDate < todayStr ? todayStr : reviewDate;

    const forecast = byDate.get(assignDate);
    if (forecast) {
      forecast.nodeCount++;
      forecast.nodes.push({
        nodeId: ms.nodeId,
        nodeCode: ms.node.nodeCode,
        nodeTitle: ms.node.title,
        bktProbability: ms.bktProbability,
        isOverdue: ms.nextReviewAt < currentTime,
      });
    }
  }

  return Array.from(byDate.values());
}

// ─── Helpers ───

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
