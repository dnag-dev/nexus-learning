/**
 * Session API Client — Learning session lifecycle.
 */

import { apiPost, apiGet, apiCall } from "./client";

// ─── Types ───

export interface StartSessionRequest {
  studentId: string;
  nodeCode?: string;
  topic?: string;
  planId?: string;
  subject?: "MATH" | "ENGLISH";
}

export interface StartSessionResponse {
  sessionId: string;
  state: string;
  recommendedAction: string;
  node: {
    nodeCode: string;
    title: string;
    description: string;
    gradeLevel: string;
    domain: string;
    difficulty: number;
  };
  subject: string;
  persona: { id: string; studentName: string };
  todaysPlan?: {
    planId: string;
    goalName: string;
    positionInPlan: number;
    totalInPlan: number;
    progress: number;
  };
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface NextQuestionResponse {
  question: {
    questionText: string;
    options: QuestionOption[];
    correctAnswer: string;
    explanation: string;
  };
  source: "prefetch" | "on-demand" | "fallback";
  learningStep: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  questionText?: string;
  selectedAnswerText?: string;
  correctAnswerText?: string;
  explanation?: string;
}

export interface SubmitAnswerResponse {
  sessionId: string;
  state: string;
  correct: boolean;
  mastery: {
    bktProbability: number;
    level: string;
    practiceCount: number;
    correctCount: number;
  };
  nextAction: string;
  message?: string;
  celebration?: string;
  sessionXP?: number;
  totalXP?: number;
  streak?: number;
}

export interface EndSessionResponse {
  sessionId: string;
  summary: {
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    xpEarned: number;
    masteryBefore: number;
    masteryAfter: number;
    topicMastered: boolean;
  };
}

// ─── API Functions ───

/**
 * Start a new learning session.
 */
export async function startSession(
  data: StartSessionRequest
): Promise<StartSessionResponse> {
  return apiPost<StartSessionResponse>("/api/session/start", data);
}

/**
 * Get the next question for an active session.
 */
export async function getNextQuestion(
  sessionId: string
): Promise<NextQuestionResponse> {
  return apiGet<NextQuestionResponse>(
    `/api/session/next-question?sessionId=${sessionId}`
  );
}

/**
 * Submit an answer.
 */
export async function submitAnswer(
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  return apiPost<SubmitAnswerResponse>("/api/session/answer", data);
}

/**
 * End a session.
 */
export async function endSession(
  sessionId: string,
  studentId: string
): Promise<EndSessionResponse> {
  return apiPost<EndSessionResponse>("/api/session/end", {
    sessionId,
    studentId,
  });
}

/**
 * Get teaching explanation via SSE stream.
 * Returns an async generator that yields text chunks.
 */
export async function* getTeachStream(
  sessionId: string,
  baseUrl: string,
  token?: string | null
): AsyncGenerator<string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${baseUrl}/api/session/teach-stream?sessionId=${sessionId}`;
  const response = await fetch(url, { headers });

  if (!response.ok || !response.body) {
    throw new Error(`Teach stream error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        yield data;
      }
    }
  }
}

/**
 * Request a hint for the current question.
 */
export async function getHint(
  sessionId: string
): Promise<{ hint: string }> {
  return apiPost<{ hint: string }>("/api/session/hint", { sessionId });
}
