/**
 * Persona Config Tests
 * - All 14 personas have required fields
 * - Age groups are correctly assigned (5 per tier)
 * - Lookup helpers work correctly
 */

import { describe, it, expect } from "vitest";
import {
  ALL_PERSONAS,
  PERSONA_MAP,
  getPersona,
  getPersonaById,
  getPersonasForAgeGroup,
  getDefaultPersonaForAgeGroup,
  isValidPersonaId,
} from "../lib/personas/persona-config";
import type {
  PersonaConfig,
  PersonaId,
  AgeGroupValue,
} from "../lib/personas/persona-config";

// ─── Required Fields ───

describe("Persona Config — all 14 personas have required fields", () => {
  it("has exactly 14 personas", () => {
    expect(ALL_PERSONAS).toHaveLength(14);
    expect(Object.keys(PERSONA_MAP)).toHaveLength(14);
  });

  ALL_PERSONAS.forEach((persona) => {
    describe(`${persona.id} (${persona.name})`, () => {
      it("has id", () => {
        expect(persona.id).toBeTruthy();
        expect(typeof persona.id).toBe("string");
      });

      it("has name", () => {
        expect(persona.name).toBeTruthy();
        expect(typeof persona.name).toBe("string");
      });

      it("has ageGroup", () => {
        expect(["EARLY_5_7", "MID_8_10", "UPPER_11_12"]).toContain(
          persona.ageGroup
        );
      });

      it("has theme", () => {
        expect(persona.theme).toBeTruthy();
        expect(typeof persona.theme).toBe("string");
      });

      it("has catchphrase", () => {
        expect(persona.catchphrase).toBeTruthy();
        expect(typeof persona.catchphrase).toBe("string");
      });

      it("has at least 5 encouragement phrases", () => {
        expect(persona.encouragementPhrases.length).toBeGreaterThanOrEqual(5);
        persona.encouragementPhrases.forEach((p) => {
          expect(typeof p).toBe("string");
          expect(p.length).toBeGreaterThan(0);
        });
      });

      it("has at least 5 celebration phrases", () => {
        expect(persona.celebrationPhrases.length).toBeGreaterThanOrEqual(5);
        persona.celebrationPhrases.forEach((p) => {
          expect(typeof p).toBe("string");
          expect(p.length).toBeGreaterThan(0);
        });
      });

      it("has valid hintStyle", () => {
        expect(["socratic", "direct", "metaphor"]).toContain(
          persona.hintStyle
        );
      });

      it("has avatarPlaceholder (emoji)", () => {
        expect(persona.avatarPlaceholder).toBeTruthy();
        expect(persona.avatarPlaceholder.length).toBeGreaterThan(0);
      });

      it("has voiceId (ElevenLabs placeholder)", () => {
        expect(persona.voiceId).toBeTruthy();
        expect(typeof persona.voiceId).toBe("string");
      });

      it("has personality description (2-3 sentences)", () => {
        expect(persona.personality).toBeTruthy();
        expect(persona.personality.length).toBeGreaterThan(50);
        // Should contain at least 2 sentences (at least 1 period inside)
        const sentences = persona.personality
          .split(".")
          .filter((s) => s.trim().length > 0);
        expect(sentences.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

// ─── Age Group Distribution ───

describe("Persona Config — age group distribution", () => {
  it("EARLY_5_7 has exactly 5 personas", () => {
    const early = getPersonasForAgeGroup("EARLY_5_7");
    expect(early).toHaveLength(5);
    expect(early.map((p) => p.id).sort()).toEqual(
      ["cosmo", "luna", "nova", "pip", "rex"].sort()
    );
  });

  it("MID_8_10 has exactly 5 personas", () => {
    const mid = getPersonasForAgeGroup("MID_8_10");
    expect(mid).toHaveLength(5);
    expect(mid.map((p) => p.id).sort()).toEqual(
      ["atlas", "echo", "finn", "sage", "zara"].sort()
    );
  });

  it("UPPER_11_12 has exactly 4 personas", () => {
    const upper = getPersonasForAgeGroup("UPPER_11_12");
    expect(upper).toHaveLength(4);
    expect(upper.map((p) => p.id).sort()).toEqual(
      ["aria", "bolt", "ivy", "max"].sort()
    );
  });
});

// ─── Lookup Helpers ───

describe("Persona Config — lookup helpers", () => {
  it("getPersona returns correct persona by ID", () => {
    const cosmo = getPersona("cosmo");
    expect(cosmo.name).toBe("Cosmo the Robot");
    expect(cosmo.ageGroup).toBe("EARLY_5_7");

    const bolt = getPersona("bolt");
    expect(bolt.name).toBe("Bolt the Hacker");
    expect(bolt.ageGroup).toBe("UPPER_11_12");
  });

  it("getPersonaById returns undefined for invalid ID", () => {
    expect(getPersonaById("nonexistent")).toBeUndefined();
    expect(getPersonaById("")).toBeUndefined();
  });

  it("getPersonaById returns persona for valid ID", () => {
    const result = getPersonaById("luna");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Luna the Moon Fairy");
  });

  it("getDefaultPersonaForAgeGroup returns correct defaults", () => {
    expect(getDefaultPersonaForAgeGroup("EARLY_5_7")).toBe("cosmo");
    expect(getDefaultPersonaForAgeGroup("MID_8_10")).toBe("atlas");
    expect(getDefaultPersonaForAgeGroup("UPPER_11_12")).toBe("bolt");
  });

  it("isValidPersonaId validates correctly", () => {
    expect(isValidPersonaId("cosmo")).toBe(true);
    expect(isValidPersonaId("aria")).toBe(true);
    expect(isValidPersonaId("invalid")).toBe(false);
    expect(isValidPersonaId("")).toBe(false);
  });
});

// ─── Unique IDs and voiceIds ───

describe("Persona Config — uniqueness", () => {
  it("all persona IDs are unique", () => {
    const ids = ALL_PERSONAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all voice IDs are non-empty strings", () => {
    ALL_PERSONAS.forEach((p) => {
      expect(typeof p.voiceId).toBe("string");
      expect(p.voiceId.length).toBeGreaterThan(0);
    });
  });

  it("all names are unique", () => {
    const names = ALL_PERSONAS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
