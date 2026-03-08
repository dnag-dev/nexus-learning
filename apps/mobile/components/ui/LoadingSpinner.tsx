import { View, ActivityIndicator, Text } from "react-native";
import { useTheme } from "../../lib/theme";

interface LoadingSpinnerProps {
  /** Optional message below spinner */
  message?: string;
  /** Fill the entire container */
  fullScreen?: boolean;
  size?: "small" | "large";
}

export function LoadingSpinner({
  message,
  fullScreen = true,
  size = "large",
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: fullScreen ? colors.background : "transparent",
      }}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            color: colors.textSecondary,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
