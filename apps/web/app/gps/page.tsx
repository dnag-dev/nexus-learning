"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───

interface PlanData {
  id: string;
  status: string;
  goalId: string;
  goalName: string;
  goalCategory: string;
  goalDescription: string;
  totalConcepts: number;
  conceptsMastered: number;
  totalEstimatedHours: number;
  hoursCompleted: number;
  progressPercentage: number;
  createdAt: string;
}

interface ETAData {
  projectedCompletionDate: string;
  targetCompletionDate: string | null;
  hoursRemaining: number;
  velocityHoursPerWeek: number;
  isAheadOfSchedule: boolean;
  daysDifference: number;
  scheduleMessage: string;
  insight: string;
}

interface VelocityData {
  currentWeeklyHours: number;
  previousWeeklyHours: number;
  trend: "accelerating" | "steady" | "slowing" | "insufficient_data";
  sessionsLast4Weeks: number;
}

interface ETAHistoryPoint {
  date: string;
  conceptsRemaining: number;
  hoursRemaining: number;
  velocityHoursPerWeek: number;
  isAheadOfSchedule: boolean;
}

interface ConceptPathNode {
  code: string;
  title: string;
  domain: string;
  difficulty: number;
  gradeLevel: string;
  subject: string;
  status: "mastered" | "current" | "upcoming" | "locked" | "unknown";
  bkt: number;
  level: string;
  positionInPlan: number;
}

interface TodaysMission {
  nodeCode: string;
  title: string;
  description: string;
  estimatedHours: number;
  positionInPlan: number;
  totalInPlan: number;
}

interface StreakData {
  current: number;
  longest: number;
  lastSessionDate: string | null;
}

interface MilestoneData {
  weekNumber: number;
  concepts: string[];
  isDue: boolean;
}

interface WeeklyStats {
  sessionsThisWeek: number;
  totalMinutesThisWeek: number;
  avgAccuracy: number;
}

interface StudentData {
  id: string;
  displayName: string;
  gradeLevel: string;
  ageGroup: string;
  avatarPersonaId: string;
}

interface PlanSummary {
  id: string;
  goalName: string;
  status: string;
  progressPercentage: number;
}

interface InsightData {
  insight: string;
  motivationalTip: string;
  suggestedAction: string;
}

interface DashboardData {
  plan: PlanData;
  eta: ETAData;
  velocity: VelocityData;
  etaHistory: ETAHistoryPoint[];
  conceptPath: ConceptPathNode[];
  todaysMission: TodaysMission | null;
  streak: StreakData | null;
  milestone: MilestoneData | null;
  completedMilestones: Array<{ weekNumber: number; passed: boolean }>;
  weeklyStats: WeeklyStats;
  student: StudentData;
  allPlans: PlanSummary[];
}

// ─── Animations ───

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

// ─── Wrapper ───

export default function GPSDashboardWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      }
    >
      <GPSDashboard />
    </Suspense>
  );
}

// ─── Main Dashboard ───

function GPSDashboard() {
  const searchParams = useSearchParams();
  const STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const PLAN_ID = searchParams.get("planId") || null;

  const [data, setData] = useState<DashboardData | null>(null);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(PLAN_ID);

  // ─── Fetch dashboard data ───
  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ studentId: STUDENT_ID });
        if (selectedPlanId) params.set("planId", selectedPlanId);

        const res = await fetch(`/api/gps/dashboard?${params}`);
        if (!res.ok) {
          const errData = await res.json();
          if (errData.hasPlans === false) {
            setError("no-plans");
          } else {
            throw new Error(errData.error || "Failed to load dashboard");
          }
          return;
        }

        const dashData: DashboardData = await res.json();
        setData(dashData);

        // Set the plan ID for subsequent switches
        if (!selectedPlanId && dashData.plan?.id) {
          setSelectedPlanId(dashData.plan.id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [STUDENT_ID, selectedPlanId]);

  // ─── Fetch daily insight ───
  useEffect(() => {
    if (!data?.plan?.id) return;

    async function fetchInsight() {
      try {
        const res = await fetch(`/api/gps/insight?planId=${data!.plan.id}`);
        if (res.ok) {
          const insight: InsightData = await res.json();
          setInsightData(insight);
        }
      } catch {
        // Non-critical — insight section just won't show
      }
    }

    fetchInsight();
  }, [data?.plan?.id]);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-3xl animate-spin" style={{ animationDuration: "2s" }}>
                🧭
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Loading your GPS...</p>
        </div>
      </div>
    );
  }

  // ─── No plans state ───
  if (error === "no-plans") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
            <span className="text-5xl">🧭</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            No Learning Plan Yet
          </h1>
          <p className="text-slate-400 mb-8">
            Set a learning goal and Cosmo will build a personalized roadmap for you!
          </p>
          <a
            href={`/goals?studentId=${STUDENT_ID}`}
            className="inline-block px-8 py-3 text-lg font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
          >
            Set Your First Goal 🎯
          </a>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Something Went Wrong
          </h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ═══ Header ═══ */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-white/5 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                Learning GPS
              </h1>
              <p className="text-slate-400 text-xs">
                {data.student.displayName}
              </p>
            </div>
          </div>

          {/* Plan switcher */}
          {data.allPlans.length > 1 && (
            <div className="flex items-center gap-2">
              {data.allPlans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    data.plan.id === p.id
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {p.goalName.length > 20
                    ? p.goalName.slice(0, 20) + "..."
                    : p.goalName}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <a
              href={`/goals?studentId=${STUDENT_ID}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
            >
              + New Goal
            </a>
            <a
              href={`/session?studentId=${STUDENT_ID}${data?.plan?.id ? `&planId=${data.plan.id}` : ""}`}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              Start Session
            </a>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* ─── Row 1: Goal + Progress Ring + ETA ─── */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Goal + Progress Ring */}
            <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-white/5 p-6">
              <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <ProgressRing
                  percentage={data.plan.progressPercentage}
                  mastered={data.plan.conceptsMastered}
                  total={data.plan.totalConcepts}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                      {data.plan.goalCategory.replace("_", " ")}
                    </span>
                    {data.plan.status === "COMPLETED" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                        Complete!
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1 truncate">
                    {data.plan.goalName}
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {data.plan.goalDescription}
                  </p>

                  {/* Schedule badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        data.eta.isAheadOfSchedule
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {data.eta.scheduleMessage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ETA Clock */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                Projected Completion
              </p>
              <p className="text-2xl font-bold text-white mb-1">
                {new Date(data.eta.projectedCompletionDate).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>~{Math.round(data.eta.hoursRemaining)}h left</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>
                  {data.velocity.currentWeeklyHours > 0
                    ? `${data.velocity.currentWeeklyHours}h/wk`
                    : "No data yet"}
                </span>
              </div>
              {data.eta.targetCompletionDate && (
                <p className="text-xs text-slate-500 mt-2">
                  Target:{" "}
                  {new Date(data.eta.targetCompletionDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </p>
              )}
            </div>
          </motion.div>

          {/* ─── Row 2: Concept Path ─── */}
          <motion.div variants={staggerItem} className="mb-4">
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Your Learning Path
                </h3>
                <span className="text-xs text-slate-500">
                  {data.plan.conceptsMastered} of {data.plan.totalConcepts} mastered
                </span>
              </div>

              {/* Horizontal scrollable path */}
              <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <div className="flex items-center gap-3 min-w-max">
                  {data.conceptPath.map((node, i) => (
                    <div key={node.code} className="flex items-center gap-3">
                      <ConceptNode node={node} />
                      {i < data.conceptPath.length - 1 && (
                        <div
                          className={`w-8 h-0.5 flex-shrink-0 ${
                            node.status === "mastered"
                              ? "bg-emerald-500/60"
                              : "bg-slate-700"
                          }`}
                        />
                      )}
                    </div>
                  ))}

                  {/* More indicator */}
                  {data.plan.totalConcepts > data.conceptPath.length && (
                    <div className="flex items-center gap-2 pl-2">
                      <div className="w-8 h-0.5 bg-slate-700" />
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        </span>
                        +{data.plan.totalConcepts - data.conceptPath.length} more
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── Row 3: Today's Mission + Velocity + Insight ─── */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Today's Mission */}
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 rounded-2xl border border-purple-500/20 p-5">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
                Today&apos;s Mission
              </h3>
              {data.todaysMission ? (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">
                      🎯
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-snug">
                        {data.todaysMission.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                        {data.todaysMission.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-500">
                      ~{Math.round(data.todaysMission.estimatedHours * 60)} min estimated
                    </span>
                    <span className="text-xs text-slate-500">
                      #{data.todaysMission.positionInPlan} of {data.todaysMission.totalInPlan}
                    </span>
                  </div>
                  <a
                    href={`/session?studentId=${STUDENT_ID}${data.plan?.id ? `&planId=${data.plan.id}` : ""}${data.todaysMission?.nodeCode ? `&nodeCode=${data.todaysMission.nodeCode}` : ""}`}
                    className="block w-full py-2.5 text-center text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Start Learning &rarr;
                  </a>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-3xl mb-2 block">🎉</span>
                  <p className="text-white font-medium text-sm">All caught up!</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Great progress! Check back soon for new concepts.
                  </p>
                </div>
              )}
            </div>

            {/* Velocity Meter */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Learning Velocity
              </h3>

              {/* Current velocity */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-white">
                  {data.velocity.currentWeeklyHours > 0
                    ? data.velocity.currentWeeklyHours
                    : "—"}
                </p>
                <p className="text-xs text-slate-400">hours per week</p>
              </div>

              {/* Trend indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <VelocityTrendBadge trend={data.velocity.trend} />
              </div>

              {/* Mini sparkline */}
              {data.etaHistory.length > 2 && (
                <div className="mt-3">
                  <MiniSparkline
                    data={data.etaHistory.map((p) => p.velocityHoursPerWeek)}
                    color={
                      data.velocity.trend === "accelerating"
                        ? "#34D399"
                        : data.velocity.trend === "slowing"
                          ? "#FBBF24"
                          : "#818CF8"
                    }
                  />
                </div>
              )}

              {/* Sessions last 4 weeks */}
              <div className="mt-3 text-center">
                <span className="text-xs text-slate-500">
                  {data.velocity.sessionsLast4Weeks} sessions in last 4 weeks
                </span>
              </div>
            </div>

            {/* Claude Daily Insight */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Cosmo&apos;s Insight
              </h3>

              {insightData ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">🐻</span>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {insightData.insight}
                    </p>
                  </div>

                  {insightData.motivationalTip && (
                    <div className="bg-purple-500/10 rounded-xl px-3 py-2 border border-purple-500/20">
                      <p className="text-xs text-purple-300 leading-relaxed">
                        💡 {insightData.motivationalTip}
                      </p>
                    </div>
                  )}

                  {insightData.suggestedAction && (
                    <div className="bg-slate-800/60 rounded-xl px-3 py-2">
                      <p className="text-xs text-slate-300">
                        <span className="font-medium text-emerald-400">Action:</span>{" "}
                        {insightData.suggestedAction}
                      </p>
                    </div>
                  )}
                </div>
              ) : data.eta.insight ? (
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">🐻</span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {data.eta.insight}
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 animate-pulse">
                  <span className="text-2xl flex-shrink-0">🐻</span>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-700 rounded w-3/4" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── Row 4: Streak + Weekly Stats + Milestone ─── */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Streak */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Streak
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {data.streak && data.streak.current > 0 ? "🔥" : "💤"}
                </span>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {data.streak?.current ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">
                    day{data.streak?.current !== 1 ? "s" : ""} in a row
                  </p>
                </div>
              </div>
              {data.streak && data.streak.longest > 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  Personal best: {data.streak.longest} days
                </p>
              )}
            </div>

            {/* Weekly Stats */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                This Week
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {data.weeklyStats.sessionsThisWeek}
                  </p>
                  <p className="text-xs text-slate-400">sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {data.weeklyStats.totalMinutesThisWeek}
                  </p>
                  <p className="text-xs text-slate-400">minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {data.weeklyStats.avgAccuracy}%
                  </p>
                  <p className="text-xs text-slate-400">accuracy</p>
                </div>
              </div>
            </div>

            {/* Milestone */}
            <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Milestones
              </h3>
              {data.milestone?.isDue ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📋</span>
                    <p className="text-sm text-amber-300 font-medium">
                      Week {data.milestone.weekNumber} Check Due!
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {data.milestone.concepts.length} concepts to review
                  </p>
                  <a
                    href={`/milestone/${data.plan.id}/${data.milestone.weekNumber}?studentId=${STUDENT_ID}`}
                    className="block w-full py-2 text-center text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    Take Milestone Check
                  </a>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✅</span>
                    <p className="text-sm text-slate-300 font-medium">
                      All caught up!
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {data.completedMilestones.length > 0
                      ? `${data.completedMilestones.filter((m) => m.passed).length}/${data.completedMilestones.length} milestones passed`
                      : "Milestones will appear as you progress"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ─── Row 5: ETA History Chart ─── */}
          {data.etaHistory.length > 2 && (
            <motion.div variants={staggerItem} className="mb-4">
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                  Progress Over Time
                </h3>
                <ETAChart history={data.etaHistory} totalConcepts={data.plan.totalConcepts} />
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

// ─── Circular Progress Ring ───

function ProgressRing({
  percentage,
  mastered,
  total,
}: {
  percentage: number;
  mastered: number;
  total: number;
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
        {/* Background circle */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-700/50"
        />
        {/* Progress circle */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-slate-400">
          {mastered}/{total}
        </span>
      </div>
    </div>
  );
}

// ─── Concept Node Component ───

function ConceptNode({ node }: { node: ConceptPathNode }) {
  const statusStyles = {
    mastered: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    current: "bg-purple-500/20 border-purple-500/50 text-purple-300 ring-2 ring-purple-500/30",
    upcoming: "bg-slate-800 border-slate-600/30 text-slate-400",
    locked: "bg-slate-800/50 border-slate-700/20 text-slate-500 opacity-60",
    unknown: "bg-slate-800/50 border-slate-700/20 text-slate-500",
  };

  const statusIcons = {
    mastered: "✅",
    current: "▶️",
    upcoming: "○",
    locked: "🔒",
    unknown: "?",
  };

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div
        className={`w-14 h-14 rounded-xl border flex items-center justify-center text-xl transition-all ${statusStyles[node.status]}`}
      >
        {statusIcons[node.status]}
      </div>
      <div className="text-center max-w-[80px]">
        <p className="text-xs text-slate-300 font-medium truncate">
          {node.title.length > 12
            ? node.title.slice(0, 12) + "..."
            : node.title}
        </p>
        <p className="text-[10px] text-slate-500">{node.code}</p>
      </div>
    </div>
  );
}

// ─── Velocity Trend Badge ───

function VelocityTrendBadge({
  trend,
}: {
  trend: VelocityData["trend"];
}) {
  const styles = {
    accelerating: {
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      label: "Accelerating",
      icon: "📈",
    },
    steady: {
      bg: "bg-indigo-500/10 border-indigo-500/20",
      text: "text-indigo-400",
      label: "Steady",
      icon: "📊",
    },
    slowing: {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-400",
      label: "Slowing",
      icon: "📉",
    },
    insufficient_data: {
      bg: "bg-slate-700/30 border-slate-600/20",
      text: "text-slate-400",
      label: "Building data...",
      icon: "📊",
    },
  };

  const s = styles[trend];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${s.bg} ${s.text}`}
    >
      {s.icon} {s.label}
    </span>
  );
}

// ─── Mini Sparkline (SVG) ───

function MiniSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  if (data.length < 2) return null;

  const width = 200;
  const height = 40;
  const padding = 4;

  const max = Math.max(...data, 0.1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;

  // Area fill
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const areaD = `${pathD} L${lastX},${height - padding} L${firstX},${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height: "40px" }}
    >
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${color})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      {data.length > 0 && (
        <circle
          cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
          cy={
            height -
            padding -
            ((data[data.length - 1] - min) / range) * (height - padding * 2)
          }
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
}

// ─── ETA History Chart ───

function ETAChart({
  history,
  totalConcepts,
}: {
  history: ETAHistoryPoint[];
  totalConcepts: number;
}) {
  if (history.length < 2) return null;

  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Plot concepts mastered (= totalConcepts - remaining)
  const dataPoints = history.map((h) => ({
    date: new Date(h.date),
    mastered: totalConcepts - h.conceptsRemaining,
  }));

  const maxMastered = Math.max(...dataPoints.map((d) => d.mastered), 1);

  const points = dataPoints.map((d, i) => {
    const x = padding.left + (i / (dataPoints.length - 1)) * chartW;
    const y = padding.top + chartH - (d.mastered / maxMastered) * chartH;
    return { x, y };
  });

  const pathD = `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`;

  // Area
  const areaD = `${pathD} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "120px" }}>
      <defs>
        <linearGradient id="etaChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padding.top + chartH - pct * chartH;
        return (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="4"
            />
            <text x={padding.left - 4} y={y + 3} textAnchor="end" className="text-[9px]" fill="#64748B">
              {Math.round(pct * maxMastered)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill="url(#etaChartGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Current point */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#A78BFA" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="6" fill="none" stroke="#A78BFA" strokeWidth="1" opacity="0.5" />

      {/* X-axis labels */}
      {dataPoints.length <= 10
        ? dataPoints.map((d, i) => (
            <text
              key={i}
              x={points[i].x}
              y={height - 2}
              textAnchor="middle"
              className="text-[8px]"
              fill="#64748B"
            >
              {d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          ))
        : // Show first, middle, last
          [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1].map((i) => (
            <text
              key={i}
              x={points[i].x}
              y={height - 2}
              textAnchor="middle"
              className="text-[8px]"
              fill="#64748B"
            >
              {dataPoints[i].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          ))}

      {/* Y axis label */}
      <text x={padding.left} y={padding.top - 2} textAnchor="start" className="text-[9px]" fill="#94A3B8">
        Concepts Mastered
      </text>
    </svg>
  );
}
