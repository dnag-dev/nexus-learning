/**
 * Activity Log Utility
 *
 * Logs student learning events for parent dashboard visibility.
 * All logging is fire-and-forget (non-blocking) — errors are caught
 * and logged to console but never thrown to callers.
 *
 * Usage:
 *   import { logActivity } from "@/lib/activity-log";
 *   await logActivity(studentId, "SESSION_COMPLETED", "Finished Fractions session", {
 *     detail: "Score: 92%, 4 questions answered",
 *     metadata: { sessionId, nodeCode: "MATH.3.NF.1", bkt: 0.87, xp: 45 },
 *   });
 *
 * Events are displayed in the parent dashboard Activity tab as a timeline.
 */

import { prisma } from "@aauti/db";
import type { Prisma } from "@prisma/client";

// Re-export the enum type for callers
export type ActivityEventType =
  | "SESSION_STARTED"
  | "SESSION_COMPLETED"
  | "CONCEPT_MASTERED"
  | "STEP_ADVANCED"
  | "STEP_FAILED"
  | "STREAK_MILESTONE"
  | "BADGE_EARNED"
  | "LEVEL_UP"
  | "BOSS_CHALLENGE_WON"
  | "BOSS_CHALLENGE_LOST"
  | "DIAGNOSTIC_COMPLETED"
  | "REVIEW_STARTED"
  | "FLUENCY_DRILL_COMPLETED"
  | "MAX_QUESTIONS_REACHED"
  | "PLAN_CREATED"
  | "GOAL_SET"
  // Phase 7: Expanded event types
  | "QUESTION_ANSWERED"
  | "GRADE_COMPLETED"
  | "GRADE_ADVANCED"
  | "SUBJECT_SWITCHED"
  | "TOPIC_SELECTED"
  | "HINT_USED"
  // Phase 13: Unit/Test-Out/Fluency Zone events
  | "TEST_OUT_PASSED"
  | "TEST_OUT_FAILED"
  | "UNIT_TEST_PASSED"
  | "UNIT_TEST_FAILED"
  | "COURSE_CHALLENGE_PASSED"
  | "COURSE_CHALLENGE_FAILED"
  | "FLUENCY_ZONE_COMPLETED";

interface LogOptions {
  /** Optional human-readable detail line */
  detail?: string;
  /** Structured metadata (sessionId, nodeCode, scores, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Log a student activity event.
 *
 * Fire-and-forget — never throws. Errors are caught and logged to console.
 */
export async function logActivity(
  studentId: string,
  eventType: ActivityEventType,
  title: string,
  options?: LogOptions
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        studentId,
        eventType: eventType as never, // Prisma enum cast
        title,
        detail: options?.detail ?? null,
        // Cast to Prisma.InputJsonValue — Record<string,unknown> is structurally
        // compatible but TypeScript needs the explicit assertion for Json? fields
        metadata: (options?.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    // Activity logging is non-critical — never fail the parent operation
    console.error("[ActivityLog] Failed to log event:", eventType, err);
  }
}

/**
 * Fetch activity log entries for a student.
 *
 * Used by the parent dashboard Activity tab API.
 */
export async function getActivityLog(
  studentId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventType?: ActivityEventType;
    since?: Date;
  }
) {
  const where: Record<string, unknown> = { studentId };

  if (options?.eventType) {
    where.eventType = options.eventType;
  }
  if (options?.since) {
    where.createdAt = { gte: options.since };
  }

  const [entries, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.activityLog.count({ where: where as never }),
  ]);

  return { entries, total };
}

/**
 * Get activity summary stats for a student (used in parent dashboard cards).
 */
export async function getActivitySummary(studentId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [todayCount, weekCount, conceptsMasteredWeek, sessionsWeek] =
    await Promise.all([
      prisma.activityLog.count({
        where: {
          studentId,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.activityLog.count({
        where: {
          studentId,
          createdAt: { gte: weekStart },
        },
      }),
      prisma.activityLog.count({
        where: {
          studentId,
          eventType: "CONCEPT_MASTERED",
          createdAt: { gte: weekStart },
        },
      }),
      prisma.activityLog.count({
        where: {
          studentId,
          eventType: "SESSION_COMPLETED",
          createdAt: { gte: weekStart },
        },
      }),
    ]);

  return {
    eventsToday: todayCount,
    eventsThisWeek: weekCount,
    conceptsMasteredThisWeek: conceptsMasteredWeek,
    sessionsCompletedThisWeek: sessionsWeek,
  };
}

// ─── Event-specific loggers (convenience wrappers) ───

export async function logSessionStarted(
  studentId: string,
  sessionId: string,
  nodeCode: string,
  nodeTitle: string
) {
  return logActivity(studentId, "SESSION_STARTED", `Started: ${nodeTitle}`, {
    metadata: { sessionId, nodeCode },
  });
}

export async function logSessionCompleted(
  studentId: string,
  sessionId: string,
  nodeTitle: string,
  questionsAnswered: number,
  correctAnswers: number,
  bkt: number
) {
  const accuracy = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;
  return logActivity(studentId, "SESSION_COMPLETED", `Completed: ${nodeTitle}`, {
    detail: `Score: ${accuracy}%, ${questionsAnswered} questions`,
    metadata: { sessionId, nodeCode: nodeTitle, questionsAnswered, correctAnswers, bkt },
  });
}

export async function logConceptMastered(
  studentId: string,
  nodeCode: string,
  nodeTitle: string,
  bkt: number
) {
  return logActivity(studentId, "CONCEPT_MASTERED", `Mastered: ${nodeTitle}`, {
    detail: `Mastery: ${Math.round(bkt * 100)}%`,
    metadata: { nodeCode, bkt },
  });
}

export async function logStepAdvanced(
  studentId: string,
  sessionId: string,
  fromStep: number,
  toStep: number
) {
  const STEP_NAMES = ["", "Learn", "Check", "Guided", "Practice", "Prove"];
  return logActivity(
    studentId,
    "STEP_ADVANCED",
    `Advanced: ${STEP_NAMES[fromStep]} → ${STEP_NAMES[toStep]}`,
    { metadata: { sessionId, fromStep, toStep } }
  );
}

export async function logBadgeEarned(
  studentId: string,
  badgeName: string,
  badgeId: string
) {
  return logActivity(studentId, "BADGE_EARNED", `Earned badge: ${badgeName}`, {
    metadata: { badgeId },
  });
}

export async function logLevelUp(
  studentId: string,
  newLevel: number,
  newTitle: string | null
) {
  return logActivity(studentId, "LEVEL_UP", `Reached Level ${newLevel}${newTitle ? ` — ${newTitle}` : ""}`, {
    metadata: { newLevel, newTitle },
  });
}

export async function logStreakMilestone(
  studentId: string,
  streak: number
) {
  return logActivity(studentId, "STREAK_MILESTONE", `${streak}-day streak!`, {
    metadata: { streak },
  });
}

// ─── Phase 7: Expanded event loggers ───

export async function logQuestionAnswered(
  studentId: string,
  sessionId: string,
  nodeCode: string,
  nodeTitle: string,
  isCorrect: boolean,
  masteryBefore: number,
  masteryAfter: number,
  step: number
) {
  return logActivity(
    studentId,
    "QUESTION_ANSWERED",
    `${isCorrect ? "✅" : "❌"} ${nodeTitle}`,
    {
      detail: `${Math.round(masteryBefore * 100)}% → ${Math.round(masteryAfter * 100)}%`,
      metadata: { sessionId, nodeCode, isCorrect, masteryBefore, masteryAfter, step },
    }
  );
}

export async function logGradeCompleted(
  studentId: string,
  grade: string,
  subject: string,
  totalNodes: number
) {
  const gradeDisplay = grade === "K" ? "Kindergarten" : `Grade ${grade.replace("G", "")}`;
  const subjectDisplay = subject === "MATH" ? "Math" : "English";
  return logActivity(
    studentId,
    "GRADE_COMPLETED",
    `🎓 ${gradeDisplay} ${subjectDisplay} — COMPLETE!`,
    {
      detail: `All ${totalNodes} topics mastered`,
      metadata: { grade, subject, totalNodes },
    }
  );
}

export async function logGradeAdvanced(
  studentId: string,
  fromGrade: string,
  toGrade: string,
  subject: string
) {
  const toDisplay = toGrade === "K" ? "Kindergarten" : `Grade ${toGrade.replace("G", "")}`;
  const subjectDisplay = subject === "MATH" ? "Math" : "English";
  return logActivity(
    studentId,
    "GRADE_ADVANCED",
    `🚀 Advanced to ${toDisplay} ${subjectDisplay}`,
    {
      detail: `Moving from ${fromGrade} to ${toGrade}`,
      metadata: { fromGrade, toGrade, subject },
    }
  );
}

export async function logTopicSelected(
  studentId: string,
  topic: string,
  nodeCode: string,
  nodeTitle: string,
  wasRedirected: boolean
) {
  return logActivity(
    studentId,
    "TOPIC_SELECTED",
    `Searched: "${topic}" → ${nodeTitle}`,
    {
      metadata: { topic, nodeCode, wasRedirected },
    }
  );
}
