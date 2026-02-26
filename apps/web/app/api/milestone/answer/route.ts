/**
 * POST /api/milestone/answer
 *
 * Processes an answer to a milestone question.
 * Returns feedback and the next question, or signals completion
 * when all 8 questions are answered.
 */

import { NextResponse } from "next/server";
import {
  getMilestoneSession,
  setMilestoneSession,
} from "@/lib/learning-plan/milestone-assessor";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionKey, questionId, selectedOptionId, responseTimeMs } =
      body as {
        sessionKey?: string;
        questionId?: string;
        selectedOptionId?: string;
        responseTimeMs?: number;
      };

    if (!sessionKey || !questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: "sessionKey, questionId, and selectedOptionId are required" },
        { status: 400 }
      );
    }

    // Get milestone session
    const session = getMilestoneSession(sessionKey);
    if (!session) {
      return NextResponse.json(
        { error: "Milestone session not found or expired" },
        { status: 404 }
      );
    }

    // Check time limit
    const elapsedSeconds =
      (Date.now() - session.startedAt.getTime()) / 1000;
    if (elapsedSeconds > session.timeLimitSeconds) {
      return NextResponse.json(
        {
          error: "Time limit exceeded",
          status: "timeout",
          elapsedSeconds: Math.round(elapsedSeconds),
        },
        { status: 400 }
      );
    }

    // Find the question
    const question = session.questions.find(
      (q) => q.questionId === questionId
    );
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if already answered
    if (session.answers.has(questionId)) {
      return NextResponse.json(
        { error: "Question already answered" },
        { status: 400 }
      );
    }

    // Evaluate the answer
    const correctOption = question.options.find((o) => o.isCorrect);
    const isCorrect = correctOption?.id === selectedOptionId;

    // Record the answer
    session.answers.set(questionId, {
      questionId,
      selectedOptionId,
      isCorrect,
      responseTimeMs: responseTimeMs ?? 0,
    });

    // Update session
    setMilestoneSession(sessionKey, session);

    const answeredCount = session.answers.size;
    const totalQuestions = session.questions.length;
    const percentComplete = Math.round(
      (answeredCount / totalQuestions) * 100
    );

    // Build feedback
    const feedback = {
      wasCorrect: isCorrect,
      correctOptionId: correctOption?.id,
      explanation: question.explanation,
      message: isCorrect
        ? getCorrectMessage(answeredCount, totalQuestions)
        : getIncorrectMessage(question.conceptTitle),
    };

    // Check if all questions answered
    if (answeredCount >= totalQuestions) {
      return NextResponse.json({
        status: "complete",
        feedback,
        progress: {
          current: answeredCount,
          total: totalQuestions,
          percentComplete: 100,
        },
        sessionKey, // Client uses this to call /milestone/complete
      });
    }

    // Get next question
    const nextQuestionIndex = answeredCount; // 0-based, but we've already answered 'answeredCount' questions
    const nextQuestion = session.questions[nextQuestionIndex];

    return NextResponse.json({
      status: "next",
      feedback,
      question: {
        questionId: nextQuestion.questionId,
        conceptCode: nextQuestion.conceptCode,
        conceptTitle: nextQuestion.conceptTitle,
        questionText: nextQuestion.questionText,
        options: nextQuestion.options.map((o) => ({
          id: o.id,
          text: o.text,
          // Don't send isCorrect
        })),
        difficulty: nextQuestion.difficulty,
      },
      progress: {
        current: answeredCount + 1,
        total: totalQuestions,
        percentComplete,
      },
    });
  } catch (err) {
    console.error("[milestone/answer] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process answer",
      },
      { status: 500 }
    );
  }
}

// ─── Feedback Message Helpers ───

function getCorrectMessage(answered: number, total: number): string {
  const remaining = total - answered;
  const messages = [
    "Nice work! ⭐",
    "That's right! Keep it up! 🎯",
    "Correct! You're doing great! ✨",
    "Nailed it! 💪",
    "Perfect! You really know this! 🌟",
  ];

  if (remaining === 0) return "Last question — nailed it! 🎉";
  return messages[answered % messages.length];
}

function getIncorrectMessage(conceptTitle: string): string {
  const messages = [
    `Not quite, but that's okay! Let's review "${conceptTitle}" after the check.`,
    `Good try! "${conceptTitle}" can be tricky.`,
    `Almost there! We'll practice more "${conceptTitle}" soon.`,
    `No worries! Everyone finds "${conceptTitle}" challenging at first.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
