/**
 * POST /api/goals/create
 *
 * Creates a learning plan for a student-goal pair.
 * Calls the plan generator engine which:
 *   1. Fetches goal → required concepts
 *   2. Checks student mastery → filters already-mastered
 *   3. Orders by prerequisites → topological sort
 *   4. Estimates hours → generates milestones
 *   5. Generates Claude narrative
 *   6. Saves LearningPlan to PostgreSQL
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { generateLearningPlan } from "@/lib/learning-plan/plan-generator";

const MAX_CONCURRENT_PLANS = 3;

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goalId, studentId, weeklyHoursAvailable, targetDate } = body as {
      goalId?: string;
      studentId?: string;
      weeklyHoursAvailable?: number;
      targetDate?: string;
    };

    if (!goalId || !studentId) {
      return NextResponse.json(
        { error: "goalId and studentId are required" },
        { status: 400 }
      );
    }

    // Enforce max concurrent plans limit
    const activePlanCount = await prisma.learningPlan.count({
      where: { studentId, status: "ACTIVE" },
    });

    if (activePlanCount >= MAX_CONCURRENT_PLANS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_CONCURRENT_PLANS} concurrent goals allowed. Please complete or pause an existing goal first.`,
          activePlanCount,
          maxAllowed: MAX_CONCURRENT_PLANS,
        },
        { status: 400 }
      );
    }

    // Check for duplicate goal
    const existingPlanForGoal = await prisma.learningPlan.findFirst({
      where: { studentId, goalId, status: "ACTIVE" },
    });

    if (existingPlanForGoal) {
      return NextResponse.json(
        {
          error: "You already have an active plan for this goal",
          existingPlanId: existingPlanForGoal.id,
        },
        { status: 400 }
      );
    }

    const hoursPerWeek = weeklyHoursAvailable ?? 3;
    if (hoursPerWeek < 0.5 || hoursPerWeek > 40) {
      return NextResponse.json(
        { error: "weeklyHoursAvailable must be between 0.5 and 40" },
        { status: 400 }
      );
    }

    const result = await generateLearningPlan({
      goalId,
      studentId,
      weeklyHoursAvailable: hoursPerWeek,
      targetDate: targetDate ? new Date(targetDate) : undefined,
    });

    return NextResponse.json({
      planId: result.planId,
      conceptSequence: result.conceptSequence,
      totalEstimatedHours: result.totalEstimatedHours,
      projectedCompletionDate: result.projectedCompletionDate,
      weeklyMilestones: result.weeklyMilestones,
      narrative: result.narrative,
      conceptsAlreadyMastered: result.conceptsAlreadyMastered,
      conceptsRemaining: result.conceptsRemaining,
    });
  } catch (err) {
    console.error("[goals/create] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create plan" },
      { status: 500 }
    );
  }
}
