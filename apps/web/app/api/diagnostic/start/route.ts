/**
 * POST /api/diagnostic/start
 *
 * Starts a diagnostic assessment for a student.
 * Two modes:
 * 1. Standard mode (no goalId): Binary search through all concepts (K-G1 math)
 * 2. Goal-aware mode (goalId provided): Binary search through goal's requiredNodeIds
 *    Only tests concepts in the goal's prerequisite chain
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  createDiagnosticState,
  createGoalDiagnosticState,
  selectNextQuestion,
} from "@/lib/diagnostic/diagnostic-engine";
import { generateDiagnosticQuestion } from "@/lib/diagnostic/question-generator";
import type { DiagnosticState } from "@/lib/diagnostic/types";

// In-memory diagnostic state store (Redis in production)
const diagnosticSessions = new Map<string, DiagnosticState>();

export { diagnosticSessions };

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, goalId } = body as {
      studentId?: string;
      goalId?: string;
    };

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Look up the student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // If goal-aware mode, validate the goal exists
    let goalName: string | undefined;
    if (goalId) {
      const goal = await prisma.learningGoal.findUnique({
        where: { id: goalId },
      });
      if (!goal) {
        return NextResponse.json(
          { error: "Learning goal not found" },
          { status: 404 }
        );
      }
      if (!goal.requiredNodeIds || goal.requiredNodeIds.length === 0) {
        return NextResponse.json(
          { error: "This goal has no required concepts to test" },
          { status: 400 }
        );
      }
      goalName = goal.name;
    }

    // Create a learning session in DIAGNOSTIC state
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        state: "DIAGNOSTIC",
        emotionalStateAtStart: "NEUTRAL",
      },
    });

    // Initialize the diagnostic state — standard or goal-aware
    let diagState: DiagnosticState;

    if (goalId) {
      // Goal-aware mode: binary search through goal's concept space
      diagState = await createGoalDiagnosticState(
        session.id,
        studentId,
        student.gradeLevel,
        goalId
      );
    } else {
      // Standard mode: binary search through default K-G1 concepts
      diagState = createDiagnosticState(
        session.id,
        studentId,
        student.gradeLevel
      );
    }

    diagnosticSessions.set(session.id, diagState);

    // Get the first question
    const nextNode = selectNextQuestion(diagState);
    if (!nextNode) {
      return NextResponse.json(
        { error: "Could not generate first question" },
        { status: 500 }
      );
    }

    // Fetch the node details from DB
    const knowledgeNode = await prisma.knowledgeNode.findUnique({
      where: { nodeCode: nextNode.nodeCode },
    });

    if (!knowledgeNode) {
      return NextResponse.json(
        { error: `Knowledge node ${nextNode.nodeCode} not found` },
        { status: 500 }
      );
    }

    // Calculate student age from ageGroup
    const ageMap: Record<string, number> = {
      EARLY_5_7: 6,
      MID_8_10: 9,
      UPPER_11_12: 11,
    };

    // Generate the first question
    const question = await generateDiagnosticQuestion({
      nodeCode: knowledgeNode.nodeCode,
      nodeTitle: knowledgeNode.title,
      nodeDescription: knowledgeNode.description,
      gradeLevel: knowledgeNode.gradeLevel,
      domain: knowledgeNode.domain,
      difficulty: knowledgeNode.difficulty,
      studentName: student.displayName,
      studentAge: ageMap[student.ageGroup] ?? 7,
      personaId: student.avatarPersonaId,
    });

    return NextResponse.json({
      sessionId: session.id,
      question,
      progress: {
        current: 1,
        total: diagState.totalQuestions,
        percentComplete: 0,
      },
      // Goal-aware mode metadata
      ...(goalId && {
        mode: "goal-aware",
        goalId,
        goalName,
        totalConceptsInGoal: diagState.orderedNodes?.length ?? 0,
      }),
    });
  } catch (err) {
    console.error("Diagnostic start error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start diagnostic",
      },
      { status: 500 }
    );
  }
}
