import { View, Text, Pressable, ScrollView, useColorScheme } from "react-native";
import { Link } from "expo-router";

/**
 * Kid Dashboard — stub for Phase 5 (age-tiered dashboard).
 * Will show gamification stats, next concept, and age-appropriate layout.
 */
export default function KidDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <View className="px-5 pt-4 pb-8">
        {/* Welcome header */}
        <View className="mb-6">
          <Text
            className="text-2xl font-bold"
            style={{ color: isDark ? "#ffffff" : "#2D3436" }}
          >
            Welcome back! ⭐
          </Text>
          <Text
            className="mt-1"
            style={{ color: isDark ? "#94a3b8" : "#636E72" }}
          >
            Your learning adventure continues here.
          </Text>
        </View>

        {/* Quick stats row */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <Text className="text-2xl">🔥</Text>
            <Text
              className="text-xl font-bold mt-1"
              style={{ color: isDark ? "#f97316" : "#E17055" }}
            >
              0
            </Text>
            <Text
              className="text-xs"
              style={{ color: isDark ? "#64748b" : "#B2BEC3" }}
            >
              Streak
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <Text className="text-2xl">⭐</Text>
            <Text
              className="text-xl font-bold mt-1"
              style={{ color: isDark ? "#f97316" : "#FDCB6E" }}
            >
              0 XP
            </Text>
            <Text
              className="text-xs"
              style={{ color: isDark ? "#64748b" : "#B2BEC3" }}
            >
              Total
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{
              backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.05)",
            }}
          >
            <Text className="text-2xl">🎯</Text>
            <Text
              className="text-xl font-bold mt-1"
              style={{ color: isDark ? "#34d399" : "#00B894" }}
            >
              0
            </Text>
            <Text
              className="text-xs"
              style={{ color: isDark ? "#64748b" : "#B2BEC3" }}
            >
              Mastered
            </Text>
          </View>
        </View>

        {/* Action cards */}
        <View className="gap-4">
          <Link href="/(kid)/session/next" asChild>
            <Pressable
              className="rounded-2xl p-5 active:opacity-80"
              style={{
                backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <Text className="text-3xl mb-2">🚀</Text>
              <Text
                className="font-semibold text-base mb-1"
                style={{ color: isDark ? "#ffffff" : "#2D3436" }}
              >
                Start Learning
              </Text>
              <Text
                className="text-sm"
                style={{ color: isDark ? "#94a3b8" : "#636E72" }}
              >
                Jump into your next adaptive learning session.
              </Text>
            </Pressable>
          </Link>

          <Link href="/(kid)/topic-tree" asChild>
            <Pressable
              className="rounded-2xl p-5 active:opacity-80"
              style={{
                backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <Text className="text-3xl mb-2">🗺️</Text>
              <Text
                className="font-semibold text-base mb-1"
                style={{ color: isDark ? "#ffffff" : "#2D3436" }}
              >
                Topic Tree
              </Text>
              <Text
                className="text-sm"
                style={{ color: isDark ? "#94a3b8" : "#636E72" }}
              >
                Explore all topics and see your mastery progress.
              </Text>
            </Pressable>
          </Link>

          <Link href="/(kid)/fluency-zone" asChild>
            <Pressable
              className="rounded-2xl p-5 active:opacity-80"
              style={{
                backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <Text className="text-3xl mb-2">⚡</Text>
              <Text
                className="font-semibold text-base mb-1"
                style={{ color: isDark ? "#ffffff" : "#2D3436" }}
              >
                Fluency Zone
              </Text>
              <Text
                className="text-sm"
                style={{ color: isDark ? "#94a3b8" : "#636E72" }}
              >
                Speed practice to build automaticity.
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
