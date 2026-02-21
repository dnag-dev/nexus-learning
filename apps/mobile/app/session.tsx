import { View, Text } from "react-native";

export default function SessionScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-aauti-bg-light px-6">
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-aauti-primary/10 items-center justify-center mb-4">
          <Text className="text-4xl">🐻</Text>
        </View>
        <Text className="text-2xl font-bold text-aauti-text-primary mb-2">
          Meet Cosmo
        </Text>
        <Text className="text-base text-aauti-text-secondary text-center">
          Your AI tutor is getting ready. The adaptive learning session will
          begin here.
        </Text>
      </View>
    </View>
  );
}
