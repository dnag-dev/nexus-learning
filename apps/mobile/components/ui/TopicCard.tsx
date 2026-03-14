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
    {
      icon: string;
      borderColor: string;
      opacity: number;
      bgColor: string;
      barColor: string;
      statusText?: string;
    }
  > = {
    locked: {
      icon: "\uD83D\uDD12",       // lock
      borderColor: colors.border,
      opacity: 0.4,
      bgColor: colors.surfaceAlt,
      barColor: colors.border,
    },
    available: {
      icon: "\u25B6\uFE0F",       // play
      borderColor: colors.accent,
      opacity: 1,
      bgColor: colors.surface,
      barColor: colors.accent,
      statusText: "Tap to start",
    },
    in_progress: {
      icon: "\uD83D\uDD04",       // refresh
      borderColor: colors.primary,
      opacity: 1,
      bgColor: colors.surface,
      barColor: colors.primary,
    },
    mastered: {
      icon: "\u2705",             // checkmark
      borderColor: colors.success,
      opacity: 1,
      bgColor: colors.surface,
      barColor: colors.success,
    },
  };

  const config = stateConfig[state];
  const barPercent =
    state === "mastered" ? 100 : state === "locked" ? 0 : masteryPercent;
  const bare = gradeLevel.startsWith("G")
    ? gradeLevel.slice(1)
    : gradeLevel;

  return (
    <Pressable
      onPress={state !== "locked" ? onPress : undefined}
      disabled={state === "locked"}
      style={({ pressed }) => ({
        backgroundColor: config.bgColor,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: config.borderColor,
        opacity: pressed ? 0.8 : config.opacity,
        overflow: "hidden",
      })}
    >
      {/* Row wrapper — use View (not Pressable) for reliable flexDirection */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        {/* Icon — inline with title */}
        <Text style={{ fontSize: 18, marginRight: 10 }}>{config.icon}</Text>

        {/* Name + domain + "Tap to start" — all in one column */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {domain && (
            <Text
              style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}
              numberOfLines={1}
            >
              {bare === "K" ? "Kindergarten" : `G${bare}`}
              {" \u00B7 "}
              {domain}
            </Text>
          )}
          {state === "available" && masteryPercent === 0 && (
            <Text
              style={{ fontSize: 11, fontWeight: "600", color: colors.primary, marginTop: 2 }}
            >
              {config.statusText}
            </Text>
          )}
        </View>

        {/* Right side: % + mini bar */}
        {state !== "locked" && !(state === "available" && masteryPercent === 0) ? (
          <View style={{ alignItems: "flex-end", marginLeft: 8, width: 48 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: config.barColor,
              }}
            >
              {Math.round(masteryPercent)}%
            </Text>
            {/* Mini progress bar */}
            <View
              style={{
                width: 40,
                height: 3,
                backgroundColor: colors.surfaceAlt,
                borderRadius: 1.5,
                overflow: "hidden",
                marginTop: 3,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${barPercent}%`,
                  backgroundColor: config.barColor,
                  borderRadius: 1.5,
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
