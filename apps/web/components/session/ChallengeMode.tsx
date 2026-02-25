"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChallengeQuestion {
  scenario: string;
  question: string;
  hints: string[];
}

interface ChallengeEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  isCorrect: boolean;
}

interface ChallengeModeProps {
  sessionId: string;
  onComplete: (evaluation: ChallengeEvaluation) => void;
  onBack: () => void;
}

export default function ChallengeMode({
  sessionId,
  onComplete,
  onBack,
}: ChallengeModeProps) {
  const [challenge, setChallenge] = useState<ChallengeQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<ChallengeEvaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch challenge on mount
  useEffect(() => {
    fetch(`/api/session/challenge?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.challenge) {
          setChallenge(data.challenge);
          startTimeRef.current = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(Date.now() - startTimeRef.current);
          }, 1000);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!challenge || !answer.trim() || isSubmitting) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/session/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answer: answer.trim(),
          responseTimeMs: Date.now() - startTimeRef.current,
          scenario: challenge.scenario,
          question: challenge.question,
        }),
      });
      const data = await res.json();
      setEvaluation(data);
      onComplete(data);
    } catch (err) {
      console.error("Challenge submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-teaching-dot" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-teaching-dot" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-teaching-dot" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Creating your challenge...
          </p>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Challenge header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">
              CHALLENGE MODE
            </p>
            <p className="text-xs text-gray-400">
              Show what you know!
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-white">
            {formatTime(elapsed)}
          </p>
        </div>
      </div>

      {/* Scenario */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-4">
        <p className="text-white leading-relaxed">{challenge.scenario}</p>
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-xl p-5 mb-4">
        <p className="text-white text-lg font-medium">{challenge.question}</p>
      </div>

      {/* Evaluation result */}
      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 space-y-3"
          >
            {/* Score circle */}
            <div className="flex justify-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                evaluation.score >= 85
                  ? "border-green-500 bg-green-500/10"
                  : evaluation.score >= 70
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-red-500 bg-red-500/10"
              }`}>
                <span className={`text-2xl font-bold ${
                  evaluation.score >= 85
                    ? "text-green-400"
                    : evaluation.score >= 70
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}>
                  {evaluation.score}
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-300 text-sm">{evaluation.feedback}</p>
            </div>

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
              <div className="bg-green-500/10 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-400 mb-1">Strengths</p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-300 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {evaluation.improvements.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">To Improve</p>
                <ul className="space-y-1">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-amber-300 flex items-start gap-1">
                      <span className="text-amber-500 mt-0.5">*</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
            >
              Continue Learning
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer area (hidden when evaluation is shown) */}
      {!evaluation && (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors min-h-[120px]"
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between mt-3">
            {/* Hint button */}
            <button
              onClick={() => {
                setShowHint(true);
                setHintIndex((prev) =>
                  Math.min(prev + 1, challenge.hints.length)
                );
              }}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              disabled={hintIndex >= challenge.hints.length}
            >
              {hintIndex >= challenge.hints.length
                ? "No more hints"
                : `Need a hint? (${challenge.hints.length - hintIndex} left)`}
            </button>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {isSubmitting ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>

          {/* Hint display */}
          <AnimatePresence>
            {showHint && hintIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3"
              >
                {challenge.hints.slice(0, hintIndex).map((h, i) => (
                  <p key={i} className="text-sm text-blue-300 mb-1">
                    <span className="text-blue-500 mr-1">Hint {i + 1}:</span>
                    {h}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
