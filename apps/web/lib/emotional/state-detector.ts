/**
 * Emotional State Detector — Phase 6: Emotional Intelligence Layer
 *
 * Analyzes behavioral signal snapshots and classifies the student's
 * emotional state. Uses weighted heuristic rules (not ML) for v1.0.
 *
 * Detected states:
 *  - ENGAGED:      Normal productive learning flow
 *  - FRUSTRATED:   Struggling, multiple failed attempts, slow response
 *  - BORED:        Very fast responses, low engagement, easy accuracy
 *  - CONFUSED:     Answer changes, hints, medium response time
 *  - EXCITED:      Fast correct answers, breakthrough moment
 *  - ANXIOUS:      Long pauses, slow but correct, hesitant
 *  - BREAKTHROUGH: Sudden improvement after struggling
 *  - NEUTRAL:      Not enough data or ambiguous signals
 */

import type { SignalSnapshot } from "./signal-tracker";

// ─── Types ───

export type EmotionalStateValue =
  | "ENGAGED"
  | "FRUSTRATED"
  | "BORED"
  | "CONFUSED"
  | "EXCITED"
  | "ANXIOUS"
  | "BREAKTHROUGH"
  | "NEUTRAL";

export interface DetectionResult {
  /** Primary detected emotional state */
  state: EmotionalStateValue;
  /** Confidence score 0-1 */
  confidence: number;
  /** Scores for all states (for debugging/dashboard) */
  scores: Record<EmotionalStateValue, number>;
  /** Human-readable explanation of why this state was detected */
  reason: string;
  /** Timestamp of detection */
  detectedAt: Date;
}

// ─── Thresholds ───

/**
 * Configurable thresholds for signal interpretation.
 * These can be tuned based on real usage data.
 */
export const DETECTION_THRESHOLDS = {
  /** Response time thresholds (ms) */
  responseTime: {
    veryFast: 3_000,      // < 3s = very fast
    fast: 8_000,          // < 8s = fast
    normal: 15_000,       // < 15s = normal
    slow: 25_000,         // < 25s = slow
    verySlow: 45_000,     // >= 45s = very slow
  },
  /** Consecutive wrong answers before frustration signal */
  frustrationWrongStreak: 3,
  /** Consecutive correct answers for excitement signal */
  excitementCorrectStreak: 4,
  /** Hint usage rate (0-1) that signals confusion */
  confusionHintRate: 0.5,
  /** Accuracy threshold for boredom (too easy) */
  boredomAccuracy: 0.9,
  /** Pause duration (ms) that signals anxiety or disengagement */
  anxietyPauseMs: 30_000,
  /** Answer changes that signal confusion */
  confusionAnswerChanges: 2,
  /** Minimum questions before detection is meaningful */
  minQuestionsForDetection: 2,
  /** Confidence minimum to report a non-NEUTRAL state */
  minConfidence: 0.3,
} as const;

// ─── State Scoring Functions ───

/**
 * Score how likely the student is FRUSTRATED.
 * Signals: consecutive wrong, slow response, high hint usage, attempts > 1
 */
function scoreFrustrated(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Consecutive incorrect answers (strong signal)
  if (snapshot.consecutiveIncorrect >= DETECTION_THRESHOLDS.frustrationWrongStreak) {
    score += 0.4;
    reasons.push(`${snapshot.consecutiveIncorrect} wrong in a row`);
  } else if (snapshot.consecutiveIncorrect >= 2) {
    score += 0.2;
    reasons.push(`${snapshot.consecutiveIncorrect} consecutive wrong`);
  }

  // Response time getting slower (trending up)
  if (snapshot.responseTimeTrend > 2000) {
    score += 0.15;
    reasons.push("response time increasing");
  }

  // Slow response time
  if (snapshot.avgResponseTimeMs > DETECTION_THRESHOLDS.responseTime.slow) {
    score += 0.15;
    reasons.push("slow response time");
  }

  // High hint usage
  if (snapshot.recentHintRate >= DETECTION_THRESHOLDS.confusionHintRate) {
    score += 0.1;
    reasons.push("heavy hint usage");
  }

  // Multiple attempts per question
  if (snapshot.currentAttemptCount > 2) {
    score += 0.15;
    reasons.push(`${snapshot.currentAttemptCount} attempts on current question`);
  }

  // Low accuracy
  if (snapshot.sessionAccuracy < 0.3 && snapshot.questionsAnswered >= 3) {
    score += 0.1;
    reasons.push("low session accuracy");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely the student is BORED.
 * Signals: very fast responses, high accuracy, no hints, declining engagement
 */
function scoreBored(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Very fast responses with high accuracy (too easy)
  if (
    snapshot.avgResponseTimeMs > 0 &&
    snapshot.avgResponseTimeMs < DETECTION_THRESHOLDS.responseTime.veryFast &&
    snapshot.sessionAccuracy >= DETECTION_THRESHOLDS.boredomAccuracy
  ) {
    score += 0.4;
    reasons.push("very fast correct answers");
  }

  // Getting faster over time (breezing through)
  if (snapshot.responseTimeTrend < -1000 && snapshot.relativeSpeed > 1.3) {
    score += 0.2;
    reasons.push("speed increasing");
  }

  // No hint usage + high accuracy (not challenging)
  if (snapshot.totalHintsUsed === 0 && snapshot.sessionAccuracy >= 0.85 && snapshot.questionsAnswered >= 3) {
    score += 0.2;
    reasons.push("perfect accuracy, no hints needed");
  }

  // Long pauses between questions (disengaged, doing something else)
  if (snapshot.longestRecentPauseMs > DETECTION_THRESHOLDS.anxietyPauseMs) {
    score += 0.15;
    reasons.push("long pauses (disengaged)");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely the student is CONFUSED.
 * Signals: answer changes, hint requests, medium accuracy, medium speed
 */
function scoreConfused(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Frequent answer changes
  if (snapshot.answerChanges >= DETECTION_THRESHOLDS.confusionAnswerChanges) {
    score += 0.3;
    reasons.push(`${snapshot.answerChanges} answer changes`);
  }

  // High hint usage rate
  if (snapshot.recentHintRate >= DETECTION_THRESHOLDS.confusionHintRate) {
    score += 0.25;
    reasons.push("high hint usage");
  }

  // Alternating correct/incorrect pattern
  if (snapshot.questionsAnswered >= 4 && snapshot.sessionAccuracy >= 0.4 && snapshot.sessionAccuracy <= 0.6) {
    score += 0.2;
    reasons.push("alternating correct/incorrect");
  }

  // Medium-slow response time (thinking, not giving up)
  if (
    snapshot.avgResponseTimeMs > DETECTION_THRESHOLDS.responseTime.normal &&
    snapshot.avgResponseTimeMs < DETECTION_THRESHOLDS.responseTime.slow
  ) {
    score += 0.1;
    reasons.push("thinking time suggests uncertainty");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely the student is EXCITED.
 * Signals: fast correct streak, improving speed, high engagement
 */
function scoreExcited(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Long correct streak
  if (snapshot.consecutiveCorrect >= DETECTION_THRESHOLDS.excitementCorrectStreak) {
    score += 0.4;
    reasons.push(`${snapshot.consecutiveCorrect} correct in a row`);
  } else if (snapshot.consecutiveCorrect >= 3) {
    score += 0.2;
    reasons.push("correct streak building");
  }

  // Fast response with good accuracy
  if (
    snapshot.avgResponseTimeMs > 0 &&
    snapshot.avgResponseTimeMs < DETECTION_THRESHOLDS.responseTime.fast &&
    snapshot.sessionAccuracy >= 0.8
  ) {
    score += 0.25;
    reasons.push("fast and accurate");
  }

  // Getting faster (momentum)
  if (snapshot.relativeSpeed > 1.2) {
    score += 0.15;
    reasons.push("speed is increasing");
  }

  // No pauses (staying engaged)
  if (snapshot.longestRecentPauseMs < 5000 && snapshot.questionsAnswered >= 3) {
    score += 0.1;
    reasons.push("high engagement, no pauses");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely the student is ANXIOUS.
 * Signals: long pauses, slow but correct, hesitant behavior
 */
function scoreAnxious(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Long pauses
  if (snapshot.longestRecentPauseMs > DETECTION_THRESHOLDS.anxietyPauseMs) {
    score += 0.3;
    reasons.push("long pauses detected");
  }

  // Very slow responses
  if (snapshot.avgResponseTimeMs > DETECTION_THRESHOLDS.responseTime.verySlow) {
    score += 0.25;
    reasons.push("very slow response time");
  }

  // Answer changes (uncertainty)
  if (snapshot.answerChanges >= 1) {
    score += 0.15;
    reasons.push("changing answers");
  }

  // Moderate accuracy with slow speed (knows some, scared to get wrong)
  if (snapshot.sessionAccuracy >= 0.5 && snapshot.sessionAccuracy <= 0.7 &&
      snapshot.avgResponseTimeMs > DETECTION_THRESHOLDS.responseTime.slow) {
    score += 0.2;
    reasons.push("hesitant but somewhat accurate");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely this is a BREAKTHROUGH moment.
 * Signals: correct answer after struggling, sudden speed improvement
 */
function scoreBreakthrough(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Correct after multiple wrong (the classic aha moment)
  // We check if the last answer was correct and there were recent wrongs
  if (snapshot.consecutiveCorrect === 1 && snapshot.questionsAnswered >= 3) {
    // Check if there were recent struggles
    const recentAccuracy = snapshot.sessionAccuracy;
    if (recentAccuracy < 0.5) {
      score += 0.3;
      reasons.push("correct after struggle");
    }
  }

  // Correct streak starting after low accuracy
  if (snapshot.consecutiveCorrect >= 2 && snapshot.sessionAccuracy < 0.6 && snapshot.questionsAnswered >= 4) {
    score += 0.35;
    reasons.push("emerging correct streak after difficulty");
  }

  // Speed improvement (getting faster suddenly)
  if (snapshot.relativeSpeed > 1.5 && snapshot.consecutiveCorrect >= 2) {
    score += 0.25;
    reasons.push("significant speed improvement with correct answers");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

/**
 * Score how likely the student is simply ENGAGED (normal productive flow).
 * This is the baseline: moderate speed, decent accuracy, no extreme signals.
 */
function scoreEngaged(snapshot: SignalSnapshot): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Normal response time
  if (
    snapshot.avgResponseTimeMs >= DETECTION_THRESHOLDS.responseTime.fast &&
    snapshot.avgResponseTimeMs <= DETECTION_THRESHOLDS.responseTime.normal
  ) {
    score += 0.3;
    reasons.push("normal response time");
  }

  // Moderate accuracy (learning, not perfect, not failing)
  if (snapshot.sessionAccuracy >= 0.5 && snapshot.sessionAccuracy <= 0.85) {
    score += 0.25;
    reasons.push("healthy accuracy range");
  }

  // Some hint usage but not excessive
  if (snapshot.recentHintRate > 0 && snapshot.recentHintRate < 0.5) {
    score += 0.15;
    reasons.push("appropriate hint usage");
  }

  // Stable speed (not trending dramatically)
  if (Math.abs(snapshot.responseTimeTrend) < 1000) {
    score += 0.15;
    reasons.push("consistent pace");
  }

  // No long pauses
  if (snapshot.longestRecentPauseMs < DETECTION_THRESHOLDS.responseTime.normal) {
    score += 0.1;
    reasons.push("staying on task");
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

// ─── Main Detector ───

/**
 * Detect the student's emotional state from a signal snapshot.
 * Returns the highest-scoring state with confidence.
 */
export function detectEmotionalState(snapshot: SignalSnapshot): DetectionResult {
  // Not enough data yet
  if (snapshot.questionsAnswered < DETECTION_THRESHOLDS.minQuestionsForDetection) {
    return {
      state: "NEUTRAL",
      confidence: 0,
      scores: {
        ENGAGED: 0,
        FRUSTRATED: 0,
        BORED: 0,
        CONFUSED: 0,
        EXCITED: 0,
        ANXIOUS: 0,
        BREAKTHROUGH: 0,
        NEUTRAL: 1,
      },
      reason: "Not enough data for detection",
      detectedAt: new Date(),
    };
  }

  // Score all states
  const frustrated = scoreFrustrated(snapshot);
  const bored = scoreBored(snapshot);
  const confused = scoreConfused(snapshot);
  const excited = scoreExcited(snapshot);
  const anxious = scoreAnxious(snapshot);
  const breakthrough = scoreBreakthrough(snapshot);
  const engaged = scoreEngaged(snapshot);

  const scores: Record<EmotionalStateValue, number> = {
    FRUSTRATED: frustrated.score,
    BORED: bored.score,
    CONFUSED: confused.score,
    EXCITED: excited.score,
    ANXIOUS: anxious.score,
    BREAKTHROUGH: breakthrough.score,
    ENGAGED: engaged.score,
    NEUTRAL: 0.1, // Base NEUTRAL score
  };

  // Find the highest scoring state
  let bestState: EmotionalStateValue = "NEUTRAL";
  let bestScore = 0;
  let bestReason = "No strong signals detected";

  const reasonMap: Record<EmotionalStateValue, string> = {
    FRUSTRATED: frustrated.reason,
    BORED: bored.reason,
    CONFUSED: confused.reason,
    EXCITED: excited.reason,
    ANXIOUS: anxious.reason,
    BREAKTHROUGH: breakthrough.reason,
    ENGAGED: engaged.reason,
    NEUTRAL: "No strong signals detected",
  };

  for (const [state, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestState = state as EmotionalStateValue;
      bestReason = reasonMap[state as EmotionalStateValue];
    }
  }

  // If the best score is below minimum confidence, default to NEUTRAL
  if (bestScore < DETECTION_THRESHOLDS.minConfidence) {
    bestState = "NEUTRAL";
    bestReason = "Signals below confidence threshold";
  }

  return {
    state: bestState,
    confidence: Math.round(bestScore * 100) / 100,
    scores,
    reason: bestReason || "No explanation available",
    detectedAt: new Date(),
  };
}

/**
 * Check if the emotional state has changed significantly enough to warrant action.
 * Prevents rapid state changes by requiring a significant confidence difference.
 */
export function shouldTriggerAdaptation(
  previousState: EmotionalStateValue | null,
  newDetection: DetectionResult
): boolean {
  // Always trigger for FRUSTRATED and BREAKTHROUGH (high-priority states)
  if (
    newDetection.state === "FRUSTRATED" &&
    newDetection.confidence >= 0.4
  ) {
    return true;
  }

  if (
    newDetection.state === "BREAKTHROUGH" &&
    newDetection.confidence >= 0.35
  ) {
    return true;
  }

  // Skip if state hasn't changed
  if (previousState === newDetection.state) {
    return false;
  }

  // For other states, require higher confidence
  return newDetection.confidence >= 0.5;
}

/**
 * Get a child-friendly label for each emotional state.
 * Used in the parent dashboard and teacher reports.
 */
export function getEmotionalStateLabel(state: EmotionalStateValue): string {
  switch (state) {
    case "ENGAGED":
      return "Focused & Learning";
    case "FRUSTRATED":
      return "Finding It Challenging";
    case "BORED":
      return "Needs More Challenge";
    case "CONFUSED":
      return "Needs Clarification";
    case "EXCITED":
      return "Energized & Confident";
    case "ANXIOUS":
      return "Taking It Carefully";
    case "BREAKTHROUGH":
      return "Aha! Moment";
    case "NEUTRAL":
      return "Getting Started";
  }
}
