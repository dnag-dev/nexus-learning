import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/teacher/class/:id/students
 *
 * Adds a student to a class by student ID.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classId = params.id;
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Verify class exists
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existing = await prisma.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Student already in this class" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.classStudent.create({
      data: { classId, studentId },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (err) {
    console.error("Add student error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
