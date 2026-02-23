/**
 * Practice Prompt — Generate a practice question for a node.
 * Subject-aware: uses different prompt templates for MATH vs ENGLISH.
 */

import type { PromptParams, PracticeResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

export function buildPrompt(params: PromptParams): string {
  // Route to ELA prompt if this is an English node
  if (isELASubject(params.domain)) {
    return buildELAPrompt(params);
  }
  return buildMathPrompt(params);
}

/** Math practice prompt (original behavior, unchanged) */
function buildMathPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  const difficultyNote =
    params.bktProbability !== undefined
      ? `Student's current mastery: ${Math.round(params.bktProbability * 100)}%. Adjust difficulty accordingly — ${
          params.bktProbability < 0.4
            ? "make it easier"
            : params.bktProbability < 0.7
              ? "moderate difficulty"
              : "make it challenging"
        }.`
      : "";

  return `You are ${persona}, an AI math tutor.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

TASK: Generate a practice question for "${params.nodeTitle}" (${params.nodeCode}).
CONCEPT: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10
${difficultyNote}

INSTRUCTIONS:
1. Create one age-appropriate math question for this concept
2. Include exactly 4 answer options (A, B, C, D)
3. Exactly ONE option must be correct
4. Wrong options should be plausible (common mistakes)
5. Include a brief explanation for why the correct answer is right
6. Frame the question in a fun way using ${persona}'s personality

OUTPUT FORMAT (JSON):
{
  "questionText": "The question text",
  "options": [
    {"id": "A", "text": "First option", "isCorrect": false},
    {"id": "B", "text": "Second option", "isCorrect": true},
    {"id": "C", "text": "Third option", "isCorrect": false},
    {"id": "D", "text": "Fourth option", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Why this is the right answer"
}

Respond ONLY with valid JSON.`;
}

/** ELA practice prompt — grammar/language arts question generation */
function buildELAPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  const difficultyNote =
    params.bktProbability !== undefined
      ? `Student's current mastery: ${Math.round(params.bktProbability * 100)}%. Adjust difficulty accordingly — ${
          params.bktProbability < 0.4
            ? "make it easier"
            : params.bktProbability < 0.7
              ? "moderate difficulty"
              : "make it challenging"
        }.`
      : "";

  return `You are ${persona}, an English tutor generating a grammar/language arts practice question for a student.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

Generate a single multiple choice question about "${params.nodeTitle}" (${params.nodeCode}).
CONCEPT: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10
${difficultyNote}

INSTRUCTIONS:
1. Use a real, interesting sentence as the example (not made up nonsense)
2. Include exactly 4 answer choices (A, B, C, D)
3. Exactly ONE option must be correct
4. The 3 wrong answers should be plausible and genuinely tricky (not obviously wrong)
5. The question should be appropriate for grade ${params.gradeLevel} difficulty level ${params.difficulty}
6. Include a brief explanation of why the correct answer is right (1-2 sentences)
7. Teach the student something even if they get it wrong
8. Frame the question in a fun way using ${persona}'s personality

OUTPUT FORMAT (JSON):
{
  "questionText": "The question text, including any example sentence",
  "options": [
    {"id": "A", "text": "First option", "isCorrect": false},
    {"id": "B", "text": "Second option", "isCorrect": true},
    {"id": "C", "text": "Third option", "isCorrect": false},
    {"id": "D", "text": "Fourth option", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Brief explanation of why this is correct, 1-2 sentences"
}

Respond ONLY with valid JSON.`;
}

export function parseResponse(rawResponse: string): PracticeResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      !parsed.options ||
      parsed.options.length !== 4 ||
      !parsed.options.some((o: { isCorrect: boolean }) => o.isCorrect)
    ) {
      throw new Error("Invalid options format");
    }

    return {
      questionText: parsed.questionText,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
    };
  } catch {
    // Fallback — this gets overridden per-subject in the route handler
    return {
      questionText: "What is 3 + 4?",
      options: [
        { id: "A", text: "6", isCorrect: false },
        { id: "B", text: "7", isCorrect: true },
        { id: "C", text: "8", isCorrect: false },
        { id: "D", text: "5", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "3 + 4 = 7",
    };
  }
}
