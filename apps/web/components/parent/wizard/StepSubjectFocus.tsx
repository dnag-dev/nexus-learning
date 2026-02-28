"use client";

/**
 * Wizard Step 5: Subject Focus
 *
 * Three large cards: Math only / English only / Both.
 */

import type { WizardState } from "@/lib/wizard/types";

interface StepSubjectFocusProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

const SUBJECTS = [
  {
    value: "MATH" as const,
    label: "Math",
    icon: "🔢",
    description: "Numbers, operations, problem-solving, geometry, and more",
    color: "blue",
  },
  {
    value: "ENGLISH" as const,
    label: "English",
    icon: "📚",
    description: "Reading, writing, grammar, vocabulary, and comprehension",
    color: "green",
  },
  {
    value: "BOTH" as const,
    label: "Both",
    icon: "🎯",
    description: "Balanced learning across Math and English",
    color: "purple",
  },
];

export default function StepSubjectFocus({
  state,
  onChange,
}: StepSubjectFocusProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          What should {state.displayName || "your child"} focus on?
        </h3>
        <p className="text-sm text-gray-500">
          You can change this anytime in settings.
        </p>
      </div>

      <div className="space-y-3">
        {SUBJECTS.map((subject) => {
          const isSelected = state.subjectFocus === subject.value;
          return (
            <button
              key={subject.value}
              type="button"
              onClick={() => onChange({ subjectFocus: subject.value })}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{subject.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{subject.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {subject.description}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-purple-600 text-xl">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
