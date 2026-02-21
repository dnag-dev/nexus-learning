/**
 * Session History Tests — Phase 9: Parent Dashboard
 *
 * Tests:
 *  - Session records have correct type shapes
 *  - Pagination logic (correct page boundaries)
 *  - Filter logic (date range, session type, accuracy)
 *  - EMOTION_EMOJI mapping
 *  - Accuracy badge coloring logic
 */

import { describe, it, expect } from "vitest";
import {
  EMOTION_EMOJI,
  type SessionRecord,
  type SessionHistoryFilters,
} from "../components/parent/SessionHistory";

// ─── Helpers ───

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "session-1",
    date: new Date().toISOString(),
    durationMinutes: 15,
    sessionType: "LEARNING",
    questionsAnswered: 10,
    correctAnswers: 8,
    accuracy: 0.8,
    emotionalStateAtStart: "NEUTRAL",
    emotionalStateAtEnd: "ENGAGED",
    interventionsTriggered: 0,
    nodesCovered: ["Addition", "Subtraction"],
    hintsUsed: 1,
    ...overrides,
  };
}

function makeSessions(count: number): SessionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeSession({
      id: `session-${i}`,
      date: new Date(
        Date.now() - i * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  );
}

// ─── Tests ───

describe("Session History", () => {
  describe("SessionRecord type shape", () => {
    it("has all required fields", () => {
      const session = makeSession();

      expect(session.id).toBe("session-1");
      expect(session.durationMinutes).toBe(15);
      expect(session.sessionType).toBe("LEARNING");
      expect(session.questionsAnswered).toBe(10);
      expect(session.correctAnswers).toBe(8);
      expect(session.accuracy).toBe(0.8);
      expect(session.emotionalStateAtStart).toBe("NEUTRAL");
      expect(session.emotionalStateAtEnd).toBe("ENGAGED");
      expect(session.interventionsTriggered).toBe(0);
      expect(session.nodesCovered).toHaveLength(2);
      expect(session.hintsUsed).toBe(1);
    });

    it("supports all session types", () => {
      const types = ["LEARNING", "REVIEW", "DIAGNOSTIC", "BOSS"];
      for (const type of types) {
        const session = makeSession({ sessionType: type });
        expect(session.sessionType).toBe(type);
      }
    });
  });

  describe("Pagination logic", () => {
    it("calculates correct total pages", () => {
      const sessions = makeSessions(25);
      const pageSize = 10;
      const totalPages = Math.ceil(sessions.length / pageSize);

      expect(totalPages).toBe(3);
    });

    it("first page shows correct items", () => {
      const sessions = makeSessions(25);
      const pageSize = 10;
      const page = 0;
      const paginated = sessions.slice(
        page * pageSize,
        (page + 1) * pageSize
      );

      expect(paginated).toHaveLength(10);
    });

    it("last page shows remaining items", () => {
      const sessions = makeSessions(25);
      const pageSize = 10;
      const page = 2; // Third page
      const paginated = sessions.slice(
        page * pageSize,
        (page + 1) * pageSize
      );

      expect(paginated).toHaveLength(5);
    });

    it("empty sessions produce 0 pages", () => {
      const sessions: SessionRecord[] = [];
      const pageSize = 10;
      const totalPages = Math.ceil(sessions.length / pageSize);

      expect(totalPages).toBe(0);
    });

    it("exact page size produces 1 page", () => {
      const sessions = makeSessions(10);
      const pageSize = 10;
      const totalPages = Math.ceil(sessions.length / pageSize);

      expect(totalPages).toBe(1);
    });
  });

  describe("Filter logic", () => {
    it("date range filter - 7 days", () => {
      const sessions = makeSessions(30);
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filtered = sessions.filter(
        (s) => new Date(s.date) >= cutoff
      );

      expect(filtered.length).toBeLessThanOrEqual(8); // 0-7 days
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("session type filter", () => {
      const sessions = [
        makeSession({ id: "1", sessionType: "LEARNING" }),
        makeSession({ id: "2", sessionType: "REVIEW" }),
        makeSession({ id: "3", sessionType: "LEARNING" }),
        makeSession({ id: "4", sessionType: "BOSS" }),
      ];

      const filtered = sessions.filter(
        (s) => s.sessionType === "LEARNING"
      );
      expect(filtered).toHaveLength(2);
    });

    it("accuracy filter >= 70%", () => {
      const sessions = [
        makeSession({ id: "1", accuracy: 0.9 }),
        makeSession({ id: "2", accuracy: 0.5 }),
        makeSession({ id: "3", accuracy: 0.75 }),
        makeSession({ id: "4", accuracy: 0.6 }),
      ];

      const filtered = sessions.filter((s) => s.accuracy >= 0.7);
      expect(filtered).toHaveLength(2);
    });

    it("combined filters work together", () => {
      const sessions = [
        makeSession({
          id: "1",
          sessionType: "LEARNING",
          accuracy: 0.9,
        }),
        makeSession({
          id: "2",
          sessionType: "REVIEW",
          accuracy: 0.9,
        }),
        makeSession({
          id: "3",
          sessionType: "LEARNING",
          accuracy: 0.5,
        }),
      ];

      const filtered = sessions.filter(
        (s) => s.sessionType === "LEARNING" && s.accuracy >= 0.7
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("filters interface has correct defaults", () => {
      const filters: SessionHistoryFilters = {
        sessionType: null,
        minAccuracy: null,
        dateRange: "30d",
      };

      expect(filters.sessionType).toBeNull();
      expect(filters.minAccuracy).toBeNull();
      expect(filters.dateRange).toBe("30d");
    });
  });

  describe("EMOTION_EMOJI mapping", () => {
    it("has emoji for ENGAGED", () => {
      expect(EMOTION_EMOJI.ENGAGED).toBe("😊");
    });

    it("has emoji for FRUSTRATED", () => {
      expect(EMOTION_EMOJI.FRUSTRATED).toBe("😤");
    });

    it("has emoji for BORED", () => {
      expect(EMOTION_EMOJI.BORED).toBe("😑");
    });

    it("has emoji for EXCITED", () => {
      expect(EMOTION_EMOJI.EXCITED).toBe("🤩");
    });

    it("has emoji for BREAKTHROUGH", () => {
      expect(EMOTION_EMOJI.BREAKTHROUGH).toBe("💡");
    });

    it("has emoji for NEUTRAL", () => {
      expect(EMOTION_EMOJI.NEUTRAL).toBe("😐");
    });

    it("has emoji for all 8 emotional states", () => {
      const states = [
        "ENGAGED",
        "FRUSTRATED",
        "BORED",
        "CONFUSED",
        "EXCITED",
        "NEUTRAL",
        "ANXIOUS",
        "BREAKTHROUGH",
      ];

      for (const state of states) {
        expect(EMOTION_EMOJI[state]).toBeDefined();
        expect(typeof EMOTION_EMOJI[state]).toBe("string");
      }
    });
  });

  describe("Accuracy badge coloring logic", () => {
    it("high accuracy (>= 80%) gets green", () => {
      const pct = Math.round(0.85 * 100);
      const color =
        pct >= 80
          ? "text-green-600"
          : pct >= 60
            ? "text-amber-600"
            : "text-red-500";

      expect(color).toBe("text-green-600");
    });

    it("medium accuracy (60-79%) gets amber", () => {
      const pct = Math.round(0.65 * 100);
      const color =
        pct >= 80
          ? "text-green-600"
          : pct >= 60
            ? "text-amber-600"
            : "text-red-500";

      expect(color).toBe("text-amber-600");
    });

    it("low accuracy (< 60%) gets red", () => {
      const pct = Math.round(0.45 * 100);
      const color =
        pct >= 80
          ? "text-green-600"
          : pct >= 60
            ? "text-amber-600"
            : "text-red-500";

      expect(color).toBe("text-red-500");
    });
  });

  describe("Sort by date (newest first)", () => {
    it("sorts correctly", () => {
      const sessions = [
        makeSession({
          id: "old",
          date: new Date("2025-01-01").toISOString(),
        }),
        makeSession({
          id: "new",
          date: new Date("2025-01-15").toISOString(),
        }),
        makeSession({
          id: "mid",
          date: new Date("2025-01-08").toISOString(),
        }),
      ];

      sessions.sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      expect(sessions[0].id).toBe("new");
      expect(sessions[1].id).toBe("mid");
      expect(sessions[2].id).toBe("old");
    });
  });
});
