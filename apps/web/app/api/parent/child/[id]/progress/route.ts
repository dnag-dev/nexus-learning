import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/parent/child/:id/progress
 *
 * Returns detailed progress data for a child:
 * domain breakdown, recent sessions, strengths/weaknesses, daily minutes.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Domain breakdown — try student's grade first, fall back to all available nodes
    let allNodes = await prisma.knowledgeNode.findMany({
      where: { gradeLevel: student.gradeLevel },
      select: { id: true, domain: true },
    });

    // If no curriculum nodes exist for this grade, show all available nodes
    if (allNodes.length === 0) {
      allNodes = await prisma.knowledgeNode.findMany({
        select: { id: true, domain: true },
      });
    }

    const masteryScores = await prisma.masteryScore.findMany({
      where: { studentId },
      select: { nodeId: true, level: true },
    });

    const masteryMap = new Map(
      masteryScores.map((m) => [m.nodeId, m.level])
    );

    const domains = ["COUNTING", "OPERATIONS", "GEOMETRY", "MEASUREMENT", "DATA"];
    const domainBreakdown = domains.map((domain) => {
      const nodesInDomain = allNodes.filter((n) => n.domain === domain);
      let mastered = 0;
      let inProgress = 0;
      let notStarted = 0;

      for (const node of nodesInDomain) {
        const level = masteryMap.get(node.id);
        if (!level || level === "NOVICE") {
          notStarted++;
        } else if (level === "MASTERED") {
          mastered++;
        } else {
          inProgress++;
        }
      }

      return { domain, mastered, inProgress, notStarted };
    });

    // Recent sessions (last 20)
    const sessions = await prisma.learningSession.findMany({
      where: { studentId, state: "COMPLETED" },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { currentNode: { select: { title: true } } },
    });

    const recentSessions = sessions.map((s) => ({
      id: s.id,
      date: s.startedAt.toISOString(),
      durationMinutes: Math.round(s.durationSeconds / 60),
      nodesPracticed: s.currentNode ? [s.currentNode.title] : [],
      accuracy:
        s.questionsAnswered > 0
          ? s.correctAnswers / s.questionsAnswered
          : 0,
      emotionalSummary: s.emotionalStateAtEnd || s.emotionalStateAtStart || "—",
      sessionType: s.sessionType,
    }));

    // Strengths (top 3 highest BKT)
    const allMasteryWithNodes = await prisma.masteryScore.findMany({
      where: { studentId, practiceCount: { gte: 1 } },
      include: { node: { select: { title: true, domain: true } } },
      orderBy: { bktProbability: "desc" },
    });

    const strengths = allMasteryWithNodes.slice(0, 3).map((m) => ({
      nodeTitle: m.node.title,
      bktProbability: m.bktProbability,
      domain: m.node.domain,
    }));

    // Weaknesses (bottom 3 with bkt < 0.7)
    const weaknesses = [...allMasteryWithNodes]
      .sort((a, b) => a.bktProbability - b.bktProbability)
      .slice(0, 3)
      .filter((m) => m.bktProbability < 0.7)
      .map((m) => ({
        nodeTitle: m.node.title,
        bktProbability: m.bktProbability,
        domain: m.node.domain,
      }));

    // Daily minutes for past 14 days
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    );

    const recentAllSessions = await prisma.learningSession.findMany({
      where: {
        studentId,
        state: "COMPLETED",
        startedAt: { gte: fourteenDaysAgo },
      },
      select: { startedAt: true, durationSeconds: true },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    for (let d = 0; d < 14; d++) {
      const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyMap.set(dateStr, 0);
    }

    for (const s of recentAllSessions) {
      const dateStr = s.startedAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, existing + Math.round(s.durationSeconds / 60));
    }

    const dailyMinutes = Array.from(dailyMap.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      childName: student.displayName,
      domainBreakdown,
      recentSessions,
      strengths,
      weaknesses,
      dailyMinutes,
    });
  } catch (err) {
    console.error("Child progress error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
