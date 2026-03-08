import { View, Text, useColorScheme } from "react-native";

/**
 * Reports — stub for Phase 9.
 * Will show grade progress, mastery breakdown charts, and export.
 */
export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <Text className="text-5xl mb-4">📈</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Progress Reports
      </Text>
      <Text
        className="text-base text-center"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Detailed progress reports and mastery breakdowns will be displayed here
        in Phase 9.
      </Text>
    </View>
  );
}
