import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

// ─── Types (duplicated from web — shared package in future) ───

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

const API_BASE = "http://localhost:3000";

export default function DiagnosticScreen() {
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

  const DEMO_STUDENT_ID = "demo-student-1";

  const startDiagnostic = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/diagnostic/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: DEMO_STUDENT_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        const res = await fetch(`${API_BASE}/api/diagnostic/answer`, {
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.status === "complete") {
          setResult(data.result);
          setProgress(data.progress);
          setPhase("result");
        } else {
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

  // ─── Intro ───
  if (phase === "intro") {
    return (
      <ScrollView className="flex-1 bg-aauti-bg-light">
        <View className="items-center px-6 pt-12 pb-8">
          <View className="w-28 h-28 rounded-full bg-aauti-primary/10 items-center justify-center mb-6">
            <Text className="text-6xl">🐻</Text>
          </View>
          <Text className="text-3xl font-bold text-aauti-text-primary mb-2 text-center">
            Find Your Aauti Level!
          </Text>
          <Text className="text-base text-aauti-text-secondary text-center mb-1">
            Hi! I'm Cosmo, and I'll be your guide.
          </Text>
          <Text className="text-sm text-aauti-text-secondary text-center mb-8 px-4">
            I'll ask you some math questions so I can figure out exactly where to
            start your adventure. There are no wrong answers!
          </Text>

          <View className="w-full bg-white rounded-2xl p-5 border border-gray-100 mb-8">
            <View className="flex-row items-center gap-3 mb-4">
              <Text className="text-xl">🎯</Text>
              <View>
                <Text className="font-semibold text-aauti-text-primary">
                  20 questions
                </Text>
                <Text className="text-xs text-aauti-text-secondary">
                  Takes about 8-12 minutes
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3 mb-4">
              <Text className="text-xl">💡</Text>
              <View>
                <Text className="font-semibold text-aauti-text-primary">
                  Hints available
                </Text>
                <Text className="text-xs text-aauti-text-secondary">
                  Tap the hint button if you need a nudge
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">⭐</Text>
              <View>
                <Text className="font-semibold text-aauti-text-primary">
                  No pressure
                </Text>
                <Text className="text-xs text-aauti-text-secondary">
                  Questions adapt to you
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={startDiagnostic}
            disabled={isLoading}
            className="w-full py-4 bg-aauti-primary rounded-2xl items-center active:bg-aauti-primary/80 disabled:opacity-50"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-semibold text-white">
                Let's Go! 🚀
              </Text>
            )}
          </Pressable>
          {error && (
            <Text className="mt-4 text-sm text-aauti-danger">{error}</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  // ─── Active / Feedback ───
  if ((phase === "active" || phase === "feedback") && question) {
    return (
      <View className="flex-1 bg-aauti-bg-light">
        {/* Progress bar */}
        <View className="bg-white px-5 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">🐻</Text>
              <Text className="font-semibold text-aauti-text-primary">
                Cosmo's Level Finder
              </Text>
            </View>
            <Text className="text-sm text-aauti-text-secondary">
              {progress.current} / {progress.total}
            </Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View
              className="bg-aauti-primary h-2 rounded-full"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </View>
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Feedback */}
          {phase === "feedback" && feedback && (
            <View
              className={`mb-5 p-4 rounded-2xl ${
                feedback.wasCorrect
                  ? "bg-green-50 border border-green-200"
                  : "bg-orange-50 border border-orange-200"
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  feedback.wasCorrect ? "text-green-700" : "text-orange-700"
                }`}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Domain badge */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-aauti-primary/10 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-aauti-primary">
                {question.domain}
              </Text>
            </View>
            <Text className="text-xs text-aauti-text-muted">
              {question.gradeLevel === "K"
                ? "Kindergarten"
                : `Grade ${question.gradeLevel}`}
            </Text>
          </View>

          {/* Question */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
            <Text className="text-lg text-aauti-text-primary leading-7">
              {question.questionText}
            </Text>
          </View>

          {/* Options */}
          <View className="gap-3 mb-5">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const showResult = phase === "feedback";

              let bgClass = "bg-white border-gray-200";
              if (isSelected && !showResult)
                bgClass = "bg-aauti-primary/10 border-aauti-primary";
              else if (showResult && isSelected && option.isCorrect)
                bgClass = "bg-green-50 border-green-400";
              else if (showResult && isSelected && !option.isCorrect)
                bgClass = "bg-red-50 border-red-400";
              else if (showResult && option.isCorrect)
                bgClass = "bg-green-50/50 border-green-200";

              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    if (phase === "active" && !isLoading) {
                      submitAnswer(option.id);
                    }
                  }}
                  disabled={phase === "feedback" || isLoading}
                  className={`p-4 rounded-xl border-2 ${bgClass}`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                      <Text className="text-sm font-bold text-aauti-text-secondary">
                        {option.id}
                      </Text>
                    </View>
                    <Text className="text-aauti-text-primary flex-1">
                      {option.text}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Hint */}
          {question.hint && phase === "active" && (
            <View className="items-center mb-8">
              {showHint ? (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 w-full">
                  <Text className="text-sm text-aauti-text-primary">
                    💡 <Text className="font-semibold">Cosmo's hint:</Text>{" "}
                    {question.hint}
                  </Text>
                </View>
              ) : (
                <Pressable onPress={() => setShowHint(true)}>
                  <Text className="text-sm text-aauti-primary">
                    💡 Need a hint from Cosmo?
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── Result ───
  if (phase === "result" && result) {
    const gradeLabel =
      result.gradeEstimate < 1
        ? "Kindergarten"
        : `Grade ${Math.floor(result.gradeEstimate)}`;

    return (
      <ScrollView className="flex-1 bg-aauti-bg-light">
        <View className="items-center px-5 pt-10 pb-8">
          <View className="w-24 h-24 rounded-full bg-yellow-100 items-center justify-center mb-6">
            <Text className="text-5xl">🎉</Text>
          </View>
          <Text className="text-3xl font-bold text-aauti-text-primary mb-2">
            You Did It!
          </Text>
          <Text className="text-base text-aauti-text-secondary mb-6">
            Cosmo found your perfect starting point.
          </Text>

          {/* Grade card */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100 w-full mb-5 items-center">
            <Text className="text-sm text-aauti-text-secondary mb-1">
              Your Math Level
            </Text>
            <Text className="text-4xl font-bold text-aauti-primary mb-1">
              {gradeLabel}
            </Text>
            <Text className="text-xs text-aauti-text-muted">
              Confidence: {Math.round(result.confidence * 100)}%
            </Text>
          </View>

          {/* Stats row */}
          <View className="flex-row gap-4 w-full mb-5">
            <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center">
              <Text className="text-2xl font-bold text-green-600">
                {result.totalCorrect}
              </Text>
              <Text className="text-xs text-aauti-text-secondary">Correct</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 border border-gray-100 items-center">
              <Text className="text-2xl font-bold text-aauti-text-primary">
                {result.totalQuestions}
              </Text>
              <Text className="text-xs text-aauti-text-secondary">
                Questions
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View className="bg-aauti-primary/5 rounded-2xl p-5 border border-aauti-primary/10 w-full mb-6">
            <View className="flex-row gap-3">
              <Text className="text-2xl">🐻</Text>
              <Text className="text-aauti-text-primary leading-6 flex-1">
                {result.summary}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace("/dashboard")}
            className="w-full py-4 bg-aauti-primary rounded-2xl items-center active:bg-aauti-primary/80"
          >
            <Text className="text-lg font-semibold text-white">
              Start Learning with Cosmo! 🚀
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return null;
}
