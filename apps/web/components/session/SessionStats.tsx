"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { getSubjectColors } from "@/lib/session/subject-colors";

// ─── Types ───

interface MasteryInfo {
  level: string;
  probability: number;
  practiceCount: number;
  correctCount: number;
}

export interface SessionStatsProps {
  mastery: MasteryInfo | null;
  correctStreak: number;
  conceptsMasteredThisSession: number;
  sessionXPEarned: number;
  previousMasteryProbability: number;
  domain: string;
  totalMasteredAllTime: number;
  earnedBadgeIds: string[];
  phase: string;
}

export interface MobileStatsRowProps extends SessionStatsProps {
  isExpanded: boolean;
  onToggle: () => void;
}

// ─── Constants ───

const MASTERY_LEVELS = ["NOVICE", "DEVELOPING", "PROFICIENT", "ADVANCED", "MASTERED"];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NOVICE: { bg: "bg-gray-500/20", text: "text-gray-300", border: "border-gray-500/30" },
  DEVELOPING: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30" },
  PROFICIENT: { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30" },
  ADVANCED: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  MASTERED: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30" },
};

const MASTERY_THRESHOLDS = [
  { count: 1, badgeId: "first_star", name: "First Star", icon: "⭐" },
  { count: 5, badgeId: "five_stars", name: "Star Cluster", icon: "🌟" },
  { count: 10, badgeId: "ten_stars", name: "Constellation Builder", icon: "✨" },
  { count: 25, badgeId: "twenty_five_stars", name: "Galaxy Architect", icon: "🎯" },
  { count: 50, badgeId: "fifty_stars", name: "Nebula Master", icon: "👑" },
  { count: 100, badgeId: "hundred_stars", name: "Universe Conqueror", icon: "🏆" },
];

// ─── Helpers ───

function getLevelNumber(level: string): number {
  const idx = MASTERY_LEVELS.indexOf(level);
  return idx >= 0 ? idx + 1 : 1;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case "teaching":
      return "Learning";
    case "practice":
    case "feedback":
      return "Practicing";
    case "struggling":
      return "Review";
    default:
      return "In Session";
  }
}

function getNextMilestone(
  totalMasteredAllTime: number,
  conceptsMasteredThisSession: number,
  earnedBadgeIds: string[]
): { label: string; icon: string } {
  const currentTotal = totalMasteredAllTime + conceptsMasteredThisSession;
  const earnedSet = new Set(earnedBadgeIds);

  for (const threshold of MASTERY_THRESHOLDS) {
    if (currentTotal < threshold.count && !earnedSet.has(threshold.badgeId)) {
      const remaining = threshold.count - currentTotal;
      return {
        label: `${remaining} more to ${threshold.name}`,
        icon: threshold.icon,
      };
    }
  }

  return { label: "All mastery badges earned!", icon: "🏆" };
}

// ─── Mastery Meter (animated circular gauge — dark theme with gradient arc) ───

function MasteryMeter({
  probability,
  previousProbability,
  domain,
  size = "lg",
}: {
  probability: number;
  previousProbability: number;
  domain: string;
  size?: "lg" | "sm";
}) {
  const colors = getSubjectColors(domain);
  const [glowing, setGlowing] = useState(false);
  const prevProbRef = useRef(previousProbability);

  // Detect mastery increase for glow effect
  useEffect(() => {
    if (probability > prevProbRef.current && prevProbRef.current > 0) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 2000);
      return () => clearTimeout(timer);
    }
    prevProbRef.current = probability;
  }, [probability]);

  // Spring animation for smooth arc transitions
  // Show a minimum 3% fill so the ring always has some gold visible
  const displayProb = Math.max(probability, 3);
  const displayPrev = Math.max(previousProbability, 0);

  const springProb = useSpring(displayPrev, {
    stiffness: 80,
    damping: 15,
    mass: 0.5,
  });

  useEffect(() => {
    springProb.set(displayProb);
  }, [displayProb, springProb]);

  const isLarge = size === "lg";
  const viewBox = isLarge ? 160 : 80;
  const center = viewBox / 2;
  const radius = isLarge ? 65 : 32;
  const strokeWidth = isLarge ? 10 : 6;
  const circumference = 2 * Math.PI * radius;
  const containerSize = isLarge ? 150 : 72;

  const strokeDashoffset = useTransform(
    springProb,
    [0, 100],
    [circumference, 0]
  );

  // 85% threshold marker position
  const thresholdFrac = 85 / 100;
  const thresholdAngle = thresholdFrac * 360 - 90; // start from top
  const thresholdRad = (thresholdAngle * Math.PI) / 180;
  const thresholdX = center + radius * Math.cos(thresholdRad);
  const thresholdY = center + radius * Math.sin(thresholdRad);

  // Glow when probability > 70% or when mastery just increased
  const showGlow = probability > 70 || glowing;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${showGlow ? "animate-ring-glow" : ""}`}
        style={{ width: containerSize, height: containerSize }}
      >
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          className="w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Gradient definition for the arc */}
          <defs>
            <linearGradient id={`mastery-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDCB6E" />
              <stop offset="100%" stopColor="#F39C12" />
            </linearGradient>
          </defs>

          {/* Background track — visible ring on dark */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Progress arc — gold to orange gradient */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#mastery-gradient-${size})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />

          {/* 85% threshold marker */}
          <circle
            cx={thresholdX}
            cy={thresholdY}
            r={isLarge ? 4 : 2.5}
            fill="#D63031"
            stroke="rgba(13,27,42,0.8)"
            strokeWidth={isLarge ? 1.5 : 1}
          />
        </svg>

        {/* Center text — white on dark */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: "rotate(0deg)" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={probability}
              initial={{ scale: 1.3, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className={`${isLarge ? "text-2xl" : "text-base"} font-extrabold text-[#1F2937]`}
            >
              {probability}%
            </motion.span>
          </AnimatePresence>
          <span className={`${isLarge ? "text-xs" : "text-[10px]"} text-[#6B7280]`}>
            Mastery
          </span>
        </div>
      </div>

      {isLarge && (
        <div className="text-center mt-1.5 space-y-1">
          <span className="text-xs text-[#6B7280]">
            85% to master
          </span>
          {/* Phase 8: Mastery clarity — show gain/loss per answer */}
          <div className="text-[10px] text-[#9CA3AF] leading-tight">
            <span className="text-green-400">✅ Correct ≈ +15%</span>
            {" · "}
            <span className="text-red-400">❌ Wrong ≈ -10%</span>
          </div>
          <p className="text-[10px] text-gray-600 italic">
            Never resets to zero!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Streak animation hook ───

function useStreakAnim(streak: number) {
  const prevStreakRef = useRef(streak);
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    if (streak > prevStreakRef.current) {
      setAnimClass("animate-streak-bump");
    } else if (streak === 0 && prevStreakRef.current > 0) {
      setAnimClass("animate-streak-shake");
    }
    prevStreakRef.current = streak;

    const timer = setTimeout(() => setAnimClass(""), 400);
    return () => clearTimeout(timer);
  }, [streak]);

  return animClass;
}

// ─── Desktop Sidebar (dark theme) ───

export default function SessionStats({
  mastery,
  correctStreak,
  conceptsMasteredThisSession,
  sessionXPEarned,
  previousMasteryProbability,
  domain,
  totalMasteredAllTime,
  earnedBadgeIds,
  phase,
}: SessionStatsProps) {
  const level = mastery?.level ?? "NOVICE";
  const levelNum = getLevelNumber(level);
  const levelStyle = LEVEL_COLORS[level] ?? LEVEL_COLORS.NOVICE;
  const probability = mastery?.probability ?? 0;
  const phaseLabel = getPhaseLabel(phase);
  const milestone = getNextMilestone(totalMasteredAllTime, conceptsMasteredThisSession, earnedBadgeIds);
  const streakAnim = useStreakAnim(correctStreak);

  return (
    <div className="flex flex-col h-full p-5 pt-8 gap-5">
      {/* Section 1: Current Level */}
      <div className="text-center">
        <span
          className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
        >
          {level}
        </span>
        <p className="text-xs text-[#6B7280] mt-2">
          {levelNum} of 5 &middot; {phaseLabel}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#E2E8F0]" />

      {/* Section 2: Mastery Meter (most prominent — no label, self-explanatory) */}
      <div className="text-center">
        <MasteryMeter
          probability={probability}
          previousProbability={previousMasteryProbability}
          domain={domain}
          size="lg"
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-[#E2E8F0]" />

      {/* Section 3: Streak — mini card */}
      <div className={`bg-[#F3F4F6] rounded-xl p-3 border border-[#E2E8F0] ${streakAnim}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm text-[#6B7280] font-medium">Streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-[#1F2937]">{correctStreak}</span>
            <span className="text-xs text-[#9CA3AF]">in a row</span>
          </div>
        </div>
      </div>

      {/* Section 4: Concepts Mastered Today — mini card */}
      <div className="bg-[#F3F4F6] rounded-xl p-3 border border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm text-[#6B7280] font-medium">Mastered</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={conceptsMasteredThisSession}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xl font-bold text-[#1F2937]"
            >
              {conceptsMasteredThisSession}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Section 5: Next Milestone — mini card */}
      <div className="bg-[#F3F4F6] rounded-xl p-3 border border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{milestone.icon}</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Next Milestone
            </p>
            <p className="text-sm text-[#6B7280] leading-snug">
              {milestone.label}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom spacer + XP earned — mini card */}
      <div className="mt-auto">
        <div className="bg-[#F3F4F6] rounded-xl p-3 border border-[#E2E8F0] text-center">
          <p className="text-xs text-[#6B7280]">Session XP</p>
          <p className="text-lg font-bold text-aauti-primary">+{sessionXPEarned}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Stats Row (dark theme) ───

export function MobileStatsRow({
  mastery,
  correctStreak,
  conceptsMasteredThisSession,
  isExpanded,
  onToggle,
  domain,
  totalMasteredAllTime,
  earnedBadgeIds,
  phase,
}: MobileStatsRowProps) {
  const colors = getSubjectColors(domain);
  const probability = mastery?.probability ?? 0;
  const level = mastery?.level ?? "NOVICE";
  const levelStyle = LEVEL_COLORS[level] ?? LEVEL_COLORS.NOVICE;
  const milestone = getNextMilestone(totalMasteredAllTime, conceptsMasteredThisSession, earnedBadgeIds);

  return (
    <div className="border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
      {/* Compact row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-5 text-sm">
          {/* Mastery % */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <span className="font-bold" style={{ color: colors.primary }}>
              {probability}%
            </span>
          </div>
          {/* Streak */}
          <div className="flex items-center gap-1">
            <span className="text-sm">🔥</span>
            <span className="font-medium text-[#1F2937]">{correctStreak}</span>
          </div>
          {/* Concepts */}
          <div className="flex items-center gap-1">
            <span className="text-sm">⭐</span>
            <span className="font-medium text-[#1F2937]">{conceptsMasteredThisSession}</span>
          </div>
        </div>

        {/* Chevron */}
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-[#9CA3AF]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expandable detail section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-3 gap-3">
              {/* Mini Mastery Gauge */}
              <div className="flex flex-col items-center">
                <MasteryMeter
                  probability={probability}
                  previousProbability={probability}
                  domain={domain}
                  size="sm"
                />
                {/* Phase 8: Mobile mastery clarity */}
                <p className="text-[9px] text-[#9CA3AF] mt-1 text-center leading-tight">
                  <span className="text-green-400">✅+15%</span>{" "}
                  <span className="text-red-400">❌-10%</span>
                </p>
              </div>

              {/* Level + Phase */}
              <div className="flex flex-col items-center justify-center">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                >
                  {level}
                </span>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  {getLevelNumber(level)} of 5
                </p>
                <p className="text-[10px] text-[#6B7280] font-medium">
                  {getPhaseLabel(phase)}
                </p>
              </div>

              {/* Next Milestone */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-lg">{milestone.icon}</span>
                <p className="text-[10px] text-[#6B7280] leading-tight mt-0.5">
                  {milestone.label}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
