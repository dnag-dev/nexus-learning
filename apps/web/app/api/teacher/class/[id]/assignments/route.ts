import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/class/:id/assignments
 *
 * Lists all assignments for a class.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { classId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        submissions: {
          select: { id: true, completedAt: true },
        },
      },
    });

    return NextResponse.json(
      assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        nodeCount: a.nodeIds.length,
        dueDate: a.dueDate?.toISOString() ?? null,
        submissionCount: a.submissions.length,
        completedCount: a.submissions.filter((s) => s.completedAt).length,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("List assignments error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
