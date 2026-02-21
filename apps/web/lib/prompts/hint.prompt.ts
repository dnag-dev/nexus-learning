/**
 * Hint Prompt — Give a hint without giving the answer
 */

import type { PromptParams, HintResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
} from "./types";

export function buildPrompt(
  params: PromptParams & { questionText: string; studentAnswer?: string }
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  return `You are ${persona}, an AI math tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

TASK: Give a helpful hint for this problem WITHOUT revealing the answer.
CONCEPT: ${params.nodeTitle} (${params.nodeCode})
QUESTION: ${params.questionText}
${params.studentAnswer ? `STUDENT'S WRONG ANSWER: ${params.studentAnswer}` : ""}

INSTRUCTIONS:
1. Do NOT give the answer directly
2. Point the student in the right direction with a small nudge
3. Use a visual or concrete example if possible
4. Be encouraging — make the student feel they CAN figure it out
5. Keep it short (1-2 sentences max for the hint)

OUTPUT FORMAT (JSON):
{
  "hint": "A short, helpful hint that nudges toward the right approach",
  "encouragement": "A brief encouraging message in ${persona}'s voice"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): HintResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      hint: parsed.hint || "Try thinking about it a different way!",
      encouragement:
        parsed.encouragement || "You're doing great — keep trying!",
    };
  } catch {
    return {
      hint: "Try breaking the problem into smaller steps!",
      encouragement: "You've got this!",
    };
  }
}
