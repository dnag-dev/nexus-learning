/**
 * Persona-Claude Integration Tests
 * - System prompt contains persona name and catchphrase
 * - selectPersonaForStudent picks correct persona
 */

import { describe, it, expect } from "vitest";
import {
  getPersonaSystemPrompt,
  selectPersonaForStudent,
  buildSystemPromptFromConfig,
  getAgeInstructions,
} from "../lib/personas/persona-claude";
import {
  ALL_PERSONAS,
  getPersona,
} from "../lib/personas/persona-config";
import type { PersonaId } from "../lib/personas/persona-config";

// ─── System Prompt Contains Persona Name and Catchphrase ───

describe("Persona-Claude — getPersonaSystemPrompt", () => {
  ALL_PERSONAS.forEach((persona) => {
    describe(`${persona.id}`, () => {
      it("contains persona name", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.name);
      });

      it("contains catchphrase", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.catchphrase);
      });

      it("contains theme", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.theme);
      });

      it("contains personality description", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.personality);
      });

      it("contains hint style", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.hintStyle);
      });

      it("contains encouragement phrases", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        persona.encouragementPhrases.forEach((phrase) => {
          expect(prompt).toContain(phrase);
        });
      });

      it("contains celebration phrases", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        persona.celebrationPhrases.forEach((phrase) => {
          expect(prompt).toContain(phrase);
        });
      });

      it("contains age group", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(prompt).toContain(persona.ageGroup);
      });

      it("is a non-empty string", () => {
        const prompt = getPersonaSystemPrompt(persona.id as PersonaId);
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(100);
      });
    });
  });
});

// ─── buildSystemPromptFromConfig ───

describe("Persona-Claude — buildSystemPromptFromConfig", () => {
  it("includes CHARACTER IDENTITY section", () => {
    const persona = getPersona("cosmo");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("CHARACTER IDENTITY");
    expect(prompt).toContain("Name: Cosmo the Robot");
  });

  it("includes VOICE & TONE section", () => {
    const persona = getPersona("luna");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("VOICE & TONE");
    expect(prompt).toContain("metaphor");
  });

  it("includes RULES section", () => {
    const persona = getPersona("rex");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("RULES");
    expect(prompt).toContain("ALWAYS stay in character");
  });

  it("includes hint style instructions for socratic", () => {
    const persona = getPersona("pip");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("guiding questions");
  });

  it("includes hint style instructions for direct", () => {
    const persona = getPersona("cosmo");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("straightforward");
  });

  it("includes hint style instructions for metaphor", () => {
    const persona = getPersona("luna");
    const prompt = buildSystemPromptFromConfig(persona);
    expect(prompt).toContain("metaphors and analogies");
  });
});

// ─── getAgeInstructions ───

describe("Persona-Claude — getAgeInstructions", () => {
  it("EARLY_5_7 mentions simple words", () => {
    const instructions = getAgeInstructions("EARLY_5_7");
    expect(instructions).toContain("simple words");
    expect(instructions).toContain("playful");
  });

  it("MID_8_10 mentions grade-appropriate", () => {
    const instructions = getAgeInstructions("MID_8_10");
    expect(instructions).toContain("grade-appropriate");
    expect(instructions).toContain("peer");
  });

  it("UPPER_11_12 mentions independence", () => {
    const instructions = getAgeInstructions("UPPER_11_12");
    expect(instructions).toContain("independence");
    expect(instructions).toContain("witty");
  });
});

// ─── selectPersonaForStudent ───

describe("Persona-Claude — selectPersonaForStudent", () => {
  it("returns existing persona if student has one", () => {
    const result = selectPersonaForStudent({
      ageGroup: "EARLY_5_7",
      avatarPersonaId: "rex",
    });
    expect(result).toBe("rex");
  });

  it("returns default EARLY_5_7 persona (cosmo) if none set", () => {
    const result = selectPersonaForStudent({
      ageGroup: "EARLY_5_7",
    });
    expect(result).toBe("cosmo");
  });

  it("returns default MID_8_10 persona (atlas) if none set", () => {
    const result = selectPersonaForStudent({
      ageGroup: "MID_8_10",
    });
    expect(result).toBe("atlas");
  });

  it("returns default UPPER_11_12 persona (bolt) if none set", () => {
    const result = selectPersonaForStudent({
      ageGroup: "UPPER_11_12",
    });
    expect(result).toBe("bolt");
  });

  it("falls back to default if persona ID is invalid", () => {
    const result = selectPersonaForStudent({
      ageGroup: "MID_8_10",
      avatarPersonaId: "nonexistent",
    });
    expect(result).toBe("atlas");
  });

  it("falls back to default if persona ID is empty", () => {
    const result = selectPersonaForStudent({
      ageGroup: "UPPER_11_12",
      avatarPersonaId: "",
    });
    expect(result).toBe("bolt");
  });
});
