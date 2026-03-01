"use client";

/**
 * ChildCard — Phase 9 UX Overhaul
 *
 * Redesigned card with:
 * - Avatar + name + grade + level badge
 * - Status banner (practiced today / not yet)
 * - 3 stats: sessions this week, concepts mastered, streak
 * - Last active
 * - Two buttons: View Progress / Start Session
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
  nextConceptTitle?: string | null;
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
  G6: "Grade 6",
  G7: "Grade 7",
  G8: "Grade 8",
  G9: "Grade 9",
  G10: "Grade 10",
  G11: "Grade 11",
  G12: "Grade 12",
};

// ─── Component ───

export default function ChildCard({ child }: ChildCardProps) {
  const emoji = PERSONA_EMOJI[child.avatarPersonaId] || "👤";
  const gradeLabel = GRADE_LABELS[child.gradeLevel] || child.gradeLevel;
  const practicedToday = child.todaySessions > 0;
  const lastActiveLabel = child.lastActiveAt
    ? formatRelativeTime(new Date(child.lastActiveAt))
    : "Never";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all duration-200">
      {/* Header: avatar + name + grade + level */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl w-10 h-10 flex items-center justify-center">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate text-[15px]">
            {child.displayName}
          </h3>
          <p className="text-xs text-gray-500">{gradeLabel}</p>
        </div>
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          Lv. {child.level}
        </span>
      </div>

      {/* Status Banner */}
      <div
        className={`px-3 py-2 rounded-lg text-sm mb-3 ${
          practicedToday
            ? "bg-green-50 text-green-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        {practicedToday
          ? `✓ Practiced today · ${child.todayMinutes}m`
          : "Not yet today"}
      </div>

      {/* 3 Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {child.todaySessions}
          </p>
          <p className="text-xs text-gray-500">sessions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {child.nodesMasteredThisWeek}
          </p>
          <p className="text-xs text-gray-500">mastered</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {child.currentStreak > 0 ? `🔥 ${child.currentStreak}` : "—"}
          </p>
          <p className="text-xs text-gray-500">streak</p>
        </div>
      </div>

      {/* Next Up */}
      {child.nextConceptTitle && (
        <p className="text-xs text-purple-600 mb-2 truncate">
          Next up: <span className="font-medium">{child.nextConceptTitle}</span>
        </p>
      )}

      {/* Last Active */}
      <p className="text-xs text-gray-400 mb-4">
        Active {lastActiveLabel}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/child/${child.id}`}
          className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg text-center transition-colors"
        >
          View Progress →
        </Link>
        <a
          href={`/session?studentId=${child.id}`}
          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
        >
          Start Session →
        </a>
      </div>
    </div>
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
