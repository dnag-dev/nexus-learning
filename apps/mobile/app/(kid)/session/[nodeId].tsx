/**
 * Active Learning Session — two-step answer flow with mastery tracking.
 *
 * Flow: Start → (Teaching) → Questions → Celebration
 *   - Select option → "Check Answer" button appears
 *   - Confirm → submit → correct (green) / wrong (red + explanation)
 *   - Auto-advance after 2.5s or tap "Next"
 *   - Mastery bar updates after each answer
 *   - Celebration screen when concept mastered
 */

import { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../lib/theme";
import { useSessionStore } from "../../../store/session";
import { useAuthStore } from "../../../store/auth";
import { StepProgress } from "../../../components/ui/StepProgress";
import { MasteryBar } from "../../../components/ui/MasteryBar";
import { ExplanationSheet } from "../../../components/session/ExplanationSheet";
import { CelebrationScreen } from "../../../components/session/CelebrationScreen";

// ─── Option label helpers ───

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

// ─── Main Session Screen ───

export default function SessionScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Ensure we always have safe bottom padding (34pt on iPhone X+, 0 on Android)
  const safeBottom = Math.max(insets.bottom, Platform.OS === "ios" ? 34 : 0);
  const profile = useAuthStore((s) => s.profile);

  // Session state
  const {
    sessionId,
    nodeTitle,
    currentQuestion,
    learningStep,
    questionsAnswered,
    selectedOptionId,
    isConfirmed,
    isCorrect,
    explanation,
    masteryPercent,
    isMastered,
    correctStreak,
    isLoading,
    isSubmitting,
    error,
    showCelebration,
    xpEarned,
    start,
    selectOption,
    confirmAnswer,
    advanceToNext,
    endSessionAction,
    reset,
  } = useSessionStore();

  // Animations
  const confirmButtonAnim = useRef(new Animated.Value(0)).current;
  const resultFlashAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Start session on mount ───
  useEffect(() => {
    if (nodeId && profile?.studentId) {
      start(profile.studentId, nodeId);
    }
    return () => {
      reset();
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, profile?.studentId]);

  // ─── Animate confirm button when option selected ───
  useEffect(() => {
    if (selectedOptionId && !isConfirmed) {
      Animated.spring(confirmButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    } else {
      Animated.timing(confirmButtonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedOptionId, isConfirmed, confirmButtonAnim]);

  // ─── Flash result and auto-advance ───
  useEffect(() => {
    if (isConfirmed && isCorrect !== null) {
      // Flash
      resultFlashAnim.setValue(1);
      Animated.timing(resultFlashAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Haptics
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Auto-advance for correct answers
      if (isCorrect && !isMastered) {
        autoAdvanceTimer.current = setTimeout(() => {
          advanceToNext();
        }, 2500);
      }
    }

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [isConfirmed, isCorrect, isMastered, resultFlashAnim, advanceToNext]);

  // ─── Handlers ───

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (isConfirmed || isSubmitting) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      selectOption(optionId);
    },
    [isConfirmed, isSubmitting, selectOption]
  );

  const handleConfirm = useCallback(() => {
    if (!profile?.studentId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    confirmAnswer(profile.studentId);
  }, [profile?.studentId, confirmAnswer]);

  const handleNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    advanceToNext();
  }, [advanceToNext]);

  const handleClose = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (profile?.studentId && sessionId) {
      endSessionAction(profile.studentId);
    }
    router.back();
  }, [profile?.studentId, sessionId, endSessionAction]);

  const handleCelebrationContinue = useCallback(() => {
    router.back();
  }, []);

  // ─── Celebration screen ───

  if (showCelebration) {
    return (
      <CelebrationScreen
        nodeTitle={nodeTitle}
        xpEarned={xpEarned}
        questionsAnswered={questionsAnswered}
        masteryPercent={masteryPercent}
        onContinue={handleCelebrationContinue}
        onBackToDashboard={() => router.replace("/(kid)/dashboard")}
      />
    );
  }

  // ─── Loading state ───

  if (isLoading && !currentQuestion) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 15,
              color: colors.textSecondary,
            }}
          >
            Loading session...
          </Text>
        </View>
      </View>
    );
  }

  // ─── Error state ───

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😟</Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.error,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: colors.text }}
            >
              Back to Dashboard
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Main Session UI ───

  const confirmTranslateY = confirmButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const confirmOpacity = confirmButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const flashColor = isCorrect
    ? colors.successLight
    : isCorrect === false
      ? colors.errorLight
      : "transparent";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Result flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: flashColor,
          opacity: resultFlashAnim,
          zIndex: 100,
        }}
      />

      {/* ─── Compact Header ─── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 20, color: colors.textSecondary }}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {nodeTitle || "Session"}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            Q{questionsAnswered + 1}
            {correctStreak > 1 ? ` \u00B7 \uD83D\uDD25 ${correctStreak} streak` : ""}
          </Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={12}>
          <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
        </Pressable>
      </View>

      {/* ─── Step Progress ─── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <StepProgress
          currentStep={learningStep}
          completedSteps={learningStep}
        />
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading next question */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Question Card */}
        {currentQuestion && !isLoading && (
          <>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  lineHeight: 26,
                  color: colors.text,
                }}
              >
                {currentQuestion.questionText}
              </Text>
            </View>

            {/* Answer Options */}
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption =
                option.id === currentQuestion.correctAnswer;

              // Determine style based on state
              let bgColor = colors.surface;
              let borderColor = colors.border;
              let labelBg = colors.surfaceAlt;
              let labelColor = colors.textSecondary;

              if (isConfirmed && isCorrect !== null) {
                if (isCorrectOption) {
                  bgColor = colors.successLight;
                  borderColor = colors.success;
                  labelBg = colors.success;
                  labelColor = "#ffffff";
                } else if (isSelected && !isCorrectOption) {
                  bgColor = colors.errorLight;
                  borderColor = colors.error;
                  labelBg = colors.error;
                  labelColor = "#ffffff";
                }
              } else if (isSelected) {
                bgColor = colors.primaryLight;
                borderColor = colors.primary;
                labelBg = colors.primary;
                labelColor = "#ffffff";
              }

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelectOption(option.id)}
                  disabled={isConfirmed}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: bgColor,
                    borderRadius: 14,
                    minHeight: 56,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderWidth: 1.5,
                    borderColor: borderColor,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: labelBg,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: labelColor,
                      }}
                    >
                      {OPTION_LABELS[index] || String(index + 1)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      lineHeight: 22,
                      color: colors.text,
                      fontWeight: "500",
                    }}
                  >
                    {option.text}
                  </Text>
                  {isConfirmed && isCorrectOption && (
                    <Text style={{ fontSize: 20, marginLeft: 8 }}>✅</Text>
                  )}
                  {isConfirmed && isSelected && !isCorrectOption && (
                    <Text style={{ fontSize: 20, marginLeft: 8 }}>❌</Text>
                  )}
                </Pressable>
              );
            })}

            {/* Explanation Sheet (inline, shown after confirm) */}
            {isConfirmed && isCorrect !== null && (
              <ExplanationSheet
                isCorrect={isCorrect}
                explanation={explanation}
                selectedAnswer={
                  currentQuestion.options.find(
                    (o) => o.id === selectedOptionId
                  )?.text
                }
                correctAnswer={
                  currentQuestion.options.find(
                    (o) => o.id === currentQuestion.correctAnswer
                  )?.text
                }
                onNext={handleNext}
              />
            )}
          </>
        )}

        {/* Mastery Bar */}
        {currentQuestion && !isLoading && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginTop: 8,
            }}
          >
            <MasteryBar
              progress={masteryPercent}
              goal={85}
              estimate={
                masteryPercent < 85
                  ? `~${Math.max(1, Math.ceil((85 - masteryPercent) / 12))} more questions`
                  : "Almost there!"
              }
            />
          </View>
        )}
      </ScrollView>

      {/* ─── Confirm Button (sticky bottom) ─── */}
      {selectedOptionId && !isConfirmed && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: safeBottom + 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleConfirm}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed ? 0.85 : isSubmitting ? 0.6 : 1,
            })}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}
                >
                  Check Answer
                </Text>
                <Text style={{ fontSize: 16, color: "#ffffff" }}>
                  {"\u2713"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
