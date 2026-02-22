"use client";

/**
 * StudentTable — Sortable table of students in a class.
 */

import { useState } from "react";
import Link from "next/link";

export interface StudentRow {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
  currentStreak: number;
  masteredCount: number;
  totalNodes: number;
  masteryPercent: number;
  lastActiveAt: string | null;
  activeAlertCount: number;
}

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

type SortKey = "displayName" | "masteryPercent" | "currentStreak" | "lastActiveAt";

interface StudentTableProps {
  students: StudentRow[];
  classId: string;
}

export default function StudentTable({ students, classId }: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "displayName");
    }
  };

  const sorted = [...students].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "displayName":
        cmp = a.displayName.localeCompare(b.displayName);
        break;
      case "masteryPercent":
        cmp = a.masteryPercent - b.masteryPercent;
        break;
      case "currentStreak":
        cmp = a.currentStreak - b.currentStreak;
        break;
      case "lastActiveAt":
        cmp =
          (a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0) -
          (b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0);
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({
    label,
    field,
  }: {
    label: string;
    field: SortKey;
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(field)}
    >
      {label}{" "}
      {sortKey === field ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  const getMasteryColor = (pct: number) => {
    if (pct >= 80) return "text-green-700 bg-green-50";
    if (pct >= 50) return "text-blue-700 bg-blue-50";
    if (pct >= 25) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <SortHeader label="Student" field="displayName" />
              <SortHeader label="Mastery" field="masteryPercent" />
              <SortHeader label="Streak" field="currentStreak" />
              <SortHeader label="Last Active" field="lastActiveAt" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alerts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/teacher-dashboard/class/${classId}/student/${student.id}`}
                    className="flex items-center gap-2 hover:text-blue-600"
                  >
                    <span className="text-lg">
                      {PERSONA_EMOJI[student.avatarPersonaId] || "👤"}
                    </span>
                    <span className="font-medium text-sm text-gray-900">
                      {student.displayName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getMasteryColor(student.masteryPercent)}`}
                  >
                    {student.masteryPercent}%
                  </span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({student.masteredCount}/{student.totalNodes})
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">
                    {student.currentStreak > 0 ? (
                      <>
                        🔥 {student.currentStreak}d
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {student.lastActiveAt
                      ? formatDate(student.lastActiveAt)
                      : "Never"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {student.activeAlertCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {student.activeAlertCount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          No students in this class yet.
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
