/**
 * Mastery States — Five visual mastery states.
 *
 * Maps BKT probability ranges to visual states.
 * Used in TopicTree, Unit pages, and dashboard stat aggregation.
 *
 * State       | BKT Range | Label
 * ------------|-----------|-------------
 * Not Started | 0%        | Not started
 * Attempted   | 1-30%     | Attempted
 * Familiar    | 30-60%    | Familiar
 * Proficient  | 60-85%    | Proficient
 * Mastered    | 85%+      | Mastered
 */

export type MasteryState =
  | "not_started"
  | "attempted"
  | "familiar"
  | "proficient"
  | "mastered";

export interface MasteryStateInfo {
  state: MasteryState;
  label: string;
  emoji: string;
}

const STATES: Record<MasteryState, MasteryStateInfo> = {
  not_started: { state: "not_started", label: "Not started", emoji: "\u2b1c" },
  attempted: { state: "attempted", label: "Attempted", emoji: "\ud83d\udfe7" },
  familiar: { state: "familiar", label: "Familiar", emoji: "\ud83d\udfe8" },
  proficient: { state: "proficient", label: "Proficient", emoji: "\ud83d\udfe6" },
  mastered: { state: "mastered", label: "Mastered", emoji: "\ud83d\udfe9" },
};

/**
 * Get the mastery state from a BKT probability (0-1).
 */
export function getMasteryState(bkt: number): MasteryState {
  if (bkt <= 0) return "not_started";
  if (bkt < 0.30) return "attempted";
  if (bkt < 0.60) return "familiar";
  if (bkt < 0.85) return "proficient";
  return "mastered";
}

/**
 * Get full visual info for a BKT probability.
 */
export function getMasteryStateInfo(bkt: number): MasteryStateInfo {
  return STATES[getMasteryState(bkt)];
}

/**
 * Get info for a specific state (no BKT needed).
 */
export function getStateInfo(state: MasteryState): MasteryStateInfo {
  return STATES[state];
}

/**
 * Aggregate mastery states for a collection of nodes.
 * Returns counts per state.
 */
export function aggregateMasteryStates(
  bktProbabilities: number[]
): Record<MasteryState, number> {
  const counts: Record<MasteryState, number> = {
    not_started: 0,
    attempted: 0,
    familiar: 0,
    proficient: 0,
    mastered: 0,
  };
  for (const bkt of bktProbabilities) {
    counts[getMasteryState(bkt)]++;
  }
  return counts;
}

/**
 * Get ordered list of all states for rendering legends / filters.
 */
export function getAllStates(): MasteryStateInfo[] {
  return [
    STATES.not_started,
    STATES.attempted,
    STATES.familiar,
    STATES.proficient,
    STATES.mastered,
  ];
}
