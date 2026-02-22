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
import { startPrefetch } from "@/lib/session/question-prefetch";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, selectedOptionId, isCorrect, isComprehensionCheck } = body;

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

    const student = session.student;
    const node = session.currentNode;

    // ═══ COMPREHENSION CHECK: Skip BKT — just generate first real question ═══
    if (isComprehensionCheck) {
      // Transition TEACHING → PRACTICE without touching mastery
      if (session.state === "TEACHING") {
        await transitionState(sessionId, "PRACTICE", "SUBMIT_ANSWER", {
          isCorrect: true,
        });
      }

      // Get current mastery (read-only)
      const existingMastery = await prisma.masteryScore.findUnique({
        where: {
          studentId_nodeId: { studentId: session.studentId, nodeId: node.id },
        },
      });
      const currentMastery: MasteryData = existingMastery
        ? {
            bktProbability: existingMastery.bktProbability,
            level: existingMastery.level as MasteryData["level"],
            practiceCount: existingMastery.practiceCount,
            correctCount: existingMastery.correctCount,
            lastPracticed: existingMastery.lastPracticed,
            nextReviewAt: existingMastery.nextReviewAt,
          }
        : {
            bktProbability: 0.3,
            level: "NOVICE" as const,
            practiceCount: 0,
            correctCount: 0,
            lastPracticed: new Date(),
            nextReviewAt: null,
          };

      // Kick off first real practice question generation in the background
      const promptParams = buildPromptParams(student, node, currentMastery);
      startPrefetch(sessionId, promptParams, node.nodeCode, node.title);

      // Return feedback immediately — client fetches question via /api/session/next-question
      return NextResponse.json({
        state: "PRACTICE",
        recommendedAction: "present_practice_problem",
        isCorrect: true,
        mastery: formatMastery(currentMastery),
        feedback: {
          message: "Great! Let's start practicing!",
          type: "correct",
        },
        questionPrefetched: true, // Signal client to fetch from next-question endpoint
      });
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

      // Start generating next question in the background
      const promptParams = buildPromptParams(student, node, updatedMastery);
      startPrefetch(sessionId, promptParams, node.nodeCode, node.title);

      // Return feedback immediately — client fetches question via /api/session/next-question
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
        questionPrefetched: true, // Signal client to fetch from next-question endpoint
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
