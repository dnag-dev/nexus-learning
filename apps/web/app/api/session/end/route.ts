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
};

async function buildSummary(sessionId: string, studentId: string) {
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { currentNode: true },
  });

  if (!session) return null;

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
    take: 10, // Fetch more to split across subjects
  });

  // Group mastery by subject — default to MATH if node has no subject
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

  // ═══ Phase 2: Grade-level progress across all time ═══
  // Fetch ALL mastery scores (not just recent) and ALL knowledge nodes
  const [allMastery, allNodes] = await Promise.all([
    prisma.masteryScore.findMany({
      where: { studentId },
      include: { node: true },
    }),
    prisma.knowledgeNode.findMany({
      select: { id: true, gradeLevel: true, subject: true },
    }),
  ]);

  // Build grade-level progress: { subject, gradeLevel, mastered, total, label }
  // Group all nodes by subject + gradeLevel
  const nodeCountMap = new Map<string, number>();
  for (const n of allNodes) {
    const subject = n.subject ?? "MATH";
    const key = `${subject}:${n.gradeLevel}`;
    nodeCountMap.set(key, (nodeCountMap.get(key) ?? 0) + 1);
  }

  // Count mastered nodes (bktProbability >= 0.8) per subject + gradeLevel
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

  // Only include grades where student has at least attempted one node
  const gradeProgress: Array<{
    subject: string;
    gradeLevel: string;
    label: string;
    mastered: number;
    total: number;
    percentage: number;
  }> = [];

  for (const key of attemptedGrades) {
    const [subject, gradeLevel] = key.split(":");
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

  // Sort: by subject (ENGLISH first for display), then grade ascending
  const gradeOrder = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"];
  gradeProgress.sort((a, b) => {
    if (a.subject !== b.subject) return a.subject === "ENGLISH" ? -1 : 1;
    return gradeOrder.indexOf(a.gradeLevel) - gradeOrder.indexOf(b.gradeLevel);
  });

  // ═══ Phase 4: Next-up nodes per subject ═══
  // Find the first unmastered node in each subject for "What's Next"
  const nextUpNodes: Array<{ subject: string; nodeCode: string; title: string }> = [];

  for (const subject of ["MATH", "ENGLISH"] as const) {
    // Get all nodes for this subject ordered by difficulty
    const subjectNodes = await prisma.knowledgeNode.findMany({
      where: { subject },
      orderBy: [{ difficulty: "asc" }],
    });

    // Find the first one that isn't mastered (bkt < 0.9)
    let found = false;
    for (const node of subjectNodes) {
      const ms = allMastery.find((m) => m.nodeId === node.id);
      if (!ms || ms.bktProbability < 0.9) {
        nextUpNodes.push({
          subject,
          nodeCode: node.nodeCode,
          title: node.title,
        });
        found = true;
        break;
      }
    }
    // If all mastered, flag it
    if (!found && subjectNodes.length > 0) {
      nextUpNodes.push({
        subject,
        nodeCode: "__ALL_MASTERED__",
        title: "All caught up!",
      });
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

  // ═══ Phase 3: Session subject (for XP display split) ═══
  const sessionSubject = session.subject ?? "MATH";

  return {
    sessionId,
    durationMinutes,
    questionsAnswered: session.questionsAnswered,
    correctAnswers: session.correctAnswers,
    accuracy,
    hintsUsed: session.hintsUsed,
    sessionSubject,
    currentNode: session.currentNode
      ? {
          nodeCode: session.currentNode.nodeCode,
          title: session.currentNode.title,
          subject: session.currentNode.subject ?? "MATH",
        }
      : null,
    // Phase 1: Subject-grouped mastery
    mathMastery,
    englishMastery,
    // Legacy field for backward compat
    recentMastery: recentMasteryScores.map((ms) => ({
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      level: ms.level,
      probability: Math.round(ms.bktProbability * 100),
      subject: ms.node.subject ?? "MATH",
    })),
    // Phase 2: Grade progress
    gradeProgress,
    // Phase 4: Next-up nodes
    nextUpNodes,
    // Phase 6: Streak
    streak,
  };
}
