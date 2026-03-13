/**
 * Student API Client — Profile, mastery, gamification.
 */

import { apiGet } from "./client";

// ─── Types ───

export interface GamificationResponse {
  xp: number;
  level: number;
  title: string;
  xpProgress: number;
  xpForNext: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    earnedAt: string;
  }>;
  masteryMap: Array<{
    nodeId: string;
    title: string;
    level: string;
    bktProbability: number;
    domain: string;
  }>;
}

export interface NextConceptResponse {
  nodeCode: string;
  nodeId: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  reason: string;
  estimatedMinutes: number;
  estimatedQuestions: number;
}

export interface MasteryMapNode {
  id: string;
  nodeCode: string;
  title: string;
  gradeLevel: string;
  domain: string;
  subject: string;
  difficulty: number;
  bktProbability: number;
  masteryLevel: string;
  isLocked: boolean;
  prerequisiteNames: string[];
}

export interface TopicTreeResponse {
  nodes: MasteryMapNode[];
  totalNodes: number;
  masteredCount: number;
}

// ─── API Functions ───

/**
 * Get gamification stats (XP, level, badges, streaks, mastery map).
 */
export async function getGamification(
  studentId: string
): Promise<GamificationResponse> {
  return apiGet<GamificationResponse>(
    `/api/student/${studentId}/gamification`
  );
}

/**
 * Get smart sequencer recommendation for next concept.
 */
export async function getNextConcept(
  studentId: string,
  subject?: "MATH" | "ENGLISH"
): Promise<NextConceptResponse> {
  const params = subject ? `?subject=${subject}` : "";
  return apiGet<NextConceptResponse>(
    `/api/student/${studentId}/next-concept${params}`
  );
}

/**
 * Get mastery map (all nodes with mastery overlay).
 */
export async function getMasteryMap(
  studentId: string,
  gradeLevel?: string
): Promise<TopicTreeResponse> {
  const params = gradeLevel ? `?gradeLevel=${gradeLevel}` : "";
  return apiGet<TopicTreeResponse>(
    `/api/student/${studentId}/mastery-map${params}`
  );
}

/**
 * Get topic tree for visualization.
 */
export async function getTopicTree(
  studentId: string
): Promise<TopicTreeResponse> {
  return apiGet<TopicTreeResponse>(
    `/api/student/${studentId}/topic-tree`
  );
}

/**
 * Get curriculum units.
 */
export async function getUnits(
  studentId: string
): Promise<unknown> {
  return apiGet(`/api/student/${studentId}/units`);
}
