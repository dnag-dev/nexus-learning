"use client";

/**
 * OverviewTab — Per-Child Detail Page
 *
 * Shows: Mission card, This Week stats, Cosmo's Note.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

interface OverviewTabProps {
  childId: string;
  parentId: string;
  child: {
    displayName: string;
    avatarPersonaId: string;
    gradeLevel: string;
    level: number;
  };
}

interface GPSData {
  planId: string;
  goalName: string;
  progressPercentage: number;
  totalConcepts: number;
  masteredConcepts: number;
  remainingConcepts: number;
  scheduleStatus: string;
  etaData: { estimatedDate: string } | null;
  weeklySessionCount: number;
  weeklyAccuracy: number;
  weeklyMinutesActual: number;
}

interface ProgressData {
  recentSessions: Array<{
    id: string;
    date: string;
    durationMinutes: number;
    accuracy: number;
  }>;
  domainBreakdown: Array<{
    domain: string;
    mastered: number;
    inProgress: number;
  }>;
}

interface InsightData {
  insight: string;
  motivationalTip: string;
}

export default function OverviewTab({
  childId,
  parentId,
  child,
}: OverviewTabProps) {
  const [gps, setGps] = useState<GPSData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [cosmoNote, setCosmoNote] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gpsRes, progressRes] = await Promise.all([
          fetch(`/api/parent/child/${childId}/gps`),
          fetch(`/api/parent/child/${childId}/progress`),
        ]);

        if (gpsRes.ok) {
          const data = await gpsRes.json();
          if (data.plans?.[0]) {
            setGps(data.plans[0]);
            // Fetch Cosmo note using the plan
            try {
              const noteRes = await fetch(
                `/api/gps/insight?planId=${data.plans[0].planId}`
              );
              if (noteRes.ok) {
                const noteData = await noteRes.json();
                setCosmoNote(noteData);
              }
            } catch {
              // Non-critical
            }
          }
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgress(data);
        }
      } catch (err) {
        console.error("OverviewTab fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [childId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  // Calculate this week stats
  const sessionsThisWeek = gps?.weeklySessionCount ?? 0;
  const totalMastered = progress?.domainBreakdown?.reduce(
    (sum, d) => sum + d.mastered,
    0
  ) ?? 0;
  const weeklyMinutes = gps?.weeklyMinutesActual ?? 0;

  // Find strongest domain
  const strongest = progress?.domainBreakdown
    ?.filter((d) => d.mastered > 0)
    ?.sort((a, b) => b.mastered - a.mastered)?.[0];

  return (
    <div className="space-y-5">
      {/* Mission Card */}
      {gps ? (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4 text-5xl opacity-30">🐻</div>
          <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold mb-1">
            Current Mission
          </p>
          <h3 className="text-lg font-bold mb-2">{gps.goalName}</h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{
                width: `${Math.min(gps.progressPercentage, 100)}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-300 mb-4">
            {gps.progressPercentage}% complete · {gps.masteredConcepts}/
            {gps.totalConcepts} concepts mastered
            {gps.etaData && (
              <span>
                {" "}
                · ETA:{" "}
                {new Date(gps.etaData.estimatedDate).toLocaleDateString(
                  "en-US",
                  { month: "short", year: "numeric" }
                )}
              </span>
            )}
          </p>

          <Link
            href={`/session?childId=${childId}`}
            className="inline-block px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Start Today&apos;s Session →
          </Link>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">
            No learning plan yet. Start a session to create one!
          </p>
          <Link
            href={`/session?childId=${childId}`}
            className="inline-block mt-3 px-5 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Start First Session →
          </Link>
        </div>
      )}

      {/* This Week Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Sessions</p>
          <p className="text-2xl font-bold text-gray-900">
            {sessionsThisWeek}
          </p>
          <p className="text-xs text-gray-400">this week</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Mastered</p>
          <p className="text-2xl font-bold text-gray-900">{totalMastered}</p>
          <p className="text-xs text-gray-400">
            {strongest ? `strongest: ${strongest.domain}` : "concepts"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Time</p>
          <p className="text-2xl font-bold text-gray-900">{weeklyMinutes}m</p>
          <p className="text-xs text-gray-400">practiced this week</p>
        </div>
      </div>

      {/* Cosmo's Note */}
      {cosmoNote && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🐻</span>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                Cosmo&apos;s Note
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {cosmoNote.insight}
              </p>
              {cosmoNote.motivationalTip && (
                <p className="text-sm text-purple-600 mt-2 italic">
                  💡 {cosmoNote.motivationalTip}
                </p>
              )}
              <Link
                href={`/dashboard/child/${childId}?tab=sessions`}
                className="text-xs text-purple-600 hover:underline mt-2 inline-block"
              >
                See all sessions →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
