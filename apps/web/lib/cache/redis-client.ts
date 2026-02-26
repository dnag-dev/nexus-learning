/**
 * Shared Redis client for caching across the application.
 * Used by: ElevenLabs TTS cache, Learn More content cache.
 *
 * Graceful fallback — returns null if Redis unavailable.
 */

import { createHash } from "crypto";

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<void>;
}

/**
 * Get a Redis client instance.
 * Returns null if Redis is unavailable (no REDIS_URL, connection failed, etc.)
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  try {
    const { default: Redis } = await import("ioredis");
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const redis = new Redis(redisUrl);
    return {
      async get(key: string) {
        return redis.get(key);
      },
      async set(key: string, value: string, options?: { EX: number }) {
        if (options?.EX) {
          await redis.set(key, value, "EX", options.EX);
        } else {
          await redis.set(key, value);
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * Generate a cache key with a prefix and hashed parts.
 * @param prefix - Cache namespace (e.g., "tts", "learn-more")
 * @param parts  - Values to hash together
 */
export function buildCacheKey(prefix: string, ...parts: string[]): string {
  const hash = createHash("sha256")
    .update(parts.join(":"))
    .digest("hex")
    .slice(0, 16);
  return `${prefix}:${hash}`;
}
