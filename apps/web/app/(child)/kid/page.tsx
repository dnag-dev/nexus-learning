"use client";

/**
 * Kid Dashboard (Game Lobby) — The child's gamified home screen.
 *
 * Shows avatar, XP bar, streak, badges, boss challenges, and a big
 * "Start Learning" button. Dark space theme.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
import XPBar from "@/components/gamification/XPBar";
import StreakWidget from "@/components/gamification/StreakWidget";
import BadgeDisplay from "@/components/gamification/BadgeDisplay";
import BossChallengeCard from "@/components/gamification/BossChallengeCard";
import {
  type BossChallengeState,
  BOSS_CHARACTERS,
  CHALLENGE_CONFIGS,
} from "@/lib/gamification";
import ReviewDueWidget from "@/components/review/ReviewDueWidget";

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🌙",
  rex: "🦖",
  nova: "⭐",
  pip: "🐧",
  zara: "🦋",
  finn: "🐬",
  ruby: "💎",
  echo: "⏳",
  sage: "🧙",
  bolt: "💻",
  ivy: "🌿",
  max: "🏆",
  aria: "🎵",
};

interface GamificationData {
  xp: number;
  level: number;
  streak: {
    type: "daily";
    current: number;
    longest: number;
    lastActiveDate: string;
    isActive: boolean;
    freezesAvailable: number;
    freezesUsed: number;
  } | null;
  badges: Array<{
    badgeType: string;
    category: string;
    earnedAt: string;
    displayed: boolean;
  }>;
  bossChallenges: Array<{
    id: string;
    status: string;
    challengeType: string;
    score: number;
    completedAt: string | null;
  }>;
  masteryMap: Array<{
    nodeId: string;
    level: string;
    bktProbability: number;
  }>;
}

interface ReviewData {
  summary: {
    dueNow: number;
    overdueCount: number;
    estimatedMinutes: number;
    urgency: "none" | "low" | "medium" | "high";
  };
}

const DEFAULT_STREAK = {
  type: "daily" as const,
  current: 0,
  longest: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  isActive: false,
  freezesAvailable: 0,
  freezesUsed: 0,
};

export default function KidDashboardPage() {
  const { studentId, displayName, avatarPersonaId } = useChild();

  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<GamificationData | null>(
    null
  );
  const [reviews, setReviews] = useState<ReviewData | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    try {
      const [gamRes, revRes] = await Promise.all([
        fetch(`/api/student/${studentId}/gamification`),
        fetch(`/api/student/${studentId}/reviews`),
      ]);

      if (gamRes.ok) {
        const data = await gamRes.json();
        setGamification(data);
      }

      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const emoji = PERSONA_EMOJI[avatarPersonaId] ?? "⭐";
  const xp = gamification?.xp ?? 0;
  const level = gamification?.level ?? 1;
  const streak = gamification?.streak ?? DEFAULT_STREAK;
  const earnedBadgeIds = (gamification?.badges ?? []).map((b) => b.badgeType);
  const masteredCount = (gamification?.masteryMap ?? []).filter(
    (n) => n.level === "MASTERED"
  ).length;

  // Find first available boss challenge
  const activeBoss = (gamification?.bossChallenges ?? []).find(
    (b) => b.status === "AVAILABLE" || b.status === "ACTIVE"
  );
  const bossState: BossChallengeState | null = activeBoss
    ? {
        challengeId: activeBoss.id,
        status: activeBoss.status as BossChallengeState["status"],
        character: BOSS_CHARACTERS[0],
        config:
          CHALLENGE_CONFIGS[
            activeBoss.challengeType as keyof typeof CHALLENGE_CONFIGS
          ] ?? CHALLENGE_CONFIGS.SPEED_ROUND,
        nodeIds: [],
        questionsAnswered: 0,
        correctAnswers: 0,
        startedAt: null,
        timeSpentMs: 0,
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-bounce">🚀</div>
          <p className="text-gray-400 animate-pulse">
            Preparing your mission...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hero: Avatar + Greeting */}
      <div className="text-center pt-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-aauti-primary/30 to-aauti-secondary/30 flex items-center justify-center border-2 border-white/10 shadow-lg shadow-aauti-primary/20">
          <span className="text-5xl select-none">{emoji}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white">
          Hey, {displayName}! 🌟
        </h1>
        <p className="text-gray-400 text-sm">
          Level {level} Explorer
        </p>
      </div>

      {/* XP Bar */}
      <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
        <XPBar xp={xp} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1A2744] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xl font-bold text-white">{streak.current}</div>
          <div className="text-xs text-gray-400">
            day streak
          </div>
        </div>
        <div className="bg-[#1A2744] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-xl font-bold text-white">
            {earnedBadgeIds.length}
          </div>
          <div className="text-xs text-gray-400">badges</div>
        </div>
        <div className="bg-[#1A2744] rounded-xl border border-white/5 p-4 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-xl font-bold text-white">{masteredCount}</div>
          <div className="text-xs text-gray-400">mastered</div>
        </div>
      </div>

      {/* Start Learning CTA */}
      <Link
        href={`/session?studentId=${studentId}&returnTo=/kid`}
        className="block w-full py-5 text-center text-xl font-bold text-white rounded-2xl bg-gradient-to-r from-aauti-primary to-aauti-secondary hover:from-aauti-primary/90 hover:to-aauti-secondary/90 transition-all shadow-lg shadow-aauti-primary/25 active:scale-[0.98]"
      >
        🚀 Start Learning!
      </Link>

      {/* Streak Widget */}
      <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
        <StreakWidget streak={streak} />
      </div>

      {/* Boss Challenge (if available) */}
      {bossState && (
        <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
          <BossChallengeCard challenge={bossState} />
        </div>
      )}

      {/* Review Due (if any) */}
      {reviews && reviews.summary.dueNow > 0 && (
        <Link
          href={`/kid/review`}
          className="block bg-[#1A2744] rounded-2xl border border-white/5 p-4 hover:border-aauti-primary/30 transition-colors"
        >
          <ReviewDueWidget
            dueNow={reviews.summary.dueNow}
            overdueCount={reviews.summary.overdueCount}
            estimatedMinutes={reviews.summary.estimatedMinutes}
            urgency={reviews.summary.urgency}
            onStartReview={() => {}}
            compact
          />
        </Link>
      )}

      {/* Secondary Nav */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/kid/constellation"
          className="flex items-center justify-center gap-2 py-4 bg-[#1A2744] rounded-xl border border-white/5 text-white font-medium hover:border-aauti-primary/30 transition-colors"
        >
          🌌 My Constellation
        </Link>
        <Link
          href="/kid/constellation"
          className="flex items-center justify-center gap-2 py-4 bg-[#1A2744] rounded-xl border border-white/5 text-white font-medium hover:border-aauti-accent/30 transition-colors"
        >
          🏅 My Badges
        </Link>
      </div>

      {/* Recent Badges */}
      {earnedBadgeIds.length > 0 && (
        <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
          <h3 className="text-white font-semibold mb-3">🏅 Recent Badges</h3>
          <BadgeDisplay earnedBadgeIds={earnedBadgeIds} compact />
        </div>
      )}
    </div>
  );
}
