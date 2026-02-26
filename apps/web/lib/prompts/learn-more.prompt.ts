/**
 * Learn More Panel Prompt — generates rich help content for a concept.
 *
 * A single Claude call generates ALL content for the Learn More panel:
 * - Watch Tab: definition + animated step-by-step walkthrough
 * - Examples Tab: 3 worked examples with progressive steps
 * - Ask Tab: 5 pre-generated FAQs as fallback
 *
 * Subject-aware (Math vs ELA) using the same pattern as other prompts.
 */

import type { LearnMoreContent } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  isELASubject,
  type AgeGroupValue,
} from "./types";

export interface LearnMorePromptParams {
  nodeTitle: string;
  nodeDescription: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  ageGroup: AgeGroupValue;
  personaId: string;
}

export function buildLearnMorePrompt(params: LearnMorePromptParams): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const subjectLabel = isELASubject(params.domain)
    ? "English/grammar"
    : "math";

  return `You are ${persona}, an AI ${subjectLabel} tutor creating help content for a student.

PERSONALITY: ${tone}
LANGUAGE LEVEL: ${ageInst}

CONCEPT: "${params.nodeTitle}"
DESCRIPTION: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10

TASK: Generate comprehensive help content for this concept. This content will be shown in a "Learn More" help panel that students can open during practice.

Generate ALL of the following in a single JSON response:

1. "definition" — A single clear sentence defining the concept in student-friendly language.

2. "steps" — An array of 4-6 step-by-step teaching steps. Each step has:
   - "label": Short title (e.g., "Step 1: Find the numbers")
   - "visual": An emoji + short visual representation (e.g., "🔢 3 + 4 = ?")
   - "narration": 2-3 sentences explaining this step. Write as if speaking to the student. Use ${persona}'s personality.

3. "examples" — An array of exactly 3 worked examples, increasing in difficulty. Each has:
   - "problem": The problem statement
   - "steps": Array of 3-5 solution steps as strings (e.g., ["First, identify the numbers: 5 and 3", "Add them: 5 + 3 = 8"])
   - "answer": The final answer
   - "tip": A key insight or trick for this type of problem (1 sentence)

4. "faqs" — An array of exactly 5 frequently asked questions students might have. Each has:
   - "question": A question a student might ask (in kid-friendly language)
   - "answer": A clear, concise answer (2-3 sentences max)

IMPORTANT RULES:
- ALL content must be age-appropriate for grade ${params.gradeLevel}
- Use ${persona}'s personality and tone throughout
- Steps should build on each other logically
- Examples should progress from easy → medium → harder
- FAQs should address common confusions and misconceptions
- Keep narrations TTS-friendly (no special characters, abbreviations, or markdown)
- Keep all text concise — students have short attention spans

OUTPUT FORMAT (JSON):
{
  "definition": "A fraction shows parts of a whole, like cutting a pizza into equal slices!",
  "steps": [
    {
      "label": "Step 1: Understand the concept",
      "visual": "🍕 1 whole pizza",
      "narration": "Hey there! Let me show you something cool about fractions..."
    }
  ],
  "examples": [
    {
      "problem": "What fraction of the pizza is left if you eat 2 out of 8 slices?",
      "steps": ["Start with 8 slices total", "You ate 2 slices", "Remaining: 8 - 2 = 6 slices", "Fraction left: 6/8"],
      "answer": "6/8 (or 3/4)",
      "tip": "The bottom number (denominator) is the total, the top (numerator) is the part!"
    }
  ],
  "faqs": [
    {
      "question": "Why do we need fractions?",
      "answer": "Fractions help us talk about parts of things! Like when you share a cookie with a friend, each person gets 1/2."
    }
  ]
}

Respond ONLY with valid JSON.`;
}

/**
 * Build a prompt for the live Q&A feature in the Ask tab.
 */
export function buildAskPrompt(
  params: LearnMorePromptParams,
  studentQuestion: string,
  studentName: string
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);

  return `You are ${persona}, an AI tutor answering a student's question.

PERSONALITY: ${tone}
STUDENT: ${studentName}
LANGUAGE LEVEL: ${ageInst}

CONCEPT: "${params.nodeTitle}"
DESCRIPTION: ${params.nodeDescription}
GRADE: ${params.gradeLevel}

THE STUDENT ASKS: "${studentQuestion}"

TASK: Answer the student's question about this concept.

RULES:
1. Keep your answer under 150 words
2. Use simple, age-appropriate language
3. Use ${persona}'s personality
4. If the question is off-topic, gently redirect back to the concept
5. Include a concrete example if helpful
6. Be encouraging — they're asking because they want to learn!

OUTPUT FORMAT (JSON):
{
  "answer": "Your helpful answer here"
}

Respond ONLY with valid JSON.`;
}

/**
 * Parse the Learn More content response from Claude.
 */
export function parseLearnMoreResponse(
  rawResponse: string
): LearnMoreContent | null {
  try {
    let cleaned = rawResponse.replace(/```(?:json)?\n?|\n?```/g, "").trim();

    if (!cleaned.startsWith("{")) {
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
    }

    const parsed = JSON.parse(cleaned);

    // Validate structure
    if (
      !parsed.definition ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length < 2 ||
      !Array.isArray(parsed.examples) ||
      parsed.examples.length < 1 ||
      !Array.isArray(parsed.faqs) ||
      parsed.faqs.length < 1
    ) {
      console.error("[learn-more] Invalid structure in parsed response");
      return null;
    }

    return {
      definition: parsed.definition,
      steps: parsed.steps.map(
        (s: { label?: string; visual?: string; narration?: string }) => ({
          label: s.label || "Step",
          visual: s.visual || "📚",
          narration: s.narration || "",
        })
      ),
      examples: parsed.examples.map(
        (e: {
          problem?: string;
          steps?: string[];
          answer?: string;
          tip?: string;
        }) => ({
          problem: e.problem || "",
          steps: Array.isArray(e.steps) ? e.steps : [],
          answer: e.answer || "",
          tip: e.tip || "",
        })
      ),
      faqs: parsed.faqs.map(
        (f: { question?: string; answer?: string }) => ({
          question: f.question || "",
          answer: f.answer || "",
        })
      ),
    };
  } catch (err) {
    console.error(
      "[learn-more] FAILED to parse Claude response:",
      err instanceof Error ? err.message : err,
      "| Raw (first 500):",
      rawResponse?.substring(0, 500) ?? "NULL"
    );
    return null;
  }
}

/**
 * Parse the Ask Q&A response from Claude.
 */
export function parseAskResponse(rawResponse: string): string | null {
  try {
    let cleaned = rawResponse.replace(/```(?:json)?\n?|\n?```/g, "").trim();

    if (!cleaned.startsWith("{")) {
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
    }

    const parsed = JSON.parse(cleaned);
    return parsed.answer || null;
  } catch {
    return null;
  }
}
