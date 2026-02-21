/**
 * Gamification System — Phase 7
 *
 * Re-exports all gamification modules for clean imports.
 */

// ─── XP + Level System ───
export {
  getLevelForXP,
  getXPProgress,
  wouldLevelUp,
  awardXP,
  getLevelTitle,
  getXPForLevel,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  type LevelInfo,
  type XPAward,
  type XPSource,
  type LevelThreshold,
} from "./xp";

// ─── Event Bus ───
export {
  GamificationEventBus,
  getEventBus,
  resetEventBus,
  createEvent,
  type GamificationEventType,
  type GamificationEvent,
  type EventHandler,
} from "./event-bus";

// ─── Streak System ───
export {
  updateDailyStreak,
  updateConceptStreak,
  isPerfectSession,
  isSpeedSession,
  isComeback,
  checkMilestone,
  getNextMilestone,
  getReachedMilestones,
  getFreezesEarned,
  applyStreakFreeze,
  addFreezes,
  getStreakMessage,
  getStreakIntensity,
  getStreakProgress,
  createDefaultStreak,
  getToday,
  getDaysAgo,
  daysBetween,
  STREAK_MILESTONES,
  FREEZE_REWARDS,
  MAX_FREEZES,
  type StreakType,
  type StreakStatus,
  type StreakMilestone,
  type StreakUpdateResult,
} from "./streak";

// ─── Badge System ───
export {
  getBadgeById,
  getBadgesByCategory,
  getBadgesByRarity,
  checkMasteryBadges,
  checkSessionBadges,
  checkBossBadges,
  checkTimeOfDayBadge,
  checkStreakBadge,
  getRarityColor,
  getRarityBg,
  getRarityBorder,
  sortByRarity,
  getBadgeProgress,
  BADGE_DEFINITIONS,
  type BadgeCategory,
  type BadgeRarity,
  type BadgeDefinition,
  type EarnedBadge,
  type BadgeCheckResult,
} from "./badges";

// ─── Boss Challenge System ───
export {
  checkBossUnlock,
  selectBossCharacter,
  selectChallengeType,
  adjustDifficulty,
  createBossChallenge,
  startBossChallenge,
  recordBossAnswer,
  isBossTimedOut,
  isBossComplete,
  completeBossChallenge,
  getBossTaunt,
  getBossEncouragement,
  getBossOutcomeMessage,
  getChallengeTypeLabel,
  getChallengeTypeIcon,
  getDifficultyLabel,
  formatTimeRemaining,
  getTimeRemaining,
  BOSS_CHARACTERS,
  CHALLENGE_CONFIGS,
  type BossChallengeType as BossChallengeTypeAlias,
  type BossChallengeStatus as BossChallengeStatusAlias,
  type BossCharacter,
  type BossChallengeConfig,
  type BossChallengeState,
  type BossChallengeResult,
} from "./boss-challenge";
