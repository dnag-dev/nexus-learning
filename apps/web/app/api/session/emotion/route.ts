import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { callClaude } from "@/lib/session/claude-client";
import * as emotionalCheckPrompt from "@/lib/prompts/emotional-check.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";

// Emotional states that trigger a check-in
const TRIGGER_STATES = new Set(["FRUSTRATED", "CONFUSED", "BORED"]);
const EMOTIONAL_CHECK_THRESHOLD = 0.7; // confidence threshold

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, detectedState, confidence } = body;

    if (!sessionId || !detectedState) {
      return NextResponse.json(
        { error: "sessionId and detectedState are required" },
        { status: 400 }
      );
    }

    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { student: true, currentNode: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const shouldTriggerCheck =
      TRIGGER_STATES.has(detectedState) &&
      (confidence ?? 0.5) >= EMOTIONAL_CHECK_THRESHOLD;

    // Log the emotional signal
    await prisma.emotionalLog.create({
      data: {
        studentId: session.studentId,
        sessionId,
        detectedState,
        confidence: confidence ?? 0.5,
        triggeredAdaptation: shouldTriggerCheck,
      },
    });

    if (!shouldTriggerCheck) {
      return NextResponse.json({
        state: session.state,
        emotionalSignalLogged: true,
        checkinTriggered: false,
      });
    }

    // Trigger EMOTIONAL_CHECK
    const validFromStates = [
      "TEACHING",
      "PRACTICE",
      "STRUGGLING",
    ];
    if (!validFromStates.includes(session.state)) {
      return NextResponse.json({
        state: session.state,
        emotionalSignalLogged: true,
        checkinTriggered: false,
        reason: "Cannot trigger emotional check from current state",
      });
    }

    // Transition to EMOTIONAL_CHECK
    const targetFrom = session.state === "STRUGGLING" ? "STRUGGLING" : session.state;
    const result = await transitionState(
      sessionId,
      "EMOTIONAL_CHECK",
      "EMOTIONAL_SIGNAL",
      { detectedState, confidence }
    );

    // Generate emotional check-in
    const student = session.student;
    const node = session.currentNode;

    const promptParams = {
      nodeCode: node?.nodeCode ?? "",
      nodeTitle: node?.title ?? "",
      nodeDescription: node?.description ?? "",
      gradeLevel: node?.gradeLevel ?? "K",
      domain: node?.domain ?? "COUNTING",
      difficulty: node?.difficulty ?? 1,
      studentName: student.displayName,
      ageGroup: student.ageGroup as AgeGroupValue,
      personaId: student.avatarPersonaId,
      currentEmotionalState: detectedState as EmotionalStateValue,
    };

    const prompt = emotionalCheckPrompt.buildPrompt(promptParams);
    const claudeResponse = await callClaude(prompt);
    const checkin = claudeResponse
      ? emotionalCheckPrompt.parseResponse(claudeResponse)
      : emotionalCheckPrompt.parseResponse("");

    return NextResponse.json({
      state: result.newState,
      recommendedAction: result.recommendedAction,
      emotionalSignalLogged: true,
      checkinTriggered: true,
      checkin,
    });
  } catch (err) {
    console.error("Session emotion error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to process emotional signal",
      },
      { status: 500 }
    );
  }
}
