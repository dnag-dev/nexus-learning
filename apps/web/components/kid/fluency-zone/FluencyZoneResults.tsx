"use client";

/**
 * FluencyZoneResults — Phase 13: End-of-session results screen.
 *
 * Shows: score, accuracy, questions/min, personal best indicator.
 * Arcade-style presentation matching the dark game UI.
 */

interface FluencyZoneResultsProps {
  nodeName: string;
  correctCount: number;
  totalQuestions: number;
  accuracy: number; // 0-100
  questionsPerMin: number;
  averageTimeMs: number;
  isPersonalBest: boolean;
  previousBest: number | null;
  timeLimitSeconds: number;
  onPlayAgain: () => void;
  onChangeTopic: () => void;
  onBack: () => void;
}

export default function FluencyZoneResults({
  nodeName,
  correctCount,
  totalQuestions,
  accuracy,
  questionsPerMin,
  isPersonalBest,
  previousBest,
  timeLimitSeconds,
  onPlayAgain,
  onChangeTopic,
  onBack,
}: FluencyZoneResultsProps) {
  const timeLabel =
    timeLimitSeconds === 60
      ? "1 minute"
      : timeLimitSeconds === 120
        ? "2 minutes"
        : "5 minutes";

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        {/* Personal Best Banner */}
        {isPersonalBest && (
          <div className="mb-6 animate-bounce">
            <p className="text-4xl">🏆</p>
            <p className="text-xl font-bold text-yellow-400 mt-2">
              NEW PERSONAL BEST!
            </p>
            {previousBest !== null && (
              <p className="text-sm text-gray-400 mt-1">
                Previous best: {previousBest} correct
              </p>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold mb-1">
          ⚡ FLUENCY ZONE COMPLETE!
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {nodeName} · {timeLabel}
        </p>

        {/* Score Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          {/* Big Score */}
          <div className="mb-6">
            <p className="text-6xl font-bold text-cyan-400">{correctCount}</p>
            <p className="text-gray-400 text-sm mt-1">
              correct out of {totalQuestions} attempts
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-lg font-bold text-green-400">{accuracy}%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-lg font-bold text-purple-400">
                {questionsPerMin} Q/min
              </p>
              <p className="text-xs text-gray-500">Speed</p>
            </div>
          </div>
        </div>

        {/* Performance Message */}
        <p className="text-sm text-gray-400 mb-8">
          {accuracy >= 90 && questionsPerMin >= 10
            ? "🔥 Outstanding speed and accuracy!"
            : accuracy >= 80
              ? "💪 Great work! Keep building speed."
              : accuracy >= 60
                ? "👍 Good start! Practice more to improve."
                : "Keep at it! Speed comes with practice."}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            Play Again ⚡
          </button>
          <button
            onClick={onChangeTopic}
            className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
          >
            Try Different Topic
          </button>
          <button
            onClick={onBack}
            className="w-full py-2 text-gray-500 hover:text-white text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
