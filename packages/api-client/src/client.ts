/**
 * Base API Client — Shared fetch wrapper with auth support.
 *
 * Used by both web (future) and mobile apps.
 * Handles: Authorization headers, JSON parsing, error handling.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientConfig {
  /** Base URL for all API calls (e.g., "https://nexus-learning-dnag.vercel.app") */
  baseUrl: string;
  /** Optional callback to get current auth token */
  getToken?: () => string | null | Promise<string | null>;
  /** Optional custom headers */
  headers?: Record<string, string>;
}

let _config: ApiClientConfig = { baseUrl: "" };

/**
 * Initialize the API client. Must be called before any API calls.
 */
export function configureApiClient(config: ApiClientConfig): void {
  _config = config;
}

/**
 * Get current config (for testing/debugging).
 */
export function getApiConfig(): ApiClientConfig {
  return _config;
}

/**
 * Make an API call with automatic auth and JSON handling.
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const { baseUrl, getToken, headers: defaultHeaders } = _config;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...defaultHeaders,
    ...(options?.headers as Record<string, string>),
  };

  // Inject auth token
  if (!options?.skipAuth && getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Parse response safely (handle empty bodies)
  const text = await response.text();
  let data: T;
  try {
    data = text ? JSON.parse(text) : ({} as T);
  } catch {
    throw new ApiError(`Server error (${response.status})`, response.status);
  }

  if (!response.ok) {
    const errorMsg =
      (data as Record<string, unknown>)?.error ??
      `API error ${response.status}`;
    throw new ApiError(String(errorMsg), response.status, data);
  }

  return data;
}

/**
 * POST helper.
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * GET helper.
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET" });
}
