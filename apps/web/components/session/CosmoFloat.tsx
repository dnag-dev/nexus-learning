"use client";

/**
 * CosmoFloat — Mobile-only floating Cosmo avatar.
 *
 * 60px floating avatar, fixed bottom-right, subtle bounce animation.
 * Only shows during active session phases on mobile.
 */

import type { PersonaId } from "@/lib/personas/persona-config";

interface CosmoFloatProps {
  personaId: PersonaId;
  phase: string;
}

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
};

export default function CosmoFloat({ personaId, phase }: CosmoFloatProps) {
  const isActive = ["practice", "feedback", "struggling"].includes(phase);

  if (!isActive) return null;

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-40">
      <div className="w-[60px] h-[60px] rounded-full bg-[#1a2740] border-2 border-purple-500/30 flex items-center justify-center text-3xl shadow-lg animate-bounce-gentle">
        {PERSONA_EMOJI[personaId] || "🐻"}
      </div>
    </div>
  );
}
