/**
 * Tier 3 Dashboard (G8-G12) — clean, minimal, stats-focused.
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../lib/theme";
import { Card, XPBadge, StreakBadge, SubjectTabs, MasteryBar } from "../ui";

interface Tier3DashboardProps {
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  levelTitle: string;
  subject: "math" | "english";
  onSubjectChange: (s: "math" | "english") => void;
  nextConcept: {
    nodeId: string;
    nodeCode: string;
    title: string;
    gradeLevel: string;
    domain: string;
  } | null;
  masteryCount: number;
  totalCount: number;
}

export function Tier3Dashboard({
  displayName,
  xp,
  level,
  streak,
  levelTitle,
  subject,
  onSubjectChange,
  nextConcept,
  masteryCount,
  totalCount,
}: Tier3DashboardProps) {
  const { colors } = useTheme();

  const masteryPercent =
    totalCount > 0 ? Math.round((masteryCount / totalCount) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Compact header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            Lvl {level} · {levelTitle}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {streak > 0 && <StreakBadge streak={streak} size="sm" />}
          <XPBadge xp={xp} size="sm" />
        </View>
      </View>

      {/* Subject tabs */}
      <SubjectTabs selected={subject} onSelect={onSubjectChange} />

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.warning }}>
            {streak}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Streak</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.success }}>
            {masteryCount}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Mastered</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
            {masteryPercent}%
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Progress</Text>
        </View>
      </View>

      {/* Mastery progress bar */}
      <View style={{ marginTop: 16 }}>
        <Card padding="md">
          <MasteryBar
            progress={masteryPercent}
            goal={0}
            showLabel={false}
          />
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              marginTop: 6,
            }}
          >
            {masteryCount} / {totalCount} concepts mastered
          </Text>
        </Card>
      </View>

      {/* Continue learning */}
      {nextConcept && (
        <Pressable
          onPress={() => router.push(`/(kid)/session/${nextConcept.nodeId}`)}
          style={{ marginTop: 16 }}
        >
          <Card>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  CONTINUE
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {nextConcept.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {nextConcept.domain} · Grade {nextConcept.gradeLevel}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#ffffff" }}>
                  Start →
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}

      {/* Quick links */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable
          onPress={() => router.push("/(kid)/topic-tree")}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 20 }}>🗺️</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Topic Tree
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(kid)/fluency-zone")}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Fluency
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
