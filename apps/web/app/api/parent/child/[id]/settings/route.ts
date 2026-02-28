import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * PATCH /api/parent/child/[id]/settings
 *
 * Update child profile settings (name, grade, country, learning goal, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    const body = await request.json();

    const {
      displayName,
      gradeLevel,
      ageGroup,
      country,
      learningGoal,
      dailyMinutesTarget,
      targetDate,
      subjectFocus,
    } = body;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: childId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      );
    }

    // Build update data — only update provided fields
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
    if (country !== undefined) updateData.country = country || null;
    if (learningGoal !== undefined) updateData.learningGoal = learningGoal || null;
    if (dailyMinutesTarget !== undefined)
      updateData.dailyMinutesTarget = dailyMinutesTarget
        ? parseInt(dailyMinutesTarget)
        : null;
    if (targetDate !== undefined)
      updateData.targetDate = targetDate ? new Date(targetDate) : null;
    if (subjectFocus !== undefined) updateData.subjectFocus = subjectFocus || null;

    const updated = await prisma.student.update({
      where: { id: childId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      displayName: updated.displayName,
      gradeLevel: updated.gradeLevel,
      ageGroup: updated.ageGroup,
      country: (updated as Record<string, unknown>).country,
      message: "Settings updated successfully",
    });
  } catch (err) {
    console.error("[child settings PATCH] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
