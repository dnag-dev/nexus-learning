import { View, Text, Pressable, ScrollView } from "react-native";
import { Link } from "expo-router";

interface DashboardCardProps {
  emoji: string;
  title: string;
  description: string;
  href?: string;
}

function DashboardCard({ emoji, title, description }: DashboardCardProps) {
  return (
    <Pressable className="bg-white rounded-2xl p-5 border border-gray-100 active:bg-gray-50">
      <Text className="text-3xl mb-2">{emoji}</Text>
      <Text className="font-semibold text-base text-aauti-text-primary mb-1">
        {title}
      </Text>
      <Text className="text-sm text-aauti-text-secondary">{description}</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-aauti-bg-light">
      <View className="px-5 pt-4 pb-8">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-aauti-text-primary">
            Welcome back!
          </Text>
          <Text className="text-aauti-text-secondary mt-1">
            Your learning adventure continues here.
          </Text>
        </View>

        <View className="gap-4">
          <Link href="/session" asChild>
            <DashboardCard
              emoji="⭐"
              title="Start a Session"
              description="Begin an adaptive learning session with Cosmo and friends."
            />
          </Link>

          <Link href="/constellation" asChild>
            <DashboardCard
              emoji="🌌"
              title="Constellation Map"
              description="View your knowledge graph and mastery progress."
            />
          </Link>

          <DashboardCard
            emoji="📊"
            title="Weekly Report"
            description="Read this week's personalized narrative from the AI tutor."
          />

          <DashboardCard
            emoji="🏆"
            title="Boss Challenge"
            description="Test your knowledge in this week's boss battle!"
          />

          <DashboardCard
            emoji="🔥"
            title="Streaks"
            description="Keep your mastery streak alive!"
          />
        </View>
      </View>
    </ScrollView>
  );
}
