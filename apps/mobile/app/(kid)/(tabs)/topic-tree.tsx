/**
 * Topic Tree — browse all concepts grouped by grade with mastery states.
 *
 * - Grade sections with progress bars (X/Y mastered)
 * - Completed grades collapsed by default with gold badge + "show N topics"
 * - Highest in-progress grade expanded by default
 * - TopicCard components per node (locked/available/in_progress/mastered)
 * - Haptic feedback on tap
 * - Subject tabs (Math/English)
 */

import { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../lib/theme";
import { useAuthStore } from "../../../store/auth";
import {
  useTopicTree,
  type GradeGroup,
  type TopicNode,
} from "../../../hooks/useTopicTree";
import { SubjectTabs } from "../../../components/ui/SubjectTabs";
import { TopicCard } from "../../../components/ui/TopicCard";
import { MasteryBar } from "../../../components/ui/MasteryBar";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ErrorBanner } from "../../../components/ui/ErrorBanner";

export default function TopicTreeScreen() {
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const {
    grades,
    totalNodes,
    totalMastered,
    loading,
    error,
    subject,
    setSubject,
    refresh,
  } = useTopicTree(profile?.studentId ?? null);

  const [refreshing, setRefreshing] = useState(false);

  // ─── Collapse state ───
  // Expanded set: grades NOT in this set are collapsed.
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());

  // Determine the "active" grade: highest grade that has at least one
  // in-progress or available node (and is not fully mastered).
  const activeGrade = useMemo(() => {
    let active: string | null = null;
    for (const g of grades) {
      const isComplete = g.total > 0 && g.mastered >= g.total;
      if (!isComplete && g.total > 0) {
        active = g.grade; // keep overwriting — last non-complete = highest
      }
    }
    return active;
  }, [grades]);

  // Re-compute expanded set whenever grades or subject changes:
  // - Completed grades: collapsed
  // - Active grade: expanded
  // - Others: expanded
  useEffect(() => {
    const expanded = new Set<string>();
    for (const g of grades) {
      const isComplete = g.total > 0 && g.mastered >= g.total;
      if (!isComplete) {
        expanded.add(g.grade);
      }
    }
    // Always expand active grade
    if (activeGrade) expanded.add(activeGrade);
    setExpandedGrades(expanded);
  }, [grades, activeGrade, subject]);

  const toggleGrade = useCallback((grade: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }, [refresh]);

  const handleNodePress = useCallback((node: TopicNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (node.state === "locked") {
      const prereqText =
        node.prerequisiteNames.length > 0
          ? `Complete "${node.prerequisiteNames[0]}" first`
          : "Complete prerequisites first";
      Alert.alert("Locked", prereqText);
      return;
    }

    router.push(`/(kid)/session/${node.nodeCode}`);
  }, []);

  // ─── Loading ───
  if (loading && grades.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: colors.text,
              }}
            >
              Topic Tree
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {totalMastered}/{totalNodes} concepts mastered
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.successLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colors.success,
              }}
            >
              {totalNodes > 0
                ? Math.round((totalMastered / totalNodes) * 100)
                : 0}
              %
            </Text>
          </View>
        </View>

        <SubjectTabs
          selected={subject}
          onSelect={(s) => setSubject(s as "math" | "english")}
        />
      </View>

      {/* Error */}
      {error && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <ErrorBanner message={error} />
        </View>
      )}

      {/* Topic list */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {grades.length === 0 && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {"\uD83D\uDDFA\uFE0F"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No topics found for {subject === "math" ? "Math" : "English"}.
              {"\n"}Check back later!
            </Text>
          </View>
        )}

        {grades.map((group) => {
          const isComplete = group.total > 0 && group.mastered >= group.total;
          const isExpanded = expandedGrades.has(group.grade);
          const pct =
            group.total > 0
              ? Math.round((group.mastered / group.total) * 100)
              : 0;

          return (
            <View key={group.grade}>
              {/* ─── Section header ─── */}
              <Pressable
                onPress={() => toggleGrade(group.grade)}
                style={{
                  backgroundColor: colors.background,
                  paddingHorizontal: 16,
                  paddingTop: 20,
                  paddingBottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {group.label}
                    </Text>
                    {isComplete ? (
                      <View
                        style={{
                          backgroundColor: "#FEF3C7",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11 }}>
                          {"\u2713"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#92400E",
                          }}
                        >
                          Complete!
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: colors.textMuted,
                        }}
                      >
                        {group.mastered}/{group.total} mastered
                      </Text>
                    )}
                  </View>
                  {/* Chevron */}
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </Text>
                </View>
                <MasteryBar
                  progress={pct}
                  goal={0}
                  height={6}
                  showLabel={false}
                />
              </Pressable>

              {/* ─── Collapsed hint ─── */}
              {!isExpanded && (
                <Pressable
                  onPress={() => toggleGrade(group.grade)}
                  style={{
                    paddingHorizontal: 16,
                    paddingBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.primary,
                      fontWeight: "600",
                    }}
                  >
                    show {group.total} topics {"\u25BE"}
                  </Text>
                </Pressable>
              )}

              {/* ─── Nodes ─── */}
              {isExpanded &&
                group.nodes.map((node) => (
                  <View
                    key={node.id || node.nodeCode}
                    style={{ paddingHorizontal: 16, paddingVertical: 4 }}
                  >
                    <TopicCard
                      title={node.title}
                      gradeLevel={node.gradeLevel}
                      domain={node.domain}
                      state={node.state}
                      masteryPercent={node.masteryPercent}
                      onPress={() => handleNodePress(node)}
                    />
                  </View>
                ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
