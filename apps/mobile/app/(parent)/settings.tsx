/**
 * Parent Settings — account info, notifications, and logout.
 */

import { View, Text, Pressable, SafeAreaView, ScrollView } from "react-native";
import { router } from "expo-router";

import { useTheme } from "../../lib/theme";

export default function SettingsScreen() {
  const { colors } = useTheme();

  const handleLogout = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account section */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Account
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <SettingsRow
            label="Profile"
            detail="Manage your account"
            colors={colors}
          />
          <Divider color={colors.border} />
          <SettingsRow
            label="Children"
            detail="Add or manage children"
            colors={colors}
          />
          <Divider color={colors.border} />
          <SettingsRow
            label="Subscription"
            detail="Free plan"
            colors={colors}
          />
        </View>

        {/* Notifications */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Notifications
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <SettingsRow
            label="Daily Reminders"
            detail="Enabled"
            colors={colors}
          />
          <Divider color={colors.border} />
          <SettingsRow
            label="Progress Alerts"
            detail="Enabled"
            colors={colors}
          />
          <Divider color={colors.border} />
          <SettingsRow
            label="Streak Warnings"
            detail="Enabled"
            colors={colors}
          />
        </View>

        {/* About */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          About
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            marginBottom: 32,
          }}
        >
          <SettingsRow label="Version" detail="1.0.0" colors={colors} />
          <Divider color={colors.border} />
          <SettingsRow label="Privacy Policy" detail="" colors={colors} />
          <Divider color={colors.border} />
          <SettingsRow label="Terms of Service" detail="" colors={colors} />
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            backgroundColor: colors.errorLight,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.error,
            }}
          >
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Settings Row ───

function SettingsRow({
  label,
  detail,
  colors,
}: {
  label: string;
  detail: string;
  colors: { text: string; textMuted: string };
}) {
  return (
    <Pressable
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: 15, color: colors.text }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{detail}</Text>
    </Pressable>
  );
}

// ─── Divider ───

function Divider({ color }: { color: string }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: color,
        marginHorizontal: 16,
      }}
    />
  );
}
