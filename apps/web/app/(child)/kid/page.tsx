"use client";

/**
 * Kid Dashboard — Routes to age-appropriate home screen.
 *
 * Tier 1 (K-G3):   Simple, centered, one big button
 * Tier 2 (G4-G7):  Mission briefing, stats, badges
 * Tier 3 (G8-G12): Data-driven, minimal, respectful
 */

import { useChild } from "@/lib/child-context";
import { getAgeTier } from "@/lib/student/age-tier";
import Tier1Home from "@/components/kid/Tier1Home";
import Tier2Home from "@/components/kid/Tier2Home";
import Tier3Home from "@/components/kid/Tier3Home";

export default function KidDashboardPage() {
  const { gradeLevel, firstLoginComplete } = useChild();
  const tier = getAgeTier(gradeLevel);

  // TODO (Part 6): if (!firstLoginComplete) redirect to /kid/onboarding

  if (tier === "TIER_1") return <Tier1Home />;
  if (tier === "TIER_2") return <Tier2Home />;
  return <Tier3Home />;
}
