/**
 * Kid tab layout — bottom navigation for the student experience.
 *
 * Tabs: Home, Topics, Fluency, Profile
 * Session screen hidden from tab bar (accessed via navigation)
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useTheme } from "../../lib/theme";

export default function KidTabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 85,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          headerTitle: "Aauti Learn",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {"\uD83C\uDFE0"}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="topic-tree"
        options={{
          title: "Topics",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {"\uD83D\uDDFA\uFE0F"}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="fluency-zone"
        options={{
          title: "Fluency",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {"\u26A1"}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {"\uD83D\uDC64"}
            </Text>
          ),
        }}
      />
      {/* Hide session from tab bar — accessed via deep link or navigation */}
      <Tabs.Screen
        name="session/[nodeId]"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
