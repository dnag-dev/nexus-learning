"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───

interface QuestionOption {
  id: string;
  text: string;
}

interface MilestoneQuestion {
  questionId: string;
  conceptCode: string;
  conceptTitle: string;
  questionText: string;
  options: QuestionOption[];
  difficulty: number;
}

interface Progress {
  current: number;
  total: number;
  percentComplete: number;
}

interface Feedback {
  wasCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  message: string;
}

interface ConceptResult {
  conceptCode: string;
  conceptTitle: string;
  correct: number;
  total: number;
  passed: boolean;
}

interface CompletionResult {
  milestoneId: string;
  weekNumber: number;
  passed: boolean;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  conceptResults: ConceptResult[];
  failedConcepts: string[];
  reviewConceptsAdded: string[];
  message: string;
  encouragement: string;
  timeTakenFormatted: string;
}

type Phase = "intro" | "active" | "feedback" | "completing" | "result";

// ─── Wrapper ───

export default function MilestonePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D2B3E] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </div>
      }
    >
      <MilestonePage />
    </Suspense>
  );
}

// ─── Main Page ───

function MilestonePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const planId = params.planId as string;
  const weekNumber = parseInt(params.weekNumber as string, 10);
  const STUDENT_ID = searchParams.get("studentId") || "demo-student-1";

  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [question, setQuestion] = useState<MilestoneQuestion | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 8, percentComplete: 0 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conceptsCovered, setConceptsCovered] = useState<string[]>([]);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Question dot tracker (correct/incorrect/unanswered)
  const [questionResults, setQuestionResults] = useState<
    Array<"correct" | "incorrect" | "unanswered">
  >(Array(8).fill("unanswered"));

  // Timer countdown
  useEffect(() => {
    if (phase === "active" || phase === "feedback") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up — auto-complete
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleTimeUp = useCallback(async () => {
    if (!sessionKey) return;
    setPhase("completing");

    try {
      const res = await fetch("/api/milestone/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey }),
      });

      if (res.ok) {
        const data: CompletionResult = await res.json();
        setResult(data);
        setPhase("result");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to complete milestone");
        setPhase("result");
      }
    } catch {
      setError("Something went wrong");
      setPhase("result");
    }
  }, [sessionKey]);

  // ─── Start Milestone ───
  const startMilestone = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/milestone/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, weekNumber }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start milestone");
      }

      const data = await res.json();
      setSessionKey(data.sessionKey);
      setQuestion(data.question);
      setProgress(data.progress);
      setConceptsCovered(data.conceptsCovered || []);
      setTimeRemaining(data.timeLimit || 1200);
      setQuestionResults(Array(data.totalQuestions).fill("unanswered"));
      setPhase("active");
      questionStartTime.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [planId, weekNumber]);

  // ─── Submit Answer ───
  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionKey || !question) return;

      setSelectedOption(optionId);
      const responseTimeMs = Date.now() - questionStartTime.current;

      setIsLoading(true);

      try {
        const res = await fetch("/api/milestone/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionKey,
            questionId: question.questionId,
            selectedOptionId: optionId,
            responseTimeMs,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit answer");
        }

        const data = await res.json();

        // Update question dot tracker
        const questionIndex = progress.current - 1;
        setQuestionResults((prev) => {
          const updated = [...prev];
          updated[questionIndex] = data.feedback.wasCorrect ? "correct" : "incorrect";
          return updated;
        });

        setFeedback(data.feedback);
        setProgress(data.progress);
        setPhase("feedback");

        if (data.status === "complete") {
          // Auto-trigger completion after showing feedback
          setTimeout(async () => {
            setPhase("completing");
            try {
              const completeRes = await fetch("/api/milestone/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionKey }),
              });

              if (completeRes.ok) {
                const completeData: CompletionResult = await completeRes.json();
                setResult(completeData);
                setPhase("result");
              } else {
                const errData = await completeRes.json();
                throw new Error(errData.error || "Failed to complete");
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to complete");
              setPhase("result");
            }
          }, 2000);
        } else {
          // Move to next question after brief feedback
          setTimeout(() => {
            setQuestion(data.question);
            setSelectedOption(null);
            setFeedback(null);
            setPhase("active");
            questionStartTime.current = Date.now();
          }, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [sessionKey, question, progress]
  );

  // Format time remaining
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ═══════════════════════════════════════════════
  // PHASE: Intro
  // ═══════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D2B3E] to-[#0A1F2E] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="max-w-lg text-center"
        >
          <div className="w-28 h-28 mx-auto mb-8 rounded-full bg-teal-500/10 flex items-center justify-center">
            <span className="text-6xl">📋</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Week {weekNumber} Milestone Check
          </h1>
          <p className="text-lg text-teal-200/80 mb-2">
            Let&apos;s see what you&apos;ve learned this week!
          </p>
          <p className="text-slate-400 mb-8">
            Answer {8} questions covering this week&apos;s concepts. You need 75% to pass.
          </p>

          {/* Info cards */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-teal-300">8</p>
                <p className="text-xs text-slate-400">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-300">20</p>
                <p className="text-xs text-slate-400">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-300">75%</p>
                <p className="text-xs text-slate-400">To Pass</p>
              </div>
            </div>
          </div>

          {conceptsCovered.length > 0 && (
            <div className="mb-8">
              <p className="text-xs text-slate-500 mb-2">Concepts covered:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {conceptsCovered.map((c) => (
                  <span
                    key={c}
                    className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startMilestone}
            disabled={isLoading}
            className="w-full py-4 text-lg font-semibold text-white bg-teal-600 rounded-2xl hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing questions...
              </span>
            ) : (
              "Begin Milestone Check"
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={() => router.push(`/gps?studentId=${STUDENT_ID}`)}
            className="mt-4 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            &larr; Back to GPS Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: Active / Feedback
  // ═══════════════════════════════════════════════
  if ((phase === "active" || phase === "feedback") && question) {
    const isLowTime = timeRemaining < 120;

    return (
      <div className="min-h-screen bg-[#0D2B3E]">
        {/* Header */}
        <header className="bg-[#0A1F2E] border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="font-semibold text-white text-sm">
                  Week {weekNumber} Check
                </span>
              </div>
              <div
                className={`text-sm font-mono font-bold ${
                  isLowTime ? "text-red-400 animate-pulse" : "text-teal-300"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Question dots */}
            <div className="flex items-center gap-1.5 mb-2">
              {questionResults.map((status, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    status === "correct"
                      ? "bg-emerald-400"
                      : status === "incorrect"
                        ? "bg-red-400"
                        : i === progress.current - 1
                          ? "bg-teal-400 ring-2 ring-teal-400/30"
                          : "bg-slate-600"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs text-slate-500">
                {progress.current}/{progress.total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-1">
              <div
                className="bg-teal-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          </div>
        </header>

        {/* Question area */}
        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Feedback banner */}
          <AnimatePresence>
            {phase === "feedback" && feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-6 p-4 rounded-xl text-center font-medium border ${
                  feedback.wasCorrect
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    : "bg-red-500/10 text-red-300 border-red-500/20"
                }`}
              >
                <p className="mb-1">{feedback.message}</p>
                <p className="text-xs opacity-70">{feedback.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.questionId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
            >
              {/* Concept badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-500/10 text-teal-300">
                  {question.conceptTitle}
                </span>
                <span className="text-xs text-slate-500">
                  {question.conceptCode}
                </span>
              </div>

              {/* Question text */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                <p className="text-lg text-white leading-relaxed">
                  {question.questionText}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const showResult = phase === "feedback" && feedback;
                  const isCorrectOption =
                    showResult && feedback?.correctOptionId === option.id;
                  const isWrongSelection =
                    showResult && isSelected && !isCorrectOption;

                  let optionStyle =
                    "bg-white/5 border-white/10 hover:border-teal-500/50 hover:bg-white/10";

                  if (isSelected && !showResult) {
                    optionStyle = "bg-teal-500/10 border-teal-500/50";
                  } else if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/10 border-emerald-500/40";
                  } else if (isWrongSelection) {
                    optionStyle = "bg-red-500/10 border-red-500/40";
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (phase === "active" && !isLoading) {
                          submitAnswer(option.id);
                        }
                      }}
                      disabled={phase === "feedback" || isLoading}
                      className={`w-full text-left p-4 rounded-xl border transition-all disabled:cursor-default ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isCorrectOption
                              ? "bg-emerald-500/20 text-emerald-300"
                              : isWrongSelection
                                ? "bg-red-500/20 text-red-300"
                                : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {isCorrectOption
                            ? "✓"
                            : isWrongSelection
                              ? "✕"
                              : option.id}
                        </span>
                        <span className="text-white">{option.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: Completing
  // ═══════════════════════════════════════════════
  if (phase === "completing") {
    return (
      <div className="min-h-screen bg-[#0D2B3E] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-teal-200">Evaluating your results...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // PHASE: Result
  // ═══════════════════════════════════════════════
  if (phase === "result") {
    if (error && !result) {
      return (
        <div className="min-h-screen bg-[#0D2B3E] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <span className="text-5xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-bold text-white mb-2">
              Something Went Wrong
            </h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push(`/gps?studentId=${STUDENT_ID}`)}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Back to GPS
            </button>
          </div>
        </div>
      );
    }

    if (!result) return null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D2B3E] to-[#0A1F2E]">
        <main className="max-w-lg mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
          >
            {/* Result header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: result.passed
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(251, 191, 36, 0.15)",
                }}
              >
                <span className="text-5xl">
                  {result.passed ? "🎉" : "💪"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {result.passed ? "You Passed!" : "Keep Going!"}
              </h1>
              <p className="text-lg text-slate-300">{result.message}</p>
            </div>

            {/* Score card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 text-center">
              <p className="text-5xl font-bold text-white mb-1">
                {result.score}%
              </p>
              <p className="text-sm text-slate-400">
                {result.totalCorrect} of {result.totalQuestions} correct
                {" · "}
                {result.timeTakenFormatted}
              </p>
              <div className="mt-3 flex justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.passed
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {result.passed ? "✅ Milestone Passed" : "📝 Needs Review"}
                </span>
              </div>
            </div>

            {/* Concept breakdown */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Concept Breakdown
              </h3>
              <div className="space-y-3">
                {result.conceptResults.map((cr) => (
                  <div
                    key={cr.conceptCode}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          cr.passed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {cr.passed ? "✓" : "✕"}
                      </span>
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {cr.conceptTitle}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {cr.correct}/{cr.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Encouragement */}
            <div className="bg-teal-500/10 rounded-2xl p-5 border border-teal-500/20 mb-8">
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0">🐻</span>
                <p className="text-sm text-teal-200 leading-relaxed">
                  {result.encouragement}
                </p>
              </div>
            </div>

            {/* Review concepts added */}
            {result.reviewConceptsAdded.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 mb-6">
                <p className="text-xs text-amber-300 font-medium mb-1">
                  Review sessions added for:
                </p>
                <p className="text-xs text-slate-400">
                  {result.reviewConceptsAdded.join(", ")}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3">
              <a
                href={`/gps?studentId=${STUDENT_ID}`}
                className="block w-full py-4 text-center text-lg font-semibold text-white bg-teal-600 rounded-2xl hover:bg-teal-700 transition-colors"
              >
                Back to GPS Dashboard 🧭
              </a>
              {!result.passed && (
                <a
                  href={`/session?studentId=${STUDENT_ID}`}
                  className="block w-full py-4 text-center text-lg font-semibold text-teal-300 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  Practice More 📚
                </a>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Fallback
  return null;
}
