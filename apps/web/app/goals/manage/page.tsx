"use client";

/**
 * Goals Management Page — Step 12: Multiple Goals
 *
 * List all learning plans (active, paused, completed, abandoned).
 * Actions: pause, resume, abandon, change target date, add new goal.
 * Up to 3 concurrent active plans allowed.
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ─── Types ───

interface GoalInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  gradeLevel: number | null;
}

interface MilestoneInfo {
  weekNumber: number;
  passed: boolean;
  score: number;
  completedAt: string;
}

interface PlanInfo {
  planId: string;
  goal: GoalInfo;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";
  progressPercentage: number;
  totalConcepts: number;
  conceptsMastered: number;
  totalEstimatedHours: number;
  hoursCompleted: number;
  projectedCompletionDate: string;
  targetCompletionDate: string | null;
  isAheadOfSchedule: boolean;
  velocityHoursPerWeek: number;
  createdAt: string;
  lastRecalculatedAt: string;
  recentMilestones: MilestoneInfo[];
}

interface Summary {
  total: number;
  active: number;
  paused: number;
  completed: number;
  abandoned: number;
  canAddMore: boolean;
  slotsRemaining: number;
}

// ─── Component ───

export default function GoalsManagePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      }
    >
      <GoalsManagePage />
    </Suspense>
  );
}

function GoalsManagePage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") || "demo-student-1";

  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/goals/manage?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      setPlans(data.plans);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleAction = async (
    planId: string,
    action: string,
    targetDate?: string
  ) => {
    setActionLoading(planId);
    try {
      const res = await fetch("/api/goals/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, action, targetDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Action failed");
        return;
      }
      // Refresh the list
      await fetchPlans();
    } catch {
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
            <p className="text-sm text-gray-500 mt-1">
              {summary
                ? `${summary.active} active, ${summary.slotsRemaining} slot${summary.slotsRemaining !== 1 ? "s" : ""} available`
                : "Loading..."}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/gps?studentId=${studentId}`}
              className="px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              GPS Dashboard
            </a>
            {summary?.canAddMore && (
              <a
                href={`/goals?studentId=${studentId}`}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                + New Goal
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Slot Indicator */}
        {summary && (
          <div className="flex gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i < summary.active
                    ? "bg-purple-500"
                    : i < summary.active + summary.paused
                      ? "bg-amber-400"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* Plans list */}
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
              <span className="text-4xl">🧭</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Goals Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Set your first learning goal to start your GPS-guided journey!
            </p>
            <a
              href={`/goals?studentId=${studentId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Pick a Goal
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.planId}
                plan={plan}
                isLoading={actionLoading === plan.planId}
                onAction={handleAction}
                studentId={studentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Plan Card Component ───

function PlanCard({
  plan,
  isLoading,
  onAction,
  studentId,
}: {
  plan: PlanInfo;
  isLoading: boolean;
  onAction: (
    planId: string,
    action: string,
    targetDate?: string
  ) => void;
  studentId: string;
}) {
  const statusConfig = {
    ACTIVE: {
      badge: "bg-green-50 text-green-700 border-green-200",
      label: "Active",
      icon: "🟢",
      border: "border-green-100",
    },
    PAUSED: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Paused",
      icon: "⏸️",
      border: "border-amber-100",
    },
    COMPLETED: {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Completed",
      icon: "✅",
      border: "border-blue-100",
    },
    ABANDONED: {
      badge: "bg-gray-50 text-gray-500 border-gray-200",
      label: "Abandoned",
      icon: "🚫",
      border: "border-gray-100",
    },
  };

  const config = statusConfig[plan.status];
  const categoryLabels: Record<string, string> = {
    GRADE_PROFICIENCY: "📚 Grade",
    EXAM_PREP: "🎯 Exam",
    SKILL_BUILDING: "⚡ Skill",
    CUSTOM: "✨ Custom",
  };

  return (
    <div
      className={`bg-white rounded-xl border ${config.border} p-5 ${
        plan.status === "ABANDONED" ? "opacity-60" : ""
      } ${isLoading ? "animate-pulse" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400">
              {categoryLabels[plan.goal.category] ?? "Goal"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${config.badge}`}
            >
              {config.icon} {config.label}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {plan.goal.name}
          </h3>
        </div>
        <span className="text-2xl font-bold text-purple-600">
          {plan.progressPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            plan.status === "COMPLETED"
              ? "bg-blue-500"
              : plan.status === "PAUSED"
                ? "bg-amber-400"
                : "bg-purple-500"
          }`}
          style={{ width: `${plan.progressPercentage}%` }}
        />
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span>
          {plan.conceptsMastered}/{plan.totalConcepts} concepts
        </span>
        <span>
          {plan.hoursCompleted.toFixed(1)}/{plan.totalEstimatedHours.toFixed(0)}h
        </span>
        {plan.targetCompletionDate && (
          <span>
            Target:{" "}
            {new Date(plan.targetCompletionDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {plan.status === "ACTIVE" && (
          <span
            className={
              plan.isAheadOfSchedule ? "text-green-600" : "text-amber-600"
            }
          >
            {plan.isAheadOfSchedule ? "Ahead" : "Behind"} of schedule
          </span>
        )}
      </div>

      {/* Recent Milestones */}
      {plan.recentMilestones.length > 0 && (
        <div className="flex gap-2 mb-4">
          {plan.recentMilestones.map((ms) => (
            <span
              key={ms.weekNumber}
              className={`text-xs px-2 py-1 rounded ${
                ms.passed
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              Wk {ms.weekNumber}: {ms.score}%
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {plan.status === "ACTIVE" && (
          <>
            <a
              href={`/gps?studentId=${studentId}`}
              className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              View GPS
            </a>
            <button
              onClick={() => onAction(plan.planId, "pause")}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              Pause
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to abandon this goal? Your progress will be saved but the plan will be deactivated."
                  )
                ) {
                  onAction(plan.planId, "abandon");
                }
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Abandon
            </button>
          </>
        )}
        {plan.status === "PAUSED" && (
          <>
            <button
              onClick={() => onAction(plan.planId, "resume")}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              Resume
            </button>
            <button
              onClick={() => {
                if (confirm("Abandon this paused goal?")) {
                  onAction(plan.planId, "abandon");
                }
              }}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Abandon
            </button>
          </>
        )}
        {plan.status === "COMPLETED" && (
          <span className="text-xs text-blue-600 font-medium">
            Goal achieved! 🎉
          </span>
        )}
        {plan.status === "ABANDONED" && (
          <span className="text-xs text-gray-400">Plan archived</span>
        )}
      </div>
    </div>
  );
}
