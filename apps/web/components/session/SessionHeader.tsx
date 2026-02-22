"use client";

import AvatarDisplay from "@/components/persona/AvatarDisplay";
import type { AvatarEmotionalState } from "@/components/persona/AvatarDisplay";
import type { PersonaId } from "@/lib/personas/persona-config";
import { getSubjectColors } from "@/lib/session/subject-colors";

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
}

const MASTERY_BADGE_STYLES: Record<string, string> = {
  NOVICE: "bg-gray-500/30 text-gray-200 border border-gray-400/30",
  DEVELOPING: "bg-blue-500/30 text-blue-200 border border-blue-400/30",
  PROFICIENT: "bg-green-500/30 text-green-200 border border-green-400/30",
  ADVANCED: "bg-purple-500/30 text-purple-200 border border-purple-400/30",
  MASTERED: "bg-gradient-to-r from-yellow-400/30 to-amber-500/30 text-yellow-200 border border-yellow-400/30",
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
}: SessionHeaderProps) {
  const colors = getSubjectColors(domain);
  const masteryPercent = mastery?.probability ?? 0;

  // SVG progress ring math
  const ringRadius = 28;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeOffset = circumference - (circumference * masteryPercent) / 100;

  // Session progress: use mastery probability as progress indicator
  const sessionProgress = Math.min(masteryPercent, 100);

  return (
    <>
      {/* ─── Session Progress Bar (top of screen) ─── */}
      <div className="h-[3px] w-full bg-gray-800/30">
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
        className="px-4 py-3 shadow-lg"
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
                {/* Progress arc with gold glow */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  fill="none"
                  stroke={colors.ringColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="progress-ring-circle"
                  style={{ filter: `drop-shadow(0 0 4px ${colors.ringColor}40)` }}
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
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    MASTERY_BADGE_STYLES[mastery.level] ?? MASTERY_BADGE_STYLES.NOVICE
                  }`}
                >
                  {mastery.level} {mastery.probability}%
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onEnd}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            End Session
          </button>
        </div>
      </header>
    </>
  );
}
