"use client";

import { useEffect } from "react";

interface TeachingCardProps {
  /** The structured teaching content from Claude */
  content: {
    emoji: string;
    hook: string;
    explanation: string;
    example: string;
  } | null;
  /** Whether we're still waiting for Claude's response */
  isLoading: boolean;
  /** Current step in the lesson for the progress indicator (1-based) */
  lessonStep?: number;
  /** Total steps in the lesson for the progress indicator */
  totalSteps?: number;
  /** Called when all staggered animations have completed */
  onAnimationsComplete?: () => void;
}

export default function TeachingCard({
  content,
  isLoading,
  lessonStep = 1,
  totalSteps = 3,
  onAnimationsComplete,
}: TeachingCardProps) {
  // Fire onAnimationsComplete after all sections have animated in
  // Last section at 600ms delay + 500ms animation = 1100ms
  useEffect(() => {
    if (!content || isLoading) return;
    const timer = setTimeout(() => {
      onAnimationsComplete?.();
    }, 1400);
    return () => clearTimeout(timer);
  }, [content, isLoading, onAnimationsComplete]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* ─── Progress Bar (Instagram-style segments) ─── */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < lessonStep
                ? "bg-aauti-primary"
                : i === lessonStep
                  ? "bg-aauti-primary/40"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {isLoading || !content ? (
        /* ─── Loading State: Bouncing Dots ─── */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex gap-2">
            <div
              className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Preparing your lesson...
          </p>
        </div>
      ) : (
        /* ─── Content State: Staggered Fade-In Sections ─── */
        <div className="space-y-5">
          {/* Emoji + Hook — appears first */}
          <div
            className="text-center opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <div className="text-6xl mb-3">{content.emoji}</div>
            <h2 className="text-2xl font-bold text-white leading-snug px-4">
              {content.hook}
            </h2>
          </div>

          {/* Explanation Card — dark surface */}
          <div
            className="bg-[#1A2744] rounded-2xl p-6 border border-white/10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <p className="text-white leading-relaxed text-lg">
              {content.explanation}
            </p>
          </div>

          {/* Example Callout — gold left border + distinct dark surface */}
          <div
            className="bg-[#1E2D4A] rounded-2xl p-5 border border-white/5 border-l-4 border-l-[#FDCB6E] opacity-0 animate-fade-in-up"
            style={{ animationDelay: "600ms" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">💡</span>
              <div>
                <p className="font-semibold text-[#FDCB6E] text-sm mb-1">
                  Real-world example
                </p>
                <p className="text-white/90 leading-relaxed">
                  {content.example}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
