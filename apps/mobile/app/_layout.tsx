import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? "#060d1f" : "#F8F9FA",
          },
          headerTintColor: isDark ? "#a78bfa" : "#6C5CE7",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: {
            backgroundColor: isDark ? "#060d1f" : "#F8F9FA",
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="kid-login" options={{ headerShown: false }} />
        <Stack.Screen name="parent-login" options={{ headerShown: false }} />
        <Stack.Screen name="(kid)" options={{ headerShown: false }} />
        <Stack.Screen name="(parent)" options={{ headerShown: false }} />
        <Stack.Screen name="diagnostic" options={{ title: "Placement Test" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
