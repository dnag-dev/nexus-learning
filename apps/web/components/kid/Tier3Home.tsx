"use client";

/**
 * Tier3Home — Grades 8 through 12
 *
 * Clean, minimal, data-driven:
 * - Welcome + Continue button
 * - Stats row: level, streak, mastered, badges
 * - Learning Progress from mastery data
 * - Bottom links
 *
 * Uses /api/student/:id/gamification which returns:
 *   { xp, level, streak: { current, ... } | null,
 *     badges: [{ badgeType, category, earnedAt }],
 *     masteryMap: [{ nodeCode, nodeTitle, domain, level }] }
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";

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
    level: string;
    bktProbability: number;
  }>;
}

export default function Tier3Home() {
  const { studentId, displayName } = useChild();
  const [gam, setGam] = useState<GamData | null>(null);
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

  const streakDays = gam?.streak?.current ?? 0;
  const totalMastered = gam?.masteryMap?.filter((n) => n.level === "MASTERED").length ?? 0;
  const totalBadges = gam?.badges?.length ?? 0;
  const currentLevel = gam?.level ?? 1;

  // Show nodes with progress (proficient or above)
  const recentMastery = (gam?.masteryMap ?? [])
    .filter((n) => n.level === "PROFICIENT" || n.level === "ADVANCED" || n.level === "MASTERED")
    .slice(0, 4);

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
          📊 Review
        </Link>
      </div>
    </div>
  );
}
