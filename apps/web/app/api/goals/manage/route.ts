/**
 * Goals Management API
 *
 * GET  /api/goals/manage?studentId=xxx — List all plans for a student
 * POST /api/goals/manage — Pause, resume, abandon, or update a plan
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

// ─── GET: List all plans for a student ──────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const plans = await prisma.learningPlan.findMany({
      where: { studentId },
      include: {
        goal: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            gradeLevel: true,
          },
        },
        milestoneResults: {
          select: {
            weekNumber: true,
            passed: true,
            score: true,
            completedAt: true,
          },
          orderBy: { weekNumber: "desc" },
          take: 3,
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const enrichedPlans = plans.map((plan) => {
      const totalConcepts = plan.conceptSequence.length;
      const progressPercentage =
        totalConcepts > 0
          ? Math.round((plan.currentConceptIndex / totalConcepts) * 100)
          : 0;

      return {
        planId: plan.id,
        goal: plan.goal,
        status: plan.status,
        progressPercentage,
        totalConcepts,
        conceptsMastered: plan.currentConceptIndex,
        totalEstimatedHours: plan.totalEstimatedHours,
        hoursCompleted: plan.hoursCompleted,
        projectedCompletionDate: plan.projectedCompletionDate,
        targetCompletionDate: plan.targetCompletionDate,
        isAheadOfSchedule: plan.isAheadOfSchedule,
        velocityHoursPerWeek: plan.velocityHoursPerWeek,
        createdAt: plan.createdAt,
        lastRecalculatedAt: plan.lastRecalculatedAt,
        recentMilestones: plan.milestoneResults,
      };
    });

    // Summary stats
    const activePlans = enrichedPlans.filter((p) => p.status === "ACTIVE");
    const pausedPlans = enrichedPlans.filter((p) => p.status === "PAUSED");
    const completedPlans = enrichedPlans.filter(
      (p) => p.status === "COMPLETED"
    );
    const abandonedPlans = enrichedPlans.filter(
      (p) => p.status === "ABANDONED"
    );

    return NextResponse.json({
      plans: enrichedPlans,
      summary: {
        total: enrichedPlans.length,
        active: activePlans.length,
        paused: pausedPlans.length,
        completed: completedPlans.length,
        abandoned: abandonedPlans.length,
        canAddMore: activePlans.length < 3,
        slotsRemaining: 3 - activePlans.length,
      },
    });
  } catch (err) {
    console.error("[goals/manage] GET Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load plans" },
      { status: 500 }
    );
  }
}

// ─── POST: Manage plan actions (pause, resume, abandon, update date) ────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, action, targetDate } = body as {
      planId?: string;
      action?: "pause" | "resume" | "abandon" | "update_target_date";
      targetDate?: string;
    };

    if (!planId || !action) {
      return NextResponse.json(
        { error: "planId and action are required" },
        { status: 400 }
      );
    }

    const plan = await prisma.learningPlan.findUnique({
      where: { id: planId },
      include: { goal: { select: { name: true } } },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "pause": {
        if (plan.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "Only active plans can be paused" },
            { status: 400 }
          );
        }
        await prisma.learningPlan.update({
          where: { id: planId },
          data: { status: "PAUSED" },
        });
        return NextResponse.json({
          success: true,
          planId,
          newStatus: "PAUSED",
          message: `"${plan.goal.name}" has been paused. You can resume anytime.`,
        });
      }

      case "resume": {
        if (plan.status !== "PAUSED") {
          return NextResponse.json(
            { error: "Only paused plans can be resumed" },
            { status: 400 }
          );
        }

        // Check if resuming would exceed the 3-plan limit
        const activeCount = await prisma.learningPlan.count({
          where: { studentId: plan.studentId, status: "ACTIVE" },
        });

        if (activeCount >= 3) {
          return NextResponse.json(
            {
              error:
                "Maximum 3 concurrent active goals. Please pause another goal first.",
            },
            { status: 400 }
          );
        }

        await prisma.learningPlan.update({
          where: { id: planId },
          data: { status: "ACTIVE", lastRecalculatedAt: new Date() },
        });
        return NextResponse.json({
          success: true,
          planId,
          newStatus: "ACTIVE",
          message: `"${plan.goal.name}" is back on track! Let's keep going.`,
        });
      }

      case "abandon": {
        if (plan.status === "COMPLETED" || plan.status === "ABANDONED") {
          return NextResponse.json(
            { error: "This plan is already finished or abandoned" },
            { status: 400 }
          );
        }
        await prisma.learningPlan.update({
          where: { id: planId },
          data: { status: "ABANDONED" },
        });
        return NextResponse.json({
          success: true,
          planId,
          newStatus: "ABANDONED",
          message: `"${plan.goal.name}" has been abandoned. Your progress has been saved.`,
        });
      }

      case "update_target_date": {
        if (!targetDate) {
          return NextResponse.json(
            { error: "targetDate is required for this action" },
            { status: 400 }
          );
        }
        const newDate = new Date(targetDate);
        if (isNaN(newDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid date format" },
            { status: 400 }
          );
        }
        await prisma.learningPlan.update({
          where: { id: planId },
          data: { targetCompletionDate: newDate },
        });
        return NextResponse.json({
          success: true,
          planId,
          newTargetDate: newDate,
          message: `Target date updated to ${newDate.toLocaleDateString()}.`,
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Valid: "pause", "resume", "abandon", "update_target_date"',
          },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[goals/manage] POST Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to manage plan",
      },
      { status: 500 }
    );
  }
}
