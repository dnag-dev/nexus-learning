import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/parent/child/:id/sessions
 *
 * Returns all sessions for a child (for session history view).
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const sessions = await prisma.learningSession.findMany({
      where: { studentId, state: "COMPLETED" },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        currentNode: { select: { title: true } },
        emotionalLogs: {
          select: {
            detectedState: true,
            triggeredAdaptation: true,
          },
        },
      },
    });

    const sessionRecords = sessions.map((s) => ({
      id: s.id,
      date: s.startedAt.toISOString(),
      durationMinutes: Math.round(s.durationSeconds / 60),
      sessionType: s.sessionType,
      questionsAnswered: s.questionsAnswered,
      correctAnswers: s.correctAnswers,
      accuracy:
        s.questionsAnswered > 0
          ? s.correctAnswers / s.questionsAnswered
          : 0,
      emotionalStateAtStart: s.emotionalStateAtStart,
      emotionalStateAtEnd: s.emotionalStateAtEnd,
      interventionsTriggered: s.emotionalLogs.filter(
        (l) => l.triggeredAdaptation
      ).length,
      nodesCovered: s.currentNode ? [s.currentNode.title] : [],
      hintsUsed: s.hintsUsed,
    }));

    return NextResponse.json({ sessions: sessionRecords });
  } catch (err) {
    console.error("Child sessions error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
