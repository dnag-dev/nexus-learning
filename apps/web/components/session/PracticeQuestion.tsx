"use client";

/**
 * PracticeQuestion — Two-step answer confirmation + explanation display.
 *
 * Phase 10: Click option → highlights as "selected" → "Check Answer ✓" button
 * appears → student confirms → THEN submit to API. Prevents accidental taps.
 *
 * After submission, shows:
 * - ✅ Correct: green highlight + collapsible "Why?" explanation
 * - ❌ Wrong: red highlight + correct answer in green + explanation always visible
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSubjectColors } from "@/lib/session/subject-colors";

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface PracticeQuestionData {
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
}

interface HintContent {
  hint: string;
  encouragement: string;
}

interface PracticeQuestionProps {
  question: PracticeQuestionData;
  phase: "practice" | "feedback";
  feedback: { message: string; type: string } | null;
  selectedOption: string | null;
  isLoading: boolean;
  hint: HintContent | null;
  domain: string;
  error: string | null;
  onSubmitAnswer: (optionId: string) => void;
  onRequestHint?: () => void;
  onClearError: () => void;
}

export default function PracticeQuestion({
  question,
  phase,
  feedback,
  selectedOption,
  isLoading,
  hint,
  domain,
  error,
  onSubmitAnswer,
  onRequestHint,
  onClearError,
}: PracticeQuestionProps) {
  const colors = getSubjectColors(domain);

  // ─── Phase 10: Two-step answer selection ───
  // localSelected = what the student clicked (pre-confirm)
  // confirmed = whether "Check Answer" has been clicked (triggers API call)
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Phase 10: Collapsible explanation for correct answers
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset local selection when question changes or phase resets to practice
  useEffect(() => {
    setLocalSelected(null);
    setConfirmed(false);
    setShowExplanation(false);
  }, [question.questionText]);

  // Phase 10: Step 1 — select an option (no submission yet)
  const handleOptionClick = (optionId: string) => {
    if (confirmed || phase === "feedback" || isLoading) return;
    // Toggle: clicking same option deselects
    setLocalSelected((prev) => (prev === optionId ? null : optionId));
  };

  // Phase 10: Step 2 — confirm selection and submit
  const handleConfirm = () => {
    if (!localSelected || confirmed || isLoading) return;
    setConfirmed(true);
    onSubmitAnswer(localSelected);
  };

  // Which option to show as highlighted — use localSelected pre-confirm, selectedOption post-confirm
  const displaySelected = confirmed ? selectedOption : localSelected;
  const showResult = phase === "feedback";

  // After feedback, determine if answer was correct for explanation display
  const wasCorrect = showResult && feedback?.type === "correct";
  const wasWrong = showResult && feedback?.type !== "correct";
  const correctOption = question.options.find((o) => o.isCorrect);
  const selectedOptionObj = question.options.find((o) => o.id === displaySelected);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── Feedback Banner ─── */}
      {showResult && feedback && (
        <div
          className={`mb-6 p-4 rounded-2xl text-center font-medium animate-fade-in-up ${
            feedback.type === "correct"
              ? "bg-aauti-success/15 text-aauti-success border border-aauti-success/20"
              : "bg-aauti-warning/15 text-aauti-warning border border-aauti-warning/20"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* ─── Question Card with Left Accent Border ─── */}
      <div
        className="bg-white rounded-2xl p-6 border border-[#E2E8F0] mb-6 border-l-4 shadow-sm"
        style={{ borderLeftColor: colors.border }}
      >
        <p className="text-xl text-[#1F2937] leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {/* ─── Choice Buttons — dark surface ─── */}
      <div className="space-y-3 mb-4">
        {question.options.map((option) => {
          const isSelected = displaySelected === option.id;

          let buttonStyle = "";
          let badgeBg = colors.badgeBg;
          let badgeText = colors.badgeText;
          let iconOverlay: React.ReactNode = null;

          if (showResult && isSelected && option.isCorrect) {
            // Correct answer selected — green
            buttonStyle = "bg-aauti-success/15 border-2 border-aauti-success";
            badgeBg = "#00B894";
            iconOverlay = <span className="text-aauti-success text-lg">✅</span>;
          } else if (showResult && isSelected && !option.isCorrect) {
            // Wrong answer selected — red
            buttonStyle = "bg-aauti-danger/15 border-2 border-aauti-danger";
            badgeBg = "#D63031";
            iconOverlay = <span className="text-aauti-danger text-lg">❌</span>;
          } else if (showResult && option.isCorrect) {
            // Correct answer not selected — show the right answer
            buttonStyle = "bg-aauti-success/10 border-2 border-aauti-success/50";
            badgeBg = "#00B894";
            badgeText = "#FFFFFF";
            iconOverlay = <span className="text-aauti-success text-sm">✅</span>;
          } else if (isSelected && !showResult) {
            // Phase 10: Selected but not yet confirmed — cyan highlight
            buttonStyle = "border-2 shadow-md ring-1 ring-cyan-400/30";
          } else {
            // Default state — light surface with subtle border
            buttonStyle = "border-2 border-[#E2E8F0] bg-white";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={showResult || isLoading || confirmed}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${buttonStyle} disabled:cursor-default group`}
              style={
                {
                  ...(isSelected && !showResult
                    ? {
                        borderColor: "#06b6d4", // cyan-500 for pre-confirm selection
                        backgroundColor: "rgba(6, 182, 212, 0.08)",
                      }
                    : {}),
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                if (phase === "practice" && !isLoading && !isSelected && !confirmed) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                  e.currentTarget.style.borderColor = `${colors.primary}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (phase === "practice" && !isSelected && !confirmed) {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.borderColor = "";
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: isSelected && !showResult ? "#06b6d4" : badgeBg,
                    color: isSelected && !showResult ? "#FFFFFF" : badgeText,
                  }}
                >
                  {option.id}
                </span>
                <span className="text-[#1F2937] flex-1 font-medium">
                  {option.text}
                </span>
                {/* Phase 10: Checkmark icon on pre-confirm selected option */}
                {isSelected && !showResult && !confirmed && (
                  <span className="text-cyan-400 text-sm font-bold">✓</span>
                )}
                {/* Result icons after submission */}
                {iconOverlay}
                {isLoading && isSelected && confirmed && (
                  <span className="flex-shrink-0 w-5 h-5 border-2 border-aauti-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Phase 10: "Check Answer" confirmation button ─── */}
      {phase === "practice" && !confirmed && (
        <AnimatePresence>
          {localSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full py-3.5 text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl hover:from-cyan-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                Check Answer ✓
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── Loading Indicator (during API call after confirm) ─── */}
      {isLoading && confirmed && (
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 text-aauti-primary animate-pulse">
            <span className="w-4 h-4 border-2 border-aauti-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">
              Checking your answer...
            </span>
          </div>
        </div>
      )}

      {/* ─── Phase 10: Wrong Answer Explanation (always shown) ─── */}
      {showResult && wasWrong && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 overflow-hidden"
        >
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
            <div className="space-y-3">
              {/* What student chose vs correct */}
              {selectedOptionObj && correctOption && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-sm mt-0.5">❌</span>
                    <p className="text-sm text-red-600">
                      <span className="font-medium">You chose:</span>{" "}
                      <span className="text-[#1F2937]">{selectedOptionObj.text}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 text-sm mt-0.5">✅</span>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Correct answer:</span>{" "}
                      <span className="text-[#1F2937]">{correctOption.text}</span>
                    </p>
                  </div>
                </div>
              )}
              {/* Why explanation */}
              <div className="flex items-start gap-2 pt-1 border-t border-blue-100">
                <span className="text-lg mt-0.5">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">Why?</p>
                  <p className="text-sm text-[#374151] leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Phase 10: Correct Answer Explanation (collapsible) ─── */}
      {showResult && wasCorrect && question.explanation && (
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
          >
            {showExplanation ? "Hide explanation ▲" : "Want to know why? 💡"}
          </button>
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-[#374151] leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Hint (inline below choices — Steps 2-3 only) ─── */}
      {phase === "practice" && !isLoading && !confirmed && (onRequestHint || hint) && (
        <div className="mt-2">
          <AnimatePresence mode="wait">
            {hint ? (
              <motion.div
                key="hint-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-aauti-accent/15 border border-aauti-accent/25 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-1 text-[#1F2937]">💡 Hint:</p>
                  <p className="text-[#1F2937]/90">{hint.hint}</p>
                  <p className="text-[#6B7280] mt-2 italic">
                    {hint.encouragement}
                  </p>
                </div>
              </motion.div>
            ) : onRequestHint ? (
              <motion.div
                key="hint-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onRequestHint();
                  }}
                  disabled={isLoading}
                  className="text-sm text-aauti-primary hover:underline"
                >
                  💡 Need a hint?
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div className="text-center mt-4">
          <p className="text-sm text-aauti-danger mb-2">{error}</p>
          <button
            onClick={onClearError}
            className="text-sm text-aauti-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
