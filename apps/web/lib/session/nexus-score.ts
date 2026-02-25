/**
 * Nexus Score Calculator
 *
 * Single number per concept (0-100) combining:
 *   - Accuracy (40% weight): last 10 questions correct percentage
 *   - Speed (30% weight): response time relative to grade-level benchmark
 *   - Retention (30% weight): retention over time from spaced repetition
 *
 * 100 = truly mastered. Show prominently, let student see it move.
 */

import { prisma } from "@aauti/db";

// ─── Weights ───

const ACCURACY_WEIGHT = 0.4;
const SPEED_WEIGHT = 0.3;
const RETENTION_WEIGHT = 0.3;
const RESPONSES_FOR_SCORE = 10;

// ─── Types ───

export interface NexusScoreBreakdown {
  nexusScore: number;
  accuracy: number; // 0-100 contribution
  speed: number; // 0-100 contribution
  retention: number; // 0-100 contribution
  rawAccuracy: number; // 0-1
  rawSpeed: number; // ratio
  rawRetention: number; // 0-1
  benchmarkMs: number | null;
  avgResponseMs: number | null;
  personalBestMs: number | null;
}

// ─── Core Calculator ───

export async function calculateNexusScore(
  studentId: string,
  nodeId: string,
  gradeLevel: string,
  domain: string
): Promise<NexusScoreBreakdown> {
  // Fetch last N responses
  const responses = await prisma.questionResponse.findMany({
    where: { studentId, nodeId },
    orderBy: { createdAt: "desc" },
    take: RESPONSES_FOR_SCORE,
  });

  // Fetch mastery record for retention score
  const mastery = await prisma.masteryScore.findUnique({
    where: { studentId_nodeId: { studentId, nodeId } },
    select: { retentionScore: true, personalBestMs: true },
  });

  // Fetch benchmark for this domain+grade
  const benchmark = await prisma.fluencyBenchmark.findUnique({
    where: { domain_gradeLevel: { domain, gradeLevel } },
  });

  // ─── Accuracy Component (40%) ───
  let rawAccuracy = 0;
  if (responses.length > 0) {
    const correct = responses.filter((r) => r.isCorrect).length;
    rawAccuracy = correct / responses.length;
  }
  const accuracyComponent = rawAccuracy * ACCURACY_WEIGHT * 100;

  // ─── Speed Component (30%) ───
  let rawSpeed = 0;
  let avgResponseMs: number | null = null;
  const benchmarkMs = benchmark?.targetTimeMs ?? null;

  if (responses.length > 0 && benchmarkMs) {
    const correctResponses = responses.filter((r) => r.isCorrect);
    if (correctResponses.length > 0) {
      avgResponseMs =
        correctResponses.reduce((sum, r) => sum + r.responseTimeMs, 0) /
        correctResponses.length;
      // Ratio: benchmark / actual. >1 means faster than benchmark.
      rawSpeed = Math.min(benchmarkMs / avgResponseMs, 1.5); // cap at 1.5x
      rawSpeed = Math.max(rawSpeed, 0); // floor at 0
    }
  } else if (responses.length > 0) {
    // No benchmark — give partial credit based on having responses
    rawSpeed = 0.5;
    const correctResponses = responses.filter((r) => r.isCorrect);
    if (correctResponses.length > 0) {
      avgResponseMs =
        correctResponses.reduce((sum, r) => sum + r.responseTimeMs, 0) /
        correctResponses.length;
    }
  }
  const speedComponent = Math.min(rawSpeed, 1) * SPEED_WEIGHT * 100;

  // ─── Retention Component (30%) ───
  const rawRetention = mastery?.retentionScore ?? 0;
  const retentionComponent = rawRetention * RETENTION_WEIGHT * 100;

  // ─── Final Score ───
  const nexusScore = Math.round(
    Math.min(accuracyComponent + speedComponent + retentionComponent, 100)
  );

  return {
    nexusScore,
    accuracy: Math.round(accuracyComponent),
    speed: Math.round(speedComponent),
    retention: Math.round(retentionComponent),
    rawAccuracy,
    rawSpeed,
    rawRetention,
    benchmarkMs,
    avgResponseMs: avgResponseMs ? Math.round(avgResponseMs) : null,
    personalBestMs: mastery?.personalBestMs ?? null,
  };
}

/**
 * Update the Nexus Score on the MasteryScore record.
 * Call this after every answer submission.
 */
export async function updateNexusScore(
  studentId: string,
  nodeId: string,
  gradeLevel: string,
  domain: string
): Promise<NexusScoreBreakdown> {
  const breakdown = await calculateNexusScore(
    studentId,
    nodeId,
    gradeLevel,
    domain
  );

  try {
    await prisma.masteryScore.update({
      where: { studentId_nodeId: { studentId, nodeId } },
      data: { nexusScore: breakdown.nexusScore },
    });
  } catch {
    // Non-critical — score still returned
  }

  return breakdown;
}

/**
 * Get Nexus Scores for all of a student's mastered/in-progress nodes.
 */
export async function getAllNexusScores(
  studentId: string
): Promise<
  Array<{
    nodeId: string;
    nodeCode: string;
    nodeTitle: string;
    nexusScore: number;
    trulyMastered: boolean;
  }>
> {
  const scores = await prisma.masteryScore.findMany({
    where: { studentId, practiceCount: { gt: 0 } },
    include: { node: { select: { nodeCode: true, title: true } } },
    orderBy: { nexusScore: "desc" },
  });

  return scores.map((s) => ({
    nodeId: s.nodeId,
    nodeCode: s.node.nodeCode,
    nodeTitle: s.node.title,
    nexusScore: s.nexusScore,
    trulyMastered: s.trulyMastered,
  }));
}
