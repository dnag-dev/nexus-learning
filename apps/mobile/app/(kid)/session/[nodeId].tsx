import { View, Text, Pressable, useColorScheme } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

/**
 * Active Learning Session — stub for Phase 6.
 * Will implement the full two-step answer flow with teaching and celebration.
 */
export default function SessionScreen() {
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{
          backgroundColor: isDark
            ? "rgba(167,139,250,0.15)"
            : "rgba(108,92,231,0.1)",
        }}
      >
        <Text className="text-4xl">🐻</Text>
      </View>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Learning Session
      </Text>
      <Text
        className="text-base text-center mb-1"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Node: {nodeId}
      </Text>
      <Text
        className="text-sm text-center mb-8"
        style={{ color: isDark ? "#64748b" : "#B2BEC3" }}
      >
        The adaptive learning session with two-step answer flow will be
        implemented in Phase 6.
      </Text>

      <Pressable
        onPress={() => router.back()}
        className="px-6 py-3 rounded-xl active:opacity-80"
        style={{
          backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
        }}
      >
        <Text
          className="font-semibold"
          style={{ color: isDark ? "#a78bfa" : "#6C5CE7" }}
        >
          ← Back to Dashboard
        </Text>
      </Pressable>
    </View>
  );
}
