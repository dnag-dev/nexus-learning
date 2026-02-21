"use client";

/**
 * Review Page — Spaced Repetition Hub
 *
 * Shows:
 *  - Due count, overdue count, estimated time
 *  - "Start Review" button
 *  - Review session (practice UI with "Review" badge)
 *  - Post-review summary
 *  - 7-day forecast calendar
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReviewDueWidget from "@/components/review/ReviewDueWidget";
import ReviewForecastCalendar from "@/components/review/ReviewForecastCalendar";
import XPBar from "@/components/gamification/XPBar";

// ─── Types ───

interface ReviewNode {
  nodeId: string;
  nodeCode: string;
  title: string;
  description: string;
  domain: string;
  gradeLevel: string;
  difficulty: number;
  bktProbability: number;
  isOverdue: boolean;
  isRefresher: boolean;
}

interface ReviewSession {
  sessionId: string;
  studentId: string;
  nodeCount: number;
  nodes: ReviewNode[];
  estimatedMinutes: number;
}

interface ReviewResult {
  correct: boolean;
  nodeCode: string;
  nodeTitle: string;
  previousBKT: number;
  newBKT: number;
  newLevel: string;
  nextReviewAt: string;
  newInterval: number;
  xpAwarded: number;
  newXP: number;
}

interface ForecastDay {
  date: string;
  nodeCount: number;
  nodes: Array<{
    nodeCode: string;
    nodeTitle: string;
    bktProbability: number;
    isOverdue: boolean;
  }>;
}

type Phase = "home" | "reviewing" | "feedback" | "summary";

// ─── Review Phrases ───
const REVIEW_PHRASES = [
  "Let's make sure this sticks!",
  "A quick refresher to keep you sharp!",
  "Review time — you've got this!",
  "Let's see how well you remember!",
  "Keeping your knowledge constellation bright!",
];

// ─── Page Component ───

export default function ReviewPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ReviewPage />
    </Suspense>
  );
}

function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const [phase, setPhase] = useState<Phase>("home");
  const [loading, setLoading] = useState(true);
  const [xp, setXP] = useState(0);

  // Home state
  const [dueNow, setDueNow] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [urgency, setUrgency] = useState<"none" | "low" | "medium" | "high">("none");
  const [forecast, setForecast] = useState<ForecastDay[]>([]);

  // Review session state
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [lastResult, setLastResult] = useState<ReviewResult | null>(null);

  // ─── Fetch review data ───
  const fetchReviewData = useCallback(async () => {
    try {
      const [reviewRes, gamRes] = await Promise.all([
        fetch(`/api/student/${STUDENT_ID}/reviews`),
        fetch(`/api/student/${STUDENT_ID}/gamification`),
      ]);

      if (reviewRes.ok) {
        const data = await reviewRes.json();
        setDueNow(data.summary.dueNow);
        setOverdueCount(data.summary.overdueCount);
        setEstimatedMinutes(data.summary.estimatedMinutes);
        setUrgency(data.summary.urgency);
        setForecast(data.forecast);
      }

      if (gamRes.ok) {
        const gamData = await gamRes.json();
        setXP(gamData.xp);
      }
    } catch (err) {
      console.error("Failed to load review data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewData();
  }, [fetchReviewData]);

  // ─── Start review session ───
  const handleStartReview = useCallback(async () => {
    try {
      const res = await fetch("/api/review/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: STUDENT_ID }),
      });

      const data = await res.json();

      if (data.hasReviews && data.session) {
        setSession(data.session);
        setCurrentNodeIndex(0);
        setResults([]);
        setPhase("reviewing");
      }
    } catch (err) {
      console.error("Failed to start review:", err);
    }
  }, []);

  // ─── Submit review answer ───
  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      if (!session) return;

      const currentNode = session.nodes[currentNodeIndex];

      try {
        const res = await fetch("/api/review/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.sessionId,
            nodeId: currentNode.nodeId,
            isCorrect,
          }),
        });

        const result: ReviewResult = await res.json();
        setLastResult(result);
        setResults((prev) => [...prev, result]);
        setXP(result.newXP);
        setPhase("feedback");
      } catch (err) {
        console.error("Failed to submit review answer:", err);
      }
    },
    [session, currentNodeIndex]
  );

  // ─── Next node or summary ───
  const handleNext = useCallback(() => {
    if (!session) return;

    if (currentNodeIndex + 1 >= session.nodes.length) {
      setPhase("summary");
    } else {
      setCurrentNodeIndex((i) => i + 1);
      setLastResult(null);
      setPhase("reviewing");
    }
  }, [session, currentNodeIndex]);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Home phase ───
  if (phase === "home") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Review</h1>
            <XPBar xp={xp} compact className="w-48" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Due widget */}
          <ReviewDueWidget
            dueNow={dueNow}
            overdueCount={overdueCount}
            estimatedMinutes={estimatedMinutes}
            urgency={urgency}
            onStartReview={handleStartReview}
          />

          {/* Forecast calendar */}
          {forecast.length > 0 && (
            <ReviewForecastCalendar forecast={forecast} />
          )}

          {/* Back to constellation */}
          <button
            onClick={() => router.push(`/constellation?studentId=${STUDENT_ID}`)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Back to Constellation
          </button>
        </main>
      </div>
    );
  }

  // ─── Reviewing phase ───
  if (phase === "reviewing" && session) {
    const currentNode = session.nodes[currentNodeIndex];
    const progress = ((currentNodeIndex) / session.nodes.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="px-6 py-3 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                Review
              </span>
              <span className="text-sm text-gray-500">
                {currentNodeIndex + 1} / {session.nodes.length}
              </span>
            </div>
            <XPBar xp={xp} compact className="w-36" />
          </div>
          {/* Progress bar */}
          <div className="max-w-3xl mx-auto mt-2">
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Persona phrase */}
          <p className="text-sm text-purple-600 italic mb-4">
            {REVIEW_PHRASES[currentNodeIndex % REVIEW_PHRASES.length]}
          </p>

          {/* Node card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentNode.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentNode.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {currentNode.isRefresher && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    Refresher
                  </span>
                )}
                {currentNode.isOverdue && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-4">
              {currentNode.domain} · {currentNode.gradeLevel} · Difficulty {currentNode.difficulty}
            </div>

            {/* Mastery indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Current Mastery</span>
                <span>{Math.round(currentNode.bktProbability * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${currentNode.bktProbability * 100}%`,
                    backgroundColor:
                      currentNode.bktProbability >= 0.9
                        ? "#F59E0B"
                        : currentNode.bktProbability >= 0.5
                          ? "#3B82F6"
                          : "#6B7280",
                  }}
                />
              </div>
            </div>

            {/* Answer buttons */}
            <p className="text-sm text-gray-600 mb-3">
              Do you still remember this concept?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ✓ I remember
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                ✗ Need review
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Feedback phase ───
  if (phase === "feedback" && lastResult) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="px-6 py-3 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              Review
            </span>
            <XPBar xp={xp} compact className="w-36" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            {/* Result */}
            <div className="text-4xl mb-3">
              {lastResult.correct ? "🌟" : "📖"}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {lastResult.correct ? "Great recall!" : "Time to brush up!"}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {lastResult.nodeTitle}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Mastery</div>
                <div className="text-lg font-bold text-gray-800">
                  {Math.round(lastResult.newBKT * 100)}%
                </div>
                <div className="text-xs text-gray-400">
                  was {Math.round(lastResult.previousBKT * 100)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">Next Review</div>
                <div className="text-lg font-bold text-gray-800">
                  {lastResult.newInterval}d
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500">XP Earned</div>
                <div className="text-lg font-bold text-blue-600">
                  +{lastResult.xpAwarded}
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              {session && currentNodeIndex + 1 >= session.nodes.length
                ? "View Summary"
                : "Next Node"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Summary phase ───
  if (phase === "summary") {
    const correctCount = results.filter((r) => r.correct).length;
    const retentionRate =
      results.length > 0
        ? Math.round((correctCount / results.length) * 100)
        : 0;
    const totalXP = results.reduce((sum, r) => r.xpAwarded, 0);

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Review Complete</h1>
            <XPBar xp={xp} compact className="w-48" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Summary card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">
                {retentionRate >= 80 ? "🌟" : retentionRate >= 50 ? "📚" : "💪"}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {retentionRate >= 80
                  ? "Excellent Retention!"
                  : retentionRate >= 50
                    ? "Solid Review!"
                    : "Keep Practicing!"}
              </h2>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {results.length}
                </div>
                <div className="text-xs text-gray-500">Reviewed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {correctCount}
                </div>
                <div className="text-xs text-gray-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {retentionRate}%
                </div>
                <div className="text-xs text-gray-500">Retention</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  +{totalXP}
                </div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
            </div>

            {/* Node results */}
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.nodeCode}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span>{r.correct ? "✅" : "❌"}</span>
                    <span className="text-sm text-gray-700">{r.nodeTitle}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Next: {r.newInterval}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/constellation?studentId=${STUDENT_ID}`)}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Back to Constellation
            </button>
            <button
              onClick={() => {
                setPhase("home");
                fetchReviewData();
              }}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Review More
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
