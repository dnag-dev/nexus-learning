import { View, Text, Pressable, useColorScheme } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth";

/**
 * Kid Profile — shows XP, level, badges, streak.
 * Will be fully built out in Phase 5 alongside the dashboard.
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const logout = useAuthStore((s) => s.logout);

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: isDark ? "#060d1f" : "#F8F9FA" }}
    >
      <View
        className="w-24 h-24 rounded-full items-center justify-center mb-6"
        style={{
          backgroundColor: isDark
            ? "rgba(167,139,250,0.15)"
            : "rgba(108,92,231,0.1)",
        }}
      >
        <Text className="text-5xl">👤</Text>
      </View>
      <Text
        className="text-2xl font-bold mb-2"
        style={{ color: isDark ? "#ffffff" : "#2D3436" }}
      >
        My Profile
      </Text>
      <Text
        className="text-base text-center mb-8"
        style={{ color: isDark ? "#94a3b8" : "#636E72" }}
      >
        Your badges, XP, and learning stats will appear here.
      </Text>

      <Pressable
        onPress={() => {
          logout();
          router.replace("/");
        }}
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
