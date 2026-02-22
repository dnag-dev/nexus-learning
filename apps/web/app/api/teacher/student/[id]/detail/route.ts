import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/student/:id/detail
 *
 * Returns student detail for the teacher view.
 * Same shape as parent progress API for component reuse.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        masteryScores: {
          include: {
            node: {
              select: { id: true, title: true, nodeCode: true, domain: true, gradeLevel: true },
            },
          },
        },
        sessions: {
          where: { state: "COMPLETED" },
          orderBy: { startedAt: "desc" },
          take: 20,
          select: {
            id: true,
            sessionType: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            questionsAnswered: true,
            correctAnswers: true,
            hintsUsed: true,
            currentNode: {
              select: { title: true, nodeCode: true },
            },
          },
        },
        streakData: true,
        emotionalLogs: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            detectedState: true,
            timestamp: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get all nodes for this grade
    let allNodes = await prisma.knowledgeNode.findMany({
      where: { gradeLevel: student.gradeLevel },
      select: { id: true, domain: true },
    });

    if (allNodes.length === 0) {
      allNodes = await prisma.knowledgeNode.findMany({
        select: { id: true, domain: true },
      });
    }

    // Domain breakdown
    const domainBreakdown: Record<
      string,
      { mastered: number; inProgress: number; notStarted: number }
    > = {};

    allNodes.forEach((node) => {
      if (!domainBreakdown[node.domain]) {
        domainBreakdown[node.domain] = { mastered: 0, inProgress: 0, notStarted: 0 };
      }

      const score = student.masteryScores.find((m) => m.nodeId === node.id);
      if (!score) {
        domainBreakdown[node.domain].notStarted++;
      } else if (score.level === "MASTERED") {
        domainBreakdown[node.domain].mastered++;
      } else {
        domainBreakdown[node.domain].inProgress++;
      }
    });

    // Session history
    const sessions = student.sessions.map((s) => ({
      id: s.id,
      type: s.sessionType,
      conceptTitle: s.currentNode?.title ?? "Review",
      conceptCode: s.currentNode?.nodeCode ?? "",
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      durationMinutes: Math.round(s.durationSeconds / 60),
      questionsAnswered: s.questionsAnswered,
      correctAnswers: s.correctAnswers,
      accuracy:
        s.questionsAnswered > 0
          ? Math.round((s.correctAnswers / s.questionsAnswered) * 100)
          : 0,
      hintsUsed: s.hintsUsed,
    }));

    return NextResponse.json({
      student: {
        id: student.id,
        displayName: student.displayName,
        gradeLevel: student.gradeLevel,
        avatarPersonaId: student.avatarPersonaId,
        xp: student.xp,
        level: student.level,
        currentStreak: student.streakData?.currentStreak ?? 0,
      },
      domainBreakdown,
      sessions,
      recentEmotions: student.emotionalLogs.map((e) => ({
        state: e.detectedState,
        timestamp: e.timestamp.toISOString(),
      })),
      totalMastered: student.masteryScores.filter((m) => m.level === "MASTERED").length,
      totalNodes: allNodes.length,
    });
  } catch (err) {
    console.error("Student detail error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
