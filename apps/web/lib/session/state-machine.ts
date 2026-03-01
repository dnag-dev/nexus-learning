/**
 * Session State Machine — Phase 4
 *
 * Full FSM with all 11 states, DB persistence, event emission,
 * and recommended next actions.
 */

import { prisma } from "@aauti/db";

// ─── Types ───

export type SessionStateValue =
  | "IDLE"
  | "DIAGNOSTIC"
  | "TEACHING"
  | "PRACTICE"
  | "HINT_REQUESTED"
  | "STRUGGLING"
  | "CELEBRATING"
  | "BOSS_CHALLENGE"
  | "REVIEW"
  | "EMOTIONAL_CHECK"
  | "COMPLETED";

export interface SessionEvent {
  type: string;
  from: SessionStateValue;
  to: SessionStateValue;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TransitionResult {
  previousState: SessionStateValue;
  newState: SessionStateValue;
  event: SessionEvent;
  recommendedAction: string;
}

// ─── Valid Transitions ───

const VALID_TRANSITIONS: Record<SessionStateValue, SessionStateValue[]> = {
  IDLE: ["DIAGNOSTIC", "TEACHING"],
  DIAGNOSTIC: ["TEACHING", "COMPLETED"],
  TEACHING: ["PRACTICE", "EMOTIONAL_CHECK", "COMPLETED"],
  PRACTICE: [
    "CELEBRATING",
    "STRUGGLING",
    "HINT_REQUESTED",
    "REVIEW",
    "BOSS_CHALLENGE",
    "TEACHING",
    "COMPLETED",
  ],
  HINT_REQUESTED: ["PRACTICE", "STRUGGLING", "COMPLETED"],
  STRUGGLING: ["EMOTIONAL_CHECK", "TEACHING", "HINT_REQUESTED", "COMPLETED"],
  CELEBRATING: ["PRACTICE", "TEACHING", "BOSS_CHALLENGE", "COMPLETED"],
  BOSS_CHALLENGE: ["CELEBRATING", "STRUGGLING", "TEACHING", "COMPLETED"],
  EMOTIONAL_CHECK: ["TEACHING", "STRUGGLING", "IDLE", "COMPLETED"],
  REVIEW: ["PRACTICE", "TEACHING", "COMPLETED"],
  COMPLETED: ["IDLE"],
};

// ─── Recommended Actions Per State ───

const RECOMMENDED_ACTIONS: Record<SessionStateValue, string> = {
  IDLE: "show_session_menu",
  DIAGNOSTIC: "present_diagnostic_question",
  TEACHING: "present_concept_explanation",
  PRACTICE: "present_practice_problem",
  HINT_REQUESTED: "provide_hint",
  STRUGGLING: "offer_simpler_approach",
  CELEBRATING: "show_mastery_celebration",
  BOSS_CHALLENGE: "present_boss_problem",
  EMOTIONAL_CHECK: "run_emotional_checkin",
  REVIEW: "present_review_problem",
  COMPLETED: "show_session_summary",
};

// ─── Event Queue (in-memory; Redis in production) ───

const eventLog: SessionEvent[] = [];

function emitEvent(event: SessionEvent): void {
  eventLog.push(event);
}

export function getEventLog(): SessionEvent[] {
  return [...eventLog];
}

export function getSessionEvents(sessionId: string): SessionEvent[] {
  return eventLog.filter((e) => e.sessionId === sessionId);
}

// ─── Core Functions ───

/**
 * Validate whether a state transition is allowed.
 */
export function isValidTransition(
  from: SessionStateValue,
  to: SessionStateValue
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the allowed next states from the current state.
 */
export function getAllowedTransitions(
  state: SessionStateValue
): SessionStateValue[] {
  return [...(VALID_TRANSITIONS[state] ?? [])];
}

/**
 * Get the recommended action for a state.
 */
export function getRecommendedAction(state: SessionStateValue): string {
  return RECOMMENDED_ACTIONS[state] ?? "unknown";
}

/**
 * Perform a state transition:
 * 1. Validate the transition is legal
 * 2. Update LearningSession in PostgreSQL
 * 3. Emit an event with metadata
 * 4. Return the new state + recommended action
 */
export async function transitionState(
  sessionId: string,
  targetState: SessionStateValue,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<TransitionResult> {
  // Fetch current session
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const currentState = session.state as SessionStateValue;

  // Validate transition
  if (!isValidTransition(currentState, targetState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${targetState} (event: ${eventType}). ` +
        `Allowed: [${getAllowedTransitions(currentState).join(", ")}]`
    );
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    state: targetState,
  };

  // Set endedAt when completing
  if (targetState === "COMPLETED") {
    updateData.endedAt = new Date();
    const durationMs =
      new Date().getTime() - new Date(session.startedAt).getTime();
    const rawSeconds = Math.round(durationMs / 1000);
    // Cap at 120 minutes (7200s) — anything longer indicates an abandoned session
    updateData.durationSeconds = rawSeconds <= 7200 ? rawSeconds : 0;
  }

  // Update DB
  await prisma.learningSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  // Emit event
  const event: SessionEvent = {
    type: eventType,
    from: currentState,
    to: targetState,
    sessionId,
    timestamp: new Date(),
    metadata,
  };
  emitEvent(event);

  return {
    previousState: currentState,
    newState: targetState,
    event,
    recommendedAction: getRecommendedAction(targetState),
  };
}

/**
 * Transition without DB persistence (for pure logic / testing).
 */
export function transitionPure(
  currentState: SessionStateValue,
  targetState: SessionStateValue,
  eventType: string
): { from: SessionStateValue; to: SessionStateValue; event: string } {
  if (!isValidTransition(currentState, targetState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${targetState} (event: ${eventType})`
    );
  }
  return { from: currentState, to: targetState, event: eventType };
}

// ─── Diagnostic-specific transitions (preserved from Phase 3) ───

export const DiagnosticEvents = {
  START_DIAGNOSTIC: "START_DIAGNOSTIC",
  ANSWER_QUESTION: "DIAGNOSTIC_ANSWER",
  COMPLETE_DIAGNOSTIC: "DIAGNOSTIC_COMPLETE",
} as const;

export function getDiagnosticTransition(
  currentState: SessionStateValue,
  event: string
): SessionStateValue {
  switch (event) {
    case DiagnosticEvents.START_DIAGNOSTIC:
      if (currentState === "IDLE") return "DIAGNOSTIC";
      break;
    case DiagnosticEvents.ANSWER_QUESTION:
      if (currentState === "DIAGNOSTIC") return "DIAGNOSTIC";
      break;
    case DiagnosticEvents.COMPLETE_DIAGNOSTIC:
      if (currentState === "DIAGNOSTIC") return "COMPLETED";
      break;
  }
  throw new Error(
    `Invalid diagnostic transition: ${currentState} + ${event}`
  );
}

// ─── Teaching-specific event helpers ───

export const TeachingEvents = {
  START_SESSION: "START_SESSION",
  PRESENT_CONCEPT: "PRESENT_CONCEPT",
  SUBMIT_ANSWER: "SUBMIT_ANSWER",
  REQUEST_HINT: "REQUEST_HINT",
  RETURN_TO_PRACTICE: "RETURN_TO_PRACTICE",
  MASTERY_ACHIEVED: "MASTERY_ACHIEVED",
  STRUGGLE_DETECTED: "STRUGGLE_DETECTED",
  EMOTIONAL_SIGNAL: "EMOTIONAL_SIGNAL",
  EMOTIONAL_CHECK_DONE: "EMOTIONAL_CHECK_DONE",
  START_REVIEW: "START_REVIEW",
  START_BOSS: "START_BOSS",
  BOSS_PASSED: "BOSS_PASSED",
  BOSS_FAILED: "BOSS_FAILED",
  ADVANCE_NODE: "ADVANCE_NODE",
  END_SESSION: "END_SESSION",
} as const;
