/**
 * Explanation sheet — shown after answering a question.
 * Shows correct/incorrect feedback with explanation and a prominent Next button.
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
            marginBottom: 20,
          }}
        >
          {explanation}
        </Text>
      )}

      {/* Next button — BIG and prominent */}
      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: isCorrect ? colors.success : colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        })}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#ffffff" }}>
          Next Question →
        </Text>
      </Pressable>
    </View>
  );
}
