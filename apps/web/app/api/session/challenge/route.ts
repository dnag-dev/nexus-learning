/**
 * GET /api/session/challenge?sessionId=xxx
 *   → Generate challenge question for current node
 *
 * POST /api/session/challenge
 *   Body: { sessionId, answer, responseTimeMs }
 *   → Claude evaluates → returns { score, feedback, strengths, improvements }
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  generateChallenge,
  evaluateChallenge,
} from "@/lib/session/challenge-engine";
import { updateNexusScore } from "@/lib/session/nexus-score";
import type { AgeGroupValue } from "@/lib/prompts/types";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
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
  const student = session.student;

  try {
    const challenge = await generateChallenge(
      node.title,
      node.description,
      node.domain,
      node.gradeLevel,
      student.displayName,
      student.ageGroup as AgeGroupValue,
      student.avatarPersonaId
    );

    return NextResponse.json({ challenge });
  } catch (err) {
    console.error("Challenge generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, answer, responseTimeMs, scenario, question } = body;

    if (!sessionId || !answer) {
      return NextResponse.json(
        { error: "sessionId and answer are required" },
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
    const student = session.student;

    // Evaluate with Claude
    const evaluation = await evaluateChallenge(
      answer,
      node.title,
      node.description,
      scenario ?? "",
      question ?? "",
      student.ageGroup as AgeGroupValue,
      student.avatarPersonaId,
      student.displayName
    );

    // Record question response
    if (responseTimeMs) {
      await prisma.questionResponse.create({
        data: {
          studentId: session.studentId,
          nodeId: node.id,
          sessionId,
          questionText: question ?? "Challenge mode",
          isCorrect: evaluation.isCorrect,
          responseTimeMs: Math.round(responseTimeMs),
          questionType: "challenge",
        },
      });
    }

    // Update session counters
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        correctAnswers: { increment: evaluation.isCorrect ? 1 : 0 },
      },
    });

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

    return NextResponse.json({
      ...evaluation,
      nexusScore: nexusScore?.nexusScore ?? null,
    });
  } catch (err) {
    console.error("Challenge evaluation error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate challenge" },
      { status: 500 }
    );
  }
}
