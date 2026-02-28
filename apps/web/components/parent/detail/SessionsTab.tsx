"use client";

/**
 * SessionsTab — Per-Child Detail Page
 *
 * Session history with filters and expandable rows.
 */

import { useState, useEffect, useMemo } from "react";

interface SessionsTabProps {
  childId: string;
}

interface SessionRecord {
  id: string;
  date: string;
  durationMinutes: number;
  sessionType: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  emotionalStateAtStart: string;
  emotionalStateAtEnd: string;
  interventionsTriggered: number;
  nodesCovered: string[];
  hintsUsed: number;
}

type FilterPeriod = "ALL" | "WEEK" | "MONTH";

export default function SessionsTab({ childId }: SessionsTabProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/parent/child/${childId}/sessions`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error("Sessions fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [childId]);

  const filtered = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case "WEEK": {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        return sessions.filter((s) => new Date(s.date).getTime() > weekAgo);
      }
      case "MONTH": {
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
        return sessions.filter((s) => new Date(s.date).getTime() > monthAgo);
      }
      default:
        return sessions;
    }
  }, [sessions, filter]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No sessions yet. Start a learning session to see history here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2">
        {(
          [
            { value: "ALL", label: "All" },
            { value: "WEEK", label: "This Week" },
            { value: "MONTH", label: "This Month" },
          ] as { value: FilterPeriod; label: string }[]
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.value
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} session{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {filtered.map((session) => {
          const isExpanded = expandedId === session.id;
          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              {/* Summary Row */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : session.id)
                }
                className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-500 w-20 shrink-0">
                  {new Date(session.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {session.nodesCovered.length} concept
                  {session.nodesCovered.length !== 1 ? "s" : ""} ·{" "}
                  {session.durationMinutes}m
                </span>
                <span
                  className={`text-sm font-medium ${
                    session.accuracy >= 80
                      ? "text-green-600"
                      : session.accuracy >= 60
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {session.accuracy}%
                </span>
                <span className="text-gray-400 text-xs">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Questions</span>
                      <p className="font-medium text-gray-900">
                        {session.correctAnswers}/{session.questionsAnswered}{" "}
                        correct
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Hints Used</span>
                      <p className="font-medium text-gray-900">
                        {session.hintsUsed}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Mood</span>
                      <p className="font-medium text-gray-900">
                        {session.emotionalStateAtStart} →{" "}
                        {session.emotionalStateAtEnd}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type</span>
                      <p className="font-medium text-gray-900 capitalize">
                        {session.sessionType?.toLowerCase() || "practice"}
                      </p>
                    </div>
                  </div>
                  {session.nodesCovered.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500">
                        Concepts covered:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.nodesCovered.map((node) => (
                          <span
                            key={node}
                            className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600"
                          >
                            {node}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
