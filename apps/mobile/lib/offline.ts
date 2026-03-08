/**
 * Offline support — question caching + answer queue.
 *
 * - Caches current question in AsyncStorage on load
 * - Queues pending answers when offline (with timestamps)
 * - Detects connectivity via @react-native-community/netinfo
 * - Syncs queue when connectivity restores
 * - Provides `useOffline()` hook for UI awareness
 */

import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { submitAnswer } from "@aauti/api-client";
import type { SubmitAnswerRequest } from "@aauti/api-client";

// ─── Storage keys ───

const QUESTION_CACHE_KEY = "aauti-offline-question";
const ANSWER_QUEUE_KEY = "aauti-offline-answers";

// ─── Types ───

interface QueuedAnswer {
  request: SubmitAnswerRequest;
  queuedAt: number;
}

// ─── Question caching ───

/**
 * Cache the current question for offline access.
 */
export async function cacheQuestion(questionData: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(
      QUESTION_CACHE_KEY,
      JSON.stringify(questionData)
    );
  } catch {
    // Silently fail — caching is best-effort
  }
}

/**
 * Get cached question.
 */
export async function getCachedQuestion<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(QUESTION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Clear cached question.
 */
export async function clearCachedQuestion(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUESTION_CACHE_KEY);
  } catch {
    // Silently fail
  }
}

// ─── Answer queue ───

/**
 * Add an answer to the offline queue.
 */
export async function queueAnswer(
  request: SubmitAnswerRequest
): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(ANSWER_QUEUE_KEY);
    const queue: QueuedAnswer[] = existing ? JSON.parse(existing) : [];
    queue.push({ request, queuedAt: Date.now() });
    await AsyncStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Silently fail
  }
}

/**
 * Get all queued answers.
 */
export async function getQueuedAnswers(): Promise<QueuedAnswer[]> {
  try {
    const raw = await AsyncStorage.getItem(ANSWER_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the answer queue.
 */
export async function clearAnswerQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANSWER_QUEUE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Sync all queued answers to the server.
 * Returns count of successfully synced answers.
 */
export async function syncAnswerQueue(): Promise<number> {
  const queue = await getQueuedAnswers();
  if (queue.length === 0) return 0;

  let synced = 0;
  const failed: QueuedAnswer[] = [];

  for (const item of queue) {
    try {
      await submitAnswer(item.request);
      synced++;
    } catch {
      // Keep in queue for next sync attempt
      failed.push(item);
    }
  }

  // Replace queue with only failed items
  if (failed.length > 0) {
    await AsyncStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(failed));
  } else {
    await clearAnswerQueue();
  }

  return synced;
}

// ─── Connectivity hook ───

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean | null;
  queueSize: number;
  syncQueue: () => Promise<number>;
}

/**
 * Hook for offline awareness.
 * Monitors connectivity and auto-syncs when back online.
 */
export function useOffline(): OfflineState {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [queueSize, setQueueSize] = useState(0);
  const syncingRef = useRef(false);

  // Monitor connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Check queue size periodically
  useEffect(() => {
    const checkQueue = async () => {
      const queue = await getQueuedAnswers();
      setQueueSize(queue.length);
    };
    checkQueue();

    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when back online
  useEffect(() => {
    if (isConnected && queueSize > 0 && !syncingRef.current) {
      syncingRef.current = true;
      syncAnswerQueue()
        .then(async (synced) => {
          if (synced > 0) {
            const remaining = await getQueuedAnswers();
            setQueueSize(remaining.length);
          }
        })
        .finally(() => {
          syncingRef.current = false;
        });
    }
  }, [isConnected, queueSize]);

  const syncQueue = useCallback(async () => {
    const synced = await syncAnswerQueue();
    const remaining = await getQueuedAnswers();
    setQueueSize(remaining.length);
    return synced;
  }, []);

  return {
    isOnline: isConnected !== false,
    isConnected,
    queueSize,
    syncQueue,
  };
}
