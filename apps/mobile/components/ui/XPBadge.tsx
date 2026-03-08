import { View, Text } from "react-native";
import { useTheme } from "../../lib/theme";

interface XPBadgeProps {
  xp: number;
  size?: "sm" | "md" | "lg";
}

export function XPBadge({ xp, size = "md" }: XPBadgeProps) {
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
        backgroundColor: colors.xpLight,
        borderRadius: 20,
        paddingVertical: s.padding,
        paddingHorizontal: s.paddingH,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: s.icon }}>⭐</Text>
      <Text
        style={{
          fontSize: s.fontSize,
          fontWeight: "700",
          color: colors.xp,
        }}
      >
        {xp.toLocaleString()} XP
      </Text>
    </View>
  );
}
