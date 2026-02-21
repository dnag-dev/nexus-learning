/**
 * Signal Tracker Tests — Behavioral signal collection and computation
 *
 * Tests:
 *  - Recording signals (keystrokes, answers, hints, pauses, answer changes)
 *  - Snapshot computation (averages, trends, streaks, accuracy)
 *  - Edge cases (empty state, single data point, reset)
 *  - Tracker management (get, remove, active IDs)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  SignalTracker,
  getTracker,
  removeTracker,
  getActiveTrackerIds,
  EMPTY_SNAPSHOT,
} from "../lib/emotional/signal-tracker";

describe("SignalTracker", () => {
  let tracker: SignalTracker;

  beforeEach(() => {
    tracker = new SignalTracker();
  });

  // ─── Initial State ───

  describe("initial state", () => {
    it("returns empty snapshot initially", () => {
      const snapshot = tracker.getSnapshot();
      expect(snapshot.avgResponseTimeMs).toBe(0);
      expect(snapshot.responseTimeTrend).toBe(0);
      expect(snapshot.avgKeystrokeIntervalMs).toBe(0);
      expect(snapshot.currentAttemptCount).toBe(0);
      expect(snapshot.totalHintsUsed).toBe(0);
      expect(snapshot.recentHintRate).toBe(0);
      expect(snapshot.consecutiveCorrect).toBe(0);
      expect(snapshot.consecutiveIncorrect).toBe(0);
      expect(snapshot.longestRecentPauseMs).toBe(0);
      expect(snapshot.answerChanges).toBe(0);
      expect(snapshot.sessionAccuracy).toBe(0);
      expect(snapshot.questionsAnswered).toBe(0);
      expect(snapshot.relativeSpeed).toBe(1);
      expect(snapshot.signals).toHaveLength(0);
    });
  });

  // ─── Recording Answers ───

  describe("recordAnswer", () => {
    it("tracks correct answer", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(true);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.questionsAnswered).toBe(1);
      expect(snapshot.sessionAccuracy).toBe(1);
      expect(snapshot.consecutiveCorrect).toBe(1);
      expect(snapshot.consecutiveIncorrect).toBe(0);
    });

    it("tracks incorrect answer", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(false);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.questionsAnswered).toBe(1);
      expect(snapshot.sessionAccuracy).toBe(0);
      expect(snapshot.consecutiveCorrect).toBe(0);
      expect(snapshot.consecutiveIncorrect).toBe(1);
    });

    it("tracks consecutive correct streak", () => {
      for (let i = 0; i < 4; i++) {
        tracker.startQuestion(i);
        tracker.recordAnswer(true);
      }
      const snapshot = tracker.getSnapshot();
      expect(snapshot.consecutiveCorrect).toBe(4);
      expect(snapshot.consecutiveIncorrect).toBe(0);
    });

    it("tracks consecutive incorrect streak", () => {
      for (let i = 0; i < 3; i++) {
        tracker.startQuestion(i);
        tracker.recordAnswer(false);
      }
      const snapshot = tracker.getSnapshot();
      expect(snapshot.consecutiveIncorrect).toBe(3);
      expect(snapshot.consecutiveCorrect).toBe(0);
    });

    it("resets streak on alternating answers", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(true);
      tracker.startQuestion(1);
      tracker.recordAnswer(true);
      tracker.startQuestion(2);
      tracker.recordAnswer(false);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.consecutiveCorrect).toBe(0);
      expect(snapshot.consecutiveIncorrect).toBe(1);
    });

    it("computes accuracy correctly", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(true);
      tracker.startQuestion(1);
      tracker.recordAnswer(true);
      tracker.startQuestion(2);
      tracker.recordAnswer(false);
      tracker.startQuestion(3);
      tracker.recordAnswer(true);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.sessionAccuracy).toBe(0.75);
    });

    it("increments attempt count", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(false); // First attempt
      tracker.recordAnswer(false); // Second attempt
      tracker.recordAnswer(true); // Third attempt
      const snapshot = tracker.getSnapshot();
      expect(snapshot.currentAttemptCount).toBe(3);
    });
  });

  // ─── Keystroke Tracking ───

  describe("recordKeystroke", () => {
    it("records keystroke intervals", () => {
      tracker.startQuestion(0);
      tracker.recordKeystroke(); // First keystroke (no interval yet)
      tracker.recordKeystroke(); // Second keystroke (interval recorded)
      const snapshot = tracker.getSnapshot();
      expect(snapshot.avgKeystrokeIntervalMs).toBeGreaterThanOrEqual(0);
      // At least one keystroke_timing signal should be recorded
      const keystrokeSignals = snapshot.signals.filter(
        (s) => s.type === "keystroke_timing"
      );
      expect(keystrokeSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("does not record interval for first keystroke", () => {
      tracker.startQuestion(0);
      tracker.recordKeystroke();
      const snapshot = tracker.getSnapshot();
      const keystrokeSignals = snapshot.signals.filter(
        (s) => s.type === "keystroke_timing"
      );
      expect(keystrokeSignals).toHaveLength(0);
    });
  });

  // ─── Hint Tracking ───

  describe("recordHintUsed", () => {
    it("tracks hint usage count", () => {
      tracker.startQuestion(0);
      tracker.recordHintUsed();
      const snapshot = tracker.getSnapshot();
      expect(snapshot.totalHintsUsed).toBe(1);
    });

    it("tracks multiple hints", () => {
      tracker.startQuestion(0);
      tracker.recordHintUsed();
      tracker.recordHintUsed();
      tracker.startQuestion(1);
      tracker.recordHintUsed();
      const snapshot = tracker.getSnapshot();
      expect(snapshot.totalHintsUsed).toBe(3);
    });

    it("computes recent hint rate correctly", () => {
      // 3 questions, hints used on 2 of them
      tracker.startQuestion(0);
      tracker.recordHintUsed();
      tracker.recordAnswer(false);

      tracker.startQuestion(1);
      tracker.recordAnswer(true);

      tracker.startQuestion(2);
      tracker.recordHintUsed();
      tracker.recordAnswer(false);

      const snapshot = tracker.getSnapshot();
      // Recent window = 3, hints used on 2 of 3 questions
      expect(snapshot.recentHintRate).toBeCloseTo(2 / 3, 1);
    });
  });

  // ─── Answer Changes ───

  describe("recordAnswerChange", () => {
    it("tracks answer changes", () => {
      tracker.startQuestion(0);
      tracker.recordAnswerChange();
      tracker.recordAnswerChange();
      const snapshot = tracker.getSnapshot();
      expect(snapshot.answerChanges).toBe(2);
    });

    it("resets answer changes for new question", () => {
      tracker.startQuestion(0);
      tracker.recordAnswerChange();
      tracker.recordAnswerChange();
      tracker.startQuestion(1);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.answerChanges).toBe(0);
    });
  });

  // ─── Response Time ───

  describe("response time tracking", () => {
    it("records response time from question start to answer", () => {
      tracker.startQuestion(0);
      // Small delay then answer
      tracker.recordAnswer(true);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.avgResponseTimeMs).toBeGreaterThanOrEqual(0);
      expect(snapshot.questionsAnswered).toBe(1);
    });

    it("computes response time trend", () => {
      // Record 5 answers to get a trend
      for (let i = 0; i < 5; i++) {
        tracker.startQuestion(i);
        tracker.recordAnswer(true);
      }
      const snapshot = tracker.getSnapshot();
      // With near-instant answers, trend should be near 0
      expect(typeof snapshot.responseTimeTrend).toBe("number");
    });
  });

  // ─── Relative Speed ───

  describe("relative speed", () => {
    it("returns 1 with fewer than 2 responses", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(true);
      const snapshot = tracker.getSnapshot();
      expect(snapshot.relativeSpeed).toBe(1);
    });

    it("computes relative speed with multiple responses", () => {
      for (let i = 0; i < 5; i++) {
        tracker.startQuestion(i);
        tracker.recordAnswer(true);
      }
      const snapshot = tracker.getSnapshot();
      expect(snapshot.relativeSpeed).toBeGreaterThan(0);
    });
  });

  // ─── Reset ───

  describe("reset", () => {
    it("clears all tracking data", () => {
      tracker.startQuestion(0);
      tracker.recordAnswer(true);
      tracker.recordHintUsed();
      tracker.recordKeystroke();
      tracker.recordAnswerChange();

      tracker.reset();

      const snapshot = tracker.getSnapshot();
      expect(snapshot.questionsAnswered).toBe(0);
      expect(snapshot.totalHintsUsed).toBe(0);
      expect(snapshot.signals).toHaveLength(0);
      expect(snapshot.answerChanges).toBe(0);
    });
  });

  // ─── Signals Array ───

  describe("signals array", () => {
    it("collects all signal types", () => {
      tracker.startQuestion(0);
      tracker.recordKeystroke();
      tracker.recordKeystroke(); // Generates a keystroke_timing signal
      tracker.recordAnswerChange();
      tracker.recordHintUsed();
      tracker.recordAnswer(true);

      const snapshot = tracker.getSnapshot();
      const types = new Set(snapshot.signals.map((s) => s.type));
      expect(types.has("keystroke_timing")).toBe(true);
      expect(types.has("answer_change")).toBe(true);
      expect(types.has("hint_usage")).toBe(true);
      expect(types.has("response_time")).toBe(true);
      expect(types.has("attempt_count")).toBe(true);
    });

    it("each signal has timestamp and questionIndex", () => {
      tracker.startQuestion(3);
      tracker.recordAnswer(true);

      const snapshot = tracker.getSnapshot();
      for (const signal of snapshot.signals) {
        expect(signal.timestamp).toBeInstanceOf(Date);
        expect(signal.questionIndex).toBe(3);
      }
    });
  });
});

// ─── EMPTY_SNAPSHOT constant ───

describe("EMPTY_SNAPSHOT", () => {
  it("has all zero values", () => {
    expect(EMPTY_SNAPSHOT.avgResponseTimeMs).toBe(0);
    expect(EMPTY_SNAPSHOT.questionsAnswered).toBe(0);
    expect(EMPTY_SNAPSHOT.relativeSpeed).toBe(1);
    expect(EMPTY_SNAPSHOT.signals).toHaveLength(0);
  });
});

// ─── Tracker Management ───

describe("Tracker management", () => {
  it("getTracker creates and returns a tracker", () => {
    const id = "test-session-" + Date.now();
    const t = getTracker(id);
    expect(t).toBeInstanceOf(SignalTracker);
    // Cleanup
    removeTracker(id);
  });

  it("getTracker returns same instance for same session", () => {
    const id = "test-session-reuse-" + Date.now();
    const t1 = getTracker(id);
    const t2 = getTracker(id);
    expect(t1).toBe(t2);
    removeTracker(id);
  });

  it("removeTracker removes the tracker", () => {
    const id = "test-session-remove-" + Date.now();
    getTracker(id);
    expect(getActiveTrackerIds()).toContain(id);
    removeTracker(id);
    expect(getActiveTrackerIds()).not.toContain(id);
  });

  it("getActiveTrackerIds lists all active sessions", () => {
    const id1 = "test-session-a-" + Date.now();
    const id2 = "test-session-b-" + Date.now();
    getTracker(id1);
    getTracker(id2);
    const ids = getActiveTrackerIds();
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
    removeTracker(id1);
    removeTracker(id2);
  });
});
