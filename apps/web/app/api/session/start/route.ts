import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { checkReviewsOnSessionStart } from "@/lib/spaced-repetition/scheduler-job";

// Allow up to 30s (Pro plan); on Hobby plan this is capped at 10s
export const maxDuration = 30;

/**
 * Grade levels for each subject.
 * Math uses K-G5; English (ELA) uses G1-G10 (matching seeded ELA nodes).
 */
const MATH_GRADES = ["K", "G1", "G2", "G3", "G4", "G5"];
const ELA_GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, nodeCode, subject: requestedSubject } = body;

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

    // Determine subject — defaults to MATH for backward compatibility
    const subject = requestedSubject === "ENGLISH" ? "ENGLISH" : "MATH";
    const gradeLevels = subject === "ENGLISH" ? ELA_GRADES : MATH_GRADES;

    // ─── Blueprint integration ───
    // If student has blueprint nodes, prioritize those for the selected subject.
    let blueprintNodeCodes: string[] = [];
    if (student.blueprintNodes && student.blueprintNodes.length > 0) {
      blueprintNodeCodes = student.blueprintNodes;
    }

    // Find the node to teach — either specified or recommend one
    let targetNode;
    if (nodeCode) {
      targetNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode },
      });
    } else {
      // ─── Priority 1: Blueprint nodes (unmastered, for this subject) ───
      if (blueprintNodeCodes.length > 0) {
        const blueprintNodes = await prisma.knowledgeNode.findMany({
          where: {
            nodeCode: { in: blueprintNodeCodes },
            subject: subject as any,
          },
          orderBy: { difficulty: "asc" },
        });

        for (const node of blueprintNodes) {
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

      // ─── Priority 2: First unmastered node for the subject ───
      if (!targetNode) {
        const startIdx = gradeLevels.indexOf(student.gradeLevel);
        // If student's grade isn't in this subject's list, start from beginning
        const effectiveStart = startIdx >= 0 ? startIdx : 0;
        const orderedGrades = [
          ...gradeLevels.slice(effectiveStart),
          ...gradeLevels.slice(0, effectiveStart),
        ];

        for (const grade of orderedGrades) {
          if (targetNode) break;

          const gradeNodes = await prisma.knowledgeNode.findMany({
            where: {
              gradeLevel: grade as any,
              subject: subject as any,
            },
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
      }

      // Ultimate fallback: if literally every node in this subject is mastered
      if (!targetNode) {
        const anyNode = await prisma.knowledgeNode.findFirst({
          where: { subject: subject as any },
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

    // Create session in IDLE state, recording the subject
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        state: "IDLE",
        currentNodeId: targetNode.id,
        emotionalStateAtStart: "NEUTRAL",
        subject: subject as any,
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
      subject,
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
