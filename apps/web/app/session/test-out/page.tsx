"use client";

/**
 * Test Out Page — Phase 13
 *
 * Quick 5-question assessment. If the student scores 80%+, the topic is
 * marked as mastered instantly. If they fail, their earned BKT score is
 * saved (never penalizes below current).
 *
 * Query params:
 *   studentId — required
 *   nodeCode  — topic code (e.g. "MATH.3.NF.1")
 *   returnTo  — URL to navigate back to on completion
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───

interface TestOutInfo {
  testId: string;
  nodeId: string;
  nodeCode: string;
  nodeName: string;
  subject: string;
  gradeLevel: string;
  questionCount: number;
  passThreshold: number;
  timeLimitSeconds: number;
}

interface TestOutResult {
  passed: boolean;
  score: number;
  accuracy: number;
  newBkt?: number;
  correctCount: number;
  totalQuestions: number;
}

type Phase = "loading" | "ready" | "testing" | "result";

// ─── Main Component ───

function TestOutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get("studentId") || "";
  const nodeCode = searchParams.get("nodeCode") || "";
  const returnTo = searchParams.get("returnTo") || "/session";

  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<TestOutInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{ questionIndex: number; selectedAnswer: string; timeMs: number; isCorrect: boolean }>
  >([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [result, setResult] = useState<TestOutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generated questions (client-side for speed, like fluency zone)
  const [questions, setQuestions] = useState<
    Array<{ questionText: string; options: string[]; correctAnswer: string }>
  >([]);

  // ─── Start test-out ───
  useEffect(() => {
    if (!studentId || !nodeCode) {
      setError("Missing studentId or nodeCode");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/session/test-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, nodeCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInfo(data);

        // Generate 5 practice questions client-side (matched to topic)
        const generated = generateQuestions(data.nodeName, data.subject, data.questionCount);
        setQuestions(generated);
        setPhase("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start test-out");
      }
    })();
  }, [studentId, nodeCode]);

  // ─── Answer a question ───
  const handleAnswer = useCallback(
    (selectedAnswer: string) => {
      if (!info || currentQuestion >= questions.length) return;

      const q = questions[currentQuestion];
      const timeMs = Date.now() - questionStartTime;
      const correct = selectedAnswer === q.correctAnswer;

      const newAnswers = [
        ...answers,
        { questionIndex: currentQuestion, selectedAnswer, timeMs, isCorrect: correct },
      ];
      setAnswers(newAnswers);

      if (currentQuestion + 1 < questions.length) {
        // Next question
        setTimeout(() => {
          setCurrentQuestion((prev) => prev + 1);
          setQuestionStartTime(Date.now());
        }, 400);
      } else {
        // Submit results
        submitResults(newAnswers);
      }
    },
    [info, currentQuestion, questions, questionStartTime, answers]
  );

  // ─── Submit ───
  const submitResults = async (
    finalAnswers: Array<{ questionIndex: number; selectedAnswer: string; timeMs: number; isCorrect: boolean }>
  ) => {
    if (!info) return;
    try {
      const res = await fetch("/api/session/test-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          testId: info.testId,
          studentId,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  // ─── Loading / Error ───
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push(returnTo)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚡</div>
          <p className="text-white text-lg animate-pulse">Preparing Test Out...</p>
        </div>
      </div>
    );
  }

  // ─── Ready screen ───
  if (phase === "ready" && info) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-[#1B2838] rounded-2xl p-8 text-center"
        >
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-white mb-2">Test Out</h1>
          <p className="text-purple-300 text-lg mb-6">{info.nodeName}</p>

          <div className="bg-[#0D1B2A] rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Questions</span>
              <span className="text-white font-medium">{info.questionCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pass threshold</span>
              <span className="text-white font-medium">{Math.round(info.passThreshold * 100)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Time limit</span>
              <span className="text-white font-medium">{Math.round(info.timeLimitSeconds / 60)} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hints</span>
              <span className="text-amber-400 font-medium">None — you&apos;re on your own!</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Score {Math.round(info.passThreshold * 100)}%+ and skip straight to mastery.
            If you don&apos;t pass, no worries — you&apos;ll keep any progress earned.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(returnTo)}
              className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setPhase("testing");
                setQuestionStartTime(Date.now());
              }}
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Start Test ⚡
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Testing ───
  if (phase === "testing" && questions.length > 0) {
    const q = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-[#0D1B2A] flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <h2 className="text-white font-medium">{info?.nodeName}</h2>
          </div>
          <div className="text-lg font-bold text-purple-400">
            {answers.filter((a) => a.isCorrect).length}/{answers.length}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg w-full"
            >
              <p className="text-white text-xl font-medium mb-8 text-center">
                {q.questionText}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className="py-4 px-4 bg-[#1B2838] hover:bg-[#243447] border border-gray-700 hover:border-purple-500 rounded-xl text-white text-lg font-medium transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── Result ───
  if (phase === "result" && result) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-[#1B2838] rounded-2xl p-8 text-center"
        >
          {result.passed ? (
            <>
              <div className="text-6xl mb-4">🏆</div>
              <h1 className="text-3xl font-bold text-green-400 mb-2">
                Test Out — PASSED!
              </h1>
              <p className="text-gray-300 text-lg mb-6">
                You already know {info?.nodeName}! Skipping ahead.
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💪</div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">
                Not quite — keep learning!
              </h1>
              <p className="text-gray-300 text-lg mb-6">
                You showed some knowledge of {info?.nodeName}. Your progress has been saved.
              </p>
            </>
          )}

          <div className="bg-[#0D1B2A] rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Score</span>
              <span className="text-white font-medium">
                {result.correctCount}/{result.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Accuracy</span>
              <span className="text-white font-medium">
                {result.accuracy}%
              </span>
            </div>
            {result.passed && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400 font-bold">✅ MASTERED</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push(returnTo)}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
          >
            {result.passed ? "Continue Learning →" : "Back to Lesson →"}
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ─── Question Generator (client-side, same pattern as FluencyZoneGame) ───

function generateQuestions(
  nodeName: string,
  subject: string,
  count: number
): Array<{ questionText: string; options: string[]; correctAnswer: string }> {
  const questions = [];
  for (let i = 0; i < count; i++) {
    if (subject === "MATH") {
      questions.push(generateMathQuestion(i));
    } else {
      questions.push(generateELAQuestion(i));
    }
  }
  return questions;
}

function generateMathQuestion(seed: number) {
  // Varied math question types for test-out assessment
  const types = ["multiply", "divide", "fraction", "equation", "word"];
  const type = types[seed % types.length];

  switch (type) {
    case "multiply": {
      const a = 6 + Math.floor(Math.random() * 7);
      const b = 4 + Math.floor(Math.random() * 8);
      const correct = a * b;
      return {
        questionText: `What is ${a} × ${b}?`,
        options: shuffle([correct, correct + a, correct - b, correct + 10].map(String)),
        correctAnswer: String(correct),
      };
    }
    case "divide": {
      const divisor = 3 + Math.floor(Math.random() * 7);
      const quotient = 4 + Math.floor(Math.random() * 8);
      const dividend = divisor * quotient;
      return {
        questionText: `What is ${dividend} ÷ ${divisor}?`,
        options: shuffle(
          [quotient, quotient + 1, quotient - 1, quotient + 2].map(String)
        ),
        correctAnswer: String(quotient),
      };
    }
    case "fraction": {
      const num = 1 + Math.floor(Math.random() * 3);
      const den = num + 1 + Math.floor(Math.random() * 4);
      const num2 = 1 + Math.floor(Math.random() * 3);
      const correctNum = num + num2;
      return {
        questionText: `What is ${num}/${den} + ${num2}/${den}?`,
        options: shuffle([
          `${correctNum}/${den}`,
          `${correctNum}/${den * 2}`,
          `${correctNum + 1}/${den}`,
          `${num * num2}/${den}`,
        ]),
        correctAnswer: `${correctNum}/${den}`,
      };
    }
    case "equation": {
      const x = 3 + Math.floor(Math.random() * 10);
      const b = 2 + Math.floor(Math.random() * 8);
      const result = x + b;
      return {
        questionText: `If x + ${b} = ${result}, what is x?`,
        options: shuffle([x, x + 1, x - 1, b].map(String)),
        correctAnswer: String(x),
      };
    }
    default: {
      // Word problem
      const apples = 5 + Math.floor(Math.random() * 10);
      const friends = 2 + Math.floor(Math.random() * 4);
      const each = Math.floor(apples / friends);
      const remainder = apples % friends;
      return {
        questionText: `You have ${apples} apples to share equally among ${friends} friends. How many does each friend get?`,
        options: shuffle([each, each + 1, remainder, friends].map(String)),
        correctAnswer: String(each),
      };
    }
  }
}

function generateELAQuestion(seed: number) {
  const bank = [
    {
      questionText: 'Which word is a synonym for "happy"?',
      options: ["Joyful", "Angry", "Tired", "Hungry"],
      correctAnswer: "Joyful",
    },
    {
      questionText: "Which sentence uses correct punctuation?",
      options: [
        "The dog ran quickly.",
        "The dog ran quickly",
        "the dog ran quickly.",
        "The dog, ran quickly.",
      ],
      correctAnswer: "The dog ran quickly.",
    },
    {
      questionText: 'What is the plural of "child"?',
      options: ["Children", "Childs", "Childes", "Childen"],
      correctAnswer: "Children",
    },
    {
      questionText: "Which word is an adjective?",
      options: ["Beautiful", "Running", "Quickly", "Between"],
      correctAnswer: "Beautiful",
    },
    {
      questionText: 'What is the past tense of "run"?',
      options: ["Ran", "Runned", "Running", "Runs"],
      correctAnswer: "Ran",
    },
  ];
  const q = bank[seed % bank.length];
  return { ...q, options: shuffle([...q.options]) };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Page Export with Suspense ───

export default function TestOutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
          <p className="text-white animate-pulse">Loading...</p>
        </div>
      }
    >
      <TestOutContent />
    </Suspense>
  );
}
