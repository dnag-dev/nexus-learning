/**
 * POST /api/milestone/start
 *
 * Starts a weekly milestone assessment for a learning plan.
 * Generates 8 questions covering the week's concepts and returns
 * the first question to the client.
 */

import { NextResponse } from "next/server";
import {
  generateMilestoneQuestions,
  setMilestoneSession,
} from "@/lib/learning-plan/milestone-assessor";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, weekNumber } = body as {
      planId?: string;
      weekNumber?: number;
    };

    if (!planId || weekNumber === undefined || weekNumber === null) {
      return NextResponse.json(
        { error: "planId and weekNumber are required" },
        { status: 400 }
      );
    }

    if (weekNumber < 1 || weekNumber > 100) {
      return NextResponse.json(
        { error: "Invalid week number" },
        { status: 400 }
      );
    }

    // Generate all 8 questions
    const { questions, conceptsCovered, studentId } =
      await generateMilestoneQuestions(planId, weekNumber);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate milestone questions" },
        { status: 500 }
      );
    }

    // Create milestone session key
    const sessionKey = `${planId}:${weekNumber}`;

    // Store session state
    setMilestoneSession(sessionKey, {
      planId,
      weekNumber,
      studentId,
      questions,
      answers: new Map(),
      startedAt: new Date(),
      timeLimitSeconds: 1200, // 20 minutes
    });

    // Return first question (don't send all at once to prevent cheating)
    const firstQuestion = questions[0];

    return NextResponse.json({
      sessionKey,
      totalQuestions: questions.length,
      timeLimit: 1200,
      conceptsCovered,
      question: {
        questionId: firstQuestion.questionId,
        conceptCode: firstQuestion.conceptCode,
        conceptTitle: firstQuestion.conceptTitle,
        questionText: firstQuestion.questionText,
        options: firstQuestion.options.map((o) => ({
          id: o.id,
          text: o.text,
          // Don't send isCorrect to client
        })),
        difficulty: firstQuestion.difficulty,
      },
      progress: {
        current: 1,
        total: questions.length,
        percentComplete: 0,
      },
    });
  } catch (err) {
    console.error("[milestone/start] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start milestone",
      },
      { status: 500 }
    );
  }
}
