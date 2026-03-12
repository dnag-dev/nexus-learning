/**
 * Parent Login — coming soon screen with web dashboard link.
 *
 * Parent auth requires Auth0 PKCE flow which is planned for
 * a future release. For now, directs parents to the web dashboard.
 */

import { View, Text, Pressable, Linking } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../lib/theme";

const WEB_DASHBOARD_URL = "https://nexus-learning-dnag.vercel.app";

export default function ParentLoginScreen() {
  const { colors } = useTheme();

  const openWebDashboard = () => {
    Linking.openURL(WEB_DASHBOARD_URL);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.accentLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 48 }}>{"\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67"}</Text>
        </View>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 8,
          }}
        >
          Parent Dashboard
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Track your child's learning progress, view activity logs, and get
          detailed reports.
        </Text>

        {/* Info card */}
        <View
          style={{
            width: "100%",
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 20 }}>{"\uD83D\uDCBB"}</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Use the Web Dashboard
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            The parent dashboard is currently available on our website.
            Mobile parent login is coming in a future update.
          </Text>
        </View>

        {/* Web dashboard button */}
        <Pressable
          onPress={openWebDashboard}
          style={({ pressed }) => ({
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
            marginBottom: 12,
          })}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#ffffff",
            }}
          >
            Open Web Dashboard
          </Text>
        </Pressable>

        {/* Back */}
        <Link href="/" asChild>
          <Pressable
            style={({ pressed }) => ({
              paddingVertical: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                color: colors.primary,
                fontWeight: "600",
              }}
            >
              {"\u2190"} Back
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
