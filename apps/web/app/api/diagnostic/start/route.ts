import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  createDiagnosticState,
  selectNextQuestion,
} from "@/lib/diagnostic/diagnostic-engine";
import { generateDiagnosticQuestion } from "@/lib/diagnostic/question-generator";
import type { DiagnosticState } from "@/lib/diagnostic/types";

// In-memory diagnostic state store (Redis in production)
const diagnosticSessions = new Map<string, DiagnosticState>();

export { diagnosticSessions };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

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

    // Create a learning session in DIAGNOSTIC state
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        state: "DIAGNOSTIC",
        emotionalStateAtStart: "NEUTRAL",
      },
    });

    // Initialize the diagnostic state
    const diagState = createDiagnosticState(
      session.id,
      studentId,
      student.gradeLevel
    );
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
    });
  } catch (err) {
    console.error("Diagnostic start error:", err);
    return NextResponse.json(
      { error: "Failed to start diagnostic" },
      { status: 500 }
    );
  }
}
