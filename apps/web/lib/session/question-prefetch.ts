/**
 * In-memory question prefetch cache — 5-step learning loop aware.
 *
 * When a student submits an answer, the answer API kicks off Claude question
 * generation in the background (with the correct step type) and stores the
 * Promise here. The client then fetches /api/session/next-question which
 * awaits the cached Promise — by that time, the question is usually already
 * generated (overlapping with the feedback display).
 */

import { callClaude } from "@/lib/session/claude-client";
import * as practicePrompt from "@/lib/prompts/practice.prompt";
import * as stepPrompt from "@/lib/prompts/step-question.prompt";
import type { PromptParams, LearningStepType } from "@/lib/prompts/types";

export interface PrefetchedQuestion {
  questionText: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation: string;
}

interface PrefetchEntry {
  promise: Promise<PrefetchedQuestion>;
  createdAt: number;
}

// ═══ Use globalThis to share cache across Next.js route handler invocations ═══
const globalForPrefetch = globalThis as unknown as {
  __questionPrefetchCache?: Map<string, PrefetchEntry>;
  __questionPrefetchCleanupStarted?: boolean;
};

if (!globalForPrefetch.__questionPrefetchCache) {
  globalForPrefetch.__questionPrefetchCache = new Map();
}
const cache = globalForPrefetch.__questionPrefetchCache;

// Auto-cleanup stale entries every 30 seconds (only start once)
const STALE_MS = 60_000;
if (!globalForPrefetch.__questionPrefetchCleanupStarted) {
  globalForPrefetch.__questionPrefetchCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.createdAt > STALE_MS) {
        cache.delete(key);
      }
    }
  }, 30_000);
}

/**
 * Start generating a practice question in the background.
 * Does NOT block — returns immediately.
 *
 * @param stepType - The learning step type (check_understanding, guided_practice, etc.)
 *                   If omitted, falls back to legacy practice prompt.
 */
export function startPrefetch(
  sessionId: string,
  promptParams: PromptParams,
  fallbackNodeCode: string,
  fallbackTitle: string,
  stepType?: LearningStepType
): void {
  console.log(
    `[prefetch] Starting prefetch for session ${sessionId} (step: ${stepType ?? "legacy"}, cache size: ${cache.size})`
  );
  const promise = generateQuestion(
    promptParams,
    fallbackNodeCode,
    fallbackTitle,
    stepType
  );
  cache.set(sessionId, { promise, createdAt: Date.now() });
  console.log(
    `[prefetch] Stored in cache. Keys: [${[...cache.keys()].join(", ")}]`
  );
}

/**
 * Get the prefetched question for a session.
 * If still generating, awaits the Promise (usually only 1-2s remaining).
 * Returns null if no prefetch exists.
 */
export async function getPrefetchedQuestion(
  sessionId: string
): Promise<PrefetchedQuestion | null> {
  console.log(
    `[prefetch] Looking up session ${sessionId} (cache size: ${cache.size}, keys: [${[...cache.keys()].join(", ")}])`
  );
  const entry = cache.get(sessionId);
  if (!entry) {
    console.log(`[prefetch] MISS — no entry found for ${sessionId}`);
    return null;
  }
  console.log(
    `[prefetch] HIT — found entry (age: ${Date.now() - entry.createdAt}ms)`
  );
  cache.delete(sessionId);
  return entry.promise;
}

async function generateQuestion(
  params: PromptParams,
  fallbackNodeCode: string,
  fallbackTitle: string,
  stepType?: LearningStepType
): Promise<PrefetchedQuestion> {
  try {
    let prompt: string;
    if (stepType) {
      prompt = stepPrompt.buildStepPrompt(params, stepType);
    } else {
      prompt = practicePrompt.buildPrompt(params);
    }
    const claudeResponse = await callClaude(prompt);

    if (claudeResponse) {
      return stepType
        ? stepPrompt.parseStepResponse(claudeResponse)
        : practicePrompt.parseResponse(claudeResponse);
    }
  } catch (err) {
    console.warn("Prefetch question generation failed:", err);
  }

  // Fallback
  return {
    questionText: `Practice question for ${fallbackTitle}: What is 5 + 3?`,
    options: [
      { id: "A", text: "7", isCorrect: false },
      { id: "B", text: "8", isCorrect: true },
      { id: "C", text: "9", isCorrect: false },
      { id: "D", text: "6", isCorrect: false },
    ],
    correctAnswer: "B",
    explanation: "5 + 3 = 8",
  };
}
