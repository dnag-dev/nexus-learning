import { View, ViewProps } from "react-native";
import { useTheme } from "../../lib/theme";

interface ThemedViewProps extends ViewProps {
  /** Use surface color instead of background */
  surface?: boolean;
  /** Use alternative surface color */
  surfaceAlt?: boolean;
}

export function ThemedView({
  style,
  surface,
  surfaceAlt,
  ...props
}: ThemedViewProps) {
  const { colors } = useTheme();

  const bg = surfaceAlt
    ? colors.surfaceAlt
    : surface
      ? colors.surface
      : colors.background;

  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
