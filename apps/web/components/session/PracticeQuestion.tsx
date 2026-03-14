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

  // Reset local selection when question changes or phase resets to practice
  useEffect(() => {
    setLocalSelected(null);
    setConfirmed(false);
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
            // Confirmed correct — green
            buttonStyle = "border-2 border-[#3DB54A] bg-[#F0FDF4]";
            badgeBg = "#3DB54A";
            badgeText = "#FFFFFF";
            iconOverlay = <span className="text-[#3DB54A] text-lg">✅</span>;
          } else if (showResult && isSelected && !option.isCorrect) {
            // Confirmed wrong — red
            buttonStyle = "border-2 border-[#FF4B4B] bg-[#FFF1F2]";
            badgeBg = "#FF4B4B";
            badgeText = "#FFFFFF";
            iconOverlay = <span className="text-[#FF4B4B] text-lg">❌</span>;
          } else if (showResult && option.isCorrect) {
            // Correct answer revealed (after wrong submission)
            buttonStyle = "border-2 border-[#3DB54A] bg-[#F0FDF4] opacity-90";
            badgeBg = "#3DB54A";
            badgeText = "#FFFFFF";
            iconOverlay = <span className="text-[#3DB54A] text-sm">✅</span>;
          } else if (isSelected && !showResult) {
            // Selected but not yet confirmed — blue highlight
            buttonStyle = "border-2 border-[#1CB0F6] bg-[#EFF6FF] shadow-md";
          } else {
            // Unselected — white with subtle border
            buttonStyle = "border-[1.5px] border-[#E2E8F0] bg-white";
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
                        borderColor: "#1CB0F6",
                        backgroundColor: "#EFF6FF",
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
                    backgroundColor: isSelected && !showResult ? "#1CB0F6" : badgeBg,
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
                  <span className="text-[#1CB0F6] text-sm font-bold">✓</span>
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
                className="w-full py-3.5 text-[15px] font-bold text-white rounded-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 active:translate-y-0.5 active:shadow-none"
                style={{
                  background: "#1CB0F6",
                  boxShadow: "0 4px 0 #0A85C7",
                  border: "none",
                }}
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

      {/* ─── Wrong Answer: Warm Explanation ─── */}
      {showResult && wasWrong && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 overflow-hidden"
        >
          <div style={{
            background: "#FFF1F2",
            border: "1.5px solid #FECDD3",
            borderRadius: "12px",
            padding: "14px 16px",
          }}>
            {/* Warm opener */}
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#881337", marginBottom: "6px" }}>
              Not quite! 💙
            </div>

            {/* What they chose */}
            {selectedOptionObj && (
              <div style={{ fontSize: "13px", color: "#9F1239", marginBottom: "4px" }}>
                You chose: {selectedOptionObj.text}
              </div>
            )}

            {/* Correct answer */}
            {correctOption && (
              <div style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#15803D",
                background: "#F0FDF4",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "8px",
              }}>
                ✅ Correct answer: {correctOption.text}
              </div>
            )}

            {/* Explanation from Claude */}
            {question.explanation && (
              <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, marginBottom: "8px" }}>
                {question.explanation}
              </div>
            )}

            {/* Encouragement */}
            <div style={{ fontSize: "12px", color: "#6B7280" }}>
              Keep going — you&apos;re building this! 💪
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Correct Answer: Celebration + Collapsible Explanation ─── */}
      {showResult && wasCorrect && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 overflow-hidden"
        >
          <div style={{
            background: "#F0FDF4",
            border: "1.5px solid #86EFAC",
            borderRadius: "12px",
            padding: "12px 16px",
          }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#15803D", marginBottom: "4px" }}>
              Correct! ⭐
            </div>
            {question.explanation && (
              <details style={{ fontSize: "12px", color: "#374151" }}>
                <summary style={{ cursor: "pointer", color: "#16A34A", fontWeight: 500 }}>Why? →</summary>
                <div style={{ marginTop: "6px", lineHeight: 1.6 }}>{question.explanation}</div>
              </details>
            )}
          </div>
        </motion.div>
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
