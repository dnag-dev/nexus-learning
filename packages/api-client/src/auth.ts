/**
 * Auth API Client — Login and session management.
 */

import { apiPost, apiGet } from "./client";

// ─── Child Auth Types ───

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

// ─── Parent Auth Types ───

export interface ParentLoginResponse {
  parentId: string;
  email: string;
  name: string;
  plan: string;
  token: string;
  children: Array<{
    id: string;
    displayName: string;
    avatarPersonaId: string;
    gradeLevel: string;
  }>;
}

export interface ParentSessionResponse {
  parentId: string;
  email: string;
  name: string;
  plan: string;
  children: Array<{
    id: string;
    displayName: string;
    avatarPersonaId: string;
    gradeLevel: string;
  }>;
}

// ─── Child Auth API Functions ───

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

// ─── Parent Auth API Functions ───

/**
 * Register a new parent account with email + password.
 * Returns same shape as login (parent info + JWT token + empty children).
 */
export async function parentRegister(
  email: string,
  password: string,
  name?: string
): Promise<ParentLoginResponse> {
  return apiPost<ParentLoginResponse>("/api/auth/parent-register", {
    email,
    password,
    name,
  });
}

/**
 * Login with email + password.
 * Returns parent info + JWT token + children list.
 */
export async function parentLogin(
  email: string,
  password: string
): Promise<ParentLoginResponse> {
  return apiPost<ParentLoginResponse>("/api/auth/parent-login", {
    email,
    password,
  });
}

/**
 * Verify parent session and get fresh profile + children.
 * Requires auth token (set via configureApiClient).
 */
export async function getParentSession(): Promise<ParentSessionResponse> {
  return apiGet<ParentSessionResponse>("/api/auth/parent-session");
}
