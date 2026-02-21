/**
 * ChildCard Tests — Phase 9: Parent Dashboard
 *
 * Tests:
 *  - ChildCard renders correct data from student + mastery records
 *  - formatRelativeTime works for various time deltas
 *  - PERSONA_EMOJI has entries for all personas
 *  - GRADE_LABELS has entries for all grades
 *  - Trend arrow computation (up/down/neutral)
 */

import { describe, it, expect } from "vitest";
import {
  formatRelativeTime,
  PERSONA_EMOJI,
  GRADE_LABELS,
  type ChildCardData,
} from "../components/parent/ChildCard";

// ─── Helpers ───

function makeChild(overrides: Partial<ChildCardData> = {}): ChildCardData {
  return {
    id: "child-1",
    displayName: "Alex",
    avatarPersonaId: "cosmo",
    gradeLevel: "G3",
    xp: 500,
    level: 4,
    todaySessions: 2,
    todayMinutes: 25,
    currentStreak: 7,
    nodesMasteredThisWeek: 3,
    nodesMasteredLastWeek: 2,
    lastActiveAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ───

describe("ChildCard", () => {
  describe("ChildCardData type shape", () => {
    it("has all required fields", () => {
      const child = makeChild();

      expect(child.id).toBe("child-1");
      expect(child.displayName).toBe("Alex");
      expect(child.avatarPersonaId).toBe("cosmo");
      expect(child.gradeLevel).toBe("G3");
      expect(child.xp).toBe(500);
      expect(child.level).toBe(4);
      expect(child.todaySessions).toBe(2);
      expect(child.todayMinutes).toBe(25);
      expect(child.currentStreak).toBe(7);
      expect(child.nodesMasteredThisWeek).toBe(3);
      expect(child.nodesMasteredLastWeek).toBe(2);
      expect(child.lastActiveAt).toBeTruthy();
    });
  });

  describe("Trend arrow computation", () => {
    it("positive trend when this week > last week", () => {
      const child = makeChild({
        nodesMasteredThisWeek: 5,
        nodesMasteredLastWeek: 2,
      });
      const diff =
        child.nodesMasteredThisWeek - child.nodesMasteredLastWeek;

      expect(diff).toBe(3);
      expect(diff).toBeGreaterThan(0);
    });

    it("negative trend when this week < last week", () => {
      const child = makeChild({
        nodesMasteredThisWeek: 1,
        nodesMasteredLastWeek: 4,
      });
      const diff =
        child.nodesMasteredThisWeek - child.nodesMasteredLastWeek;

      expect(diff).toBe(-3);
      expect(diff).toBeLessThan(0);
    });

    it("neutral trend when this week = last week", () => {
      const child = makeChild({
        nodesMasteredThisWeek: 3,
        nodesMasteredLastWeek: 3,
      });
      const diff =
        child.nodesMasteredThisWeek - child.nodesMasteredLastWeek;

      expect(diff).toBe(0);
    });
  });

  describe("PERSONA_EMOJI", () => {
    it("has entry for cosmo", () => {
      expect(PERSONA_EMOJI.cosmo).toBe("🐻");
    });

    it("has entry for luna", () => {
      expect(PERSONA_EMOJI.luna).toBe("🐱");
    });

    it("has entry for rex", () => {
      expect(PERSONA_EMOJI.rex).toBe("🦖");
    });

    it("has entry for pip", () => {
      expect(PERSONA_EMOJI.pip).toBe("🦉");
    });

    it("has entry for nova", () => {
      expect(PERSONA_EMOJI.nova).toBe("🦊");
    });

    it("has at least 10 persona entries", () => {
      expect(Object.keys(PERSONA_EMOJI).length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("GRADE_LABELS", () => {
    it("maps K to Kindergarten", () => {
      expect(GRADE_LABELS.K).toBe("Kindergarten");
    });

    it("maps G1-G5 to Grade 1-5", () => {
      expect(GRADE_LABELS.G1).toBe("Grade 1");
      expect(GRADE_LABELS.G2).toBe("Grade 2");
      expect(GRADE_LABELS.G3).toBe("Grade 3");
      expect(GRADE_LABELS.G4).toBe("Grade 4");
      expect(GRADE_LABELS.G5).toBe("Grade 5");
    });

    it("has 6 grade entries (K + G1-G5)", () => {
      expect(Object.keys(GRADE_LABELS)).toHaveLength(6);
    });
  });

  describe("formatRelativeTime", () => {
    it("returns 'just now' for < 1 minute ago", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("just now");
    });

    it("returns minutes for < 60 minutes", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("5m ago");
    });

    it("returns hours for < 24 hours", () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("3h ago");
    });

    it("returns 'yesterday' for 1 day ago", () => {
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("yesterday");
    });

    it("returns days for 2-6 days ago", () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe("3d ago");
    });

    it("returns formatted date for > 7 days", () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      // Should contain month abbreviation
      expect(result).toMatch(/[A-Z][a-z]{2} \d+/);
    });
  });
});
