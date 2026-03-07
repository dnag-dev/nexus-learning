"use client";

/**
 * Kid Dashboard — Routes to age-appropriate home screen.
 *
 * New students (firstLoginComplete === false) → onboarding wizard.
 * Then routed by age tier:
 *   Tier 1 (K-G3):   Simple, centered, one big button
 *   Tier 2 (G4-G7):  Mission briefing, stats, badges
 *   Tier 3 (G8-G12): Data-driven, minimal, respectful
 *
 * ⚠️  CRITICAL FEATURES in each tier (DO NOT REMOVE during refactors):
 * 1. SubjectTabs — Math / English switcher
 * 2. TopicSearchInput — Prompt-based learning (type a topic → start session)
 * 3. Session start links must include subject param
 * See FEATURE_INVENTORY.md for the full checklist.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChild } from "@/lib/child-context";
import { getAgeTier } from "@/lib/student/age-tier";
import Tier1Home from "@/components/kid/Tier1Home";
import Tier2Home from "@/components/kid/Tier2Home";
import Tier3Home from "@/components/kid/Tier3Home";

export default function KidDashboardPage() {
  const router = useRouter();
  const { gradeLevel, firstLoginComplete } = useChild();
  const tier = getAgeTier(gradeLevel);

  useEffect(() => {
    if (!firstLoginComplete) {
      router.replace("/kid/onboarding");
    }
  }, [firstLoginComplete, router]);

  if (!firstLoginComplete) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-5xl animate-bounce">🚀</div>
      </div>
    );
  }

  if (tier === "TIER_1") return <Tier1Home />;
  if (tier === "TIER_2") return <Tier2Home />;
  return <Tier3Home />;
}
