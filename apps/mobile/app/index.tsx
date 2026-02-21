import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-aauti-bg-light px-6">
      <View className="items-center mb-10">
        <View className="w-24 h-24 rounded-full bg-aauti-primary/10 items-center justify-center mb-6">
          <Text className="text-5xl">⭐</Text>
        </View>
        <Text className="text-4xl font-bold text-aauti-text-primary mb-3">
          Aauti Learn
        </Text>
        <Text className="text-lg text-aauti-text-secondary text-center leading-7">
          AI-powered adaptive tutoring that meets every child exactly where they
          are.
        </Text>
      </View>

      <View className="w-full gap-4">
        <Link href="/dashboard" asChild>
          <Pressable className="w-full items-center justify-center py-4 bg-aauti-primary rounded-2xl active:bg-aauti-primary/80">
            <Text className="text-lg font-semibold text-white">
              Get Started
            </Text>
          </Pressable>
        </Link>

        <Link href="/dashboard" asChild>
          <Pressable className="w-full items-center justify-center py-4 bg-white border border-gray-200 rounded-2xl active:bg-gray-50">
            <Text className="text-lg font-semibold text-aauti-text-primary">
              Sign In
            </Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row mt-12 gap-8">
        <View className="items-center">
          <Text className="text-2xl font-bold text-aauti-primary">K-5</Text>
          <Text className="text-xs text-aauti-text-secondary mt-1">
            Grade Range
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-aauti-secondary">20+</Text>
          <Text className="text-xs text-aauti-text-secondary mt-1">
            Standards
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-aauti-accent">6</Text>
          <Text className="text-xs text-aauti-text-secondary mt-1">
            AI Tutors
          </Text>
        </View>
      </View>
    </View>
  );
}
