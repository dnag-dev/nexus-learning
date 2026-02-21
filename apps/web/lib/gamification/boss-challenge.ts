/**
 * Boss Challenge System — Phase 7: Gamification
 *
 * Weekly boss challenges that test mastery across multiple concepts.
 * Unlocked every Sunday, 15-minute timed assessments with
 * themed boss characters and multi-step problems.
 *
 * Boss Types:
 *  - SPEED_ROUND: Fast recall under time pressure
 *  - MULTI_STEP: Chain of related problems
 *  - STORY_PROBLEM: Word-problem-based challenge
 *  - REAL_WORLD: Real-world application scenarios
 */

// ─── Types ───

export type BossChallengeType =
  | "SPEED_ROUND"
  | "MULTI_STEP"
  | "STORY_PROBLEM"
  | "REAL_WORLD";

export type BossChallengeStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED";

export interface BossCharacter {
  name: string;
  title: string;
  emoji: string;
  taunts: string[];
  encouragements: string[];
  defeatMessage: string;
  victoryMessage: string;
}

export interface BossChallengeConfig {
  type: BossChallengeType;
  difficulty: number; // 1-5
  timeLimitSecs: number;
  questionCount: number;
  passingScore: number; // 0-1 (e.g., 0.7 = 70%)
  pointsReward: number;
  xpReward: number;
}

export interface BossChallengeState {
  challengeId: string;
  status: BossChallengeStatus;
  character: BossCharacter;
  config: BossChallengeConfig;
  nodeIds: string[];
  questionsAnswered: number;
  correctAnswers: number;
  startedAt: Date | null;
  timeSpentMs: number;
}

export interface BossChallengeResult {
  passed: boolean;
  score: number; // 0-1
  timeSpentMs: number;
  questionsCorrect: number;
  questionsTotal: number;
  xpEarned: number;
  pointsEarned: number;
  newBadges: string[];
}

// ─── Boss Characters ───

export const BOSS_CHARACTERS: BossCharacter[] = [
  {
    name: "Nebula Rex",
    title: "The Cosmic Dragon",
    emoji: "🐉",
    taunts: [
      "Think you can solve THIS?",
      "My cosmic puzzles are legendary!",
      "Only the bravest explorers dare face me!",
    ],
    encouragements: [
      "Impressive! You're getting closer!",
      "Not bad, young explorer!",
      "You've got some talent!",
    ],
    defeatMessage: "You did it! I am vanquished... until next week! 🐉💫",
    victoryMessage: "Ha! Better luck next time, explorer! Come back stronger! 💪",
  },
  {
    name: "Professor Puzzleton",
    title: "The Riddle Master",
    emoji: "🧙",
    taunts: [
      "My riddles have stumped many!",
      "Can your brain handle this challenge?",
      "Logic is my superpower!",
    ],
    encouragements: [
      "Your logic is strong!",
      "A clever approach indeed!",
      "You're thinking like a true mathematician!",
    ],
    defeatMessage: "Brilliant! You've solved all my riddles! I'll need harder ones! 🧙✨",
    victoryMessage: "My riddles remain unbeaten! Study more and try again! 📚",
  },
  {
    name: "Captain Chronos",
    title: "The Time Keeper",
    emoji: "⏰",
    taunts: [
      "Can you beat the clock?",
      "Time waits for no one!",
      "Every second counts!",
    ],
    encouragements: [
      "Quick thinking!",
      "You're racing against time and winning!",
      "Faster than I expected!",
    ],
    defeatMessage: "You beat the clock! Time bows to your speed! ⏰🏆",
    victoryMessage: "Time's up! Speed comes with practice! ⏰",
  },
  {
    name: "Lady Nova",
    title: "The Star Sorceress",
    emoji: "🌟",
    taunts: [
      "My star magic creates the toughest problems!",
      "The stars say you'll struggle!",
      "Are you ready for stellar challenges?",
    ],
    encouragements: [
      "The stars are aligning for you!",
      "Your constellation grows brighter!",
      "Star power rising!",
    ],
    defeatMessage: "The stars shine for you today! Your constellation grows! 🌟💫",
    victoryMessage: "The stars were not in your favor today. Try again, brave one! ⭐",
  },
  {
    name: "Dr. Decimal",
    title: "The Number Wizard",
    emoji: "🔢",
    taunts: [
      "Numbers dance to MY tune!",
      "Can you decode my numerical puzzles?",
      "Precision is everything!",
    ],
    encouragements: [
      "Precise calculation!",
      "Your number sense is growing!",
      "Decimals can't fool you!",
    ],
    defeatMessage: "Your number mastery is undeniable! Well calculated! 🔢🎉",
    victoryMessage: "Numbers can be tricky! Practice makes perfect! 🔢",
  },
];

// ─── Challenge Configurations ───

export const CHALLENGE_CONFIGS: Record<BossChallengeType, BossChallengeConfig> = {
  SPEED_ROUND: {
    type: "SPEED_ROUND",
    difficulty: 3,
    timeLimitSecs: 600, // 10 minutes
    questionCount: 15,
    passingScore: 0.7,
    pointsReward: 150,
    xpReward: 150,
  },
  MULTI_STEP: {
    type: "MULTI_STEP",
    difficulty: 4,
    timeLimitSecs: 900, // 15 minutes
    questionCount: 8,
    passingScore: 0.75,
    pointsReward: 200,
    xpReward: 200,
  },
  STORY_PROBLEM: {
    type: "STORY_PROBLEM",
    difficulty: 3,
    timeLimitSecs: 900, // 15 minutes
    questionCount: 6,
    passingScore: 0.67,
    pointsReward: 200,
    xpReward: 200,
  },
  REAL_WORLD: {
    type: "REAL_WORLD",
    difficulty: 4,
    timeLimitSecs: 900, // 15 minutes
    questionCount: 5,
    passingScore: 0.6,
    pointsReward: 250,
    xpReward: 250,
  },
};

// ─── Core Functions ───

/**
 * Check if a boss challenge should be unlocked.
 * Available every Sunday, requires minimum 5 concepts mastered.
 */
export function checkBossUnlock(
  dayOfWeek: number, // 0=Sunday
  conceptsMastered: number,
  minConcepts: number = 5,
  hasActiveChallenge: boolean = false
): boolean {
  return (
    dayOfWeek === 0 &&
    conceptsMastered >= minConcepts &&
    !hasActiveChallenge
  );
}

/**
 * Select a random boss character.
 */
export function selectBossCharacter(
  excludeIndex?: number
): BossCharacter {
  const options = excludeIndex !== undefined
    ? BOSS_CHARACTERS.filter((_, i) => i !== excludeIndex)
    : BOSS_CHARACTERS;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Select a boss challenge type based on student's strengths.
 * Picks the type that most challenges the student.
 */
export function selectChallengeType(
  recentAccuracy: number,
  recentSpeed: number, // relative: >1 = fast, <1 = slow
  preferredTypes?: BossChallengeType[]
): BossChallengeType {
  // If student is fast but inaccurate → story problem (needs careful thinking)
  if (recentSpeed > 1.2 && recentAccuracy < 0.8) {
    return "STORY_PROBLEM";
  }

  // If student is slow but accurate → speed round (needs quick recall)
  if (recentSpeed < 0.8 && recentAccuracy > 0.8) {
    return "SPEED_ROUND";
  }

  // If student is doing well → real world (hardest)
  if (recentAccuracy > 0.85 && recentSpeed > 1.0) {
    return "REAL_WORLD";
  }

  // Default → multi-step
  if (preferredTypes && preferredTypes.length > 0) {
    return preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
  }

  return "MULTI_STEP";
}

/**
 * Adjust challenge difficulty based on student level.
 */
export function adjustDifficulty(
  baseConfig: BossChallengeConfig,
  studentLevel: number,
  pastBossWins: number
): BossChallengeConfig {
  // Increase difficulty every 3 wins
  const difficultyBoost = Math.floor(pastBossWins / 3);
  const newDifficulty = Math.min(5, baseConfig.difficulty + difficultyBoost);

  // Adjust time limit based on difficulty
  const timeMultiplier = newDifficulty > 3 ? 0.9 : 1.0;
  const newTimeLimit = Math.round(baseConfig.timeLimitSecs * timeMultiplier);

  // Adjust passing score slightly for higher difficulty
  const scoreBoost = difficultyBoost * 0.05;
  const newPassingScore = Math.min(0.95, baseConfig.passingScore + scoreBoost);

  // Increase rewards
  const rewardMultiplier = 1 + difficultyBoost * 0.2;

  return {
    ...baseConfig,
    difficulty: newDifficulty,
    timeLimitSecs: newTimeLimit,
    passingScore: newPassingScore,
    pointsReward: Math.round(baseConfig.pointsReward * rewardMultiplier),
    xpReward: Math.round(baseConfig.xpReward * rewardMultiplier),
  };
}

/**
 * Create a new boss challenge state.
 */
export function createBossChallenge(
  challengeId: string,
  nodeIds: string[],
  type: BossChallengeType,
  studentLevel: number,
  pastBossWins: number,
  bossIndex?: number
): BossChallengeState {
  const baseConfig = CHALLENGE_CONFIGS[type];
  const config = adjustDifficulty(baseConfig, studentLevel, pastBossWins);
  const character = selectBossCharacter(bossIndex);

  return {
    challengeId,
    status: "AVAILABLE",
    character,
    config,
    nodeIds,
    questionsAnswered: 0,
    correctAnswers: 0,
    startedAt: null,
    timeSpentMs: 0,
  };
}

/**
 * Start an active boss challenge.
 */
export function startBossChallenge(
  state: BossChallengeState
): BossChallengeState {
  return {
    ...state,
    status: "ACTIVE",
    startedAt: new Date(),
    questionsAnswered: 0,
    correctAnswers: 0,
    timeSpentMs: 0,
  };
}

/**
 * Record an answer during a boss challenge.
 */
export function recordBossAnswer(
  state: BossChallengeState,
  isCorrect: boolean
): BossChallengeState {
  return {
    ...state,
    questionsAnswered: state.questionsAnswered + 1,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
  };
}

/**
 * Check if the boss challenge has timed out.
 */
export function isBossTimedOut(state: BossChallengeState): boolean {
  if (!state.startedAt) return false;
  const elapsed = Date.now() - state.startedAt.getTime();
  return elapsed >= state.config.timeLimitSecs * 1000;
}

/**
 * Check if all questions have been answered.
 */
export function isBossComplete(state: BossChallengeState): boolean {
  return state.questionsAnswered >= state.config.questionCount;
}

/**
 * Complete a boss challenge and compute the result.
 */
export function completeBossChallenge(
  state: BossChallengeState
): BossChallengeResult {
  const score =
    state.questionsAnswered > 0
      ? state.correctAnswers / state.questionsAnswered
      : 0;

  const timeSpentMs = state.startedAt
    ? Date.now() - state.startedAt.getTime()
    : 0;

  const passed = score >= state.config.passingScore;

  return {
    passed,
    score,
    timeSpentMs,
    questionsCorrect: state.correctAnswers,
    questionsTotal: state.questionsAnswered,
    xpEarned: passed ? state.config.xpReward : Math.round(state.config.xpReward * 0.25), // Partial XP for trying
    pointsEarned: passed ? state.config.pointsReward : 0,
    newBadges: [], // Filled by badge system
  };
}

/**
 * Get a random taunt from the boss character.
 */
export function getBossTaunt(character: BossCharacter): string {
  return character.taunts[Math.floor(Math.random() * character.taunts.length)];
}

/**
 * Get a random encouragement from the boss character.
 */
export function getBossEncouragement(character: BossCharacter): string {
  return character.encouragements[
    Math.floor(Math.random() * character.encouragements.length)
  ];
}

/**
 * Get the boss's message based on outcome.
 */
export function getBossOutcomeMessage(
  character: BossCharacter,
  passed: boolean
): string {
  return passed ? character.defeatMessage : character.victoryMessage;
}

// ─── Display Helpers ───

/**
 * Get challenge type display label.
 */
export function getChallengeTypeLabel(type: BossChallengeType): string {
  switch (type) {
    case "SPEED_ROUND":
      return "Speed Round";
    case "MULTI_STEP":
      return "Multi-Step Challenge";
    case "STORY_PROBLEM":
      return "Story Problem";
    case "REAL_WORLD":
      return "Real-World Application";
  }
}

/**
 * Get challenge type icon.
 */
export function getChallengeTypeIcon(type: BossChallengeType): string {
  switch (type) {
    case "SPEED_ROUND":
      return "⚡";
    case "MULTI_STEP":
      return "🔗";
    case "STORY_PROBLEM":
      return "📖";
    case "REAL_WORLD":
      return "🌍";
  }
}

/**
 * Get difficulty label.
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 1) return "Easy";
  if (difficulty <= 2) return "Normal";
  if (difficulty <= 3) return "Hard";
  if (difficulty <= 4) return "Expert";
  return "Legendary";
}

/**
 * Format time remaining as "MM:SS".
 */
export function formatTimeRemaining(totalSecs: number): string {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get time remaining for an active challenge in seconds.
 */
export function getTimeRemaining(state: BossChallengeState): number {
  if (!state.startedAt) return state.config.timeLimitSecs;
  const elapsed = Math.floor((Date.now() - state.startedAt.getTime()) / 1000);
  return Math.max(0, state.config.timeLimitSecs - elapsed);
}
