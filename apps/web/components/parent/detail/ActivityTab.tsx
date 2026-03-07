"use client";

/**
 * ActivityTab — Parent dashboard tab showing student activity timeline.
 *
 * Features:
 * - Timeline view of all learning events (sessions, mastery, badges, level-ups)
 * - Summary cards at top (events today, this week, concepts mastered, sessions)
 * - Filter by event type
 * - "Load more" pagination
 * - CSV export button
 *
 * Data source: GET /api/parent/child/[id]/activity-log
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ───

interface ActivityEntry {
  id: string;
  eventType: string;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivitySummary {
  eventsToday: number;
  eventsThisWeek: number;
  conceptsMasteredThisWeek: number;
  sessionsCompletedThisWeek: number;
}

interface ActivityTabProps {
  childId: string;
  childName: string;
}

// ─── Event type display config ───

const EVENT_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  SESSION_STARTED: { emoji: "🚀", color: "text-blue-500", label: "Session Started" },
  SESSION_COMPLETED: { emoji: "✅", color: "text-green-500", label: "Session Completed" },
  CONCEPT_MASTERED: { emoji: "⭐", color: "text-yellow-500", label: "Concept Mastered" },
  STEP_ADVANCED: { emoji: "📈", color: "text-purple-500", label: "Step Advanced" },
  STEP_FAILED: { emoji: "🔄", color: "text-orange-500", label: "Step Retry" },
  STREAK_MILESTONE: { emoji: "🔥", color: "text-red-500", label: "Streak Milestone" },
  BADGE_EARNED: { emoji: "🏅", color: "text-yellow-600", label: "Badge Earned" },
  LEVEL_UP: { emoji: "🎉", color: "text-purple-600", label: "Level Up" },
  BOSS_CHALLENGE_WON: { emoji: "🏆", color: "text-yellow-500", label: "Boss Challenge Won" },
  BOSS_CHALLENGE_LOST: { emoji: "💪", color: "text-gray-500", label: "Boss Challenge Lost" },
  DIAGNOSTIC_COMPLETED: { emoji: "📊", color: "text-blue-600", label: "Diagnostic Done" },
  REVIEW_STARTED: { emoji: "📖", color: "text-teal-500", label: "Review Started" },
  FLUENCY_DRILL_COMPLETED: { emoji: "🏎️", color: "text-green-600", label: "Fluency Drill" },
  MAX_QUESTIONS_REACHED: { emoji: "⏰", color: "text-gray-400", label: "Max Questions" },
  PLAN_CREATED: { emoji: "📋", color: "text-blue-400", label: "Plan Created" },
  GOAL_SET: { emoji: "🎯", color: "text-indigo-500", label: "Goal Set" },
  // Phase 7: Expanded event types
  QUESTION_ANSWERED: { emoji: "❓", color: "text-gray-500", label: "Question Answered" },
  GRADE_COMPLETED: { emoji: "🎓", color: "text-amber-500", label: "Grade Complete!" },
  GRADE_ADVANCED: { emoji: "🚀", color: "text-green-600", label: "Grade Advanced" },
  SUBJECT_SWITCHED: { emoji: "🔄", color: "text-blue-400", label: "Subject Switched" },
  TOPIC_SELECTED: { emoji: "🔍", color: "text-indigo-400", label: "Topic Selected" },
  HINT_USED: { emoji: "💡", color: "text-yellow-400", label: "Hint Used" },
  // Phase 13: Unit/Test-Out/Fluency Zone events
  TEST_OUT_PASSED: { emoji: "⚡", color: "text-cyan-500", label: "Test Out Passed!" },
  TEST_OUT_FAILED: { emoji: "📝", color: "text-gray-500", label: "Test Out Attempted" },
  UNIT_TEST_PASSED: { emoji: "🏆", color: "text-yellow-500", label: "Unit Test Passed!" },
  UNIT_TEST_FAILED: { emoji: "📝", color: "text-gray-500", label: "Unit Test Attempted" },
  COURSE_CHALLENGE_PASSED: { emoji: "🎓", color: "text-green-500", label: "Course Challenge Passed!" },
  COURSE_CHALLENGE_FAILED: { emoji: "📝", color: "text-gray-500", label: "Course Challenge Attempted" },
  FLUENCY_ZONE_COMPLETED: { emoji: "⚡", color: "text-cyan-500", label: "Fluency Zone" },
};

const FILTER_OPTIONS = [
  { value: "", label: "All Events" },
  { value: "SESSION_COMPLETED", label: "Sessions" },
  { value: "CONCEPT_MASTERED", label: "Mastered" },
  { value: "GRADE_COMPLETED", label: "Grade Complete" },
  { value: "QUESTION_ANSWERED", label: "Questions" },
  { value: "BADGE_EARNED", label: "Badges" },
  { value: "LEVEL_UP", label: "Level Ups" },
  { value: "STREAK_MILESTONE", label: "Streaks" },
  { value: "FLUENCY_DRILL_COMPLETED", label: "Fluency" },
  { value: "TEST_OUT_PASSED", label: "Test Outs" },
  { value: "UNIT_TEST_PASSED", label: "Unit Tests" },
  { value: "FLUENCY_ZONE_COMPLETED", label: "Fluency Zone" },
];

// ─── Helpers ───

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function groupByDate(entries: ActivityEntry[]): Record<string, ActivityEntry[]> {
  const groups: Record<string, ActivityEntry[]> = {};
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

// ─── Component ───

export default function ActivityTab({ childId, childName }: ActivityTabProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");

  const fetchActivityLog = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: "30",
          offset: String(offset),
        });
        if (filter) params.set("eventType", filter);

        const res = await fetch(`/api/parent/child/${childId}/activity-log?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        if (append) {
          setEntries((prev) => [...prev, ...data.entries]);
        } else {
          setEntries(data.entries);
          setSummary(data.summary);
        }
        setTotal(data.total);
        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error("Activity log fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [childId, filter]
  );

  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]);

  const handleLoadMore = () => {
    fetchActivityLog(entries.length, true);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (filter) params.set("eventType", filter);
    window.open(`/api/parent/child/${childId}/activity-log?${params}`, "_blank");
  };

  // Group entries by date
  const grouped = groupByDate(entries);
  const dateKeys = Object.keys(grouped);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Summary skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
        {/* Timeline skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Summary Cards ─── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="Events Today"
            value={summary.eventsToday}
            emoji="📊"
          />
          <SummaryCard
            label="This Week"
            value={summary.eventsThisWeek}
            emoji="📅"
          />
          <SummaryCard
            label="Concepts Mastered"
            value={summary.conceptsMasteredThisWeek}
            emoji="⭐"
            sublabel="this week"
          />
          <SummaryCard
            label="Sessions"
            value={summary.sessionsCompletedThisWeek}
            emoji="✅"
            sublabel="this week"
          />
        </div>
      )}

      {/* ─── Filter + Export Row ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {total} event{total !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={handleExportCSV}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          📥 Export CSV
        </button>
      </div>

      {/* ─── Timeline ─── */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No activity yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Events will appear here as {childName} learns
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => {
            const dayEntries = grouped[dateKey];
            const dateLabel = formatDate(dayEntries[0].createdAt);

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEntries.map((entry) => {
                    const config = EVENT_CONFIG[entry.eventType] ?? {
                      emoji: "📌",
                      color: "text-gray-500",
                      label: entry.eventType,
                    };

                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Icon */}
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {config.emoji}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">
                            {entry.title}
                          </p>
                          {entry.detail && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {entry.detail}
                            </p>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary Card ───

function SummaryCard({
  label,
  value,
  emoji,
  sublabel,
}: {
  label: string;
  value: number;
  emoji: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sublabel && (
        <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}
