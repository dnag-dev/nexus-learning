import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../lib/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const isDisabled = disabled || loading;

  const bgColors: Record<string, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: "transparent",
    danger: colors.error,
  };

  const textColors: Record<string, string> = {
    primary: "#ffffff",
    secondary: colors.text,
    ghost: colors.primary,
    danger: "#ffffff",
  };

  const borderColors: Record<string, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: undefined,
    danger: undefined,
  };

  const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number }> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  const fontSizes: Record<string, number> = {
    sm: 13,
    md: 16,
    lg: 18,
  };

  const containerStyle: ViewStyle = {
    backgroundColor: bgColors[variant],
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    opacity: isDisabled ? 0.5 : 1,
    borderWidth: borderColors[variant] ? 1 : 0,
    borderColor: borderColors[variant],
    ...sizeStyles[size],
  };

  const labelStyle: TextStyle = {
    color: textColors[variant],
    fontSize: fontSizes[size],
    fontWeight: "600",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <>
          {icon && <Text style={{ fontSize: fontSizes[size] }}>{icon}</Text>}
          <Text style={labelStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
