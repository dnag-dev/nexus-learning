/**
 * Kid Profile — XP, level, badges, streak, and learning stats.
 *
 * Fetches real data from the gamification API and displays
 * the student's progress in a visually engaging layout.
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useTheme } from "../../../lib/theme";
import { useAuthStore } from "../../../store/auth";
import { getGamification } from "@aauti/api-client";
import type { GamificationResponse } from "@aauti/api-client";

// Badge category icons
const BADGE_ICONS: Record<string, string> = {
  mastery: "\u2B50",
  streak: "\uD83D\uDD25",
  speed: "\u26A1",
  accuracy: "\uD83C\uDFAF",
  milestone: "\uD83C\uDFC6",
  session: "\uD83D\uDCDA",
  level: "\uD83C\uDF1F",
  default: "\uD83C\uDFC5",
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  const [data, setData] = useState<GamificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.studentId) return;
    setError(null);
    try {
      const res = await getGamification(profile.studentId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [profile?.studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/");
  }, [logout]);

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const xp = data?.xp ?? profile?.xp ?? 0;
  const level = data?.level ?? profile?.level ?? 1;
  const streakData = data?.streak;
  const streak = streakData?.current ?? 0;
  const longestStreak = streakData?.longest ?? streak;
  const levelTitle = data?.title ?? "Star Seeker";
  const badges = data?.badges ?? [];
  const xpProgress = data?.xpProgress ?? 0;
  const xpForNext = data?.xpForNext ?? 100;
  const masteryNodes = data?.masteryMap ?? [];
  const masteredCount = masteryNodes.filter(
    (n) => n.level === "MASTERED" || n.bktProbability >= 0.85
  ).length;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
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

        {/* Profile header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 40 }}>
              {profile?.avatarPersonaId === "cosmo"
                ? "\uD83D\uDE80"
                : "\uD83E\uDDD1\u200D\uD83C\uDF93"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {profile?.displayName ?? "Learner"}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {levelTitle}
          </Text>
          {profile?.gradeLevel && (
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              Grade {profile.gradeLevel}
            </Text>
          )}
        </View>

        {/* XP Level Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={{ fontSize: 22 }}>{"\u26A1"}</Text>
              <View>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: colors.xp,
                  }}
                >
                  {xp.toLocaleString()} XP
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  Level {level}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: colors.primaryLight,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                Lv.{level}
              </Text>
            </View>
          </View>

          {/* XP progress bar */}
          <View
            style={{
              height: 8,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width:
                  xpForNext > 0
                    ? `${Math.min((xpProgress / xpForNext) * 100, 100)}%`
                    : "0%",
                backgroundColor: colors.xp,
                borderRadius: 4,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 11,
              color: colors.textMuted,
              marginTop: 6,
              textAlign: "right",
            }}
          >
            {xpProgress}/{xpForNext} XP to next level
          </Text>
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <StatCard
            icon={"\uD83D\uDD25"}
            value={`${streak}`}
            label="Day Streak"
            sublabel={`Best: ${longestStreak}`}
            colors={colors}
          />
          <StatCard
            icon={"\u2B50"}
            value={`${masteredCount}`}
            label="Mastered"
            sublabel="concepts"
            colors={colors}
          />
        </View>

        {/* Badges */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 12,
            marginBottom: 10,
          }}
        >
          Badges ({badges.length})
        </Text>

        {badges.length > 0 ? (
          <View style={{ gap: 8, marginBottom: 24 }}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.gold + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>
                    {badge.icon ?? BADGE_ICONS[badge.category] ?? BADGE_ICONS.default}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: colors.text,
                      marginBottom: 2,
                    }}
                  >
                    {badge.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      lineHeight: 17,
                    }}
                  >
                    {badge.description}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
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
            <Text style={{ fontSize: 40, marginBottom: 8 }}>
              {"\uD83C\uDFC5"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No badges yet.{"\n"}Keep learning to earn your first badge!
            </Text>
          </View>
        )}

        {/* Mastery overview */}
        {masteryNodes.length > 0 && (
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
              Learning Progress
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
                    fontSize: 20,
                    fontWeight: "800",
                    color: colors.success,
                  }}
                >
                  {masteredCount}/{masteryNodes.length}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textMuted,
                    alignSelf: "flex-end",
                  }}
                >
                  concepts mastered
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width:
                      masteryNodes.length > 0
                        ? `${Math.round(
                            (masteredCount / masteryNodes.length) * 100
                          )}%`
                        : "0%",
                    backgroundColor: colors.success,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          </>
        )}

        {/* Log out */}
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

        {/* Version */}
        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Aauti Learn v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card ───

function StatCard({
  icon,
  value,
  label,
  sublabel,
  colors,
}: {
  icon: string;
  value: string;
  label: string;
  sublabel: string;
  colors: {
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    surfaceAlt: string;
  };
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 4 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: colors.text,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: "600" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{sublabel}</Text>
    </View>
  );
}
