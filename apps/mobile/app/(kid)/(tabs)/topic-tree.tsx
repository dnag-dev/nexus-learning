/**
 * Topic Tree — browse all concepts grouped by grade with mastery states.
 *
 * - Grade sections with progress bars (X/Y mastered)
 * - TopicCard components per node (locked/available/in_progress/mastered)
 * - Haptic feedback on tap
 * - Subject tabs (Math/English)
 * - Locked tap shows prerequisite toast
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../lib/theme";
import { useAuthStore } from "../../../store/auth";
import { useTopicTree, type GradeGroup, type TopicNode } from "../../../hooks/useTopicTree";
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    // Brief delay so the spinner is visible
    setTimeout(() => setRefreshing(false), 600);
  }, [refresh]);

  const handleNodePress = useCallback(
    (node: TopicNode) => {
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
    },
    []
  );

  // Convert grades to SectionList format
  const sections = grades.map((group) => ({
    title: group.label,
    grade: group.grade,
    mastered: group.mastered,
    total: group.total,
    data: group.nodes,
  }));

  // ─── Section header ───
  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: {
        title: string;
        grade: string;
        mastered: number;
        total: number;
      };
    }) => (
      <View
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
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {section.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.textMuted,
            }}
          >
            {section.mastered}/{section.total} mastered
          </Text>
        </View>
        <MasteryBar
          progress={
            section.total > 0
              ? Math.round((section.mastered / section.total) * 100)
              : 0
          }
          goal={0}
          height={6}
          showLabel={false}
        />
      </View>
    ),
    [colors]
  );

  // ─── Item renderer ───
  const renderItem = useCallback(
    ({ item }: { item: TopicNode }) => (
      <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <TopicCard
          title={item.title}
          gradeLevel={item.gradeLevel}
          domain={item.domain}
          state={item.state}
          masteryPercent={item.masteryPercent}
          onPress={() => handleNodePress(item)}
        />
      </View>
    ),
    [handleNodePress]
  );

  const keyExtractor = useCallback(
    (item: TopicNode) => item.id || item.nodeCode,
    []
  );

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
        {/* Overall stats */}
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

        {/* Subject tabs */}
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
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
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
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
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
        }
      />
    </SafeAreaView>
  );
}
