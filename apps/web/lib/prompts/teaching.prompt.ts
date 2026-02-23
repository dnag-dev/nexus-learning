/**
 * Teaching Prompt — Introduce a new concept (Level 1: Exposure).
 * Subject-aware: uses different prompt templates for MATH vs ENGLISH.
 */

import type { PromptParams, TeachingResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

export function buildPrompt(params: PromptParams): string {
  if (isELASubject(params.domain)) {
    return buildELATeachingPrompt(params);
  }
  return buildMathTeachingPrompt(params);
}

/** Math teaching prompt (original behavior, unchanged) */
function buildMathTeachingPrompt(params: PromptParams): string {
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
1. Pick a single emoji that best represents this concept (e.g. ⚖️ for equal sign, 🍕 for fractions)
2. Write ONE hook sentence (max 20 words) that grabs ${params.studentName}'s attention and connects to their world
3. Explain the core concept in exactly 2-3 sentences — clear, concrete, no fluff
4. Give ONE real-world example ${params.studentName} can picture or try themselves
5. End with a quick comprehension check question (one simple question with one correct answer)

HARD LIMITS:
- Hook: 1 sentence, max 20 words
- Explanation: 2-3 sentences max
- Example: 1-2 sentences max
- Total under 150 words (excluding emoji and JSON keys)

OUTPUT FORMAT (JSON):
{
  "emoji": "single emoji character",
  "hook": "One attention-grabbing sentence",
  "explanation": "Core concept in 2-3 short sentences",
  "example": "One concrete real-world example",
  "checkQuestion": "A simple comprehension check question",
  "checkAnswer": "The correct answer"
}

Respond ONLY with valid JSON.`;
}

/** ELA teaching prompt — grammar/language arts concept introduction */
function buildELATeachingPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  return `You are ${persona}, a friendly English tutor teaching a student about "${params.nodeTitle}".

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

CONCEPT: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10

INSTRUCTIONS:
1. Pick a single emoji that best represents this concept (e.g. 📝 for writing, 📖 for reading)
2. Write ONE hook sentence (max 20 words) — make the student curious about this grammar topic
3. Teach this concept in 3-4 sentences using simple, clear language appropriate for their age
4. Include a memorable real-world example sentence that demonstrates the concept
5. Give one tip or trick to remember this concept
6. End with "Now let's practice!" and a quick comprehension check question

HARD LIMITS:
- Hook: 1 sentence, max 20 words
- Explanation: 3-4 sentences max
- Example: 1-2 sentences max
- Do not use jargon. Make it engaging.
- Total under 150 words (excluding emoji and JSON keys)

OUTPUT FORMAT (JSON):
{
  "emoji": "single emoji character",
  "hook": "One attention-grabbing sentence",
  "explanation": "Core concept in 3-4 short sentences with a tip to remember it",
  "example": "One memorable real-world example sentence",
  "checkQuestion": "A simple comprehension check question ending with Now let's practice!",
  "checkAnswer": "The correct answer"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): TeachingResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      emoji: parsed.emoji || "📚",
      hook: parsed.hook || "Let's learn something amazing!",
      explanation: parsed.explanation || "Let me explain this concept to you!",
      example:
        parsed.example || "You'll see this all around you in everyday life.",
      checkQuestion:
        parsed.checkQuestion || "Can you tell me what you just learned?",
      checkAnswer: parsed.checkAnswer || "Great thinking!",
    };
  } catch {
    return {
      emoji: "📚",
      hook: "Let's learn something new today!",
      explanation:
        "This is an exciting concept we're going to explore together.",
      example: "You'll see this all around you in everyday life.",
      checkQuestion: "Are you ready to try a practice question?",
      checkAnswer: "Yes!",
    };
  }
}
