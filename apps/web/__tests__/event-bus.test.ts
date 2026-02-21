/**
 * Gamification Event Bus Tests — Phase 7: Gamification
 *
 * Tests:
 *  - Subscribe/unsubscribe
 *  - Emit events to specific handlers
 *  - Wildcard handlers
 *  - Once handlers
 *  - Event logging
 *  - Error handling in handlers
 *  - Singleton management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GamificationEventBus,
  getEventBus,
  resetEventBus,
  createEvent,
  type GamificationEvent,
} from "../lib/gamification/event-bus";

describe("GamificationEventBus", () => {
  let bus: GamificationEventBus;

  beforeEach(() => {
    bus = new GamificationEventBus();
  });

  // ─── Subscribe / Emit ───

  describe("subscribe and emit", () => {
    it("calls handler when matching event is emitted", async () => {
      const handler = vi.fn();
      bus.on("correct_answer", handler);

      const event = createEvent("correct_answer", "student-1", { xp: 10 });
      await bus.emit(event);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(event);
    });

    it("does not call handler for non-matching event", async () => {
      const handler = vi.fn();
      bus.on("correct_answer", handler);

      const event = createEvent("incorrect_answer", "student-1");
      await bus.emit(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("calls multiple handlers for same event type", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on("session_complete", handler1);
      bus.on("session_complete", handler2);

      const event = createEvent("session_complete", "student-1");
      const count = await bus.emit(event);

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
      expect(count).toBe(2);
    });

    it("returns count of invoked handlers", async () => {
      bus.on("level_up", vi.fn());
      bus.on("level_up", vi.fn());
      bus.on("badge_earned", vi.fn());

      const count = await bus.emit(createEvent("level_up", "s1"));
      expect(count).toBe(2);
    });
  });

  // ─── Unsubscribe ───

  describe("unsubscribe", () => {
    it("returns unsubscribe function", async () => {
      const handler = vi.fn();
      const unsub = bus.on("correct_answer", handler);

      unsub();

      await bus.emit(createEvent("correct_answer", "s1"));
      expect(handler).not.toHaveBeenCalled();
    });

    it("only removes the specific handler", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on("correct_answer", handler1);
      const unsub2 = bus.on("correct_answer", handler2);

      unsub2();

      await bus.emit(createEvent("correct_answer", "s1"));
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  // ─── Wildcard ───

  describe("wildcard handlers", () => {
    it("calls wildcard handler for any event", async () => {
      const handler = vi.fn();
      bus.on("*", handler);

      await bus.emit(createEvent("correct_answer", "s1"));
      await bus.emit(createEvent("session_complete", "s1"));
      await bus.emit(createEvent("level_up", "s1"));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("calls both specific and wildcard handlers", async () => {
      const specific = vi.fn();
      const wildcard = vi.fn();
      bus.on("correct_answer", specific);
      bus.on("*", wildcard);

      const count = await bus.emit(createEvent("correct_answer", "s1"));

      expect(specific).toHaveBeenCalledOnce();
      expect(wildcard).toHaveBeenCalledOnce();
      expect(count).toBe(2);
    });
  });

  // ─── Once ───

  describe("once", () => {
    it("calls handler only once", async () => {
      const handler = vi.fn();
      bus.once("level_up", handler);

      await bus.emit(createEvent("level_up", "s1"));
      await bus.emit(createEvent("level_up", "s1"));

      expect(handler).toHaveBeenCalledOnce();
    });

    it("returns unsubscribe function that works before fire", async () => {
      const handler = vi.fn();
      const unsub = bus.once("level_up", handler);

      unsub();

      await bus.emit(createEvent("level_up", "s1"));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ─── Clear ───

  describe("clear", () => {
    it("clears handlers for specific type", async () => {
      const handler = vi.fn();
      bus.on("correct_answer", handler);
      bus.on("session_complete", vi.fn());

      bus.clear("correct_answer");

      await bus.emit(createEvent("correct_answer", "s1"));
      expect(handler).not.toHaveBeenCalled();
    });

    it("clears all handlers when no type specified", async () => {
      bus.on("correct_answer", vi.fn());
      bus.on("session_complete", vi.fn());
      bus.on("*", vi.fn());

      bus.clear();

      expect(bus.getHandlerCount()).toBe(0);
    });
  });

  // ─── Event Log ───

  describe("event log", () => {
    it("records emitted events", async () => {
      await bus.emit(createEvent("correct_answer", "s1"));
      await bus.emit(createEvent("session_complete", "s1"));

      const log = bus.getEventLog();
      expect(log).toHaveLength(2);
      expect(log[0].type).toBe("correct_answer");
      expect(log[1].type).toBe("session_complete");
    });

    it("limits log size", async () => {
      const smallBus = new GamificationEventBus(5);
      for (let i = 0; i < 10; i++) {
        await smallBus.emit(createEvent("correct_answer", "s1", { i }));
      }

      const log = smallBus.getEventLog();
      expect(log).toHaveLength(5);
    });

    it("getEventLog with limit returns last N events", async () => {
      for (let i = 0; i < 10; i++) {
        await bus.emit(createEvent("correct_answer", "s1", { i }));
      }

      const log = bus.getEventLog(3);
      expect(log).toHaveLength(3);
    });

    it("clearLog empties the log", async () => {
      await bus.emit(createEvent("correct_answer", "s1"));
      bus.clearLog();
      expect(bus.getEventLog()).toHaveLength(0);
    });

    it("getEventCounts returns correct counts", async () => {
      await bus.emit(createEvent("correct_answer", "s1"));
      await bus.emit(createEvent("correct_answer", "s1"));
      await bus.emit(createEvent("session_complete", "s1"));

      const counts = bus.getEventCounts();
      expect(counts.correct_answer).toBe(2);
      expect(counts.session_complete).toBe(1);
    });
  });

  // ─── Error Handling ───

  describe("error handling", () => {
    it("continues calling handlers after one throws", async () => {
      const badHandler = vi.fn(() => {
        throw new Error("oops");
      });
      const goodHandler = vi.fn();

      bus.on("correct_answer", badHandler);
      bus.on("correct_answer", goodHandler);

      const count = await bus.emit(createEvent("correct_answer", "s1"));

      expect(badHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(count).toBe(1); // Only good handler counted
    });
  });

  // ─── Helper Queries ───

  describe("helper queries", () => {
    it("getHandlers returns handlers for a type", () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      bus.on("correct_answer", h1);
      bus.on("correct_answer", h2);

      expect(bus.getHandlers("correct_answer")).toHaveLength(2);
    });

    it("getHandlerCount returns total count", () => {
      bus.on("correct_answer", vi.fn());
      bus.on("session_complete", vi.fn());
      bus.on("*", vi.fn());

      expect(bus.getHandlerCount()).toBe(3);
    });
  });

  // ─── Fire (sync) ───

  describe("fire", () => {
    it("fires event without awaiting", () => {
      const handler = vi.fn();
      bus.on("correct_answer", handler);

      bus.fire(createEvent("correct_answer", "s1"));

      // Handler may not be called yet (async), but shouldn't throw
    });
  });
});

// ─── Singleton ───

describe("Event Bus singleton", () => {
  beforeEach(() => {
    resetEventBus();
  });

  it("getEventBus returns same instance", () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();
    expect(bus1).toBe(bus2);
  });

  it("resetEventBus creates fresh instance", () => {
    const bus1 = getEventBus();
    bus1.on("correct_answer", vi.fn());

    resetEventBus();

    const bus2 = getEventBus();
    expect(bus2.getHandlerCount()).toBe(0);
  });
});

// ─── createEvent ───

describe("createEvent", () => {
  it("creates event with correct fields", () => {
    const event = createEvent("correct_answer", "student-1", { xp: 10 });
    expect(event.type).toBe("correct_answer");
    expect(event.studentId).toBe("student-1");
    expect(event.payload).toEqual({ xp: 10 });
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it("defaults payload to empty object", () => {
    const event = createEvent("session_complete", "s1");
    expect(event.payload).toEqual({});
  });
});
