/**
 * Push notifications — permission, token registration, local scheduling.
 *
 * - Requests permission on first login
 * - Gets Expo push token
 * - Registers token with backend
 * - Schedules local reminders (daily practice, streak protection)
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiPost } from "@aauti/api-client";

// ─── Configuration ───

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permission + Token ───

/**
 * Request notification permissions and get Expo push token.
 * Returns token string or null if denied/unavailable.
 */
export async function requestPushToken(): Promise<string | null> {
  // Only works on physical device
  if (!Device.isDevice) {
    // Push notifications require a physical device — silently skip on simulator
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    // Permission denied — silently return null
    return null;
  }

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6C5CE7",
    });
  }

  // Get token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Will use EAS project ID from app.json
    });
    return tokenData.data;
  } catch (err) {
    console.error("Failed to get push token:", err);
    return null;
  }
}

/**
 * Register push token with the backend.
 */
export async function registerPushToken(
  token: string,
  userId: string,
  userType: "student" | "parent"
): Promise<void> {
  try {
    await apiPost("/api/notifications/register", {
      token,
      userId,
      userType,
      platform: Platform.OS,
    });
  } catch (err) {
    console.error("Failed to register push token:", err);
  }
}

// ─── Local Notifications ───

/**
 * Schedule daily practice reminder at a given hour.
 * Default: 4:00 PM.
 */
export async function scheduleDailyReminder(hour: number = 16): Promise<void> {
  // Cancel existing daily reminders first
  await cancelScheduledNotifications("daily-reminder");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to learn! \uD83C\uDF1F",
      body: "Jump in for a quick practice session and keep your streak going!",
      data: { type: "daily-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

/**
 * Schedule streak protection reminder.
 * Fires at 7 PM if the student hasn't practiced.
 */
export async function scheduleStreakReminder(): Promise<void> {
  await cancelScheduledNotifications("streak-reminder");

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't break your streak! \uD83D\uDD25",
      body: "You haven't practiced today. A quick session will keep your streak alive!",
      data: { type: "streak-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
}

/**
 * Send immediate local notification (e.g., mastery celebration).
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // Immediate
  });
}

// ─── Helpers ───

/**
 * Cancel scheduled notifications by type.
 */
async function cancelScheduledNotifications(type: string): Promise<void> {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count.
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
