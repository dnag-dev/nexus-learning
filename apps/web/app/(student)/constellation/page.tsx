"use client";

/**
 * Constellation Page — Star Map visualization with gamification dashboard.
 *
 * Fetches real data from:
 *  - GET /api/student/[id]/mastery-map → star map nodes + edges
 *  - GET /api/student/[id]/gamification → XP, level, streak, badges, boss
 *
 * Shows:
 *  - Interactive constellation star map (real mastery data)
 *  - XP bar + level
 *  - Streak widget
 *  - Badge showcase
 *  - Boss challenge card
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StarMap, {
  type StarNode,
  generateConstellationLayout,
} from "@/components/constellation/StarMap";
import StarDetail from "@/components/constellation/StarDetail";
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

// ─── Types for API responses ───

interface MasteryMapResponse {
  nodes: Array<{
    id: string;
    nodeCode: string;
    name: string;
    description: string;
    subject: string;
    gradeLevel: string;
    difficulty: number;
    masteryLevel: number; // 0-4
    masteryStatus: string;
    bktProbability: number;
    dueForReview?: boolean;
    prerequisites: string[];
    successors: string[];
  }>;
  edges: Array<{ from: string; to: string }>;
}

interface GamificationResponse {
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
    nodeCode: string;
    nodeTitle: string;
    domain: string;
    gradeLevel: string;
    level: string;
    bktProbability: number;
    difficulty: number;
  }>;
}

// ─── Default streak (used when no streak data exists yet) ───

const DEFAULT_STREAK = {
  type: "daily" as const,
  current: 0,
  longest: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  isActive: false,
  freezesAvailable: 0,
  freezesUsed: 0,
};

// ─── Page Component ───

export default function ConstellationPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ConstellationPage />
    </Suspense>
  );
}

function ConstellationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null);

  // Real data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gamification data
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(DEFAULT_STREAK);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [bossChallenge, setBossChallenge] = useState<BossChallengeState | null>(null);

  // Star map data
  const [constellationData, setConstellationData] = useState<ReturnType<typeof generateConstellationLayout> | null>(null);

  // Review data
  const [reviewDueNow, setReviewDueNow] = useState(0);
  const [reviewOverdue, setReviewOverdue] = useState(0);
  const [reviewMinutes, setReviewMinutes] = useState(0);
  const [reviewUrgency, setReviewUrgency] = useState<"none" | "low" | "medium" | "high">("none");

  // ─── Fetch data ───

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [masteryRes, gamRes, reviewRes] = await Promise.all([
        fetch(`/api/student/${STUDENT_ID}/mastery-map`),
        fetch(`/api/student/${STUDENT_ID}/gamification`),
        fetch(`/api/student/${STUDENT_ID}/reviews`),
      ]);

      // Handle mastery map
      if (masteryRes.ok) {
        const masteryData: MasteryMapResponse = await masteryRes.json();

        if (masteryData.nodes.length > 0) {
          const constellation = generateConstellationLayout(
            masteryData.nodes,
            masteryData.edges
          );
          setConstellationData(constellation);
        }
      }

      // Handle gamification data
      if (gamRes.ok) {
        const gamData: GamificationResponse = await gamRes.json();

        setXP(gamData.xp);
        setLevel(gamData.level);

        // Streak
        if (gamData.streak) {
          setStreak(gamData.streak);
        }

        // Badges — map badge types to badge IDs
        setEarnedBadgeIds(gamData.badges.map((b) => b.badgeType));

        // Boss challenge — convert most recent AVAILABLE/ACTIVE boss to card state
        const activeBoss = gamData.bossChallenges.find(
          (bc) => bc.status === "AVAILABLE" || bc.status === "ACTIVE"
        );
        if (activeBoss) {
          setBossChallenge({
            challengeId: activeBoss.id,
            status: activeBoss.status as BossChallengeState["status"],
            character: BOSS_CHARACTERS[0], // Default character — will be stored in DB later
            config: CHALLENGE_CONFIGS[activeBoss.challengeType as keyof typeof CHALLENGE_CONFIGS] ?? CHALLENGE_CONFIGS.MULTI_STEP,
            nodeIds: [],
            questionsAnswered: 0,
            correctAnswers: 0,
            startedAt: null,
            timeSpentMs: 0,
          });
        }
      }
      // Handle review data
      if (reviewRes.ok) {
        const reviewData = await reviewRes.json();
        setReviewDueNow(reviewData.summary.dueNow);
        setReviewOverdue(reviewData.summary.overdueCount);
        setReviewMinutes(reviewData.summary.estimatedMinutes);
        setReviewUrgency(reviewData.summary.urgency);
      }
    } catch (err) {
      console.error("Failed to load constellation data:", err);
      setError("Failed to load your constellation. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Navigate to session ───

  const handleStartSession = useCallback(
    (conceptId: string) => {
      // Find the node code for this star ID
      const star = constellationData?.stars.find((s) => s.id === conceptId);
      if (star) {
        // Navigate to session page — the session page will use the node code
        router.push(`/session?studentId=${STUDENT_ID}&nodeId=${conceptId}`);
      }
    },
    [constellationData, router]
  );

  // ─── Loading state ───

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading your constellation...</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty state (no knowledge nodes in DB yet) ───

  if (!constellationData || constellationData.stars.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="px-6 py-4 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">My Constellation</h1>
            <XPBar xp={xp} compact className="w-48" />
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🌌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Constellation Awaits</h2>
          <p className="text-white/60 max-w-md mx-auto mb-8">
            Complete a diagnostic or start a learning session to begin mapping your knowledge constellation.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/diagnostic?studentId=${STUDENT_ID}`)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
            >
              Take Diagnostic
            </button>
            <button
              onClick={() => router.push(`/session?studentId=${STUDENT_ID}`)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main view ───

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">My Constellation</h1>
          <XPBar xp={xp} compact className="w-48" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Star Map — Main Area */}
          <div className="lg:col-span-3 relative">
            <StarMap
              data={constellationData}
              height={550}
              onStarClick={setSelectedStar}
              selectedStarId={selectedStar?.id}
              className="w-full"
            />
            <StarDetail
              star={selectedStar}
              onClose={() => setSelectedStar(null)}
              onStartSession={handleStartSession}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* XP Bar (full) */}
            <XPBar xp={xp} />

            {/* Review Due Widget */}
            {reviewDueNow > 0 && (
              <ReviewDueWidget
                dueNow={reviewDueNow}
                overdueCount={reviewOverdue}
                estimatedMinutes={reviewMinutes}
                urgency={reviewUrgency}
                onStartReview={() => router.push(`/review?studentId=${STUDENT_ID}`)}
                compact
              />
            )}

            {/* Streak */}
            <StreakWidget streak={streak} />

            {/* Boss Challenge */}
            {bossChallenge && (
              <BossChallengeCard
                challenge={bossChallenge}
                onStart={() => {
                  // TODO: Navigate to boss challenge session
                  console.log("Start boss challenge:", bossChallenge.challengeId);
                }}
              />
            )}

            {/* Badges (compact) */}
            <BadgeDisplay
              earnedBadgeIds={earnedBadgeIds}
              compact
              showLocked={false}
            />
          </div>
        </div>

        {/* Full Badge Section */}
        {earnedBadgeIds.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6">
            <BadgeDisplay earnedBadgeIds={earnedBadgeIds} />
          </div>
        )}
      </div>
    </div>
  );
}
