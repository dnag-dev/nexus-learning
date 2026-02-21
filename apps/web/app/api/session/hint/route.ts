import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { callClaude } from "@/lib/session/claude-client";
import * as hintPrompt from "@/lib/prompts/hint.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, questionText, studentAnswer } = body;

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

    if (!session || !session.currentNode) {
      return NextResponse.json(
        { error: "Session or current node not found" },
        { status: 404 }
      );
    }

    // Transition to HINT_REQUESTED
    if (session.state === "PRACTICE") {
      await transitionState(sessionId, "HINT_REQUESTED", "REQUEST_HINT");
    }

    // Increment hints used
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { hintsUsed: { increment: 1 } },
    });

    const student = session.student;
    const node = session.currentNode;

    // Generate hint
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
      currentEmotionalState: "CONFUSED" as EmotionalStateValue,
      questionText: questionText || "the current problem",
      studentAnswer,
    };

    const prompt = hintPrompt.buildPrompt(promptParams);
    const claudeResponse = await callClaude(prompt);
    const hint = claudeResponse
      ? hintPrompt.parseResponse(claudeResponse)
      : {
          hint: "Try breaking the problem into smaller steps!",
          encouragement: "You're doing great — keep trying!",
        };

    // Transition back to PRACTICE
    await transitionState(sessionId, "PRACTICE", "RETURN_TO_PRACTICE");

    return NextResponse.json({
      state: "PRACTICE",
      hint,
      hintsUsed: (session.hintsUsed ?? 0) + 1,
    });
  } catch (err) {
    console.error("Session hint error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to get hint",
      },
      { status: 500 }
    );
  }
}
