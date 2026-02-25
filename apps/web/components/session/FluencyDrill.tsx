"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FluencyDrillProps {
  sessionId: string;
  question: {
    questionText: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    correctAnswer: string;
    explanation: string;
  };
  benchmarkMs: number | null;
  consecutiveCorrect: number;
  personalBestMs: number | null;
  onAnswer: (result: FluencyAnswerResult) => void;
  onComplete: () => void;
  onRequestNextQuestion: () => void;
}

export interface FluencyAnswerResult {
  isCorrect: boolean;
  responseTimeMs: number;
  consecutiveCorrect: number;
  personalBestMs: number | null;
  newPersonalBest: boolean;
  atBenchmark: boolean;
  completed: boolean;
  flatlineDetected: boolean;
  speedTrend: number[];
  nexusScore: number | null;
}

export default function FluencyDrill({
  sessionId,
  question,
  benchmarkMs,
  consecutiveCorrect: initialConsecutive,
  personalBestMs: initialBest,
  onAnswer,
  onComplete,
  onRequestNextQuestion,
}: FluencyDrillProps) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<FluencyAnswerResult | null>(null);
  const [consecutive, setConsecutive] = useState(initialConsecutive);
  const [personalBest, setPersonalBest] = useState(initialBest);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when question appears
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setSelectedOption(null);
    setShowResult(false);
    setLastResult(null);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.questionText]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (selectedOption || isSubmitting) return;

      const responseTimeMs = Date.now() - startTimeRef.current;
      if (timerRef.current) clearInterval(timerRef.current);

      setSelectedOption(optionId);
      setIsSubmitting(true);

      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      try {
        const res = await fetch("/api/session/fluency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            isCorrect: option.isCorrect,
            responseTimeMs,
            questionText: question.questionText,
          }),
        });
        const data = await res.json();

        const result: FluencyAnswerResult = {
          isCorrect: option.isCorrect,
          responseTimeMs,
          consecutiveCorrect: data.consecutiveCorrect ?? 0,
          personalBestMs: data.personalBestMs ?? null,
          newPersonalBest: data.newPersonalBest ?? false,
          atBenchmark: data.atBenchmark ?? false,
          completed: data.completed ?? false,
          flatlineDetected: data.flatlineDetected ?? false,
          speedTrend: data.speedTrend ?? [],
          nexusScore: data.nexusScore ?? null,
        };

        setLastResult(result);
        setConsecutive(result.consecutiveCorrect);
        if (result.personalBestMs !== null) {
          setPersonalBest(result.personalBestMs);
        }
        setSpeedHistory((prev) => [...prev.slice(-9), responseTimeMs]);
        setShowResult(true);

        onAnswer(result);

        // Auto-advance after brief feedback
        setTimeout(() => {
          if (result.completed) {
            onComplete();
          } else {
            onRequestNextQuestion();
          }
        }, result.isCorrect ? 800 : 1500);
      } catch (err) {
        console.error("Fluency submit error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionId, question, selectedOption, isSubmitting, onAnswer, onComplete, onRequestNextQuestion]
  );

  // Speed indicator color
  const getSpeedColor = () => {
    if (!benchmarkMs) return "text-blue-400";
    if (elapsed <= benchmarkMs * 0.7) return "text-green-400";
    if (elapsed <= benchmarkMs) return "text-yellow-400";
    return "text-red-400";
  };

  const getSpeedBg = () => {
    if (!benchmarkMs) return "bg-blue-500/20";
    if (elapsed <= benchmarkMs * 0.7) return "bg-green-500/20";
    if (elapsed <= benchmarkMs) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const formatTime = (ms: number) => {
    const seconds = ms / 1000;
    return seconds < 10 ? seconds.toFixed(1) : Math.floor(seconds).toString();
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Fluency Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏎️</span>
          <div>
            <p className="text-sm font-semibold text-orange-400">
              FLUENCY DRILL
            </p>
            <p className="text-xs text-gray-400">
              Build speed + accuracy
            </p>
          </div>
        </div>

        {/* Consecutive streak */}
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {consecutive}/10
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            streak
          </p>
        </div>
      </div>

      {/* Streak progress bar */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              i < consecutive
                ? "bg-green-500"
                : i === consecutive
                  ? "bg-orange-400/50"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Timer + Speed indicator */}
      <div className={`rounded-xl p-4 mb-4 text-center ${getSpeedBg()}`}>
        <p className={`text-4xl font-mono font-bold ${getSpeedColor()}`}>
          {formatTime(elapsed)}s
        </p>
        {benchmarkMs && (
          <p className="text-xs text-gray-400 mt-1">
            Target: {formatTime(benchmarkMs)}s
          </p>
        )}
      </div>

      {/* Personal best */}
      {personalBest && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Personal Best:</span>
          <span className="text-xs font-semibold text-yellow-400">
            {formatTime(personalBest)}s
          </span>
          <AnimatePresence>
            {lastResult?.newPersonalBest && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold text-green-400"
              >
                NEW RECORD!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Speed trend sparkline */}
      {speedHistory.length > 1 && (
        <div className="h-8 flex items-end gap-0.5 mb-4 mx-auto max-w-xs">
          {speedHistory.map((ms, i) => {
            const maxMs = Math.max(...speedHistory);
            const height = maxMs > 0 ? (ms / maxMs) * 100 : 50;
            const isFast = benchmarkMs ? ms <= benchmarkMs : true;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  isFast ? "bg-green-500/60" : "bg-red-500/40"
                }`}
                style={{ height: `${Math.max(height, 10)}%` }}
              />
            );
          })}
          {benchmarkMs && (
            <div
              className="absolute w-full border-t border-dashed border-yellow-500/30"
              style={{
                bottom: `${(benchmarkMs / Math.max(...speedHistory, benchmarkMs)) * 100}%`,
              }}
            />
          )}
        </div>
      )}

      {/* Question */}
      <div className="bg-white/5 rounded-xl p-5 mb-4">
        <p className="text-white text-lg leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {question.options.map((option) => {
          let bgClass = "bg-white/5 hover:bg-white/10 border-white/10";
          if (showResult && selectedOption === option.id) {
            bgClass = option.isCorrect
              ? "bg-green-500/20 border-green-500"
              : "bg-red-500/20 border-red-500";
          } else if (showResult && option.isCorrect) {
            bgClass = "bg-green-500/10 border-green-500/50";
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!!selectedOption || isSubmitting}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${bgClass} ${
                !selectedOption && !isSubmitting
                  ? "cursor-pointer active:scale-95"
                  : "cursor-default"
              }`}
            >
              <span className="text-xs font-bold text-gray-400 mr-2">
                {option.id}
              </span>
              <span className="text-white">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Flatline notification */}
      <AnimatePresence>
        {lastResult?.flatlineDetected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center"
          >
            <p className="text-purple-300 font-semibold">
              Speed Plateau Detected
            </p>
            <p className="text-sm text-purple-400 mt-1">
              Your speed is consistent — you've built fluency! Auto-advancing...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
