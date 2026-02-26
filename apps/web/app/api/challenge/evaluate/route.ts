/**
 * POST /api/challenge/evaluate
 *
 * Evaluate a student's typed response to a challenge problem.
 * Claude evaluates reasoning quality, correctness, and depth.
 *
 * Body: { studentId, conceptId, answer, scenario, question, responseTimeMs? }
 * Returns: { evaluation, canFollowUp }
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { evaluateChallenge } from "@/lib/session/challenge-engine";
import type { AgeGroupValue } from "@/lib/prompts/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, conceptId, answer, scenario, question, responseTimeMs } =
      body;

    if (!studentId || !conceptId || !answer) {
      return NextResponse.json(
        { error: "studentId, conceptId, and answer are required" },
        { status: 400 }
      );
    }

    // Look up student and node
    const [student, node] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.knowledgeNode.findFirst({ where: { nodeCode: conceptId } }),
    ]);

    if (!student || !node) {
      return NextResponse.json(
        { error: "Student or concept not found" },
        { status: 404 }
      );
    }

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

    // Record the response in a lightweight challenge session
    if (responseTimeMs) {
      try {
        // Create a dedicated challenge session for tracking
        const challengeSession = await prisma.learningSession.create({
          data: {
            studentId,
            state: "COMPLETED",
            currentNodeId: node.id,
            mode: "challenge",
            subject: node.subject,
            questionsAnswered: 1,
            correctAnswers: evaluation.isCorrect ? 1 : 0,
            durationSeconds: Math.round(responseTimeMs / 1000),
            endedAt: new Date(),
          },
        });

        await prisma.questionResponse.create({
          data: {
            studentId,
            nodeId: node.id,
            sessionId: challengeSession.id,
            questionText: question ?? "Challenge mode",
            isCorrect: evaluation.isCorrect,
            responseTimeMs: Math.round(responseTimeMs),
            questionType: "challenge",
          },
        });
      } catch (e) {
        console.error("[challenge/evaluate] Response recording error (non-critical):", e);
      }
    }

    // Determine if follow-up is appropriate
    // Follow up if score is between 40-90 (room for improvement but not totally off)
    const canFollowUp = evaluation.score >= 40 && evaluation.score < 95;

    return NextResponse.json({
      evaluation,
      canFollowUp,
    });
  } catch (err) {
    console.error("[challenge/evaluate] Error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate challenge" },
      { status: 500 }
    );
  }
}
