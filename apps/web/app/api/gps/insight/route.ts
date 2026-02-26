/**
 * GET /api/gps/insight?planId=xxx
 *
 * Returns a Claude-generated daily insight for a learning plan.
 * Insights are cached for 12 hours in Redis.
 *
 * If no cached insight exists, generates a fresh one based on:
 * - Student progress (mastered/total concepts)
 * - Schedule status (ahead/behind)
 * - Velocity trend (accelerating/steady/slowing)
 * - Recent session performance
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import { getRedisClient, buildCacheKey } from "@/lib/cache/redis-client";
import type { AgeGroupValue } from "@/lib/prompts/types";
import { getPersonaName, getAgeInstruction } from "@/lib/prompts/types";
import { calculateStudentVelocity } from "@/lib/learning-plan/eta-calculator";

const INSIGHT_CACHE_TTL = 43200; // 12 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Fetch plan with related data
    const plan = await prisma.learningPlan.findUnique({
      where: { id: planId },
      include: {
        goal: true,
        student: {
          select: {
            id: true,
            displayName: true,
            ageGroup: true,
            avatarPersonaId: true,
            gradeLevel: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    const student = plan.student;
    const totalConcepts = plan.conceptSequence.length;
    const conceptsMastered = plan.currentConceptIndex;
    const conceptsRemaining = totalConcepts - conceptsMastered;
    const progressPct =
      totalConcepts > 0
        ? Math.round((conceptsMastered / totalConcepts) * 100)
        : 0;

    // Check cache first
    const cacheKey = buildCacheKey(
      "gps-insight",
      planId,
      String(conceptsMastered)
    );

    try {
      const redis = await getRedisClient();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return NextResponse.json({
            insight: parsed.insight,
            motivationalTip: parsed.motivationalTip,
            suggestedAction: parsed.suggestedAction,
            cached: true,
          });
        }
      }
    } catch {
      // Non-critical
    }

    // Calculate velocity for context
    const velocity = await calculateStudentVelocity(student.id);

    // Get recent session stats for more context
    const recentSessions = await prisma.learningSession.findMany({
      where: {
        studentId: student.id,
        state: "COMPLETED",
      },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        durationSeconds: true,
        questionsAnswered: true,
        correctAnswers: true,
        startedAt: true,
        currentNode: {
          select: { title: true, nodeCode: true },
        },
      },
    });

    const recentAccuracy =
      recentSessions.length > 0
        ? Math.round(
            (recentSessions.reduce((sum, s) => {
              return (
                sum +
                (s.questionsAnswered > 0
                  ? s.correctAnswers / s.questionsAnswered
                  : 0)
              );
            }, 0) /
              recentSessions.length) *
              100
          )
        : 0;

    const lastSessionTopic =
      recentSessions.length > 0 && recentSessions[0].currentNode
        ? recentSessions[0].currentNode.title
        : null;

    // Get next concept for forward-looking insight
    const nextConceptCode = plan.conceptSequence[conceptsMastered];
    let nextConceptTitle = null;
    if (nextConceptCode) {
      const nextNode = await prisma.knowledgeNode.findFirst({
        where: { nodeCode: nextConceptCode },
        select: { title: true },
      });
      nextConceptTitle = nextNode?.title;
    }

    // Generate insight with Claude
    const personaName = getPersonaName(student.avatarPersonaId);
    const ageInstruction = getAgeInstruction(
      student.ageGroup as AgeGroupValue
    );

    const daysDiff = plan.isAheadOfSchedule ? "ahead" : "behind";
    const scheduleContext = plan.targetCompletionDate
      ? `Target: ${plan.targetCompletionDate.toLocaleDateString()}, currently ${daysDiff}`
      : `On ${plan.isAheadOfSchedule ? "good" : "slightly behind"} pace`;

    const prompt = `Generate a personalized daily learning insight for a student's GPS dashboard.

CONTEXT:
- Student: ${student.displayName} (${student.ageGroup})
- Tutor persona: ${personaName}
- Age instruction: ${ageInstruction}
- Goal: ${plan.goal.name}
- Progress: ${conceptsMastered}/${totalConcepts} concepts mastered (${progressPct}%)
- Remaining: ${conceptsRemaining} concepts
- Schedule: ${scheduleContext}
- Velocity: ${velocity.currentWeeklyHours}h/week (trend: ${velocity.trend})
- Recent accuracy: ${recentAccuracy}%
- Last worked on: ${lastSessionTopic || "nothing yet"}
- Next up: ${nextConceptTitle || "TBD"}

REQUIREMENTS:
Generate JSON with 3 fields:
{
  "insight": "A personalized 1-2 sentence observation about their progress (max 40 words). Be specific to their situation — reference actual concepts, numbers, or patterns. Speak as the tutor persona.",
  "motivationalTip": "A short motivational message or fun fact related to what they're learning (max 25 words). Make it age-appropriate and engaging.",
  "suggestedAction": "One concrete, specific action they should do today (max 20 words). Be actionable and relevant to their current position in the plan."
}

TONE: Warm, encouraging, specific (not generic). ${ageInstruction}`;

    let insight = `Great progress on ${plan.goal.name}, ${student.displayName}! Keep it up!`;
    let motivationalTip = "Every concept you master brings you closer to your goal!";
    let suggestedAction = nextConceptTitle
      ? `Start with ${nextConceptTitle} today — you're ready for it!`
      : "Open a practice session to keep your momentum going!";

    try {
      const response = await callClaude(prompt, { maxTokens: 256 });
      if (response) {
        const parsed = JSON.parse(response);
        if (parsed.insight) insight = parsed.insight;
        if (parsed.motivationalTip) motivationalTip = parsed.motivationalTip;
        if (parsed.suggestedAction) suggestedAction = parsed.suggestedAction;
      }
    } catch (err) {
      console.warn("[gps/insight] Claude generation failed:", err);
      // Use fallback values set above
    }

    // Cache the result
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.set(
          cacheKey,
          JSON.stringify({ insight, motivationalTip, suggestedAction }),
          { EX: INSIGHT_CACHE_TTL }
        );
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      insight,
      motivationalTip,
      suggestedAction,
      cached: false,
      meta: {
        progressPct,
        conceptsMastered,
        conceptsRemaining,
        velocity: velocity.currentWeeklyHours,
        trend: velocity.trend,
        nextConcept: nextConceptTitle,
      },
    });
  } catch (err) {
    console.error("[gps/insight] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to generate insight",
      },
      { status: 500 }
    );
  }
}
