/**
 * Diagnostic API Client — Placement tests.
 */

import { apiPost, apiGet } from "./client";

// ─── Types ───

export interface DiagnosticStartResponse {
  sessionId: string;
  question: {
    questionId: string;
    nodeCode: string;
    nodeTitle: string;
    gradeLevel: string;
    domain: string;
    difficulty: number;
    questionText: string;
    options: Array<{
      id: string;
      text: string;
    }>;
    hint?: string;
  };
  totalQuestions: number;
  questionsAnswered: number;
}

export interface DiagnosticAnswerResponse {
  nextQuestion?: DiagnosticStartResponse["question"];
  isComplete: boolean;
  questionsAnswered: number;
  totalQuestions: number;
}

export interface DiagnosticResultResponse {
  frontierNodeCode: string;
  frontierNodeTitle: string;
  gradeEstimate: number;
  confidence: number;
  masteredNodes: string[];
  gapNodes: string[];
  totalCorrect: number;
  totalQuestions: number;
  summary: string;
}

// ─── API Functions ───

/**
 * Start a diagnostic assessment.
 */
export async function startDiagnostic(
  studentId: string,
  goalId?: string
): Promise<DiagnosticStartResponse> {
  return apiPost<DiagnosticStartResponse>("/api/diagnostic/start", {
    studentId,
    goalId,
  });
}

/**
 * Submit a diagnostic answer.
 */
export async function submitDiagnosticAnswer(
  sessionId: string,
  selectedOptionId: string,
  isCorrect: boolean,
  responseTimeMs: number
): Promise<DiagnosticAnswerResponse> {
  return apiPost<DiagnosticAnswerResponse>("/api/diagnostic/answer", {
    sessionId,
    selectedOptionId,
    isCorrect,
    responseTimeMs,
  });
}

/**
 * Get diagnostic result.
 */
export async function getDiagnosticResult(
  sessionId: string
): Promise<DiagnosticResultResponse> {
  return apiGet<DiagnosticResultResponse>(
    `/api/diagnostic/result?sessionId=${sessionId}`
  );
}
