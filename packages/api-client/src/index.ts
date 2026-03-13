/**
 * @aauti/api-client — Shared API client for Nexus Learning.
 *
 * Used by the mobile app to call the same Next.js API endpoints
 * as the web app. Handles auth token injection and typed responses.
 */

// Core client
export { configureApiClient, apiCall, apiPost, apiGet, ApiError } from "./client";
export type { ApiClientConfig } from "./client";

// Auth
export { login, getSession, parentLogin, getParentSession } from "./auth";
export type {
  LoginRequest,
  LoginResponse,
  SessionResponse,
  ParentLoginResponse,
  ParentSessionResponse,
} from "./auth";

// Session
export {
  startSession,
  getNextQuestion,
  submitAnswer,
  endSession,
  getTeachStream,
  getHint,
} from "./session";
export type {
  StartSessionRequest,
  StartSessionResponse,
  QuestionOption,
  NextQuestionResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  EndSessionResponse,
} from "./session";

// Student
export {
  getGamification,
  getNextConcept,
  getMasteryMap,
  getTopicTree,
  getUnits,
} from "./student";
export type {
  GamificationResponse,
  NextConceptResponse,
  MasteryMapNode,
  TopicTreeResponse,
} from "./student";

// Fluency
export {
  getTopics,
  startFluencyZone,
  submitFluencyResults,
} from "./fluency";
export type {
  FluencyTopic,
  FluencyTopicsResponse,
  FluencyStartResponse,
  FluencyAnswer,
  FluencySubmitResponse,
} from "./fluency";

// Diagnostic
export {
  startDiagnostic,
  submitDiagnosticAnswer,
  getDiagnosticResult,
} from "./diagnostic";
export type {
  DiagnosticStartResponse,
  DiagnosticAnswerResponse,
  DiagnosticResultResponse,
} from "./diagnostic";

// Parent
export {
  getOverview,
  getActivityLog,
  getChildProgress,
  getChildren,
} from "./parent";
export type {
  ParentOverviewResponse,
  ActivityLogEntry,
  ActivityLogResponse,
  ChildProgressResponse,
} from "./parent";
