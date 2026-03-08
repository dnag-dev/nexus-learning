import { Tabs } from "expo-router";
import { useColorScheme, Text } from "react-native";

export default function ParentTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#060d1f" : "#F8F9FA",
        },
        headerTintColor: isDark ? "#06b6d4" : "#00CEC9",
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0c1628" : "#FFFFFF",
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
          borderTopWidth: 1,
          paddingTop: 4,
          height: 85,
        },
        tabBarActiveTintColor: isDark ? "#06b6d4" : "#00CEC9",
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
          title: "Overview",
          headerTitle: "Parent Dashboard",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
