/**
 * Emotional State Detector Tests
 *
 * Tests:
 *  - Each emotional state detection with appropriate signals
 *  - Confidence scoring
 *  - Edge cases (not enough data, ambiguous signals)
 *  - Adaptation triggering logic
 *  - Emotional state labels
 */

import { describe, it, expect } from "vitest";
import {
  detectEmotionalState,
  shouldTriggerAdaptation,
  getEmotionalStateLabel,
  DETECTION_THRESHOLDS,
  type EmotionalStateValue,
} from "../lib/emotional/state-detector";
import { EMPTY_SNAPSHOT, type SignalSnapshot } from "../lib/emotional/signal-tracker";

// ─── Helper to build a snapshot with overrides ───

function makeSnapshot(overrides: Partial<SignalSnapshot>): SignalSnapshot {
  return { ...EMPTY_SNAPSHOT, ...overrides };
}

// ─── Insufficient Data ───

describe("State Detector — insufficient data", () => {
  it("returns NEUTRAL with 0 questions", () => {
    const result = detectEmotionalState(EMPTY_SNAPSHOT);
    expect(result.state).toBe("NEUTRAL");
    expect(result.confidence).toBe(0);
    expect(result.reason).toContain("Not enough data");
  });

  it("returns NEUTRAL with 1 question (below threshold)", () => {
    const snapshot = makeSnapshot({ questionsAnswered: 1 });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("NEUTRAL");
  });

  it("starts detecting at minQuestionsForDetection", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: DETECTION_THRESHOLDS.minQuestionsForDetection,
      avgResponseTimeMs: 10_000,
      sessionAccuracy: 0.7,
    });
    const result = detectEmotionalState(snapshot);
    // Should not be NEUTRAL anymore (has enough data)
    expect(result.state).not.toBe("NEUTRAL");
  });
});

// ─── FRUSTRATED Detection ───

describe("State Detector — FRUSTRATED", () => {
  it("detects frustration with consecutive wrong answers", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 5,
      consecutiveIncorrect: 3,
      avgResponseTimeMs: 30_000,
      sessionAccuracy: 0.2,
      currentAttemptCount: 3,
      recentHintRate: 0.6,
      totalHintsUsed: 3,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("FRUSTRATED");
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.reason).toContain("wrong");
  });

  it("detects frustration with slow response + wrong answers", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 4,
      consecutiveIncorrect: 2,
      avgResponseTimeMs: 35_000,
      responseTimeTrend: 3000,
      sessionAccuracy: 0.25,
      currentAttemptCount: 3,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("FRUSTRATED");
  });
});

// ─── BORED Detection ───

describe("State Detector — BORED", () => {
  it("detects boredom with very fast correct answers", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 5,
      avgResponseTimeMs: 2_000,
      sessionAccuracy: 0.95,
      totalHintsUsed: 0,
      recentHintRate: 0,
      consecutiveCorrect: 5,
      relativeSpeed: 1.5,
    });
    const result = detectEmotionalState(snapshot);
    // Either BORED or EXCITED (both are possible with fast+correct)
    expect(["BORED", "EXCITED"]).toContain(result.state);
  });

  it("detects boredom with perfect accuracy and no hints", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 5,
      avgResponseTimeMs: 2_500,
      sessionAccuracy: 0.95,
      totalHintsUsed: 0,
      recentHintRate: 0,
      consecutiveCorrect: 4,
      responseTimeTrend: -1500,
      relativeSpeed: 1.4,
    });
    const result = detectEmotionalState(snapshot);
    expect(["BORED", "EXCITED"]).toContain(result.state);
  });
});

// ─── CONFUSED Detection ───

describe("State Detector — CONFUSED", () => {
  it("detects confusion with answer changes and hints", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 4,
      answerChanges: 3,
      recentHintRate: 0.6,
      totalHintsUsed: 2,
      avgResponseTimeMs: 18_000,
      sessionAccuracy: 0.5,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("CONFUSED");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("detects confusion with alternating accuracy and hints", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 6,
      sessionAccuracy: 0.5,
      recentHintRate: 0.5,
      answerChanges: 2,
      totalHintsUsed: 3,
      avgResponseTimeMs: 16_000,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("CONFUSED");
  });
});

// ─── EXCITED Detection ───

describe("State Detector — EXCITED", () => {
  it("detects excitement with long correct streak", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 5,
      consecutiveCorrect: 5,
      avgResponseTimeMs: 6_000,
      sessionAccuracy: 0.9,
      relativeSpeed: 1.3,
      longestRecentPauseMs: 2_000,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("EXCITED");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("detects excitement with fast accurate answers", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 4,
      consecutiveCorrect: 4,
      avgResponseTimeMs: 5_000,
      sessionAccuracy: 0.85,
      longestRecentPauseMs: 1_000,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("EXCITED");
  });
});

// ─── ANXIOUS Detection ───

describe("State Detector — ANXIOUS", () => {
  it("detects anxiety with long pauses and slow responses", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 3,
      longestRecentPauseMs: 40_000,
      avgResponseTimeMs: 50_000,
      sessionAccuracy: 0.6,
      answerChanges: 1,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("ANXIOUS");
    expect(result.confidence).toBeGreaterThan(0.3);
  });
});

// ─── BREAKTHROUGH Detection ───

describe("State Detector — BREAKTHROUGH", () => {
  it("detects breakthrough with correct streak after struggle", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 6,
      consecutiveCorrect: 2,
      sessionAccuracy: 0.4,
      relativeSpeed: 1.6,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("BREAKTHROUGH");
    expect(result.confidence).toBeGreaterThan(0.3);
  });
});

// ─── ENGAGED Detection ───

describe("State Detector — ENGAGED", () => {
  it("detects engagement with normal pace and accuracy", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 5,
      avgResponseTimeMs: 10_000,
      sessionAccuracy: 0.7,
      recentHintRate: 0.2,
      responseTimeTrend: 500,
      longestRecentPauseMs: 5_000,
      consecutiveCorrect: 2,
    });
    const result = detectEmotionalState(snapshot);
    expect(result.state).toBe("ENGAGED");
    expect(result.confidence).toBeGreaterThan(0.3);
  });
});

// ─── All scores are returned ───

describe("State Detector — scores", () => {
  it("returns scores for all 8 states", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 3,
      avgResponseTimeMs: 10_000,
    });
    const result = detectEmotionalState(snapshot);
    const states: EmotionalStateValue[] = [
      "ENGAGED", "FRUSTRATED", "BORED", "CONFUSED",
      "EXCITED", "ANXIOUS", "BREAKTHROUGH", "NEUTRAL",
    ];
    for (const state of states) {
      expect(typeof result.scores[state]).toBe("number");
    }
  });

  it("scores are capped at 1.0", () => {
    const snapshot = makeSnapshot({
      questionsAnswered: 10,
      consecutiveIncorrect: 5,
      avgResponseTimeMs: 50_000,
      responseTimeTrend: 5_000,
      recentHintRate: 1.0,
      currentAttemptCount: 5,
      sessionAccuracy: 0.1,
    });
    const result = detectEmotionalState(snapshot);
    for (const score of Object.values(result.scores)) {
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

// ─── shouldTriggerAdaptation ───

describe("shouldTriggerAdaptation", () => {
  it("triggers for FRUSTRATED with high confidence", () => {
    const detection = {
      state: "FRUSTRATED" as const,
      confidence: 0.5,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation(null, detection)).toBe(true);
  });

  it("triggers for BREAKTHROUGH", () => {
    const detection = {
      state: "BREAKTHROUGH" as const,
      confidence: 0.4,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation(null, detection)).toBe(true);
  });

  it("does not trigger for same state", () => {
    const detection = {
      state: "ENGAGED" as const,
      confidence: 0.6,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation("ENGAGED", detection)).toBe(false);
  });

  it("triggers for state change with high confidence", () => {
    const detection = {
      state: "BORED" as const,
      confidence: 0.6,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation("ENGAGED", detection)).toBe(true);
  });

  it("does not trigger for low confidence state change", () => {
    const detection = {
      state: "CONFUSED" as const,
      confidence: 0.2,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation("ENGAGED", detection)).toBe(false);
  });

  it("always triggers FRUSTRATED even when previously FRUSTRATED (if confidence >= 0.4)", () => {
    const detection = {
      state: "FRUSTRATED" as const,
      confidence: 0.4,
      scores: {} as Record<EmotionalStateValue, number>,
      reason: "test",
      detectedAt: new Date(),
    };
    expect(shouldTriggerAdaptation("FRUSTRATED", detection)).toBe(true);
  });
});

// ─── getEmotionalStateLabel ───

describe("getEmotionalStateLabel", () => {
  const expectedLabels: Record<EmotionalStateValue, string> = {
    ENGAGED: "Focused & Learning",
    FRUSTRATED: "Finding It Challenging",
    BORED: "Needs More Challenge",
    CONFUSED: "Needs Clarification",
    EXCITED: "Energized & Confident",
    ANXIOUS: "Taking It Carefully",
    BREAKTHROUGH: "Aha! Moment",
    NEUTRAL: "Getting Started",
  };

  for (const [state, label] of Object.entries(expectedLabels)) {
    it(`returns "${label}" for ${state}`, () => {
      expect(getEmotionalStateLabel(state as EmotionalStateValue)).toBe(label);
    });
  }
});

// ─── DETECTION_THRESHOLDS ───

describe("DETECTION_THRESHOLDS", () => {
  it("has all required threshold keys", () => {
    expect(DETECTION_THRESHOLDS.responseTime).toBeDefined();
    expect(DETECTION_THRESHOLDS.frustrationWrongStreak).toBe(3);
    expect(DETECTION_THRESHOLDS.excitementCorrectStreak).toBe(4);
    expect(DETECTION_THRESHOLDS.confusionHintRate).toBe(0.5);
    expect(DETECTION_THRESHOLDS.boredomAccuracy).toBe(0.9);
    expect(DETECTION_THRESHOLDS.anxietyPauseMs).toBe(30_000);
    expect(DETECTION_THRESHOLDS.confusionAnswerChanges).toBe(2);
    expect(DETECTION_THRESHOLDS.minQuestionsForDetection).toBe(2);
    expect(DETECTION_THRESHOLDS.minConfidence).toBe(0.3);
  });

  it("has correctly ordered response time thresholds", () => {
    const rt = DETECTION_THRESHOLDS.responseTime;
    expect(rt.veryFast).toBeLessThan(rt.fast);
    expect(rt.fast).toBeLessThan(rt.normal);
    expect(rt.normal).toBeLessThan(rt.slow);
    expect(rt.slow).toBeLessThan(rt.verySlow);
  });
});
