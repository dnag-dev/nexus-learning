import { View, Text, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";

interface MasteryBarProps {
  /** 0 to 100 */
  progress: number;
  /** Goal line percentage (e.g. 85) */
  goal?: number;
  /** Height of bar */
  height?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Override color */
  color?: string;
  /** Estimation text (e.g. "~3 more questions") */
  estimate?: string;
}

export function MasteryBar({
  progress,
  goal = 85,
  height = 8,
  showLabel = true,
  color,
  estimate,
}: MasteryBarProps) {
  const { colors } = useTheme();

  const clampedProgress = Math.min(100, Math.max(0, progress));

  const progressColor =
    color ||
    (clampedProgress >= goal
      ? colors.success
      : clampedProgress >= 50
        ? colors.primary
        : colors.warning);

  return (
    <View>
      {showLabel && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: progressColor }}>
            {Math.round(clampedProgress)}%
          </Text>
          {goal > 0 && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {goal}% goal
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          height,
          backgroundColor: colors.border,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${clampedProgress}%`,
            backgroundColor: progressColor,
            borderRadius: height / 2,
          } as ViewStyle}
        />
        {/* Goal marker */}
        {goal > 0 && goal < 100 && (
          <View
            style={{
              position: "absolute",
              left: `${goal}%`,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: colors.textMuted,
              opacity: 0.5,
            } as ViewStyle}
          />
        )}
      </View>
      {estimate && (
        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
            marginTop: 4,
          }}
        >
          {estimate}
        </Text>
      )}
    </View>
  );
}
