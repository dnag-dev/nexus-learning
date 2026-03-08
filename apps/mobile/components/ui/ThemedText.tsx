import { Text, TextProps } from "react-native";
import { useTheme } from "../../lib/theme";

interface ThemedTextProps extends TextProps {
  /** Text color variant */
  variant?: "primary" | "secondary" | "muted" | "error" | "success" | "accent";
}

export function ThemedText({
  style,
  variant = "primary",
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme();

  const colorMap: Record<string, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    error: colors.error,
    success: colors.success,
    accent: colors.accent,
  };

  return <Text style={[{ color: colorMap[variant] }, style]} {...props} />;
}
