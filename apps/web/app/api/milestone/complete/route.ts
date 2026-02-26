/**
 * POST /api/milestone/complete
 *
 * Evaluates a completed milestone assessment.
 * Determines pass/fail (75% threshold), saves result,
 * and triggers appropriate follow-up actions.
 */

import { NextResponse } from "next/server";
import {
  getMilestoneSession,
  deleteMilestoneSession,
  evaluateMilestone,
  saveMilestoneResult,
} from "@/lib/learning-plan/milestone-assessor";
import { recalculatePlanETA } from "@/lib/learning-plan/eta-calculator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionKey } = body as { sessionKey?: string };

    if (!sessionKey) {
      return NextResponse.json(
        { error: "sessionKey is required" },
        { status: 400 }
      );
    }

    const session = getMilestoneSession(sessionKey);
    if (!session) {
      return NextResponse.json(
        { error: "Milestone session not found or expired" },
        { status: 404 }
      );
    }

    // Verify all questions were answered
    if (session.answers.size < session.questions.length) {
      return NextResponse.json(
        {
          error: `Only ${session.answers.size}/${session.questions.length} questions answered`,
          answeredCount: session.answers.size,
          totalQuestions: session.questions.length,
        },
        { status: 400 }
      );
    }

    // Evaluate the milestone
    const evaluation = evaluateMilestone(session.questions, session.answers);

    // Get concepts covered
    const conceptsCovered = [
      ...new Set(session.questions.map((q) => q.conceptCode)),
    ];

    // Save the result to database
    const { milestoneId, reviewConceptsAdded } = await saveMilestoneResult(
      session.planId,
      session.weekNumber,
      evaluation,
      conceptsCovered
    );

    // Recalculate ETA after milestone (async, non-blocking)
    let etaUpdate = null;
    try {
      etaUpdate = await recalculatePlanETA(session.planId);
    } catch (e) {
      console.error(
        "[milestone/complete] ETA recalculation error (non-critical):",
        e
      );
    }

    // Calculate time taken
    const timeTakenSeconds = Math.round(
      (Date.now() - session.startedAt.getTime()) / 1000
    );

    // Clean up the session
    deleteMilestoneSession(sessionKey);

    return NextResponse.json({
      milestoneId,
      weekNumber: session.weekNumber,
      planId: session.planId,
      passed: evaluation.passed,
      score: evaluation.score,
      totalCorrect: evaluation.totalCorrect,
      totalQuestions: evaluation.totalQuestions,
      conceptResults: evaluation.conceptResults,
      failedConcepts: evaluation.failedConcepts,
      reviewConceptsAdded,
      message: evaluation.message,
      encouragement: evaluation.encouragement,
      timeTakenSeconds,
      timeTakenFormatted: formatDuration(timeTakenSeconds),
      etaUpdate: etaUpdate
        ? {
            progressPercentage: etaUpdate.progressPercentage,
            isAheadOfSchedule: etaUpdate.isAheadOfSchedule,
            projectedCompletionDate: etaUpdate.projectedCompletionDate,
          }
        : null,
    });
  } catch (err) {
    console.error("[milestone/complete] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to complete milestone",
      },
      { status: 500 }
    );
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}m ${secs}s`;
}
