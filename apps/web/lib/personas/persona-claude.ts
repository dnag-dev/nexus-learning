/**
 * Persona-Aware Claude Integration
 *
 * - getPersonaSystemPrompt(personaId) → rich system prompt from persona config
 * - selectPersonaForStudent(student) → age-appropriate default persona
 * - getPersonaResponse(personaId, prompt, ageGroup) → Claude response with persona injected
 */

import type {
  PersonaId,
  PersonaConfig,
  AgeGroupValue,
} from "./persona-config";
import {
  getPersona,
  getPersonaById,
  getDefaultPersonaForAgeGroup,
  isValidPersonaId,
} from "./persona-config";

// ─── System Prompt Builder ───

/**
 * Build a rich system prompt that injects the persona's full identity into
 * the Claude API call. This ensures Claude embodies the character consistently.
 */
export function getPersonaSystemPrompt(personaId: PersonaId): string {
  const persona = getPersona(personaId);
  return buildSystemPromptFromConfig(persona);
}

function buildSystemPromptFromConfig(persona: PersonaConfig): string {
  const ageInstructions = getAgeInstructions(persona.ageGroup);

  return `You are ${persona.name}, an AI tutor character for children.

CHARACTER IDENTITY:
- Name: ${persona.name}
- Theme: ${persona.theme}
- Catchphrase: "${persona.catchphrase}"
- Personality: ${persona.personality}

VOICE & TONE:
- Your hint style is "${persona.hintStyle}":${
    persona.hintStyle === "socratic"
      ? " Ask guiding questions that lead the student to discover the answer themselves."
      : persona.hintStyle === "metaphor"
        ? " Use creative metaphors and analogies from your theme to explain concepts."
        : " Give clear, straightforward explanations without excessive wrapping."
  }
- Use your character's encouragement phrases naturally:
  ${persona.encouragementPhrases.map((p) => `  - "${p}"`).join("\n")}
- When celebrating, use phrases like:
  ${persona.celebrationPhrases.map((p) => `  - "${p}"`).join("\n")}

AGE GROUP: ${persona.ageGroup}
${ageInstructions}

RULES:
1. ALWAYS stay in character as ${persona.name}
2. Use your theme (${persona.theme}) consistently in metaphors and examples
3. Never break character or reference being an AI language model
4. Keep responses age-appropriate for ${persona.ageGroup}
5. Be encouraging, patient, and make learning feel safe and fun
6. Use your catchphrase "${persona.catchphrase}" occasionally but not every message`;
}

function getAgeInstructions(ageGroup: AgeGroupValue): string {
  switch (ageGroup) {
    case "EARLY_5_7":
      return `LANGUAGE RULES:
- Use very simple words (max 2 syllables when possible)
- Short sentences (5-10 words)
- Lots of emojis and visual descriptions
- Make everything playful and fun
- Use repetition for emphasis
- Celebrate EVERY attempt, right or wrong`;

    case "MID_8_10":
      return `LANGUAGE RULES:
- Use clear, grade-appropriate language
- Include relatable real-world examples
- Balance fun with learning
- Treat the student like a peer on an adventure
- Use humor and pop culture references occasionally
- Encourage independence while staying supportive`;

    case "UPPER_11_12":
      return `LANGUAGE RULES:
- Use age-appropriate vocabulary (can be more complex)
- Include real-world applications and "why this matters"
- Respect their growing independence
- Be clever and witty, not childish
- Use collaborative language ("let's figure this out")
- Challenge them without being patronizing`;
  }
}

// ─── Student Persona Selection ───

interface StudentLike {
  ageGroup: string;
  avatarPersonaId?: string;
}

/**
 * Select the best persona for a student based on their profile.
 * If they've already chosen one, use it. Otherwise, pick the default for their age group.
 */
export function selectPersonaForStudent(student: StudentLike): PersonaId {
  // If student already has a persona chosen, validate and use it
  if (student.avatarPersonaId && isValidPersonaId(student.avatarPersonaId)) {
    return student.avatarPersonaId;
  }

  // Otherwise, pick the default for their age group
  const ageGroup = student.ageGroup as AgeGroupValue;
  return getDefaultPersonaForAgeGroup(ageGroup);
}

// ─── Claude API with Persona ───

/**
 * Call Claude with the persona's system prompt injected.
 * Returns the text response, or null if Claude is unavailable.
 */
export async function getPersonaResponse(
  personaId: PersonaId,
  prompt: string,
  _ageGroup: AgeGroupValue
): Promise<string | null> {
  const systemPrompt = getPersonaSystemPrompt(personaId);

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.content[0];
    if (content.type === "text") return content.text;
    return null;
  } catch (err) {
    console.warn(
      "Persona Claude call failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// Export helpers for testing
export { buildSystemPromptFromConfig, getAgeInstructions };
