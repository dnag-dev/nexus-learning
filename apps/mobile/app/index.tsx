import { View, Text, Pressable, useColorScheme } from "react-native";
import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../store/auth";

export default function LandingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const profile = useAuthStore((s) => s.profile);
  const isParent = useAuthStore((s) => s.isParent);

  // Auto-redirect authenticated users to their dashboard
  if (profile) {
    const href = isParent
      ? "/(parent)/dashboard"
      : "/(kid)/dashboard";
    return <Redirect href={href} />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo / branding */}
        <View className="items-center mb-10">
          <View
            className="w-28 h-28 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: isDark
                ? "rgba(167,139,250,0.15)"
                : "rgba(108,92,231,0.1)",
            }}
          >
            <Text className="text-6xl">⭐</Text>
          </View>
          <Text
            className="text-4xl font-bold mb-3"
            style={{ color: isDark ? "#ffffff" : "#2D3436" }}
          >
            Aauti Learn
          </Text>
          <Text
            className="text-lg text-center leading-7"
            style={{ color: isDark ? "#94a3b8" : "#636E72" }}
          >
            AI-powered adaptive tutoring that meets every child exactly where
            they are.
          </Text>
        </View>

        {/* Role selection */}
        <View className="w-full gap-4">
          <Link href="/kid-login" asChild>
            <Pressable
              className="w-full items-center justify-center py-4 rounded-2xl active:opacity-80"
              style={{
                backgroundColor: isDark ? "#a78bfa" : "#6C5CE7",
              }}
            >
              <Text className="text-lg font-semibold text-white">
                I'm a Kid 🚀
              </Text>
            </Pressable>
          </Link>

          <Link href="/parent-login" asChild>
            <Pressable
              className="w-full items-center justify-center py-4 rounded-2xl active:opacity-80"
              style={{
                backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.08)",
              }}
            >
              <Text
                className="text-lg font-semibold"
                style={{ color: isDark ? "#ffffff" : "#2D3436" }}
              >
                I'm a Parent 👨‍👩‍👧
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Stats */}
        <View className="flex-row mt-12 gap-8">
          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: isDark ? "#a78bfa" : "#6C5CE7" }}
            >
              K-12
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isDark ? "#64748b" : "#636E72" }}
            >
              Grade Range
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: isDark ? "#06b6d4" : "#00CEC9" }}
            >
              100+
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isDark ? "#64748b" : "#636E72" }}
            >
              Standards
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="text-2xl font-bold"
              style={{ color: isDark ? "#f97316" : "#FDCB6E" }}
            >
              AI
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: isDark ? "#64748b" : "#636E72" }}
            >
              Adaptive
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
