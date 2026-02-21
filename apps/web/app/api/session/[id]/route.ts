import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getSessionEvents } from "@/lib/session/state-machine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        student: true,
        currentNode: true,
        emotionalLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get mastery for current node
    let currentMastery = null;
    if (session.currentNodeId) {
      const mastery = await prisma.masteryScore.findUnique({
        where: {
          studentId_nodeId: {
            studentId: session.studentId,
            nodeId: session.currentNodeId,
          },
        },
      });
      if (mastery) {
        currentMastery = {
          level: mastery.level,
          probability: Math.round(mastery.bktProbability * 100),
          practiceCount: mastery.practiceCount,
          correctCount: mastery.correctCount,
        };
      }
    }

    // Get in-memory events
    const events = getSessionEvents(sessionId);

    return NextResponse.json({
      session: {
        id: session.id,
        state: session.state,
        studentId: session.studentId,
        studentName: session.student.displayName,
        personaId: session.student.avatarPersonaId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationSeconds: session.durationSeconds,
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        hintsUsed: session.hintsUsed,
        emotionalStateAtStart: session.emotionalStateAtStart,
        emotionalStateAtEnd: session.emotionalStateAtEnd,
      },
      currentNode: session.currentNode
        ? {
            nodeCode: session.currentNode.nodeCode,
            title: session.currentNode.title,
            description: session.currentNode.description,
            gradeLevel: session.currentNode.gradeLevel,
            domain: session.currentNode.domain,
            difficulty: session.currentNode.difficulty,
          }
        : null,
      currentMastery,
      recentEmotions: session.emotionalLogs.map((log) => ({
        state: log.detectedState,
        confidence: log.confidence,
        triggeredAdaptation: log.triggeredAdaptation,
        timestamp: log.timestamp,
      })),
      events: events.slice(-20),
    });
  } catch (err) {
    console.error("Session get error:", err);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
