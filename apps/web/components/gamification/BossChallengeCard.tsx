"use client";

/**
 * Boss Challenge Card — Shows boss challenge status, character, and progress.
 */

import {
  getChallengeTypeLabel,
  getChallengeTypeIcon,
  getDifficultyLabel,
  formatTimeRemaining,
  getTimeRemaining,
  getBossTaunt,
  type BossChallengeState,
} from "@/lib/gamification/boss-challenge";
import { useEffect, useState, useMemo } from "react";

// ─── Types ───

interface BossChallengeCardProps {
  challenge: BossChallengeState;
  onStart?: () => void;
  onContinue?: () => void;
  className?: string;
}

// ─── Status styles ───

const STATUS_STYLES = {
  LOCKED: "bg-gray-100 border-gray-200",
  AVAILABLE: "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300",
  ACTIVE: "bg-gradient-to-br from-red-50 to-orange-50 border-red-300",
  COMPLETED: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300",
  FAILED: "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300",
};

// ─── Component ───

export default function BossChallengeCard({
  challenge,
  onStart,
  onContinue,
  className = "",
}: BossChallengeCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getTimeRemaining(challenge)
  );

  // Use first taunt deterministically to avoid hydration mismatch
  // (Math.random() differs between server and client)
  const [taunt, setTaunt] = useState(challenge.character.taunts[0]);

  useEffect(() => {
    // Pick a random taunt on client only
    setTaunt(getBossTaunt(challenge.character));
  }, [challenge.character]);

  // Update timer for active challenges
  useEffect(() => {
    if (challenge.status !== "ACTIVE") return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(challenge));
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const typeLabel = getChallengeTypeLabel(challenge.config.type);
  const typeIcon = getChallengeTypeIcon(challenge.config.type);
  const difficultyLabel = getDifficultyLabel(challenge.config.difficulty);

  return (
    <div
      className={`rounded-xl border-2 p-5 ${STATUS_STYLES[challenge.status]} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{challenge.character.emoji}</span>
            <div>
              <h3 className="font-bold text-lg">{challenge.character.name}</h3>
              <p className="text-xs text-gray-500">
                {challenge.character.title}
              </p>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            challenge.status === "AVAILABLE"
              ? "bg-purple-100 text-purple-700"
              : challenge.status === "ACTIVE"
                ? "bg-red-100 text-red-700"
                : challenge.status === "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : challenge.status === "FAILED"
                    ? "bg-gray-200 text-gray-600"
                    : "bg-gray-100 text-gray-400"
          }`}
        >
          {challenge.status === "AVAILABLE"
            ? "Ready!"
            : challenge.status === "ACTIVE"
              ? "In Progress"
              : challenge.status === "COMPLETED"
                ? "Defeated!"
                : challenge.status === "FAILED"
                  ? "Failed"
                  : "Locked"}
        </span>
      </div>

      {/* Challenge info */}
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
        <span>
          {typeIcon} {typeLabel}
        </span>
        <span className="text-gray-300">|</span>
        <span>{difficultyLabel}</span>
        <span className="text-gray-300">|</span>
        <span>{challenge.config.questionCount} questions</span>
      </div>

      {/* Taunt/message */}
      {challenge.status === "AVAILABLE" && (
        <p className="text-sm italic text-purple-600 mb-3">
          &ldquo;{taunt}&rdquo;
        </p>
      )}

      {/* Active challenge progress */}
      {challenge.status === "ACTIVE" && (
        <div className="mb-3">
          {/* Timer */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Time remaining</span>
            <span
              className={`font-mono font-bold ${
                timeRemaining < 60 ? "text-red-600" : "text-gray-700"
              }`}
            >
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>

          {/* Question progress */}
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span>
              {challenge.questionsAnswered}/{challenge.config.questionCount}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (challenge.questionsAnswered / challenge.config.questionCount) *
                  100
                }%`,
              }}
            />
          </div>

          {/* Accuracy */}
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">Correct</span>
            <span className="font-medium">
              {challenge.correctAnswers}/{challenge.questionsAnswered}
            </span>
          </div>
        </div>
      )}

      {/* Rewards info */}
      {(challenge.status === "AVAILABLE" || challenge.status === "LOCKED") && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>🏆 {challenge.config.pointsReward} pts</span>
          <span>⭐ {challenge.config.xpReward} XP</span>
          <span>⏰ {Math.floor(challenge.config.timeLimitSecs / 60)} min</span>
        </div>
      )}

      {/* Action button */}
      {challenge.status === "AVAILABLE" && onStart && (
        <button
          onClick={onStart}
          className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
        >
          Accept Challenge!
        </button>
      )}

      {challenge.status === "ACTIVE" && onContinue && (
        <button
          onClick={onContinue}
          className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
        >
          Continue Challenge
        </button>
      )}

      {challenge.status === "LOCKED" && (
        <p className="text-center text-sm text-gray-400">
          Available every Sunday • Master 5+ concepts to unlock
        </p>
      )}

      {challenge.status === "COMPLETED" && (
        <div className="text-center">
          <p className="text-green-600 font-medium text-sm">
            {challenge.character.name} has been defeated!
          </p>
        </div>
      )}

      {challenge.status === "FAILED" && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Keep practicing! You can try again next week.
          </p>
        </div>
      )}
    </div>
  );
}
