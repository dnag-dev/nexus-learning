/**
 * POST /api/session/fluency-zone
 *
 * Phase 13: Fluency Zone — Student-initiated speed practice.
 * Separate from auto-triggered fluency drill (Phase 12).
 *
 * Actions:
 *   start:  { studentId, nodeId, timeLimitSeconds }
 *   submit: { sessionId, answers: [...] }
 *   topics: { studentId, subject } → returns available topics for speed practice
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { logActivity } from "@/lib/activity-log";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "topics":
        return handleTopics(body);
      case "start":
        return handleStart(body);
      case "submit":
        return handleSubmit(body);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Fluency zone error:", error);
    return NextResponse.json(
      { error: "Fluency zone error" },
      { status: 500 }
    );
  }
}

/**
 * Get available topics for Fluency Zone.
 * Only shows mastered topics (BKT >= 0.85) — speed practice on concepts
 * the student has already demonstrated proficiency in.
 */
async function handleTopics(body: { studentId: string; subject?: string }) {
  const { studentId, subject } = body;

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const where: any = { studentId, bktProbability: { gte: 0.85 } };

  // Get mastery scores to find practiced topics
  const masteryScores = await prisma.masteryScore.findMany({
    where,
    include: {
      node: { select: { id: true, nodeCode: true, title: true, subject: true, gradeLevel: true, domain: true } },
    },
    orderBy: { bktProbability: "desc" },
  });

  // Filter by subject if specified
  const filtered = subject
    ? masteryScores.filter((ms) => ms.node.subject === subject)
    : masteryScores;

  // Get personal bests from previous fluency zone sessions
  const personalBests = await prisma.fluencyZoneSession.groupBy({
    by: ["nodeId"],
    where: { studentId },
    _max: { questionsPerMin: true },
  });

  const pbMap = new Map(personalBests.map((pb) => [pb.nodeId, pb._max.questionsPerMin]));

  const topics = filtered.map((ms) => ({
    nodeId: ms.node.id,
    nodeCode: ms.node.nodeCode,
    title: ms.node.title,
    subject: ms.node.subject,
    gradeLevel: ms.node.gradeLevel,
    domain: ms.node.domain,
    bktProbability: ms.bktProbability,
    personalBestQPM: pbMap.get(ms.node.id) ?? null,
  }));

  return NextResponse.json({ topics });
}

/**
 * Start a Fluency Zone session.
 */
async function handleStart(body: {
  studentId: string;
  nodeId: string;
  timeLimitSeconds: number;
}) {
  const { studentId, nodeId, timeLimitSeconds = 120 } = body;

  if (!studentId || !nodeId) {
    return NextResponse.json(
      { error: "studentId and nodeId required" },
      { status: 400 }
    );
  }

  const node = await prisma.knowledgeNode.findUnique({
    where: { id: nodeId },
    select: { id: true, title: true, subject: true, domain: true },
  });

  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  // Get personal best for this topic
  const previousBest = await prisma.fluencyZoneSession.findFirst({
    where: { studentId, nodeId },
    orderBy: { questionsPerMin: "desc" },
    select: { questionsPerMin: true, correctCount: true },
  });

  const session = await prisma.fluencyZoneSession.create({
    data: {
      studentId,
      nodeId,
      nodeName: node.title,
      subject: node.subject,
      timeLimitSeconds,
    },
  });

  return NextResponse.json({
    sessionId: session.id,
    nodeId: node.id,
    nodeName: node.title,
    subject: node.subject,
    timeLimitSeconds,
    personalBest: previousBest
      ? {
          questionsPerMin: previousBest.questionsPerMin,
          correctCount: previousBest.correctCount,
        }
      : null,
  });
}

/**
 * Submit Fluency Zone results.
 */
async function handleSubmit(body: {
  sessionId: string;
  studentId: string;
  answers: Array<{
    questionText: string;
    answer: string;
    correct: boolean;
    timeMs: number;
  }>;
  elapsedSeconds: number;
}) {
  const { sessionId, studentId, answers, elapsedSeconds } = body;

  if (!sessionId || !answers || !studentId) {
    return NextResponse.json(
      { error: "sessionId, studentId, and answers required" },
      { status: 400 }
    );
  }

  const session = await prisma.fluencyZoneSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
  const elapsedMin = Math.max(elapsedSeconds / 60, 0.1); // avoid divide by zero
  const questionsPerMin = totalQuestions / elapsedMin;
  const averageTimeMs =
    totalQuestions > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.timeMs, 0) / totalQuestions)
      : 0;

  // Check if this is a new personal best
  const previousBest = await prisma.fluencyZoneSession.findFirst({
    where: { studentId, nodeId: session.nodeId, id: { not: sessionId } },
    orderBy: { correctCount: "desc" },
    select: { correctCount: true },
  });

  const isPersonalBest = !previousBest || correctCount > previousBest.correctCount;

  // Update session record
  await prisma.fluencyZoneSession.update({
    where: { id: sessionId },
    data: {
      totalQuestions,
      correctCount,
      accuracy,
      questionsPerMin,
      averageTimeMs,
      personalBest: isPersonalBest,
      answers: answers as unknown as Prisma.InputJsonValue,
    },
  });

  // Log activity
  logActivity(
    studentId,
    "FLUENCY_ZONE_COMPLETED",
    `Fluency Zone: ${session.nodeName}`,
    {
      detail: `Score: ${correctCount} correct, ${Math.round(accuracy * 100)}% accuracy, ${questionsPerMin.toFixed(1)} Q/min${isPersonalBest ? " 🏆 NEW PB!" : ""}`,
      metadata: {
        sessionId,
        nodeId: session.nodeId,
        correctCount,
        accuracy,
        questionsPerMin,
        isPersonalBest,
        timeLimitSeconds: session.timeLimitSeconds,
      },
    }
  );

  return NextResponse.json({
    correctCount,
    totalQuestions,
    accuracy: Math.round(accuracy * 100),
    questionsPerMin: Math.round(questionsPerMin * 10) / 10,
    averageTimeMs,
    isPersonalBest,
    previousBest: previousBest?.correctCount ?? null,
    nodeName: session.nodeName,
    timeLimitSeconds: session.timeLimitSeconds,
  });
}
