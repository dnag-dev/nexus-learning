import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/class/:id/mastery-heatmap
 *
 * Returns a matrix of students x knowledge nodes with mastery levels.
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
                masteryScores: {
                  include: { node: { select: { id: true, title: true, nodeCode: true, domain: true } } },
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

    // Get all nodes for this grade level
    const nodes = await prisma.knowledgeNode.findMany({
      where: { gradeLevel: cls.gradeLevel },
      orderBy: [{ domain: "asc" }, { nodeCode: "asc" }],
      select: { id: true, title: true, nodeCode: true, domain: true },
    });

    // Build matrix
    const students = cls.students.map((enrollment) => {
      const s = enrollment.student;
      const masteryMap: Record<string, string> = {};
      s.masteryScores.forEach((score) => {
        masteryMap[score.nodeId] = score.level;
      });

      return {
        id: s.id,
        displayName: s.displayName,
        mastery: masteryMap,
      };
    });

    return NextResponse.json({
      nodes,
      students,
    });
  } catch (err) {
    console.error("Mastery heatmap error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
