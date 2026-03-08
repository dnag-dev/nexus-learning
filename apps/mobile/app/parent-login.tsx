import { View, Text, Pressable, useColorScheme } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Parent login screen — stub for Phase 9 (parent dashboard).
 * Will be replaced with Auth0 PKCE flow or email/password auth.
 */
export default function ParentLoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: isDark
              ? "rgba(6,182,212,0.15)"
              : "rgba(0,206,201,0.1)",
          }}
        >
          <Text className="text-5xl">👨‍👩‍👧</Text>
        </View>

        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: isDark ? "#ffffff" : "#2D3436" }}
        >
          Parent Login
        </Text>
        <Text
          className="text-base text-center mb-8"
          style={{ color: isDark ? "#94a3b8" : "#636E72" }}
        >
          Sign in to view your child's progress and manage their learning.
        </Text>

        {/* Placeholder — will be replaced in Phase 9 */}
        <View
          className="w-full rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
          }}
        >
          <Text
            className="text-sm text-center"
            style={{ color: isDark ? "#64748b" : "#636E72" }}
          >
            Parent auth will be implemented in Phase 9.{"\n"}
            For now, tap below to preview the dashboard.
          </Text>
        </View>

        <Link href="/(parent)/dashboard" asChild>
          <Pressable
            className="w-full items-center justify-center py-4 rounded-2xl active:opacity-80"
            style={{ backgroundColor: isDark ? "#06b6d4" : "#00CEC9" }}
          >
            <Text className="text-lg font-semibold text-white">
              Go to Parent Dashboard →
            </Text>
          </Pressable>
        </Link>

        <Link href="/" asChild>
          <Pressable className="mt-4 py-2">
            <Text
              className="text-sm"
              style={{ color: isDark ? "#a78bfa" : "#6C5CE7" }}
            >
              ← Back
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
