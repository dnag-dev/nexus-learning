"use client";

/**
 * Kid Dashboard (Game Lobby) — The child's gamified home screen.
 *
 * Shows avatar, XP bar, streak, badges, boss challenges, subject selector,
 * optional focus text input, and a big "Start Learning" button.
 * Dark space theme.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import NexusScore from "@/components/gamification/NexusScore";
import TopicTree from "@/components/constellation/TopicTree";

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

interface NexusScoreData {
  nexusScore: number;
  accuracy: number;
  speed: number;
  retention: number;
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
  const router = useRouter();
  const { studentId, displayName, avatarPersonaId } = useChild();

  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<GamificationData | null>(
    null
  );
  const [reviews, setReviews] = useState<ReviewData | null>(null);
  const [avgNexusScore, setAvgNexusScore] = useState<NexusScoreData | null>(null);

  // ─── Subject selection + focus text ───
  const [selectedSubject, setSelectedSubject] = useState<"MATH" | "ENGLISH">("MATH");
  const [focusText, setFocusText] = useState("");
  const [startingSession, setStartingSession] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    try {
      const [gamRes, revRes, nexusRes] = await Promise.all([
        fetch(`/api/student/${studentId}/gamification`),
        fetch(`/api/student/${studentId}/reviews`),
        fetch(`/api/student/${studentId}/nexus-score`),
      ]);

      if (gamRes.ok) {
        const data = await gamRes.json();
        setGamification(data);
      }

      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data);
      }

      if (nexusRes.ok) {
        const data = await nexusRes.json();
        // Calculate average nexus score across all nodes
        if (data.nodes && data.nodes.length > 0) {
          const nodes = data.nodes as Array<{ nexusScore: number; accuracy: number; speed: number; retention: number }>;
          const avg = {
            nexusScore: Math.round(nodes.reduce((sum: number, n: { nexusScore: number }) => sum + n.nexusScore, 0) / nodes.length),
            accuracy: Math.round(nodes.reduce((sum: number, n: { accuracy: number }) => sum + n.accuracy, 0) / nodes.length),
            speed: Math.round(nodes.reduce((sum: number, n: { speed: number }) => sum + n.speed, 0) / nodes.length),
            retention: Math.round(nodes.reduce((sum: number, n: { retention: number }) => sum + n.retention, 0) / nodes.length),
          };
          setAvgNexusScore(avg);
        }
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

  /**
   * Start a learning session.
   * If focus text was provided, save it as a kid blueprint first,
   * then navigate to the session with the selected subject.
   */
  const handleStartLearning = useCallback(async () => {
    setStartingSession(true);
    try {
      // If the kid typed focus text, save it as a blueprint (non-blocking on failure)
      if (focusText.trim()) {
        try {
          await fetch(`/api/parent/child/${studentId}/blueprint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: focusText.trim(),
              source: "KID",
              subject: selectedSubject,
            }),
          });
        } catch {
          // Blueprint save is non-critical — proceed to session regardless
          console.warn("Blueprint save failed (non-critical)");
        }
      }

      // Navigate to session with subject parameter
      router.push(
        `/session?studentId=${studentId}&subject=${selectedSubject}&returnTo=/kid`
      );
    } catch {
      setStartingSession(false);
    }
  }, [studentId, selectedSubject, focusText, router]);

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

      {/* Subject Selection */}
      <div className="space-y-3">
        <p className="text-sm text-gray-400 text-center">Choose your subject</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedSubject("MATH")}
            className={`py-4 rounded-xl border-2 text-center font-semibold transition-all ${
              selectedSubject === "MATH"
                ? "border-aauti-primary bg-aauti-primary/20 text-white shadow-lg shadow-aauti-primary/20"
                : "border-white/10 bg-[#1A2744] text-gray-300 hover:border-white/20"
            }`}
          >
            🔢 Math
          </button>
          <button
            onClick={() => setSelectedSubject("ENGLISH")}
            className={`py-4 rounded-xl border-2 text-center font-semibold transition-all ${
              selectedSubject === "ENGLISH"
                ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
                : "border-white/10 bg-[#1A2744] text-gray-300 hover:border-white/20"
            }`}
          >
            📖 English
          </button>
        </div>

        {/* Optional focus text input */}
        <div className="bg-[#1A2744] rounded-xl border border-white/5 p-3">
          <input
            type="text"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder={
              selectedSubject === "ENGLISH"
                ? "What do you want to learn? e.g. commas, nouns..."
                : "What do you want to practice? e.g. fractions, addition..."
            }
            className="w-full bg-transparent text-white placeholder:text-gray-500 text-sm outline-none"
            maxLength={200}
          />
        </div>
      </div>

      {/* Start Learning CTA */}
      <button
        onClick={handleStartLearning}
        disabled={startingSession}
        className="block w-full py-5 text-center text-xl font-bold text-white rounded-2xl bg-gradient-to-r from-aauti-primary to-aauti-secondary hover:from-aauti-primary/90 hover:to-aauti-secondary/90 transition-all shadow-lg shadow-aauti-primary/25 active:scale-[0.98] disabled:opacity-50"
      >
        {startingSession ? "Preparing..." : "🚀 Start Learning!"}
      </button>

      {/* Streak Widget */}
      <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
        <StreakWidget streak={streak} />
      </div>

      {/* Nexus Score Summary */}
      {avgNexusScore && avgNexusScore.nexusScore > 0 && (
        <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
          <h3 className="text-white font-semibold mb-3 text-center">Nexus Score</h3>
          <NexusScore
            score={avgNexusScore.nexusScore}
            accuracy={avgNexusScore.accuracy}
            speed={avgNexusScore.speed}
            retention={avgNexusScore.retention}
            size="md"
          />
        </div>
      )}

      {/* Topic Tree Preview */}
      <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Learning Path</h3>
          <Link
            href="/kid/constellation"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            View All →
          </Link>
        </div>
        <TopicTree
          studentId={studentId}
          domain={selectedSubject === "MATH" ? "MATH" : "ENGLISH"}
          compact
        />
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
