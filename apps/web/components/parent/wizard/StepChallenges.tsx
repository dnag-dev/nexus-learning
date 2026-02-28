"use client";

/**
 * Wizard Step 4: Challenges
 *
 * Checkbox grid of common learning challenges.
 * Multi-select with "Not sure yet" option.
 */

import type { WizardState } from "@/lib/wizard/types";
import { CHALLENGE_OPTIONS } from "@/lib/wizard/types";

interface StepChallengesProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

const NOT_SURE = "NOT_SURE";

export default function StepChallenges({
  state,
  onChange,
}: StepChallengesProps) {
  const toggleChallenge = (value: string) => {
    if (value === NOT_SURE) {
      // Toggle "Not sure" — clears all others
      onChange({
        initialChallenges: state.initialChallenges.includes(NOT_SURE)
          ? []
          : [NOT_SURE],
      });
      return;
    }

    // Remove NOT_SURE if selecting specific challenges
    const without = state.initialChallenges.filter((c) => c !== NOT_SURE);
    const updated = without.includes(value)
      ? without.filter((c) => c !== value)
      : [...without, value];
    onChange({ initialChallenges: updated });
  };

  const isChecked = (value: string) =>
    state.initialChallenges.includes(value);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Any areas {state.displayName || "your child"} struggles with?
        </h3>
        <p className="text-sm text-gray-500">
          Select all that apply. This helps our AI focus on what matters.
        </p>
      </div>

      {/* Math Challenges */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Math
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CHALLENGE_OPTIONS.math.map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => toggleChallenge(ch.value)}
              className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left transition-all ${
                isChecked(ch.value)
                  ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {isChecked(ch.value) ? "✓ " : ""}
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* English Challenges */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          English
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CHALLENGE_OPTIONS.english.map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => toggleChallenge(ch.value)}
              className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left transition-all ${
                isChecked(ch.value)
                  ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {isChecked(ch.value) ? "✓ " : ""}
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Not Sure */}
      <button
        type="button"
        onClick={() => toggleChallenge(NOT_SURE)}
        className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-left transition-all ${
          isChecked(NOT_SURE)
            ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
            : "border-gray-200 text-gray-600 hover:border-gray-300"
        }`}
      >
        {isChecked(NOT_SURE) ? "✓ " : ""}
        Not sure yet — let diagnostic figure it out
      </button>
    </div>
  );
}
