"use client";

/**
 * Onboarding Step 3 — Quick diagnostic (8 questions).
 *
 * Runs a lightweight version of the diagnostic engine.
 * Shows question, captures answer, moves to next.
 * On completion, shows celebration and moves to step 4.
 */

import { useState, useCallback } from "react";
import { useChild } from "@/lib/child-context";

interface DiagQuestion {
  id: string;
  nodeCode: string;
  questionText: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  encouragement?: string;
}

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const MAX_QUESTIONS = 8;

export default function QuickDiagnostic({ onComplete, onBack }: Props) {
  const { studentId, avatarPersonaId } = useChild();

  const [status, setStatus] = useState<
    "intro" | "loading" | "question" | "feedback" | "done" | "error"
  >("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<DiagQuestion | null>(null);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(MAX_QUESTIONS);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [wasCorrect, setWasCorrect] = useState(false);

  const PERSONA_EMOJI: Record<string, string> = {
    cosmo: "🐻",
    luna: "🐱",
    rex: "🦖",
    nova: "🦊",
    pip: "🦉",
    koda: "🐶",
    zara: "🦋",
  };
  const emoji = PERSONA_EMOJI[avatarPersonaId] || "🐻";

  const startDiagnostic = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/diagnostic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) throw new Error("Failed to start");

      const data = await res.json();
      setSessionId(data.sessionId);
      setTotal(Math.min(data.progress?.total ?? MAX_QUESTIONS, MAX_QUESTIONS));
      setCurrent(1);

      if (data.question) {
        setQuestion({
          id: data.question.id || `q-${Date.now()}`,
          nodeCode: data.question.nodeCode,
          questionText: data.question.questionText,
          options: data.question.options || [],
        });
        setStatus("question");
      }
    } catch {
      setStatus("error");
    }
  }, [studentId]);

  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionId || !question) return;
      setSelectedOption(optionId);

      const chosen = question.options.find((o) => o.id === optionId);
      const correct = chosen?.isCorrect ?? false;

      setWasCorrect(correct);
      setFeedbackMsg(
        correct
          ? "Great job! 🎉"
          : "Not quite — but that's okay! Let's keep going."
      );
      setStatus("feedback");

      try {
        const res = await fetch("/api/diagnostic/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: question.id,
            nodeCode: question.nodeCode,
            selectedOptionId: optionId,
            isCorrect: correct,
            responseTimeMs: 0,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit");

        const data = await res.json();

        // Wait a moment for feedback, then advance
        setTimeout(() => {
          if (
            data.status === "complete" ||
            current >= MAX_QUESTIONS
          ) {
            setStatus("done");
          } else if (data.question) {
            setQuestion({
              id: data.question.id || `q-${Date.now()}`,
              nodeCode: data.question.nodeCode,
              questionText: data.question.questionText,
              options: data.question.options || [],
            });
            setCurrent((c) => c + 1);
            setSelectedOption(null);
            setStatus("question");
          } else {
            setStatus("done");
          }
        }, 1500);
      } catch {
        // If submission fails, still move forward
        setTimeout(() => {
          setStatus("done");
        }, 1500);
      }
    },
    [sessionId, question, current]
  );

  // ── Intro screen ──
  if (status === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-[80px] mb-4">{emoji}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Quick Check! 🧩
        </h1>
        <p className="text-gray-400 mb-2 max-w-sm">
          Let me see what you already know — just {MAX_QUESTIONS} quick
          questions.
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-sm">
          There are no wrong answers here — this helps me find the perfect
          starting point for you!
        </p>
        <div className="w-full max-w-sm flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors border border-white/10"
          >
            Back
          </button>
          <button
            onClick={startDiagnostic}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
          >
            Start! 🚀
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="text-6xl mb-4 animate-bounce">{emoji}</div>
        <p className="text-gray-400 animate-pulse">
          Getting your questions ready...
        </p>
      </div>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-6xl mb-4">😅</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Oops, something went wrong
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          Don&apos;t worry — we can skip this part.
        </p>
        <div className="flex gap-3">
          <button
            onClick={startDiagnostic}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
          >
            Skip & Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──
  if (status === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-[80px] mb-4 animate-bounce-subtle">{emoji}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Perfect! 🎉
        </h1>
        <p className="text-gray-400 mb-8 max-w-sm">
          I know exactly where to start now. Let&apos;s build your learning
          path!
        </p>
        <button
          onClick={onComplete}
          className="w-full max-w-sm py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
        >
          Continue →
        </button>
      </div>
    );
  }

  // ── Feedback ──
  if (status === "feedback") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-[80px] mb-4">
          {wasCorrect ? "🎉" : emoji}
        </div>
        <p className="text-xl font-bold text-white mb-2">{feedbackMsg}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    );
  }

  // ── Question ──
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      {/* Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            Question {current} of {total}
          </span>
          <span className="text-xs text-purple-400">
            {Math.round((current / total) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="w-full max-w-md">
        <p className="text-lg font-semibold text-white mb-6 text-center">
          {question?.questionText}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {question?.options.map((option) => (
            <button
              key={option.id}
              onClick={() => submitAnswer(option.id)}
              disabled={selectedOption !== null}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selectedOption === option.id
                  ? option.isCorrect
                    ? "border-green-500 bg-green-500/20"
                    : "border-red-500 bg-red-500/20"
                  : "border-white/10 bg-[#141d30] hover:border-white/20"
              } disabled:cursor-default`}
            >
              <span className="text-gray-200">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
