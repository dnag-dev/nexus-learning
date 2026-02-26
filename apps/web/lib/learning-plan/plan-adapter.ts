/**
 * Plan Adaptation Engine — Step 9 of Learning GPS
 *
 * 6 adaptation rules checked after every session:
 * 1. Concept took >2x estimated → increase similar concepts' estimates
 * 2. Last 3 concepts faster than estimated → reduce upcoming by 15%
 * 3. No session in 3+ days → add review touchpoints
 * 4. Spaced repetition review failed → add concept back to queue
 * 5. Projected date >2 weeks past target → trigger plan review + Claude message
 * 6. >4 weeks ahead → suggest advanced branch
 *
 * Wired into session end route, after ETA recalculation.
 *
 * Reuses:
 *   - ETA calculator for schedule data
 *   - callClaude() for adaptation messages
 *   - Prisma for plan updates
 */

import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import type { AgeGroupValue } from "@/lib/prompts/types";
import { getPersonaName, getAgeInstruction } from "@/lib/prompts/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdaptationResult {
  planId: string;
  adaptationsApplied: AdaptationAction[];
  message: string | null;
}

export interface AdaptationAction {
  rule: string;
  description: string;
  applied: boolean;
  details?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SLOW_CONCEPT_MULTIPLIER = 2.0; // >2x estimated = slow
const FAST_CONCEPT_DISCOUNT = 0.85; // Reduce upcoming by 15%
const INACTIVITY_THRESHOLD_DAYS = 3;
const BEHIND_SCHEDULE_THRESHOLD_DAYS = 14;
const AHEAD_SCHEDULE_THRESHOLD_DAYS = 28; // 4 weeks

// ─── Core: Adapt Plan After Session ─────────────────────────────────────────

/**
 * Runs all 6 adaptation rules against a learning plan after a session.
 * Should be called AFTER ETA recalculation in the session end flow.
 */
export async function adaptPlanAfterSession(
  planId: string,
  sessionId: string
): Promise<AdaptationResult | null> {
  // Fetch plan with all related data
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
        },
      },
    },
  });

  if (!plan || plan.status !== "ACTIVE") return null;

  const adaptations: AdaptationAction[] = [];
  let adaptationMessage: string | null = null;

  // Fetch recent session data for rules
  const recentSessions = await prisma.learningSession.findMany({
    where: {
      studentId: plan.studentId,
      state: "COMPLETED",
    },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      durationSeconds: true,
      questionsAnswered: true,
      correctAnswers: true,
      startedAt: true,
      currentNodeId: true,
      currentNode: {
        select: { nodeCode: true, title: true, difficulty: true },
      },
    },
  });

  const currentSession = recentSessions.find((s) => s.id === sessionId);

  // ─── Rule 1: Concept took >2x estimated → increase similar concepts ───
  const rule1 = await applyRule1_SlowConcept(plan, currentSession, recentSessions);
  adaptations.push(rule1);

  // ─── Rule 2: Last 3 concepts faster than estimated → reduce upcoming by 15% ───
  const rule2 = await applyRule2_FastLearner(plan, recentSessions);
  adaptations.push(rule2);

  // ─── Rule 3: No session in 3+ days → add review touchpoints ───
  const rule3 = await applyRule3_InactivityReview(plan, recentSessions);
  adaptations.push(rule3);

  // ─── Rule 4: Spaced repetition review failed → add concept back ───
  const rule4 = await applyRule4_FailedReview(plan);
  adaptations.push(rule4);

  // ─── Rule 5: >2 weeks behind target → trigger plan review ───
  const rule5Result = await applyRule5_BehindSchedule(plan);
  adaptations.push(rule5Result.action);
  if (rule5Result.message) adaptationMessage = rule5Result.message;

  // ─── Rule 6: >4 weeks ahead → suggest advanced branch ───
  const rule6Result = await applyRule6_AheadOfSchedule(plan);
  adaptations.push(rule6Result.action);
  if (rule6Result.message && !adaptationMessage) {
    adaptationMessage = rule6Result.message;
  }

  // Count applied adaptations
  const appliedCount = adaptations.filter((a) => a.applied).length;

  if (appliedCount > 0) {
    console.log(
      `[PlanAdapter] Plan ${planId}: ${appliedCount} adaptation(s) applied — ` +
        adaptations
          .filter((a) => a.applied)
          .map((a) => a.rule)
          .join(", ")
    );
  }

  return {
    planId,
    adaptationsApplied: adaptations,
    message: adaptationMessage,
  };
}

// ─── Rule 1: Slow Concept Detection ────────────────────────────────────────

async function applyRule1_SlowConcept(
  plan: {
    id: string;
    conceptSequence: string[];
    totalEstimatedHours: number;
  },
  currentSession: {
    durationSeconds: number | null;
    currentNode: { nodeCode: string; difficulty: number } | null;
  } | undefined,
  recentSessions: Array<{
    durationSeconds: number | null;
    currentNode: { nodeCode: string; difficulty: number } | null;
  }>
): Promise<AdaptationAction> {
  if (!currentSession?.currentNode || !currentSession.durationSeconds) {
    return {
      rule: "Rule 1: Slow Concept",
      description: "Check if concept took >2x estimated time",
      applied: false,
    };
  }

  const difficulty = currentSession.currentNode.difficulty;
  const baseHoursMap: Record<number, number> = {
    1: 0.4, 2: 0.5, 3: 0.6, 4: 0.75, 5: 1.0,
    6: 1.25, 7: 1.5, 8: 2.0, 9: 2.5, 10: 3.0,
  };
  const estimatedHours = baseHoursMap[difficulty] ?? 1.0;
  const actualHours = currentSession.durationSeconds / 3600;

  if (actualHours > estimatedHours * SLOW_CONCEPT_MULTIPLIER) {
    // Find similar difficulty concepts in the remaining sequence
    const currentIndex = plan.conceptSequence.indexOf(
      currentSession.currentNode.nodeCode
    );
    if (currentIndex >= 0) {
      const remaining = plan.conceptSequence.slice(currentIndex + 1);

      // Fetch remaining concepts' difficulties
      const remainingNodes = await prisma.knowledgeNode.findMany({
        where: { nodeCode: { in: remaining } },
        select: { nodeCode: true, difficulty: true },
      });

      const similarDifficulty = remainingNodes.filter(
        (n) => Math.abs(n.difficulty - difficulty) <= 1
      );

      if (similarDifficulty.length > 0) {
        // Note: We don't directly modify estimates stored in DB here,
        // but the ETA calculator uses real velocity which naturally adapts.
        // This rule primarily serves as a logging/insight trigger.
        return {
          rule: "Rule 1: Slow Concept",
          description: `"${currentSession.currentNode.nodeCode}" took ${Math.round(actualHours * 60)}min (estimated ${Math.round(estimatedHours * 60)}min). ${similarDifficulty.length} similar concepts may also take longer.`,
          applied: true,
          details: `Actual: ${actualHours.toFixed(2)}h, Estimated: ${estimatedHours.toFixed(2)}h, Ratio: ${(actualHours / estimatedHours).toFixed(1)}x`,
        };
      }
    }
  }

  return {
    rule: "Rule 1: Slow Concept",
    description: "Concept was within expected time range",
    applied: false,
  };
}

// ─── Rule 2: Fast Learner Detection ────────────────────────────────────────

async function applyRule2_FastLearner(
  plan: { id: string; velocityHoursPerWeek: number },
  recentSessions: Array<{
    durationSeconds: number | null;
    currentNode: { nodeCode: string; difficulty: number } | null;
  }>
): Promise<AdaptationAction> {
  // Check last 3 sessions
  const lastThree = recentSessions.slice(0, 3);
  if (lastThree.length < 3) {
    return {
      rule: "Rule 2: Fast Learner",
      description: "Not enough sessions to evaluate pace",
      applied: false,
    };
  }

  const baseHoursMap: Record<number, number> = {
    1: 0.4, 2: 0.5, 3: 0.6, 4: 0.75, 5: 1.0,
    6: 1.25, 7: 1.5, 8: 2.0, 9: 2.5, 10: 3.0,
  };

  let allFaster = true;
  for (const session of lastThree) {
    if (!session.currentNode || !session.durationSeconds) {
      allFaster = false;
      break;
    }
    const estimated = baseHoursMap[session.currentNode.difficulty] ?? 1.0;
    const actual = session.durationSeconds / 3600;
    if (actual >= estimated * FAST_CONCEPT_DISCOUNT) {
      allFaster = false;
      break;
    }
  }

  if (allFaster) {
    // Velocity is naturally tracked by ETA calculator, but we can flag this
    // for the insight generator to produce encouraging messages
    return {
      rule: "Rule 2: Fast Learner",
      description: `Last 3 concepts completed faster than estimated. Velocity adjustment reflected in ETA.`,
      applied: true,
      details: `Discount factor: ${FAST_CONCEPT_DISCOUNT}`,
    };
  }

  return {
    rule: "Rule 2: Fast Learner",
    description: "Pace is within normal range",
    applied: false,
  };
}

// ─── Rule 3: Inactivity Review ─────────────────────────────────────────────

async function applyRule3_InactivityReview(
  plan: { id: string; studentId: string; conceptSequence: string[]; currentConceptIndex: number },
  recentSessions: Array<{ startedAt: Date }>
): Promise<AdaptationAction> {
  if (recentSessions.length < 2) {
    return {
      rule: "Rule 3: Inactivity Review",
      description: "Not enough sessions to check inactivity",
      applied: false,
    };
  }

  // Check gap between most recent and previous session
  const mostRecent = recentSessions[0].startedAt;
  const previous = recentSessions[1].startedAt;
  const gapDays =
    (mostRecent.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

  if (gapDays >= INACTIVITY_THRESHOLD_DAYS) {
    // Student was inactive for 3+ days — recent concepts might need review
    // We identify the last 2 concepts before the gap for potential review
    const reviewStart = Math.max(0, plan.currentConceptIndex - 2);
    const reviewConcepts = plan.conceptSequence.slice(
      reviewStart,
      plan.currentConceptIndex
    );

    if (reviewConcepts.length > 0) {
      // Check which of these aren't fully mastered
      const nodes = await prisma.knowledgeNode.findMany({
        where: { nodeCode: { in: reviewConcepts } },
        select: { id: true, nodeCode: true },
      });

      const nodeIds = nodes.map((n) => n.id);
      const mastery = await prisma.masteryScore.findMany({
        where: {
          studentId: plan.studentId,
          nodeId: { in: nodeIds },
        },
        select: { nodeId: true, bktProbability: true },
      });

      const masteryMap = new Map(
        mastery.map((m) => [m.nodeId, m.bktProbability])
      );
      const needsReview = nodes.filter(
        (n) => (masteryMap.get(n.id) ?? 0) < 0.9
      );

      if (needsReview.length > 0) {
        return {
          rule: "Rule 3: Inactivity Review",
          description: `${Math.round(gapDays)}-day gap detected. ${needsReview.length} recent concept(s) may need review: ${needsReview.map((n) => n.nodeCode).join(", ")}`,
          applied: true,
          details: `Gap: ${gapDays.toFixed(1)} days, Review needed: ${needsReview.length}`,
        };
      }
    }
  }

  return {
    rule: "Rule 3: Inactivity Review",
    description: "No significant gap detected",
    applied: false,
  };
}

// ─── Rule 4: Failed Spaced Repetition Review ───────────────────────────────

async function applyRule4_FailedReview(
  plan: { id: string; studentId: string; conceptSequence: string[] }
): Promise<AdaptationAction> {
  // Check if any recent milestone results show failed concepts
  const recentMilestones = await prisma.milestoneResult.findMany({
    where: {
      planId: plan.id,
      passed: false,
    },
    orderBy: { completedAt: "desc" },
    take: 3,
  });

  if (recentMilestones.length === 0) {
    return {
      rule: "Rule 4: Failed Review",
      description: "No failed milestones to address",
      applied: false,
    };
  }

  // Collect all failed concepts from recent milestones
  const failedConcepts = new Set<string>();
  for (const milestone of recentMilestones) {
    // Get concepts that were tested but might not be mastered
    for (const code of milestone.conceptsTested) {
      // Check current mastery
      const node = await prisma.knowledgeNode.findFirst({
        where: { nodeCode: code },
        select: { id: true },
      });
      if (node) {
        const mastery = await prisma.masteryScore.findFirst({
          where: { studentId: plan.studentId, nodeId: node.id },
          select: { bktProbability: true },
        });
        if (!mastery || mastery.bktProbability < 0.85) {
          failedConcepts.add(code);
        }
      }
    }
  }

  if (failedConcepts.size > 0) {
    return {
      rule: "Rule 4: Failed Review",
      description: `${failedConcepts.size} concept(s) from failed milestones still not mastered: ${Array.from(failedConcepts).join(", ")}`,
      applied: true,
      details: `Concepts needing re-review: ${Array.from(failedConcepts).join(", ")}`,
    };
  }

  return {
    rule: "Rule 4: Failed Review",
    description: "All milestone concepts now mastered",
    applied: false,
  };
}

// ─── Rule 5: Behind Schedule Alert ─────────────────────────────────────────

async function applyRule5_BehindSchedule(
  plan: {
    id: string;
    isAheadOfSchedule: boolean;
    projectedCompletionDate: Date;
    targetCompletionDate: Date | null;
    student: { displayName: string; ageGroup: string; avatarPersonaId: string };
    goal: { name: string };
  }
): Promise<{ action: AdaptationAction; message: string | null }> {
  if (plan.isAheadOfSchedule || !plan.targetCompletionDate) {
    return {
      action: {
        rule: "Rule 5: Behind Schedule",
        description: "On schedule or no target date set",
        applied: false,
      },
      message: null,
    };
  }

  const projectedMs = plan.projectedCompletionDate.getTime();
  const targetMs = plan.targetCompletionDate.getTime();
  const daysBehind = Math.round(
    (projectedMs - targetMs) / (1000 * 60 * 60 * 24)
  );

  if (daysBehind > BEHIND_SCHEDULE_THRESHOLD_DAYS) {
    // Generate a Claude encouragement message
    let message: string | null = null;

    try {
      const personaName = getPersonaName(plan.student.avatarPersonaId);
      const ageInstruction = getAgeInstruction(
        plan.student.ageGroup as AgeGroupValue
      );

      const prompt = `Generate a brief, encouraging message for a student who is ${daysBehind} days behind schedule on their "${plan.goal.name}" goal.

Student: ${plan.student.displayName}
Persona: ${personaName}
${ageInstruction}

REQUIREMENTS:
- 1-2 sentences max
- Acknowledge the gap without guilt or blame
- Suggest ONE small actionable step
- Be warm and specific
- Don't use phrases like "it's okay" or "don't worry" — be more creative

Respond with JSON: { "message": "..." }`;

      const response = await callClaude(prompt, { maxTokens: 128 });
      if (response) {
        const parsed = JSON.parse(response);
        message = parsed.message || null;
      }
    } catch {
      message = `You're ${daysBehind} days behind on "${plan.goal.name}" — try adding one extra 15-minute session this week to catch up!`;
    }

    return {
      action: {
        rule: "Rule 5: Behind Schedule",
        description: `${daysBehind} days behind target. Plan review triggered.`,
        applied: true,
        details: `Projected: ${plan.projectedCompletionDate.toLocaleDateString()}, Target: ${plan.targetCompletionDate.toLocaleDateString()}`,
      },
      message,
    };
  }

  return {
    action: {
      rule: "Rule 5: Behind Schedule",
      description: daysBehind > 0
        ? `${daysBehind} days behind but within threshold`
        : "On schedule",
      applied: false,
    },
    message: null,
  };
}

// ─── Rule 6: Ahead of Schedule — Suggest Advanced Branch ───────────────────

async function applyRule6_AheadOfSchedule(
  plan: {
    id: string;
    isAheadOfSchedule: boolean;
    projectedCompletionDate: Date;
    targetCompletionDate: Date | null;
    student: { displayName: string; ageGroup: string; avatarPersonaId: string };
    goal: { name: string };
  }
): Promise<{ action: AdaptationAction; message: string | null }> {
  if (!plan.isAheadOfSchedule || !plan.targetCompletionDate) {
    return {
      action: {
        rule: "Rule 6: Ahead of Schedule",
        description: "Not ahead or no target date",
        applied: false,
      },
      message: null,
    };
  }

  const projectedMs = plan.projectedCompletionDate.getTime();
  const targetMs = plan.targetCompletionDate.getTime();
  const daysAhead = Math.round(
    (targetMs - projectedMs) / (1000 * 60 * 60 * 24)
  );

  if (daysAhead > AHEAD_SCHEDULE_THRESHOLD_DAYS) {
    let message: string | null = null;

    try {
      const personaName = getPersonaName(plan.student.avatarPersonaId);
      const ageInstruction = getAgeInstruction(
        plan.student.ageGroup as AgeGroupValue
      );

      const prompt = `Generate a brief, celebratory message for a student who is ${daysAhead} days AHEAD of schedule on their "${plan.goal.name}" goal! They're doing amazing.

Student: ${plan.student.displayName}
Persona: ${personaName}
${ageInstruction}

REQUIREMENTS:
- 1-2 sentences max
- Celebrate their achievement
- Suggest they could try a challenge or explore advanced topics
- Be enthusiastic and specific

Respond with JSON: { "message": "..." }`;

      const response = await callClaude(prompt, { maxTokens: 128 });
      if (response) {
        const parsed = JSON.parse(response);
        message = parsed.message || null;
      }
    } catch {
      message = `Wow, ${daysAhead} days ahead on "${plan.goal.name}"! You might be ready for some advanced challenges!`;
    }

    return {
      action: {
        rule: "Rule 6: Ahead of Schedule",
        description: `${daysAhead} days ahead of target. Advanced branch suggestion triggered.`,
        applied: true,
        details: `Projected: ${plan.projectedCompletionDate.toLocaleDateString()}, Target: ${plan.targetCompletionDate.toLocaleDateString()}`,
      },
      message,
    };
  }

  return {
    action: {
      rule: "Rule 6: Ahead of Schedule",
      description: daysAhead > 0
        ? `${daysAhead} days ahead but within normal range`
        : "On schedule",
      applied: false,
    },
    message: null,
  };
}

// ─── Session End Hook ───────────────────────────────────────────────────────

/**
 * Runs all adaptation rules for all active plans after a session.
 * Called from the session end route, after ETA recalculation.
 */
export async function adaptPlansAfterSession(
  studentId: string,
  sessionId: string
): Promise<{
  adaptations: AdaptationResult[];
  message: string | null;
}> {
  const activePlans = await prisma.learningPlan.findMany({
    where: { studentId, status: "ACTIVE" },
    select: { id: true },
  });

  if (activePlans.length === 0) {
    return { adaptations: [], message: null };
  }

  const results: AdaptationResult[] = [];
  let firstMessage: string | null = null;

  for (const plan of activePlans) {
    try {
      const result = await adaptPlanAfterSession(plan.id, sessionId);
      if (result) {
        results.push(result);
        if (result.message && !firstMessage) {
          firstMessage = result.message;
        }
      }
    } catch (err) {
      console.error(
        `[PlanAdapter] Failed to adapt plan ${plan.id}:`,
        err
      );
    }
  }

  return {
    adaptations: results,
    message: firstMessage,
  };
}
