/**
 * Celebration screen — shown when a concept is mastered.
 *
 * Includes optional grade completion card when mastering a node
 * completes all topics for an entire grade + subject.
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { useTheme } from "../../lib/theme";
import type { GradeCompletionData } from "../../store/session";

interface CelebrationScreenProps {
  nodeTitle: string;
  xpEarned: number;
  questionsAnswered: number;
  masteryPercent: number;
  gradeCompletion?: GradeCompletionData | null;
  onContinue: () => void;
  onBackToDashboard: () => void;
}

function gradeDisplayName(grade: string): string {
  if (grade === "K") return "Kindergarten";
  return `Grade ${grade.replace("G", "")}`;
}

function subjectDisplayName(subject: string): string {
  return subject === "MATH" ? "Math" : "English";
}

export function CelebrationScreen({
  nodeTitle,
  xpEarned,
  questionsAnswered,
  masteryPercent,
  gradeCompletion,
  onContinue,
  onBackToDashboard,
}: CelebrationScreenProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        paddingBottom: 60,
        minHeight: "100%",
      }}
    >
      {/* Celebration emoji */}
      <Text style={{ fontSize: 72, marginBottom: 16 }}>
        {gradeCompletion ? "\uD83C\uDF93" : "\uD83C\uDF89"}
      </Text>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: colors.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Concept Mastered!
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        You mastered {nodeTitle}
      </Text>

      {/* Stats */}
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 90,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.xp }}>
            +{xpEarned}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>XP Earned</Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 90,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.success }}>
            {masteryPercent}%
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Mastery</Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 90,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
            {questionsAnswered}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Questions</Text>
        </View>
      </View>

      {/* ─── Grade Completion Card ─── */}
      {gradeCompletion && (
        <View
          style={{
            width: "100%",
            backgroundColor: "#FFF7E6",
            borderWidth: 2,
            borderColor: colors.gold,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 40 }}>{"\uD83C\uDF93"}</Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#92400E",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {gradeDisplayName(gradeCompletion.grade)}{" "}
              {subjectDisplayName(gradeCompletion.subject)} — COMPLETE!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#B45309",
                marginTop: 4,
              }}
            >
              You mastered all {gradeCompletion.totalNodes} topics!
            </Text>
          </View>

          {gradeCompletion.nextGrade &&
            gradeCompletion.upcomingTopics.length > 0 && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#FDE68A",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#92400E",
                    marginBottom: 6,
                  }}
                >
                  {"\uD83D\uDE80"} Ready for{" "}
                  {gradeDisplayName(gradeCompletion.nextGrade)}{" "}
                  {subjectDisplayName(gradeCompletion.subject)}?
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#B45309",
                    marginBottom: 6,
                  }}
                >
                  New topics unlocking:
                </Text>
                {gradeCompletion.upcomingTopics.map((topic, i) => (
                  <Text
                    key={i}
                    style={{
                      fontSize: 13,
                      color: "#92400E",
                      marginBottom: 2,
                      paddingLeft: 8,
                    }}
                  >
                    {"\u2022"} {topic}
                  </Text>
                ))}
                {gradeCompletion.upcomingTopics.length >= 4 && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#B45309",
                      fontStyle: "italic",
                      paddingLeft: 8,
                      marginTop: 2,
                    }}
                  >
                    + more topics
                  </Text>
                )}
              </View>
            )}
        </View>
      )}

      {/* Buttons */}
      <View style={{ width: "100%", gap: 12 }}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderBottomWidth: pressed ? 2 : 4,
            borderBottomColor: colors.primaryShadow,
            transform: pressed ? [{ translateY: 2 }] : [],
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Continue Learning {"\u2192"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onBackToDashboard}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Back to Dashboard
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
