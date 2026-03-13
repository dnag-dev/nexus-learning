/**
 * Completion estimate — BKT forward simulation for mobile.
 * Ported from apps/web/lib/session/completion-estimate.ts
 *
 * Estimates how many more questions until mastery (85%).
 * Runs multiple Monte Carlo simulations for stability.
 */

// BKT parameters (must match web bkt-engine.ts)
const P_LEARN = 0.20;
const P_SLIP = 0.10;
const P_GUESS = 0.20;
const THRESHOLD = 0.85;

function simulateBKTStep(mastery: number, isCorrect: boolean): number {
  const pCorrectIfKnown = 1 - P_SLIP;
  const pCorrectIfUnknown = P_GUESS;

  if (isCorrect) {
    const pKnown =
      (mastery * pCorrectIfKnown) /
      (mastery * pCorrectIfKnown + (1 - mastery) * pCorrectIfUnknown);
    return pKnown + (1 - pKnown) * P_LEARN;
  } else {
    const pKnown =
      (mastery * P_SLIP) /
      (mastery * P_SLIP + (1 - mastery) * (1 - P_GUESS));
    return pKnown + (1 - pKnown) * P_LEARN;
  }
}

export interface CompletionEstimate {
  /** Most likely questions remaining (capped at 15) */
  likely: number;
  /** Estimated time in minutes */
  estimatedMinutes: number;
  /** Contextual motivational message */
  message: string;
}

/**
 * Estimate questions remaining until mastery.
 *
 * @param currentMastery - Current BKT probability (0-100 scale)
 * @param recentAccuracy - Proportion of recent correct answers (0-1), defaults to 0.6
 */
export function estimateQuestionsRemaining(
  currentMastery: number,
  recentAccuracy: number = 0.6
): CompletionEstimate {
  if (currentMastery >= 85) {
    return { likely: 0, estimatedMinutes: 0, message: "Mastery reached! 🎉" };
  }

  const masteryDecimal = currentMastery / 100;
  const accuracy = Math.max(0.3, Math.min(0.95, recentAccuracy));

  // Run 5 Monte Carlo simulations and average
  let totalNeeded = 0;
  for (let run = 0; run < 5; run++) {
    let mastery = masteryDecimal;
    let count = 0;
    while (mastery < THRESHOLD && count < 20) {
      const isCorrect = Math.random() < accuracy;
      mastery = simulateBKTStep(mastery, isCorrect);
      mastery = Math.max(0.05, mastery);
      count++;
    }
    totalNeeded += count;
  }

  const likely = Math.min(Math.round(totalNeeded / 5), 15);
  const estimatedMinutes = Math.max(1, Math.round((likely * 45) / 60));
  const message = getContextualMessage(currentMastery);

  return { likely, estimatedMinutes, message };
}

function getContextualMessage(mastery: number): string {
  if (mastery <= 20) return "Just getting started! 🌱";
  if (mastery <= 40) return "Building momentum! 💪";
  if (mastery <= 60) return "Halfway there! 🔥";
  if (mastery <= 75) return "Almost there! Keep going ⚡";
  if (mastery <= 84) return "So close! Just a couple more! ✨";
  return "Mastery reached! 🎉";
}
