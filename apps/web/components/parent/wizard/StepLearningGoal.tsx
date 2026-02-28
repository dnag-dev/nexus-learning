"use client";

/**
 * Wizard Step 2: Learning Goal
 *
 * 4 large cards in 2x2 grid: Catch up / Stay on track / Get ahead / Exam prep.
 * If "Exam prep" selected, show exam type sub-cards.
 */

import type { WizardState } from "@/lib/wizard/types";
import { LEARNING_GOALS, EXAM_TYPES } from "@/lib/wizard/types";

interface StepLearningGoalProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export default function StepLearningGoal({
  state,
  onChange,
}: StepLearningGoalProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          What&apos;s the goal for {state.displayName || "your child"}?
        </h3>
        <p className="text-sm text-gray-500">
          This helps us tailor the difficulty and pace.
        </p>
      </div>

      {/* Goal Cards */}
      <div className="grid grid-cols-2 gap-3">
        {LEARNING_GOALS.map((goal) => {
          const isSelected = state.learningGoal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() =>
                onChange({
                  learningGoal: goal.value,
                  examType:
                    goal.value !== "EXAM_PREP" ? "" : state.examType,
                })
              }
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 text-purple-600 text-lg">
                  ✓
                </span>
              )}
              <span className="text-2xl block mb-2">{goal.icon}</span>
              <p className="font-medium text-gray-900 text-sm">{goal.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {goal.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Exam Type Sub-Selection */}
      {state.learningGoal === "EXAM_PREP" && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Which exam?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {EXAM_TYPES.map((exam) => {
              const isSelected = state.examType === exam.value;
              return (
                <button
                  key={exam.value}
                  type="button"
                  onClick={() => onChange({ examType: exam.value })}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {exam.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
