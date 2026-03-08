import { View, Text, useColorScheme } from "react-native";

/**
 * Fluency Zone — stub for Phase 8.
 * Will show topic picker, timer, and speed-tapping drill.
 */
export default function FluencyZoneScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <Text className="text-5xl mb-4">⚡</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Fluency Zone
      </Text>
      <Text
        className="text-base text-center"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Speed practice drills to build math and reading automaticity. Pick a
        topic and race against the clock!
      </Text>
    </View>
  );
}
