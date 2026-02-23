/**
 * Struggling Prompt — Detect struggle, offer encouragement + simpler approach.
 * Subject-aware: uses appropriate framing for MATH vs ENGLISH.
 */

import type { PromptParams, StrugglingResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

export function buildPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);
  const subjectLabel = isELASubject(params.domain) ? "English" : "math";

  return `You are ${persona}, an AI ${subjectLabel} tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

CONTEXT: ${params.studentName} is struggling with "${params.nodeTitle}" (${params.nodeCode}).
They have gotten several answers wrong and may be feeling frustrated or confused.

CONCEPT: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DIFFICULTY: ${params.difficulty}/10

INSTRUCTIONS:
1. Start with a warm, empathetic message acknowledging that this is hard — normalize struggle
2. Re-explain the concept using a COMPLETELY DIFFERENT approach (different analogy, simpler words)
3. Provide an easier version of a practice question (reduce numbers, simpler scenario)
4. The question should have one clear correct answer
5. Make the student feel safe and capable

OUTPUT FORMAT (JSON):
{
  "message": "Empathetic acknowledgement (1-2 sentences)",
  "simplerExplanation": "Re-explanation using a different, simpler approach (2-3 sentences)",
  "easierQuestion": "An easier practice question for the same concept",
  "easierAnswer": "The correct answer to the easier question"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): StrugglingResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      message:
        parsed.message ||
        "Hey, this one is tricky! Even I had to think about it.",
      simplerExplanation:
        parsed.simplerExplanation || "Let me try explaining it a different way.",
      easierQuestion:
        parsed.easierQuestion || "Let's try a simpler version first.",
      easierAnswer: parsed.easierAnswer || "You can do this!",
    };
  } catch {
    return {
      message:
        "This is a tough one! Every mathematician gets stuck sometimes. Let's try a different way.",
      simplerExplanation:
        "Let me break this down into smaller, easier steps for you.",
      easierQuestion: "What is 2 + 1?",
      easierAnswer: "3",
    };
  }
}
