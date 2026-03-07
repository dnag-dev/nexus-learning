/**
 * Mastery States — Phase 13: Five visual mastery states.
 *
 * Maps BKT probability ranges to visual states + colors.
 * Used in TopicTree, Unit pages, and dashboard stat aggregation.
 *
 * State       | BKT Range | Color    | Label
 * ------------|-----------|----------|-------------
 * Not Started | 0%        | Grey     | Not started
 * Attempted   | 1-30%     | Orange   | Attempted
 * Familiar    | 30-60%    | Yellow   | Familiar
 * Proficient  | 60-85%    | Blue     | Proficient
 * Mastered    | 85%+      | Green    | Mastered
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
  /** Tailwind bg color class */
  bgColor: string;
  /** Tailwind text color class */
  textColor: string;
  /** Tailwind border color class */
  borderColor: string;
  /** Badge color for small inline badges */
  badgeClass: string;
  /** Dot color for compact views */
  dotClass: string;
}

const STATES: Record<MasteryState, MasteryStateInfo> = {
  not_started: {
    state: "not_started",
    label: "Not started",
    emoji: "⬜",
    bgColor: "bg-gray-100",
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
    badgeClass: "bg-gray-100 text-gray-600",
    dotClass: "bg-gray-300",
  },
  attempted: {
    state: "attempted",
    label: "Attempted",
    emoji: "🟧",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    badgeClass: "bg-orange-100 text-orange-700",
    dotClass: "bg-orange-400",
  },
  familiar: {
    state: "familiar",
    label: "Familiar",
    emoji: "🟨",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-200",
    badgeClass: "bg-yellow-100 text-yellow-700",
    dotClass: "bg-yellow-400",
  },
  proficient: {
    state: "proficient",
    label: "Proficient",
    emoji: "🟦",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700",
    dotClass: "bg-blue-500",
  },
  mastered: {
    state: "mastered",
    label: "Mastered",
    emoji: "🟩",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    borderColor: "border-green-200",
    badgeClass: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  },
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
