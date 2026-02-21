"use client";

/**
 * Level Up Celebration — Full-screen overlay when a student levels up.
 */

import { getLevelTitle } from "@/lib/gamification/xp";
import { useEffect, useState } from "react";

interface LevelUpCelebrationProps {
  newLevel: number;
  newTitle: string;
  xpEarned: number;
  onComplete: () => void;
}

export default function LevelUpCelebration({
  newLevel,
  newTitle,
  xpEarned,
  onComplete,
}: LevelUpCelebrationProps) {
  const [stage, setStage] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    // Enter → show
    const showTimer = setTimeout(() => setStage("show"), 100);
    // Auto-dismiss after 4 seconds
    const exitTimer = setTimeout(() => setStage("exit"), 4000);
    const completeTimer = setTimeout(onComplete, 4500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        stage === "enter"
          ? "opacity-0"
          : stage === "exit"
            ? "opacity-0"
            : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onComplete}
    >
      <div
        className={`text-center transition-transform duration-500 ${
          stage === "show" ? "scale-100" : "scale-75"
        }`}
      >
        {/* Stars/sparkles */}
        <div className="text-6xl mb-4 animate-bounce">🌟</div>

        {/* Level up text */}
        <h2 className="text-4xl font-bold text-white mb-2">LEVEL UP!</h2>

        {/* Level number */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-3xl font-bold mb-4 shadow-lg">
          {newLevel}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-amber-300 mb-2">
          {newTitle}
        </h3>

        {/* XP earned */}
        <p className="text-lg text-white/70">+{xpEarned} XP</p>

        {/* Tap to continue */}
        <p className="text-sm text-white/40 mt-6">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
