/**
 * Activity Log — timeline of child learning events.
 *
 * - Timestamped entries with event icons
 * - Pull-to-refresh
 * - Load more pagination
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";

import { useTheme } from "../../lib/theme";
import { useAuthStore } from "../../store/auth";
import { getActivityLog } from "@aauti/api-client";
import type { ActivityLogEntry } from "@aauti/api-client";

// Event type → icon mapping
// Prisma enum uses UPPER_CASE; include both forms for safety.
const EVENT_ICONS: Record<string, string> = {
  // Prisma enum values (what the API actually returns)
  SESSION_STARTED: "\uD83D\uDCDA",
  SESSION_COMPLETED: "\u2705",
  CONCEPT_MASTERED: "\u2B50",
  GRADE_COMPLETED: "\uD83C\uDF93",
  GRADE_ADVANCED: "\uD83D\uDE80",
  LEVEL_UP: "\uD83C\uDF1F",
  BADGE_EARNED: "\uD83C\uDFC5",
  STREAK_MILESTONE: "\uD83D\uDD25",
  FLUENCY_DRILL_COMPLETED: "\u26A1",
  DIAGNOSTIC_COMPLETED: "\uD83E\uDDE0",
  QUESTION_ANSWERED: "\u2753",
  SUBJECT_SWITCHED: "\uD83D\uDD04",
  TOPIC_SELECTED: "\uD83D\uDCCC",
  TEST_OUT_PASSED: "\uD83C\uDFC6",
  // Legacy lowercase aliases
  session_start: "\uD83D\uDCDA",
  session_end: "\u2705",
  mastery: "\u2B50",
  grade_completed: "\uD83C\uDF93",
  level_up: "\uD83C\uDF1F",
  badge_earned: "\uD83C\uDFC5",
  streak: "\uD83D\uDD25",
  fluency: "\u26A1",
  diagnostic: "\uD83E\uDDE0",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { parentProfile, selectedChildId } = useAuthStore();

  const parentId = parentProfile?.parentId ?? "";
  const childId = selectedChildId ?? parentProfile?.children[0]?.id ?? "";

  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!append) setLoading(true);
      setError(null);

      try {
        const res = await getActivityLog(parentId, childId, pageNum, 20);
        if (append) {
          setActivities((prev) => [...prev, ...res.activities]);
        } else {
          setActivities(res.activities);
        }
        setHasMore(res.activities.length >= 20);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load activity"
        );
      } finally {
        setLoading(false);
      }
    },
    [parentId, childId]
  );

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchActivities(1);
    setRefreshing(false);
  }, [fetchActivities]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  }, [hasMore, loading, page, fetchActivities]);

  const renderItem = useCallback(
    ({ item }: { item: ActivityLogEntry }) => {
      const icon = EVENT_ICONS[item.eventType] || "\uD83D\uDD35";
      const isGradeComplete =
        item.eventType === "GRADE_COMPLETED" ||
        item.eventType === "grade_completed";

      return (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 12,
          }}
        >
          {/* Timeline dot */}
          <View style={{ alignItems: "center", width: 36 }}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <View
              style={{
                flex: 1,
                width: 2,
                backgroundColor: colors.border,
                marginTop: 4,
              }}
            />
          </View>

          {/* Content */}
          <View
            style={{
              flex: 1,
              backgroundColor: isGradeComplete ? "#FEF3C7" : colors.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: isGradeComplete ? 2 : 1,
              borderColor: isGradeComplete ? "#FCD34D" : colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isGradeComplete ? "800" : "600",
                  color: isGradeComplete ? "#92400E" : colors.text,
                  flex: 1,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  marginLeft: 8,
                }}
              >
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
            {item.detail && (
              <Text
                style={{
                  fontSize: 13,
                  color: isGradeComplete ? "#B45309" : colors.textSecondary,
                  lineHeight: 19,
                }}
              >
                {item.detail}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [colors]
  );

  const keyExtractor = useCallback(
    (item: ActivityLogEntry) => item.id,
    []
  );

  if (loading && activities.length === 0) {
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
      {error && (
        <View
          style={{
            backgroundColor: colors.errorLight,
            padding: 12,
            marginHorizontal: 16,
            marginTop: 8,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.error }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={activities}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {"\uD83D\uDCCB"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No activity yet.{"\n"}Learning events will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore && activities.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
