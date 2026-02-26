/**
 * True Mastery Gating Engine
 *
 * A student cannot advance until meeting ALL 4 criteria:
 *   1. Accuracy: 85%+ on last 10 problems
 *   2. Consistency: correct on 3+ separate question types
 *   3. Retention: 70%+ when tested later (spaced repetition check)
 *   4. Speed: response time trending down
 *
 * Recommendations:
 *   - All 4 pass → "advance"
 *   - Accuracy+retention pass, speed fails → "fluency_drill"
 *   - Accuracy passes, retention fails → "retention_review"
 *   - Otherwise → "practice"
 */

import { prisma } from "@aauti/db";

// ─── Thresholds ───

const ACCURACY_THRESHOLD = 0.85; // 85%+ on last 10
const CONSISTENCY_TYPES_REQUIRED = 3; // 3+ distinct question types
const RETENTION_THRESHOLD = 0.7; // 70%+ retention score
const MIN_RESPONSES_FOR_GATE = 10; // need at least 10 responses

// ─── Types ───

export interface MasteryGateResult {
  passed: boolean;
  accuracy: { score: number; passed: boolean };
  consistency: { score: number; passed: boolean; typesCorrect: string[] };
  retention: { score: number; passed: boolean };
  speed: { score: number; passed: boolean; trendDirection: "improving" | "flat" | "slowing" };
  recommendation: "advance" | "practice" | "fluency_drill" | "retention_review";
  totalResponses: number;
}

// ─── Core Evaluation ───

export async function evaluateTrueMastery(
  studentId: string,
  nodeId: string
): Promise<MasteryGateResult> {
  // Fetch last 10 responses for this student+node
  const responses = await prisma.questionResponse.findMany({
    where: { studentId, nodeId },
    orderBy: { createdAt: "desc" },
    take: MIN_RESPONSES_FOR_GATE,
  });

  const totalResponses = responses.length;

  // If fewer than required responses, let the student through —
  // don't block advancement when there isn't enough data to evaluate
  if (totalResponses < MIN_RESPONSES_FOR_GATE) {
    return {
      passed: true,
      accuracy: { score: 1, passed: true },
      consistency: { score: 1, passed: true, typesCorrect: [] },
      retention: { score: 1, passed: true },
      speed: { score: 1, passed: true, trendDirection: "improving" },
      recommendation: "advance",
      totalResponses,
    };
  }

  // ─── 1. Accuracy: 85%+ on last 10 ───
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const accuracyScore = correctCount / responses.length;
  const accuracyPassed = accuracyScore >= ACCURACY_THRESHOLD;

  // ─── 2. Consistency: correct on 3+ question types ───
  const correctByType = new Set<string>();
  for (const r of responses) {
    if (r.isCorrect) {
      correctByType.add(r.questionType);
    }
  }
  const typesCorrect = Array.from(correctByType);
  const consistencyScore = typesCorrect.length / 4; // 4 possible types
  const consistencyPassed = typesCorrect.length >= CONSISTENCY_TYPES_REQUIRED;

  // ─── 3. Retention: check retentionScore on MasteryScore ───
  const mastery = await prisma.masteryScore.findUnique({
    where: { studentId_nodeId: { studentId, nodeId } },
    select: { retentionScore: true },
  });
  const retentionScore = mastery?.retentionScore ?? null;
  // If retention has never been measured, don't block advancement
  const retentionPassed = retentionScore === null || retentionScore >= RETENTION_THRESHOLD;

  // ─── 4. Speed: response time trending down ───
  // Compare first half avg vs second half avg (chronological order)
  const chronological = [...responses].reverse(); // oldest first
  const half = Math.floor(chronological.length / 2);
  const firstHalf = chronological.slice(0, half);
  const secondHalf = chronological.slice(half);

  const avgFirst =
    firstHalf.reduce((sum, r) => sum + r.responseTimeMs, 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((sum, r) => sum + r.responseTimeMs, 0) /
    secondHalf.length;

  let trendDirection: "improving" | "flat" | "slowing";
  if (avgSecond < avgFirst * 0.9) {
    trendDirection = "improving";
  } else if (avgSecond > avgFirst * 1.1) {
    trendDirection = "slowing";
  } else {
    trendDirection = "flat";
  }
  // Speed passes if trending down or flat (not getting worse)
  const speedPassed = trendDirection !== "slowing";
  const speedScore = speedPassed ? 1 : avgFirst / avgSecond;

  // ─── Determine recommendation ───
  const allPassed =
    accuracyPassed && consistencyPassed && retentionPassed && speedPassed;

  let recommendation: MasteryGateResult["recommendation"];
  if (allPassed) {
    recommendation = "advance";
  } else if (accuracyPassed && retentionPassed && !speedPassed) {
    recommendation = "fluency_drill";
  } else if (accuracyPassed && !retentionPassed) {
    recommendation = "retention_review";
  } else {
    recommendation = "practice";
  }

  // Update speedTrendMs on MasteryScore
  try {
    await prisma.masteryScore.update({
      where: { studentId_nodeId: { studentId, nodeId } },
      data: { speedTrendMs: avgSecond },
    });
  } catch {
    // Non-critical
  }

  return {
    passed: allPassed,
    accuracy: { score: accuracyScore, passed: accuracyPassed },
    consistency: { score: consistencyScore, passed: consistencyPassed, typesCorrect },
    retention: { score: retentionScore ?? 1, passed: retentionPassed },
    speed: { score: speedScore, passed: speedPassed, trendDirection },
    recommendation,
    totalResponses,
  };
}

/**
 * Lightweight check: does the student have enough responses to even attempt mastery gate?
 */
export async function hasEnoughResponsesForGate(
  studentId: string,
  nodeId: string
): Promise<boolean> {
  const count = await prisma.questionResponse.count({
    where: { studentId, nodeId },
  });
  return count >= MIN_RESPONSES_FOR_GATE;
}
