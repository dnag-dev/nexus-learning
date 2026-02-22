import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/assignments/:id
 *
 * Returns assignment detail with submissions.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        class: { select: { id: true, name: true, gradeLevel: true } },
        submissions: {
          include: {
            student: {
              select: { id: true, displayName: true, avatarPersonaId: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Get node titles
    const nodes = await prisma.knowledgeNode.findMany({
      where: { id: { in: assignment.nodeIds } },
      select: { id: true, title: true, nodeCode: true },
    });

    return NextResponse.json({
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
      dueDate: assignment.dueDate?.toISOString() ?? null,
      nodes,
      submissions: assignment.submissions.map((sub) => ({
        id: sub.id,
        studentId: sub.studentId,
        studentName: sub.student.displayName,
        avatarPersonaId: sub.student.avatarPersonaId,
        nodesAttempted: sub.nodesAttempted,
        nodesMastered: sub.nodesMastered,
        score: sub.score,
        completedAt: sub.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    console.error("Assignment detail error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/assignments/:id
 *
 * Updates assignment status (activate, archive, complete).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (
      !status ||
      !["DRAFT", "ASSIGNMENT_ACTIVE", "ASSIGNMENT_COMPLETED", "ARCHIVED"].includes(
        status
      )
    ) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(assignment);
  } catch (err) {
    console.error("Update assignment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
