"use client";

/**
 * Tier2Home — Grades 4 through 7
 *
 * Dark background, four sections:
 * - Subject tabs + Mission briefing card (with real next concept & persona avatar)
 * - Topic search input (prompt-based learning)
 * - 3 stat cards (level, streak, mastered)
 * - Recent badges
 * - Your Progress (goal name + progress bar + ETA)
 *
 * ⚠️  CRITICAL FEATURES (DO NOT REMOVE):
 * 1. SubjectTabs — subject switching (Math ↔ English)
 * 2. TopicSearchInput — prompt-based learning
 *
 * Uses /api/student/:id/gamification AND /api/student/:id/next-concept
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
import { getPersonaById } from "@/lib/personas/persona-config";
import TopicSearchInput from "@/components/kid/TopicSearchInput";
import SubjectTabs, { type Subject } from "@/components/kid/SubjectTabs";

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
  masteryMap: Array<{ level: string; domain: string; subject: string; gradeLevel: string; bktProbability: number }>;
}

interface NextConceptData {
  title: string | null;
  nodeCode?: string;
  description?: string;
  estimatedMinutes?: number;
  unlocks?: string | null;
  goalName?: string | null;
  gradeLevel?: string;
}

export default function Tier2Home() {
  const { studentId, displayName, avatarPersonaId, level, xp: contextXp, gradeLevel } = useChild();
  const [gam, setGam] = useState<GamData | null>(null);
  // Single source of truth: prefer fresh gamification XP over stale context value
  const xp = gam?.xp ?? contextXp;
  const [nextConcept, setNextConcept] = useState<NextConceptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject>("MATH");

  // Get persona info for the avatar
  const persona = getPersonaById(avatarPersonaId);
  const personaEmoji = persona?.avatarPlaceholder || "🤖";

  // Re-fetch gamification once; re-fetch next-concept whenever subject changes
  useEffect(() => {
    async function fetchGam() {
      try {
        const res = await fetch(`/api/student/${studentId}/gamification`);
        if (res.ok) setGam(await res.json());
      } catch { /* non-critical */ }
    }
    fetchGam();
  }, [studentId]);

  useEffect(() => {
    async function fetchConcept() {
      try {
        setNextConcept(null); // clear stale data while loading
        const res = await fetch(`/api/student/${studentId}/next-concept?subject=${subject}`);
        if (res.ok) setNextConcept(await res.json());
      } catch { /* non-critical */ } finally {
        setLoading(false);
      }
    }
    fetchConcept();
  }, [studentId, subject]);

  const streakDays = gam?.streak?.current ?? 0;
  // Filter mastery count by active subject tab so stats reflect the selected subject
  const totalMastered = gam?.masteryMap?.filter(
    (n) => n.bktProbability >= 0.8 && n.subject === subject
  ).length ?? 0;
  const xpForLevel = 100;
  const xpProgress = Math.min(((xp % xpForLevel) / xpForLevel) * 100, 100);

  // Map raw badges to display format
  const displayBadges = (gam?.badges ?? []).map((b) => {
    const info = BADGE_DISPLAY[b.badgeType] || { name: b.badgeType, emoji: "🏅" };
    return { id: b.badgeType, name: info.name, emoji: info.emoji, earnedAt: b.earnedAt };
  });

  // Mission card data from next-concept API
  const missionTitle = nextConcept?.title;
  const missionDesc = nextConcept?.description;
  const missionEst = nextConcept?.estimatedMinutes ?? null;
  const missionUnlocks = nextConcept?.unlocks;

  // Grade progress: how many topics done at student's grade for current subject
  const gradeNodes = gam?.masteryMap?.filter(
    (n) => n.gradeLevel === gradeLevel && n.subject === subject
  ) ?? [];
  const gradeMastered = gradeNodes.filter((n) => n.bktProbability >= 0.8).length;
  const gradeTotal = gradeNodes.length;

  // Progress data
  const goalName = nextConcept?.goalName;

  return (
    <div className="space-y-5">
      {/* ⚠️ Subject switching — Math / English */}
      <SubjectTabs
        subject={subject}
        onSubjectChange={setSubject}
        variant="mid"
      />

      {/* Mission Briefing */}
      <div className="bg-white rounded-2xl p-6 border-l-4 border-purple-500 relative overflow-hidden shadow-sm border border-[#E2E8F0]">
        {/* Persona avatar — circular with gold ring */}
        <div className="absolute top-4 right-4 w-[60px] h-[60px] rounded-full bg-[#F8F9FF] ring-2 ring-amber-400 flex items-center justify-center text-3xl">
          {personaEmoji}
        </div>

        <p className="text-xs text-purple-600 uppercase tracking-widest font-bold mb-2">
          TODAY&apos;S MISSION
        </p>

        {missionTitle ? (
          <>
            <h2 className="text-xl font-bold text-[#1F2937] mb-1 pr-16">
              {missionTitle}
            </h2>
            {/* Grade + subject context */}
            <div className="text-xs text-[#6B7280] mt-0.5">
              Grade {gradeLevel} · {subject === "MATH" ? "Math" : "English"}
            </div>
            {/* Grade progress */}
            {gradeTotal > 0 && (
              <div className="text-xs text-[#6B7280] mt-0.5">
                {gradeMastered}/{gradeTotal} topics done this grade
              </div>
            )}
            {missionDesc && (
              <p className="text-sm text-[#6B7280] mb-1 pr-16 line-clamp-2 mt-1">
                {missionDesc}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-4 mt-1">
              {missionEst && <span>Est. {missionEst} min</span>}
              {missionUnlocks && <span>· Unlocks: {missionUnlocks} →</span>}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#1F2937] mb-1 pr-16">
              Hey {displayName}! Time to level up!
            </h2>
            <p className="text-sm text-[#6B7280] mb-4 pr-16">
              Keep your streak going and master new concepts today.
            </p>
          </>
        )}

        <Link
          href={`/session?studentId=${studentId}&subject=${subject}&returnTo=/kid`}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg"
        >
          Start Mission →
        </Link>
      </div>

      {/* ⚠️ Prompt-based learning — topic search input */}
      <TopicSearchInput
        studentId={studentId}
        subject={subject}
        variant="mid"
      />

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Level + XP */}
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
          <p className="text-2xl font-bold text-purple-400">Lv. {level}</p>
          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-1">{xp} XP</p>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
          <p className="text-2xl font-bold text-orange-400">
            {streakDays > 0 ? `🔥 ${streakDays}` : "—"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            day streak
          </p>
        </div>

        {/* Mastered */}
        <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
          <p className="text-2xl font-bold text-green-400">
            {totalMastered}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">mastered</p>
        </div>
      </div>

      {/* Recent Badges */}
      {displayBadges.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#1F2937]">
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
                className="flex items-center gap-2 bg-[#F3F4F6] rounded-lg px-3 py-2"
              >
                <span className="text-lg">{badge.emoji}</span>
                <span className="text-xs text-[#1F2937]">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Nav — Phase 13: Added Fluency Zone */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/kid/constellation"
          className="flex items-center justify-center gap-2 py-4 bg-white rounded-xl border border-[#E2E8F0] text-[#1F2937] font-medium hover:border-purple-500/30 transition-colors text-sm"
        >
          🌌 Constellation
        </Link>
        <Link
          href={`/kid/fluency-zone?studentId=${studentId}`}
          className="flex items-center justify-center gap-2 py-4 bg-white rounded-xl border border-[#E2E8F0] text-[#1F2937] font-medium hover:border-cyan-500/30 transition-colors text-sm"
        >
          ⚡ Fluency Zone
        </Link>
        <Link
          href="/kid/review"
          className="flex items-center justify-center gap-2 py-4 bg-white rounded-xl border border-[#E2E8F0] text-[#1F2937] font-medium hover:border-purple-500/30 transition-colors text-sm"
        >
          📊 Review
        </Link>
      </div>

      {/* Your Progress */}
      <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1F2937] mb-3">
          Your Progress
        </h3>
        {goalName ? (
          <p className="text-[#1F2937] text-sm font-medium mb-2">{goalName}</p>
        ) : missionTitle ? (
          <p className="text-[#1F2937] text-sm font-medium mb-2">Current: {missionTitle}</p>
        ) : (
          <p className="text-[#1F2937] text-sm font-medium mb-2">Learning Journey</p>
        )}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-purple-400">{totalMastered}</p>
            <p className="text-[10px] text-[#6B7280] uppercase">Concepts Mastered</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-400">{streakDays > 0 ? `🔥 ${streakDays}` : "0"}</p>
            <p className="text-[10px] text-[#6B7280] uppercase">Day Streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-400">{displayBadges.length}</p>
            <p className="text-[10px] text-[#6B7280] uppercase">Badges Earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
