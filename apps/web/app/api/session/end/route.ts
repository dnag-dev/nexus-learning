import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { processSessionComplete } from "@/lib/gamification/gamification-service";

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

    return NextResponse.json({
      state: result.newState,
      recommendedAction: result.recommendedAction,
      summary,
      gamification,
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

  // Get all mastery scores updated during this session
  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { node: true },
    orderBy: { lastPracticed: "desc" },
    take: 5,
  });

  return {
    sessionId,
    durationMinutes,
    questionsAnswered: session.questionsAnswered,
    correctAnswers: session.correctAnswers,
    accuracy,
    hintsUsed: session.hintsUsed,
    currentNode: session.currentNode
      ? {
          nodeCode: session.currentNode.nodeCode,
          title: session.currentNode.title,
        }
      : null,
    recentMastery: masteryScores.map((ms) => ({
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      level: ms.level,
      probability: Math.round(ms.bktProbability * 100),
    })),
  };
}
