"use client";

/**
 * ProgressTab — Per-Child Detail Page
 *
 * Stats cards, mastery bar chart, strengths/weaknesses, daily sparkline, recent sessions.
 */

import { useState, useEffect } from "react";

interface ProgressTabProps {
  childId: string;
}

interface DomainBreakdown {
  domain: string;
  mastered: number;
  inProgress: number;
  notStarted: number;
}

interface RecentSession {
  id: string;
  date: string;
  durationMinutes: number;
  nodesPracticed: string[];
  accuracy: number;
  sessionType: string;
}

interface StrengthWeakness {
  nodeTitle: string;
  bktProbability: number;
  domain: string;
}

interface DailyMinutes {
  date: string;
  minutes: number;
}

interface ProgressData {
  childName: string;
  domainBreakdown: DomainBreakdown[];
  recentSessions: RecentSession[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  dailyMinutes: DailyMinutes[];
}

const DOMAIN_COLORS: Record<string, string> = {
  COUNTING: "bg-blue-500",
  OPERATIONS: "bg-green-500",
  GEOMETRY: "bg-purple-500",
  MEASUREMENT: "bg-amber-500",
  DATA: "bg-pink-500",
  FRACTIONS: "bg-cyan-500",
  ALGEBRA: "bg-indigo-500",
  READING: "bg-emerald-500",
  WRITING: "bg-orange-500",
  GRAMMAR: "bg-rose-500",
};

export default function ProgressTab({ childId }: ProgressTabProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/parent/child/${childId}/progress`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Progress fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [childId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No progress data available yet. Complete some sessions first!
      </div>
    );
  }

  const totalMastered = data.domainBreakdown.reduce(
    (s, d) => s + d.mastered,
    0
  );
  const totalInProgress = data.domainBreakdown.reduce(
    (s, d) => s + d.inProgress,
    0
  );
  const avgAccuracy =
    data.recentSessions.length > 0
      ? Math.round(
          data.recentSessions.reduce((s, r) => s + r.accuracy, 0) /
            data.recentSessions.length
        )
      : 0;
  const totalMinutes = data.dailyMinutes.reduce((s, d) => s + d.minutes, 0);

  const displayedSessions = showAllSessions
    ? data.recentSessions
    : data.recentSessions.slice(0, 10);

  // Sparkline max value
  const maxMinutes = Math.max(...data.dailyMinutes.map((d) => d.minutes), 1);

  return (
    <div className="space-y-5">
      {/* Row 1: Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Mastered</p>
          <p className="text-2xl font-bold text-gray-900">{totalMastered}</p>
          <p className="text-xs text-green-600">concepts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Accuracy</p>
          <p className="text-2xl font-bold text-gray-900">{avgAccuracy}%</p>
          <p className="text-xs text-gray-400">avg recent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-gray-900">{totalInProgress}</p>
          <p className="text-xs text-amber-600">learning</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Time</p>
          <p className="text-2xl font-bold text-gray-900">{totalMinutes}m</p>
          <p className="text-xs text-gray-400">last 14 days</p>
        </div>
      </div>

      {/* Row 2: Domain Mastery + Strengths/Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mastery by Domain */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Mastery by Domain
          </h4>
          <div className="space-y-2">
            {data.domainBreakdown.map((d) => {
              const total = d.mastered + d.inProgress + d.notStarted;
              const pct = total > 0 ? Math.round((d.mastered / total) * 100) : 0;
              return (
                <div key={d.domain}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize">
                      {d.domain.toLowerCase()}
                    </span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-2 rounded-full ${DOMAIN_COLORS[d.domain] || "bg-purple-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Strengths & Weaknesses
          </h4>
          {data.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-green-600 font-medium mb-1">
                Strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.strengths.slice(0, 5).map((s) => (
                  <span
                    key={s.nodeTitle}
                    className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                  >
                    {s.nodeTitle}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.weaknesses.length > 0 && (
            <div>
              <p className="text-xs text-red-600 font-medium mb-1">
                Needs Work
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.weaknesses.slice(0, 5).map((w) => (
                  <span
                    key={w.nodeTitle}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs"
                  >
                    {w.nodeTitle}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.strengths.length === 0 && data.weaknesses.length === 0 && (
            <p className="text-xs text-gray-400">
              Complete more sessions to see patterns.
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Daily Practice Sparkline */}
      {data.dailyMinutes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Daily Practice (last 14 days)
          </h4>
          <div className="flex items-end gap-1 h-[80px]">
            {data.dailyMinutes.slice(-14).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm ${d.minutes > 0 ? "bg-purple-400" : "bg-gray-100"}`}
                  style={{
                    height: `${Math.max((d.minutes / maxMinutes) * 70, 2)}px`,
                  }}
                />
                <span className="text-[9px] text-gray-400">
                  {new Date(d.date).toLocaleDateString("en-US", {
                    weekday: "narrow",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 4: Recent Sessions Table */}
      {data.recentSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Recent Sessions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Concepts</th>
                  <th className="pb-2 font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedSessions.map((s) => (
                  <tr key={s.id} className="text-gray-700">
                    <td className="py-2">
                      {new Date(s.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2">{s.durationMinutes}m</td>
                    <td className="py-2">{s.nodesPracticed.length}</td>
                    <td className="py-2">
                      <span
                        className={
                          s.accuracy >= 80
                            ? "text-green-600"
                            : s.accuracy >= 60
                              ? "text-amber-600"
                              : "text-red-600"
                        }
                      >
                        {s.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.recentSessions.length > 10 && !showAllSessions && (
            <button
              onClick={() => setShowAllSessions(true)}
              className="mt-3 text-sm text-purple-600 hover:underline"
            >
              Show More ({data.recentSessions.length - 10} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
