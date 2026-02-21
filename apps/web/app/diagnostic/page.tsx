"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ─── Types ───

interface DiagnosticOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface DiagnosticQuestion {
  questionId: string;
  nodeCode: string;
  nodeTitle: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  questionText: string;
  options: DiagnosticOption[];
  hint?: string;
}

interface Progress {
  current: number;
  total: number;
  percentComplete: number;
}

interface Feedback {
  wasCorrect: boolean;
  message: string;
}

interface PlacementResult {
  frontierNodeCode: string;
  frontierNodeTitle: string;
  gradeEstimate: number;
  confidence: number;
  masteredNodes: string[];
  gapNodes: string[];
  recommendedStartNode: string;
  totalCorrect: number;
  totalQuestions: number;
  summary: string;
}

type Phase = "intro" | "active" | "feedback" | "result";

// ─── Component ───

export default function DiagnosticPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    }>
      <DiagnosticPage />
    </Suspense>
  );
}

function DiagnosticPage() {
  const searchParams = useSearchParams();
  const DEMO_STUDENT_ID = searchParams.get("studentId") || "demo-student-1";
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<DiagnosticQuestion | null>(null);
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    total: 20,
    percentComplete: 0,
  });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  const startDiagnostic = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: DEMO_STUDENT_ID }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start diagnostic");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setQuestion(data.question);
      setProgress(data.progress);
      setPhase("active");
      questionStartTime.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(
    async (optionId: string) => {
      if (!sessionId || !question) return;

      setSelectedOption(optionId);
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      const responseTimeMs = Date.now() - questionStartTime.current;

      setIsLoading(true);
      try {
        const res = await fetch("/api/diagnostic/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: question.questionId,
            nodeCode: question.nodeCode,
            selectedOptionId: optionId,
            isCorrect: option.isCorrect,
            responseTimeMs,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit answer");
        }

        const data = await res.json();

        if (data.status === "complete") {
          setResult(data.result);
          setProgress(data.progress);
          setPhase("result");
        } else {
          // Show feedback briefly, then move to next question
          setFeedback(data.feedback);
          setProgress(data.progress);
          setPhase("feedback");

          setTimeout(() => {
            setQuestion(data.question);
            setSelectedOption(null);
            setShowHint(false);
            setFeedback(null);
            setPhase("active");
            questionStartTime.current = Date.now();
          }, 1800);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, question]
  );

  // ─── Render: Intro ───
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-aauti-primary/10 flex items-center justify-center">
            <span className="text-7xl">🐻</span>
          </div>
          <h1 className="text-3xl font-bold text-aauti-text-primary mb-3">
            Find Your Aauti Level!
          </h1>
          <p className="text-lg text-aauti-text-secondary mb-2">
            Hi! I&apos;m Cosmo, and I&apos;ll be your guide.
          </p>
          <p className="text-aauti-text-secondary mb-8">
            I&apos;m going to ask you some math questions — not a test, just a
            fun challenge so I can figure out exactly where to start your
            adventure. There are no wrong answers — every answer helps me
            understand what you know!
          </p>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
            <div className="flex items-center gap-4 text-left">
              <div className="flex-shrink-0 text-2xl">🎯</div>
              <div>
                <div className="font-semibold text-aauti-text-primary">
                  20 questions
                </div>
                <div className="text-sm text-aauti-text-secondary">
                  Takes about 8-12 minutes
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left mt-4">
              <div className="flex-shrink-0 text-2xl">💡</div>
              <div>
                <div className="font-semibold text-aauti-text-primary">
                  Hints available
                </div>
                <div className="text-sm text-aauti-text-secondary">
                  Tap the hint button if you need a nudge
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left mt-4">
              <div className="flex-shrink-0 text-2xl">⭐</div>
              <div>
                <div className="font-semibold text-aauti-text-primary">
                  No pressure
                </div>
                <div className="text-sm text-aauti-text-secondary">
                  Questions adapt to you — it&apos;s not about getting them all right
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={startDiagnostic}
            disabled={isLoading}
            className="w-full py-4 text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Getting ready..." : "Let's Go! 🚀"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-aauti-danger">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Active Question ───
  if (phase === "active" || phase === "feedback") {
    return (
      <div className="min-h-screen bg-aauti-bg-light">
        {/* Header with progress */}
        <header className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐻</span>
                <span className="font-semibold text-aauti-text-primary">
                  Cosmo&apos;s Level Finder
                </span>
              </div>
              <span className="text-sm text-aauti-text-secondary">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-aauti-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          </div>
        </header>

        {/* Question area */}
        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Feedback overlay */}
          {phase === "feedback" && feedback && (
            <div
              className={`mb-6 p-4 rounded-2xl text-center font-medium animate-celebration ${
                feedback.wasCorrect
                  ? "bg-aauti-success/10 text-aauti-success border border-aauti-success/20"
                  : "bg-aauti-warning/10 text-aauti-warning border border-aauti-warning/20"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {question && (
            <>
              {/* Domain badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-aauti-primary/10 text-aauti-primary">
                  {question.domain}
                </span>
                <span className="text-xs text-aauti-text-muted">
                  {question.gradeLevel === "K"
                    ? "Kindergarten"
                    : `Grade ${question.gradeLevel}`}
                </span>
              </div>

              {/* Question text */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
                <p className="text-xl text-aauti-text-primary leading-relaxed">
                  {question.questionText}
                </p>
              </div>

              {/* Answer options */}
              <div className="space-y-3 mb-6">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const showResult = phase === "feedback" && selectedOption;
                  const isCorrectOption = option.isCorrect;

                  let optionStyle =
                    "bg-white border-gray-200 hover:border-aauti-primary hover:bg-aauti-primary/5";

                  if (isSelected && !showResult) {
                    optionStyle = "bg-aauti-primary/10 border-aauti-primary";
                  } else if (showResult && isSelected && isCorrectOption) {
                    optionStyle = "bg-aauti-success/10 border-aauti-success";
                  } else if (showResult && isSelected && !isCorrectOption) {
                    optionStyle = "bg-aauti-danger/10 border-aauti-danger";
                  } else if (showResult && isCorrectOption) {
                    optionStyle = "bg-aauti-success/5 border-aauti-success/50";
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
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optionStyle} disabled:cursor-default`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-aauti-text-secondary">
                          {option.id}
                        </span>
                        <span className="text-aauti-text-primary">
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hint button */}
              {question.hint && phase === "active" && (
                <div className="text-center">
                  {showHint ? (
                    <div className="bg-aauti-accent/10 border border-aauti-accent/30 rounded-xl p-4 text-sm text-aauti-text-primary">
                      <span className="font-semibold">💡 Cosmo&apos;s hint:</span>{" "}
                      {question.hint}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowHint(true)}
                      className="text-sm text-aauti-primary hover:underline"
                    >
                      💡 Need a hint from Cosmo?
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // ─── Render: Result ───
  if (phase === "result" && result) {
    const gradeLabel =
      result.gradeEstimate < 1
        ? "Kindergarten"
        : `Grade ${Math.floor(result.gradeEstimate)}`;

    return (
      <div className="min-h-screen bg-gradient-to-b from-aauti-bg-light to-white">
        <main className="max-w-lg mx-auto px-4 py-12">
          {/* Celebration header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-aauti-accent/20 flex items-center justify-center animate-celebration">
              <span className="text-5xl">🎉</span>
            </div>
            <h1 className="text-3xl font-bold text-aauti-text-primary mb-2">
              You Did It!
            </h1>
            <p className="text-lg text-aauti-text-secondary">
              Cosmo found your perfect starting point.
            </p>
          </div>

          {/* Grade level card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 text-center">
            <p className="text-sm text-aauti-text-secondary mb-1">
              Your Math Level
            </p>
            <p className="text-4xl font-bold text-aauti-primary mb-2">
              {gradeLabel}
            </p>
            <p className="text-sm text-aauti-text-muted">
              Confidence: {Math.round(result.confidence * 100)}%
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-aauti-success">
                {result.totalCorrect}
              </p>
              <p className="text-xs text-aauti-text-secondary">Correct</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-bold text-aauti-text-primary">
                {result.totalQuestions}
              </p>
              <p className="text-xs text-aauti-text-secondary">Questions</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-aauti-primary/5 rounded-2xl p-5 border border-aauti-primary/10 mb-6">
            <div className="flex gap-3">
              <span className="text-2xl flex-shrink-0">🐻</span>
              <p className="text-aauti-text-primary leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Mastered concepts */}
          {result.masteredNodes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-aauti-text-primary mb-3">
                ✅ Concepts You Know
              </h3>
              <div className="space-y-2">
                {result.masteredNodes.map((code) => (
                  <div
                    key={code}
                    className="flex items-center gap-2 text-sm text-aauti-text-secondary"
                  >
                    <span className="text-aauti-success">⭐</span>
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gap concepts */}
          {result.gapNodes.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-aauti-text-primary mb-3">
                🎯 Areas to Strengthen
              </h3>
              <div className="space-y-2">
                {result.gapNodes.map((code) => (
                  <div
                    key={code}
                    className="flex items-center gap-2 text-sm text-aauti-text-secondary"
                  >
                    <span className="text-aauti-accent">💪</span>
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={`/session?studentId=${DEMO_STUDENT_ID}`}
            className="block w-full py-4 text-center text-lg font-semibold text-white bg-aauti-primary rounded-2xl hover:bg-aauti-primary/90 transition-colors"
          >
            Start Learning with Cosmo! 🚀
          </a>
        </main>
      </div>
    );
  }

  return null;
}
