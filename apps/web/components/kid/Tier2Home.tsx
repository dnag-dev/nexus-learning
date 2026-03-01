"use client";

/**
 * Tier2Home — Grades 4 through 7
 *
 * Dark background, four sections:
 * - Mission briefing card (with real next concept & persona avatar)
 * - 3 stat cards (level, streak, mastered)
 * - Recent badges
 * - Your Progress (goal name + progress bar + ETA)
 *
 * Uses /api/student/:id/gamification AND /api/gps/dashboard
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
import { getPersonaById } from "@/lib/personas/persona-config";

// Map badgeType to display info
const BADGE_DISPLAY: Record<string, { name: string; emoji: string }> = {
  first_session: { name: "First Steps", emoji: "🎯" },
  session_10: { name: "10 Sessions", emoji: "🏅" },
  session_50: { name: "50 Sessions", emoji: "🏆" },
  session_100: { name: "Century", emoji: "💯" },
  mastery_1: { name: "First Star", emoji: "⭐" },
  mastery_5: { name: "Rising Star", emoji: "🌟" },
  mastery_10: { name: "Star Cluster", emoji: "✨" },
  mastery_25: { name: "Galaxy", emoji: "🌌" },
  mastery_50: { name: "Constellation", emoji: "💫" },
  perfect_session: { name: "Perfect!", emoji: "💎" },
  streak_3: { name: "3-Day Streak", emoji: "🔥" },
  streak_7: { name: "Week Warrior", emoji: "🔥" },
  streak_14: { name: "Fortnight", emoji: "🔥" },
  streak_30: { name: "Monthly", emoji: "🔥" },
  early_bird: { name: "Early Bird", emoji: "🐦" },
  night_owl: { name: "Night Owl", emoji: "🦉" },
};

interface GamData {
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  } | null;
  badges: Array<{ badgeType: string; category: string; earnedAt: string }>;
  masteryMap: Array<{ level: string }>;
}

interface GPSData {
  goal?: { name: string };
  progress?: { masteredCount: number; totalConcepts: number; percentage: number };
  eta?: { projectedDate: string };
  todaysMission?: { title: string; description: string; estimatedHours: number };
}

export default function Tier2Home() {
  const { studentId, displayName, avatarPersonaId, level, xp } = useChild();
  const [gam, setGam] = useState<GamData | null>(null);
  const [gps, setGps] = useState<GPSData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get persona info for the avatar
  const persona = getPersonaById(avatarPersonaId);
  const personaEmoji = persona?.avatarPlaceholder || "🤖";

  useEffect(() => {
    async function fetchData() {
      try {
        const [gamRes, gpsRes] = await Promise.allSettled([
          fetch(`/api/student/${studentId}/gamification`),
          fetch(`/api/gps/dashboard?studentId=${studentId}`),
        ]);

        if (gamRes.status === "fulfilled" && gamRes.value.ok) {
          setGam(await gamRes.value.json());
        }
        if (gpsRes.status === "fulfilled" && gpsRes.value.ok) {
          setGps(await gpsRes.value.json());
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  const streakDays = gam?.streak?.current ?? 0;
  const totalMastered = gam?.masteryMap?.filter((n) => n.level === "MASTERED").length ?? 0;
  const xpForLevel = 100;
  const xpProgress = Math.min(((xp % xpForLevel) / xpForLevel) * 100, 100);

  // Map raw badges to display format
  const displayBadges = (gam?.badges ?? []).map((b) => {
    const info = BADGE_DISPLAY[b.badgeType] || { name: b.badgeType, emoji: "🏅" };
    return { id: b.badgeType, name: info.name, emoji: info.emoji, earnedAt: b.earnedAt };
  });

  // Mission card data from GPS
  const missionTitle = gps?.todaysMission?.title;
  const missionDesc = gps?.todaysMission?.description;
  const missionEst = gps?.todaysMission?.estimatedHours
    ? Math.round(gps.todaysMission.estimatedHours * 60)
    : null;

  // Progress data
  const goalName = gps?.goal?.name;
  const progressPct = gps?.progress?.percentage ?? 0;
  const etaDate = gps?.eta?.projectedDate;
  const etaFormatted = etaDate
    ? new Date(etaDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-5">
      {/* Mission Briefing */}
      <div className="bg-gradient-to-r from-[#1a1f3a] to-[#1e2a4a] rounded-2xl p-6 border-l-4 border-purple-500 relative overflow-hidden">
        {/* Persona avatar — circular with gold ring */}
        <div className="absolute top-4 right-4 w-[60px] h-[60px] rounded-full bg-[#0D1B2A] ring-2 ring-amber-400 flex items-center justify-center text-3xl">
          {personaEmoji}
        </div>

        <p className="text-xs text-purple-400 uppercase tracking-widest font-bold mb-2">
          TODAY&apos;S MISSION
        </p>

        {missionTitle ? (
          <>
            <h2 className="text-xl font-bold text-white mb-1 pr-16">
              {missionTitle}
            </h2>
            {missionDesc && (
              <p className="text-sm text-gray-400 mb-1 pr-16 line-clamp-2">
                {missionDesc}
              </p>
            )}
            {missionEst && (
              <p className="text-xs text-gray-500 mb-4">
                Est. {missionEst} minutes
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-1 pr-16">
              Hey {displayName}! Time to level up!
            </h2>
            <p className="text-sm text-gray-400 mb-4 pr-16">
              Keep your streak going and master new concepts today.
            </p>
          </>
        )}

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
            day streak
          </p>
        </div>

        {/* Mastered */}
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-bold text-green-400">
            {totalMastered}
          </p>
          <p className="text-xs text-gray-500 mt-1">mastered</p>
        </div>
      </div>

      {/* Recent Badges */}
      {displayBadges.length > 0 && (
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
          <div className="flex gap-3 flex-wrap">
            {displayBadges.slice(-3).map((badge) => (
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

      {/* Secondary Nav */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/kid/constellation"
          className="flex items-center justify-center gap-2 py-4 bg-[#141d30] rounded-xl border border-white/5 text-white font-medium hover:border-purple-500/30 transition-colors text-sm"
        >
          🌌 Constellation
        </Link>
        <Link
          href="/kid/review"
          className="flex items-center justify-center gap-2 py-4 bg-[#141d30] rounded-xl border border-white/5 text-white font-medium hover:border-purple-500/30 transition-colors text-sm"
        >
          📊 Review
        </Link>
      </div>

      {/* Your Progress — Fix 6: fill empty bottom space */}
      {goalName && (
        <div className="bg-[#141d30] rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Your Progress
          </h3>
          <p className="text-white text-sm font-medium mb-2">{goalName}</p>
          <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{Math.round(progressPct)}% complete</span>
            {etaFormatted && <span>ETA: {etaFormatted}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
