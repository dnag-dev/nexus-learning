/**
 * State Machine Tests — All 11 states, valid + invalid transitions
 */

import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  transitionPure,
  getAllowedTransitions,
  getRecommendedAction,
  type SessionStateValue,
} from "../lib/session/state-machine";

describe("Session State Machine", () => {
  // ─── Valid Transitions ───

  describe("IDLE transitions", () => {
    it("IDLE → DIAGNOSTIC is valid", () => {
      expect(isValidTransition("IDLE", "DIAGNOSTIC")).toBe(true);
    });
    it("IDLE → TEACHING is valid", () => {
      expect(isValidTransition("IDLE", "TEACHING")).toBe(true);
    });
    it("IDLE → PRACTICE is invalid", () => {
      expect(isValidTransition("IDLE", "PRACTICE")).toBe(false);
    });
    it("IDLE → COMPLETED is invalid", () => {
      expect(isValidTransition("IDLE", "COMPLETED")).toBe(false);
    });
  });

  describe("DIAGNOSTIC transitions", () => {
    it("DIAGNOSTIC → TEACHING is valid", () => {
      expect(isValidTransition("DIAGNOSTIC", "TEACHING")).toBe(true);
    });
    it("DIAGNOSTIC → COMPLETED is valid", () => {
      expect(isValidTransition("DIAGNOSTIC", "COMPLETED")).toBe(true);
    });
    it("DIAGNOSTIC → PRACTICE is invalid", () => {
      expect(isValidTransition("DIAGNOSTIC", "PRACTICE")).toBe(false);
    });
  });

  describe("TEACHING transitions", () => {
    it("TEACHING → PRACTICE is valid", () => {
      expect(isValidTransition("TEACHING", "PRACTICE")).toBe(true);
    });
    it("TEACHING → EMOTIONAL_CHECK is valid", () => {
      expect(isValidTransition("TEACHING", "EMOTIONAL_CHECK")).toBe(true);
    });
    it("TEACHING → COMPLETED is valid", () => {
      expect(isValidTransition("TEACHING", "COMPLETED")).toBe(true);
    });
    it("TEACHING → IDLE is invalid", () => {
      expect(isValidTransition("TEACHING", "IDLE")).toBe(false);
    });
  });

  describe("PRACTICE transitions", () => {
    it("PRACTICE → CELEBRATING is valid", () => {
      expect(isValidTransition("PRACTICE", "CELEBRATING")).toBe(true);
    });
    it("PRACTICE → STRUGGLING is valid", () => {
      expect(isValidTransition("PRACTICE", "STRUGGLING")).toBe(true);
    });
    it("PRACTICE → HINT_REQUESTED is valid", () => {
      expect(isValidTransition("PRACTICE", "HINT_REQUESTED")).toBe(true);
    });
    it("PRACTICE → REVIEW is valid", () => {
      expect(isValidTransition("PRACTICE", "REVIEW")).toBe(true);
    });
    it("PRACTICE → BOSS_CHALLENGE is valid", () => {
      expect(isValidTransition("PRACTICE", "BOSS_CHALLENGE")).toBe(true);
    });
    it("PRACTICE → TEACHING is valid", () => {
      expect(isValidTransition("PRACTICE", "TEACHING")).toBe(true);
    });
    it("PRACTICE → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("PRACTICE", "COMPLETED")).toBe(true);
    });
    it("PRACTICE → IDLE is invalid", () => {
      expect(isValidTransition("PRACTICE", "IDLE")).toBe(false);
    });
  });

  describe("HINT_REQUESTED transitions", () => {
    it("HINT_REQUESTED → PRACTICE is valid", () => {
      expect(isValidTransition("HINT_REQUESTED", "PRACTICE")).toBe(true);
    });
    it("HINT_REQUESTED → STRUGGLING is valid", () => {
      expect(isValidTransition("HINT_REQUESTED", "STRUGGLING")).toBe(true);
    });
    it("HINT_REQUESTED → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("HINT_REQUESTED", "COMPLETED")).toBe(true);
    });
    it("HINT_REQUESTED → TEACHING is invalid", () => {
      expect(isValidTransition("HINT_REQUESTED", "TEACHING")).toBe(false);
    });
  });

  describe("STRUGGLING transitions", () => {
    it("STRUGGLING → EMOTIONAL_CHECK is valid", () => {
      expect(isValidTransition("STRUGGLING", "EMOTIONAL_CHECK")).toBe(true);
    });
    it("STRUGGLING → TEACHING is valid", () => {
      expect(isValidTransition("STRUGGLING", "TEACHING")).toBe(true);
    });
    it("STRUGGLING → HINT_REQUESTED is valid", () => {
      expect(isValidTransition("STRUGGLING", "HINT_REQUESTED")).toBe(true);
    });
    it("STRUGGLING → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("STRUGGLING", "COMPLETED")).toBe(true);
    });
    it("STRUGGLING → PRACTICE is invalid", () => {
      expect(isValidTransition("STRUGGLING", "PRACTICE")).toBe(false);
    });
  });

  describe("CELEBRATING transitions", () => {
    it("CELEBRATING → PRACTICE is valid", () => {
      expect(isValidTransition("CELEBRATING", "PRACTICE")).toBe(true);
    });
    it("CELEBRATING → TEACHING is valid", () => {
      expect(isValidTransition("CELEBRATING", "TEACHING")).toBe(true);
    });
    it("CELEBRATING → BOSS_CHALLENGE is valid", () => {
      expect(isValidTransition("CELEBRATING", "BOSS_CHALLENGE")).toBe(true);
    });
    it("CELEBRATING → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("CELEBRATING", "COMPLETED")).toBe(true);
    });
    it("CELEBRATING → IDLE is invalid", () => {
      expect(isValidTransition("CELEBRATING", "IDLE")).toBe(false);
    });
  });

  describe("BOSS_CHALLENGE transitions", () => {
    it("BOSS_CHALLENGE → CELEBRATING is valid", () => {
      expect(isValidTransition("BOSS_CHALLENGE", "CELEBRATING")).toBe(true);
    });
    it("BOSS_CHALLENGE → STRUGGLING is valid", () => {
      expect(isValidTransition("BOSS_CHALLENGE", "STRUGGLING")).toBe(true);
    });
    it("BOSS_CHALLENGE → TEACHING is valid", () => {
      expect(isValidTransition("BOSS_CHALLENGE", "TEACHING")).toBe(true);
    });
    it("BOSS_CHALLENGE → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("BOSS_CHALLENGE", "COMPLETED")).toBe(true);
    });
    it("BOSS_CHALLENGE → IDLE is invalid", () => {
      expect(isValidTransition("BOSS_CHALLENGE", "IDLE")).toBe(false);
    });
  });

  describe("EMOTIONAL_CHECK transitions", () => {
    it("EMOTIONAL_CHECK → TEACHING is valid", () => {
      expect(isValidTransition("EMOTIONAL_CHECK", "TEACHING")).toBe(true);
    });
    it("EMOTIONAL_CHECK → STRUGGLING is valid", () => {
      expect(isValidTransition("EMOTIONAL_CHECK", "STRUGGLING")).toBe(true);
    });
    it("EMOTIONAL_CHECK → IDLE is valid", () => {
      expect(isValidTransition("EMOTIONAL_CHECK", "IDLE")).toBe(true);
    });
    it("EMOTIONAL_CHECK → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("EMOTIONAL_CHECK", "COMPLETED")).toBe(true);
    });
    it("EMOTIONAL_CHECK → PRACTICE is invalid", () => {
      expect(isValidTransition("EMOTIONAL_CHECK", "PRACTICE")).toBe(false);
    });
  });

  describe("REVIEW transitions", () => {
    it("REVIEW → PRACTICE is valid", () => {
      expect(isValidTransition("REVIEW", "PRACTICE")).toBe(true);
    });
    it("REVIEW → TEACHING is valid", () => {
      expect(isValidTransition("REVIEW", "TEACHING")).toBe(true);
    });
    it("REVIEW → COMPLETED is valid (end session)", () => {
      expect(isValidTransition("REVIEW", "COMPLETED")).toBe(true);
    });
    it("REVIEW → IDLE is invalid", () => {
      expect(isValidTransition("REVIEW", "IDLE")).toBe(false);
    });
  });

  describe("COMPLETED transitions", () => {
    it("COMPLETED → IDLE is valid", () => {
      expect(isValidTransition("COMPLETED", "IDLE")).toBe(true);
    });
    it("COMPLETED → TEACHING is invalid", () => {
      expect(isValidTransition("COMPLETED", "TEACHING")).toBe(false);
    });
    it("COMPLETED → PRACTICE is invalid", () => {
      expect(isValidTransition("COMPLETED", "PRACTICE")).toBe(false);
    });
  });

  // ─── transitionPure ───

  describe("transitionPure", () => {
    it("returns correct transition object for valid transition", () => {
      const result = transitionPure("IDLE", "TEACHING", "START_SESSION");
      expect(result).toEqual({
        from: "IDLE",
        to: "TEACHING",
        event: "START_SESSION",
      });
    });

    it("throws for invalid transition", () => {
      expect(() =>
        transitionPure("IDLE", "CELEBRATING", "INVALID")
      ).toThrow("Invalid state transition: IDLE → CELEBRATING");
    });
  });

  // ─── getAllowedTransitions ───

  describe("getAllowedTransitions", () => {
    it("returns correct transitions for PRACTICE", () => {
      const allowed = getAllowedTransitions("PRACTICE");
      expect(allowed).toContain("CELEBRATING");
      expect(allowed).toContain("STRUGGLING");
      expect(allowed).toContain("HINT_REQUESTED");
      expect(allowed).toContain("REVIEW");
      expect(allowed).toContain("BOSS_CHALLENGE");
      expect(allowed).toContain("TEACHING");
      expect(allowed).toContain("COMPLETED");
      expect(allowed).not.toContain("IDLE");
    });

    it("returns empty array for COMPLETED (except IDLE)", () => {
      const allowed = getAllowedTransitions("COMPLETED");
      expect(allowed).toEqual(["IDLE"]);
    });
  });

  // ─── getRecommendedAction ───

  describe("getRecommendedAction", () => {
    const expectedActions: Record<SessionStateValue, string> = {
      IDLE: "show_session_menu",
      DIAGNOSTIC: "present_diagnostic_question",
      TEACHING: "present_concept_explanation",
      PRACTICE: "present_practice_problem",
      HINT_REQUESTED: "provide_hint",
      STRUGGLING: "offer_simpler_approach",
      CELEBRATING: "show_mastery_celebration",
      BOSS_CHALLENGE: "present_boss_problem",
      EMOTIONAL_CHECK: "run_emotional_checkin",
      REVIEW: "present_review_problem",
      COMPLETED: "show_session_summary",
    };

    for (const [state, action] of Object.entries(expectedActions)) {
      it(`returns "${action}" for ${state}`, () => {
        expect(getRecommendedAction(state as SessionStateValue)).toBe(action);
      });
    }
  });
});
