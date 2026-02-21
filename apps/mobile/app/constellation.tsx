import { View, Text } from "react-native";

export default function ConstellationScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-aauti-bg-dark px-6">
      <View className="items-center">
        <Text className="text-5xl mb-4">🌌</Text>
        <Text className="text-2xl font-bold text-white mb-2">
          Constellation Map
        </Text>
        <Text className="text-base text-aauti-text-muted text-center">
          Your knowledge galaxy will render here. Each star is a concept you can
          master.
        </Text>
      </View>
    </View>
  );
}
