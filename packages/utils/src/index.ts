/**
 * @aauti/utils — Shared pure utility functions.
 *
 * No database, no React — pure TypeScript functions
 * that can be used in both web and mobile apps.
 */

export { BKT_PARAMS, updateBKT, getMasteryLevel, MASTERY_THRESHOLDS } from "./bkt";
export type { MasteryLevelValue } from "./bkt";

export {
  getMasteryState,
  getMasteryStateInfo,
  getStateInfo,
  aggregateMasteryStates,
  getAllStates,
} from "./mastery-states";
export type { MasteryState, MasteryStateInfo } from "./mastery-states";

export { getAgeTier } from "./grade-helpers";
export type { AgeTier } from "./grade-helpers";

export {
  getLevelForXP,
  getXPProgress,
  wouldLevelUp,
  awardXP,
  getLevelTitle,
  getXPForLevel,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
} from "./xp";
export type { LevelInfo, XPAward, XPSource, LevelThreshold } from "./xp";
