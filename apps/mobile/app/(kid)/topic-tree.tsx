import { View, Text, useColorScheme } from "react-native";

/**
 * Topic Tree — stub for Phase 7.
 * Will display all knowledge nodes grouped by grade with mastery states.
 */
export default function TopicTreeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <Text className="text-5xl mb-4">🗺️</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Topic Tree
      </Text>
      <Text
        className="text-base text-center"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Your knowledge map will appear here. Each node is a concept you can
        explore and master.
      </Text>
    </View>
  );
}
