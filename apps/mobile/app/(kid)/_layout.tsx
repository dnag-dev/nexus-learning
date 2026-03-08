import { Tabs } from "expo-router";
import { useColorScheme, Text } from "react-native";

export default function KidTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#060d1f" : "#F8F9FA",
        },
        headerTintColor: isDark ? "#a78bfa" : "#6C5CE7",
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
          borderTopWidth: 1,
          paddingTop: 4,
          height: 85,
        },
        tabBarActiveTintColor: isDark ? "#a78bfa" : "#6C5CE7",
        tabBarInactiveTintColor: isDark ? "#64748b" : "#B2BEC3",
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
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="topic-tree"
        options={{
          title: "Topics",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🗺️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="fluency-zone"
        options={{
          title: "Fluency",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>⚡</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>👤</Text>
          ),
        }}
      />
      {/* Hide session from tab bar — accessed via navigation */}
      <Tabs.Screen
        name="session/[nodeId]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
