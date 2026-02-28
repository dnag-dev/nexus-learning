"use client";

/**
 * SessionLeftColumn — Desktop left column for session 3-column layout.
 *
 * Shows:
 * - Cosmo avatar (centered)
 * - Persona name
 * - 5-step vertical stepper
 * - "Learn" button at bottom
 */

import type { PersonaId } from "@/lib/personas/persona-config";

interface SessionLeftColumnProps {
  personaId: PersonaId;
  learningStep: number;
  phase: string;
  onLearnClick?: () => void;
}

const STEP_NAMES = ["Learn", "Check", "Guided", "Practice", "Prove"];

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
};

const PERSONA_NAMES: Record<string, string> = {
  cosmo: "Cosmo",
  luna: "Luna",
  rex: "Rex",
  nova: "Nova",
  pip: "Pip",
  koda: "Koda",
  zara: "Zara",
};

export default function SessionLeftColumn({
  personaId,
  learningStep,
  phase,
  onLearnClick,
}: SessionLeftColumnProps) {
  const isActive = ["teaching", "practice", "feedback", "struggling"].includes(
    phase
  );

  if (!isActive) return null;

  return (
    <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] bg-[#0A1628] border-r border-white/5 flex-col items-center pt-20 pb-6 z-10">
      {/* Cosmo Avatar */}
      <div className="text-6xl mb-2">{PERSONA_EMOJI[personaId] || "🐻"}</div>
      <p className="text-sm text-gray-400 font-medium mb-8">
        {PERSONA_NAMES[personaId] || "Cosmo"}
      </p>

      {/* Vertical Stepper */}
      <div className="flex flex-col items-center gap-0 flex-1">
        {STEP_NAMES.map((name, i) => {
          const stepNum = i + 1;
          const isCurrentOrPast = learningStep >= stepNum;
          const isCurrent = learningStep === stepNum;
          const isCompleted = learningStep > stepNum;

          return (
            <div key={name} className="flex flex-col items-center">
              {/* Connector line (before, except first) */}
              {i > 0 && (
                <div
                  className={`w-0.5 h-6 ${
                    isCurrentOrPast ? "bg-purple-500" : "bg-gray-700"
                  }`}
                />
              )}

              {/* Step Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0A1628] animate-pulse"
                    : isCompleted
                      ? "bg-amber-500 text-white"
                      : "bg-gray-700 text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </div>

              {/* Step Label */}
              <p
                className={`text-xs mt-1 ${
                  isCurrent
                    ? "text-purple-400 font-semibold"
                    : isCompleted
                      ? "text-amber-400"
                      : "text-gray-600"
                }`}
              >
                {name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Learn Button */}
      {onLearnClick && (
        <button
          onClick={onLearnClick}
          className="mt-auto px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors border border-blue-500/20"
        >
          📖 Learn
        </button>
      )}
    </div>
  );
}
