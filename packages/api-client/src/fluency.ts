/**
 * Fluency Zone API Client — Speed practice sessions.
 */

import { apiPost } from "./client";

// ─── Types ───

export interface FluencyTopic {
  nodeId: string;
  nodeCode: string;
  title: string;
  subject: string;
  gradeLevel: string;
  domain: string;
  bktProbability: number;
  personalBestQPM: number | null;
}

export interface FluencyTopicsResponse {
  topics: FluencyTopic[];
}

export interface FluencyStartResponse {
  sessionId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  timeLimitSeconds: number;
  personalBest: {
    questionsPerMin: number;
    correctCount: number;
  } | null;
}

export interface FluencyAnswer {
  questionText: string;
  answer: string;
  correct: boolean;
  timeMs: number;
}

export interface FluencySubmitResponse {
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  questionsPerMin: number;
  averageTimeMs: number;
  isPersonalBest: boolean;
  previousBest: number | null;
  nodeName: string;
  timeLimitSeconds: number;
}

// ─── API Functions ───

/**
 * Get available fluency zone topics for a student.
 */
export async function getTopics(
  studentId: string,
  subject?: string
): Promise<FluencyTopicsResponse> {
  return apiPost<FluencyTopicsResponse>("/api/session/fluency-zone", {
    action: "topics",
    studentId,
    subject,
  });
}

/**
 * Start a fluency zone session.
 */
export async function startFluencyZone(
  studentId: string,
  nodeId: string,
  timeLimitSeconds: number
): Promise<FluencyStartResponse> {
  return apiPost<FluencyStartResponse>("/api/session/fluency-zone", {
    action: "start",
    studentId,
    nodeId,
    timeLimitSeconds,
  });
}

/**
 * Submit fluency zone results.
 */
export async function submitFluencyResults(
  sessionId: string,
  studentId: string,
  answers: FluencyAnswer[],
  elapsedSeconds: number
): Promise<FluencySubmitResponse> {
  return apiPost<FluencySubmitResponse>("/api/session/fluency-zone", {
    action: "submit",
    sessionId,
    studentId,
    answers,
    elapsedSeconds,
  });
}
