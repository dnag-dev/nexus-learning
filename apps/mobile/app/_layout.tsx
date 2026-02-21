import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8F9FA" },
          headerTintColor: "#6C5CE7",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#F8F9FA" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="dashboard"
          options={{ title: "Aauti Learn", headerBackVisible: false }}
        />
        <Stack.Screen name="session" options={{ title: "Learning Session" }} />
        <Stack.Screen
          name="constellation"
          options={{ title: "Constellation Map" }}
        />
      </Stack>
    </>
  );
}
