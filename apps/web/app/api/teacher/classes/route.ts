import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/teacher/classes
 *
 * Creates a new class for a teacher.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, name, gradeLevel } = body;

    if (!teacherId || !name || !gradeLevel) {
      return NextResponse.json(
        { error: "teacherId, name, and gradeLevel are required" },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        gradeLevel,
        teacherId,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (err) {
    console.error("Create class error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
