import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { updateMasteryInDB, shouldAdvanceNode, recommendNextNode } from "@/lib/session/bkt-engine";
import type { MasteryData } from "@/lib/session/bkt-engine";
import { callClaude } from "@/lib/session/claude-client";
import * as practicePrompt from "@/lib/prompts/practice.prompt";
import * as celebratingPrompt from "@/lib/prompts/celebrating.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";
import { processCorrectAnswer, processNodeMastered } from "@/lib/gamification/gamification-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, selectedOptionId, isCorrect } = body;

    if (!sessionId || isCorrect === undefined) {
      return NextResponse.json(
        { error: "sessionId and isCorrect are required" },
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

    // Update BKT mastery
    const updatedMastery = await updateMasteryInDB(
      session.studentId,
      session.currentNode.id,
      isCorrect
    );

    // Update session counters
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        correctAnswers: { increment: isCorrect ? 1 : 0 },
      },
    });

    const student = session.student;
    const node = session.currentNode;

    // ═══ GAMIFICATION: Award XP for correct answer ═══
    let gamificationXP = null;
    if (isCorrect) {
      try {
        gamificationXP = await processCorrectAnswer(
          session.studentId,
          node.nodeCode,
          node.title
        );
      } catch (e) {
        console.error("Gamification XP error (non-critical):", e);
      }
    }

    // Determine next state based on result
    let wrongStreak = 0;
    if (!isCorrect) {
      // Check if struggling (3+ wrong in a row on same node)
      const recentSessions = await prisma.learningSession.findMany({
        where: { studentId: session.studentId, currentNodeId: node.id },
        orderBy: { startedAt: "desc" },
        take: 1,
      });
      // Simple heuristic: if mastery is very low after this answer, they're struggling
      if (updatedMastery.bktProbability < 0.25) wrongStreak = 3;
    }

    // Decision tree
    if (isCorrect && shouldAdvanceNode(updatedMastery)) {
      // If still in TEACHING, transition to PRACTICE first
      if (session.state === "TEACHING") {
        await transitionState(sessionId, "PRACTICE", "SUBMIT_ANSWER", {
          isCorrect,
        });
      }

      // MASTERY ACHIEVED — celebrate!
      const result = await transitionState(
        sessionId,
        "CELEBRATING",
        "MASTERY_ACHIEVED",
        {
          nodeCode: node.nodeCode,
          bktProbability: updatedMastery.bktProbability,
        }
      );

      // ═══ GAMIFICATION: Node mastered → award XP + check badges ═══
      let masteryGamification = null;
      try {
        masteryGamification = await processNodeMastered(
          session.studentId,
          node.nodeCode,
          node.title
        );
      } catch (e) {
        console.error("Gamification mastery error (non-critical):", e);
      }

      // Get next node recommendation
      const nextNode = await recommendNextNode(
        session.studentId,
        node.nodeCode
      );

      // Generate celebration
      const promptParams = buildPromptParams(student, node, updatedMastery);
      const prompt = celebratingPrompt.buildPrompt({
        ...promptParams,
        nextNodeTitle: nextNode?.title,
      });
      const claudeResponse = await callClaude(prompt);
      const celebration = claudeResponse
        ? celebratingPrompt.parseResponse(claudeResponse)
        : {
            celebration: `Amazing! You've mastered ${node.title}!`,
            funFact: "Math is everywhere in the world around you!",
            nextTeaser: nextNode
              ? `Up next: ${nextNode.title}!`
              : "You've completed this learning path!",
          };

      return NextResponse.json({
        state: result.newState,
        recommendedAction: result.recommendedAction,
        isCorrect,
        mastery: formatMastery(updatedMastery),
        celebration,
        nextNode,
        gamification: masteryGamification ?? gamificationXP,
      });
    } else if (!isCorrect && wrongStreak >= 3) {
      // If still in TEACHING, transition to PRACTICE first
      if (session.state === "TEACHING") {
        await transitionState(sessionId, "PRACTICE", "SUBMIT_ANSWER", {
          isCorrect,
        });
      }

      // STRUGGLING — need intervention
      const result = await transitionState(
        sessionId,
        "STRUGGLING",
        "STRUGGLE_DETECTED",
        { wrongStreak, bktProbability: updatedMastery.bktProbability }
      );

      return NextResponse.json({
        state: result.newState,
        recommendedAction: result.recommendedAction,
        isCorrect,
        mastery: formatMastery(updatedMastery),
        feedback: {
          message: "Let's slow down and try a different approach.",
          type: "struggling",
        },
      });
    } else {
      // CONTINUE PRACTICE — generate next question
      // Stay in PRACTICE (or transition from TEACHING → PRACTICE)
      if (session.state === "TEACHING") {
        await transitionState(sessionId, "PRACTICE", "SUBMIT_ANSWER", {
          isCorrect,
        });
      }

      const promptParams = buildPromptParams(student, node, updatedMastery);
      const prompt = practicePrompt.buildPrompt(promptParams);
      const claudeResponse = await callClaude(prompt);
      const nextQuestion = claudeResponse
        ? practicePrompt.parseResponse(claudeResponse)
        : getFallbackPracticeQuestion(node.nodeCode, node.title);

      return NextResponse.json({
        state: "PRACTICE",
        recommendedAction: "present_practice_problem",
        isCorrect,
        mastery: formatMastery(updatedMastery),
        feedback: {
          message: isCorrect
            ? "Great job! Here's another one."
            : "Not quite — let's try again!",
          type: isCorrect ? "correct" : "incorrect",
        },
        nextQuestion,
        gamification: gamificationXP,
      });
    }
  } catch (err) {
    console.error("Session answer error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process answer",
      },
      { status: 500 }
    );
  }
}

function buildPromptParams(
  student: { displayName: string; ageGroup: string; avatarPersonaId: string },
  node: {
    nodeCode: string;
    title: string;
    description: string;
    gradeLevel: string;
    domain: string;
    difficulty: number;
  },
  mastery: MasteryData
) {
  return {
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
    bktProbability: mastery.bktProbability,
  };
}

function formatMastery(mastery: MasteryData) {
  return {
    level: mastery.level,
    probability: Math.round(mastery.bktProbability * 100),
    practiceCount: mastery.practiceCount,
    correctCount: mastery.correctCount,
  };
}

function getFallbackPracticeQuestion(nodeCode: string, title: string) {
  return {
    questionText: `Practice question for ${title}: What is 5 + 3?`,
    options: [
      { id: "A", text: "7", isCorrect: false },
      { id: "B", text: "8", isCorrect: true },
      { id: "C", text: "9", isCorrect: false },
      { id: "D", text: "6", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "5 + 3 = 8",
  };
}
