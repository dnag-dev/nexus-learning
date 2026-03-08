import { View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../lib/theme";

interface CardProps extends ViewProps {
  /** Padding size */
  padding?: "sm" | "md" | "lg";
  /** Pressable-style card */
  elevated?: boolean;
}

export function Card({
  style,
  padding = "md",
  elevated = false,
  ...props
}: CardProps) {
  const { colors, isDark } = useTheme();

  const paddingMap = { sm: 12, md: 20, lg: 24 };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: paddingMap[padding],
    borderWidth: 1,
    borderColor: colors.border,
    ...(elevated && !isDark
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }
      : {}),
  };

  return <View style={[cardStyle, style]} {...props} />;
}
