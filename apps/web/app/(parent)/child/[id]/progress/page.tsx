"use client";

/**
 * Child Progress Page — Phase 9: Parent Dashboard
 *
 * Detailed learning progress view for a specific child.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ProgressView, {
  type DomainBreakdown,
  type RecentSession,
  type StrengthWeakness,
  type DailyMinutes,
} from "@/components/parent/ProgressView";

export default function ChildProgressPage() {
  const params = useParams();
  const childId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    childName: string;
    domainBreakdown: DomainBreakdown[];
    recentSessions: RecentSession[];
    strengths: StrengthWeakness[];
    weaknesses: StrengthWeakness[];
    dailyMinutes: DailyMinutes[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/parent/child/${childId}/progress`);
      if (!res.ok) throw new Error("Failed to load progress data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load progress"
      );
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading progress...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error || "No data available"}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions for this child */}
      <div className="flex items-center gap-3">
        <a
          href={`/session?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ▶ Start Learning Session
        </a>
        <a
          href={`/diagnostic?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          🎯 Run Diagnostic
        </a>
        <a
          href={`/constellation?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          🌌 Constellation Map
        </a>
        <a
          href={`/onboarding/persona-select?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          🐻 Choose Tutor
        </a>
      </div>

      <ProgressView
        childName={data.childName}
        domainBreakdown={data.domainBreakdown}
        recentSessions={data.recentSessions}
        strengths={data.strengths}
        weaknesses={data.weaknesses}
        dailyMinutes={data.dailyMinutes}
      />
    </div>
  );
}
