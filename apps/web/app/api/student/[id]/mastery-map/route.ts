/**
 * GET /api/student/:id/mastery-map
 *
 * Returns all knowledge nodes with student's mastery overlay
 * for the constellation star map display.
 *
 * Query params:
 *  - gradeLevel (optional): Filter by grade level (K, G1, G2, etc.)
 */

import { NextResponse } from "next/server";
import { getMasteryMap } from "@/lib/gamification/gamification-service";

export async function GET(
  request: Request,
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

    const url = new URL(request.url);
    const gradeLevel = url.searchParams.get("gradeLevel") ?? undefined;

    const data = await getMasteryMap(studentId, gradeLevel);

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/student/[id]/mastery-map error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
