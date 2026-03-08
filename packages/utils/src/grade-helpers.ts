/**
 * Grade Level Helpers — Maps grade levels to age tiers.
 *
 * TIER_1 (K-G3):  Young learners — big buttons, simple UI
 * TIER_2 (G4-G7): Middle learners — gamified, mission-based
 * TIER_3 (G8-G12): Older learners — clean, data-driven
 */

export type AgeTier = "TIER_1" | "TIER_2" | "TIER_3";

const TIER_MAP: Record<string, AgeTier> = {
  K: "TIER_1",
  G1: "TIER_1",
  G2: "TIER_1",
  G3: "TIER_1",
  G4: "TIER_2",
  G5: "TIER_2",
  G6: "TIER_2",
  G7: "TIER_2",
  G8: "TIER_3",
  G9: "TIER_3",
  G10: "TIER_3",
  G11: "TIER_3",
  G12: "TIER_3",
};

/**
 * Get the age tier for a grade level string.
 * Defaults to TIER_2 if unknown.
 */
export function getAgeTier(gradeLevel: string): AgeTier {
  return TIER_MAP[gradeLevel] || "TIER_2";
}

/**
 * Grade level ordering for sorting.
 */
const GRADE_ORDER: Record<string, number> = {
  K: 0, G1: 1, G2: 2, G3: 3, G4: 4, G5: 5, G6: 6,
  G7: 7, G8: 8, G9: 9, G10: 10, G11: 11, G12: 12,
};

/**
 * Compare two grade level strings for sorting.
 */
export function compareGradeLevels(a: string, b: string): number {
  return (GRADE_ORDER[a] ?? 99) - (GRADE_ORDER[b] ?? 99);
}

/**
 * Get display name for a grade level.
 */
export function gradeDisplayName(gradeLevel: string): string {
  if (gradeLevel === "K") return "Kindergarten";
  const num = gradeLevel.replace("G", "");
  return `Grade ${num}`;
}
