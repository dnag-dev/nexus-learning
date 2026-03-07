/**
 * GET /api/student/[id]/units?gradeLevel=G5&subject=MATH
 *
 * Phase 13: Returns units with cluster breakdowns and mastery states
 * for a student at a given grade + subject.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnitsForStudent } from "@/lib/unit-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { searchParams } = new URL(req.url);
    const gradeLevel = searchParams.get("gradeLevel") || "G5";
    const subject = searchParams.get("subject") || "MATH";

    const units = await getUnitsForStudent(studentId, gradeLevel, subject);

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}
