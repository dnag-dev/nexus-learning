/**
 * Age Tier Utility — Maps grade levels to age tiers.
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

export function getAgeTier(gradeLevel: string): AgeTier {
  return TIER_MAP[gradeLevel] || "TIER_2";
}
