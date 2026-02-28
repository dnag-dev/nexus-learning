"use client";

/**
 * Per-Child Detail Page — Phase 9 UX Overhaul (Part 3)
 *
 * Single page with client-side tabs:
 *   overview | progress | sessions | insights | settings
 *
 * Header: back arrow, child avatar + name + grade, "Start Session" button.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useParent } from "@/lib/parent-context";
import { DetailPageSkeleton } from "@/components/ui/Skeleton";
import OverviewTab from "@/components/parent/detail/OverviewTab";
import ProgressTab from "@/components/parent/detail/ProgressTab";
import SessionsTab from "@/components/parent/detail/SessionsTab";
import InsightsTab from "@/components/parent/detail/InsightsTab";
import ChildSettingsTab from "@/components/parent/detail/ChildSettingsTab";

// ─── Types ───

interface ChildProfile {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
  level: number;
  xp: number;
  lastActiveAt: string | null;
}

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
};

const GRADE_LABELS: Record<string, string> = {
  K: "Kindergarten",
  G1: "Grade 1", G2: "Grade 2", G3: "Grade 3",
  G4: "Grade 4", G5: "Grade 5", G6: "Grade 6",
  G7: "Grade 7", G8: "Grade 8", G9: "Grade 9",
  G10: "Grade 10", G11: "Grade 11", G12: "Grade 12",
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "progress", label: "Progress" },
  { key: "sessions", label: "Sessions" },
  { key: "insights", label: "Insights" },
  { key: "settings", label: "Settings" },
];

export default function ChildDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { parentId } = useParent();

  const childId = params.id as string;
  const currentTab = searchParams.get("tab") || "overview";

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChild = useCallback(async () => {
    if (!parentId || !childId) return;
    try {
      const res = await fetch(`/api/parent/${parentId}/overview`);
      if (res.ok) {
        const data = await res.json();
        const found = data.childCards?.find(
          (c: ChildProfile) => c.id === childId
        );
        if (found) {
          setChild(found);
        }
      }
    } catch (err) {
      console.error("Failed to load child:", err);
    } finally {
      setLoading(false);
    }
  }, [parentId, childId]);

  useEffect(() => {
    fetchChild();
  }, [fetchChild]);

  const setTab = (tab: string) => {
    router.push(`/dashboard/child/${childId}?tab=${tab}`, { scroll: false });
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">😕</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Child not found
        </h2>
        <Link
          href="/dashboard"
          className="text-sm text-purple-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ←
          </Link>
          <span className="text-3xl">
            {PERSONA_EMOJI[child.avatarPersonaId] || "👤"}
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {child.displayName}
            </h2>
            <p className="text-sm text-gray-500">
              {GRADE_LABELS[child.gradeLevel] || child.gradeLevel} · Level{" "}
              {child.level}
            </p>
          </div>
        </div>
        <Link
          href={`/session?childId=${childId}`}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Start Session →
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentTab === tab.key
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === "overview" && (
          <OverviewTab childId={childId} parentId={parentId} child={child} />
        )}
        {currentTab === "progress" && (
          <ProgressTab childId={childId} />
        )}
        {currentTab === "sessions" && (
          <SessionsTab childId={childId} />
        )}
        {currentTab === "insights" && (
          <InsightsTab parentId={parentId} />
        )}
        {currentTab === "settings" && (
          <ChildSettingsTab childId={childId} parentId={parentId} />
        )}
      </div>
    </div>
  );
}
