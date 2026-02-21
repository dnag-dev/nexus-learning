/**
 * GET /api/student/:id/gamification
 *
 * Returns all gamification data for a student:
 * XP, level, streak, badges, boss challenges, mastery map.
 */

import { NextResponse } from "next/server";
import { getStudentGamificationData } from "@/lib/gamification/gamification-service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const data = await getStudentGamificationData(studentId);

    if (!data) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/student/[id]/gamification error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
