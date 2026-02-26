/**
 * ETA Calculator Engine — Step 5 of Learning GPS
 *
 * Recalculates the projected completion date for a learning plan after
 * each session, tracks ETA history via ETASnapshot, and generates
 * Claude-powered progress insights.
 *
 * Wired into the session end route to run automatically after each session.
 *
 * Reuses:
 *   - Plan generator helpers for mastery lookup
 *   - callClaude() for insight generation
 *   - Redis for caching ETA + insight
 */

import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import { getRedisClient, buildCacheKey } from "@/lib/cache/redis-client";
import type { AgeGroupValue } from "@/lib/prompts/types";
import { getPersonaName, getAgeInstruction } from "@/lib/prompts/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ETAResult {
  planId: string;
  snapshotId: string;
  conceptsRemaining: number;
  conceptsMastered: number;
  totalConcepts: number;
  hoursRemaining: number;
  velocityHoursPerWeek: number;
  projectedCompletionDate: Date;
  targetCompletionDate: Date | null;
  isAheadOfSchedule: boolean;
  daysDifference: number; // positive = ahead, negative = behind
  progressPercentage: number;
  scheduleMessage: string;
  insight: string;
}

export interface VelocityData {
  currentWeeklyHours: number;
  previousWeeklyHours: number;
  trend: "accelerating" | "steady" | "slowing" | "insufficient_data";
  sessionsLast4Weeks: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ETA_CACHE_TTL = 3600; // 1 hour
const INSIGHT_CACHE_TTL = 43200; // 12 hours

// Difficulty → estimated hours per concept (matches plan-generator)
const BASE_HOURS_BY_DIFFICULTY: Record<number, number> = {
  1: 0.4, 2: 0.5, 3: 0.6, 4: 0.75, 5: 1.0,
  6: 1.25, 7: 1.5, 8: 2.0, 9: 2.5, 10: 3.0,
};

// ─── Core: Calculate Student Velocity ───────────────────────────────────────

/**
 * Calculate the student's learning velocity from recent sessions.
 * Returns hours studied per week, broken into current and previous 2-week periods
 * plus trend direction.
 */
export async function calculateStudentVelocity(
  studentId: string
): Promise<VelocityData> {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Current 2-week window
  const currentSessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      startedAt: { gte: twoWeeksAgo },
      state: "COMPLETED",
    },
    select: { durationSeconds: true },
  });

  // Previous 2-week window (2-4 weeks ago)
  const previousSessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      startedAt: { gte: fourWeeksAgo, lt: twoWeeksAgo },
      state: "COMPLETED",
    },
    select: { durationSeconds: true },
  });

  const totalCurrentHours = currentSessions.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0) / 3600,
    0
  );
  const totalPreviousHours = previousSessions.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0) / 3600,
    0
  );

  // Normalize to weekly
  const currentWeeklyHours = Math.round((totalCurrentHours / 2) * 100) / 100;
  const previousWeeklyHours = Math.round((totalPreviousHours / 2) * 100) / 100;

  const totalSessions = currentSessions.length + previousSessions.length;

  // Determine trend
  let trend: VelocityData["trend"];
  if (totalSessions < 3) {
    trend = "insufficient_data";
  } else if (currentWeeklyHours > previousWeeklyHours * 1.15) {
    trend = "accelerating";
  } else if (currentWeeklyHours < previousWeeklyHours * 0.85) {
    trend = "slowing";
  } else {
    trend = "steady";
  }

  return {
    currentWeeklyHours,
    previousWeeklyHours,
    trend,
    sessionsLast4Weeks: totalSessions,
  };
}

// ─── Core: Recalculate Plan ETA ─────────────────────────────────────────────

/**
 * Recalculates the ETA for a learning plan based on current progress and velocity.
 * Creates an ETASnapshot for historical tracking.
 * Updates the LearningPlan record.
 * Caches result in Redis.
 */
export async function recalculatePlanETA(
  planId: string,
  latestSessionId?: string
): Promise<ETAResult | null> {
  // 1. Fetch the plan
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    include: { student: true, goal: true },
  });
  if (!plan || plan.status !== "ACTIVE") return null;

  const student = plan.student;
  const conceptSequence = plan.conceptSequence;
  const totalConcepts = conceptSequence.length;

  // 2. Count mastered concepts — check BKT scores for all concepts in sequence
  const allNodes = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: conceptSequence } },
    select: { id: true, nodeCode: true, difficulty: true },
  });

  const nodeIdMap = new Map(allNodes.map((n) => [n.nodeCode, n]));
  const nodeIds = allNodes.map((n) => n.id);

  const masteryScores = await prisma.masteryScore.findMany({
    where: {
      studentId: student.id,
      nodeId: { in: nodeIds },
    },
    select: { nodeId: true, bktProbability: true },
  });

  const masteryByNodeId = new Map(masteryScores.map((s) => [s.nodeId, s.bktProbability]));

  let conceptsMastered = 0;
  let hoursRemaining = 0;

  for (const code of conceptSequence) {
    const node = nodeIdMap.get(code);
    if (!node) continue;

    const bkt = masteryByNodeId.get(node.id) ?? 0;
    if (bkt >= 0.85) {
      conceptsMastered++;
    } else {
      // Estimate remaining hours based on difficulty and partial mastery
      const baseHours = BASE_HOURS_BY_DIFFICULTY[node.difficulty] ?? 1.0;
      const discount = bkt > 0.5 ? 0.5 : bkt > 0.3 ? 0.75 : 1.0;
      hoursRemaining += baseHours * discount;
    }
  }

  const conceptsRemaining = totalConcepts - conceptsMastered;
  hoursRemaining = Math.round(hoursRemaining * 10) / 10;

  // 3. Calculate velocity
  const velocity = await calculateStudentVelocity(student.id);
  const effectiveWeeklyHours = velocity.currentWeeklyHours > 0
    ? velocity.currentWeeklyHours
    : plan.velocityHoursPerWeek > 0
      ? plan.velocityHoursPerWeek
      : 3; // Default fallback: 3 hours/week

  // 4. Calculate projected completion date
  const weeksRemaining = effectiveWeeklyHours > 0
    ? hoursRemaining / effectiveWeeklyHours
    : hoursRemaining; // Worst case: 1 concept per week

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + Math.ceil(weeksRemaining * 7));

  // 5. Calculate schedule status
  const targetDate = plan.targetCompletionDate;
  let daysDifference = 0;
  let isAheadOfSchedule = true;

  if (targetDate) {
    const targetMs = targetDate.getTime();
    const projectedMs = projectedDate.getTime();
    daysDifference = Math.round((targetMs - projectedMs) / (1000 * 60 * 60 * 24));
    isAheadOfSchedule = daysDifference >= 0;
  } else {
    // Compare against original projected date
    const originalMs = plan.projectedCompletionDate.getTime();
    const newMs = projectedDate.getTime();
    daysDifference = Math.round((originalMs - newMs) / (1000 * 60 * 60 * 24));
    isAheadOfSchedule = daysDifference >= 0;
  }

  // 6. Generate schedule message
  const scheduleMessage = generateScheduleMessage(
    isAheadOfSchedule,
    daysDifference,
    velocity.trend,
    conceptsRemaining,
    conceptsMastered
  );

  // 7. Progress percentage
  const progressPercentage = totalConcepts > 0
    ? Math.round((conceptsMastered / totalConcepts) * 100)
    : 0;

  // 8. Generate insight (cached)
  const insight = await generateProgressInsight(
    student.displayName,
    student.ageGroup as AgeGroupValue,
    student.avatarPersonaId,
    plan.goal.name,
    conceptsMastered,
    conceptsRemaining,
    isAheadOfSchedule,
    daysDifference,
    velocity.trend,
    planId
  );

  // 9. Save ETASnapshot
  const snapshot = await prisma.eTASnapshot.create({
    data: {
      planId,
      triggeredBySessionId: latestSessionId,
      conceptsRemaining,
      conceptsMastered,
      hoursRemaining,
      projectedCompletion: projectedDate,
      velocityAtSnapshot: effectiveWeeklyHours,
      isAheadOfSchedule,
      daysDifference,
      insight,
    },
  });

  // 10. Update the learning plan
  await prisma.learningPlan.update({
    where: { id: planId },
    data: {
      currentConceptIndex: conceptsMastered,
      hoursCompleted: plan.totalEstimatedHours - hoursRemaining,
      projectedCompletionDate: projectedDate,
      velocityHoursPerWeek: effectiveWeeklyHours,
      isAheadOfSchedule,
      lastRecalculatedAt: new Date(),
      // Check if plan is complete
      status: conceptsRemaining === 0 ? "COMPLETED" : "ACTIVE",
    },
  });

  // 11. Cache in Redis
  try {
    const redis = await getRedisClient();
    if (redis) {
      const cacheKey = buildCacheKey("eta", planId);
      const cacheData = {
        conceptsRemaining,
        conceptsMastered,
        hoursRemaining,
        projectedCompletionDate: projectedDate.toISOString(),
        velocityHoursPerWeek: effectiveWeeklyHours,
        isAheadOfSchedule,
        daysDifference,
        progressPercentage,
        scheduleMessage,
        insight,
        cachedAt: new Date().toISOString(),
      };
      await redis.set(cacheKey, JSON.stringify(cacheData), { EX: ETA_CACHE_TTL });
    }
  } catch (e) {
    console.warn("[ETACalculator] Redis cache error (non-critical):", e);
  }

  const result: ETAResult = {
    planId,
    snapshotId: snapshot.id,
    conceptsRemaining,
    conceptsMastered,
    totalConcepts,
    hoursRemaining,
    velocityHoursPerWeek: effectiveWeeklyHours,
    projectedCompletionDate: projectedDate,
    targetCompletionDate: targetDate,
    isAheadOfSchedule,
    daysDifference,
    progressPercentage,
    scheduleMessage,
    insight,
  };

  console.log(
    `[ETACalculator] Plan ${planId}: ${progressPercentage}% done, ` +
    `${hoursRemaining}h remaining, ${isAheadOfSchedule ? "ahead" : "behind"} ` +
    `by ${Math.abs(daysDifference)} days`
  );

  return result;
}

// ─── Schedule Message Generator ─────────────────────────────────────────────

function generateScheduleMessage(
  isAhead: boolean,
  daysDiff: number,
  trend: VelocityData["trend"],
  remaining: number,
  mastered: number
): string {
  const absDays = Math.abs(daysDiff);

  if (remaining === 0) {
    return "🎉 Congratulations! You've completed all concepts in this goal!";
  }

  if (mastered === 0 && remaining > 0) {
    return "🚀 Ready to begin your learning journey! Let's get started.";
  }

  if (isAhead) {
    if (absDays > 14) {
      return `🏃 You're ${absDays} days ahead of schedule! Amazing pace!`;
    }
    if (absDays > 7) {
      return `✨ ${absDays} days ahead! Keep up this great momentum.`;
    }
    if (absDays > 0) {
      return `👍 Right on track — ${absDays} days ahead.`;
    }
    return "👍 Right on schedule. Great consistency!";
  }

  // Behind schedule
  if (absDays > 14) {
    if (trend === "accelerating") {
      return `📈 ${absDays} days behind, but you're picking up speed! Keep going.`;
    }
    return `⏰ ${absDays} days behind schedule. Try adding an extra session this week!`;
  }
  if (absDays > 7) {
    return `📅 ${absDays} days behind — a few extra practice sessions will get you back on track.`;
  }
  return `📅 Slightly behind by ${absDays} days — totally catchable!`;
}

// ─── Claude Progress Insight Generator ──────────────────────────────────────

async function generateProgressInsight(
  studentName: string,
  ageGroup: AgeGroupValue,
  personaId: string,
  goalName: string,
  mastered: number,
  remaining: number,
  isAhead: boolean,
  daysDiff: number,
  trend: VelocityData["trend"],
  planId: string
): Promise<string> {
  // Check cache first
  try {
    const redis = await getRedisClient();
    if (redis) {
      const cacheKey = buildCacheKey("insight", planId, String(mastered));
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    }
  } catch {
    // Non-critical
  }

  const personaName = getPersonaName(personaId);
  const ageInstruction = getAgeInstruction(ageGroup);
  const total = mastered + remaining;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const prompt = `Generate a short, personalized daily progress insight for a student.

CONTEXT:
- Student: ${studentName}
- Tutor persona: ${personaName}
- Age instruction: ${ageInstruction}
- Goal: ${goalName}
- Progress: ${mastered}/${total} concepts mastered (${pct}%)
- Remaining: ${remaining} concepts
- Schedule: ${isAhead ? `${daysDiff} days ahead` : `${Math.abs(daysDiff)} days behind`}
- Velocity trend: ${trend}

REQUIREMENTS:
- Write exactly ONE sentence (max 30 words) as the tutor persona
- Be specific to the student's situation (not generic)
- If ahead: celebrate, suggest a stretch goal or fun challenge
- If behind: encourage without guilt, suggest a small actionable step
- If just starting: welcome and preview the first topic
- Match the persona's tone and age group's language
- Be warm and motivating

Respond with JSON:
{
  "insight": "The one-sentence insight"
}`;

  try {
    const response = await callClaude(prompt, { maxTokens: 128 });
    if (response) {
      const parsed = JSON.parse(response);
      if (parsed.insight) {
        // Cache the insight
        try {
          const redis = await getRedisClient();
          if (redis) {
            const cacheKey = buildCacheKey("insight", planId, String(mastered));
            await redis.set(cacheKey, parsed.insight, { EX: INSIGHT_CACHE_TTL });
          }
        } catch {
          // Non-critical
        }
        return parsed.insight;
      }
    }
  } catch (err) {
    console.warn("[ETACalculator] Claude insight generation failed:", err);
  }

  // Fallback insight
  if (remaining === 0) return `Amazing work, ${studentName}! You've mastered everything! 🎉`;
  if (mastered === 0) return `Welcome to your ${goalName} journey, ${studentName}! Let's start strong! 🚀`;
  if (isAhead) return `You're ${daysDiff} days ahead on ${goalName} — keep that momentum going, ${studentName}! ⭐`;
  return `${remaining} concepts to go on ${goalName} — you've got this, ${studentName}! 💪`;
}

// ─── Helper: Get Cached ETA ─────────────────────────────────────────────────

/**
 * Get the cached ETA for a plan, or null if not cached.
 * Avoids recalculation for dashboard reads.
 */
export async function getCachedETA(
  planId: string
): Promise<Partial<ETAResult> | null> {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;

    const cacheKey = buildCacheKey("eta", planId);
    const cached = await redis.get(cacheKey);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch {
    return null;
  }
}

// ─── Helper: Get ETA History ────────────────────────────────────────────────

/**
 * Returns the last N ETASnapshots for a plan, useful for sparkline charts.
 */
export async function getETAHistory(
  planId: string,
  limit: number = 20
): Promise<Array<{
  date: Date;
  conceptsRemaining: number;
  hoursRemaining: number;
  velocityHoursPerWeek: number;
  isAheadOfSchedule: boolean;
}>> {
  const snapshots = await prisma.eTASnapshot.findMany({
    where: { planId },
    orderBy: { recordedAt: "desc" },
    take: limit,
    select: {
      recordedAt: true,
      conceptsRemaining: true,
      hoursRemaining: true,
      velocityAtSnapshot: true,
      isAheadOfSchedule: true,
    },
  });

  return snapshots
    .map((s) => ({
      date: s.recordedAt,
      conceptsRemaining: s.conceptsRemaining,
      hoursRemaining: s.hoursRemaining,
      velocityHoursPerWeek: s.velocityAtSnapshot,
      isAheadOfSchedule: s.isAheadOfSchedule,
    }))
    .reverse(); // Chronological order
}

// ─── Session End Hook ───────────────────────────────────────────────────────

/**
 * Called at the end of each session to update all active plans.
 * Recalculates ETA and checks if any concepts were mastered.
 *
 * Wire this into `apps/web/app/api/session/end/route.ts` after
 * the gamification processing.
 */
export async function updatePlansAfterSession(
  studentId: string,
  sessionId: string
): Promise<{
  updatedPlans: Array<{
    planId: string;
    goalName: string;
    progressPercentage: number;
    isAheadOfSchedule: boolean;
    insight: string;
  }>;
}> {
  // Find all active plans for this student
  const activePlans = await prisma.learningPlan.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { goal: true },
  });

  if (activePlans.length === 0) {
    return { updatedPlans: [] };
  }

  const updatedPlans: Array<{
    planId: string;
    goalName: string;
    progressPercentage: number;
    isAheadOfSchedule: boolean;
    insight: string;
  }> = [];

  for (const plan of activePlans) {
    try {
      const etaResult = await recalculatePlanETA(plan.id, sessionId);
      if (etaResult) {
        updatedPlans.push({
          planId: plan.id,
          goalName: plan.goal.name,
          progressPercentage: etaResult.progressPercentage,
          isAheadOfSchedule: etaResult.isAheadOfSchedule,
          insight: etaResult.insight,
        });
      }
    } catch (err) {
      console.error(
        `[ETACalculator] Failed to update plan ${plan.id}:`,
        err
      );
    }
  }

  console.log(
    `[ETACalculator] Updated ${updatedPlans.length} plan(s) for student ${studentId}`
  );

  return { updatedPlans };
}
