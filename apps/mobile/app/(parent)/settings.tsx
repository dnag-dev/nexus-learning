import { View, Text, Pressable, useColorScheme } from "react-native";
import { router } from "expo-router";

/**
 * Parent Settings — stub for Phase 9.
 * Will handle account info, child management, notifications, subscription.
 */
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <Text className="text-5xl mb-4">⚙️</Text>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        Settings
      </Text>
      <Text
        className="text-base text-center mb-8"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Account settings, child management, and notification preferences will
        appear here in Phase 9.
      </Text>

      <Pressable
        onPress={() => router.replace("/")}
        className="px-6 py-3 rounded-xl active:opacity-80"
        style={{
          backgroundColor: isDark
            ? "rgba(248,113,113,0.15)"
            : "rgba(214,48,49,0.1)",
        }}
      >
        <Text
          className="font-semibold"
          style={{ color: isDark ? "#f87171" : "#D63031" }}
        >
          Log Out
        </Text>
      </Pressable>
    </View>
  );
}
