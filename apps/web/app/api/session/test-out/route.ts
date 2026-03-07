/**
 * POST /api/session/test-out
 *
 * Phase 13: Topic Test Out — 5 questions, no hints, pass 80%+ to skip ahead.
 *
 * Body: { studentId, nodeId }
 * Returns: { testId, questions: [...], timeLimit: 300 }
 *
 * POST /api/session/test-out/submit
 * Body: { testId, answers: [{ questionIndex, selectedAnswer, timeMs }] }
 * Returns: { passed, score, accuracy, nodeScores }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { logActivity } from "@/lib/activity-log";

const TEST_OUT_QUESTIONS = 5;
const PASS_THRESHOLD = 0.80; // 80% = 4/5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, nodeId, nodeCode, action, testId, answers } = body;

    // ─── Submit answers ───
    if (action === "submit" && testId && answers) {
      return handleSubmit(testId, studentId, answers);
    }

    // ─── Start test-out ───
    // Accept nodeId (DB primary key) or nodeCode (e.g. "MATH.3.NF.1") for flexibility
    if (!studentId || (!nodeId && !nodeCode)) {
      return NextResponse.json(
        { error: "studentId and nodeId or nodeCode required" },
        { status: 400 }
      );
    }

    const node = nodeId
      ? await prisma.knowledgeNode.findUnique({ where: { id: nodeId } })
      : await prisma.knowledgeNode.findFirst({ where: { nodeCode } });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    // Create test attempt record
    const attempt = await prisma.testAttempt.create({
      data: {
        studentId,
        testType: "topic_test_out",
        targetId: node.id,
        targetName: node.title,
        subject: node.subject,
        gradeLevel: node.gradeLevel,
        totalQuestions: TEST_OUT_QUESTIONS,
        correctCount: 0,
        accuracy: 0,
        passed: false,
      },
    });

    return NextResponse.json({
      testId: attempt.id,
      nodeId: node.id,
      nodeCode: node.nodeCode,
      nodeName: node.title,
      subject: node.subject,
      gradeLevel: node.gradeLevel,
      questionCount: TEST_OUT_QUESTIONS,
      passThreshold: PASS_THRESHOLD,
      timeLimitSeconds: 300, // 5 minutes total
    });
  } catch (error) {
    console.error("Test-out error:", error);
    return NextResponse.json(
      { error: "Failed to start test-out" },
      { status: 500 }
    );
  }
}

async function handleSubmit(
  testId: string,
  studentId: string,
  answers: Array<{ questionIndex: number; isCorrect: boolean; timeMs: number }>
) {
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: testId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = correctCount / answers.length;
    const passed = accuracy >= PASS_THRESHOLD;
    const totalTimeMs = answers.reduce((sum, a) => sum + a.timeMs, 0);

    // Update attempt record
    await prisma.testAttempt.update({
      where: { id: testId },
      data: {
        correctCount,
        accuracy,
        passed,
        timeSpentMs: totalTimeMs,
      },
    });

    // If passed → update BKT to mastered level
    if (passed) {
      await prisma.masteryScore.upsert({
        where: {
          studentId_nodeId: { studentId, nodeId: attempt.targetId },
        },
        update: {
          bktProbability: Math.max(0.85, accuracy), // At least mastery threshold
          level: "MASTERED",
          trulyMastered: true,
          practiceCount: { increment: answers.length },
          correctCount: { increment: correctCount },
          lastPracticed: new Date(),
        },
        create: {
          studentId,
          nodeId: attempt.targetId,
          bktProbability: Math.max(0.85, accuracy),
          level: "MASTERED",
          trulyMastered: true,
          practiceCount: answers.length,
          correctCount,
        },
      });

      // Log success
      logActivity(
        studentId,
        "TEST_OUT_PASSED",
        `Tested out of ${attempt.targetName}`,
        {
          detail: `Score: ${correctCount}/${answers.length} (${Math.round(accuracy * 100)}%)`,
          metadata: {
            testId,
            nodeId: attempt.targetId,
            accuracy,
            timeMs: totalTimeMs,
          },
        }
      );
    } else {
      // Failed — update BKT to earned score (never penalize below current)
      const existing = await prisma.masteryScore.findUnique({
        where: {
          studentId_nodeId: { studentId, nodeId: attempt.targetId },
        },
      });

      const earnedBkt = accuracy * 0.85; // Scale to BKT range
      const newBkt = Math.max(existing?.bktProbability ?? 0, earnedBkt);

      await prisma.masteryScore.upsert({
        where: {
          studentId_nodeId: { studentId, nodeId: attempt.targetId },
        },
        update: {
          bktProbability: newBkt,
          practiceCount: { increment: answers.length },
          correctCount: { increment: correctCount },
          lastPracticed: new Date(),
        },
        create: {
          studentId,
          nodeId: attempt.targetId,
          bktProbability: newBkt,
          practiceCount: answers.length,
          correctCount,
        },
      });

      logActivity(
        studentId,
        "TEST_OUT_FAILED",
        `Test-out attempt: ${attempt.targetName}`,
        {
          detail: `Score: ${correctCount}/${answers.length} — dropped into normal practice at ${Math.round(newBkt * 100)}%`,
          metadata: {
            testId,
            nodeId: attempt.targetId,
            accuracy,
            earnedBkt: newBkt,
          },
        }
      );
    }

    return NextResponse.json({
      passed,
      correctCount,
      totalQuestions: answers.length,
      accuracy: Math.round(accuracy * 100),
      message: passed
        ? "You tested out! Topic marked as mastered."
        : "Not quite — let's practice this topic to build mastery.",
    });
  } catch (error) {
    console.error("Test-out submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit test-out" },
      { status: 500 }
    );
  }
}
