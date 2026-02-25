"use client";

/**
 * Kid Constellation Page — Star Map for authenticated child.
 *
 * Same as the student constellation but uses useChild() for studentId
 * instead of URL params, and includes a back link to the child dashboard.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChild } from "@/lib/child-context";
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
import TopicTree from "@/components/constellation/TopicTree";
import NexusScore from "@/components/gamification/NexusScore";

interface MasteryMapResponse {
  nodes: Array<{
    id: string;
    nodeCode: string;
    name: string;
    description: string;
    subject: string;
    gradeLevel: string;
    difficulty: number;
    masteryLevel: number;
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

const DEFAULT_STREAK = {
  type: "daily" as const,
  current: 0,
  longest: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  isActive: false,
  freezesAvailable: 0,
  freezesUsed: 0,
};

export default function KidConstellationPage() {
  const router = useRouter();
  const { studentId } = useChild();
  const [selectedStar, setSelectedStar] = useState<StarNode | null>(null);
  const [viewMode, setViewMode] = useState<"starmap" | "topictree">("starmap");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(DEFAULT_STREAK);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [bossChallenge, setBossChallenge] =
    useState<BossChallengeState | null>(null);

  const [constellationData, setConstellationData] = useState<ReturnType<
    typeof generateConstellationLayout
  > | null>(null);

  const [reviewDueNow, setReviewDueNow] = useState(0);
  const [reviewOverdue, setReviewOverdue] = useState(0);
  const [reviewMinutes, setReviewMinutes] = useState(0);
  const [reviewUrgency, setReviewUrgency] = useState<
    "none" | "low" | "medium" | "high"
  >("none");

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    try {
      setError(null);

      const [masteryRes, gamRes, reviewRes] = await Promise.all([
        fetch(`/api/student/${studentId}/mastery-map`),
        fetch(`/api/student/${studentId}/gamification`),
        fetch(`/api/student/${studentId}/reviews`),
      ]);

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

      if (gamRes.ok) {
        const gamData: GamificationResponse = await gamRes.json();
        setXP(gamData.xp);
        if (gamData.streak) setStreak(gamData.streak);
        setEarnedBadgeIds(gamData.badges.map((b) => b.badgeType));

        const activeBoss = gamData.bossChallenges.find(
          (bc) => bc.status === "AVAILABLE" || bc.status === "ACTIVE"
        );
        if (activeBoss) {
          setBossChallenge({
            challengeId: activeBoss.id,
            status: activeBoss.status as BossChallengeState["status"],
            character: BOSS_CHARACTERS[0],
            config:
              CHALLENGE_CONFIGS[
                activeBoss.challengeType as keyof typeof CHALLENGE_CONFIGS
              ] ?? CHALLENGE_CONFIGS.MULTI_STEP,
            nodeIds: [],
            questionsAnswered: 0,
            correctAnswers: 0,
            startedAt: null,
            timeSpentMs: 0,
          });
        }
      }

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
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartSession = useCallback(
    (conceptId: string) => {
      router.push(
        `/session?studentId=${studentId}&nodeId=${conceptId}&returnTo=/kid`
      );
    },
    [router, studentId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading your constellation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
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

  if (!constellationData || constellationData.stars.length === 0) {
    return (
      <div className="py-16 text-center">
        <Link
          href="/kid"
          className="inline-block mb-8 text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <div className="text-6xl mb-4">🌌</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Your Constellation Awaits
        </h2>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          Start a learning session to begin mapping your knowledge
          constellation.
        </p>
        <Link
          href={`/session?studentId=${studentId}&returnTo=/kid`}
          className="px-6 py-3 bg-gradient-to-r from-aauti-primary to-aauti-secondary text-white rounded-lg font-medium inline-block"
        >
          🚀 Start Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/kid"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </Link>
        <XPBar xp={xp} compact className="w-48" />
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setViewMode("starmap")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "starmap"
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          🌌 Star Map
        </button>
        <button
          onClick={() => setViewMode("topictree")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "topictree"
              ? "bg-purple-600 text-white"
              : "bg-white/5 text-gray-400 hover:text-white"
          }`}
        >
          🌳 Topic Tree
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 relative">
          {viewMode === "starmap" ? (
            <>
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
            </>
          ) : (
            <div className="bg-[#1A2744] rounded-2xl border border-white/5 p-6">
              <TopicTree studentId={studentId} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <XPBar xp={xp} />

          {reviewDueNow > 0 && (
            <ReviewDueWidget
              dueNow={reviewDueNow}
              overdueCount={reviewOverdue}
              estimatedMinutes={reviewMinutes}
              urgency={reviewUrgency}
              onStartReview={() => router.push("/kid/review")}
              compact
            />
          )}

          <StreakWidget streak={streak} />

          {bossChallenge && <BossChallengeCard challenge={bossChallenge} />}

          <BadgeDisplay
            earnedBadgeIds={earnedBadgeIds}
            compact
            showLocked={false}
          />
        </div>
      </div>
    </div>
  );
}
