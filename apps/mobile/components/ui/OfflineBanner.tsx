/**
 * Offline banner — shows when the device is offline or has queued answers.
 */

import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface OfflineBannerProps {
  isOnline: boolean;
  queueSize: number;
  onSync?: () => void;
}

export function OfflineBanner({
  isOnline,
  queueSize,
  onSync,
}: OfflineBannerProps) {
  const { colors } = useTheme();

  if (isOnline && queueSize === 0) return null;

  return (
    <View
      style={{
        backgroundColor: isOnline ? colors.warningLight : colors.errorLight,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
        <Text style={{ fontSize: 14 }}>
          {isOnline ? "\uD83D\uDD04" : "\uD83D\uDCF5"}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: isOnline ? colors.warning : colors.error,
            flex: 1,
          }}
        >
          {isOnline
            ? `${queueSize} answer${queueSize !== 1 ? "s" : ""} saved — syncing...`
            : "You're offline — answers will sync later"}
        </Text>
      </View>
      {isOnline && queueSize > 0 && onSync && (
        <Pressable
          onPress={onSync}
          style={({ pressed }) => ({
            backgroundColor: colors.warning,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 5,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            Sync Now
          </Text>
        </Pressable>
      )}
    </View>
  );
}
