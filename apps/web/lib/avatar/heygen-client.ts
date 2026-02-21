/**
 * HeyGen LiveAvatar — Server-side client
 *
 * Uses the HeyGen LiveAvatar API (LiveKit-based) for live avatar sessions.
 * This module handles the server-side session token creation (requires secret API key).
 * The client-side SDK (@heygen/liveavatar-web-sdk) is used in the AvatarDisplay component.
 *
 * Flow:
 *  1. Server: createSessionToken(avatarId) → session_token + session_id
 *  2. Client: new LiveAvatarSession(session_token) → creates session
 *  3. Client: session.start() → connects to LiveKit + WebSocket
 *  4. Client: session.attach(videoElement) → renders avatar video
 *  5. Client: session.repeat(text) → makes avatar speak text (LITE mode)
 *     OR session.message(text) → sends to LLM then speaks (FULL mode)
 *  6. Client: session.stop() → closes session
 *
 * API Reference: https://docs.liveavatar.com
 * SDK: @heygen/liveavatar-web-sdk
 */

import type { PersonaId } from "@/lib/personas/persona-config";

// ─── Types ───

interface HeyGenConfig {
  apiKey: string;
  baseUrl: string;
}

export interface HeyGenSessionToken {
  sessionToken: string;
  sessionId: string;
  createdAt: Date;
}

// ─── LiveAvatar API URL ───

const LIVEAVATAR_API_URL = "https://api.liveavatar.com";

// ─── Default Avatar ID (shared across all personas until custom avatars are made) ───

const DEFAULT_AVATAR_ID =
  process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID ??
  "c2ddffc3-bd11-4478-8dd9-fc278221f9b1";

/**
 * Default HeyGen voice ID (UUID format, NOT an ElevenLabs voice ID).
 * This is the HeyGen voice used for avatar lip-sync.
 * When custom voices are configured per persona, update the voice map.
 */
const DEFAULT_HEYGEN_VOICE_ID =
  process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID ??
  "c2527536-6d1f-4412-a643-53a3497dada9";

/**
 * Persona → HeyGen avatar_id mapping.
 * For now, all personas use the same test avatar.
 * When custom HeyGen avatars are created for each persona, update this map.
 */
const AVATAR_ID_MAP: Record<PersonaId, string> = {
  // EARLY_5_7
  cosmo: DEFAULT_AVATAR_ID,
  luna: DEFAULT_AVATAR_ID,
  rex: DEFAULT_AVATAR_ID,
  nova: DEFAULT_AVATAR_ID,
  pip: DEFAULT_AVATAR_ID,
  // MID_8_10
  atlas: DEFAULT_AVATAR_ID,
  zara: DEFAULT_AVATAR_ID,
  finn: DEFAULT_AVATAR_ID,
  echo: DEFAULT_AVATAR_ID,
  sage: DEFAULT_AVATAR_ID,
  // UPPER_11_12
  bolt: DEFAULT_AVATAR_ID,
  ivy: DEFAULT_AVATAR_ID,
  max: DEFAULT_AVATAR_ID,
  aria: DEFAULT_AVATAR_ID,
};

// ─── Config Singleton ───

let config: HeyGenConfig | null = null;

function getConfig(): HeyGenConfig | null {
  if (config) return config;
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey || apiKey === "YOUR_HEYGEN_API_KEY") return null;
  config = {
    apiKey,
    baseUrl: LIVEAVATAR_API_URL,
  };
  return config;
}

// ─── Core Server-Side Functions ───

/**
 * Create a session token for the HeyGen LiveAvatar SDK.
 * This must be called server-side (it uses the secret API key).
 *
 * Calls: POST https://api.liveavatar.com/v1/sessions/token
 * Headers: X-API-KEY: <api_key>, Content-Type: application/json
 * Body: { mode, avatar_id, is_sandbox, ... }
 *
 * Returns: { session_token, session_id }
 */
export async function createSessionToken(
  avatarId?: string
): Promise<HeyGenSessionToken | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const resolvedAvatarId = avatarId ?? DEFAULT_AVATAR_ID;
  const isSandbox = process.env.HEYGEN_SANDBOX === "true"; // default false (avatar not supported in sandbox)

  try {
    const response = await fetch(`${cfg.baseUrl}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "X-API-KEY": cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: resolvedAvatarId,
        avatar_persona: {
          voice_id: DEFAULT_HEYGEN_VOICE_ID,
          language: "en",
        },
        is_sandbox: isSandbox,
      }),
    });

    if (!response.ok) {
      // Try to extract a meaningful error message
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorMessage =
            errData.data?.[0]?.message ??
            errData.error ??
            errData.message ??
            errorMessage;
        }
      } catch {
        // ignore parse errors
      }
      console.warn(`LiveAvatar create token error: ${errorMessage}`);
      return null;
    }

    const data = await response.json();
    const sessionToken = data.data?.session_token;
    const sessionId = data.data?.session_id;

    if (!sessionToken) {
      console.warn("LiveAvatar create token: no session_token in response");
      return null;
    }

    return {
      sessionToken,
      sessionId: sessionId ?? "",
      createdAt: new Date(),
    };
  } catch (err) {
    console.warn(
      "LiveAvatar createSessionToken failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Check if HeyGen LiveAvatar is configured and available.
 */
export function isHeyGenAvailable(): boolean {
  return getConfig() !== null;
}

/**
 * Get the HeyGen avatar ID for a persona.
 */
export function getAvatarId(personaId: PersonaId): string {
  return AVATAR_ID_MAP[personaId] ?? DEFAULT_AVATAR_ID;
}

/**
 * Get the default avatar ID.
 */
export function getDefaultAvatarId(): string {
  return DEFAULT_AVATAR_ID;
}

// Export for testing
export { AVATAR_ID_MAP, getConfig, DEFAULT_AVATAR_ID, DEFAULT_HEYGEN_VOICE_ID, LIVEAVATAR_API_URL };
