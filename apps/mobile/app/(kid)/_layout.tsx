/**
 * Kid layout — Stack navigator wrapping tabs + session screen.
 *
 * The session screen is a full-screen Stack push (outside the tab bar),
 * so it gets proper safe area handling without tab bar interference.
 */

import { Stack } from "expo-router";

export default function KidLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="session/[nodeId]"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
