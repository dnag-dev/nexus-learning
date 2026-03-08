/**
 * Celebration screen — shown when a concept is mastered.
 */

import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface CelebrationScreenProps {
  nodeTitle: string;
  xpEarned: number;
  questionsAnswered: number;
  masteryPercent: number;
  onContinue: () => void;
  onBackToDashboard: () => void;
}

export function CelebrationScreen({
  nodeTitle,
  xpEarned,
  questionsAnswered,
  masteryPercent,
  onContinue,
  onBackToDashboard,
}: CelebrationScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Celebration emoji */}
      <Text style={{ fontSize: 72, marginBottom: 16 }}>🎉</Text>

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
          marginBottom: 32,
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

      {/* Buttons */}
      <View style={{ width: "100%", gap: 12 }}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Continue Learning →
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
    </View>
  );
}
