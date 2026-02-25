/**
 * Fluency Drill Mode Engine
 *
 * Speed-focused practice for students who have accuracy+retention but need
 * to build automaticity (fluency).
 *
 * True fluency = benchmark speed + 90% accuracy for 10 consecutive problems.
 *
 * FLATLINE DETECTION: Rolling avg <15% variance for 20+ problems → auto-advance.
 * (Student has plateaued — their speed is consistent, skill is fluent.)
 */

import { prisma } from "@aauti/db";

// ─── Thresholds ───

const CONSECUTIVE_REQUIRED = 10; // 10 in a row at benchmark speed
const FLUENCY_ACCURACY = 0.9; // 90% accuracy required
const FLATLINE_WINDOW = 20; // last 20 responses
const FLATLINE_MAX_VARIANCE = 0.15; // <15% coefficient of variation

// ─── Types ───

export interface FluencyResult {
  isCorrect: boolean;
  consecutiveCorrect: number;
  personalBestMs: number | null;
  newPersonalBest: boolean;
  speedTrend: number[]; // last 10 response times
  benchmarkMs: number | null;
  atBenchmark: boolean; // was this response at or below benchmark?
  completed: boolean; // true = fluency mastery achieved
  flatlineDetected: boolean;
  flatlineVariance: number | null;
  recentAccuracy: number;
}

// ─── Core Functions ───

/**
 * Start fluency drill mode for a student+node.
 */
export async function startFluencyDrill(
  sessionId: string,
  studentId: string,
  nodeId: string
): Promise<void> {
  await prisma.learningSession.update({
    where: { id: sessionId },
    data: { mode: "fluency" },
  });

  await prisma.masteryScore.update({
    where: { studentId_nodeId: { studentId, nodeId } },
    data: { fluencyDrillMode: true, consecutiveCorrect: 0 },
  });
}

/**
 * Evaluate a fluency drill answer.
 * Tracks consecutive correct at benchmark speed.
 */
export async function evaluateFluencyAnswer(
  studentId: string,
  nodeId: string,
  responseTimeMs: number,
  isCorrect: boolean,
  gradeLevel: string,
  domain: string
): Promise<FluencyResult> {
  // Get benchmark
  const benchmark = await prisma.fluencyBenchmark.findUnique({
    where: { domain_gradeLevel: { domain, gradeLevel } },
  });
  const benchmarkMs = benchmark?.targetTimeMs ?? null;

  // Get current mastery data
  const mastery = await prisma.masteryScore.findUnique({
    where: { studentId_nodeId: { studentId, nodeId } },
  });

  const currentConsecutive = mastery?.consecutiveCorrect ?? 0;
  const currentBest = mastery?.personalBestMs ?? null;

  // Check if at benchmark speed
  const atBenchmark = benchmarkMs ? responseTimeMs <= benchmarkMs : true;

  // Update consecutive correct (reset on wrong or too slow)
  let newConsecutive: number;
  if (isCorrect && atBenchmark) {
    newConsecutive = currentConsecutive + 1;
  } else {
    newConsecutive = 0;
  }

  // Check personal best
  let newPersonalBest = false;
  let personalBestMs = currentBest;
  if (isCorrect && (!currentBest || responseTimeMs < currentBest)) {
    newPersonalBest = true;
    personalBestMs = responseTimeMs;
  }

  // Get speed trend (last 10 response times)
  const recentResponses = await prisma.questionResponse.findMany({
    where: { studentId, nodeId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { responseTimeMs: true, isCorrect: true },
  });
  const speedTrend = recentResponses
    .map((r) => r.responseTimeMs)
    .reverse(); // chronological

  // Calculate recent accuracy
  const recentCorrect = recentResponses.filter((r) => r.isCorrect).length;
  const recentAccuracy =
    recentResponses.length > 0 ? recentCorrect / recentResponses.length : 0;

  // Check flatline detection
  const { isFlatline, variance } = await detectFlatline(studentId, nodeId);

  // Check if fluency mastery achieved
  const completed =
    (newConsecutive >= CONSECUTIVE_REQUIRED && recentAccuracy >= FLUENCY_ACCURACY) ||
    isFlatline;

  // Update mastery record
  const updateData: Record<string, unknown> = {
    consecutiveCorrect: newConsecutive,
    speedTrendMs: recentResponses.length > 0
      ? recentResponses.reduce((sum, r) => sum + r.responseTimeMs, 0) /
        recentResponses.length
      : null,
  };

  if (newPersonalBest && personalBestMs !== null) {
    updateData.personalBestMs = Math.round(personalBestMs);
  }

  if (completed) {
    updateData.fluencyDrillMode = false;
    updateData.trulyMastered = true;
  }

  await prisma.masteryScore.update({
    where: { studentId_nodeId: { studentId, nodeId } },
    data: updateData,
  });

  return {
    isCorrect,
    consecutiveCorrect: newConsecutive,
    personalBestMs: personalBestMs ? Math.round(personalBestMs) : null,
    newPersonalBest,
    speedTrend,
    benchmarkMs,
    atBenchmark,
    completed,
    flatlineDetected: isFlatline,
    flatlineVariance: variance,
    recentAccuracy,
  };
}

/**
 * Detect speed flatline — student's response times have plateaued.
 * Rolling avg of last 20 response times with <15% coefficient of variation.
 */
export async function detectFlatline(
  studentId: string,
  nodeId: string
): Promise<{ isFlatline: boolean; variance: number | null }> {
  const responses = await prisma.questionResponse.findMany({
    where: { studentId, nodeId },
    orderBy: { createdAt: "desc" },
    take: FLATLINE_WINDOW,
    select: { responseTimeMs: true },
  });

  if (responses.length < FLATLINE_WINDOW) {
    return { isFlatline: false, variance: null };
  }

  const times = responses.map((r) => r.responseTimeMs);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(
    times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length
  );
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

  return {
    isFlatline: coefficientOfVariation < FLATLINE_MAX_VARIANCE,
    variance: Math.round(coefficientOfVariation * 100) / 100,
  };
}
