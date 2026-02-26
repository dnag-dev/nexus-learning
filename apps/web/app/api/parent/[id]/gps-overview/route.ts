/**
 * GET /api/parent/[id]/gps-overview
 *
 * Returns GPS overview data for ALL of a parent's children.
 * Summary view showing each child's active goals, progress, and schedule status.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getCachedETA } from "@/lib/learning-plan/eta-calculator";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    // Get the parent and their children
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        children: {
          select: {
            id: true,
            displayName: true,
            gradeLevel: true,
            avatarPersonaId: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }

    // Get GPS data for each child
    const childrenGPS = await Promise.all(
      parent.children.map(async (child) => {
        // Query plans directly for full field access
        const activePlans = await prisma.learningPlan.findMany({
          where: { studentId: child.id, status: "ACTIVE" },
          include: { goal: true },
          orderBy: { createdAt: "desc" },
        });

        if (activePlans.length === 0) {
          return {
            childId: child.id,
            childName: child.displayName,
            gradeLevel: child.gradeLevel,
            avatarPersonaId: child.avatarPersonaId,
            hasActivePlan: false,
            goals: [],
          };
        }

        const goals = await Promise.all(
          activePlans.map(async (plan) => {
            const totalConcepts = plan.conceptSequence.length;
            const masteredConcepts = plan.currentConceptIndex;
            const progressPercentage =
              totalConcepts > 0
                ? Math.round((masteredConcepts / totalConcepts) * 100)
                : 0;

            let etaData = null;
            try {
              etaData = await getCachedETA(plan.id);
            } catch {
              // Non-critical
            }

            let scheduleStatus: "ahead" | "on_track" | "behind" = "on_track";
            if (plan.targetCompletionDate) {
              const targetMs = plan.targetCompletionDate.getTime();
              const projectedMs = etaData?.projectedCompletionDate
                ? new Date(etaData.projectedCompletionDate).getTime()
                : plan.projectedCompletionDate?.getTime() ?? targetMs;
              const daysDiff = Math.round(
                (targetMs - projectedMs) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff > 7) scheduleStatus = "ahead";
              else if (daysDiff < -7) scheduleStatus = "behind";
            }

            // Get recent session count
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklyCount = await prisma.learningSession.count({
              where: {
                studentId: child.id,
                startedAt: { gte: weekAgo },
                state: "COMPLETED",
              },
            });

            return {
              planId: plan.id,
              goalName: plan.goal.name,
              goalCategory: plan.goal.category,
              progressPercentage,
              totalConcepts,
              masteredConcepts,
              scheduleStatus,
              weeklySessionCount: weeklyCount,
              projectedCompletionDate:
                etaData?.projectedCompletionDate ??
                plan.projectedCompletionDate ??
                plan.targetCompletionDate,
            };
          })
        );

        return {
          childId: child.id,
          childName: child.displayName,
          gradeLevel: child.gradeLevel,
          avatarPersonaId: child.avatarPersonaId,
          hasActivePlan: true,
          goals,
        };
      })
    );

    return NextResponse.json({
      parentId,
      children: childrenGPS,
      totalChildren: parent.children.length,
      childrenWithGoals: childrenGPS.filter((c) => c.hasActivePlan).length,
    });
  } catch (err) {
    console.error("[parent/gps-overview] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load GPS overview",
      },
      { status: 500 }
    );
  }
}
