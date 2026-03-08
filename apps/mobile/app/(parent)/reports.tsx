/**
 * Reports — child progress reports with mastery breakdown.
 *
 * - Grade progress per subject
 * - Recent sessions list
 * - Stats summary (accuracy, sessions, time)
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";

import { useTheme } from "../../lib/theme";
import { getChildProgress } from "@aauti/api-client";
import type { ChildProgressResponse } from "@aauti/api-client";
import { MasteryBar } from "../../components/ui/MasteryBar";

export default function ReportsScreen() {
  const { colors } = useTheme();

  // Mock IDs for now
  const parentId = "demo-parent";
  const childId = "demo-child";

  const [data, setData] = useState<ChildProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await getChildProgress(parentId, childId);
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  }, [parentId, childId]);

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

        {data ? (
          <>
            {/* Overview mastery */}
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
              Overall Progress
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: colors.success,
                  }}
                >
                  {data.masteredCount}/{data.totalNodes}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textMuted,
                    alignSelf: "flex-end",
                  }}
                >
                  concepts mastered
                </Text>
              </View>
              <MasteryBar
                progress={
                  data.totalNodes > 0
                    ? Math.round(
                        (data.masteredCount / data.totalNodes) * 100
                      )
                    : 0
                }
                goal={0}
                height={8}
                showLabel={false}
              />
            </View>

            {/* Stats grid */}
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
              This Week
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <StatCard
                label="Sessions"
                value={`${data.sessionsThisWeek}`}
                icon={"\uD83D\uDCDA"}
                colors={colors}
              />
              <StatCard
                label="Accuracy"
                value={`${Math.round(data.accuracy)}%`}
                icon={"\uD83C\uDFAF"}
                colors={colors}
              />
              <StatCard
                label="Streak"
                value={`${data.streakCurrent}`}
                icon={"\uD83D\uDD25"}
                colors={colors}
              />
            </View>

            {/* Recent sessions */}
            {data.recentSessions && data.recentSessions.length > 0 && (
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
                  Recent Sessions
                </Text>
                <View style={{ gap: 8 }}>
                  {data.recentSessions.map((session) => (
                    <View
                      key={session.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, marginRight: 12 }}>
                        {session.mastered ? "\u2B50" : "\uD83D\uDCDD"}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.text,
                            marginBottom: 2,
                          }}
                          numberOfLines={1}
                        >
                          {session.nodeTitle}
                        </Text>
                        <Text
                          style={{ fontSize: 11, color: colors.textMuted }}
                        >
                          {new Date(session.date).toLocaleDateString()}{" "}
                          {"\u00B7"} {Math.round(session.duration / 60)}min{" "}
                          {"\u00B7"} {Math.round(session.accuracy)}% accuracy
                        </Text>
                      </View>
                      {session.mastered && (
                        <View
                          style={{
                            backgroundColor: colors.successLight,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "600",
                              color: colors.success,
                            }}
                          >
                            MASTERED
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {"\uD83D\uDCC8"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No report data available yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card ───

function StatCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  colors: {
    surface: string;
    border: string;
    text: string;
    textMuted: string;
  };
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: colors.text,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
