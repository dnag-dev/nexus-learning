/**
 * Auth API Client — Login and session management.
 */

import { apiPost, apiGet } from "./client";

// ─── Types ───

export interface LoginRequest {
  username: string;
  pin: string;
}

export interface LoginResponse {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  token: string; // JWT token for mobile auth
}

export interface SessionResponse {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  xp: number;
  level: number;
  gradeLevel: string;
  ageGroup: string;
  firstLoginComplete: boolean;
}

// ─── API Functions ───

/**
 * Login with username + PIN.
 * Returns student info + JWT token.
 */
export async function login(
  username: string,
  pin: string
): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/api/auth/child-login", { username, pin });
}

/**
 * Verify current session and get fresh profile.
 * Requires auth token (set via configureApiClient).
 */
export async function getSession(): Promise<SessionResponse> {
  return apiGet<SessionResponse>("/api/auth/child-session");
}
