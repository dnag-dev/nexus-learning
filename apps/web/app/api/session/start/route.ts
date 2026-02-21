import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { callClaude } from "@/lib/session/claude-client";
import * as teachingPrompt from "@/lib/prompts/teaching.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";
import { checkReviewsOnSessionStart } from "@/lib/spaced-repetition/scheduler-job";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, nodeCode } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Find the node to teach — either specified or recommend one
    let targetNode;
    if (nodeCode) {
      targetNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode },
      });
    } else {
      // Pick the first node without mastery, or lowest mastery
      const allNodes = await prisma.knowledgeNode.findMany({
        where: { gradeLevel: student.gradeLevel },
        orderBy: { difficulty: "asc" },
      });

      for (const node of allNodes) {
        const mastery = await prisma.masteryScore.findUnique({
          where: {
            studentId_nodeId: { studentId, nodeId: node.id },
          },
        });
        if (!mastery || mastery.bktProbability < 0.9) {
          targetNode = node;
          break;
        }
      }

      if (!targetNode && allNodes.length > 0) {
        targetNode = allNodes[0];
      }
    }

    if (!targetNode) {
      return NextResponse.json(
        { error: "No knowledge node found to teach" },
        { status: 404 }
      );
    }

    // Create session in IDLE state
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        state: "IDLE",
        currentNodeId: targetNode.id,
        emotionalStateAtStart: "NEUTRAL",
      },
    });

    // Transition IDLE → TEACHING
    const result = await transitionState(
      session.id,
      "TEACHING",
      "START_SESSION",
      { nodeCode: targetNode.nodeCode }
    );

    // Generate teaching content via Claude
    const promptParams = {
      nodeCode: targetNode.nodeCode,
      nodeTitle: targetNode.title,
      nodeDescription: targetNode.description,
      gradeLevel: targetNode.gradeLevel,
      domain: targetNode.domain,
      difficulty: targetNode.difficulty,
      studentName: student.displayName,
      ageGroup: student.ageGroup as AgeGroupValue,
      personaId: student.avatarPersonaId,
      currentEmotionalState: "NEUTRAL" as EmotionalStateValue,
    };

    const prompt = teachingPrompt.buildPrompt(promptParams);
    const claudeResponse = await callClaude(prompt);
    const teaching = claudeResponse
      ? teachingPrompt.parseResponse(claudeResponse)
      : {
          explanation: `Let's learn about ${targetNode.title}! ${targetNode.description}`,
          checkQuestion: "Are you ready to try some practice questions?",
          checkAnswer: "Yes!",
        };

    // ═══ SPACED REPETITION: Check for due reviews ═══
    let reviewSuggestion = null;
    try {
      reviewSuggestion = await checkReviewsOnSessionStart(studentId);
    } catch (e) {
      console.error("Review check error (non-critical):", e);
    }

    return NextResponse.json({
      sessionId: session.id,
      state: result.newState,
      recommendedAction: result.recommendedAction,
      node: {
        nodeCode: targetNode.nodeCode,
        title: targetNode.title,
        description: targetNode.description,
        gradeLevel: targetNode.gradeLevel,
        domain: targetNode.domain,
        difficulty: targetNode.difficulty,
      },
      teaching,
      persona: {
        id: student.avatarPersonaId,
        studentName: student.displayName,
      },
      reviewSuggestion,
    });
  } catch (err) {
    console.error("Session start error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start session",
      },
      { status: 500 }
    );
  }
}
