"use client";

import { useEffect } from "react";

interface TeachingCardProps {
  /** The structured teaching content from Claude (Step 1: TEACH IT) */
  content: {
    emoji: string;
    hook: string;
    explanation: string;
    example: string;
    example2?: string;
    commonMistake?: string;
    commonMistakeWhy?: string;
  } | null;
  /** Whether we're still waiting for Claude's response */
  isLoading: boolean;
  /** Current learning step (1-5) for the progress indicator */
  lessonStep?: number;
  /** Total steps in the learning loop */
  totalSteps?: number;
  /** Called when all staggered animations have completed */
  onAnimationsComplete?: () => void;
}

export default function TeachingCard({
  content,
  isLoading,
  lessonStep = 1,
  totalSteps = 5,
  onAnimationsComplete,
}: TeachingCardProps) {
  // Fire onAnimationsComplete after all sections have animated in
  useEffect(() => {
    if (!content || isLoading) return;
    const timer = setTimeout(() => {
      onAnimationsComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, isLoading, onAnimationsComplete]);

  // Step labels for the progress indicator
  const stepLabels = ["Learn", "Check", "Guided", "Practice", "Prove"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* ─── 5-Step Progress Bar ─── */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                i < lessonStep
                  ? "bg-aauti-primary"
                  : i === lessonStep - 1
                    ? "bg-aauti-primary/70"
                    : "bg-white/10"
              }`}
            />
            <p className={`text-[10px] mt-1 text-center ${
              i < lessonStep ? "text-aauti-primary" : "text-gray-600"
            }`}>
              {stepLabels[i]}
            </p>
          </div>
        ))}
      </div>

      {isLoading || !content ? (
        /* ─── Loading State: Bouncing Dots ─── */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 rounded-full bg-aauti-primary animate-teaching-dot" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-gray-400 text-sm mt-4">Preparing your lesson...</p>
        </div>
      ) : (
        /* ─── Content: Staggered Fade-In (richer: hook, definition, 2 examples, common mistake) ─── */
        <div className="space-y-4">
          {/* Emoji + Hook Question */}
          <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <div className="text-6xl mb-3">{content.emoji}</div>
            <h2 className="text-2xl font-bold text-white leading-snug px-4">
              {content.hook}
            </h2>
          </div>

          {/* Explanation Card — clear definition */}
          <div
            className="bg-[#1A2744] rounded-2xl p-6 border border-white/10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <p className="text-white leading-relaxed text-lg">
              {content.explanation}
            </p>
          </div>

          {/* Example 1 — gold border */}
          <div
            className="bg-[#1E2D4A] rounded-2xl p-5 border border-white/5 border-l-4 border-l-[#FDCB6E] opacity-0 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">💡</span>
              <div>
                <p className="font-semibold text-[#FDCB6E] text-sm mb-1">Example 1</p>
                <p className="text-white/90 leading-relaxed" dangerouslySetInnerHTML={{
                  __html: content.example
                    .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-[#FDCB6E]">$1</span>')
                }} />
              </div>
            </div>
          </div>

          {/* Example 2 — blue border */}
          {content.example2 && (
            <div
              className="bg-[#1E2D4A] rounded-2xl p-5 border border-white/5 border-l-4 border-l-blue-400 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "700ms" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">💡</span>
                <div>
                  <p className="font-semibold text-blue-400 text-sm mb-1">Example 2</p>
                  <p className="text-white/90 leading-relaxed" dangerouslySetInnerHTML={{
                    __html: content.example2
                      .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-blue-400">$1</span>')
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Common Mistake — red/warning card */}
          {content.commonMistake && (
            <div
              className="bg-red-500/5 rounded-2xl p-5 border border-red-500/15 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "900ms" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-red-400 text-sm mb-1">Watch Out!</p>
                  <p className="text-white/90 leading-relaxed">{content.commonMistake}</p>
                  {content.commonMistakeWhy && (
                    <p className="text-gray-400 text-sm mt-2">{content.commonMistakeWhy}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
