/**
 * Fluency Results — score summary with personal best comparison.
 */

import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface FluencyResultsProps {
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  questionsPerMin: number;
  isPersonalBest: boolean;
  previousBest: number | null;
  nodeName: string;
  timeLimitSeconds: number;
  onPlayAgain: () => void;
  onChangeTopic: () => void;
  onBack: () => void;
}

export function FluencyResults({
  correctCount,
  totalQuestions,
  accuracy,
  questionsPerMin,
  isPersonalBest,
  previousBest,
  nodeName,
  timeLimitSeconds,
  onPlayAgain,
  onChangeTopic,
  onBack,
}: FluencyResultsProps) {
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
      {/* Trophy / celebration */}
      <Text style={{ fontSize: 64, marginBottom: 12 }}>
        {isPersonalBest ? "\uD83C\uDFC6" : "\u26A1"}
      </Text>

      {isPersonalBest && (
        <View
          style={{
            backgroundColor: colors.gold + "22",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.gold,
            }}
          >
            New Personal Best!
          </Text>
        </View>
      )}

      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: colors.text,
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {nodeName}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: 24,
        }}
      >
        {Math.floor(timeLimitSeconds / 60)} min drill
      </Text>

      {/* Stats grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 32,
          width: "100%",
        }}
      >
        <StatBox
          label="Score"
          value={`${correctCount}/${totalQuestions}`}
          colors={colors}
          valueColor={colors.success}
        />
        <StatBox
          label="Accuracy"
          value={`${Math.round(accuracy)}%`}
          colors={colors}
          valueColor={accuracy >= 80 ? colors.success : colors.warning}
        />
        <StatBox
          label="Speed"
          value={`${Math.round(questionsPerMin)}`}
          subLabel="Q/min"
          colors={colors}
          valueColor={colors.primary}
        />
        <StatBox
          label="Best"
          value={
            isPersonalBest
              ? `${Math.round(questionsPerMin)}`
              : previousBest
                ? `${Math.round(previousBest)}`
                : "-"
          }
          subLabel="Q/min"
          colors={colors}
          valueColor={colors.gold}
        />
      </View>

      {/* Previous best comparison */}
      {previousBest && !isPersonalBest && (
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            marginBottom: 24,
          }}
        >
          Your best: {Math.round(previousBest)} Q/min
        </Text>
      )}

      {/* Buttons */}
      <View style={{ width: "100%", gap: 10 }}>
        <Pressable
          onPress={onPlayAgain}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
            Play Again
          </Text>
        </Pressable>

        <Pressable
          onPress={onChangeTopic}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            Change Topic
          </Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          style={({ pressed }) => ({
            paddingVertical: 12,
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.textMuted,
            }}
          >
            Back to Dashboard
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Stat Box ───

function StatBox({
  label,
  value,
  subLabel,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  subLabel?: string;
  colors: { surface: string; border: string; textMuted: string };
  valueColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "45%",
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: valueColor }}>
        {value}
      </Text>
      {subLabel && (
        <Text style={{ fontSize: 10, color: colors.textMuted }}>{subLabel}</Text>
      )}
    </View>
  );
}
