/**
 * POST /api/diagnostic/answer
 *
 * Processes an answer to a diagnostic question.
 * Works for both standard and goal-aware modes.
 * Returns feedback and the next question, or signals completion.
 *
 * In goal-aware mode, the completion response includes a skill map
 * showing mastered/gap/untested concepts with estimated hours.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  processAnswer,
  selectNextQuestion,
  calculatePlacementResult,
  saveDiagnosticResult,
  generateSkillMap,
} from "@/lib/diagnostic/diagnostic-engine";
import { generateDiagnosticQuestion } from "@/lib/diagnostic/question-generator";
import { diagnosticSessions } from "../start/route";
import type { DiagnosticResponse } from "@/lib/diagnostic/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, questionId, nodeCode, selectedOptionId, isCorrect, responseTimeMs } = body;

    if (!sessionId || !nodeCode || !selectedOptionId || isCorrect === undefined) {
      return NextResponse.json(
        { error: "sessionId, nodeCode, selectedOptionId, and isCorrect are required" },
        { status: 400 }
      );
    }

    // Get the current diagnostic state
    const diagState = diagnosticSessions.get(sessionId);
    if (!diagState) {
      return NextResponse.json(
        { error: "Diagnostic session not found. It may have expired." },
        { status: 404 }
      );
    }

    // Build the response object
    const response: DiagnosticResponse = {
      questionId: questionId || `diag-${nodeCode}-${Date.now()}`,
      nodeCode,
      selectedOptionId,
      isCorrect,
      responseTimeMs: responseTimeMs || 0,
      questionIndex: diagState.questionsAnswered,
    };

    // Process the answer through the binary search
    const newState = processAnswer(diagState, response);
    diagnosticSessions.set(sessionId, newState);

    // Update the learning session in DB
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: newState.questionsAnswered,
        correctAnswers: newState.confirmedMastered.length,
      },
    });

    // Check if diagnostic is complete
    if (newState.status === "complete") {
      const result = calculatePlacementResult(newState);

      // Enrich with node title from DB
      const frontierNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode: result.frontierNodeCode },
      });
      result.frontierNodeTitle = frontierNode?.title ?? result.frontierNodeCode;

      // Save results to DB
      await saveDiagnosticResult(diagState.studentId, sessionId, result);

      // Generate skill map for goal-aware mode
      let skillMap = null;
      if (newState.goalId && newState.orderedNodes) {
        try {
          skillMap = await generateSkillMap(newState, sessionId);
        } catch (e) {
          console.error("[diagnostic/answer] Skill map generation error:", e);
          // Non-critical — continue without skill map
        }
      }

      // Clean up in-memory state
      diagnosticSessions.delete(sessionId);

      return NextResponse.json({
        status: "complete",
        result,
        progress: {
          current: newState.questionsAnswered,
          total: newState.totalQuestions,
          percentComplete: 100,
        },
        // Goal-aware mode extras
        ...(newState.goalId && {
          mode: "goal-aware",
          goalId: newState.goalId,
          goalName: newState.goalName,
          skillMap,
        }),
      });
    }

    // Not complete — generate the next question
    const nextNode = selectNextQuestion(newState);
    if (!nextNode) {
      // Edge case: search space exhausted before max questions
      const result = calculatePlacementResult(newState);
      const frontierNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode: result.frontierNodeCode },
      });
      result.frontierNodeTitle = frontierNode?.title ?? result.frontierNodeCode;
      await saveDiagnosticResult(diagState.studentId, sessionId, result);

      // Generate skill map for goal-aware mode
      let skillMap = null;
      if (newState.goalId && newState.orderedNodes) {
        try {
          skillMap = await generateSkillMap(newState, sessionId);
        } catch (e) {
          console.error("[diagnostic/answer] Skill map generation error:", e);
        }
      }

      diagnosticSessions.delete(sessionId);

      return NextResponse.json({
        status: "complete",
        result,
        progress: {
          current: newState.questionsAnswered,
          total: newState.totalQuestions,
          percentComplete: 100,
        },
        ...(newState.goalId && {
          mode: "goal-aware",
          goalId: newState.goalId,
          goalName: newState.goalName,
          skillMap,
        }),
      });
    }

    // Fetch node info for the next question
    const knowledgeNode = await prisma.knowledgeNode.findUnique({
      where: { nodeCode: nextNode.nodeCode },
    });

    if (!knowledgeNode) {
      return NextResponse.json(
        { error: `Knowledge node ${nextNode.nodeCode} not found` },
        { status: 500 }
      );
    }

    // Look up student for question generation
    const student = await prisma.student.findUnique({
      where: { id: diagState.studentId },
    });

    const ageMap: Record<string, number> = {
      EARLY_5_7: 6,
      MID_8_10: 9,
      UPPER_11_12: 11,
    };

    const question = await generateDiagnosticQuestion({
      nodeCode: knowledgeNode.nodeCode,
      nodeTitle: knowledgeNode.title,
      nodeDescription: knowledgeNode.description,
      gradeLevel: knowledgeNode.gradeLevel,
      domain: knowledgeNode.domain,
      difficulty: knowledgeNode.difficulty,
      studentName: student?.displayName ?? "Student",
      studentAge: ageMap[student?.ageGroup ?? "EARLY_5_7"] ?? 7,
      personaId: student?.avatarPersonaId ?? "cosmo",
    });

    return NextResponse.json({
      status: "in_progress",
      question,
      progress: {
        current: newState.questionsAnswered + 1,
        total: newState.totalQuestions,
        percentComplete: Math.round(
          (newState.questionsAnswered / newState.totalQuestions) * 100
        ),
      },
      feedback: {
        wasCorrect: isCorrect,
        message: isCorrect
          ? getCorrectFeedback(student?.avatarPersonaId ?? "cosmo")
          : getIncorrectFeedback(student?.avatarPersonaId ?? "cosmo"),
      },
      // Goal-aware mode metadata
      ...(newState.goalId && {
        mode: "goal-aware",
        goalId: newState.goalId,
        goalName: newState.goalName,
      }),
    });
  } catch (err) {
    console.error("Diagnostic answer error:", err);
    return NextResponse.json(
      { error: "Failed to process answer" },
      { status: 500 }
    );
  }
}

function getCorrectFeedback(personaId: string): string {
  const feedbacks: Record<string, string[]> = {
    cosmo: [
      "That's right! Cosmo's star is glowing brighter! \u2B50",
      "You got it! Cosmo is so proud of you! \uD83D\uDC3B",
      "Amazing work! Keep going \u2014 you're doing great!",
      "Yes! You're a math superstar! \u2728",
    ],
    rex: [
      "Wait, you got that RIGHT?! Rex is impressed! \uD83E\uDD95",
      "Wow! Even Rex couldn't do that so fast!",
      "That's correct! Rex is doing a happy dance!",
    ],
    luna: [
      "Beautiful! Luna knew you could do it. \uD83C\uDF19",
      "Purr-fect answer! \u2728",
      "How lovely \u2014 you solved it with such grace!",
    ],
  };

  const options = feedbacks[personaId] ?? feedbacks.cosmo;
  return options[Math.floor(Math.random() * options.length)];
}

function getIncorrectFeedback(personaId: string): string {
  const feedbacks: Record<string, string[]> = {
    cosmo: [
      "Not quite, but that's okay! Cosmo learns from every try. \uD83D\uDC3B",
      "Almost! Don't worry \u2014 that one is tricky. Let's keep going!",
      "That's a tough one! Cosmo will help you with this later. \uD83D\uDCAA",
    ],
    rex: [
      "Oops! Don't worry \u2014 Rex gets things wrong ALL the time! \uD83E\uDD95",
      "That's okay! Rex says mistakes are just learning in disguise!",
      "No worries! Even Rex mixed that one up yesterday!",
    ],
    luna: [
      "That's okay, dear. Every great thinker stumbles sometimes. \uD83C\uDF19",
      "Not quite \u2014 but Luna sees you thinking hard, and that's what matters.",
      "Close! Luna will guide you through this one later. \u2728",
    ],
  };

  const options = feedbacks[personaId] ?? feedbacks.cosmo;
  return options[Math.floor(Math.random() * options.length)];
}
