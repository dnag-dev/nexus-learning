/**
 * Gamification Event Bus — Phase 7: Gamification
 *
 * Central event system for gamification.
 * All game-related actions emit events that trigger XP awards,
 * streak updates, badge checks, and UI celebrations.
 */

// ─── Event Types ───

export type GamificationEventType =
  | "correct_answer"
  | "incorrect_answer"
  | "session_complete"
  | "node_mastered"
  | "boss_challenge_complete"
  | "boss_challenge_failed"
  | "perfect_session"
  | "streak_milestone"
  | "badge_earned"
  | "level_up"
  | "hint_used"
  | "session_started"
  | "review_passed"
  | "review_failed"
  | "constellation_star_lit";

export interface GamificationEvent {
  type: GamificationEventType;
  studentId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export type EventHandler = (event: GamificationEvent) => void | Promise<void>;

// ─── Event Bus ───

/**
 * Central event bus for gamification system.
 * Supports subscribe/unsubscribe, emit (sync + async), and wildcard listeners.
 */
export class GamificationEventBus {
  private handlers: Map<GamificationEventType | "*", EventHandler[]> =
    new Map();
  private eventLog: GamificationEvent[] = [];
  private maxLogSize: number;

  constructor(maxLogSize = 500) {
    this.maxLogSize = maxLogSize;
  }

  /**
   * Subscribe to a specific event type. Use "*" for all events.
   * Returns an unsubscribe function.
   */
  on(
    type: GamificationEventType | "*",
    handler: EventHandler
  ): () => void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to an event type, auto-unsubscribe after first call.
   */
  once(
    type: GamificationEventType | "*",
    handler: EventHandler
  ): () => void {
    const wrappedHandler: EventHandler = (event) => {
      unsubscribe();
      return handler(event);
    };
    const unsubscribe = this.on(type, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Emit an event. Calls all matching handlers + wildcard handlers.
   * Returns the count of handlers invoked.
   */
  async emit(event: GamificationEvent): Promise<number> {
    // Log the event
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    let invoked = 0;

    // Call specific handlers
    const specific = this.handlers.get(event.type) ?? [];
    for (const handler of [...specific]) {
      try {
        await handler(event);
        invoked++;
      } catch {
        // Non-critical — swallow handler errors
      }
    }

    // Call wildcard handlers
    const wildcards = this.handlers.get("*") ?? [];
    for (const handler of [...wildcards]) {
      try {
        await handler(event);
        invoked++;
      } catch {
        // Non-critical — swallow handler errors
      }
    }

    return invoked;
  }

  /**
   * Emit an event synchronously (fire-and-forget).
   */
  fire(event: GamificationEvent): void {
    void this.emit(event);
  }

  /**
   * Remove all handlers for a specific event type (or all if no type given).
   */
  clear(type?: GamificationEventType | "*"): void {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get all handlers for a specific event type.
   */
  getHandlers(type: GamificationEventType | "*"): EventHandler[] {
    return [...(this.handlers.get(type) ?? [])];
  }

  /**
   * Get the number of registered handlers across all types.
   */
  getHandlerCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.length;
    }
    return count;
  }

  /**
   * Get recent event log.
   */
  getEventLog(limit?: number): GamificationEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Clear event log.
   */
  clearLog(): void {
    this.eventLog = [];
  }

  /**
   * Get count of events by type.
   */
  getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.eventLog) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts;
  }
}

// ─── Singleton Bus ───

let _globalBus: GamificationEventBus | null = null;

/**
 * Get the global gamification event bus (singleton).
 */
export function getEventBus(): GamificationEventBus {
  if (!_globalBus) {
    _globalBus = new GamificationEventBus();
  }
  return _globalBus;
}

/**
 * Reset the global bus (for testing).
 */
export function resetEventBus(): void {
  _globalBus?.clear();
  _globalBus?.clearLog();
  _globalBus = null;
}

// ─── Helper: Create events ───

export function createEvent(
  type: GamificationEventType,
  studentId: string,
  payload: Record<string, unknown> = {}
): GamificationEvent {
  return {
    type,
    studentId,
    timestamp: new Date(),
    payload,
  };
}
