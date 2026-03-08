import { View, Text, useColorScheme } from "react-native";

/**
 * Parent Dashboard — stub for Phase 9.
 * Will show child cards with stats, insights, and quick actions.
 */
export default function ParentDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <Text className="text-5xl mb-4">📊</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Parent Overview
      </Text>
      <Text
        className="text-base text-center"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Your children's progress, sessions, and achievements will be displayed
        here in Phase 9.
      </Text>
    </View>
  );
}
