"use client";

/**
 * Parent GPS View — Step 11: Learning GPS for Parents
 *
 * Shows child's learning goals, progress, ETA, schedule status,
 * weekly hours, next concepts, session summary, and Claude weekly insight.
 * Clean parent-friendly view of all GPS data.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

// ─── Types ───

interface ConceptInfo {
  nodeCode: string;
  title: string;
  domain: string;
}

interface MilestoneInfo {
  weekNumber: number;
  passed: boolean;
  score: number;
  completedAt: string;
}

interface ETAInfo {
  projectedCompletionDate: string;
  progressPercentage: number;
  isAheadOfSchedule: boolean;
}

interface PlanData {
  planId: string;
  goalName: string;
  goalCategory: string;
  goalDescription: string;
  progressPercentage: number;
  totalConcepts: number;
  masteredConcepts: number;
  remainingConcepts: number;
  etaData: ETAInfo | null;
  targetDate: string | null;
  scheduleStatus: "ahead" | "on_track" | "behind";
  daysDifference: number;
  currentVelocity: number;
  weeklyHoursTarget: number;
  weeklyMinutesActual: number;
  weeklyAccuracy: number;
  weeklySessionCount: number;
  nextConcepts: ConceptInfo[];
  milestones: MilestoneInfo[];
  createdAt: string;
}

interface GPSData {
  childName: string;
  childId: string;
  hasActivePlans: boolean;
  plans: PlanData[];
  weeklyInsight: string | null;
}

// ─── Component ───

export default function ChildGPSPage() {
  const params = useParams();
  const childId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GPSData | null>(null);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/parent/child/${childId}/gps`);
      if (!res.ok) throw new Error("Failed to load GPS data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load GPS data"
      );
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400 py-12 text-center">
        Loading GPS data...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 mb-4">{error || "No data available"}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data.hasActivePlans || data.plans.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-50 flex items-center justify-center">
          <span className="text-4xl">🧭</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No Learning Goals Yet
        </h2>
        <p className="text-gray-500 mb-6">
          {data.childName} hasn&apos;t set any learning goals yet. Help them
          pick a destination to start their learning journey!
        </p>
        <a
          href={`/goals?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Set a Goal for {data.childName}
        </a>
      </div>
    );
  }

  const plan = data.plans[selectedPlanIdx];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {data.childName}&apos;s Learning GPS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track progress, see upcoming topics, and monitor learning pace
          </p>
        </div>
        <a
          href={`/gps?studentId=${childId}`}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Open Student View &rarr;
        </a>
      </div>

      {/* Plan Tabs (if multiple goals) */}
      {data.plans.length > 1 && (
        <div className="flex gap-2 border-b border-gray-200 pb-1">
          {data.plans.map((p, idx) => (
            <button
              key={p.planId}
              onClick={() => setSelectedPlanIdx(idx)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                idx === selectedPlanIdx
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.goalName}
            </button>
          ))}
        </div>
      )}

      {/* Goal & Progress Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={plan.goalCategory} />
              <h2 className="text-lg font-semibold text-gray-900">
                {plan.goalName}
              </h2>
            </div>
            {plan.goalDescription && (
              <p className="text-sm text-gray-500 mt-1">
                {plan.goalDescription}
              </p>
            )}
          </div>
          <ScheduleBadge
            status={plan.scheduleStatus}
            days={plan.daysDifference}
          />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">
              {plan.masteredConcepts} of {plan.totalConcepts} concepts mastered
            </span>
            <span className="font-semibold text-purple-700">
              {plan.progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${plan.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatBox
            label="ETA"
            value={
              plan.etaData?.projectedCompletionDate
                ? formatDate(plan.etaData.projectedCompletionDate)
                : plan.targetDate
                  ? formatDate(plan.targetDate)
                  : "TBD"
            }
            icon="📅"
          />
          <StatBox
            label="Remaining"
            value={`${plan.remainingConcepts} concepts`}
            icon="📚"
          />
          <StatBox
            label="Velocity"
            value={`${plan.currentVelocity.toFixed(1)} h/wk`}
            icon="⚡"
          />
          <StatBox
            label="Started"
            value={formatDate(plan.createdAt)}
            icon="🚀"
          />
        </div>
      </div>

      {/* This Week Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            This Week&apos;s Activity
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {plan.weeklySessionCount}
              </p>
              <p className="text-xs text-gray-500">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {plan.weeklyMinutesActual}m
              </p>
              <p className="text-xs text-gray-500">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {plan.weeklyAccuracy}%
              </p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
          </div>

          {/* Hours comparison */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Target: {plan.weeklyHoursTarget}h/week
              </span>
              <span className="text-gray-500">
                Actual:{" "}
                {(plan.weeklyMinutesActual / 60).toFixed(1)}h/week
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  plan.weeklyMinutesActual / 60 >=
                  plan.weeklyHoursTarget * 0.8
                    ? "bg-green-500"
                    : plan.weeklyMinutesActual / 60 >=
                        plan.weeklyHoursTarget * 0.5
                      ? "bg-amber-500"
                      : "bg-red-400"
                }`}
                style={{
                  width: `${Math.min(100, (plan.weeklyMinutesActual / 60 / Math.max(0.1, plan.weeklyHoursTarget)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Next Topics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Coming Up Next
          </h3>
          {plan.nextConcepts.length > 0 ? (
            <div className="space-y-3">
              {plan.nextConcepts.map((concept, idx) => (
                <div key={concept.nodeCode} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {concept.title}
                    </p>
                    <p className="text-xs text-gray-400">{concept.domain}</p>
                  </div>
                  {idx === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No upcoming concepts — all done!
            </p>
          )}
        </div>
      </div>

      {/* Milestones */}
      {plan.milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Milestone Checkpoints
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {plan.milestones.map((ms) => (
              <div
                key={ms.weekNumber}
                className={`flex-shrink-0 px-4 py-3 rounded-lg border text-center min-w-[100px] ${
                  ms.passed
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-xs text-gray-500">Week {ms.weekNumber}</p>
                <p
                  className={`text-lg font-bold ${
                    ms.passed ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {ms.score}%
                </p>
                <p className="text-xs mt-0.5">
                  {ms.passed ? "✅ Passed" : "❌ Needs Review"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claude Weekly Insight */}
      {data.weeklyInsight && (
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-5">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">🐻</span>
            <div>
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Cosmo&apos;s Weekly Insight
              </h3>
              <p className="text-sm text-purple-800 leading-relaxed">
                {data.weeklyInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <a
          href={`/goals?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add New Goal
        </a>
        <a
          href={`/session?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          ▶ Start Session
        </a>
        <a
          href={`/diagnostic?studentId=${childId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
        >
          🎯 Run Diagnostic
        </a>
      </div>
    </div>
  );
}

// ─── Helper Components ───

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    GRADE_PROFICIENCY: "bg-blue-50 text-blue-700",
    EXAM_PREP: "bg-orange-50 text-orange-700",
    SKILL_BUILDING: "bg-teal-50 text-teal-700",
    CUSTOM: "bg-gray-50 text-gray-600",
  };
  const labels: Record<string, string> = {
    GRADE_PROFICIENCY: "Grade",
    EXAM_PREP: "Exam",
    SKILL_BUILDING: "Skill",
    CUSTOM: "Custom",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[category] ?? styles.CUSTOM
      }`}
    >
      {labels[category] ?? "Custom"}
    </span>
  );
}

function ScheduleBadge({
  status,
  days,
}: {
  status: "ahead" | "on_track" | "behind";
  days: number;
}) {
  const config = {
    ahead: {
      bg: "bg-green-50 border-green-200 text-green-700",
      label: `${Math.abs(days)}d ahead`,
      icon: "🟢",
    },
    on_track: {
      bg: "bg-blue-50 border-blue-200 text-blue-700",
      label: "On track",
      icon: "🔵",
    },
    behind: {
      bg: "bg-red-50 border-red-200 text-red-700",
      label: `${Math.abs(days)}d behind`,
      icon: "🔴",
    },
  };

  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.bg}`}
    >
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
}
