"use client";

/**
 * Tier2Home — Grades 4 through 7
 *
 * Dark background, three sections:
 * - Mission briefing card
 * - 3 stat cards (level, streak, goal)
 * - Recent badges
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
};

interface GamProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalMastered: number;
  streakDays: number;
  badges: Array<{ id: string; name: string; emoji: string; earnedAt: string }>;
}

export default function Tier2Home() {
  const { studentId, displayName, avatarPersonaId, level, xp } = useChild();
  const [gam, setGam] = useState<GamProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/student/${studentId}/gamification`);
        if (res.ok) {
          const data = await res.json();
          setGam(data);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  const emoji = PERSONA_EMOJI[avatarPersonaId] || "🐻";
  const streakDays = gam?.streakDays ?? 0;
  const xpToNext = gam?.xpToNextLevel ?? 100;
  const xpProgress = xpToNext > 0 ? Math.min(((xp % xpToNext) / xpToNext) * 100, 100) : 0;

  return (
    <div className="space-y-5">
      {/* Mission Briefing */}
      <div className="bg-gradient-to-r from-[#1a1f3a] to-[#1e2a4a] rounded-2xl p-6 border-l-4 border-purple-500 relative overflow-hidden">
        <div className="absolute top-3 right-4 text-5xl opacity-20">
          {emoji}
        </div>
        <p className="text-xs text-purple-400 uppercase tracking-widest font-bold mb-2">
          TODAY&apos;S MISSION
        </p>
        <h2 className="text-xl font-bold text-white mb-1">
          Hey {displayName}! Time to level up!
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Keep your streak going and master new concepts today.
        </p>
        <Link
          href={`/session?studentId=${studentId}`}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
        >
          Start Mission →
        </Link>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Level + XP */}
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-bold text-purple-400">Lv. {level}</p>
          <div className="w-full h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{xp} XP</p>
        </div>

        {/* Streak */}
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-bold text-orange-400">
            {streakDays > 0 ? `🔥 ${streakDays}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {streakDays === 1 ? "day streak" : "day streak"}
          </p>
        </div>

        {/* Mastered */}
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-bold text-green-400">
            {gam?.totalMastered ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">mastered</p>
        </div>
      </div>

      {/* Recent Badges */}
      {gam && gam.badges.length > 0 && (
        <div className="bg-[#141d30] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">
              Recent Badges
            </h3>
            <Link
              href="/kid/constellation"
              className="text-xs text-purple-400 hover:underline"
            >
              See all →
            </Link>
          </div>
          <div className="flex gap-3">
            {gam.badges.slice(-3).map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-lg">{badge.emoji}</span>
                <span className="text-xs text-gray-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
