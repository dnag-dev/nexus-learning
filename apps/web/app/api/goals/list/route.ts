/**
 * GET /api/goals/list
 *
 * Returns all available learning goals, grouped by category.
 * Used by the goal selection page to populate choices.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

export async function GET() {
  try {
    const goals = await prisma.learningGoal.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        gradeLevel: true,
        examType: true,
        estimatedHours: true,
        requiredNodeIds: true,
        standardsCovered: true,
      },
      orderBy: [{ category: "asc" }, { gradeLevel: "asc" }, { name: "asc" }],
    });

    // Group by category for convenience
    const grouped = {
      GRADE_PROFICIENCY: goals.filter(
        (g) => g.category === "GRADE_PROFICIENCY"
      ),
      EXAM_PREP: goals.filter((g) => g.category === "EXAM_PREP"),
      SKILL_BUILDING: goals.filter((g) => g.category === "SKILL_BUILDING"),
      CUSTOM: goals.filter((g) => g.category === "CUSTOM"),
    };

    return NextResponse.json({
      goals,
      grouped,
      total: goals.length,
    });
  } catch (err) {
    console.error("[goals/list] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch goals" },
      { status: 500 }
    );
  }
}
