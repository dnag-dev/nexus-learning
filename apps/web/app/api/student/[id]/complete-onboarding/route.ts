/**
 * POST /api/student/[id]/complete-onboarding
 *
 * Marks a student as having completed the onboarding flow.
 * Sets firstLoginComplete = true and optionally saves subjectFocus.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const body = await request.json().catch(() => ({}));
    const { subjectFocus } = body as { subjectFocus?: string };

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Update student
    const updateData: Record<string, unknown> = {
      firstLoginComplete: true,
    };

    if (
      subjectFocus &&
      ["MATH", "ENGLISH", "BOTH"].includes(subjectFocus)
    ) {
      updateData.subjectFocus = subjectFocus;
    }

    await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Complete onboarding error:", err);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
