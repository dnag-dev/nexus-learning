import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { getAgeTier } from "@aauti/utils";
import { useTheme } from "../../../lib/theme";
import { useAuthStore } from "../../../store/auth";
import { useDashboard } from "../../../hooks/useDashboard";
import { LoadingSpinner, ErrorBanner } from "../../../components/ui";
import { Tier1Dashboard } from "../../../components/kid/Tier1Dashboard";
import { Tier2Dashboard } from "../../../components/kid/Tier2Dashboard";
import { Tier3Dashboard } from "../../../components/kid/Tier3Dashboard";

export default function KidDashboardScreen() {
  const { colors } = useTheme();
  const { profile } = useAuthStore();
  const dashboard = useDashboard(profile?.studentId ?? null);

  // Determine age tier from grade level
  const gradeLevel = profile?.gradeLevel ?? "4";
  const tier = getAgeTier(gradeLevel);

  if (dashboard.loading && !dashboard.xp) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (dashboard.error && !dashboard.xp) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <ErrorBanner message={dashboard.error} />
        <Pressable
          onPress={dashboard.refresh}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "600" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = profile?.displayName ?? "Learner";

  // Tier 1: K-G3 — big, simple, friendly
  if (tier === "TIER_1") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Tier1Dashboard
          displayName={displayName}
          xp={dashboard.xp}
          streak={dashboard.streak}
          nextNodeId={dashboard.nextConcept?.nodeId}
        />
      </View>
    );
  }

  // Tier 3: G8-G12 — clean, minimal, stats-focused
  if (tier === "TIER_3") {
    return (
      <Tier3Dashboard
        displayName={displayName}
        xp={dashboard.xp}
        level={dashboard.level}
        streak={dashboard.streak}
        levelTitle={dashboard.levelTitle}
        subject={dashboard.subject}
        onSubjectChange={dashboard.setSubject}
        nextConcept={dashboard.nextConcept}
        masteryCount={dashboard.masteryCount}
        totalCount={dashboard.totalCount}
      />
    );
  }

  // Tier 2: G4-G7 — default (most students)
  return (
    <Tier2Dashboard
      displayName={displayName}
      xp={dashboard.xp}
      level={dashboard.level}
      streak={dashboard.streak}
      levelTitle={dashboard.levelTitle}
      subject={dashboard.subject}
      onSubjectChange={dashboard.setSubject}
      nextConcept={dashboard.nextConcept}
      masteryCount={dashboard.masteryCount}
      totalCount={dashboard.totalCount}
    />
  );
}
