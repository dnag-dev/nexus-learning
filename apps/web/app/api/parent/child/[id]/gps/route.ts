/**
 * GET /api/parent/child/[id]/gps
 *
 * Returns GPS overview data for a specific child.
 * Shows: all active goals, progress %, ETA, schedule status,
 * weekly hours, next concepts, session summary, Claude weekly insight.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getCachedETA } from "@/lib/learning-plan/eta-calculator";
import { getNextConceptInPlan, generateLearningPlan } from "@/lib/learning-plan/plan-generator";
import { callClaude } from "@/lib/session/claude-client";

/** Parse grade string (K, G1, G5) to numeric (0, 1, 5) */
function gradeToNumeric(grade: string): number {
  if (grade === "K") return 0;
  const match = grade.match(/G?(\d+)/);
  return match ? parseInt(match[1]) : 5;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: childId },
      select: {
        id: true,
        displayName: true,
        gradeLevel: true,
        avatarPersonaId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get all active learning plans (raw Prisma query for full fields)
    const activePlans = await prisma.learningPlan.findMany({
      where: { studentId: childId, status: "ACTIVE" },
      include: { goal: true },
      orderBy: { createdAt: "desc" },
    });

    if (activePlans.length === 0) {
      // Auto-create a default learning plan for the student's grade level
      try {
        const numericGrade = gradeToNumeric(student.gradeLevel);
        // Find grade-level math proficiency goal
        const defaultGoal = await prisma.learningGoal.findFirst({
          where: {
            gradeLevel: numericGrade,
            category: "GRADE_PROFICIENCY",
            name: { contains: "Math" },
          },
        });
        if (defaultGoal) {
          await generateLearningPlan({
            goalId: defaultGoal.id,
            studentId: childId,
            weeklyHoursAvailable: 3,
          });
          // Re-fetch the newly created plan
          const newPlans = await prisma.learningPlan.findMany({
            where: { studentId: childId, status: "ACTIVE" },
            include: { goal: true },
            orderBy: { createdAt: "desc" },
          });
          if (newPlans.length > 0) {
            activePlans.push(...newPlans);
          }
        }
      } catch (e) {
        console.error("Auto-create plan error (non-critical):", e);
      }

      // If still no plans after auto-create attempt
      if (activePlans.length === 0) {
        return NextResponse.json({
          childName: student.displayName,
          childId,
          hasActivePlans: false,
          plans: [],
          weeklyInsight: null,
        });
      }
    }

    // Build GPS data for each plan
    const planData = await Promise.all(
      activePlans.map(async (plan) => {
        // Calculate progress
        const totalConcepts = plan.conceptSequence.length;
        const masteredConcepts = plan.currentConceptIndex;
        const progressPercentage =
          totalConcepts > 0
            ? Math.round((masteredConcepts / totalConcepts) * 100)
            : 0;

        // Get ETA data
        let etaData = null;
        try {
          etaData = await getCachedETA(plan.id);
        } catch {
          // Non-critical
        }

        // Calculate schedule status
        let scheduleStatus: "ahead" | "on_track" | "behind" = "on_track";
        let daysDifference = 0;

        if (plan.targetCompletionDate) {
          const targetMs = new Date(plan.targetCompletionDate).getTime();
          const projectedMs = etaData?.projectedCompletionDate
            ? new Date(etaData.projectedCompletionDate).getTime()
            : targetMs;
          daysDifference = Math.round(
            (targetMs - projectedMs) / (1000 * 60 * 60 * 24)
          );

          if (daysDifference > 7) scheduleStatus = "ahead";
          else if (daysDifference < -7) scheduleStatus = "behind";
        }

        // Get next 3 concepts
        const nextConcepts: Array<{
          nodeCode: string;
          title: string;
          domain: string;
        }> = [];
        try {
          const nextConcept = await getNextConceptInPlan(plan.id);
          if (nextConcept) {
            // Look up domain from DB since getNextConceptInPlan doesn't return it
            const firstNode = await prisma.knowledgeNode.findFirst({
              where: { nodeCode: nextConcept.nodeCode },
              select: { domain: true },
            });
            nextConcepts.push({
              nodeCode: nextConcept.nodeCode,
              title: nextConcept.title,
              domain: firstNode?.domain ?? "Math",
            });

            // Get 2 more after the current
            const currentIdx = plan.conceptSequence.indexOf(
              nextConcept.nodeCode
            );
            for (let i = currentIdx + 1; i < Math.min(currentIdx + 3, plan.conceptSequence.length); i++) {
              const code = plan.conceptSequence[i];
              const node = await prisma.knowledgeNode.findUnique({
                where: { nodeCode: code },
                select: { nodeCode: true, title: true, domain: true },
              });
              if (node) nextConcepts.push(node);
            }
          }
        } catch {
          // Non-critical
        }

        // Get weekly session summary
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklySessions = await prisma.learningSession.findMany({
          where: {
            studentId: childId,
            startedAt: { gte: weekAgo },
            state: "COMPLETED",
          },
          select: {
            durationSeconds: true,
            correctAnswers: true,
            questionsAnswered: true,
          },
        });

        const weeklyMinutes = Math.round(
          weeklySessions.reduce(
            (sum, s) => sum + (s.durationSeconds ?? 0),
            0
          ) / 60
        );
        const weeklyAccuracy =
          weeklySessions.length > 0
            ? Math.round(
                (weeklySessions.reduce(
                  (sum, s) => sum + (s.correctAnswers ?? 0),
                  0
                ) /
                  Math.max(
                    1,
                    weeklySessions.reduce(
                      (sum, s) => sum + (s.questionsAnswered ?? 0),
                      0
                    )
                  )) *
                  100
              )
            : 0;

        // Get milestone results
        const milestones = await prisma.milestoneResult.findMany({
          where: { planId: plan.id },
          orderBy: { weekNumber: "desc" },
          take: 5,
          select: {
            weekNumber: true,
            passed: true,
            score: true,
            completedAt: true,
          },
        });

        return {
          planId: plan.id,
          goalName: plan.goal.name,
          goalCategory: plan.goal.category,
          goalDescription: plan.goal.description,
          progressPercentage,
          totalConcepts,
          masteredConcepts,
          remainingConcepts: totalConcepts - masteredConcepts,
          etaData: etaData
            ? {
                projectedCompletionDate: etaData.projectedCompletionDate,
                progressPercentage: etaData.progressPercentage,
                isAheadOfSchedule: etaData.isAheadOfSchedule,
              }
            : null,
          targetDate: plan.targetCompletionDate,
          scheduleStatus,
          daysDifference,
          currentVelocity: plan.velocityHoursPerWeek,
          weeklyHoursTarget: plan.velocityHoursPerWeek,
          weeklyMinutesActual: weeklyMinutes,
          weeklyAccuracy,
          weeklySessionCount: weeklySessions.length,
          nextConcepts,
          milestones,
          createdAt: plan.createdAt,
        };
      })
    );

    // Generate weekly insight from Claude
    let weeklyInsight: string | null = null;
    try {
      const mainPlan = planData[0];
      const prompt = `You are Cosmo, a friendly bear guide. Generate a brief parent-focused weekly insight (2 sentences) about their child's learning progress.

Child: ${student.displayName} (${student.gradeLevel})
Goal: ${mainPlan.goalName}
Progress: ${mainPlan.progressPercentage}% (${mainPlan.masteredConcepts}/${mainPlan.totalConcepts} concepts)
This week: ${mainPlan.weeklyMinutesActual} minutes across ${mainPlan.weeklySessionCount} sessions
Accuracy: ${mainPlan.weeklyAccuracy}%
Schedule: ${mainPlan.scheduleStatus} (${Math.abs(mainPlan.daysDifference)} days ${mainPlan.daysDifference >= 0 ? "ahead" : "behind"})
Next topic: ${mainPlan.nextConcepts[0]?.title ?? "N/A"}

Respond with ONLY a JSON object: {"insight": "<2 sentence parent-focused insight>"}`;

      const claudeResult = await callClaude(prompt, { maxTokens: 150 });
      if (claudeResult) {
        try {
          const parsed = JSON.parse(claudeResult) as { insight?: string };
          weeklyInsight = parsed.insight ?? null;
        } catch {
          weeklyInsight = claudeResult.replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      childName: student.displayName,
      childId,
      hasActivePlans: true,
      plans: planData,
      weeklyInsight,
    });
  } catch (err) {
    console.error("[parent/child/gps] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load GPS data",
      },
      { status: 500 }
    );
  }
}
