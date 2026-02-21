"use client";

/**
 * Star Detail Panel — Shows concept details when a star is clicked.
 */

import type { StarNode } from "./StarMap";

interface StarDetailProps {
  star: StarNode | null;
  onClose: () => void;
  onStartSession?: (conceptId: string) => void;
}

const STATE_LABELS: Record<string, string> = {
  dim: "Undiscovered",
  glowing: "Learning",
  bright: "Mastered",
  pulsing: "Just Mastered!",
};

const STATE_COLORS: Record<string, string> = {
  dim: "text-gray-400",
  glowing: "text-blue-400",
  bright: "text-amber-400",
  pulsing: "text-purple-400",
};

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  0: "Not started yet",
  1: "Exposure — Introduction",
  2: "Guided Discovery",
  3: "Scaffolded Practice",
  4: "Independent Practice",
  5: "Transfer & Application",
};

export default function StarDetail({ star, onClose, onStartSession }: StarDetailProps) {
  if (!star) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-lg">{star.name}</h4>
          <p className={`text-sm ${STATE_COLORS[star.state]}`}>
            {STATE_LABELS[star.state]}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 text-xl leading-none"
        >
          &times;
        </button>
      </div>

      {/* Mastery level */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-white/60 mb-1">
          <span>Mastery Level</span>
          <span>{star.level}/5</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(star.level / 5) * 100}%`,
              backgroundColor:
                star.level >= 5
                  ? "#F59E0B"
                  : star.level >= 3
                    ? "#3B82F6"
                    : "#6B7280",
            }}
          />
        </div>
        <p className="text-xs text-white/40 mt-1">
          {LEVEL_DESCRIPTIONS[star.level] ?? "Unknown level"}
        </p>
      </div>

      {/* Subject */}
      <div className="text-sm text-white/50 mb-3">Subject: {star.subject}</div>

      {/* Due for review badge (Phase 8) */}
      {star.dueForReview && (
        <div className="mb-3 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <p className="text-sm text-orange-300 font-medium">
            Due for review
          </p>
          <p className="text-xs text-orange-300/70">
            A quick review will help lock in this concept.
          </p>
        </div>
      )}

      {/* Action button */}
      {star.state !== "bright" && star.state !== "pulsing" && onStartSession && (
        <button
          onClick={() => onStartSession(star.id)}
          className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          {star.state === "dim" ? "Start Learning" : "Continue Learning"}
        </button>
      )}

      {(star.state === "bright" || star.state === "pulsing") && !star.dueForReview && (
        <div className="text-center py-2 text-amber-400 text-sm">
          Concept mastered! Review scheduled.
        </div>
      )}

      {(star.state === "bright" || star.state === "pulsing") && star.dueForReview && onStartSession && (
        <button
          onClick={() => onStartSession(star.id)}
          className="w-full py-2 px-4 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium transition-colors"
        >
          Review Now
        </button>
      )}
    </div>
  );
}
