import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.errorLight,
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 16 }}>❌</Text>
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          color: colors.error,
          fontWeight: "500",
        }}
      >
        {message}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Text style={{ fontSize: 14, color: colors.error }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}
