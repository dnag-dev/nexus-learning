/**
 * POST /api/session/fluency
 *
 * Fluency drill answer processor.
 * Evaluates speed + correctness, tracks consecutive streaks,
 * detects flatline, and determines when fluency mastery is achieved.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { evaluateFluencyAnswer } from "@/lib/session/fluency-engine";
import { updateNexusScore } from "@/lib/session/nexus-score";
import { updateMasteryInDB } from "@/lib/session/bkt-engine";
import { processCorrectAnswer } from "@/lib/gamification/gamification-service";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, isCorrect, responseTimeMs, questionText } = body;

    if (!sessionId || isCorrect === undefined || !responseTimeMs) {
      return NextResponse.json(
        { error: "sessionId, isCorrect, and responseTimeMs are required" },
        { status: 400 }
      );
    }

    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { student: true, currentNode: true },
    });

    if (!session?.currentNode || !session.student) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const node = session.currentNode;

    // Record the question response
    await prisma.questionResponse.create({
      data: {
        studentId: session.studentId,
        nodeId: node.id,
        sessionId,
        questionText: questionText ?? "",
        isCorrect,
        responseTimeMs: Math.round(responseTimeMs),
        questionType: "fluency_drill",
      },
    });

    // Update BKT
    await updateMasteryInDB(session.studentId, node.id, isCorrect);

    // Update session counters
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        correctAnswers: { increment: isCorrect ? 1 : 0 },
      },
    });

    // Evaluate fluency
    const result = await evaluateFluencyAnswer(
      session.studentId,
      node.id,
      responseTimeMs,
      isCorrect,
      node.gradeLevel,
      node.domain
    );

    // Update Nexus Score
    let nexusScore = null;
    try {
      nexusScore = await updateNexusScore(
        session.studentId,
        node.id,
        node.gradeLevel,
        node.domain
      );
    } catch {
      // Non-critical
    }

    // Gamification XP for correct answers
    let gamification = null;
    if (isCorrect) {
      try {
        gamification = await processCorrectAnswer(
          session.studentId,
          node.nodeCode,
          node.title
        );
      } catch {
        // Non-critical
      }
    }

    // If fluency completed, transition back to standard mode
    if (result.completed) {
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: { mode: "standard" },
      });
    }

    return NextResponse.json({
      ...result,
      nexusScore: nexusScore?.nexusScore ?? null,
      gamification,
    });
  } catch (err) {
    console.error("Fluency drill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fluency drill failed" },
      { status: 500 }
    );
  }
}
