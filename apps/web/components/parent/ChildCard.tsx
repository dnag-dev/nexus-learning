"use client";

/**
 * ChildCard — Phase 9: Parent Dashboard
 *
 * Per-child summary card showing key metrics:
 * display name, avatar, grade, XP/level, today's activity,
 * streak, mastery trend, last active timestamp.
 */

import Link from "next/link";

// ─── Types ───

export interface ChildCardData {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
  xp: number;
  level: number;
  todaySessions: number;
  todayMinutes: number;
  currentStreak: number;
  nodesMasteredThisWeek: number;
  nodesMasteredLastWeek: number;
  lastActiveAt: string | null; // ISO
}

interface ChildCardProps {
  child: ChildCardData;
}

// ─── Constants ───

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
  alex: "👦",
  mia: "👧",
  raj: "🧑",
  zoe: "👩",
  jordan: "🧑‍🎓",
  priya: "👩‍🔬",
  marcus: "🧑‍🏫",
  sam: "🧑‍💻",
};

const GRADE_LABELS: Record<string, string> = {
  K: "Kindergarten",
  G1: "Grade 1",
  G2: "Grade 2",
  G3: "Grade 3",
  G4: "Grade 4",
  G5: "Grade 5",
};

// ─── Component ───

export default function ChildCard({ child }: ChildCardProps) {
  const emoji = PERSONA_EMOJI[child.avatarPersonaId] || "👤";
  const gradeLabel = GRADE_LABELS[child.gradeLevel] || child.gradeLevel;

  // Mastery trend
  const trendDiff =
    child.nodesMasteredThisWeek - child.nodesMasteredLastWeek;
  const trendArrow =
    trendDiff > 0 ? "↑" : trendDiff < 0 ? "↓" : "→";
  const trendColor =
    trendDiff > 0
      ? "text-green-600"
      : trendDiff < 0
        ? "text-red-500"
        : "text-gray-400";

  // Last active
  const lastActiveLabel = child.lastActiveAt
    ? formatRelativeTime(new Date(child.lastActiveAt))
    : "Never";

  return (
    <Link
      href={`/child/${child.id}/progress`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {child.displayName}
          </h3>
          <p className="text-xs text-gray-500">{gradeLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-purple-600">
            Lv. {child.level}
          </p>
          <p className="text-xs text-gray-400">{child.xp} XP</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Today's Activity */}
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-700">
            {child.todaySessions}
          </p>
          <p className="text-xs text-blue-500">
            {child.todaySessions === 1 ? "session" : "sessions"}
          </p>
        </div>

        {/* Time today */}
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-green-700">
            {child.todayMinutes}
          </p>
          <p className="text-xs text-green-500">min today</p>
        </div>

        {/* Streak */}
        <div className="bg-orange-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-orange-700">
            {child.currentStreak > 0 ? `🔥 ${child.currentStreak}` : "—"}
          </p>
          <p className="text-xs text-orange-500">
            {child.currentStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* Mastery Trend */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Mastered this week:</span>
          <span className="font-medium">{child.nodesMasteredThisWeek}</span>
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendArrow} {Math.abs(trendDiff)}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Active {lastActiveLabel}
        </span>
      </div>

      {/* Start Learning Button */}
      <div className="flex gap-2">
        <a
          href={`/session?studentId=${child.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
        >
          ▶ Start Learning
        </a>
        <a
          href={`/diagnostic?studentId=${child.id}`}
          onClick={(e) => e.stopPropagation()}
          className="py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg text-center transition-colors"
        >
          🎯 Diagnostic
        </a>
      </div>
    </Link>
  );
}

// ─── Helpers ───

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Export helper for tests ───

export { formatRelativeTime, PERSONA_EMOJI, GRADE_LABELS };
