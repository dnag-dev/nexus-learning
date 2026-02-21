"use client";

/**
 * ProgressView — Phase 9: Parent Dashboard
 *
 * Detailed progress for one child:
 * - Mini star map (read-only)
 * - Mastery breakdown by domain (bar chart)
 * - Recent sessions table
 * - Strength/weakness summary
 * - Time-on-task chart (14 days)
 */

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// ─── Types ───

export interface DomainBreakdown {
  domain: string;
  mastered: number;
  inProgress: number;
  notStarted: number;
}

export interface RecentSession {
  id: string;
  date: string; // ISO
  durationMinutes: number;
  nodesPracticed: string[];
  accuracy: number; // 0-1
  emotionalSummary: string;
  sessionType: string;
}

export interface StrengthWeakness {
  nodeTitle: string;
  bktProbability: number;
  domain: string;
}

export interface DailyMinutes {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface ProgressViewProps {
  childName: string;
  domainBreakdown: DomainBreakdown[];
  recentSessions: RecentSession[];
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  dailyMinutes: DailyMinutes[];
}

// ─── Domain Colors ───

const DOMAIN_COLORS: Record<string, string> = {
  COUNTING: "#6366f1",
  OPERATIONS: "#3b82f6",
  GEOMETRY: "#22c55e",
  MEASUREMENT: "#f59e0b",
  DATA: "#ef4444",
};

// ─── Component ───

export default function ProgressView({
  childName,
  domainBreakdown,
  recentSessions,
  strengths,
  weaknesses,
  dailyMinutes,
}: ProgressViewProps) {
  // Format domain breakdown for chart
  const domainData = useMemo(
    () =>
      domainBreakdown.map((d) => ({
        name: d.domain,
        Mastered: d.mastered,
        "In Progress": d.inProgress,
        "Not Started": d.notStarted,
      })),
    [domainBreakdown]
  );

  // Format daily minutes for line chart
  const timeData = useMemo(
    () =>
      dailyMinutes.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        minutes: d.minutes,
      })),
    [dailyMinutes]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {childName}&apos;s Progress
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Detailed learning progress and mastery breakdown.
        </p>
      </div>

      {/* Mastery Breakdown by Domain */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          Mastery by Domain
        </h3>
        {domainData.some(
          (d) => d.Mastered > 0 || d["In Progress"] > 0 || d["Not Started"] > 0
        ) ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Mastered"
                  fill="#22c55e"
                  stackId="stack"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="In Progress"
                  fill="#3b82f6"
                  stackId="stack"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Not Started"
                  fill="#e5e7eb"
                  stackId="stack"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500 text-sm">
              No curriculum data available yet. Start a learning session to
              begin tracking mastery across domains.
            </p>
          </div>
        )}
      </div>

      {/* Strength/Weakness + Time on Task row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths & Weaknesses */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Strengths & Areas to Grow
          </h3>

          {/* Strengths */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Top Strengths
            </p>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((s) => (
                  <div
                    key={s.nodeTitle}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-gray-700">
                        {s.nodeTitle}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(s.bktProbability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Still exploring — strengths will appear as mastery grows.
              </p>
            )}
          </div>

          {/* Weaknesses */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Needs Work
            </p>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((w) => (
                  <div
                    key={w.nodeTitle}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">!</span>
                      <span className="text-sm text-gray-700">
                        {w.nodeTitle}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(w.bktProbability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No specific areas of concern — great work!
              </p>
            )}
          </div>
        </div>

        {/* Time on Task Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Daily Practice (14 days)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "min",
                    position: "insideLeft",
                    style: { fontSize: 10, fill: "#9ca3af" },
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#8b5cf6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Duration</th>
                <th className="pb-2 pr-4">Nodes</th>
                <th className="pb-2 pr-4">Accuracy</th>
                <th className="pb-2">Mood</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="text-gray-700">
                  <td className="py-2 pr-4">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    <SessionTypeBadge type={session.sessionType} />
                  </td>
                  <td className="py-2 pr-4">
                    {session.durationMinutes} min
                  </td>
                  <td className="py-2 pr-4">
                    {session.nodesPracticed.length}
                  </td>
                  <td className="py-2 pr-4">
                    <AccuracyBadge accuracy={session.accuracy} />
                  </td>
                  <td className="py-2">
                    <span className="text-xs">{session.emotionalSummary}</span>
                  </td>
                </tr>
              ))}
              {recentSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function SessionTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    LEARNING: "bg-blue-50 text-blue-700",
    REVIEW: "bg-green-50 text-green-700",
    DIAGNOSTIC: "bg-purple-50 text-purple-700",
    BOSS: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[type] || "bg-gray-50 text-gray-700"}`}
    >
      {type}
    </span>
  );
}

function AccuracyBadge({ accuracy }: { accuracy: number }) {
  const pct = Math.round(accuracy * 100);
  const color =
    pct >= 80
      ? "text-green-600"
      : pct >= 60
        ? "text-amber-600"
        : "text-red-500";

  return <span className={`font-medium ${color}`}>{pct}%</span>;
}

// ─── Exports for tests ───

export { DOMAIN_COLORS };
