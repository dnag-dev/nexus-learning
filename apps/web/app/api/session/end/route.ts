/**
 * POST /api/session/end
 *
 * Ends a learning session and returns an enriched summary including:
 * - Subject-grouped mastery (Phase 1)
 * - Grade-level progress across all time (Phase 2)
 * - Subject-split XP earned this session (Phase 3)
 * - Next-up node per subject (Phase 4)
 * - Streak data for momentum display (Phase 6)
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { processSessionComplete } from "@/lib/gamification/gamification-service";
import { updatePlansAfterSession } from "@/lib/learning-plan/eta-calculator";
import { adaptPlansAfterSession } from "@/lib/learning-plan/plan-adapter";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { student: true, currentNode: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.state === "COMPLETED") {
      return NextResponse.json({
        state: "COMPLETED",
        message: "Session already completed",
        summary: await buildSummary(session.id, session.studentId),
      });
    }

    // Transition to COMPLETED
    const result = await transitionState(
      sessionId,
      "COMPLETED",
      "END_SESSION",
      { reason: "user_ended" }
    );

    // Update emotional state at end
    const lastEmotion = await prisma.emotionalLog.findFirst({
      where: { sessionId },
      orderBy: { timestamp: "desc" },
    });

    if (lastEmotion) {
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: { emotionalStateAtEnd: lastEmotion.detectedState },
      });
    }

    const summary = await buildSummary(sessionId, session.studentId);

    // ═══ GAMIFICATION: Process session completion ═══
    // Awards session XP, updates streak, checks badges, checks perfect session
    let gamification = null;
    try {
      gamification = await processSessionComplete(session.studentId, sessionId);
    } catch (e) {
      console.error("Gamification session-end error (non-critical):", e);
    }

    // ═══ GPS: Recalculate ETA for all active learning plans ═══
    // Updates projected completion dates, velocity, and generates insights
    let gpsUpdate = null;
    try {
      gpsUpdate = await updatePlansAfterSession(session.studentId, sessionId);
    } catch (e) {
      console.error("GPS plan update error (non-critical):", e);
    }

    // ═══ GPS: Adapt learning plans based on session performance ═══
    // Runs 6 adaptation rules (pacing, inactivity, failed reviews, schedule)
    let planAdaptation = null;
    try {
      planAdaptation = await adaptPlansAfterSession(session.studentId, sessionId);
    } catch (e) {
      console.error("GPS plan adaptation error (non-critical):", e);
    }

    // ═══ GPS: Build plan-aware navigation context ═══
    // If session was part of a learning plan, provide GPS redirect info
    let gpsNavigation = null;
    if (session.planId) {
      try {
        const plan = await prisma.learningPlan.findUnique({
          where: { id: session.planId },
          include: { goal: true },
        });
        if (plan) {
          const progress = plan.conceptSequence.length > 0
            ? Math.round((plan.currentConceptIndex / plan.conceptSequence.length) * 100)
            : 0;
          gpsNavigation = {
            planId: plan.id,
            goalName: plan.goal.name,
            progress,
            isAheadOfSchedule: plan.isAheadOfSchedule,
            redirectUrl: `/gps?studentId=${session.studentId}`,
          };
        }
      } catch (e) {
        console.error("GPS navigation build error (non-critical):", e);
      }
    }

    // Check if student has any active plans (for GPS redirect suggestion)
    let hasActivePlans = false;
    if (!gpsNavigation) {
      try {
        const activePlanCount = await prisma.learningPlan.count({
          where: { studentId: session.studentId, status: "ACTIVE" },
        });
        hasActivePlans = activePlanCount > 0;
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      state: result.newState,
      recommendedAction: result.recommendedAction,
      summary,
      gamification,
      gpsUpdate,
      planAdaptation: planAdaptation
        ? {
            adaptationsCount: planAdaptation.adaptations.length,
            message: planAdaptation.message,
          }
        : null,
      // GPS navigation context for client-side redirect
      gpsNavigation,
      hasActivePlans: hasActivePlans || !!gpsNavigation,
    });
  } catch (err) {
    console.error("Session end error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to end session",
      },
      { status: 500 }
    );
  }
}

// ─── Grade label helper ───
const GRADE_LABELS: Record<string, string> = {
  K: "Kindergarten",
  G1: "Grade 1",
  G2: "Grade 2",
  G3: "Grade 3",
  G4: "Grade 4",
  G5: "Grade 5",
  G6: "Grade 6",
  G7: "Grade 7",
  G8: "Grade 8",
  G9: "Grade 9",
  G10: "Grade 10",
  G11: "Grade 11",
  G12: "Grade 12",
};

// Grade ordering for proximity checks
const GRADE_ORDER = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];

function gradeDistance(a: string, b: string): number {
  const ia = GRADE_ORDER.indexOf(a);
  const ib = GRADE_ORDER.indexOf(b);
  if (ia < 0 || ib < 0) return 99;
  return Math.abs(ia - ib);
}

async function buildSummary(sessionId: string, studentId: string) {
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { currentNode: true, student: { select: { gradeLevel: true } } },
  });

  if (!session) return null;

  const studentGrade = session.student.gradeLevel;
  const durationMinutes = Math.round((session.durationSeconds || 0) / 60);
  const accuracy =
    session.questionsAnswered > 0
      ? Math.round(
          (session.correctAnswers / session.questionsAnswered) * 100
        )
      : 0;

  // ═══ Phase 1: Subject-grouped mastery (recent scores with subject info) ═══
  const recentMasteryScores = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { node: true },
    orderBy: { lastPracticed: "desc" },
    take: 10,
  });

  // Group mastery by subject
  const mathMastery = recentMasteryScores
    .filter((ms) => (ms.node.subject ?? "MATH") === "MATH")
    .map((ms) => ({
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      level: ms.level,
      probability: Math.round(ms.bktProbability * 100),
      domain: ms.node.domain,
      gradeLevel: ms.node.gradeLevel,
    }));

  const englishMastery = recentMasteryScores
    .filter((ms) => (ms.node.subject ?? "MATH") === "ENGLISH")
    .map((ms) => ({
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      level: ms.level,
      probability: Math.round(ms.bktProbability * 100),
      domain: ms.node.domain,
      gradeLevel: ms.node.gradeLevel,
    }));

  // ═══ Phase 1b: Concepts newly mastered THIS session ═══
  // Find mastery scores updated during this session with MASTERED level
  const sessionStart = session.startedAt;
  const newlyMasteredThisSession = await prisma.masteryScore.findMany({
    where: {
      studentId,
      level: "MASTERED",
      lastPracticed: { gte: sessionStart },
    },
    include: { node: { select: { nodeCode: true, title: true, subject: true, gradeLevel: true } } },
  });

  const masteredThisSession = newlyMasteredThisSession.map((ms) => ({
    nodeCode: ms.node.nodeCode,
    title: ms.node.title,
    subject: ms.node.subject ?? "MATH",
    gradeLevel: ms.node.gradeLevel,
    probability: Math.round(ms.bktProbability * 100),
  }));

  // ═══ Phase 2: Grade-level progress (filtered to student's grade ±1) ═══
  const [allMastery, allNodes] = await Promise.all([
    prisma.masteryScore.findMany({
      where: { studentId },
      include: { node: true },
    }),
    prisma.knowledgeNode.findMany({
      select: { id: true, gradeLevel: true, subject: true },
    }),
  ]);

  const nodeCountMap = new Map<string, number>();
  for (const n of allNodes) {
    const subject = n.subject ?? "MATH";
    const key = `${subject}:${n.gradeLevel}`;
    nodeCountMap.set(key, (nodeCountMap.get(key) ?? 0) + 1);
  }

  const masteredCountMap = new Map<string, number>();
  const attemptedGrades = new Set<string>();
  for (const ms of allMastery) {
    const subject = ms.node.subject ?? "MATH";
    const key = `${subject}:${ms.node.gradeLevel}`;
    attemptedGrades.add(key);
    if (ms.bktProbability >= 0.8) {
      masteredCountMap.set(key, (masteredCountMap.get(key) ?? 0) + 1);
    }
  }

  // Filter to grades within ±1 of student's grade for the session complete screen
  const gradeProgress: Array<{
    subject: string;
    gradeLevel: string;
    label: string;
    mastered: number;
    total: number;
    percentage: number;
  }> = [];

  // Always include student's grade and ±1 neighbors
  const relevantGrades = new Set<string>();
  const studentGradeIdx = GRADE_ORDER.indexOf(studentGrade);
  if (studentGradeIdx >= 1) relevantGrades.add(GRADE_ORDER[studentGradeIdx - 1]);
  relevantGrades.add(studentGrade);
  if (studentGradeIdx < GRADE_ORDER.length - 1) relevantGrades.add(GRADE_ORDER[studentGradeIdx + 1]);

  for (const key of attemptedGrades) {
    const [subject, gradeLevel] = key.split(":");
    // Only show grades within ±1 of student's grade
    if (!relevantGrades.has(gradeLevel)) continue;

    const total = nodeCountMap.get(key) ?? 0;
    const mastered = masteredCountMap.get(key) ?? 0;
    if (total === 0) continue;

    const subjectLabel = subject === "ENGLISH" ? "English" : "Math";
    const gradeLabel = GRADE_LABELS[gradeLevel] ?? gradeLevel;

    gradeProgress.push({
      subject,
      gradeLevel,
      label: `${gradeLabel} ${subjectLabel}`,
      mastered,
      total,
      percentage: Math.round((mastered / total) * 100),
    });
  }

  gradeProgress.sort((a, b) => {
    if (a.subject !== b.subject) return a.subject === "ENGLISH" ? -1 : 1;
    return GRADE_ORDER.indexOf(a.gradeLevel) - GRADE_ORDER.indexOf(b.gradeLevel);
  });

  // ═══ Phase 4: Next-up nodes per subject (filtered by grade proximity) ═══
  const nextUpNodes: Array<{ subject: string; nodeCode: string; title: string }> = [];

  for (const subject of ["MATH", "ENGLISH"] as const) {
    // Prefer nodes within ±2 of student's grade
    const subjectNodes = await prisma.knowledgeNode.findMany({
      where: { subject },
      orderBy: [{ difficulty: "asc" }],
    });

    // Sort by grade proximity to student, then difficulty
    const proximityNodes = subjectNodes
      .filter((n) => gradeDistance(n.gradeLevel, studentGrade) <= 2)
      .sort((a, b) => {
        const dA = gradeDistance(a.gradeLevel, studentGrade);
        const dB = gradeDistance(b.gradeLevel, studentGrade);
        if (dA !== dB) return dA - dB;
        return a.difficulty - b.difficulty;
      });

    let found = false;
    for (const node of proximityNodes) {
      const ms = allMastery.find((m) => m.nodeId === node.id);
      if (!ms || ms.bktProbability < 0.9) {
        nextUpNodes.push({ subject, nodeCode: node.nodeCode, title: node.title });
        found = true;
        break;
      }
    }
    if (!found && subjectNodes.length > 0) {
      nextUpNodes.push({ subject, nodeCode: "__ALL_MASTERED__", title: "All caught up!" });
    }
  }

  // ═══ Phase 5: Goal progress (current grade proficiency %) ═══
  // Calculate progress toward current grade proficiency
  let goalProgress = null;
  {
    const sessionSubjectKey = (session.subject ?? "MATH") + ":" + studentGrade;
    const totalInGrade = nodeCountMap.get(sessionSubjectKey) ?? 0;
    const masteredInGrade = masteredCountMap.get(sessionSubjectKey) ?? 0;
    if (totalInGrade > 0) {
      const currentPct = Math.round((masteredInGrade / totalInGrade) * 100);
      // Estimate previous percentage (before this session's mastery gains)
      const newMasteredCount = masteredThisSession.filter(
        (m) => m.gradeLevel === studentGrade && m.subject === (session.subject ?? "MATH")
      ).length;
      const previousMastered = Math.max(0, masteredInGrade - newMasteredCount);
      const previousPct = Math.round((previousMastered / totalInGrade) * 100);

      const subjectLabel = (session.subject ?? "MATH") === "ENGLISH" ? "English" : "Math";
      const gradeLabel = GRADE_LABELS[studentGrade] ?? studentGrade;

      goalProgress = {
        label: `${gradeLabel} ${subjectLabel} Proficiency`,
        currentPct,
        previousPct,
        change: currentPct - previousPct,
        mastered: masteredInGrade,
        total: totalInGrade,
      };
    }
  }

  // ═══ Phase 6: Streak data ═══
  let streak = null;
  try {
    const streakData = await prisma.streakData.findUnique({
      where: { studentId },
    });
    if (streakData) {
      streak = {
        current: streakData.currentStreak,
        longest: streakData.longestStreak,
      };
    }
  } catch {
    // Streak is non-critical
  }

  const sessionSubject = session.subject ?? "MATH";

  return {
    sessionId,
    durationMinutes,
    questionsAnswered: session.questionsAnswered,
    correctAnswers: session.correctAnswers,
    accuracy,
    hintsUsed: session.hintsUsed,
    sessionSubject,
    studentGrade,
    currentNode: session.currentNode
      ? {
          nodeCode: session.currentNode.nodeCode,
          title: session.currentNode.title,
          subject: session.currentNode.subject ?? "MATH",
        }
      : null,
    mathMastery,
    englishMastery,
    recentMastery: recentMasteryScores.map((ms) => ({
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      level: ms.level,
      probability: Math.round(ms.bktProbability * 100),
      subject: ms.node.subject ?? "MATH",
    })),
    // NEW: Concepts mastered THIS session only
    masteredThisSession,
    gradeProgress,
    nextUpNodes,
    // NEW: Goal progress toward current grade proficiency
    goalProgress,
    streak,
    planId: session.planId ?? null,
  };
}
