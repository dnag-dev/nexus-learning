/**
 * Explanation bottom sheet — shown after answering incorrectly.
 */

import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface ExplanationSheetProps {
  isCorrect: boolean;
  explanation: string | null;
  selectedAnswer?: string;
  correctAnswer?: string;
  onNext: () => void;
}

export function ExplanationSheet({
  isCorrect,
  explanation,
  selectedAnswer,
  correctAnswer,
  onNext,
}: ExplanationSheetProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: isCorrect ? colors.successLight : colors.errorLight,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
      }}
    >
      {/* Result icon */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
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

      {/* Explanation */}
      {explanation && (
        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
            marginBottom: 16,
          }}
        >
          {explanation}
        </Text>
      )}

      {/* Next button */}
      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: isCorrect ? colors.success : colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>
          Next Question →
        </Text>
      </Pressable>
    </View>
  );
}
