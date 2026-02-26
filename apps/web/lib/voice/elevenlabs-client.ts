/**
 * ElevenLabs Voice Integration — Text-to-Speech for persona voices
 *
 * - Singleton ElevenLabs client
 * - synthesizeSpeech(text, voiceId) → ArrayBuffer
 * - streamSpeech(text, voiceId) → ReadableStream
 * - Redis cache (key: hash of text+voiceId, TTL: 7 days)
 * - Graceful fallback: returns null if ElevenLabs unavailable
 */

import { getRedisClient, buildCacheKey } from "@/lib/cache/redis-client";

// ─── Types ───

interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
}

// ─── Client Singleton ───

let config: ElevenLabsConfig | null = null;

function getConfig(): ElevenLabsConfig | null {
  if (config) return config;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "YOUR_ELEVENLABS_API_KEY") return null;
  config = {
    apiKey,
    baseUrl: "https://api.elevenlabs.io/v1",
  };
  return config;
}

// ─── Cache Helpers ───

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function cacheKey(text: string, voiceId: string): string {
  return buildCacheKey("tts", voiceId, text);
}

// ─── Core Functions ───

/**
 * Synthesize speech audio from text using ElevenLabs.
 * Returns an ArrayBuffer of MP3 audio, or null on failure.
 * Caches results in Redis for 7 days.
 */
export async function synthesizeSpeech(
  text: string,
  voiceId: string
): Promise<ArrayBuffer | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  // Check Redis cache
  const key = cacheKey(text, voiceId);
  try {
    const redis = await getRedisClient();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        // Stored as base64
        const buffer = Buffer.from(cached, "base64");
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
      }
    }
  } catch {
    // Cache miss — continue to API call
  }

  try {
    const response = await fetch(
      `${cfg.baseUrl}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": cfg.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(
        `ElevenLabs API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Cache in Redis
    try {
      const redis = await getRedisClient();
      if (redis) {
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        await redis.set(key, base64, { EX: CACHE_TTL });
      }
    } catch {
      // Non-critical — caching failed
    }

    return arrayBuffer;
  } catch (err) {
    console.warn(
      "ElevenLabs synthesizeSpeech failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Stream speech audio from text using ElevenLabs.
 * Returns a ReadableStream of audio chunks, or null on failure.
 */
export async function streamSpeech(
  text: string,
  voiceId: string
): Promise<ReadableStream<Uint8Array> | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  try {
    const response = await fetch(
      `${cfg.baseUrl}/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": cfg.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok || !response.body) {
      console.warn(
        `ElevenLabs stream error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return response.body;
  } catch (err) {
    console.warn(
      "ElevenLabs streamSpeech failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Check if ElevenLabs is configured and available.
 */
export function isElevenLabsAvailable(): boolean {
  return getConfig() !== null;
}

// Export for testing
export { cacheKey, CACHE_TTL, getConfig };
