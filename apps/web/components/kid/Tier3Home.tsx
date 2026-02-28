"use client";

/**
 * Tier3Home — Grades 8 through 12
 *
 * Clean, minimal, data-driven:
 * - Goal bar with progress + ETA
 * - Learning path visualization
 * - Stats row: streak, mastered, hours, days to goal
 * - Recent activity log
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";

interface GamProfile {
  level: number;
  xp: number;
  totalMastered: number;
  streakDays: number;
}

interface RecentSession {
  id: string;
  date: string;
  durationMinutes: number;
  nodesPracticed: string[];
  accuracy: number;
}

export default function Tier3Home() {
  const { studentId, displayName } = useChild();
  const [gam, setGam] = useState<GamProfile | null>(null);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamRes, progressRes] = await Promise.all([
          fetch(`/api/student/${studentId}/gamification`),
          fetch(`/api/parent/child/${studentId}/progress`),
        ]);

        if (gamRes.ok) {
          const data = await gamRes.json();
          setGam(data);
        }

        if (progressRes.ok) {
          const data = await progressRes.json();
          setSessions(data.recentSessions?.slice(0, 3) || []);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  const streakDays = gam?.streakDays ?? 0;
  const totalMastered = gam?.totalMastered ?? 0;

  // Calculate hours this week from recent sessions
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekMinutes = sessions
    .filter((s) => new Date(s.date).getTime() > weekAgo)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekHours = (weekMinutes / 60).toFixed(1);

  return (
    <div className="space-y-5">
      {/* Welcome + Continue */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-gray-500">
            Pick up where you left off.
          </p>
        </div>
        <Link
          href={`/session?studentId=${studentId}`}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Continue →
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-xl font-bold text-orange-400">
            {streakDays > 0 ? `🔥 ${streakDays}` : "0"}
          </p>
          <p className="text-xs text-gray-500">streak</p>
        </div>
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-xl font-bold text-green-400">{totalMastered}</p>
          <p className="text-xs text-gray-500">mastered</p>
        </div>
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-xl font-bold text-blue-400">{weekHours}h</p>
          <p className="text-xs text-gray-500">this week</p>
        </div>
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-xl font-bold text-purple-400">Lv. {gam?.level ?? 1}</p>
          <p className="text-xs text-gray-500">level</p>
        </div>
      </div>

      {/* Recent Activity */}
      {sessions.length > 0 && (
        <div className="bg-[#141d30] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-gray-300">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-300">
                    {s.nodesPracticed.length} concept
                    {s.nodesPracticed.length !== 1 ? "s" : ""} · {s.durationMinutes}m
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(s.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    s.accuracy >= 80
                      ? "text-green-400"
                      : s.accuracy >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {s.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Links */}
      <div className="flex gap-3">
        <Link
          href="/kid/constellation"
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          🌌 Constellation Map
        </Link>
        <Link
          href="/goals"
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          🎯 Goals
        </Link>
        <Link
          href="/kid/review"
          className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          📊 Stats
        </Link>
      </div>
    </div>
  );
}
