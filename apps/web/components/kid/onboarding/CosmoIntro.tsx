"use client";

/**
 * Onboarding Step 1 — Cosmo introduces himself.
 *
 * Large animated Cosmo, greeting, and "Let's go!" button.
 */

import { useChild } from "@/lib/child-context";

const PERSONA_EMOJI: Record<string, string> = {
  cosmo: "🐻",
  luna: "🐱",
  rex: "🦖",
  nova: "🦊",
  pip: "🦉",
  koda: "🐶",
  zara: "🦋",
};

const PERSONA_NAME: Record<string, string> = {
  cosmo: "Cosmo",
  luna: "Luna",
  rex: "Rex",
  nova: "Nova",
  pip: "Pip",
  koda: "Koda",
  zara: "Zara",
};

interface Props {
  onNext: () => void;
}

export default function CosmoIntro({ onNext }: Props) {
  const { displayName, avatarPersonaId } = useChild();
  const emoji = PERSONA_EMOJI[avatarPersonaId] || "🐻";
  const name = PERSONA_NAME[avatarPersonaId] || "Cosmo";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Large animated Cosmo */}
      <div className="text-[120px] sm:text-[160px] mb-6 animate-bounce-subtle select-none">
        {emoji}
      </div>

      {/* Greeting */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Hi {displayName}! 👋
      </h1>
      <p className="text-lg text-gray-400 mb-2 max-w-sm">
        I&apos;m <span className="text-purple-400 font-semibold">{name}</span>,
        your personal learning guide.
      </p>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        I&apos;ll help you learn at your own pace and make it fun along the way!
      </p>

      {/* Let's go button */}
      <button
        onClick={onNext}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xl font-bold rounded-2xl hover:from-purple-600 hover:to-purple-800 hover:-translate-y-1 transition-all duration-200 shadow-lg shadow-purple-500/30"
      >
        Let&apos;s Go! 🚀
      </button>
    </div>
  );
}
