/**
 * Fluency Game — timed speed drill with 2x2 answer grid.
 *
 * - Countdown timer bar (animated, red when <5s)
 * - Auto-advance after 300ms
 * - Haptic feedback per answer
 * - Live score counter
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../lib/theme";
import {
  generateQuestion,
  type FluencyQuestion,
} from "../../lib/fluency-questions";
import type { FluencyAnswer } from "@aauti/api-client";

interface FluencyGameProps {
  subject: string;
  timeLimitSeconds: number;
  onFinish: (answers: FluencyAnswer[], elapsedSeconds: number) => void;
}

export function FluencyGame({
  subject,
  timeLimitSeconds,
  onFinish,
}: FluencyGameProps) {
  const { colors } = useTheme();

  const [question, setQuestion] = useState<FluencyQuestion | null>(null);
  const [answers, setAnswers] = useState<FluencyAnswer[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [isFinished, setIsFinished] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  const timerAnim = useRef(new Animated.Value(1)).current;

  // Generate first question
  useEffect(() => {
    setQuestion(generateQuestion(subject));
    startTimeRef.current = Date.now();
    questionStartRef.current = Date.now();
  }, [subject]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animate timer bar
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: timeLimitSeconds * 1000,
      useNativeDriver: false,
    }).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLimitSeconds, timerAnim]);

  // When finished, submit
  useEffect(() => {
    if (isFinished) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      onFinish(answers, elapsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const handleAnswer = useCallback(
    (optionId: string) => {
      if (!question || isFinished) return;

      const isCorrect = optionId === question.correctId;
      const timeMs = Date.now() - questionStartRef.current;

      // Haptic feedback
      if (isCorrect) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setLastResult(isCorrect);
      if (isCorrect) setCorrectCount((c) => c + 1);
      setTotalCount((c) => c + 1);

      // Record answer
      const selectedOption = question.options.find((o) => o.id === optionId);
      const correctOption = question.options.find((o) => o.isCorrect);

      setAnswers((prev) => [
        ...prev,
        {
          questionText: question.questionText,
          answer: selectedOption?.text ?? "",
          correct: isCorrect,
          timeMs,
        },
      ]);

      // Auto-advance after brief flash
      setTimeout(() => {
        setLastResult(null);
        questionStartRef.current = Date.now();
        setQuestion(generateQuestion(subject));
      }, 300);
    },
    [question, isFinished, subject]
  );

  // Timer bar color
  const timerColor = timeLeft <= 5 ? colors.error : colors.primary;
  const timerBarWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Timer bar */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.border,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: timerBarWidth,
            backgroundColor: timerColor,
          }}
        />
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Score</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.success,
            }}
          >
            {correctCount}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            /{totalCount}
          </Text>
        </View>

        <View
          style={{
            backgroundColor:
              timeLeft <= 5 ? colors.errorLight : colors.primaryLight,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: timeLeft <= 5 ? colors.error : colors.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Q/min</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {timeLimitSeconds - timeLeft > 0
              ? Math.round(
                  (totalCount / (timeLimitSeconds - timeLeft)) * 60
                )
              : 0}
          </Text>
        </View>
      </View>

      {/* Question */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        {question && (
          <>
            {/* Result flash */}
            {lastResult !== null && (
              <Text
                style={{
                  fontSize: 36,
                  position: "absolute",
                  top: 20,
                }}
              >
                {lastResult ? "\u2705" : "\u274C"}
              </Text>
            )}

            {/* Question text */}
            <Text
              style={{
                fontSize: subject.toUpperCase() === "MATH" ? 48 : 22,
                fontWeight: "800",
                color: colors.text,
                textAlign: "center",
                marginBottom: 40,
              }}
            >
              {question.questionText}
            </Text>

            {/* 2x2 Answer Grid */}
            <View style={{ width: "100%", gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {question.options.slice(0, 2).map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleAnswer(opt.id)}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      paddingVertical: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      minHeight: 70,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: subject.toUpperCase() === "MATH" ? 24 : 16,
                        fontWeight: "700",
                        color: colors.text,
                        textAlign: "center",
                      }}
                    >
                      {opt.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {question.options.slice(2, 4).map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleAnswer(opt.id)}
                    style={({ pressed }) => ({
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      paddingVertical: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                      minHeight: 70,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: subject.toUpperCase() === "MATH" ? 24 : 16,
                        fontWeight: "700",
                        color: colors.text,
                        textAlign: "center",
                      }}
                    >
                      {opt.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
