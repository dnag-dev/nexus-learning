/**
 * Parent API Client — Dashboard, activity, reports.
 */

import { apiGet } from "./client";

// ─── Types ───

export interface ParentOverviewResponse {
  children: Array<{
    id: string;
    displayName: string;
    avatarPersonaId: string;
    gradeLevel: string;
    xp: number;
    level: number;
    streak: number;
    sessionsThisWeek: number;
    masteredThisWeek: number;
    lastActiveAt: string | null;
    practicedToday: boolean;
  }>;
  insights: Array<{
    type: string;
    title: string;
    message: string;
  }>;
}

export interface ActivityLogEntry {
  id: string;
  eventType: string;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChildProgressResponse {
  masteredCount: number;
  totalNodes: number;
  accuracy: number;
  sessionsThisWeek: number;
  timeThisWeek: number;
  streakCurrent: number;
  recentSessions: Array<{
    id: string;
    nodeTitle: string;
    date: string;
    duration: number;
    accuracy: number;
    mastered: boolean;
  }>;
}

// ─── API Functions ───

/**
 * Get parent dashboard overview.
 */
export async function getOverview(
  parentId: string
): Promise<ParentOverviewResponse> {
  return apiGet<ParentOverviewResponse>(
    `/api/parent/${parentId}/overview`
  );
}

/**
 * Get activity log for a child.
 */
export async function getActivityLog(
  parentId: string,
  childId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ActivityLogResponse> {
  return apiGet<ActivityLogResponse>(
    `/api/parent/${parentId}/child/${childId}/activity-log?page=${page}&pageSize=${pageSize}`
  );
}

/**
 * Get child progress data.
 */
export async function getChildProgress(
  parentId: string,
  childId: string
): Promise<ChildProgressResponse> {
  return apiGet<ChildProgressResponse>(
    `/api/parent/${parentId}/child/${childId}/progress`
  );
}

/**
 * Get list of all children.
 */
export async function getChildren(): Promise<{
  children: Array<{
    id: string;
    displayName: string;
    avatarPersonaId: string;
    gradeLevel: string;
  }>;
}> {
  return apiGet("/api/parent/children");
}
