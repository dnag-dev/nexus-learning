/**
 * GET /api/gps/dashboard?studentId=xxx&planId=yyy
 *
 * Aggregates all Learning GPS data for the dashboard:
 * - Active plan details with goal info
 * - Progress: mastered/total, percentage, schedule status
 * - ETA: projected date, hours remaining, velocity data
 * - Path: 2 mastered → current → 4 upcoming concept nodes
 * - Today's mission: next concept to learn
 * - Velocity sparkline data (ETA history)
 * - Streak data
 * - Weekly milestone status
 *
 * If planId is provided, returns data for that specific plan.
 * Otherwise returns the most recently created active plan.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getCachedETA, getETAHistory, calculateStudentVelocity } from "@/lib/learning-plan/eta-calculator";
import { getNextConceptInPlan } from "@/lib/learning-plan/plan-generator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const planId = searchParams.get("planId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // 1. Find the plan
    let plan;
    if (planId) {
      plan = await prisma.learningPlan.findUnique({
        where: { id: planId },
        include: {
          goal: true,
          student: {
            select: {
              id: true,
              displayName: true,
              gradeLevel: true,
              ageGroup: true,
              avatarPersonaId: true,
            },
          },
        },
      });
    } else {
      // Get most recent active plan
      plan = await prisma.learningPlan.findFirst({
        where: { studentId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          goal: true,
          student: {
            select: {
              id: true,
              displayName: true,
              gradeLevel: true,
              ageGroup: true,
              avatarPersonaId: true,
            },
          },
        },
      });
    }

    if (!plan) {
      return NextResponse.json(
        { error: "No active learning plan found", hasPlans: false },
        { status: 404 }
      );
    }

    // 2. Get all active plans for this student (for plan switcher)
    const allPlans = await prisma.learningPlan.findMany({
      where: { studentId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { goal: true },
      orderBy: { createdAt: "desc" },
    });

    // 3. Build concept path — show ALL concepts in plan
    const conceptSequence = plan.conceptSequence;
    const currentIndex = plan.currentConceptIndex;

    // Fetch node details for the full concept sequence
    const pathStart = 0;
    const pathEnd = conceptSequence.length;
    const pathCodes = conceptSequence.slice(pathStart, pathEnd);

    const pathNodes = await prisma.knowledgeNode.findMany({
      where: { nodeCode: { in: pathCodes } },
      select: {
        id: true,
        nodeCode: true,
        title: true,
        domain: true,
        difficulty: true,
        gradeLevel: true,
        subject: true,
      },
    });

    // Get mastery for path nodes
    const pathNodeIds = pathNodes.map((n) => n.id);
    const pathMastery = await prisma.masteryScore.findMany({
      where: { studentId, nodeId: { in: pathNodeIds } },
      select: { nodeId: true, bktProbability: true, level: true },
    });

    const masteryByNodeId = new Map(
      pathMastery.map((m) => [m.nodeId, { bkt: m.bktProbability, level: m.level }])
    );

    // Build path with status
    const conceptPath = pathCodes.map((code, i) => {
      const node = pathNodes.find((n) => n.nodeCode === code);
      if (!node) return { code, title: code, status: "unknown" as const, domain: "", difficulty: 0 };

      const mastery = masteryByNodeId.get(node.id);
      const globalIndex = pathStart + i;

      let status: "mastered" | "current" | "upcoming" | "locked";
      if (mastery && mastery.bkt >= 0.85) {
        status = "mastered";
      } else if (globalIndex === currentIndex) {
        status = "current";
      } else if (globalIndex < currentIndex) {
        // Behind current index but not mastered — in review
        status = "current";
      } else {
        status = "upcoming";
      }

      return {
        code: node.nodeCode,
        title: node.title,
        domain: node.domain,
        difficulty: node.difficulty,
        gradeLevel: node.gradeLevel,
        subject: node.subject ?? "MATH",
        status,
        bkt: mastery?.bkt ?? 0,
        level: mastery?.level ?? "NOT_STARTED",
        positionInPlan: globalIndex + 1,
      };
    });

    // 4. Today's mission — next concept to learn
    let todaysMission = null;
    try {
      todaysMission = await getNextConceptInPlan(plan.id);
    } catch {
      // Non-critical
    }

    // 5. ETA data (try cache first, fall back to DB)
    let etaData = await getCachedETA(plan.id);

    if (!etaData) {
      // Build from plan data directly
      const totalConcepts = conceptSequence.length;
      const conceptsMastered = currentIndex;
      const progressPercentage =
        totalConcepts > 0
          ? Math.round((conceptsMastered / totalConcepts) * 100)
          : 0;

      etaData = {
        conceptsRemaining: totalConcepts - conceptsMastered,
        conceptsMastered,
        hoursRemaining: plan.totalEstimatedHours - plan.hoursCompleted,
        projectedCompletionDate: plan.projectedCompletionDate,
        velocityHoursPerWeek: plan.velocityHoursPerWeek,
        isAheadOfSchedule: plan.isAheadOfSchedule,
        daysDifference: 0,
        progressPercentage,
        scheduleMessage: plan.isAheadOfSchedule
          ? "On track!"
          : "Slightly behind — keep going!",
        insight: "",
      };
    }

    // 6. Velocity sparkline data
    const etaHistory = await getETAHistory(plan.id, 20);

    // 7. Calculate current velocity
    const velocity = await calculateStudentVelocity(studentId);

    // 8. Streak data
    let streak = null;
    try {
      const streakData = await prisma.streakData.findUnique({
        where: { studentId },
      });
      if (streakData) {
        streak = {
          current: streakData.currentStreak,
          longest: streakData.longestStreak,
          lastSessionDate: streakData.lastActiveDate,
        };
      }
    } catch {
      // Non-critical
    }

    // 9. Weekly milestone status
    const currentWeek = Math.floor(currentIndex / (conceptSequence.length / (plan.weeklyMilestones as unknown[]).length || 1)) + 1;
    const milestones = plan.weeklyMilestones as Array<{
      weekNumber: number;
      concepts: string[];
      conceptTitles: string[];
      estimatedHours: number;
      cumulativeProgress: number;
      milestoneCheck: boolean;
    }>;

    // Check for upcoming milestone assessment
    const completedMilestones = await prisma.milestoneResult.findMany({
      where: { planId: plan.id },
      select: { weekNumber: true, passed: true },
      orderBy: { weekNumber: "desc" },
    });

    const completedWeeks = new Set(completedMilestones.map((m) => m.weekNumber));
    const nextMilestone = milestones.find(
      (m) => m.milestoneCheck && !completedWeeks.has(m.weekNumber) && m.weekNumber <= currentWeek
    );

    // 10. Recent session stats
    const recentSessions = await prisma.learningSession.findMany({
      where: {
        studentId,
        state: "COMPLETED",
      },
      orderBy: { startedAt: "desc" },
      take: 7,
      select: {
        durationSeconds: true,
        questionsAnswered: true,
        correctAnswers: true,
        startedAt: true,
      },
    });

    const weeklyStats = {
      sessionsThisWeek: recentSessions.length,
      totalMinutesThisWeek: Math.round(
        recentSessions.reduce((s, r) => s + (r.durationSeconds ?? 0), 0) / 60
      ),
      avgAccuracy:
        recentSessions.length > 0
          ? Math.round(
              (recentSessions.reduce((s, r) => {
                const acc =
                  r.questionsAnswered > 0
                    ? r.correctAnswers / r.questionsAnswered
                    : 0;
                return s + acc;
              }, 0) /
                recentSessions.length) *
                100
            )
          : 0,
    };

    // 11. Build the dashboard response
    return NextResponse.json({
      plan: {
        id: plan.id,
        status: plan.status,
        goalId: plan.goal.id,
        goalName: plan.goal.name,
        goalCategory: plan.goal.category,
        goalDescription: plan.goal.description,
        totalConcepts: conceptSequence.length,
        conceptsMastered: etaData.conceptsMastered ?? currentIndex,
        totalEstimatedHours: plan.totalEstimatedHours,
        hoursCompleted: plan.hoursCompleted,
        progressPercentage: etaData.progressPercentage ?? 0,
        createdAt: plan.createdAt,
      },
      eta: {
        projectedCompletionDate: etaData.projectedCompletionDate ?? plan.projectedCompletionDate,
        targetCompletionDate: plan.targetCompletionDate,
        hoursRemaining: etaData.hoursRemaining ?? (plan.totalEstimatedHours - plan.hoursCompleted),
        velocityHoursPerWeek: etaData.velocityHoursPerWeek ?? plan.velocityHoursPerWeek,
        isAheadOfSchedule: etaData.isAheadOfSchedule ?? plan.isAheadOfSchedule,
        daysDifference: etaData.daysDifference ?? 0,
        scheduleMessage: etaData.scheduleMessage ?? "",
        insight: etaData.insight ?? "",
      },
      velocity: {
        currentWeeklyHours: velocity.currentWeeklyHours,
        previousWeeklyHours: velocity.previousWeeklyHours,
        trend: velocity.trend,
        sessionsLast4Weeks: velocity.sessionsLast4Weeks,
      },
      etaHistory,
      conceptPath,
      todaysMission,
      streak,
      milestone: nextMilestone
        ? {
            weekNumber: nextMilestone.weekNumber,
            concepts: nextMilestone.concepts,
            isDue: true,
          }
        : null,
      completedMilestones: completedMilestones.map((m) => ({
        weekNumber: m.weekNumber,
        passed: m.passed,
      })),
      weeklyStats,
      student: plan.student,
      allPlans: allPlans.map((p) => ({
        id: p.id,
        goalName: p.goal.name,
        status: p.status,
        progressPercentage: p.conceptSequence.length > 0
          ? Math.round((p.currentConceptIndex / p.conceptSequence.length) * 100)
          : 0,
      })),
    });
  } catch (err) {
    console.error("[gps/dashboard] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load GPS dashboard",
      },
      { status: 500 }
    );
  }
}
