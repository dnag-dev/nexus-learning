/**
 * Scheduler Background Job — Phase 8: Spaced Repetition
 *
 * Calculates due nodes and creates review suggestions.
 * For now: runs on session start to check for due reviews.
 * Future: can be called by a cron job.
 */

import { getDueNodes } from "./scheduler";
import { getDueReviewSummary } from "./notifications";
import { createReviewReminder } from "./notifications";

// ─── Types ───

export interface ReviewSuggestion {
  hasDueReviews: boolean;
  dueCount: number;
  overdueCount: number;
  estimatedMinutes: number;
  urgency: "none" | "low" | "medium" | "high";
  message: string | null;
}

// ─── Main Job ───

/**
 * Check for due reviews on session start.
 * Returns a suggestion for the student to do a quick review.
 *
 * Called from POST /api/session/start before creating the session.
 */
export async function checkReviewsOnSessionStart(
  studentId: string,
  now?: Date
): Promise<ReviewSuggestion> {
  const currentTime = now ?? new Date();

  const summary = await getDueReviewSummary(studentId, currentTime);

  if (summary.dueNow === 0) {
    return {
      hasDueReviews: false,
      dueCount: 0,
      overdueCount: 0,
      estimatedMinutes: 0,
      urgency: "none",
      message: null,
    };
  }

  // Create a notification if needed
  await createReviewReminder(studentId, currentTime);

  // Build suggestion message
  let message: string;
  if (summary.overdueCount > 0) {
    message = `You have ${summary.overdueCount} overdue review${summary.overdueCount > 1 ? "s" : ""} — a quick ${summary.estimatedMinutes}-minute review will help keep your knowledge strong!`;
  } else {
    message = `${summary.dueNow} concept${summary.dueNow > 1 ? "s are" : " is"} ready for review — do a quick ${summary.estimatedMinutes}-minute review first?`;
  }

  return {
    hasDueReviews: true,
    dueCount: summary.dueNow,
    overdueCount: summary.overdueCount,
    estimatedMinutes: summary.estimatedMinutes,
    urgency: summary.urgency,
    message,
  };
}

/**
 * Calculate all due nodes for a student.
 * Can be called by a cron job or on-demand.
 */
export async function calculateDueNodes(
  studentId: string,
  now?: Date
) {
  const currentTime = now ?? new Date();
  return getDueNodes(studentId, currentTime);
}
