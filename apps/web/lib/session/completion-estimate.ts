/**
 * Phase 11: Completion transparency — estimate questions remaining.
 *
 * Simulates BKT forward with the student's recent accuracy to predict
 * how many more questions until mastery (85%).
 *
 * Cap display at 15 even if calculation goes higher — never show a scary
 * large number. Update this estimate live after every single answer.
 */

// BKT parameters (must match bkt-engine.ts)
const P_LEARN = 0.20;
const P_SLIP = 0.10;
const P_GUESS = 0.20;
const THRESHOLD = 0.85;

/**
 * Simulate a single BKT update step.
 */
function simulateBKTStep(mastery: number, isCorrect: boolean): number {
  const pCorrectIfKnown = 1 - P_SLIP;
  const pCorrectIfUnknown = P_GUESS;

  if (isCorrect) {
    const pKnown = (mastery * pCorrectIfKnown) /
      (mastery * pCorrectIfKnown + (1 - mastery) * pCorrectIfUnknown);
    return pKnown + (1 - pKnown) * P_LEARN;
  } else {
    const pKnown = (mastery * P_SLIP) /
      (mastery * P_SLIP + (1 - mastery) * (1 - P_GUESS));
    return pKnown + (1 - pKnown) * P_LEARN;
  }
}

export interface CompletionEstimate {
  /** Most likely questions remaining */
  likely: number;
  /** Minimum estimate (optimistic) */
  min: number;
  /** Maximum estimate (conservative) */
  max: number;
  /** Estimated time in minutes (questions × 45 seconds) */
  estimatedMinutes: number;
  /** Per-step estimates */
  stepEstimates: StepEstimate[];
  /** Contextual motivational message */
  message: string;
}

interface StepEstimate {
  step: number;
  name: string;
  status: "completed" | "current" | "upcoming";
  questionsEstimate: number;
}

const STEP_NAMES = ["Learn", "Check", "Guided", "Practice", "Prove"];

/**
 * Phase 11: Estimate questions remaining based on current mastery and accuracy.
 *
 * @param currentMastery - Current BKT probability (0-100 scale)
 * @param recentAccuracy - Proportion of recent correct answers (0-1)
 * @param currentStep - Current learning step (1-5)
 * @param stepProgress - Current step's progress { correct, total, required, outOf }
 */
export function estimateQuestionsRemaining(
  currentMastery: number,
  recentAccuracy: number,
  currentStep: number,
  stepProgress?: { correct: number; total: number; required: number; outOf: number },
): CompletionEstimate {
  const masteryDecimal = currentMastery / 100; // Convert to 0-1 scale
  const accuracy = Math.max(0.3, Math.min(0.95, recentAccuracy)); // Clamp accuracy

  // ─── Forward simulation ───
  let mastery = masteryDecimal;
  let questionsNeeded = 0;

  while (mastery < THRESHOLD && questionsNeeded < 20) {
    // Probabilistic simulation: use accuracy as expected correct rate
    const isCorrect = Math.random() < accuracy;
    mastery = simulateBKTStep(mastery, isCorrect);
    mastery = Math.max(0.05, mastery); // Floor
    questionsNeeded++;
  }

  // Run simulation multiple times and average for stability
  let totalNeeded = questionsNeeded;
  for (let run = 0; run < 4; run++) {
    mastery = masteryDecimal;
    let count = 0;
    while (mastery < THRESHOLD && count < 20) {
      const isCorrect = Math.random() < accuracy;
      mastery = simulateBKTStep(mastery, isCorrect);
      mastery = Math.max(0.05, mastery);
      count++;
    }
    totalNeeded += count;
  }
  const avgNeeded = Math.round(totalNeeded / 5);

  const likely = Math.min(avgNeeded, 15);
  const min = Math.max(1, likely - 2);
  const max = Math.min(likely + 3, 15);

  // ─── Per-step estimates ───
  const stepEstimates: StepEstimate[] = STEP_NAMES.map((name, i) => {
    const step = i + 1;
    let status: "completed" | "current" | "upcoming";
    let questionsEstimate = 0;

    if (step < currentStep) {
      status = "completed";
    } else if (step === currentStep) {
      status = "current";
      // Estimate remaining in current step
      if (stepProgress) {
        const remaining = stepProgress.outOf - stepProgress.total;
        questionsEstimate = Math.max(0, remaining);
      } else {
        questionsEstimate = step === 2 ? 1 : step === 3 ? 3 : step === 4 ? 5 : step === 5 ? 1 : 0;
      }
    } else {
      status = "upcoming";
      // Estimated total for future steps
      questionsEstimate = step === 2 ? 1 : step === 3 ? 3 : step === 4 ? 5 : step === 5 ? 2 : 0;
    }

    return { step, name, status, questionsEstimate };
  });

  // Time estimate: questions × 45 seconds, rounded to nearest minute
  const estimatedMinutes = Math.max(1, Math.round((likely * 45) / 60));

  // ─── Contextual message ───
  const message = getContextualMessage(currentMastery);

  return { likely, min, max, estimatedMinutes, stepEstimates, message };
}

/**
 * Phase 11: Dynamic messaging based on mastery progress.
 * Replaces static "85% to master" text.
 */
function getContextualMessage(mastery: number): string {
  if (mastery <= 20) return "Just getting started! 🌱";
  if (mastery <= 40) return "Building momentum! Keep going 💪";
  if (mastery <= 60) return "Halfway there! You've got this 🔥";
  if (mastery <= 75) return "Almost there! ~3-4 more questions";
  if (mastery <= 84) return "So close! Just a couple more! ⚡";
  return "🎉 Mastery reached! Finishing up...";
}

/**
 * Phase 11: Get after-answer feedback message.
 * Correct answers: motivating decrease message
 * Wrong answers: reassurance (don't show count going up)
 */
export function getAnswerFeedbackMessage(isCorrect: boolean): string | null {
  if (isCorrect) return null; // No special message — sidebar shows count going down naturally
  // Wrong answer: reassurance, NOT the count going up
  const messages = [
    "No worries — keep going! 💙",
    "Mistakes help you learn! 💪",
    "Getting closer with every try! 🌟",
    "That's okay — you've got this! 💫",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
