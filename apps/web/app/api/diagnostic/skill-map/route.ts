/**
 * GET /api/diagnostic/skill-map?sessionId=xxx
 *
 * Returns a visual skill map for a completed goal-aware diagnostic session.
 * Shows every concept in the goal with mastery status, estimated hours,
 * and a Claude-generated narrative.
 *
 * This endpoint can be called after a goal-aware diagnostic completes.
 * The data is also returned inline from /api/diagnostic/answer when
 * the diagnostic finishes, but this endpoint allows re-fetching it
 * or generating it from stored session results.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { buildGoalNodeList } from "@/lib/diagnostic/diagnostic-engine";
import { callClaude } from "@/lib/session/claude-client";
import type { SkillMapEntry, SkillMapResult } from "@/lib/diagnostic/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const goalId = searchParams.get("goalId");
    const studentId = searchParams.get("studentId");

    if (!sessionId && !goalId) {
      return NextResponse.json(
        { error: "Either sessionId or goalId+studentId is required" },
        { status: 400 }
      );
    }

    // Mode 1: Reconstruct skill map from a completed session
    if (sessionId) {
      return await buildSkillMapFromSession(sessionId);
    }

    // Mode 2: Generate skill map from current mastery data (no session needed)
    if (goalId && studentId) {
      return await buildSkillMapFromMastery(goalId, studentId);
    }

    return NextResponse.json(
      { error: "studentId is required when using goalId" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[diagnostic/skill-map] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate skill map",
      },
      { status: 500 }
    );
  }
}

/**
 * Build a skill map from a completed diagnostic session's stored results.
 * Uses the session's mastery scores and goal data.
 */
async function buildSkillMapFromSession(sessionId: string) {
  // Get the session
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { student: true },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  if (session.state !== "COMPLETED") {
    return NextResponse.json(
      { error: "Diagnostic session is not yet complete" },
      { status: 400 }
    );
  }

  // Find the most recent active learning plan for this student to get goalId
  const activePlan = await prisma.learningPlan.findFirst({
    where: {
      studentId: session.studentId,
      status: "ACTIVE",
    },
    include: { goal: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlan?.goal) {
    return NextResponse.json(
      {
        error:
          "No active learning plan with goal found. Use goalId+studentId params instead.",
      },
      { status: 400 }
    );
  }

  return await buildSkillMapFromMastery(
    activePlan.goalId,
    session.studentId
  );
}

/**
 * Build a skill map from current mastery data for a goal.
 * No session needed — uses the student's existing mastery scores.
 */
async function buildSkillMapFromMastery(goalId: string, studentId: string) {
  // Validate student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Student not found" },
      { status: 404 }
    );
  }

  // Build ordered node list for the goal
  const { orderedNodes, goalName } = await buildGoalNodeList(goalId);

  // Fetch student's mastery scores for all nodes
  const allMasteries = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { node: { select: { nodeCode: true } } },
  });
  const masteryMap = new Map(
    allMasteries.map((m) => [m.node.nodeCode, m])
  );

  // Build skill map entries
  const entries: SkillMapEntry[] = orderedNodes.map((node) => {
    const mastery = masteryMap.get(node.nodeCode);
    const bktProbability = mastery?.bktProbability ?? 0;

    let status: SkillMapEntry["status"];
    if (bktProbability >= 0.85) {
      status = "mastered";
    } else if (mastery && bktProbability < 0.4) {
      status = "gap";
    } else if (mastery) {
      status = "in_progress";
    } else {
      status = "untested";
    }

    const estimatedHoursToLearn =
      status === "mastered" ? 0 : estimateHoursForDifficulty(node.difficulty);

    return {
      nodeCode: node.nodeCode,
      title: node.title ?? node.nodeCode,
      domain: node.domain ?? "Math",
      gradeLevel: node.grade < 1 ? "K" : `G${Math.floor(node.grade)}`,
      difficulty: node.difficulty,
      status,
      bktProbability,
      estimatedHoursToLearn,
      wasTested: !!mastery,
      wasCorrect: mastery
        ? mastery.correctCount > 0 && mastery.correctCount >= mastery.practiceCount * 0.5
        : undefined,
    };
  });

  // Calculate summary stats
  const totalConcepts = entries.length;
  const masteredCount = entries.filter((e) => e.status === "mastered").length;
  const gapCount = entries.filter((e) => e.status === "gap").length;
  const untestedCount = entries.filter(
    (e) => e.status === "untested" || e.status === "in_progress"
  ).length;
  const totalEstimatedHours = entries.reduce(
    (sum, e) => sum + estimateHoursForDifficulty(e.difficulty),
    0
  );
  const remainingEstimatedHours = entries.reduce(
    (sum, e) => sum + e.estimatedHoursToLearn,
    0
  );
  const completionPercentage =
    totalConcepts > 0
      ? Math.round((masteredCount / totalConcepts) * 100)
      : 0;

  // Generate Claude narrative
  let narrative = "";
  try {
    const prompt = `You are Cosmo, a friendly bear guide for a child's learning platform.

Student skill map for goal "${goalName}":
- Total concepts: ${totalConcepts}
- Already mastered: ${masteredCount} (${completionPercentage}%)
- Knowledge gaps: ${gapCount}
- Untested/in-progress: ${untestedCount}
- Estimated remaining hours: ${remainingEstimatedHours.toFixed(1)}
- Top mastered: ${entries
      .filter((e) => e.status === "mastered")
      .map((e) => e.title)
      .slice(0, 5)
      .join(", ") || "none yet"}
- Key gaps: ${entries
      .filter((e) => e.status === "gap")
      .map((e) => e.title)
      .slice(0, 5)
      .join(", ") || "none found"}

Respond with ONLY a JSON object: {"narrative": "<2-3 sentence encouraging narrative about the student's current knowledge>"}`;

    const claudeResult = await callClaude(prompt, { maxTokens: 200 });
    if (claudeResult) {
      try {
        const parsed = JSON.parse(claudeResult) as { narrative?: string };
        narrative = parsed.narrative ?? "";
      } catch {
        narrative = claudeResult.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fallback narrative
    if (masteredCount === 0) {
      narrative = `Ready to start your "${goalName}" adventure! Cosmo will guide you through ${totalConcepts} concepts at your own pace.`;
    } else if (gapCount > 0) {
      narrative = `You already know ${masteredCount} of ${totalConcepts} concepts for "${goalName}". We found ${gapCount} area${gapCount > 1 ? "s" : ""} to strengthen. Cosmo has the perfect plan!`;
    } else {
      narrative = `Amazing! You've mastered ${completionPercentage}% of "${goalName}"! Just ${totalConcepts - masteredCount} more concepts to go!`;
    }
  }

  const skillMapResult: SkillMapResult = {
    goalId,
    goalName,
    sessionId: "",
    studentId,
    entries,
    totalConcepts,
    masteredCount,
    gapCount,
    untestedCount,
    totalEstimatedHours,
    remainingEstimatedHours,
    narrative,
    completionPercentage,
  };

  return NextResponse.json(skillMapResult);
}

/** Estimate hours to learn a concept based on difficulty */
function estimateHoursForDifficulty(difficulty: number): number {
  if (difficulty <= 2) return 0.5;
  if (difficulty <= 4) return 1.0;
  if (difficulty <= 6) return 1.5;
  if (difficulty <= 8) return 2.0;
  return 2.5;
}
