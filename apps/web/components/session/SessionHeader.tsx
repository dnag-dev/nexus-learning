"use client";

/**
 * SessionHeader — Shows topic title, avatar with progress ring, mastery badge.
 *
 * ⚠️ MASTERY CLARITY: The header now shows clear completion criteria:
 * - Badge shows current level + percentage
 * - Below badge: "→ 85% to complete" so students know the target
 * - Progress ring fills from 0→100% mapped to the 85% mastery threshold
 * - When mastered: ring is full gold, badge says "MASTERED ✓"
 */

import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarEmotionalState } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";
import { getSubjectColors } from "@/lib/session/subject-colors";

// Mastery threshold — node is "complete" at this BKT probability
const MASTERY_THRESHOLD = 85; // 85% = BKT_PARAMS.masteryThreshold * 100

interface NodeInfo {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
}

interface MasteryInfo {
  level: string;
  probability: number;
  practiceCount: number;
  correctCount: number;
}

interface SessionHeaderProps {
  personaId: PersonaId;
  speaking: boolean;
  avatarEmotion: AvatarEmotionalState;
  node: NodeInfo | null;
  mastery: MasteryInfo | null;
  domain: string;
  questionsAnswered: number;
  onEnd: () => void;
  /** Callback when the "?" help button is clicked */
  onHelpClick?: () => void;
}

const MASTERY_BADGE_STYLES: Record<string, string> = {
  NOVICE: "bg-white/20 text-white border border-white/30",
  DEVELOPING: "bg-white/20 text-white border border-white/30",
  PROFICIENT: "bg-white/25 text-white border border-white/40",
  ADVANCED: "bg-white/25 text-white border border-white/40",
  MASTERED: "bg-yellow-400/30 text-yellow-100 border border-yellow-300/50",
};

export default function SessionHeader({
  personaId,
  speaking,
  avatarEmotion,
  node,
  mastery,
  domain,
  questionsAnswered,
  onEnd,
  onHelpClick,
}: SessionHeaderProps) {
  const colors = getSubjectColors(domain);
  const masteryPercent = mastery?.probability ?? 0;
  const isMastered = masteryPercent >= MASTERY_THRESHOLD;

  // Progress ring: maps mastery% to fill relative to 85% threshold
  // At 0% → empty ring, at 85%+ → full ring
  const ringProgress = Math.min((masteryPercent / MASTERY_THRESHOLD) * 100, 100);
  const ringRadius = 28;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeOffset = circumference - (circumference * ringProgress) / 100;

  // Session progress bar at top: same mapping
  const sessionProgress = Math.min(ringProgress, 100);

  return (
    <>
      {/* ─── Session Progress Bar (top of screen) ─── */}
      <div className="h-[3px] w-full bg-gray-200">
        <div
          className="h-full transition-all duration-700 ease-out rounded-r-full"
          style={{
            width: `${sessionProgress}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      {/* ─── Gradient Header ─── */}
      <header
        className="px-4 py-3 shadow-md"
        style={{ background: colors.gradient }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with progress ring overlay */}
            <div className="relative flex-shrink-0">
              {/* SVG Progress Ring */}
              <svg
                className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)]"
                viewBox="0 0 64 64"
              >
                {/* Background track */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="3.5"
                />
                {/* Progress arc — gold when mastered, subject color otherwise */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  fill="none"
                  stroke={isMastered ? "#F5C542" : colors.ringColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="progress-ring-circle"
                  style={{ filter: `drop-shadow(0 0 4px ${isMastered ? "#F5C54260" : `${colors.ringColor}40`})` }}
                />
              </svg>
              <AvatarDisplay
                personaId={personaId}
                speaking={speaking}
                emotionalState={avatarEmotion}
                size="md"
              />
            </div>

            <div className="min-w-0">
              <span className="font-semibold text-white text-sm truncate block">
                {node?.title ?? "Learning Session"}
              </span>
              {mastery && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      MASTERY_BADGE_STYLES[mastery.level] ?? MASTERY_BADGE_STYLES.NOVICE
                    }`}
                  >
                    {isMastered ? "MASTERED ✓" : `${mastery.level} ${mastery.probability}%`}
                  </span>
                  {!isMastered && (
                    <span className="text-[10px] text-white/70">
                      → {MASTERY_THRESHOLD}% to complete
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Help button — opens mastery explainer modal */}
            {onHelpClick && (
              <button
                onClick={onHelpClick}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-bold flex items-center justify-center transition-colors"
                title="How does mastery work?"
              >
                ?
              </button>
            )}
            <button
              onClick={onEnd}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
