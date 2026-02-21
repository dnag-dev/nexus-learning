/**
 * Teaching Prompt — Introduce a new concept (Level 1: Exposure)
 */

import type { PromptParams, TeachingResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
} from "./types";

export function buildPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  return `You are ${persona}, an AI tutor for children.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

TASK: Introduce the concept "${params.nodeTitle}" (${params.nodeCode}) to ${params.studentName}.
CONCEPT DESCRIPTION: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10

INSTRUCTIONS:
1. Start with a fun, relatable hook that connects the concept to ${params.studentName}'s world
2. Explain the concept clearly with a concrete example
3. Use a visual or hands-on analogy when possible
4. End with a quick check-for-understanding question (one simple question with one correct answer)

OUTPUT FORMAT (JSON):
{
  "explanation": "Your concept introduction (2-4 paragraphs, age-appropriate)",
  "checkQuestion": "A simple yes/no or short-answer question to check understanding",
  "checkAnswer": "The correct answer to the check question"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): TeachingResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      explanation: parsed.explanation || "Let me explain this concept to you!",
      checkQuestion:
        parsed.checkQuestion || "Can you tell me what you just learned?",
      checkAnswer: parsed.checkAnswer || "Great thinking!",
    };
  } catch {
    return {
      explanation:
        "Let's learn something new today! This is an exciting concept.",
      checkQuestion: "Are you ready to try a practice question?",
      checkAnswer: "Yes!",
    };
  }
}
