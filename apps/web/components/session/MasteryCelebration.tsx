"use client";

import { useEffect, useState, useRef } from "react";
import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarDisplayHandle } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";

interface MasteryInfo {
  level: string;
  probability: number;
  practiceCount: number;
  correctCount: number;
}

interface CelebrationContent {
  celebration: string;
  funFact: string;
  nextTeaser: string;
}

interface GamificationData {
  xpAwarded: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newTitle: string | null;
}

interface MasteryCelebrationProps {
  personaId: PersonaId;
  isSpeaking: boolean;
  liveAvatarReady: boolean;
  avatarRef: React.RefObject<AvatarDisplayHandle>;
  onTalkingChange: (isTalking: boolean) => void;
  mastery: MasteryInfo;
  celebration: CelebrationContent;
  gamification: GamificationData | null;
  onNextConcept: () => void;
  onEndSession: () => void;
}

export default function MasteryCelebration({
  personaId,
  isSpeaking,
  liveAvatarReady,
  avatarRef,
  onTalkingChange,
  mastery,
  celebration,
  gamification,
  onNextConcept,
  onEndSession,
}: MasteryCelebrationProps) {
  // ─── Confetti on Mount ───
  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;
      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FDCB6E", "#6C5CE7", "#00B894", "#FF6B6B", "#74B9FF"],
      });
      // Second burst (staggered)
      setTimeout(() => {
        if (cancelled) return;
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.5, x: 0.6 },
          colors: ["#FDCB6E", "#6C5CE7", "#00B894"],
        });
      }, 300);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── XP Count-Up Animation ───
  const [displayXP, setDisplayXP] = useState(0);
  const targetXP = gamification?.xpAwarded ?? 0;
  const animatedRef = useRef(false);

  useEffect(() => {
    if (targetXP === 0 || animatedRef.current) return;
    animatedRef.current = true;

    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.round(eased * targetXP));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [targetXP]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        {/* ─── Avatar ─── */}
        <div className="mx-auto mb-6 flex items-center justify-center">
          <AvatarDisplay
            ref={avatarRef}
            personaId={personaId}
            speaking={isSpeaking}
            emotionalState="happy"
            size="xl"
            enableLiveAvatar={liveAvatarReady}
            onTalkingChange={onTalkingChange}
          />
        </div>

        {/* ─── Title with Golden Gradient ─── */}
        <h1 className="text-5xl font-extrabold text-gradient-gold mb-4">
          Concept Mastered!
        </h1>

        {/* ─── Star Burst + Badge ─── */}
        <div className="relative inline-block mb-4">
          {/* Star burst animation layer */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-star-burst">
              <svg
                viewBox="0 0 100 100"
                className="w-28 h-28 text-yellow-400"
              >
                <polygon
                  points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35"
                  fill="currentColor"
                  opacity="0.25"
                />
              </svg>
            </div>
          </div>
          {/* Mastery badge */}
          <span className="relative z-10 inline-block px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">
            {mastery.level} &mdash; {mastery.probability}%
          </span>
        </div>

        {/* ─── XP Counter ─── */}
        {targetXP > 0 && (
          <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <span className="text-3xl font-extrabold text-gradient-gold">
              +{displayXP} XP
            </span>
          </div>
        )}

        {/* ─── Celebration Card ─── */}
        <div
          className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 text-left shadow-sm opacity-0 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <p className="text-aauti-text-primary leading-relaxed mb-4">
            {celebration.celebration}
          </p>

          {/* Fun Fact — Dark Navy Box */}
          <div className="bg-aauti-bg-dark rounded-xl p-4 mb-4">
            <p className="text-white/90 text-sm leading-relaxed">
              <span className="mr-1.5">⭐</span>
              <span className="font-semibold">Fun fact:</span>{" "}
              {celebration.funFact}
            </p>
          </div>

          <p className="text-aauti-text-primary font-medium">
            {celebration.nextTeaser}
          </p>
        </div>

        {/* ─── Action Buttons ─── */}
        <div
          className="flex gap-3 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "600ms" }}
        >
          <button
            onClick={onNextConcept}
            className="flex-1 py-3.5 text-white font-semibold rounded-xl shadow-lg animate-bounce-subtle bg-gradient-to-r from-aauti-primary to-purple-600 hover:from-purple-600 hover:to-aauti-primary transition-all"
          >
            Next Concept →
          </button>
          <button
            onClick={onEndSession}
            className="py-3.5 px-6 border border-gray-200 rounded-xl text-aauti-text-secondary hover:bg-gray-50 transition-colors"
          >
            Done for now
          </button>
        </div>
      </main>
    </div>
  );
}
