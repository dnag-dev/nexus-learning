/**
 * Tier 2 Dashboard (G4-G7) — stats, subject tabs, mission card.
 */

import { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../lib/theme";
import { SubjectTabs, XPBadge, StreakBadge, MasteryBar, Card } from "../ui";
import type { GradeProgress, RecentTopic } from "../../hooks/useDashboard";

const GRADE_ORDER = ["K","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","G11","G12"];

function fullGradeName(g: string): string {
  if (g === "K") return "Kindergarten";
  const num = g.replace("G", "");
  return `Grade ${num}`;
}

function barColor(mastered: number, total: number): string {
  if (total === 0) return "#E2E8F0";
  const ratio = mastered / total;
  if (ratio === 1) return "#3DB54A";      // 100% — green
  if (ratio >= 0.5) return "#1CB0F6";     // 50%+ — blue
  if (ratio > 0) return "#7C3AED";        // started — purple
  return "#E2E8F0";                        // 0% — grey
}

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

  // Find the student's active grade (highest with some progress but not complete)
  const activeGrade = useMemo(() => {
    let active: GradeProgress | null = null;
    for (const gp of gradeProgress) {
      if (gp.total > 0 && gp.mastered < gp.total) active = gp;
    }
    // Fallback: first grade with any content
    if (!active && gradeProgress.length > 0) active = gradeProgress[0];
    return active;
  }, [gradeProgress]);

  // Grade progress: show only current grade ± 1 (3 rows max)
  const visibleGrades = useMemo(() => {
    if (!activeGrade) return gradeProgress.slice(0, 3);
    const idx = GRADE_ORDER.indexOf(activeGrade.grade);
    if (idx < 0) return gradeProgress.slice(0, 3);
    const minIdx = Math.max(0, idx - 1);
    const maxIdx = idx + 1;
    return gradeProgress.filter((gp) => {
      const gi = GRADE_ORDER.indexOf(gp.grade);
      return gi >= minIdx && gi <= maxIdx;
    });
  }, [gradeProgress, activeGrade]);

  // Summary text: "Grade 5 Math — 4/17 topics"
  const summaryText = activeGrade
    ? `${fullGradeName(activeGrade.grade)} ${subject === "math" ? "Math" : "English"} — ${activeGrade.mastered}/${activeGrade.total} topics`
    : `${masteryCount} / ${totalCount} concepts mastered`;

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
        <Pressable onPress={() => router.push("/(kid)/(tabs)/profile")} style={{ flexDirection: "row", gap: 8 }}>
          {streak > 0 && <StreakBadge streak={streak} size="sm" />}
          <XPBadge xp={xp} size="sm" />
        </Pressable>
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
              numberOfLines={1}
            >
              {nextConcept.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {nextConcept.gradeLevel === "K"
                  ? "Kindergarten"
                  : `Grade ${nextConcept.gradeLevel}`}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>·</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {subject === "math" ? "Math" : "English"}
              </Text>
            </View>
            {totalCount > 0 && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                {masteryCount}/{totalCount} topics done this grade
              </Text>
            )}
            <View style={{ marginBottom: 12 }} />
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
          <Pressable onPress={() => router.push("/(kid)/topic-tree")}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginTop: 8,
              }}
            >
              {summaryText}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* Grade completion banner */}
      {(() => {
        const completedGrades = gradeProgress.filter(
          (gp) => gp.total > 0 && gp.mastered >= gp.total
        );
        if (completedGrades.length === 0) return null;
        const latest = completedGrades[completedGrades.length - 1];
        const gradeLabel = fullGradeName(latest.grade);
        const subjectLabel = subject === "math" ? "Math" : "English";
        return (
          <Pressable
            onPress={() => router.push("/(kid)/topic-tree")}
            style={{ marginTop: 16 }}
          >
            <Card padding="lg">
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>{"\uD83C\uDF93"}</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#92400E",
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  {gradeLabel} {subjectLabel} — Complete!
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#B45309",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  All {latest.total} topics mastered
                  {completedGrades.length > 1
                    ? ` (+${completedGrades.length - 1} more grade${completedGrades.length > 2 ? "s" : ""})`
                    : ""}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })()}

      {/* Grade progress breakdown — show current grade ± 1 */}
      {visibleGrades.length > 0 && (
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
            {visibleGrades.map((gp) => {
              const pct = gp.total > 0 ? Math.round((gp.mastered / gp.total) * 100) : 0;
              const label = fullGradeName(gp.grade);
              const isComplete = gp.total > 0 && gp.mastered >= gp.total;
              const bColor = barColor(gp.mastered, gp.total);
              return (
                <View key={gp.grade} style={{ marginBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                        {label}
                      </Text>
                      {isComplete && (
                        <Text style={{ fontSize: 11 }}>{"\uD83C\uDF93"}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: bColor }}>
                      {gp.mastered}/{gp.total}
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
                        width: `${pct}%`,
                        backgroundColor: bColor,
                        borderRadius: 4,
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
                    {isMastered ? "\u2B50" : "\uD83D\uDCD8"}
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
          <Text style={{ fontSize: 28, marginBottom: 6 }}>{"\uD83D\uDDFA\uFE0F"}</Text>
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
          <Text style={{ fontSize: 28, marginBottom: 6 }}>{"\u26A1"}</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Speed Drill
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
