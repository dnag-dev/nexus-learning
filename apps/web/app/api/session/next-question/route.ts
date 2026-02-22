/**
 * GET /api/session/next-question?sessionId=xxx
 *
 * Returns the prefetched practice question for a session.
 * If the question is still generating, waits for it (usually just 1-2s).
 * Falls back to on-demand generation if no prefetch exists.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getPrefetchedQuestion } from "@/lib/session/question-prefetch";
import { callClaude } from "@/lib/session/claude-client";
import * as practicePrompt from "@/lib/prompts/practice.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Try to get the prefetched question
  const prefetched = await getPrefetchedQuestion(sessionId);
  if (prefetched) {
    return NextResponse.json({ question: prefetched, source: "prefetch" });
  }

  // No prefetch found — generate on-demand (fallback)
  console.warn(
    `[next-question] No prefetch for ${sessionId} — generating on-demand`
  );

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

  const student = session.student;
  const node = session.currentNode;

  const existing = await prisma.masteryScore.findUnique({
    where: {
      studentId_nodeId: { studentId: session.studentId, nodeId: node.id },
    },
  });

  const promptParams = {
    nodeCode: node.nodeCode,
    nodeTitle: node.title,
    nodeDescription: node.description,
    gradeLevel: node.gradeLevel,
    domain: node.domain,
    difficulty: node.difficulty,
    studentName: student.displayName,
    ageGroup: student.ageGroup as AgeGroupValue,
    personaId: student.avatarPersonaId,
    currentEmotionalState: "ENGAGED" as EmotionalStateValue,
    bktProbability: existing?.bktProbability ?? 0.3,
  };

  const prompt = practicePrompt.buildPrompt(promptParams);
  const claudeResponse = await callClaude(prompt);
  const question = claudeResponse
    ? practicePrompt.parseResponse(claudeResponse)
    : {
        questionText: `Practice question for ${node.title}: What is 5 + 3?`,
        options: [
          { id: "A", text: "7", isCorrect: false },
          { id: "B", text: "8", isCorrect: true },
          { id: "C", text: "9", isCorrect: false },
          { id: "D", text: "6", isCorrect: false },
        ],
        correctAnswer: "B",
        explanation: "5 + 3 = 8",
      };

  return NextResponse.json({ question, source: "on-demand" });
}
