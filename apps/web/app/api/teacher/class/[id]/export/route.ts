import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/class/:id/export
 *
 * Exports class progress as CSV.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classId = params.id;

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            student: {
              include: {
                masteryScores: true,
                streakData: true,
                sessions: {
                  where: { state: "COMPLETED" },
                  orderBy: { startedAt: "desc" },
                  take: 1,
                  select: { startedAt: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const totalNodes = await prisma.knowledgeNode.count({
      where: { gradeLevel: cls.gradeLevel },
    });

    // Count sessions this week for each student
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    // CSV header
    const headers = [
      "Student Name",
      "Grade",
      "Concepts Mastered",
      "Total Concepts",
      "Mastery %",
      "Sessions This Week",
      "Streak Days",
      "Last Active",
    ];

    const rows = await Promise.all(
      cls.students.map(async (enrollment) => {
        const s = enrollment.student;
        const masteredCount = s.masteryScores.filter(
          (m) => m.level === "MASTERED"
        ).length;
        const masteryPercent =
          totalNodes > 0
            ? Math.round((masteredCount / totalNodes) * 100)
            : 0;

        const sessionsThisWeek = await prisma.learningSession.count({
          where: {
            studentId: s.id,
            state: "COMPLETED",
            startedAt: { gte: oneWeekAgo },
          },
        });

        const lastActive = s.sessions[0]?.startedAt
          ? s.sessions[0].startedAt.toISOString().split("T")[0]
          : "Never";

        return [
          escapeCsv(s.displayName),
          s.gradeLevel,
          masteredCount.toString(),
          totalNodes.toString(),
          `${masteryPercent}%`,
          sessionsThisWeek.toString(),
          (s.streakData?.currentStreak ?? 0).toString(),
          lastActive,
        ];
      })
    );

    // Build CSV string
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${cls.name.replace(/[^a-z0-9]/gi, "_")}_progress.csv"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
