"use client";

/**
 * FluencyZoneGame — Phase 13: Arcade-style speed practice UI.
 *
 * Dark background, large centered question, countdown timer,
 * live score counter, personal best display.
 *
 * For math: multiple choice (4 options) with fast auto-advance.
 * Questions are generated client-side for math facts speed.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { generateTopicQuestion } from "@/lib/fluency/topic-question-generators";

interface FluencyAnswer {
  questionText: string;
  answer: string;
  correct: boolean;
  timeMs: number;
}

interface FluencyZoneGameProps {
  sessionId: string;
  studentId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  domain: string;
  nodeCode: string;
  timeLimitSeconds: number;
  personalBest: { questionsPerMin: number; correctCount: number } | null;
  onComplete: (answers: FluencyAnswer[], elapsedSeconds: number) => void;
}

export default function FluencyZoneGame({
  sessionId,
  studentId,
  nodeId,
  nodeName,
  subject,
  domain,
  nodeCode,
  timeLimitSeconds,
  personalBest,
  onComplete,
}: FluencyZoneGameProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [answers, setAnswers] = useState<FluencyAnswer[]>([]);
  const [currentQ, setCurrentQ] = useState<{
    questionText: string;
    correctAnswer: string;
    options: string[];
  } | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const questionStartRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  // Generate first question
  useEffect(() => {
    nextQuestion();
    startTimeRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete(answers, elapsed);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameOver, answers, onComplete]);

  const nextQuestion = useCallback(() => {
    const q = generateTopicQuestion(subject, domain, nodeCode, nodeName);
    setCurrentQ(q);
    questionStartRef.current = Date.now();
    setLastResult(null);
  }, [subject, domain, nodeCode, nodeName]);

  const handleAnswer = useCallback(
    (selectedAnswer: string) => {
      if (gameOver || !currentQ) return;

      const timeMs = Date.now() - questionStartRef.current;
      const isCorrect = selectedAnswer === currentQ.correctAnswer;

      const answer: FluencyAnswer = {
        questionText: currentQ.questionText,
        answer: selectedAnswer,
        correct: isCorrect,
        timeMs,
      };

      setAnswers((prev) => [...prev, answer]);
      setTotalCount((t) => t + 1);
      if (isCorrect) setCorrectCount((c) => c + 1);
      setLastResult(isCorrect ? "correct" : "wrong");

      // Auto-advance after brief flash
      setTimeout(() => {
        nextQuestion();
      }, 300);
    },
    [currentQ, gameOver, nextQuestion]
  );

  if (!currentQ) return null;

  const progressPercent = ((timeLimitSeconds - timeLeft) / timeLimitSeconds) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white flex flex-col">
      {/* Timer Bar */}
      <div className="relative h-2 bg-white/10">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
            isLowTime ? "bg-red-500 animate-pulse" : "bg-cyan-500"
          }`}
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>

      {/* Top Stats Bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-sm">
          <span className="text-gray-400">Score: </span>
          <span className="text-xl font-bold text-cyan-400">{correctCount}</span>
          <span className="text-gray-500"> / {totalCount}</span>
        </div>
        <div
          className={`text-2xl font-mono font-bold ${
            isLowTime ? "text-red-400 animate-pulse" : "text-white"
          }`}
        >
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
        {personalBest && (
          <div className="text-sm text-right">
            <span className="text-gray-500">Best: </span>
            <span className="text-yellow-400 font-bold">
              {personalBest.correctCount} ⚡
            </span>
          </div>
        )}
      </div>

      {/* Topic Name */}
      <div className="text-center py-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {nodeName}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Result flash */}
        {lastResult && (
          <div
            className={`text-4xl mb-4 transition-opacity duration-200 ${
              lastResult === "correct" ? "text-green-400" : "text-red-400"
            }`}
          >
            {lastResult === "correct" ? "✅" : "❌"}
          </div>
        )}

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 leading-tight">
          {currentQ.questionText}
        </h2>

        {/* Options — 2x2 grid for speed */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {currentQ.options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              onClick={() => handleAnswer(opt)}
              className="py-4 px-3 rounded-xl bg-white/10 border border-white/10 text-lg font-medium hover:bg-white/20 hover:border-cyan-500/50 active:scale-95 transition-all"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: Speed feedback */}
      <div className="text-center pb-6 text-sm text-gray-500">
        {totalCount > 3 && (
          <span>
            {correctCount > totalCount * 0.8 ? "🔥 On fire!" :
             correctCount > totalCount * 0.6 ? "👍 Steady pace" :
             "Keep going! 💪"}
          </span>
        )}
      </div>
    </div>
  );
}
