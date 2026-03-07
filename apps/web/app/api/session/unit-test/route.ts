/**
 * POST /api/session/unit-test
 *
 * Phase 13: Unit Test — covers all topics in a unit (2-3 questions per cluster).
 * Pass 80%+ overall → entire unit marked complete.
 * Individual topic BKT scores update based on performance.
 *
 * Also handles Course Challenge (testType: "course_challenge").
 *
 * Body: { studentId, unitId?, gradeLevel?, subject?, testType }
 * testType: "unit_test" | "course_challenge"
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { logActivity } from "@/lib/activity-log";
import type { Prisma } from "@prisma/client";

const PASS_THRESHOLD = 0.80;
const QUESTIONS_PER_CLUSTER = 2; // 2-3 questions per cluster

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, action, testId, answers } = body;

    // ─── Submit answers ───
    if (action === "submit" && testId && answers) {
      return handleSubmit(testId, studentId, answers);
    }

    // ─── Start unit test or course challenge ───
    const { unitId, gradeLevel, subject, testType = "unit_test" } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    let targetNodes: Array<{ id: string; nodeCode: string; title: string }> = [];
    let targetId: string;
    let targetName: string;
    let resolvedGrade: string;
    let resolvedSubject: string;

    if (testType === "course_challenge") {
      // Course Challenge: all nodes for a grade + subject
      if (!gradeLevel || !subject) {
        return NextResponse.json(
          { error: "gradeLevel and subject required for course challenge" },
          { status: 400 }
        );
      }
      targetNodes = await prisma.knowledgeNode.findMany({
        where: {
          gradeLevel: gradeLevel as any,
          subject: subject as any,
        },
        select: { id: true, nodeCode: true, title: true },
      });
      targetId = `${gradeLevel}_${subject}`;
      targetName = `${gradeLevel} ${subject} Course Challenge`;
      resolvedGrade = gradeLevel;
      resolvedSubject = subject;
    } else {
      // Unit Test: all nodes in a specific unit
      if (!unitId) {
        return NextResponse.json({ error: "unitId required" }, { status: 400 });
      }
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        include: { nodes: { select: { id: true, nodeCode: true, title: true } } },
      });
      if (!unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
      }
      targetNodes = unit.nodes;
      targetId = unitId;
      targetName = unit.name;
      resolvedGrade = unit.gradeLevel;
      resolvedSubject = unit.subject;
    }

    if (targetNodes.length === 0) {
      return NextResponse.json(
        { error: "No topics found for this test" },
        { status: 404 }
      );
    }

    // Calculate total questions: ~2 per topic, capped at 30
    const totalQuestions = Math.min(targetNodes.length * QUESTIONS_PER_CLUSTER, 30);

    // Create test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        studentId,
        testType,
        targetId,
        targetName,
        subject: resolvedSubject as any,
        gradeLevel: resolvedGrade as any,
        totalQuestions,
        correctCount: 0,
        accuracy: 0,
        passed: false,
      },
    });

    return NextResponse.json({
      testId: attempt.id,
      testType,
      targetName,
      subject: resolvedSubject,
      gradeLevel: resolvedGrade,
      questionCount: totalQuestions,
      topics: targetNodes.map((n) => ({ nodeId: n.id, nodeCode: n.nodeCode, title: n.title })),
      passThreshold: PASS_THRESHOLD,
      timeLimitMinutes: testType === "course_challenge" ? 20 : 10,
    });
  } catch (error) {
    console.error("Unit test error:", error);
    return NextResponse.json(
      { error: "Failed to start unit test" },
      { status: 500 }
    );
  }
}

async function handleSubmit(
  testId: string,
  studentId: string,
  answers: Array<{
    nodeId: string;
    isCorrect: boolean;
    timeMs: number;
  }>
) {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: testId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = answers.length > 0 ? correctCount / answers.length : 0;
    const passed = accuracy >= PASS_THRESHOLD;
    const totalTimeMs = answers.reduce((sum, a) => sum + a.timeMs, 0);

    // Group answers by nodeId to compute per-node scores
    const nodeAnswers = new Map<string, { correct: number; total: number }>();
    for (const a of answers) {
      const current = nodeAnswers.get(a.nodeId) || { correct: 0, total: 0 };
      if (a.isCorrect) current.correct++;
      current.total++;
      nodeAnswers.set(a.nodeId, current);
    }

    // Update individual node mastery scores based on test performance
    const nodeScores: Record<string, { before: number; after: number }> = {};

    for (const [nodeId, stats] of nodeAnswers) {
      const existing = await prisma.masteryScore.findUnique({
        where: { studentId_nodeId: { studentId, nodeId } },
      });

      const beforeBkt = existing?.bktProbability ?? 0;
      const nodeAccuracy = stats.correct / stats.total;
      // Scale test performance to BKT: if passed test, give credit proportional to accuracy
      const earnedBkt = passed
        ? Math.max(beforeBkt, nodeAccuracy * 0.90) // Pass = generous BKT
        : Math.max(beforeBkt, nodeAccuracy * 0.70); // Fail = still some credit, never penalize

      const newLevel = earnedBkt >= 0.85 ? "MASTERED" : earnedBkt >= 0.60 ? "PROFICIENT" : undefined;

      await prisma.masteryScore.upsert({
        where: { studentId_nodeId: { studentId, nodeId } },
        update: {
          bktProbability: earnedBkt,
          ...(newLevel ? { level: newLevel as any } : {}),
          ...(earnedBkt >= 0.85 ? { trulyMastered: true } : {}),
          practiceCount: { increment: stats.total },
          correctCount: { increment: stats.correct },
          lastPracticed: new Date(),
        },
        create: {
          studentId,
          nodeId,
          bktProbability: earnedBkt,
          level: (newLevel || "NOVICE") as any,
          trulyMastered: earnedBkt >= 0.85,
          practiceCount: stats.total,
          correctCount: stats.correct,
        },
      });

      nodeScores[nodeId] = { before: beforeBkt, after: earnedBkt };
    }

    // Update attempt record
    await prisma.testAttempt.update({
      where: { id: testId },
      data: {
        correctCount,
        accuracy,
        passed,
        timeSpentMs: totalTimeMs,
        nodeScores: nodeScores as unknown as Prisma.InputJsonValue,
      },
    });

    // Log activity
    const eventType = attempt.testType === "course_challenge"
      ? (passed ? "COURSE_CHALLENGE_PASSED" : "COURSE_CHALLENGE_FAILED")
      : (passed ? "UNIT_TEST_PASSED" : "UNIT_TEST_FAILED");

    logActivity(
      studentId,
      eventType as any,
      `${passed ? "Passed" : "Attempted"}: ${attempt.targetName}`,
      {
        detail: `Score: ${correctCount}/${answers.length} (${Math.round(accuracy * 100)}%)`,
        metadata: {
          testId,
          testType: attempt.testType,
          targetId: attempt.targetId,
          accuracy,
          passed,
          nodesUpdated: Object.keys(nodeScores).length,
        },
      }
    );

    return NextResponse.json({
      passed,
      correctCount,
      totalQuestions: answers.length,
      accuracy: Math.round(accuracy * 100),
      nodeScores,
      message: passed
        ? attempt.testType === "course_challenge"
          ? "Course challenge passed! Ready to advance to the next grade."
          : "Unit test passed! All topics in this unit are now complete."
        : "Keep practicing — your scores have been updated based on what you got right.",
    });
  } catch (error) {
    console.error("Unit test submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit unit test" },
      { status: 500 }
    );
  }
}
