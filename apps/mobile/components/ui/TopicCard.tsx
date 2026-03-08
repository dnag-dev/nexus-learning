import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

type TopicState = "locked" | "available" | "in_progress" | "mastered";

interface TopicCardProps {
  title: string;
  gradeLevel: string;
  domain?: string;
  state: TopicState;
  masteryPercent?: number;
  onPress?: () => void;
}

export function TopicCard({
  title,
  gradeLevel,
  domain,
  state,
  masteryPercent = 0,
  onPress,
}: TopicCardProps) {
  const { colors } = useTheme();

  const stateConfig: Record<
    TopicState,
    { icon: string; borderColor: string; opacity: number; bgColor: string }
  > = {
    locked: {
      icon: "🔒",
      borderColor: colors.border,
      opacity: 0.5,
      bgColor: colors.surfaceAlt,
    },
    available: {
      icon: "▶️",
      borderColor: colors.primary,
      opacity: 1,
      bgColor: colors.surface,
    },
    in_progress: {
      icon: "📝",
      borderColor: colors.accent,
      opacity: 1,
      bgColor: colors.surface,
    },
    mastered: {
      icon: "✅",
      borderColor: colors.success,
      opacity: 1,
      bgColor: colors.surface,
    },
  };

  const config = stateConfig[state];

  return (
    <Pressable
      onPress={state !== "locked" ? onPress : undefined}
      disabled={state === "locked"}
      style={({ pressed }) => ({
        backgroundColor: config.bgColor,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: config.borderColor,
        opacity: pressed ? 0.8 : config.opacity,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      })}
    >
      <Text style={{ fontSize: 24 }}>{config.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {gradeLevel === "K" ? "Kindergarten" : `Grade ${gradeLevel}`}
          </Text>
          {domain && (
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {domain}
            </Text>
          )}
        </View>
      </View>
      {state !== "locked" && masteryPercent > 0 && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color:
              masteryPercent >= 85
                ? colors.success
                : masteryPercent >= 50
                  ? colors.primary
                  : colors.textMuted,
          }}
        >
          {Math.round(masteryPercent)}%
        </Text>
      )}
    </Pressable>
  );
}
