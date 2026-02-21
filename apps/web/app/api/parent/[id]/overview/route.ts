import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { generateInsightCards } from "@/lib/reports/insights";

/**
 * GET /api/parent/:id/overview
 *
 * Returns parent overview: child cards + insight cards.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    // Get parent + children
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        children: {
          include: {
            streakData: true,
            masteryScores: {
              where: { level: "MASTERED" },
              select: { lastPracticed: true },
            },
            sessions: {
              where: { state: "COMPLETED" },
              orderBy: { startedAt: "desc" },
              take: 1,
              select: { startedAt: true, durationSeconds: true },
            },
          },
        },
        subscription: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Build child cards
    const childCards = await Promise.all(
      parent.children.map(async (child) => {
        // Today's sessions
        const todaySessions = await prisma.learningSession.findMany({
          where: {
            studentId: child.id,
            startedAt: { gte: todayStart },
            state: "COMPLETED",
          },
          select: { durationSeconds: true },
        });

        // Nodes mastered this week vs last week
        const [thisWeekMastered, lastWeekMastered] = await Promise.all([
          prisma.masteryScore.count({
            where: {
              studentId: child.id,
              level: "MASTERED",
              lastPracticed: { gte: oneWeekAgo },
            },
          }),
          prisma.masteryScore.count({
            where: {
              studentId: child.id,
              level: "MASTERED",
              lastPracticed: { gte: twoWeeksAgo, lt: oneWeekAgo },
            },
          }),
        ]);

        const todayMinutes = Math.round(
          todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
        );

        return {
          id: child.id,
          displayName: child.displayName,
          avatarPersonaId: child.avatarPersonaId,
          gradeLevel: child.gradeLevel,
          xp: child.xp,
          level: child.level,
          todaySessions: todaySessions.length,
          todayMinutes,
          currentStreak: child.streakData?.currentStreak ?? 0,
          nodesMasteredThisWeek: thisWeekMastered,
          nodesMasteredLastWeek: lastWeekMastered,
          lastActiveAt:
            child.sessions[0]?.startedAt?.toISOString() ?? null,
        };
      })
    );

    // Generate insights for first child (if exists)
    let insights: Awaited<ReturnType<typeof generateInsightCards>> = [];
    if (parent.children.length > 0) {
      try {
        insights = await generateInsightCards(parent.children[0].id);
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      parentName: parent.email.split("@")[0], // Simplified name extraction
      subscriptionPlan: parent.subscription?.plan ?? "SPARK",
      children: parent.children.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        avatarPersonaId: c.avatarPersonaId,
        gradeLevel: c.gradeLevel,
      })),
      childCards,
      insights,
    });
  } catch (err) {
    console.error("Parent overview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
