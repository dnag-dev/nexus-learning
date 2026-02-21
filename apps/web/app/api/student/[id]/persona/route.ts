/**
 * PATCH /api/student/:id/persona
 *
 * Update a student's selected persona character.
 * Body: { personaId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { isValidPersonaId } from "@/lib/personas/persona-config";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: studentId } = params;
    const body = await request.json();
    const { personaId } = body;

    if (!personaId || typeof personaId !== "string") {
      return NextResponse.json(
        { error: "personaId is required" },
        { status: 400 }
      );
    }

    if (!isValidPersonaId(personaId)) {
      return NextResponse.json(
        { error: `Invalid personaId: ${personaId}` },
        { status: 400 }
      );
    }

    // Update the student's persona
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { avatarPersonaId: personaId },
      select: {
        id: true,
        displayName: true,
        avatarPersonaId: true,
        ageGroup: true,
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (err) {
    console.error("PATCH /api/student/:id/persona error:", err);
    return NextResponse.json(
      { error: "Failed to update persona" },
      { status: 500 }
    );
  }
}
