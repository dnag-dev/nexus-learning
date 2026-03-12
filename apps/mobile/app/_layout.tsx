import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "../lib/theme";
import { useAuthStore } from "../store/auth";
import { ErrorBoundary } from "../components/ErrorBoundary";

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { isRestoring, restoreSession } = useAuthStore();

  // Restore session on app launch
  useEffect(() => {
    restoreSession();
  }, []);

  // Show splash while restoring session
  if (isRestoring) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: {
            backgroundColor: colors.background,
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
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
        <AppNavigator />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
