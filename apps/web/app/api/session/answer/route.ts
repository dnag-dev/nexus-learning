/**
 * POST /api/session/answer
 *
 * 5-step learning loop answer processor.
 *
 * Step 2 (check_understanding): 1 question. Correct/wrong → always advance to Step 3.
 * Step 3 (guided_practice): 3 questions, need 2/3. Wrong → remediation. Fail → back to Step 2.
 * Step 4 (independent_practice): 5 questions, need 4/5. No hints. Fail → back to Step 2.
 * Step 5 (mastery_proof): 1 question. Correct → MASTERY. Wrong → back to Step 2.
 *
 * BKT mastery updates on every answer (keeps underlying model accurate).
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import {
  updateMasteryInDB,
  shouldAdvanceNode,
  recommendNextNode,
} from "@/lib/session/bkt-engine";
import type { MasteryData } from "@/lib/session/bkt-engine";
import { callClaude } from "@/lib/session/claude-client";
import * as celebratingPrompt from "@/lib/prompts/celebrating.prompt";
import * as stepPrompt from "@/lib/prompts/step-question.prompt";
import type {
  AgeGroupValue,
  EmotionalStateValue,
  LearningStepType,
} from "@/lib/prompts/types";
import {
  processCorrectAnswer,
  processNodeMastered,
} from "@/lib/gamification/gamification-service";
import { startPrefetch } from "@/lib/session/question-prefetch";
import { evaluateTrueMastery } from "@/lib/session/mastery-gate";
import { updateNexusScore } from "@/lib/session/nexus-score";

export const maxDuration = 30;

// ═══ Step requirements ═══
const STEP_REQUIREMENTS: Record<number, { required: number; total: number }> = {
  2: { required: 1, total: 1 }, // Check understanding: 1/1
  3: { required: 2, total: 3 }, // Guided practice: 2/3
  4: { required: 4, total: 5 }, // Independent practice: 4/5
  5: { required: 1, total: 1 }, // Mastery proof: 1/1
};

function stepToType(step: number): LearningStepType {
  switch (step) {
    case 2:
      return "check_understanding";
    case 3:
      return "guided_practice";
    case 4:
      return "independent_practice";
    case 5:
      return "mastery_proof";
    default:
      return "check_understanding";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      selectedOptionId,
      isCorrect,
      // Remediation context (client sends these for Step 3 wrong answers)
      questionText,
      selectedAnswerText,
      correctAnswerText,
      explanation,
      // Response time tracking (client sends milliseconds from question display to submit)
      responseTimeMs,
    } = body;

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
    const currentStep = session.learningStep; // 1-5

    // ═══ Update BKT mastery — skip Step 2 (check understanding is a readiness gate, not assessment) ═══
    let updatedMastery: MasteryData;
    if (currentStep === 2) {
      // Step 2 gives ZERO BKT credit — read current mastery without updating
      const existing = await prisma.masteryScore.findUnique({
        where: { studentId_nodeId: { studentId: session.studentId, nodeId: node.id } },
      });
      updatedMastery = existing
        ? {
            bktProbability: existing.bktProbability,
            level: existing.level as import("@/lib/session/bkt-engine").MasteryLevelValue,
            practiceCount: existing.practiceCount,
            correctCount: existing.correctCount,
            lastPracticed: existing.lastPracticed,
            nextReviewAt: existing.nextReviewAt,
          }
        : {
            bktProbability: 0.10,
            level: "NOVICE" as const,
            practiceCount: 0,
            correctCount: 0,
            lastPracticed: new Date(),
            nextReviewAt: null,
          };
    } else {
      // Steps 3, 4, 5 — update BKT normally
      updatedMastery = await updateMasteryInDB(
        session.studentId,
        node.id,
        isCorrect
      );
    }

    // ═══ Record QuestionResponse for mastery gating + speed tracking ═══
    const stepType = stepToType(currentStep);
    if (responseTimeMs && responseTimeMs > 0) {
      try {
        await prisma.questionResponse.create({
          data: {
            studentId: session.studentId,
            nodeId: node.id,
            sessionId,
            questionText: questionText ?? "",
            isCorrect,
            responseTimeMs: Math.round(responseTimeMs),
            questionType: stepType,
          },
        });

        // Update personal best on correct answers
        if (isCorrect) {
          const existing = await prisma.masteryScore.findUnique({
            where: {
              studentId_nodeId: {
                studentId: session.studentId,
                nodeId: node.id,
              },
            },
            select: { personalBestMs: true },
          });
          if (
            !existing?.personalBestMs ||
            responseTimeMs < existing.personalBestMs
          ) {
            await prisma.masteryScore.update({
              where: {
                studentId_nodeId: {
                  studentId: session.studentId,
                  nodeId: node.id,
                },
              },
              data: { personalBestMs: Math.round(responseTimeMs) },
            });
          }
        }
      } catch (e) {
        console.error("QuestionResponse recording error (non-critical):", e);
      }
    }

    // ═══ Update Nexus Score on every answer ═══
    let nexusBreakdown = null;
    try {
      nexusBreakdown = await updateNexusScore(
        session.studentId,
        node.id,
        node.gradeLevel,
        node.domain
      );
    } catch (e) {
      console.error("Nexus Score update error (non-critical):", e);
    }

    // Update session step counters
    const newStepCorrect = session.stepCorrectCount + (isCorrect ? 1 : 0);
    const newStepTotal = session.stepTotalCount + 1;

    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        correctAnswers: { increment: isCorrect ? 1 : 0 },
        stepCorrectCount: newStepCorrect,
        stepTotalCount: newStepTotal,
      },
    });

    // ═══ Gamification: XP for correct answers ═══
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

    // Ensure we're in PRACTICE state (transition from TEACHING if needed)
    if (session.state === "TEACHING") {
      await transitionState(sessionId, "PRACTICE", "SUBMIT_ANSWER", {
        isCorrect,
      });
    }

    const promptParams = buildPromptParams(student, node, updatedMastery);

    // ═══ Fetch previous questions to avoid repeats ═══
    let prevQuestions: string | undefined;
    try {
      const prevResponses = await prisma.questionResponse.findMany({
        where: { sessionId, nodeId: node.id },
        select: { questionText: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (prevResponses.length > 0) {
        prevQuestions = prevResponses
          .map((r) => r.questionText)
          .filter(Boolean)
          .join("\n- ");
      }
    } catch (e) {
      console.error("Previous questions query error (non-critical):", e);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: CHECK UNDERSTANDING (1 question)
    // Correct or wrong → always advance to Step 3 (guided practice)
    // ═══════════════════════════════════════════════════════════
    if (currentStep === 2) {
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: { learningStep: 3, stepCorrectCount: 0, stepTotalCount: 0 },
      });

      startPrefetch(
        sessionId,
        promptParams,
        node.nodeCode,
        node.title,
        "guided_practice",
        prevQuestions
      );

      return NextResponse.json({
        state: "PRACTICE",
        learningStep: 3,
        stepProgress: { correct: 0, total: 0, required: 2, outOf: 3 },
        stepTransition: { from: 2, to: 3, reason: "advance" },
        isCorrect,
        mastery: formatMastery(updatedMastery),
        feedback: {
          message: isCorrect
            ? "You got it! Let's practice more. 💪"
            : "Not quite — let's practice together to get the hang of it!",
          type: isCorrect ? "correct" : "incorrect",
        },
        questionPrefetched: true,
        gamification: gamificationXP,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: GUIDED PRACTICE (need 2/3 correct, remediation on wrong)
    // ═══════════════════════════════════════════════════════════
    if (currentStep === 3) {
      // Generate remediation for wrong answers
      let remediation = null;
      if (!isCorrect && questionText && selectedAnswerText && correctAnswerText) {
        try {
          const remPrompt = stepPrompt.buildRemediationPrompt(
            promptParams,
            questionText,
            selectedAnswerText,
            correctAnswerText,
            explanation ?? ""
          );
          const remResponse = await callClaude(remPrompt);
          if (remResponse) {
            remediation = stepPrompt.parseRemediationResponse(remResponse);
          }
        } catch (e) {
          console.error("Remediation generation error:", e);
        }
        if (!remediation) {
          remediation = {
            whatWentWrong:
              "That's not quite right, but you're learning!",
            reExplanation:
              "Let me explain this differently...",
            newExample:
              "Here's another way to think about it.",
          };
        }
      }

      // Check if step is complete (3 questions answered)
      if (newStepTotal >= 3) {
        if (newStepCorrect >= 2) {
          // PASSED Step 3 → advance to Step 4
          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 4,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "independent_practice",
            prevQuestions
          );

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 4,
            stepProgress: { correct: 0, total: 0, required: 4, outOf: 5 },
            stepTransition: { from: 3, to: 4, reason: "passed" },
            isCorrect,
            mastery: formatMastery(updatedMastery),
            feedback: {
              message: isCorrect
                ? "Excellent! Ready for harder problems! 🚀"
                : "Good effort! Time to level up!",
              type: isCorrect ? "correct" : "step_advance",
            },
            remediation,
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        } else {
          // FAILED Step 3 → back to Step 2
          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 2,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "check_understanding",
            prevQuestions
          );

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 2,
            stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
            stepTransition: { from: 3, to: 2, reason: "failed" },
            isCorrect,
            mastery: formatMastery(updatedMastery),
            feedback: {
              message:
                "Let's review and try again — you've got this! 💪",
              type: "retry",
            },
            remediation,
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        }
      }

      // Step 3 not complete yet — continue with next question
      startPrefetch(
        sessionId,
        promptParams,
        node.nodeCode,
        node.title,
        "guided_practice",
        prevQuestions
      );

      return NextResponse.json({
        state: "PRACTICE",
        learningStep: 3,
        stepProgress: {
          correct: newStepCorrect,
          total: newStepTotal,
          required: 2,
          outOf: 3,
        },
        isCorrect,
        mastery: formatMastery(updatedMastery),
        feedback: {
          message: isCorrect
            ? "Great job! Keep going!"
            : "That's okay — let's learn from this!",
          type: isCorrect ? "correct" : "incorrect",
        },
        remediation,
        questionPrefetched: true,
        gamification: gamificationXP,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: INDEPENDENT PRACTICE (need 4/5 correct, no hints)
    // ═══════════════════════════════════════════════════════════
    if (currentStep === 4) {
      // Check if step is complete (5 questions answered)
      if (newStepTotal >= 5) {
        if (newStepCorrect >= 4) {
          // PASSED Step 4 → advance to Step 5
          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 5,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "mastery_proof",
            prevQuestions
          );

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 5,
            stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
            stepTransition: { from: 4, to: 5, reason: "passed" },
            isCorrect,
            mastery: formatMastery(updatedMastery),
            feedback: {
              message: isCorrect
                ? "Amazing! One final challenge... 🏆"
                : "Good progress! Time for the final test!",
              type: isCorrect ? "correct" : "step_advance",
            },
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        } else {
          // FAILED Step 4 → back to Step 2
          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 2,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "check_understanding",
            prevQuestions
          );

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 2,
            stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
            stepTransition: { from: 4, to: 2, reason: "failed" },
            isCorrect,
            mastery: formatMastery(updatedMastery),
            feedback: {
              message:
                "Let's go back and strengthen our understanding! 📚",
              type: "retry",
            },
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        }
      }

      // Step 4 not complete yet — continue
      startPrefetch(
        sessionId,
        promptParams,
        node.nodeCode,
        node.title,
        "independent_practice",
        prevQuestions
      );

      return NextResponse.json({
        state: "PRACTICE",
        learningStep: 4,
        stepProgress: {
          correct: newStepCorrect,
          total: newStepTotal,
          required: 4,
          outOf: 5,
        },
        isCorrect,
        mastery: formatMastery(updatedMastery),
        feedback: {
          message: isCorrect
            ? "Correct! Keep it up!"
            : "Not quite — stay focused!",
          type: isCorrect ? "correct" : "incorrect",
        },
        questionPrefetched: true,
        gamification: gamificationXP,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: MASTERY PROOF (1 question, transfer) + TRUE MASTERY GATE
    // ═══════════════════════════════════════════════════════════
    if (currentStep === 5) {
      if (isCorrect) {
        // ═══ Run True Mastery Gate ═══
        let masteryGate = null;
        try {
          masteryGate = await evaluateTrueMastery(session.studentId, node.id);
        } catch (e) {
          console.error("Mastery gate evaluation error:", e);
        }

        // Check mastery gate recommendation
        if (masteryGate && masteryGate.recommendation === "fluency_drill") {
          // Accuracy+retention pass but speed fails → fluency drill mode
          await prisma.masteryScore.update({
            where: {
              studentId_nodeId: {
                studentId: session.studentId,
                nodeId: node.id,
              },
            },
            data: { fluencyDrillMode: true, consecutiveCorrect: 0 },
          });

          await prisma.learningSession.update({
            where: { id: sessionId },
            data: { mode: "fluency" },
          });

          return NextResponse.json({
            state: "FLUENCY_DRILL",
            learningStep: 5,
            isCorrect: true,
            mastery: formatMastery(updatedMastery),
            nexusScore: nexusBreakdown,
            masteryGate: {
              accuracy: masteryGate.accuracy,
              speed: masteryGate.speed,
              retention: masteryGate.retention,
              consistency: masteryGate.consistency,
            },
            feedback: {
              message:
                "You know this well! Let's build speed — Fluency Drill time! 🏎️",
              type: "fluency_drill",
            },
            gamification: gamificationXP,
          });
        }

        if (masteryGate && masteryGate.recommendation === "retention_review") {
          // Accuracy passes but retention fails → schedule review
          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "check_understanding",
            prevQuestions
          );

          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 2,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 2,
            stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
            stepTransition: { from: 5, to: 2, reason: "retention_review" },
            isCorrect: true,
            mastery: formatMastery(updatedMastery),
            nexusScore: nexusBreakdown,
            feedback: {
              message:
                "Great accuracy! But let's make sure this sticks — more practice! 🧠",
              type: "retention_review",
            },
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        }

        // Catch-all: if mastery gate returned null (error), "practice", or any non-advance recommendation
        if (!masteryGate || masteryGate.recommendation !== "advance") {
          startPrefetch(
            sessionId,
            promptParams,
            node.nodeCode,
            node.title,
            "check_understanding",
            prevQuestions
          );

          await prisma.learningSession.update({
            where: { id: sessionId },
            data: {
              learningStep: 2,
              stepCorrectCount: 0,
              stepTotalCount: 0,
            },
          });

          return NextResponse.json({
            state: "PRACTICE",
            learningStep: 2,
            stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
            stepTransition: { from: 5, to: 2, reason: "more_practice" },
            isCorrect: true,
            mastery: formatMastery(updatedMastery),
            nexusScore: nexusBreakdown,
            feedback: {
              message:
                "Good answer! Let's keep building mastery — practice makes permanent! 💪",
              type: "more_practice",
            },
            questionPrefetched: true,
            gamification: gamificationXP,
          });
        }

        // ═══ TRUE MASTERY ACHIEVED! 🎉 (gate explicitly passed with "advance") ═══
        const result = await transitionState(
          sessionId,
          "CELEBRATING",
          "MASTERY_ACHIEVED",
          {
            nodeCode: node.nodeCode,
            bktProbability: updatedMastery.bktProbability,
          }
        );

        // Mark as truly mastered
        try {
          await prisma.masteryScore.update({
            where: {
              studentId_nodeId: {
                studentId: session.studentId,
                nodeId: node.id,
              },
            },
            data: { trulyMastered: true, fluencyDrillMode: false },
          });
        } catch {
          // Non-critical
        }

        // Gamification: Node mastered
        let masteryGamification = null;
        try {
          masteryGamification = await processNodeMastered(
            session.studentId,
            node.nodeCode,
            node.title
          );
        } catch (e) {
          console.error("Gamification mastery error:", e);
        }

        // Get next node
        let nextNode = null;
        try {
          nextNode = await recommendNextNode(
            session.studentId,
            node.nodeCode
          );
        } catch (e) {
          console.error("Next node error:", e);
        }

        // Generate celebration
        const prompt = celebratingPrompt.buildPrompt({
          ...promptParams,
          nextNodeTitle: nextNode?.title,
        });
        const claudeResponse = await callClaude(prompt);
        const celebration = claudeResponse
          ? celebratingPrompt.parseResponse(claudeResponse)
          : {
              celebration: `Amazing! You've mastered ${node.title}!`,
              funFact: "Learning is an adventure!",
              nextTeaser: nextNode
                ? `Up next: ${nextNode.title}!`
                : "You've completed this learning path!",
            };

        return NextResponse.json({
          state: result.newState,
          recommendedAction: result.recommendedAction,
          learningStep: 5,
          isCorrect: true,
          mastery: formatMastery(updatedMastery),
          nexusScore: nexusBreakdown,
          celebration,
          nextNode,
          gamification: masteryGamification ?? gamificationXP,
        });
      } else {
        // FAILED mastery proof → back to Step 2
        await prisma.learningSession.update({
          where: { id: sessionId },
          data: {
            learningStep: 2,
            stepCorrectCount: 0,
            stepTotalCount: 0,
          },
        });

        startPrefetch(
          sessionId,
          promptParams,
          node.nodeCode,
          node.title,
          "check_understanding",
          prevQuestions
        );

        return NextResponse.json({
          state: "PRACTICE",
          learningStep: 2,
          stepProgress: { correct: 0, total: 0, required: 1, outOf: 1 },
          stepTransition: { from: 5, to: 2, reason: "failed" },
          isCorrect: false,
          mastery: formatMastery(updatedMastery),
          nexusScore: nexusBreakdown,
          feedback: {
            message:
              "Almost there! Let's review and try again. 🔄",
            type: "retry",
          },
          questionPrefetched: true,
          gamification: gamificationXP,
        });
      }
    }

    // ═══ Fallback (step 1 or unknown — shouldn't normally reach here) ═══
    return NextResponse.json({
      state: "PRACTICE",
      learningStep: currentStep,
      isCorrect,
      mastery: formatMastery(updatedMastery),
      feedback: {
        message: "Let's keep going!",
        type: isCorrect ? "correct" : "incorrect",
      },
    });
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

// ─── Helpers ───

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
