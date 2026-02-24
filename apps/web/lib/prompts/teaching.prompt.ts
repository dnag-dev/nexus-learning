/**
 * Teaching Prompt — Step 1 of the 5-step learning loop.
 *
 * Generates rich teaching content with:
 * - Hook question that makes the student curious
 * - Clear definition in simple language
 * - 2 concrete examples with the concept highlighted
 * - 1 common mistake kids make and why it's wrong
 *
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

/** Math teaching prompt — 5-step learning loop (Step 1: TEACH IT) */
function buildMathTeachingPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  return `You are ${persona}, an AI math tutor for children.

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

TASK: Teach the concept "${params.nodeTitle}" (${params.nodeCode}) to ${params.studentName}.
CONCEPT DESCRIPTION: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10

INSTRUCTIONS — You must include ALL of the following:
1. "emoji": Pick a single emoji that best represents this concept
2. "hook": Write ONE curiosity-provoking question (max 20 words) that makes ${params.studentName} wonder about this topic. NOT a yes/no question — something that makes them think.
3. "explanation": A clear definition in simple language, 3-4 sentences. Define the concept, explain what it does, and why it matters.
4. "example": First concrete example with the concept HIGHLIGHTED. Use a real-world scenario. Bold the key part using **asterisks**.
5. "example2": Second concrete example, different context. Also highlight the key concept with **asterisks**.
6. "commonMistake": Describe ONE common mistake kids make with this concept. Start with "Many students think..." or "A common mistake is..."
7. "commonMistakeWhy": Explain WHY that mistake is wrong in 1-2 sentences. Be specific.

HARD LIMITS:
- Hook: 1 question, max 20 words
- Explanation: 3-4 sentences
- Each example: 1-3 sentences
- Total under 250 words (excluding JSON keys)

OUTPUT FORMAT (JSON):
{
  "emoji": "single emoji",
  "hook": "A curiosity-provoking question",
  "explanation": "Clear definition in 3-4 sentences",
  "example": "First real-world example with **concept highlighted**",
  "example2": "Second real-world example with **concept highlighted**",
  "commonMistake": "Many students think...",
  "commonMistakeWhy": "This is wrong because..."
}

Respond ONLY with valid JSON.`;
}

/** ELA teaching prompt — 5-step learning loop (Step 1: TEACH IT) */
function buildELATeachingPrompt(params: PromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);

  return `You are ${persona}, a friendly English tutor teaching "${params.nodeTitle}".

PERSONALITY: ${tone}

STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

CONCEPT: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10

INSTRUCTIONS — You must include ALL of the following:
1. "emoji": Pick a single emoji that best represents this concept
2. "hook": Write ONE curiosity-provoking question (max 20 words) that makes ${params.studentName} wonder about this grammar/language topic. NOT a yes/no question.
3. "explanation": A clear definition in simple language, 3-4 sentences. What is it, how does it work, and why do we need it.
4. "example": First example sentence that demonstrates the concept. **Bold** the relevant words. Example: "In the sentence 'The **cat** sat on the **mat**', cat and mat are nouns."
5. "example2": Second example sentence in a DIFFERENT context. **Bold** the relevant words.
6. "commonMistake": ONE common mistake kids make. Start with "Many students think..." or "A common mistake is..."
7. "commonMistakeWhy": Why that mistake is wrong, in 1-2 specific sentences.

HARD LIMITS:
- Hook: 1 question, max 20 words
- Explanation: 3-4 sentences
- Each example: 1-3 sentences with the concept highlighted
- Total under 250 words

OUTPUT FORMAT (JSON):
{
  "emoji": "single emoji",
  "hook": "A curiosity-provoking question",
  "explanation": "Clear definition in 3-4 sentences",
  "example": "First example with **concept highlighted**",
  "example2": "Second example with **concept highlighted**",
  "commonMistake": "Many students think...",
  "commonMistakeWhy": "This is wrong because..."
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
      example: parsed.example || "You'll see this in everyday life.",
      example2: parsed.example2 || "",
      commonMistake: parsed.commonMistake || "",
      commonMistakeWhy: parsed.commonMistakeWhy || "",
      // Legacy fields — no longer used for comprehension check (now Step 2)
      checkQuestion: parsed.checkQuestion || "",
      checkAnswer: parsed.checkAnswer || "",
    };
  } catch {
    return {
      emoji: "📚",
      hook: "Let's learn something new today!",
      explanation: "This is an exciting concept we're going to explore together.",
      example: "You'll see this all around you in everyday life.",
      example2: "",
      commonMistake: "",
      commonMistakeWhy: "",
      checkQuestion: "",
      checkAnswer: "",
    };
  }
}
