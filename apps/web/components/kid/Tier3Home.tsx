"use client";

/**
 * Tier3Home — Grades 8 through 12
 *
 * Clean, minimal, data-driven:
 * - Subject tabs + Welcome + Continue button (with next concept name)
 * - Topic search (prompt-based learning)
 * - Stats row: level, streak, mastered, badges
 * - Learning Progress from mastery data
 * - Your Progress (goal + bar + ETA)
 * - Bottom links
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
import TopicSearchInput from "@/components/kid/TopicSearchInput";
import SubjectTabs, { type Subject } from "@/components/kid/SubjectTabs";

interface GamData {
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
  } | null;
  badges: Array<{ badgeType: string; category: string; earnedAt: string }>;
  masteryMap: Array<{
    nodeCode: string;
    nodeTitle: string;
    domain: string;
    subject: string;
    level: string;
    bktProbability: number;
  }>;
}

interface NextConceptData {
  title: string | null;
  goalName?: string | null;
}

export default function Tier3Home() {
  const { studentId, displayName } = useChild();
  const [gam, setGam] = useState<GamData | null>(null);
  const [nextConceptData, setNextConceptData] = useState<NextConceptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject>("MATH");

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
        setNextConceptData(null); // clear stale data while loading
        const res = await fetch(`/api/student/${studentId}/next-concept?subject=${subject}`);
        if (res.ok) setNextConceptData(await res.json());
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
  const totalBadges = gam?.badges?.length ?? 0;
  const currentLevel = gam?.level ?? 1;

  // Show nodes with progress (proficient or above), filtered by selected subject
  const recentMastery = (gam?.masteryMap ?? [])
    .filter((n) =>
      (n.level === "PROFICIENT" || n.level === "ADVANCED" || n.level === "MASTERED") &&
      n.domain === subject
    )
    .slice(0, 4);

  const nextConcept = nextConceptData?.title;
  const goalName = nextConceptData?.goalName;

  return (
    <div className="space-y-5">
      {/* ⚠️ Subject switching — Math / English */}
      <SubjectTabs
        subject={subject}
        onSubjectChange={setSubject}
        variant="teen"
      />

      {/* Welcome + Continue */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-gray-500">
            {nextConcept ? `Next up: ${nextConcept}` : "Pick up where you left off."}
          </p>
        </div>
        <Link
          href={`/session?studentId=${studentId}&subject=${subject}&returnTo=/kid`}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Continue →
        </Link>
      </div>

      {/* ⚠️ Prompt-based learning — topic search input */}
      <TopicSearchInput
        studentId={studentId}
        subject={subject}
        variant="teen"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#141d30] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-xl font-bold text-purple-400">Lv. {currentLevel}</p>
          <p className="text-xs text-gray-500">level</p>
        </div>
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
          <p className="text-xl font-bold text-blue-400">{totalBadges}</p>
          <p className="text-xs text-gray-500">badges</p>
        </div>
      </div>

      {/* Learning Progress */}
      {recentMastery.length > 0 && (
        <div className="bg-[#141d30] rounded-xl border border-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold text-gray-300">
              Learning Progress
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {recentMastery.map((node) => (
              <div
                key={node.nodeCode}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-300">
                    {node.nodeTitle}
                  </p>
                  <p className="text-xs text-gray-600">
                    {node.domain === "MATH" ? "🔢 Math" : "📖 English"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    node.level === "MASTERED"
                      ? "bg-green-500/20 text-green-400"
                      : node.level === "ADVANCED"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {node.level === "MASTERED"
                    ? "⭐ Mastered"
                    : node.level === "ADVANCED"
                      ? "Advanced"
                      : "Proficient"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Links — Phase 13: Added Fluency Zone */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/kid/constellation"
          className="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          🌌 Constellation
        </Link>
        <Link
          href={`/kid/fluency-zone?studentId=${studentId}`}
          className="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-cyan-500/10 hover:border-cyan-500/30"
        >
          ⚡ Fluency Zone
        </Link>
        <Link
          href="/goals"
          className="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          🎯 Goals
        </Link>
        <Link
          href="/kid/review"
          className="py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg text-center transition-colors border border-white/5"
        >
          📊 Review
        </Link>
      </div>

      {/* Your Progress */}
      <div className="bg-[#141d30] rounded-xl p-5 border border-white/5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Your Progress
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-400">{totalMastered}</p>
            <p className="text-[10px] text-gray-500 uppercase">Mastered</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-400">{streakDays > 0 ? `🔥 ${streakDays}` : "0"}</p>
            <p className="text-[10px] text-gray-500 uppercase">Streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{totalBadges}</p>
            <p className="text-[10px] text-gray-500 uppercase">Badges</p>
          </div>
        </div>
      </div>
    </div>
  );
}
