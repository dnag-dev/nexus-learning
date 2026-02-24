"use client";

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

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* ─── Feedback Banner ─── */}
      {phase === "feedback" && feedback && (
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

      {/* ─── Question Card with Left Accent Border — dark surface ─── */}
      <div
        className="bg-[#1A2744] rounded-2xl p-6 border border-white/10 mb-6 border-l-4"
        style={{ borderLeftColor: colors.border }}
      >
        <p className="text-xl text-white leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {/* ─── Choice Buttons — dark surface ─── */}
      <div className="space-y-3 mb-6">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showResult = phase === "feedback";

          let buttonStyle = "";
          let badgeBg = colors.badgeBg;
          let badgeText = colors.badgeText;

          if (isSelected && !showResult) {
            // Selected but not yet graded
            buttonStyle = "border-2 shadow-md";
            badgeBg = colors.badgeBg;
          } else if (showResult && isSelected && option.isCorrect) {
            // Correct answer selected
            buttonStyle = "bg-aauti-success/15 border-2 border-aauti-success";
            badgeBg = "#00B894";
          } else if (showResult && isSelected && !option.isCorrect) {
            // Wrong answer selected
            buttonStyle = "bg-aauti-danger/15 border-2 border-aauti-danger";
            badgeBg = "#D63031";
          } else if (showResult && option.isCorrect) {
            // Correct answer not selected
            buttonStyle = "bg-aauti-success/10 border-2 border-aauti-success/50";
            badgeBg = "#00B894";
            badgeText = "#FFFFFF";
          } else {
            // Default state — dark surface with subtle border
            buttonStyle = "border-2 border-white/10 bg-[#1A2744]";
          }

          return (
            <button
              key={option.id}
              onClick={() =>
                phase === "practice" && !isLoading && onSubmitAnswer(option.id)
              }
              disabled={phase === "feedback" || isLoading}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${buttonStyle} disabled:cursor-default group`}
              style={
                {
                  ...(isSelected && !showResult
                    ? {
                        borderColor: colors.badgeBg,
                        backgroundColor: colors.hoverBg,
                      }
                    : {}),
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                if (phase === "practice" && !isLoading && !isSelected) {
                  e.currentTarget.style.backgroundColor = colors.hoverBg;
                  e.currentTarget.style.borderColor = `${colors.primary}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (phase === "practice" && !isSelected) {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.borderColor = "";
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: badgeBg,
                    color: badgeText,
                  }}
                >
                  {option.id}
                </span>
                <span className="text-white flex-1 font-medium">
                  {option.text}
                </span>
                {isLoading && isSelected && (
                  <span className="flex-shrink-0 w-5 h-5 border-2 border-aauti-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Loading Indicator ─── */}
      {isLoading && selectedOption && (
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 text-aauti-primary animate-pulse">
            <span className="w-4 h-4 border-2 border-aauti-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">
              Checking your answer...
            </span>
          </div>
        </div>
      )}

      {/* ─── Hint (only shown when onRequestHint provided — Steps 2-3 only) ─── */}
      {phase === "practice" && !isLoading && (onRequestHint || hint) && (
        <div className="text-center">
          {hint ? (
            <div className="bg-aauti-accent/15 border border-aauti-accent/25 rounded-xl p-4 text-sm">
              <p className="font-semibold mb-1 text-white">💡 Hint:</p>
              <p className="text-white/90">{hint.hint}</p>
              <p className="text-gray-300 mt-2 italic">
                {hint.encouragement}
              </p>
            </div>
          ) : onRequestHint ? (
            <button
              onClick={onRequestHint}
              disabled={isLoading}
              className="text-sm text-aauti-primary hover:underline"
            >
              💡 Need a hint?
            </button>
          ) : null}
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
