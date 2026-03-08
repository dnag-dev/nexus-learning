import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../lib/theme";

interface MasteryCircleProps {
  /** 0 to 100 */
  progress: number;
  /** Circle diameter */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Label inside the circle */
  label?: string;
  /** Override progress color */
  color?: string;
}

export function MasteryCircle({
  progress,
  size = 80,
  strokeWidth = 6,
  label,
  color,
}: MasteryCircleProps) {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress / 100);

  // Color based on progress
  const progressColor =
    color ||
    (clampedProgress >= 85
      ? colors.success
      : clampedProgress >= 50
        ? colors.primary
        : clampedProgress >= 25
          ? colors.warning
          : colors.textMuted);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text
          style={{
            fontSize: size * 0.22,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {label || `${Math.round(clampedProgress)}%`}
        </Text>
      </View>
    </View>
  );
}
