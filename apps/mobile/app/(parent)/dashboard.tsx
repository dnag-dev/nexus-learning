/**
 * Parent Dashboard — overview of children's learning progress.
 *
 * - Child cards with stats (sessions, mastery, streak)
 * - Status badges (practiced today / not yet)
 * - Insights section
 * - Pull-to-refresh
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { useTheme } from "../../lib/theme";
import { getOverview } from "@aauti/api-client";
import type { ParentOverviewResponse } from "@aauti/api-client";

export default function ParentDashboardScreen() {
  const { colors } = useTheme();

  // Parent auth not yet implemented — using demo data
  // When parent auth is added, parentId will come from auth store
  const parentId = "demo-parent-1";

  const [data, setData] = useState<ParentOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await getOverview(parentId);
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load overview"
      );
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const children = data?.children ?? [];
  const insights = data?.insights ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Error */}
        {error && (
          <View
            style={{
              backgroundColor: colors.errorLight,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.error }}>{error}</Text>
          </View>
        )}

        {/* Children cards */}
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
          Your Children
        </Text>

        {children.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 8 }}>👶</Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No children linked yet.{"\n"}Add a child from the web dashboard.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 24 }}>
            {children.map((child) => (
              <View
                key={child.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: colors.accentLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {child.avatarPersonaId === "cosmo" ? "\uD83D\uDE80" : "\uD83E\uDDD1\u200D\uD83C\uDF93"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {child.displayName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Grade {child.gradeLevel} {"\u00B7"} Level {child.level}
                    </Text>
                  </View>
                  {/* Status badge */}
                  <View
                    style={{
                      backgroundColor: child.practicedToday
                        ? colors.successLight
                        : colors.warningLight,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: child.practicedToday
                          ? colors.success
                          : colors.warning,
                      }}
                    >
                      {child.practicedToday ? "Practiced" : "Not yet"}
                    </Text>
                  </View>
                </View>

                {/* Stats row */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <StatItem
                    label="Streak"
                    value={`${child.streak}`}
                    icon={"\uD83D\uDD25"}
                    colors={colors}
                  />
                  <StatItem
                    label="Sessions"
                    value={`${child.sessionsThisWeek}`}
                    icon={"\uD83D\uDCDA"}
                    colors={colors}
                  />
                  <StatItem
                    label="Mastered"
                    value={`${child.masteredThisWeek}`}
                    icon={"\u2B50"}
                    colors={colors}
                  />
                  <StatItem
                    label="XP"
                    value={`${child.xp}`}
                    icon={"\u26A1"}
                    colors={colors}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <>
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
              Insights
            </Text>
            <View style={{ gap: 10 }}>
              {insights.map((insight, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>
                    {insight.type === "celebration"
                      ? "\uD83C\uDF89"
                      : insight.type === "warning"
                        ? "\u26A0\uFE0F"
                        : "\uD83D\uDCA1"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {insight.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        lineHeight: 19,
                      }}
                    >
                      {insight.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Item ───

function StatItem({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  colors: { text: string; textMuted: string };
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
