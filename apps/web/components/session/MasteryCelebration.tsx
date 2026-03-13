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

/**
 * Phase 3: Grade completion data, included when mastering a node
 * causes the entire grade to be completed for that subject.
 */
interface GradeCompletionData {
  grade: string;
  subject: string;
  totalNodes: number;
  nextGrade: string | null;
  upcomingTopics: string[];
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
  /** Phase 3: Present when this mastery triggers a full grade completion */
  gradeCompletion?: GradeCompletionData | null;
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
  gradeCompletion,
  onNextConcept,
  onEndSession,
}: MasteryCelebrationProps) {
  const gradeDisplay = gradeCompletion
    ? gradeCompletion.grade === "K"
      ? "Kindergarten"
      : `Grade ${gradeCompletion.grade.replace("G", "")}`
    : null;
  const subjectDisplay = gradeCompletion
    ? gradeCompletion.subject === "MATH" ? "Math" : "English"
    : null;
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
        colors: ["#FFC800", "#7C3AED", "#3DB54A", "#FF4B4B", "#1CB0F6"],
      });
      // Second burst (staggered)
      setTimeout(() => {
        if (cancelled) return;
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.5, x: 0.6 },
          colors: ["#FFC800", "#7C3AED", "#3DB54A"],
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

        {/* ─── Phase 3: Grade Completion Celebration ─── */}
        {gradeCompletion && gradeDisplay && (
          <div
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6 text-left opacity-0 animate-fade-in-up"
            style={{ animationDelay: "500ms" }}
          >
            <div className="text-center mb-4">
              <span className="text-4xl">🎓</span>
              <h2 className="text-2xl font-extrabold text-amber-700 mt-2">
                {gradeDisplay} {subjectDisplay} — COMPLETE!
              </h2>
              <p className="text-amber-600 mt-1">
                You mastered all {gradeCompletion.totalNodes} topics!
              </p>
            </div>

            {gradeCompletion.nextGrade && gradeCompletion.upcomingTopics.length > 0 && (
              <div className="border-t border-yellow-200 pt-4 mt-4">
                <p className="font-semibold text-amber-700 mb-2">
                  🚀 Ready for {gradeCompletion.nextGrade === "K" ? "Kindergarten" : `Grade ${gradeCompletion.nextGrade.replace("G", "")}`} {subjectDisplay}?
                </p>
                <p className="text-sm text-amber-600 mb-2">New topics unlocking:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {gradeCompletion.upcomingTopics.map((topic, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-amber-400">•</span> {topic}
                    </li>
                  ))}
                  {gradeCompletion.upcomingTopics.length >= 4 && (
                    <li className="text-amber-500 italic">+ more topics</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ─── Action Buttons ─── */}
        <div
          className="flex gap-3 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "600ms" }}
        >
          <button
            onClick={onNextConcept}
            className="flex-1 py-3.5 text-white font-semibold rounded-xl btn-3d animate-bounce-subtle bg-aauti-primary hover:bg-aauti-primary/90 transition-all"
            style={{ "--btn-shadow-color": "#0A85C7" } as React.CSSProperties}
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
