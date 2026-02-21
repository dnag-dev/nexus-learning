"use client";

/**
 * SessionHistory — Phase 9: Parent Dashboard
 *
 * Paginated, filterable table of all sessions.
 * Shows date, duration, type, accuracy, emotional states,
 * nodes covered, and interventions.
 */

import { useState, useMemo } from "react";

// ─── Types ───

export interface SessionRecord {
  id: string;
  date: string; // ISO
  durationMinutes: number;
  sessionType: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number; // 0-1
  emotionalStateAtStart: string | null;
  emotionalStateAtEnd: string | null;
  interventionsTriggered: number;
  nodesCovered: string[];
  hintsUsed: number;
}

export interface SessionHistoryFilters {
  sessionType: string | null;
  minAccuracy: number | null;
  dateRange: "7d" | "30d" | "90d" | "all";
}

interface SessionHistoryProps {
  sessions: SessionRecord[];
  pageSize?: number;
}

// ─── Emotion Emoji Map ───

const EMOTION_EMOJI: Record<string, string> = {
  ENGAGED: "😊",
  FRUSTRATED: "😤",
  BORED: "😑",
  CONFUSED: "😕",
  EXCITED: "🤩",
  NEUTRAL: "😐",
  ANXIOUS: "😰",
  BREAKTHROUGH: "💡",
};

// ─── Component ───

export default function SessionHistory({
  sessions,
  pageSize = 10,
}: SessionHistoryProps) {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<SessionHistoryFilters>({
    sessionType: null,
    minAccuracy: null,
    dateRange: "30d",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Apply filters
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Date range filter
    if (filters.dateRange !== "all") {
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      const days = daysMap[filters.dateRange];
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      result = result.filter((s) => new Date(s.date) >= cutoff);
    }

    // Session type filter
    if (filters.sessionType) {
      result = result.filter((s) => s.sessionType === filters.sessionType);
    }

    // Min accuracy filter
    if (filters.minAccuracy !== null) {
      result = result.filter((s) => s.accuracy >= filters.minAccuracy!);
    }

    // Sort by date (newest first)
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return result;
  }, [sessions, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / pageSize);
  const paginatedSessions = filteredSessions.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Session History</h3>
        <span className="text-sm text-gray-400">
          {filteredSessions.length} session
          {filteredSessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Date Range */}
        <select
          value={filters.dateRange}
          onChange={(e) =>
            setFilters({
              ...filters,
              dateRange: e.target.value as SessionHistoryFilters["dateRange"],
            })
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        {/* Session Type */}
        <select
          value={filters.sessionType || ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              sessionType: e.target.value || null,
            })
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600"
        >
          <option value="">All types</option>
          <option value="LEARNING">Learning</option>
          <option value="REVIEW">Review</option>
          <option value="DIAGNOSTIC">Diagnostic</option>
          <option value="BOSS">Boss</option>
        </select>

        {/* Min Accuracy */}
        <select
          value={filters.minAccuracy !== null ? String(filters.minAccuracy) : ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              minAccuracy: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600"
        >
          <option value="">Any accuracy</option>
          <option value="0.5">≥ 50%</option>
          <option value="0.7">≥ 70%</option>
          <option value="0.9">≥ 90%</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b">
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Type</th>
              <th className="pb-2 pr-3">Duration</th>
              <th className="pb-2 pr-3">Questions</th>
              <th className="pb-2 pr-3">Accuracy</th>
              <th className="pb-2 pr-3">Start</th>
              <th className="pb-2 pr-3">End</th>
              <th className="pb-2">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedSessions.map((session) => (
              <>
                <tr
                  key={session.id}
                  className="text-gray-700 hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === session.id ? null : session.id
                    )
                  }
                >
                  <td className="py-2 pr-3">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <TypeBadge type={session.sessionType} />
                  </td>
                  <td className="py-2 pr-3">{session.durationMinutes}m</td>
                  <td className="py-2 pr-3">
                    {session.correctAnswers}/{session.questionsAnswered}
                  </td>
                  <td className="py-2 pr-3">
                    <AccuracyPill accuracy={session.accuracy} />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    {session.emotionalStateAtStart
                      ? EMOTION_EMOJI[session.emotionalStateAtStart] || "—"
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-center">
                    {session.emotionalStateAtEnd
                      ? EMOTION_EMOJI[session.emotionalStateAtEnd] || "—"
                      : "—"}
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-gray-400">
                      {expandedId === session.id ? "▲" : "▼"}
                    </span>
                  </td>
                </tr>
                {/* Expanded row */}
                {expandedId === session.id && (
                  <tr key={`${session.id}-expanded`}>
                    <td colSpan={8} className="py-3 px-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Hints used:</span>{" "}
                          <span className="font-medium">
                            {session.hintsUsed}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Interventions:</span>{" "}
                          <span className="font-medium">
                            {session.interventionsTriggered}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">
                            Nodes covered:
                          </span>{" "}
                          <span className="font-medium">
                            {session.nodesCovered.length > 0
                              ? session.nodesCovered.join(", ")
                              : "None"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {paginatedSessions.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No sessions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function TypeBadge({ type }: { type: string }) {
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

function AccuracyPill({ accuracy }: { accuracy: number }) {
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

export { EMOTION_EMOJI };
