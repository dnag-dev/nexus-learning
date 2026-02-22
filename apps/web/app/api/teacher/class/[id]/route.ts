import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/class/:id
 *
 * Returns class details with students and mastery summaries.
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
                streakData: true,
                masteryScores: true,
                sessions: {
                  where: { state: "COMPLETED" },
                  orderBy: { startedAt: "desc" },
                  take: 1,
                  select: { startedAt: true },
                },
                interventionAlerts: {
                  where: { status: "ALERT_ACTIVE" },
                  select: { id: true },
                },
              },
            },
          },
        },
        assignments: {
          where: { status: "ASSIGNMENT_ACTIVE" },
        },
      },
    });

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get total knowledge nodes for this grade
    const totalNodes = await prisma.knowledgeNode.count({
      where: { gradeLevel: cls.gradeLevel },
    });

    // Build student data
    const students = cls.students.map((enrollment) => {
      const s = enrollment.student;
      const masteredCount = s.masteryScores.filter(
        (m) => m.level === "MASTERED"
      ).length;
      const totalMasteryNodes = totalNodes || s.masteryScores.length || 1;
      const masteryPercent = Math.round(
        (masteredCount / totalMasteryNodes) * 100
      );

      return {
        id: s.id,
        displayName: s.displayName,
        avatarPersonaId: s.avatarPersonaId,
        gradeLevel: s.gradeLevel,
        xp: s.xp,
        level: s.level,
        currentStreak: s.streakData?.currentStreak ?? 0,
        masteredCount,
        totalNodes: totalMasteryNodes,
        masteryPercent,
        lastActiveAt: s.sessions[0]?.startedAt?.toISOString() ?? null,
        activeAlertCount: s.interventionAlerts.length,
      };
    });

    return NextResponse.json({
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      studentCount: students.length,
      activeAssignments: cls.assignments.length,
      students,
      totalNodes,
    });
  } catch (err) {
    console.error("Class detail error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
