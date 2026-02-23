import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { checkReviewsOnSessionStart } from "@/lib/spaced-repetition/scheduler-job";

// Allow up to 30s (Pro plan); on Hobby plan this is capped at 10s
export const maxDuration = 30;

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
      // Pick the first unmastered node — starting at the student's grade,
      // then advancing through higher grades when all are mastered.
      const gradeLevels = ["K", "G1", "G2", "G3", "G4", "G5"];
      const startIdx = gradeLevels.indexOf(student.gradeLevel);
      const orderedGrades = [
        ...gradeLevels.slice(startIdx),
        ...gradeLevels.slice(0, startIdx),
      ];

      for (const grade of orderedGrades) {
        if (targetNode) break;

        const gradeNodes = await prisma.knowledgeNode.findMany({
          where: { gradeLevel: grade as any },
          orderBy: { difficulty: "asc" },
        });

        for (const node of gradeNodes) {
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
      }

      // Ultimate fallback: if literally every node is mastered
      if (!targetNode) {
        const anyNode = await prisma.knowledgeNode.findFirst({
          orderBy: { difficulty: "asc" },
        });
        if (anyNode) targetNode = anyNode;
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

    // ═══ SPACED REPETITION: Check for due reviews ═══
    let reviewSuggestion = null;
    try {
      reviewSuggestion = await checkReviewsOnSessionStart(studentId);
    } catch (e) {
      console.error("Review check error (non-critical):", e);
    }

    // Return session metadata immediately — teaching content will stream
    // via /api/session/teach-stream SSE endpoint.
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
      teaching: null, // Streamed separately
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
