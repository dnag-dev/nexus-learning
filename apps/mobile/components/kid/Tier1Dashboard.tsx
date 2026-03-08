/**
 * Tier 1 Dashboard (K-G3) — simple, friendly, minimal stats.
 * Big Cosmo character, one big action button.
 */

import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../lib/theme";

interface Tier1DashboardProps {
  displayName: string;
  xp: number;
  streak: number;
  nextNodeId?: string;
}

export function Tier1Dashboard({
  displayName,
  xp,
  streak,
  nextNodeId,
}: Tier1DashboardProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      {/* Big friendly Cosmo */}
      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 80 }}>🐻</Text>
      </View>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Hi {displayName}! 👋
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Ready to learn something awesome?
      </Text>

      {/* Streak + XP mini display */}
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {streak > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.warningLight,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.warning }}>
              {streak}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: colors.xpLight,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 20 }}>⭐</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.xp }}>
            {xp} XP
          </Text>
        </View>
      </View>

      {/* Big action button */}
      <Pressable
        onPress={() =>
          router.push(
            nextNodeId
              ? `/(kid)/session/${nextNodeId}`
              : "/(kid)/session/next"
          )
        }
        style={({ pressed }) => ({
          width: "100%",
          paddingVertical: 20,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#ffffff" }}>
          Let's Go! 🚀
        </Text>
      </Pressable>
    </View>
  );
}
