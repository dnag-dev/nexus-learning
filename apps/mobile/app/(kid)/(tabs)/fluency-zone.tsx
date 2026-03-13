/**
 * Fluency Zone — speed practice drills.
 *
 * Three screens in one:
 * 1. Topic Picker — subject tabs, topic list, time picker
 * 2. Game — timed 2x2 grid speed drill
 * 3. Results — score summary, personal best, replay
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../lib/theme";
import { useAuthStore } from "../../../store/auth";
import { gradeSort } from "../../../hooks/useTopicTree";
import {
  getTopics,
  startFluencyZone,
  submitFluencyResults,
} from "@aauti/api-client";
import type {
  FluencyTopic,
  FluencyAnswer,
  FluencySubmitResponse,
} from "@aauti/api-client";

import { SubjectTabs } from "../../../components/ui/SubjectTabs";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";
import { FluencyGame } from "../../../components/kid/FluencyGame";
import { FluencyResults } from "../../../components/kid/FluencyResults";

// ─── Time options ───

const TIME_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
];

// ─── Screen states ───

type ScreenState = "picker" | "game" | "results";

export default function FluencyZoneScreen() {
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);

  // State
  const [screen, setScreen] = useState<ScreenState>("picker");
  const [subject, setSubject] = useState<"math" | "english">("math");
  const [topics, setTopics] = useState<FluencyTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<FluencyTopic | null>(null);
  const [selectedTime, setSelectedTime] = useState(60);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FluencySubmitResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch topics ───
  const fetchTopics = useCallback(async () => {
    if (!profile?.studentId) return;
    setLoading(true);
    setError(null);
    try {
      const apiSubject = subject === "math" ? "MATH" : "ENGLISH";
      const res = await getTopics(profile.studentId, apiSubject);
      // Filter to mastered topics only and sort by grade numerically
      const mastered = (res.topics ?? [])
        .filter((t) => t.bktProbability >= 0.85)
        .sort((a, b) => gradeSort(a.gradeLevel, b.gradeLevel));
      setTopics(mastered);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load topics"
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.studentId, subject]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTopics();
    setRefreshing(false);
  }, [fetchTopics]);

  // ─── Start game ───
  const handleStart = useCallback(async () => {
    if (!profile?.studentId || !selectedTopic) return;
    setStarting(true);
    setError(null);

    try {
      const res = await startFluencyZone(
        profile.studentId,
        selectedTopic.nodeId,
        selectedTime
      );
      setSessionId(res.sessionId);
      setScreen("game");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start drill"
      );
    } finally {
      setStarting(false);
    }
  }, [profile?.studentId, selectedTopic, selectedTime]);

  // ─── Game finished ───
  const handleGameFinish = useCallback(
    async (answers: FluencyAnswer[], elapsedSeconds: number) => {
      if (!sessionId || !profile?.studentId) return;

      try {
        const res = await submitFluencyResults(
          sessionId,
          profile.studentId,
          answers,
          elapsedSeconds
        );
        setResults(res);
        Haptics.notificationAsync(
          res.isPersonalBest
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      } catch {
        // Fallback local results
        const correct = answers.filter((a) => a.correct).length;
        setResults({
          correctCount: correct,
          totalQuestions: answers.length,
          accuracy: answers.length > 0 ? (correct / answers.length) * 100 : 0,
          questionsPerMin:
            elapsedSeconds > 0
              ? (answers.length / elapsedSeconds) * 60
              : 0,
          averageTimeMs: 0,
          isPersonalBest: false,
          previousBest: null,
          nodeName: selectedTopic?.title ?? "",
          timeLimitSeconds: selectedTime,
        });
      }

      setScreen("results");
    },
    [sessionId, profile?.studentId, selectedTopic, selectedTime]
  );

  // ─── Replay / change topic ───
  const handlePlayAgain = useCallback(() => {
    setResults(null);
    setSessionId(null);
    handleStart();
  }, [handleStart]);

  const handleChangeTopic = useCallback(() => {
    setResults(null);
    setSessionId(null);
    setScreen("picker");
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // ─── Game screen ───
  if (screen === "game") {
    return (
      <FluencyGame
        subject={subject}
        timeLimitSeconds={selectedTime}
        onFinish={handleGameFinish}
      />
    );
  }

  // ─── Results screen ───
  if (screen === "results" && results) {
    return (
      <FluencyResults
        correctCount={results.correctCount}
        totalQuestions={results.totalQuestions}
        accuracy={results.accuracy}
        questionsPerMin={results.questionsPerMin}
        isPersonalBest={results.isPersonalBest}
        previousBest={results.previousBest}
        nodeName={results.nodeName}
        timeLimitSeconds={results.timeLimitSeconds}
        onPlayAgain={handlePlayAgain}
        onChangeTopic={handleChangeTopic}
        onBack={handleBack}
      />
    );
  }

  // ─── Topic Picker Screen ───
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          Fluency Zone
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 12,
          }}
        >
          Race against the clock! Pick a topic and time.
        </Text>

        <SubjectTabs
          selected={subject}
          onSelect={(s) => {
            setSubject(s as "math" | "english");
            setSelectedTopic(null);
          }}
        />
      </View>

      {/* Error */}
      {error && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <ErrorBanner message={error} />
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Time picker */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Duration
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {TIME_OPTIONS.map((opt) => {
            const isSelected = selectedTime === opt.seconds;
            return (
              <Pressable
                key={opt.seconds}
                onPress={() => setSelectedTime(opt.seconds)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: isSelected
                    ? colors.primaryLight
                    : colors.surface,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? colors.primary : colors.text,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Topic list */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Pick a Topic
        </Text>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : topics.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📚</Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No mastered topics yet.{"\n"}Master a concept first, then drill here!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {(() => {
              // Group topics by grade level
              const gradeMap = new Map<string, FluencyTopic[]>();
              for (const t of topics) {
                const g = t.gradeLevel || "?";
                const arr = gradeMap.get(g);
                if (arr) arr.push(t);
                else gradeMap.set(g, [t]);
              }
              const sortedGrades = [...gradeMap.keys()].sort(gradeSort);

              return sortedGrades.map((grade) => {
                const gradeTopics = gradeMap.get(grade)!;
                const bare = grade.startsWith("G") ? grade.slice(1) : grade;
                const gradeLabel =
                  grade === "K" ? "Kindergarten" : `Grade ${bare}`;

                return (
                  <View key={grade}>
                    {/* Grade sub-header */}
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: colors.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 1.2,
                        marginTop: 10,
                        marginBottom: 6,
                        marginLeft: 2,
                      }}
                    >
                      {gradeLabel}
                    </Text>

                    {gradeTopics.map((topic) => {
                      const isSelected =
                        selectedTopic?.nodeId === topic.nodeId;
                      return (
                        <Pressable
                          key={topic.nodeId}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                            setSelectedTopic(topic);
                          }}
                          style={({ pressed }) => ({
                            backgroundColor: isSelected
                              ? colors.primaryLight
                              : colors.surface,
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 6,
                            borderWidth: 1.5,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                            opacity: pressed ? 0.85 : 1,
                            flexDirection: "row",
                            alignItems: "center",
                          })}
                        >
                          {/* Radio */}
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              borderWidth: 2,
                              borderColor: isSelected
                                ? colors.primary
                                : colors.textMuted,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            {isSelected && (
                              <View
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 6,
                                  backgroundColor: colors.primary,
                                }}
                              />
                            )}
                          </View>

                          {/* Info */}
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: colors.text,
                                marginBottom: 2,
                              }}
                              numberOfLines={1}
                            >
                              {topic.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: colors.textMuted,
                              }}
                            >
                              {topic.domain}
                            </Text>
                          </View>

                          {/* Personal best */}
                          {topic.personalBestQPM != null &&
                            topic.personalBestQPM > 0 && (
                              <View style={{ alignItems: "flex-end" }}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "700",
                                    color: colors.gold,
                                  }}
                                >
                                  {Math.round(topic.personalBestQPM)}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 9,
                                    color: colors.textMuted,
                                  }}
                                >
                                  Q/min best
                                </Text>
                              </View>
                            )}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              });
            })()}
          </View>
        )}
      </ScrollView>

      {/* Start button */}
      {selectedTopic && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 32,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={handleStart}
            disabled={starting}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: pressed ? 0.85 : starting ? 0.6 : 1,
            })}
          >
            {starting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={{ fontSize: 18 }}>{"\u26A1"}</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  Start Drill
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
