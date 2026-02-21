/**
 * Review Notifications — Phase 8: Spaced Repetition
 *
 * In-app notification system for due reviews.
 * Creates and manages notifications for review reminders,
 * streak warnings, badge awards, and level ups.
 */

import { prisma } from "@aauti/db";
import { getDueNodes, getUpcomingReviews, addDays } from "./scheduler";

// ─── Types ───

export interface DueReviewSummary {
  dueNow: number;
  dueTomorrow: number;
  dueThisWeek: number;
  overdueCount: number;
  estimatedMinutes: number;
  urgency: "none" | "low" | "medium" | "high";
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

// ─── Constants ───

const MINUTES_PER_NODE = 2;
const NOTIFICATION_EXPIRY_DAYS = 7;

// ─── Due Review Summary ───

/**
 * Get a summary of due reviews for a student.
 * Used by the dashboard widget to show urgency.
 */
export async function getDueReviewSummary(
  studentId: string,
  now?: Date
): Promise<DueReviewSummary> {
  const currentTime = now ?? new Date();
  const tomorrow = addDays(currentTime, 1);
  const weekEnd = addDays(currentTime, 7);

  // Get all mastery scores with due dates
  const allDue = await prisma.masteryScore.findMany({
    where: {
      studentId,
      nextReviewAt: { lte: weekEnd },
      practiceCount: { gte: 1 },
    },
    select: {
      nextReviewAt: true,
    },
  });

  const todayStr = currentTime.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const oneDayAgo = addDays(currentTime, -1);

  let dueNow = 0;
  let dueTomorrow = 0;
  let dueThisWeek = 0;
  let overdueCount = 0;

  for (const score of allDue) {
    if (!score.nextReviewAt) continue;

    const reviewDate = score.nextReviewAt.toISOString().split("T")[0];

    if (score.nextReviewAt <= oneDayAgo) {
      overdueCount++;
      dueNow++;
    } else if (reviewDate <= todayStr) {
      dueNow++;
    } else if (reviewDate === tomorrowStr) {
      dueTomorrow++;
    }
    dueThisWeek++;
  }

  // Determine urgency
  let urgency: DueReviewSummary["urgency"] = "none";
  if (overdueCount > 0) urgency = "high";
  else if (dueNow > 0) urgency = "medium";
  else if (dueTomorrow > 0) urgency = "low";

  return {
    dueNow,
    dueTomorrow,
    dueThisWeek,
    overdueCount,
    estimatedMinutes: dueNow * MINUTES_PER_NODE,
    urgency,
  };
}

// ─── Create Notifications ───

/**
 * Create a review reminder notification.
 * Called when due nodes exist and no recent reminder was sent.
 */
export async function createReviewReminder(
  studentId: string,
  now?: Date
): Promise<NotificationData | null> {
  const currentTime = now ?? new Date();

  // Check if we already sent a reminder today
  const todayStart = new Date(currentTime);
  todayStart.setHours(0, 0, 0, 0);

  const existingToday = await prisma.notification.findFirst({
    where: {
      studentId,
      type: "REVIEW_DUE",
      createdAt: { gte: todayStart },
    },
  });

  if (existingToday) return null; // Already reminded today

  // Get due count
  const dueNodes = await getDueNodes(studentId, currentTime);
  if (dueNodes.length === 0) return null;

  const overdueCount = dueNodes.filter((n) => {
    if (!n.nextReviewAt) return false;
    const oneDayAgo = addDays(currentTime, -1);
    return n.nextReviewAt < oneDayAgo;
  }).length;

  const title = overdueCount > 0
    ? `${overdueCount} overdue review${overdueCount > 1 ? "s" : ""}!`
    : `${dueNodes.length} node${dueNodes.length > 1 ? "s" : ""} ready for review`;

  const message = overdueCount > 0
    ? `You have ${overdueCount} overdue and ${dueNodes.length - overdueCount} due reviews. A quick review helps lock in your knowledge!`
    : `${dueNodes.length} concept${dueNodes.length > 1 ? "s need" : " needs"} a review to stay fresh. It'll only take about ${dueNodes.length * MINUTES_PER_NODE} minutes!`;

  const notification = await prisma.notification.create({
    data: {
      studentId,
      type: "REVIEW_DUE",
      title,
      message,
      expiresAt: addDays(currentTime, NOTIFICATION_EXPIRY_DAYS),
    },
  });

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt,
  };
}

/**
 * Mark a notification as read.
 */
export async function markNotificationSeen(
  notificationId: string
): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Get unread notifications for a student.
 */
export async function getUnreadNotifications(
  studentId: string,
  now?: Date
): Promise<NotificationData[]> {
  const currentTime = now ?? new Date();

  const notifications = await prisma.notification.findMany({
    where: {
      studentId,
      read: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: currentTime } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
    expiresAt: n.expiresAt,
  }));
}
