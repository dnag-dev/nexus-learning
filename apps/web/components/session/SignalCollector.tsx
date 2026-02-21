"use client";

/**
 * SignalCollector — Frontend Behavioral Signal Collection
 *
 * Invisible component that monitors user interactions during a session
 * and sends behavioral signals to the server for emotional state detection.
 *
 * Collects:
 *  - Keystroke timing (for typed answers)
 *  - Click timing (for option selection)
 *  - Pause/inactivity detection
 *  - Answer change tracking
 *  - Response time per question
 *
 * Usage:
 *   <SignalCollector
 *     sessionId="abc-123"
 *     questionIndex={currentQuestionIndex}
 *     onEmotionalStateChange={(state) => handleStateChange(state)}
 *   />
 *
 * The component renders nothing visible — it only attaches event listeners.
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Types ───

export interface CollectedSignals {
  responseTimeMs: number;
  keystrokeCount: number;
  avgKeystrokeIntervalMs: number;
  answerChanges: number;
  pauseCount: number;
  longestPauseMs: number;
  hintRequested: boolean;
}

export interface EmotionalFeedback {
  state: string;
  confidence: number;
  reason: string;
  adaptations?: Record<string, unknown>[];
}

interface SignalCollectorProps {
  sessionId: string;
  questionIndex: number;
  /** Callback when the server detects an emotional state change */
  onEmotionalStateChange?: (feedback: EmotionalFeedback) => void;
  /** Callback with raw collected signals (for debugging/dashboard) */
  onSignalsCollected?: (signals: CollectedSignals) => void;
  /** Whether signal collection is enabled */
  enabled?: boolean;
  /** How often to flush signals to server (ms) */
  flushIntervalMs?: number;
}

// ─── Constants ───

const DEFAULT_FLUSH_INTERVAL = 10_000; // 10 seconds
const PAUSE_THRESHOLD_MS = 10_000; // 10 seconds of inactivity = a pause
const INACTIVITY_CHECK_INTERVAL = 5_000; // Check for inactivity every 5s

// ─── Component ───

export default function SignalCollector({
  sessionId,
  questionIndex,
  onEmotionalStateChange,
  onSignalsCollected,
  enabled = true,
  flushIntervalMs = DEFAULT_FLUSH_INTERVAL,
}: SignalCollectorProps) {
  // ─── Refs for tracking ───
  const questionStartRef = useRef<number>(Date.now());
  const keystrokeTimestamps = useRef<number[]>([]);
  const answerChangeCount = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const pausesRef = useRef<number[]>([]);
  const hintRequestedRef = useRef<boolean>(false);
  const previousQuestionIndexRef = useRef<number>(questionIndex);
  const [, setFlushTick] = useState(0); // Force re-render on flush

  // ─── Reset on new question ───
  useEffect(() => {
    if (questionIndex !== previousQuestionIndexRef.current) {
      // Flush signals for previous question before resetting
      flushSignals();

      // Reset for new question
      questionStartRef.current = Date.now();
      keystrokeTimestamps.current = [];
      answerChangeCount.current = 0;
      pausesRef.current = [];
      hintRequestedRef.current = false;
      lastActivityRef.current = Date.now();
      previousQuestionIndexRef.current = questionIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex]);

  // ─── Keystroke Listener ───
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = () => {
      const now = Date.now();
      keystrokeTimestamps.current.push(now);
      lastActivityRef.current = now;
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  // ─── Click/Activity Listener ───
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      const now = Date.now();
      const gap = now - lastActivityRef.current;
      if (gap > PAUSE_THRESHOLD_MS) {
        pausesRef.current.push(gap);
      }
      lastActivityRef.current = now;
    };

    document.addEventListener("click", handleActivity);
    document.addEventListener("touchstart", handleActivity);
    return () => {
      document.removeEventListener("click", handleActivity);
      document.removeEventListener("touchstart", handleActivity);
    };
  }, [enabled]);

  // ─── Inactivity Check ───
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const gap = now - lastActivityRef.current;
      if (gap > PAUSE_THRESHOLD_MS) {
        // Check if this pause isn't already recorded
        const lastPause = pausesRef.current[pausesRef.current.length - 1];
        if (!lastPause || Math.abs(lastPause - gap) > 2000) {
          pausesRef.current.push(gap);
        }
      }
    }, INACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled]);

  // ─── Compute collected signals ───
  const getCollectedSignals = useCallback((): CollectedSignals => {
    const now = Date.now();
    const responseTimeMs = now - questionStartRef.current;

    // Compute average keystroke interval
    const timestamps = keystrokeTimestamps.current;
    let avgKeystrokeIntervalMs = 0;
    if (timestamps.length >= 2) {
      let totalInterval = 0;
      for (let i = 1; i < timestamps.length; i++) {
        totalInterval += timestamps[i] - timestamps[i - 1];
      }
      avgKeystrokeIntervalMs = totalInterval / (timestamps.length - 1);
    }

    const longestPauseMs = pausesRef.current.length > 0
      ? Math.max(...pausesRef.current)
      : 0;

    return {
      responseTimeMs,
      keystrokeCount: timestamps.length,
      avgKeystrokeIntervalMs,
      answerChanges: answerChangeCount.current,
      pauseCount: pausesRef.current.length,
      longestPauseMs,
      hintRequested: hintRequestedRef.current,
    };
  }, []);

  // ─── Flush signals to server ───
  const flushSignals = useCallback(async () => {
    if (!enabled || !sessionId) return;

    const signals = getCollectedSignals();
    onSignalsCollected?.(signals);

    try {
      const res = await fetch("/api/session/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: previousQuestionIndexRef.current,
          signals,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emotionalState && onEmotionalStateChange) {
          onEmotionalStateChange({
            state: data.emotionalState.state,
            confidence: data.emotionalState.confidence,
            reason: data.emotionalState.reason,
            adaptations: data.adaptations,
          });
        }
      }
    } catch {
      // Signal collection is non-critical — silent failure
    }

    setFlushTick((t) => t + 1);
  }, [enabled, sessionId, getCollectedSignals, onSignalsCollected, onEmotionalStateChange]);

  // ─── Periodic flush ───
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(flushSignals, flushIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, flushIntervalMs, flushSignals]);

  // ─── Public methods exposed via window for parent components ───
  useEffect(() => {
    if (!enabled) return;

    // Expose methods on window for imperative usage from session page
    const methods = {
      recordAnswerChange: () => {
        answerChangeCount.current++;
        lastActivityRef.current = Date.now();
      },
      recordHintRequest: () => {
        hintRequestedRef.current = true;
        lastActivityRef.current = Date.now();
      },
      recordAnswer: (correct: boolean) => {
        // Signals are auto-tracked; this just notes the correct/incorrect
        lastActivityRef.current = Date.now();
        // Flush immediately on answer for real-time detection
        flushSignals();
      },
      getSignals: getCollectedSignals,
    };

    (window as unknown as Record<string, unknown>).__signalCollector = methods;

    return () => {
      delete (window as unknown as Record<string, unknown>).__signalCollector;
    };
  }, [enabled, flushSignals, getCollectedSignals]);

  // This component renders nothing
  return null;
}

// ─── Helper hook for parent components ───

/**
 * Hook to interact with the SignalCollector from parent components.
 * Call these methods when the user interacts with the session.
 */
export function useSignalCollector() {
  const recordAnswerChange = useCallback(() => {
    const collector = (window as unknown as Record<string, unknown>).__signalCollector as
      | { recordAnswerChange: () => void }
      | undefined;
    collector?.recordAnswerChange();
  }, []);

  const recordHintRequest = useCallback(() => {
    const collector = (window as unknown as Record<string, unknown>).__signalCollector as
      | { recordHintRequest: () => void }
      | undefined;
    collector?.recordHintRequest();
  }, []);

  const recordAnswer = useCallback((correct: boolean) => {
    const collector = (window as unknown as Record<string, unknown>).__signalCollector as
      | { recordAnswer: (correct: boolean) => void }
      | undefined;
    collector?.recordAnswer(correct);
  }, []);

  return { recordAnswerChange, recordHintRequest, recordAnswer };
}
