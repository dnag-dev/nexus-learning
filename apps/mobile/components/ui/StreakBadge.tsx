import { View, Text } from "react-native";
import { useTheme } from "../../lib/theme";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { fontSize: 12, padding: 4, paddingH: 8, icon: 14 },
    md: { fontSize: 14, padding: 6, paddingH: 12, icon: 16 },
    lg: { fontSize: 18, padding: 8, paddingH: 16, icon: 20 },
  };

  const s = sizeStyles[size];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.warningLight,
        borderRadius: 20,
        paddingVertical: s.padding,
        paddingHorizontal: s.paddingH,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: s.icon }}>🔥</Text>
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: "700",
          color: colors.warning,
        }}
      >
        {streak}
      </Text>
    </View>
  );
}
