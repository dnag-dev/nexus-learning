/**
 * Teaching card — shown before questions to teach the concept.
 *
 * Displays a static teaching explanation fetched from the session.
 * Future: stream via SSE for animated reveal.
 */

import { View, Text, ScrollView, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface TeachingCardProps {
  nodeTitle: string;
  teachingText: string | null;
  onDismiss: () => void;
}

export function TeachingCard({
  nodeTitle,
  teachingText,
  onDismiss,
}: TeachingCardProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 32 }}>📖</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.primary,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Let&apos;s Learn
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {nodeTitle}
            </Text>
          </View>
        </View>

        {/* Teaching content */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {teachingText ? (
            <Text
              style={{
                fontSize: 15,
                lineHeight: 24,
                color: colors.text,
              }}
            >
              {teachingText}
            </Text>
          ) : (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🤔</Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Loading teaching content...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 32,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            I understand &mdash; Let&apos;s Practice! &rarr;
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
