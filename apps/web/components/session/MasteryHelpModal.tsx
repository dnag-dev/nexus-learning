"use client";

/**
 * MasteryHelpModal — Explains how the mastery system works.
 *
 * Two modes:
 * 1. Full modal (triggered by "?" button in session header)
 * 2. First-session onboarding tooltip (auto-shown once, then never again)
 *
 * Content explains:
 * - What the mastery percentage means
 * - The 5-step learning loop
 * - What 85% means (topic complete)
 * - That wrong answers are okay (floor at 5%)
 * - How the progress ring works
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface MasteryHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If true, shows condensed onboarding tooltip style */
  variant?: "modal" | "tooltip";
}

const STEPS = [
  {
    step: 1,
    name: "Learn",
    emoji: "📖",
    description: "Read the explanation and examples",
    range: "0-20%",
  },
  {
    step: 2,
    name: "Check",
    emoji: "🤔",
    description: "Answer an easy question to check understanding",
    range: "20-40%",
  },
  {
    step: 3,
    name: "Guided",
    emoji: "🤝",
    description: "Practice with hints available (need 2/3 correct)",
    range: "40-60%",
  },
  {
    step: 4,
    name: "Practice",
    emoji: "💪",
    description: "Practice without hints (need 4/5 correct)",
    range: "60-80%",
  },
  {
    step: 5,
    name: "Prove",
    emoji: "🏆",
    description: "One final question to prove mastery",
    range: "80-85%+",
  },
];

export default function MasteryHelpModal({
  isOpen,
  onClose,
  variant = "modal",
}: MasteryHelpModalProps) {
  if (!isOpen) return null;

  if (variant === "tooltip") {
    return <OnboardingTooltip onClose={onClose} />;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] max-h-[80vh] overflow-y-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl z-50"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#1F2937]">
                  How Mastery Works
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#6B7280] hover:text-[#1F2937] text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Mastery Explanation */}
              <div className="space-y-5">
                {/* Section 1: What is mastery */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    What does the percentage mean?
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    The mastery percentage shows how well you know a topic.
                    When it reaches <span className="text-yellow-400 font-semibold">85%</span>,
                    you&apos;ve mastered the concept and can move on!
                  </p>
                </div>

                {/* Section 2: The 5 steps */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-400 mb-3">
                    The 5 learning steps
                  </h3>
                  <div className="space-y-2">
                    {STEPS.map((s) => (
                      <div
                        key={s.step}
                        className="flex items-start gap-3 py-2 px-3 rounded-lg bg-[#F3F4F6]"
                      >
                        <span className="text-lg flex-shrink-0">{s.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1F2937]">
                              Step {s.step}: {s.name}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                              {s.range}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {s.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Wrong answers are okay */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">
                    Wrong answers are okay! 💚
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Getting something wrong doesn&apos;t reset your progress.
                    Your mastery might drop a little, but it never goes below 5%.
                    Every wrong answer teaches the system what to help you with next.
                  </p>
                </div>

                {/* Section 4: Progress ring */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-400 mb-1">
                    The progress ring
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    The gold ring around your avatar fills up as your mastery grows.
                    The red dot marks 85% — when the ring reaches it, you&apos;ve mastered the topic!
                    After mastering, you can review anytime to keep your skills sharp.
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Onboarding Tooltip (shown once on first session) ───

function OnboardingTooltip({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  const TOOLTIP_STEPS = [
    {
      title: "Welcome to your first lesson! 🎉",
      body: "Let me show you how learning works here.",
    },
    {
      title: "Your mastery score",
      body: "The percentage shows how well you know this topic. Get it to 85% to master it!",
    },
    {
      title: "5 steps to mastery",
      body: "Learn → Check → Guided Practice → Independent Practice → Prove It. Each step gets a bit harder.",
    },
    {
      title: "Wrong answers are okay!",
      body: "Making mistakes helps the system learn what to teach you next. Your score never drops to zero.",
    },
  ];

  const current = TOOLTIP_STEPS[step];
  const isLast = step === TOOLTIP_STEPS.length - 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white border border-purple-500/30 rounded-2xl shadow-2xl z-50 p-5"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🤖</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-1">
              {current.title}
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              {current.body}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {TOOLTIP_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-purple-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-[#9CA3AF] hover:text-[#6B7280]"
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (isLast) {
                  onClose();
                } else {
                  setStep(step + 1);
                }
              }}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isLast ? "Let's go!" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Hook: should show onboarding tooltip? ───

/**
 * Returns true if the student hasn't seen the mastery onboarding tooltip yet.
 * Uses localStorage to track.
 */
export function useShouldShowMasteryOnboarding(studentId: string): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const key = `mastery-onboarding-${studentId}`;
    if (!localStorage.getItem(key)) {
      setShouldShow(true);
    }
  }, [studentId]);

  return shouldShow;
}

/**
 * Mark the mastery onboarding as seen for this student.
 */
export function markMasteryOnboardingSeen(studentId: string): void {
  const key = `mastery-onboarding-${studentId}`;
  localStorage.setItem(key, "true");
}
