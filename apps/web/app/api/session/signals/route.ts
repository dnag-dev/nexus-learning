/**
 * POST /api/session/signals
 *
 * Receives behavioral signals from the frontend SignalCollector,
 * updates the server-side SignalTracker, runs emotional state detection,
 * and returns any adaptive responses needed.
 *
 * Request body: {
 *   sessionId: string,
 *   questionIndex: number,
 *   signals: {
 *     responseTimeMs: number,
 *     keystrokeCount: number,
 *     avgKeystrokeIntervalMs: number,
 *     answerChanges: number,
 *     pauseCount: number,
 *     longestPauseMs: number,
 *     hintRequested: boolean,
 *   }
 * }
 *
 * Response: {
 *   emotionalState: { state, confidence, reason },
 *   adaptations: Adaptation[],
 *   triggerEmotionalCheck: boolean,
 * }
 */

import { NextResponse } from "next/server";
import { getTracker } from "@/lib/emotional/signal-tracker";
import { detectEmotionalState, shouldTriggerAdaptation } from "@/lib/emotional/state-detector";
import { buildAdaptiveResponse } from "@/lib/emotional/adaptive-response";
import type { EmotionalStateValue } from "@/lib/emotional/state-detector";

// Track the last detected state per session to prevent redundant triggers
const lastDetectedStates = new Map<string, EmotionalStateValue>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, questionIndex, signals } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 }
      );
    }

    // Get or create the tracker for this session
    const tracker = getTracker(sessionId);

    // Ensure the question is started if not already
    tracker.startQuestion(questionIndex ?? 0);

    // Replay the frontend signals into the server-side tracker
    if (signals) {
      // Record keystrokes (simplified: we record the count, not individual timings)
      if (signals.keystrokeCount > 0) {
        for (let i = 0; i < Math.min(signals.keystrokeCount, 10); i++) {
          tracker.recordKeystroke();
        }
      }

      // Record answer changes
      for (let i = 0; i < Math.min(signals.answerChanges ?? 0, 5); i++) {
        tracker.recordAnswerChange();
      }

      // Record hint request
      if (signals.hintRequested) {
        tracker.recordHintUsed();
      }

      // Record pauses
      if (signals.longestPauseMs > 10_000) {
        tracker.recordActivity(); // This will detect and track the pause
      }
    }

    // Get the current signal snapshot
    const snapshot = tracker.getSnapshot();

    // Run emotional state detection
    const detection = detectEmotionalState(snapshot);

    // Check if we should trigger an adaptation
    const previousState = lastDetectedStates.get(sessionId) ?? null;
    const shouldAdapt = shouldTriggerAdaptation(previousState, detection);

    // Update last detected state
    lastDetectedStates.set(sessionId, detection.state);

    // Build adaptive response if needed
    let adaptations = null;
    let triggerEmotionalCheck = false;

    if (shouldAdapt) {
      const response = buildAdaptiveResponse(detection);
      adaptations = response.adaptations;
      triggerEmotionalCheck = response.triggerEmotionalCheck;
    }

    return NextResponse.json({
      emotionalState: {
        state: detection.state,
        confidence: detection.confidence,
        reason: detection.reason,
        scores: detection.scores,
      },
      adaptations,
      triggerEmotionalCheck,
      shouldAdapt,
    });
  } catch (err) {
    console.error("POST /api/session/signals error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
