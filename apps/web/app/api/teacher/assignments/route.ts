import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/teacher/assignments
 *
 * Creates a new assignment for a class.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, title, description, nodeIds, dueDate, status } = body;

    if (!classId || !title || !nodeIds || nodeIds.length === 0) {
      return NextResponse.json(
        { error: "classId, title, and nodeIds are required" },
        { status: 400 }
      );
    }

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        classId,
        title,
        description: description || null,
        nodeIds,
        status: status || "DRAFT",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error("Create assignment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
