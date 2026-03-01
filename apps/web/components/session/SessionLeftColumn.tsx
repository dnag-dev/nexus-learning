"use client";

/**
 * SessionLeftColumn — Desktop left column for session 3-column layout.
 *
 * Shows:
 * - Persona avatar (correct emoji from persona-config)
 * - Persona name
 * - 5-step vertical stepper (36px circles)
 * - "Learn" button at bottom
 */

import { getPersonaById, type PersonaId } from "@/lib/personas/persona-config";

interface SessionLeftColumnProps {
  personaId: PersonaId;
  learningStep: number;
  phase: string;
  onLearnClick?: () => void;
}

const STEP_NAMES = ["Learn", "Check", "Guided", "Practice", "Prove"];

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

  // Use persona-config for correct avatar and name
  const persona = getPersonaById(personaId);
  const avatarEmoji = persona?.avatarPlaceholder || "🤖";
  const personaName = persona?.name?.split(" ")[0] || "Cosmo";

  return (
    <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[200px] bg-[#0A1628] border-r border-white/5 flex-col items-center pt-20 pb-6 z-10">
      {/* Persona Avatar — 60px with gold ring */}
      <div className="w-[60px] h-[60px] rounded-full bg-[#0D1B2A] ring-2 ring-amber-400 flex items-center justify-center text-3xl mb-2">
        {avatarEmoji}
      </div>
      <p className="text-sm text-gray-400 font-medium mb-8">
        {personaName}
      </p>

      {/* Vertical Stepper — 36px circles */}
      <div className="flex flex-col items-center gap-0 flex-1">
        {STEP_NAMES.map((name, i) => {
          const stepNum = i + 1;
          const isCurrent = learningStep === stepNum;
          const isCompleted = learningStep > stepNum;
          const isCurrentOrPast = learningStep >= stepNum;

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

              {/* Step Circle — 36px (w-9 h-9) */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCurrent
                    ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0A1628] animate-pulse"
                    : isCompleted
                      ? "bg-amber-500 text-white"
                      : "border-2 border-gray-600 text-gray-500 bg-transparent"
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
