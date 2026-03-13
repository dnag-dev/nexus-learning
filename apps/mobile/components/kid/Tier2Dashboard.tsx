/**
 * Tier 2 Dashboard (G4-G7) — stats, subject tabs, mission card.
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../lib/theme";
import { SubjectTabs, XPBadge, StreakBadge, MasteryBar, Card } from "../ui";
import type { GradeProgress, RecentTopic } from "../../hooks/useDashboard";

interface Tier2DashboardProps {
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
  gradeProgress?: GradeProgress[];
  recentTopics?: RecentTopic[];
}

export function Tier2Dashboard({
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
  gradeProgress = [],
  recentTopics = [],
}: Tier2DashboardProps) {
  const { colors } = useTheme();

  const masteryPercent =
    totalCount > 0 ? Math.round((masteryCount / totalCount) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Header with name + badges */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{ fontSize: 22, fontWeight: "700", color: colors.text }}
          >
            Hey {displayName}! 🎯
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            Level {level} — {levelTitle}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {streak > 0 && <StreakBadge streak={streak} size="sm" />}
          <XPBadge xp={xp} size="sm" />
        </View>
      </View>

      {/* Subject tabs */}
      <SubjectTabs selected={subject} onSelect={onSubjectChange} />

      {/* Today's Mission */}
      {nextConcept && (
        <Pressable
          onPress={() => router.push(`/(kid)/session/${nextConcept.nodeCode || nextConcept.nodeId}`)}
          style={{ marginTop: 16 }}
        >
          <Card padding="lg">
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600", marginBottom: 4 }}>
              TODAY'S MISSION
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 6,
              }}
            >
              {nextConcept.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {nextConcept.gradeLevel === "K"
                  ? "Kindergarten"
                  : `Grade ${nextConcept.gradeLevel}`}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {nextConcept.domain}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#ffffff" }}>
                Start Mission 🚀
              </Text>
            </View>
          </Card>
        </Pressable>
      )}

      {/* Grade mastery progress */}
      <View style={{ marginTop: 16 }}>
        <Card>
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {subject === "math" ? "🔢 MATH" : "📖 ENGLISH"} MASTERY
          </Text>
          <MasteryBar
            progress={masteryPercent}
            goal={0}
            showLabel={false}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text,
              marginTop: 8,
            }}
          >
            {masteryCount} / {totalCount} concepts mastered
          </Text>
        </Card>
      </View>

      {/* Grade progress breakdown */}
      {gradeProgress.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Card>
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              GRADE PROGRESS
            </Text>
            {gradeProgress.map((gp) => {
              const pct = gp.total > 0 ? Math.round((gp.mastered / gp.total) * 100) : 0;
              const gradeLabel = gp.grade === "K" ? "K" : gp.grade;
              return (
                <View key={gp.grade} style={{ marginBottom: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                      {gradeLabel}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {gp.mastered}/{gp.total}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.surfaceAlt,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? colors.success : colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* Recent activity */}
      {recentTopics.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Card>
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              RECENTLY PRACTICED
            </Text>
            {recentTopics.map((topic, idx) => {
              const pct = Math.round(topic.bktProbability * 100);
              const isMastered = pct >= 85;
              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 6,
                    borderBottomWidth: idx < recentTopics.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 10 }}>
                    {isMastered ? "⭐" : "📘"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: colors.text }}
                      numberOfLines={1}
                    >
                      {topic.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {topic.gradeLevel === "K" ? "Kindergarten" : `Grade ${topic.gradeLevel}`}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isMastered ? colors.success : colors.primary,
                    }}
                  >
                    {pct}%
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* Quick links */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <Pressable
          onPress={() => router.push("/(kid)/topic-tree")}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 28, marginBottom: 6 }}>🗺️</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Topics
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(kid)/fluency-zone")}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 28, marginBottom: 6 }}>⚡</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Speed Drill
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
