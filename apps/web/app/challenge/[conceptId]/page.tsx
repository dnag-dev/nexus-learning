"use client";

/**
 * Challenge Mode Page — Step 14
 *
 * Open-ended, scenario-based challenge for a concept.
 * Unlocked after FLUENT mastery. Student types a response,
 * Claude evaluates reasoning, and up to 3 follow-up exchanges.
 *
 * URL: /challenge/[conceptId]?studentId=xxx
 */

import { useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───

interface ChallengeData {
  scenario: string;
  question: string;
  hints: string[];
  difficulty: string;
}

interface ConceptInfo {
  nodeCode: string;
  title: string;
  description: string;
  domain: string;
  gradeLevel: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  isCorrect: boolean;
}

interface FollowUp {
  response: string;
  followUpQuestion: string | null;
  insightGained: string;
  scoreAdjustment: number;
}

interface ConversationEntry {
  role: "student" | "tutor";
  content: string;
}

type Phase = "loading" | "locked" | "challenge" | "evaluating" | "feedback" | "followup" | "complete";

// ─── Animations ───

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

// ─── Wrapper ───

export default function ChallengePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ChallengePage />
    </Suspense>
  );
}

// ─── Main Page ───

function ChallengePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const conceptId = params.conceptId as string;
  const studentId = searchParams.get("studentId") || "demo-student-1";

  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [concept, setConcept] = useState<ConceptInfo | null>(null);
  const [personaId, setPersonaId] = useState("cosmo");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUp | null>(null);
  const [exchangeNumber, setExchangeNumber] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedMessage, setLockedMessage] = useState("");
  const startTimeRef = useRef<number>(0);

  // ─── Generate Challenge ───
  const generateChallenge = useCallback(async () => {
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, conceptId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate challenge");
      }

      if (!data.isUnlocked) {
        setLockedMessage(data.message);
        setPhase("locked");
        return;
      }

      setChallenge(data.challenge);
      setConcept(data.concept);
      setPersonaId(data.student?.personaId ?? "cosmo");
      setPhase("challenge");
      startTimeRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("loading");
    }
  }, [studentId, conceptId]);

  // Generate on mount
  useState(() => {
    generateChallenge();
  });

  // ─── Submit Answer ───
  const submitAnswer = async () => {
    if (!answer.trim() || !challenge) return;
    setPhase("evaluating");

    try {
      const responseTimeMs = Date.now() - startTimeRef.current;
      const res = await fetch("/api/challenge/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          conceptId,
          answer: answer.trim(),
          scenario: challenge.scenario,
          question: challenge.question,
          responseTimeMs,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setEvaluation(data.evaluation);
      setTotalScore(data.evaluation.score);
      setConversation([
        { role: "tutor", content: challenge.question },
        { role: "student", content: answer.trim() },
        { role: "tutor", content: data.evaluation.feedback },
      ]);

      if (data.canFollowUp) {
        setPhase("feedback");
      } else {
        setPhase("complete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
      setPhase("challenge");
    }
  };

  // ─── Submit Follow-up ───
  const submitFollowUp = async () => {
    if (!followUpAnswer.trim()) return;
    setPhase("evaluating");

    const updatedConversation: ConversationEntry[] = [
      ...conversation,
      { role: "student", content: followUpAnswer.trim() },
    ];
    setConversation(updatedConversation);
    setFollowUpAnswer("");

    try {
      const res = await fetch("/api/challenge/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          conceptId,
          conversationHistory: updatedConversation,
          exchangeNumber,
          scenario: challenge?.scenario,
          question: challenge?.question,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Follow-up failed");
      }

      const fu = data.followUp as FollowUp;
      setCurrentFollowUp(fu);
      setExchangeNumber(data.exchangeNumber);
      setTotalScore((prev) => Math.max(0, Math.min(100, prev + (fu.scoreAdjustment ?? 0))));

      const newConv: ConversationEntry[] = [
        ...updatedConversation,
        { role: "tutor", content: fu.response + (fu.followUpQuestion ? `\n\n${fu.followUpQuestion}` : "") },
      ];
      setConversation(newConv);

      if (data.isLastExchange || !fu.followUpQuestion) {
        setPhase("complete");
      } else {
        setPhase("followup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Follow-up failed");
      setPhase("followup");
    }
  };

  // ─── Persona helpers ───
  const personaEmoji: Record<string, string> = {
    cosmo: "🐻",
    rex: "🦕",
    luna: "🌙",
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-white/5 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-white font-bold text-lg">Challenge Mode</h1>
              {concept && (
                <p className="text-slate-400 text-xs">{concept.title}</p>
              )}
            </div>
          </div>
          <a
            href={`/gps?studentId=${studentId}`}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            Back to GPS
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" {...fadeIn} className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-3xl animate-pulse">⚡</span>
              </div>
              <p className="text-slate-400">Generating your challenge...</p>
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={generateChallenge}
                    className="mt-2 px-4 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                  >
                    Retry
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Locked */}
          {phase === "locked" && (
            <motion.div key="locked" {...fadeIn} className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Challenge Locked
              </h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {lockedMessage ||
                  "You need to achieve fluency on this concept before tackling the challenge!"}
              </p>
              <a
                href={`/gps?studentId=${studentId}`}
                className="inline-block px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                Back to Learning
              </a>
            </motion.div>
          )}

          {/* Challenge */}
          {phase === "challenge" && challenge && (
            <motion.div key="challenge" {...fadeIn} className="space-y-6">
              {/* Scenario Card */}
              <div className="bg-gradient-to-br from-amber-900/30 to-slate-900/60 rounded-2xl border border-amber-500/20 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl flex-shrink-0">
                    {personaEmoji[personaId] ?? "🐻"}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-amber-200 mb-2">
                      Challenge Scenario
                    </h2>
                    <p className="text-slate-200 leading-relaxed">
                      {challenge.scenario}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 rounded-xl p-4 border border-white/5">
                  <p className="text-white font-medium">{challenge.question}</p>
                </div>
              </div>

              {/* Hints */}
              {challenge.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
                  >
                    💡 {showHints ? "Hide hints" : "Need a hint?"}
                  </button>
                  {showHints && (
                    <motion.div {...fadeIn} className="mt-2 space-y-2">
                      {challenge.hints.map((hint, i) => (
                        <div
                          key={i}
                          className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2"
                        >
                          <p className="text-xs text-amber-300">
                            Hint {i + 1}: {hint}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Answer Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Explain your thinking!"
                  className="w-full h-40 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    {answer.length} characters
                  </span>
                  <button
                    onClick={submitAnswer}
                    disabled={answer.trim().length < 10}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Answer ⚡
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Evaluating */}
          {phase === "evaluating" && (
            <motion.div key="evaluating" {...fadeIn} className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-2xl">🤔</span>
                </div>
              </div>
              <p className="text-slate-400">Evaluating your response...</p>
            </motion.div>
          )}

          {/* Feedback (initial evaluation) */}
          {phase === "feedback" && evaluation && (
            <motion.div key="feedback" {...fadeIn} className="space-y-6">
              {/* Score */}
              <ScoreCard score={evaluation.score} />

              {/* Feedback */}
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl flex-shrink-0">
                    {personaEmoji[personaId] ?? "🐻"}
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* Strengths */}
                {evaluation.strengths.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {evaluation.improvements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                      To Improve
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-400 mt-0.5">→</span>
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Continue to follow-up */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-3">
                  Let&apos;s dig deeper — up to {3 - exchangeNumber} more exchanges
                </p>
                <button
                  onClick={() => setPhase("followup")}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
                >
                  Continue Discussion →
                </button>
              </div>
            </motion.div>
          )}

          {/* Follow-up */}
          {phase === "followup" && (
            <motion.div key="followup" {...fadeIn} className="space-y-6">
              {/* Conversation thread */}
              <div className="space-y-3">
                {conversation.slice(-4).map((entry, i) => (
                  <div
                    key={i}
                    className={`flex ${entry.role === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        entry.role === "student"
                          ? "bg-purple-600/30 border border-purple-500/20 text-purple-100"
                          : "bg-slate-800/60 border border-white/5 text-slate-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Follow-up answer input */}
              <div>
                <textarea
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  placeholder="Continue your response..."
                  className="w-full h-28 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    Exchange {exchangeNumber + 1} of 3
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPhase("complete")}
                      className="px-4 py-2 text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      Finish
                    </button>
                    <button
                      onClick={submitFollowUp}
                      disabled={followUpAnswer.trim().length < 5}
                      className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Complete */}
          {phase === "complete" && (
            <motion.div key="complete" {...fadeIn} className="space-y-6">
              {/* Final Score */}
              <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-5xl">
                    {totalScore >= 85 ? "🏆" : totalScore >= 70 ? "⭐" : "💪"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Challenge Complete!
                </h2>
                <p className="text-slate-400">
                  {concept?.title ?? "This concept"}
                </p>
              </div>

              <ScoreCard score={totalScore} large />

              {/* Conversation Summary */}
              {conversation.length > 2 && (
                <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Dialogue Summary
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {conversation.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="flex-shrink-0 mt-0.5">
                          {entry.role === "student" ? "👤" : personaEmoji[personaId] ?? "🐻"}
                        </span>
                        <p className="text-slate-400 line-clamp-2">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setAnswer("");
                    setEvaluation(null);
                    setConversation([]);
                    setFollowUpAnswer("");
                    setCurrentFollowUp(null);
                    setExchangeNumber(0);
                    setTotalScore(0);
                    setShowHints(false);
                    generateChallenge();
                  }}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
                >
                  Try Another ⚡
                </button>
                <a
                  href={`/gps?studentId=${studentId}`}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  Back to GPS
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Score Card Component ───

function ScoreCard({ score, large }: { score: number; large?: boolean }) {
  const scoreColor =
    score >= 85
      ? "text-emerald-400"
      : score >= 70
        ? "text-amber-400"
        : score >= 40
          ? "text-orange-400"
          : "text-red-400";

  const scoreLabel =
    score >= 95
      ? "Exceptional!"
      : score >= 85
        ? "Excellent!"
        : score >= 70
          ? "Good work!"
          : score >= 50
            ? "Getting there!"
            : "Keep practicing!";

  return (
    <div className={`text-center ${large ? "py-4" : "py-2"}`}>
      <div className={`font-bold ${scoreColor} ${large ? "text-6xl" : "text-4xl"}`}>
        {score}
      </div>
      <p className={`${large ? "text-lg" : "text-sm"} font-medium ${scoreColor} mt-1`}>
        {scoreLabel}
      </p>
      {/* Score bar */}
      <div className="max-w-xs mx-auto mt-3">
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              score >= 85
                ? "bg-emerald-500"
                : score >= 70
                  ? "bg-amber-500"
                  : score >= 40
                    ? "bg-orange-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
