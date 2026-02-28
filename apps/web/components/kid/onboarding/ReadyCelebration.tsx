"use client";

/**
 * Onboarding Step 4 — Celebration & ready to go!
 *
 * Confetti-style celebration with Cosmo, then a big "Let's go!" button.
 */

import { useState, useEffect } from "react";
import { useChild } from "@/lib/child-context";

interface Props {
  subjectFocus: string | null;
  onComplete: () => void;
}

export default function ReadyCelebration({ subjectFocus, onComplete }: Props) {
  const { studentId, displayName, avatarPersonaId } = useChild();
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const PERSONA_EMOJI: Record<string, string> = {
    cosmo: "🐻",
    luna: "🐱",
    rex: "🦖",
    nova: "🦊",
    pip: "🦉",
    koda: "🐶",
    zara: "🦋",
  };
  const emoji = PERSONA_EMOJI[avatarPersonaId] || "🐻";

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch(`/api/student/${studentId}/complete-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectFocus }),
      });
    } catch {
      // Non-critical — proceed anyway
    }
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center relative overflow-hidden">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-fade-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                fontSize: `${16 + Math.random() * 20}px`,
                animationDelay: `${Math.random() * 1}s`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            >
              {["✨", "🌟", "⭐", "🎉", "🎊", "💫"][i % 6]}
            </div>
          ))}
        </div>
      )}

      {/* Large Cosmo */}
      <div className="text-[120px] sm:text-[140px] mb-4 animate-bounce-subtle select-none relative z-10">
        {emoji}
      </div>

      {/* Message */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 relative z-10">
        You&apos;re All Set! 🎉
      </h1>
      <p className="text-lg text-gray-400 mb-2 max-w-sm relative z-10">
        Great job, {displayName}!
      </p>
      <p className="text-sm text-gray-500 mb-8 max-w-sm relative z-10">
        Your personalized learning path is ready. Let&apos;s start learning!
      </p>

      {/* Start button */}
      <button
        onClick={handleComplete}
        disabled={saving}
        className="w-full max-w-sm py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-2xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 hover:-translate-y-1 transition-all duration-200 shadow-lg shadow-green-500/30 disabled:opacity-60 relative z-10"
      >
        {saving ? "Setting up..." : "Let's Go! 🚀"}
      </button>
    </div>
  );
}
