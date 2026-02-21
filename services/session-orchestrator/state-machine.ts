/**
 * Session State Machine
 *
 * Manages the finite state machine for learning sessions.
 * Each session transitions through states based on student actions
 * and learning outcomes.
 *
 * States: IDLE → DIAGNOSTIC → TEACHING → PRACTICE → ...
 *
 * The diagnostic flow is: IDLE → DIAGNOSTIC → COMPLETED
 * The learning flow is: IDLE → TEACHING → PRACTICE → CELEBRATING → ...
 */

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

export interface SessionTransition {
  from: SessionStateValue;
  to: SessionStateValue;
  event: string;
}

/**
 * Valid transitions from each state.
 */
const VALID_TRANSITIONS: Record<SessionStateValue, SessionStateValue[]> = {
  IDLE: ["DIAGNOSTIC", "TEACHING", "REVIEW", "BOSS_CHALLENGE"],
  DIAGNOSTIC: ["DIAGNOSTIC", "COMPLETED"],
  TEACHING: ["PRACTICE", "EMOTIONAL_CHECK", "COMPLETED"],
  PRACTICE: [
    "HINT_REQUESTED",
    "STRUGGLING",
    "CELEBRATING",
    "TEACHING",
    "EMOTIONAL_CHECK",
    "COMPLETED",
  ],
  HINT_REQUESTED: ["PRACTICE", "STRUGGLING", "EMOTIONAL_CHECK"],
  STRUGGLING: ["TEACHING", "EMOTIONAL_CHECK", "COMPLETED"],
  CELEBRATING: ["TEACHING", "PRACTICE", "REVIEW", "COMPLETED"],
  BOSS_CHALLENGE: ["CELEBRATING", "STRUGGLING", "COMPLETED"],
  REVIEW: ["PRACTICE", "CELEBRATING", "COMPLETED"],
  EMOTIONAL_CHECK: ["TEACHING", "PRACTICE", "COMPLETED"],
  COMPLETED: [],
};

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
 * Attempt a state transition. Returns the new state if valid, throws if invalid.
 */
export function transition(
  currentState: SessionStateValue,
  targetState: SessionStateValue,
  event: string
): SessionTransition {
  if (!isValidTransition(currentState, targetState)) {
    throw new Error(
      `Invalid state transition: ${currentState} → ${targetState} (event: ${event})`
    );
  }

  return {
    from: currentState,
    to: targetState,
    event,
  };
}

/**
 * Get the allowed next states from the current state.
 */
export function getAllowedTransitions(
  currentState: SessionStateValue
): SessionStateValue[] {
  return VALID_TRANSITIONS[currentState] ?? [];
}

/**
 * Diagnostic-specific state transitions.
 */
export const DiagnosticEvents = {
  START_DIAGNOSTIC: "START_DIAGNOSTIC",
  ANSWER_QUESTION: "DIAGNOSTIC_ANSWER",
  COMPLETE_DIAGNOSTIC: "DIAGNOSTIC_COMPLETE",
} as const;

/**
 * Get the next state for a diagnostic event.
 */
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
