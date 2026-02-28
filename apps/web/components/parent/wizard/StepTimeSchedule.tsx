"use client";

/**
 * Wizard Step 3: Time & Schedule
 *
 * Range slider for daily minutes, live estimate, deadline picker.
 */

import { useMemo } from "react";
import type { WizardState } from "@/lib/wizard/types";
import { TIME_STOPS } from "@/lib/wizard/types";

interface StepTimeScheduleProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export default function StepTimeSchedule({
  state,
  onChange,
}: StepTimeScheduleProps) {
  // Estimate months to grade proficiency
  const estimateMonths = useMemo(() => {
    // Simple formula: assume ~120 remaining concepts per grade
    // Each session at dailyMinutes masters ~2.5 concepts
    // sessions per month = (dailyMinutes / 60) * 30
    const remaining = 120;
    const sessionsPerMonth = (state.dailyMinutesTarget / 60) * 30;
    const conceptsPerMonth = sessionsPerMonth * 2.5;
    return Math.max(1, Math.round(remaining / conceptsPerMonth));
  }, [state.dailyMinutesTarget]);

  // Get the current year's June 15 (or next year if past June)
  const endOfSchoolYear = useMemo(() => {
    const now = new Date();
    const year =
      now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    return `${year}-06-15`;
  }, []);

  // Find closest TIME_STOPS index
  const sliderIndex = TIME_STOPS.findIndex(
    (t) => t >= state.dailyMinutesTarget
  );
  const currentIndex = sliderIndex === -1 ? TIME_STOPS.length - 1 : sliderIndex;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          How much time per day?
        </h3>
        <p className="text-sm text-gray-500">
          Even 15 minutes a day makes a huge difference.
        </p>
      </div>

      {/* Time Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl font-bold text-purple-600">
            {state.dailyMinutesTarget} min
          </span>
          <span className="text-sm text-gray-500">per day</span>
        </div>

        <input
          type="range"
          min={0}
          max={TIME_STOPS.length - 1}
          value={currentIndex}
          onChange={(e) =>
            onChange({
              dailyMinutesTarget: TIME_STOPS[parseInt(e.target.value)],
            })
          }
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />

        <div className="flex justify-between mt-1">
          {TIME_STOPS.map((t) => (
            <span key={t} className="text-xs text-gray-400">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Estimate */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          At {state.dailyMinutesTarget} min/day,{" "}
          <strong>{state.displayName || "your child"}</strong> can reach grade
          proficiency in ~
          <strong>{estimateMonths} month{estimateMonths !== 1 ? "s" : ""}</strong>.
        </p>
      </div>

      {/* Target Date */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Set a deadline? (optional)
        </p>
        <div className="space-y-2">
          {[
            {
              value: "NONE" as const,
              label: "No deadline",
              description: "Learn at their own pace",
            },
            {
              value: "END_OF_YEAR" as const,
              label: "End of school year",
              description: `June 15, ${endOfSchoolYear.split("-")[0]}`,
            },
            {
              value: "CUSTOM" as const,
              label: "Pick a date",
              description: "Set a custom target",
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange({
                  targetDateOption: option.value,
                  targetDate:
                    option.value === "END_OF_YEAR"
                      ? endOfSchoolYear
                      : option.value === "NONE"
                        ? ""
                        : state.targetDate,
                })
              }
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                state.targetDateOption === option.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-medium text-gray-900">
                {option.label}
              </p>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>

        {state.targetDateOption === "CUSTOM" && (
          <div className="mt-3">
            <input
              type="date"
              value={state.targetDate}
              onChange={(e) => onChange({ targetDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
