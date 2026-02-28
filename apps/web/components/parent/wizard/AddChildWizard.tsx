"use client";

/**
 * AddChildWizard — Full-screen overlay wizard for adding a child.
 *
 * 6 steps with progress indicator, back/next, and close buttons.
 * AnimatePresence for step transitions.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { WizardState } from "@/lib/wizard/types";
import { INITIAL_WIZARD_STATE } from "@/lib/wizard/types";
import { useParent } from "@/lib/parent-context";
import StepBasicInfo from "./StepBasicInfo";
import StepLearningGoal from "./StepLearningGoal";
import StepTimeSchedule from "./StepTimeSchedule";
import StepChallenges from "./StepChallenges";
import StepSubjectFocus from "./StepSubjectFocus";
import StepLoading from "./StepLoading";

interface AddChildWizardProps {
  onClose: () => void;
}

const STEP_LABELS = [
  "Basic Info",
  "Learning Goal",
  "Schedule",
  "Challenges",
  "Subject",
  "Creating...",
];

const TOTAL_STEPS = 6;

export default function AddChildWizard({ onClose }: AddChildWizardProps) {
  const { parentId } = useParent();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validation per step
  const canAdvance = (): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!state.displayName.trim()) return false;
        if (state.pin && state.pin !== state.pinConfirm) return false;
        if (state.pin && !/^\d{4}$/.test(state.pin)) return false;
        if (
          state.username &&
          (state.username.length < 3 ||
            !/^[a-zA-Z0-9_]+$/.test(state.username))
        )
          return false;
        return true;
      case 1: // Learning Goal
        if (!state.learningGoal) return false;
        if (state.learningGoal === "EXAM_PREP" && !state.examType) return false;
        return true;
      case 2: // Schedule
        return state.dailyMinutesTarget > 0;
      case 3: // Challenges
        return state.initialChallenges.length > 0;
      case 4: // Subject Focus
        return !!state.subjectFocus;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!canAdvance()) return;
    setError("");
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setError("");
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSuccess = (childId: string) => {
    // Redirect to child detail page
    window.location.href = `/dashboard/child/${childId}`;
  };

  const handleError = (errMsg: string) => {
    setError(errMsg);
    setDirection(-1);
    setStep(4); // Go back to last interactive step
  };

  const isSubmitting = step === TOTAL_STEPS - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Wizard Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Add a Child Profile
            </h2>
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i <= step ? "bg-purple-500" : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Step {step + 1} of {TOTAL_STEPS}: {STEP_LABELS[step]}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ x: direction * 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <StepBasicInfo state={state} onChange={updateState} />
              )}
              {step === 1 && (
                <StepLearningGoal state={state} onChange={updateState} />
              )}
              {step === 2 && (
                <StepTimeSchedule state={state} onChange={updateState} />
              )}
              {step === 3 && (
                <StepChallenges state={state} onChange={updateState} />
              )}
              {step === 4 && (
                <StepSubjectFocus state={state} onChange={updateState} />
              )}
              {step === 5 && (
                <StepLoading
                  state={state}
                  parentId={parentId}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — Back / Next buttons */}
        {!isSubmitting && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={step === 0 ? onClose : goBack}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {step === 0 ? "Cancel" : "← Back"}
            </button>
            <button
              onClick={goNext}
              disabled={!canAdvance()}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === TOTAL_STEPS - 2 ? "Create Profile" : "Next →"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
