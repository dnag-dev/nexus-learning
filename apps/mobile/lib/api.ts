/**
 * API client configuration for the mobile app.
 *
 * Configures @aauti/api-client with the production base URL
 * and a token getter that reads from the auth store.
 */

import { configureApiClient } from "@aauti/api-client";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://nexus-learning-dnag.vercel.app";

/**
 * Initialize the API client.
 * Must be called once at app startup, after auth store is ready.
 */
export function initializeApi(getToken: () => string | null) {
  configureApiClient({
    baseUrl: API_URL,
    getToken,
  });
}

export { API_URL };
