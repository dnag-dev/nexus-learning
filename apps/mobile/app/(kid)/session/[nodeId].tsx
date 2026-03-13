/**
 * Active Learning Session — two-step answer flow with mastery tracking.
 *
 * Flow: Start → (Teaching) → Questions → Celebration
 *   - Select option → "Check Answer" button appears (sticky bottom)
 *   - Confirm → submit → correct (green) / wrong (red + explanation)
 *   - "Next Question" button appears (sticky bottom) + auto-advance
 *   - Mastery bar updates after each answer
 *   - Celebration screen when concept mastered
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../lib/theme";
import { useSessionStore } from "../../../store/session";
import { useAuthStore } from "../../../store/auth";
import { StepProgress } from "../../../components/ui/StepProgress";
import { MasteryBar } from "../../../components/ui/MasteryBar";
import { CelebrationScreen } from "../../../components/session/CelebrationScreen";
import { CoordinatePlane } from "../../../components/session/CoordinatePlane";
import { estimateQuestionsRemaining } from "../../../lib/completion-estimate";

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
    totalCorrect,
    isLoading,
    isSubmitting,
    error,
    showCelebration,
    xpEarned,
    gradeCompletion,
    start,
    selectOption,
    confirmAnswer,
    confirmCoordinateAnswer,
    advanceToNext,
    endSessionAction,
    reset,
  } = useSessionStore();

  // Animations
  const resultFlashAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);

  // Coordinate plane answer state
  const [coordPlacedX, setCoordPlacedX] = useState<number | undefined>(undefined);
  const [coordPlacedY, setCoordPlacedY] = useState<number | undefined>(undefined);
  const [coordWasCorrect, setCoordWasCorrect] = useState<boolean | undefined>(undefined);
  const [coordAnswered, setCoordAnswered] = useState(false);

  // Whether current question is a coordinate plane question
  const isCoordinatePlane = currentQuestion?.questionType === "coordinate_plane";

  // ─── Start session on mount ───
  useEffect(() => {
    if (nodeId && profile?.studentId) {
      start(profile.studentId, nodeId);
    }
    return () => {
      reset();
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, profile?.studentId]);

  // ─── Flash result and auto-advance with visible countdown ───
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

      // Auto-advance with visible countdown: 3s for correct, 5s for incorrect
      // When mastered, still auto-advance (advanceToNext triggers celebration)
      {
        const totalSeconds = isMastered ? 2 : isCorrect ? 3 : 5;
        setAutoAdvanceSeconds(totalSeconds);

        // Tick countdown every second
        countdownInterval.current = setInterval(() => {
          setAutoAdvanceSeconds((prev) => {
            if (prev === null || prev <= 1) return null;
            return prev - 1;
          });
        }, 1000);

        // Auto-advance after timer
        autoAdvanceTimer.current = setTimeout(() => {
          setAutoAdvanceSeconds(null);
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          advanceToNext();
        }, totalSeconds * 1000);
      }
    }

    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
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

  const handleConfirm = useCallback(async () => {
    if (!profile?.studentId) {
      Alert.alert("Error", "No student profile found. Please log in again.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await confirmAnswer(profile.studentId);
    } catch (err) {
      Alert.alert(
        "Connection Error",
        "Could not submit your answer. Please check your internet and try again."
      );
    }
  }, [profile?.studentId, confirmAnswer]);

  const handleNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setAutoAdvanceSeconds(null);
    // Reset coordinate plane state for next question
    setCoordPlacedX(undefined);
    setCoordPlacedY(undefined);
    setCoordWasCorrect(undefined);
    setCoordAnswered(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advanceToNext();
  }, [advanceToNext]);

  const handleCoordinateAnswer = useCallback(
    (x: number, y: number, correct: boolean) => {
      if (!profile?.studentId || coordAnswered) return;
      setCoordPlacedX(x);
      setCoordPlacedY(y);
      setCoordWasCorrect(correct);
      setCoordAnswered(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      confirmCoordinateAnswer(profile.studentId, x, y);
    },
    [profile?.studentId, coordAnswered, confirmCoordinateAnswer]
  );

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
        gradeCompletion={gradeCompletion}
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

  const flashColor = isCorrect
    ? colors.successLight
    : isCorrect === false
      ? colors.errorLight
      : "transparent";

  // Determine which sticky bottom button to show
  // Coordinate plane: no "Check Answer" — answer is confirmed on tap
  const showCheckButton = !isCoordinatePlane && selectedOptionId && !isConfirmed;
  const showNextButton = isConfirmed && isCorrect !== null;

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
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

            {/* Coordinate Plane or Multiple Choice */}
            {isCoordinatePlane ? (
              <CoordinatePlane
                gridMin={currentQuestion.gridMin ?? 0}
                gridMax={currentQuestion.gridMax ?? 10}
                correctX={currentQuestion.correctX ?? 0}
                correctY={currentQuestion.correctY ?? 0}
                tolerance={currentQuestion.tolerance ?? 0.5}
                onAnswer={handleCoordinateAnswer}
                answered={coordAnswered}
                wasCorrect={coordWasCorrect}
                placedX={coordPlacedX}
                placedY={coordPlacedY}
                disabled={coordAnswered}
              />
            ) : (
              /* Answer Options (Multiple Choice) */
              currentQuestion.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrectOption =
                  option.id === currentQuestion.correctAnswer;

                // Determine style based on state
                let bgColor = "#ffffff";
                let borderColor = "#E2E8F0";
                let borderW = 1.5;
                let labelBg = colors.surfaceAlt;
                let labelColor = colors.textSecondary;

                if (isConfirmed && isCorrect !== null) {
                  if (isCorrectOption) {
                    bgColor = colors.successLight;
                    borderColor = colors.success;
                    borderW = 2;
                    labelBg = colors.success;
                    labelColor = "#ffffff";
                  } else if (isSelected && !isCorrectOption) {
                    bgColor = colors.errorLight;
                    borderColor = colors.error;
                    borderW = 2;
                    labelBg = colors.error;
                    labelColor = "#ffffff";
                  }
                } else if (isSelected) {
                  bgColor = "#EFF6FF";
                  borderColor = "#1CB0F6";
                  borderW = 2;
                  labelBg = "#1CB0F6";
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
                      paddingVertical: 16,
                      paddingHorizontal: 14,
                      borderWidth: borderW,
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
              })
            )}

            {/* Inline Explanation (no button — button is sticky bottom) */}
            {isConfirmed && isCorrect !== null && (
              <View
                style={{
                  backgroundColor: isCorrect ? colors.successLight : colors.errorLight,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Text style={{ fontSize: 28 }}>{isCorrect ? "✅" : "❌"}</Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isCorrect ? colors.success : colors.error,
                    }}
                  >
                    {isCorrect ? "Correct!" : "Not quite..."}
                  </Text>
                </View>
                {explanation && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 22,
                    }}
                  >
                    {explanation}
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Mastery Bar + Completion Estimate */}
        {currentQuestion && !isLoading && (() => {
          const accuracy = questionsAnswered > 0 ? totalCorrect / questionsAnswered : 0.6;
          const estimate = estimateQuestionsRemaining(masteryPercent, accuracy);
          return (
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
                  estimate.likely > 0
                    ? `~${estimate.likely} more question${estimate.likely === 1 ? "" : "s"} · ${estimate.estimatedMinutes} min`
                    : "Almost there!"
                }
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                {estimate.message}
              </Text>
            </View>
          );
        })()}
      </ScrollView>

      {/* ─── STICKY BOTTOM: Check Answer Button ─── */}
      {showCheckButton && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: safeBottom + 24,
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
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed ? 0.85 : isSubmitting ? 0.6 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            })}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#ffffff" }}
                >
                  Check Answer
                </Text>
                <Text style={{ fontSize: 18, color: "#ffffff" }}>
                  {"\u2713"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* ─── STICKY BOTTOM: Next Question Button ─── */}
      {showNextButton && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: safeBottom + 24,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              backgroundColor: isCorrect ? colors.success : colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            })}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: "#ffffff" }}
            >
              {isMastered ? "See Results" : "Next Question"}{autoAdvanceSeconds !== null ? ` (${autoAdvanceSeconds}s)` : ""}
            </Text>
            <Text style={{ fontSize: 18, color: "#ffffff" }}>→</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
