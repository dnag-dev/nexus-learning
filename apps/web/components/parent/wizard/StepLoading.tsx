"use client";

/**
 * Wizard Step 6: Loading / Submission
 *
 * Full-screen animated loading with Cosmo.
 * Cycling text: Setting up profile... → Mapping learning path... →
 * Building plan... → Almost ready!
 * Calls POST /api/parent/children with all wizard data.
 */

import { useState, useEffect, useCallback } from "react";
import type { WizardState } from "@/lib/wizard/types";

interface StepLoadingProps {
  state: WizardState;
  parentId: string;
  onSuccess: (childId: string) => void;
  onError: (error: string) => void;
}

const LOADING_MESSAGES = [
  "Setting up profile...",
  "Mapping learning path...",
  "Building plan...",
  "Almost ready!",
];

export default function StepLoading({
  state,
  parentId,
  onSuccess,
  onError,
}: StepLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Submit data
  const submit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    try {
      const res = await fetch("/api/parent/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          displayName: state.displayName.trim(),
          gradeLevel: state.gradeLevel,
          ageGroup: state.ageGroup,
          country: state.country,
          learningGoal: state.learningGoal || undefined,
          dailyMinutesTarget: state.dailyMinutesTarget,
          targetDate: state.targetDate || undefined,
          initialChallenges: state.initialChallenges,
          subjectFocus: state.subjectFocus || undefined,
          examType: state.examType || undefined,
          username: state.username.trim().toLowerCase() || undefined,
          pin: state.pin || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Small delay to show final message
        setTimeout(() => onSuccess(data.id), 1000);
      } else {
        const data = await res.json();
        onError(data.error || "Failed to create profile");
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    }
  }, [state, parentId, onSuccess, onError, submitted]);

  useEffect(() => {
    submit();
  }, [submit]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      {/* Cosmo Avatar */}
      <div className="text-7xl mb-6 animate-bounce">🐻</div>

      {/* Loading Message */}
      <p className="text-lg font-semibold text-gray-900 mb-2">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {LOADING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              i <= messageIndex ? "bg-purple-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-gray-400 mt-6">
        Creating a personalized learning path for{" "}
        {state.displayName || "your child"}...
      </p>
    </div>
  );
}
