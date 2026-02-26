/**
 * Step-Aware Question Generation — Steps 2-5 of the 5-step learning loop.
 *
 * Generates different question types based on the learning step:
 * - Step 2 (check_understanding): Real comprehension check, all 4 options plausible
 * - Step 3 (guided_practice): Easier problems, remediation on wrong answers
 * - Step 4 (independent_practice): Harder problems, no scaffolding
 * - Step 5 (mastery_proof): Transfer to completely new context
 *
 * Also generates remediation content when a student gets a guided practice question wrong.
 */

import type { PromptParams, PracticeResponse, LearningStepType, RemediationResponse } from "./types";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  getEmotionalInstruction,
  isELASubject,
} from "./types";

/**
 * Build a prompt for a specific learning step.
 */
export function buildStepPrompt(
  params: PromptParams,
  stepType: LearningStepType,
  context?: { previousQuestions?: string }
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);
  const emoInst = getEmotionalInstruction(params.currentEmotionalState);
  const subjectLabel = isELASubject(params.domain) ? "English/grammar" : "math";
  const avoidPrevious = context?.previousQuestions
    ? `\nIMPORTANT: Do NOT repeat these questions: ${context.previousQuestions}. Generate a DIFFERENT question.`
    : "";

  const baseContext = `You are ${persona}, an AI ${subjectLabel} tutor.

PERSONALITY: ${tone}
STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}
EMOTIONAL STATE: ${emoInst}

CONCEPT: "${params.nodeTitle}" (${params.nodeCode})
DESCRIPTION: ${params.nodeDescription}
GRADE: ${params.gradeLevel} | DOMAIN: ${params.domain} | DIFFICULTY: ${params.difficulty}/10
${avoidPrevious}`;

  switch (stepType) {
    case "check_understanding":
      return buildCheckUnderstandingPrompt(baseContext, params);
    case "guided_practice":
      return buildGuidedPracticePrompt(baseContext, params);
    case "independent_practice":
      return buildIndependentPracticePrompt(baseContext, params);
    case "mastery_proof":
      return buildMasteryProofPrompt(baseContext, params);
  }
}

/** Step 2: Comprehension check — all 4 options are real, plausible answers */
function buildCheckUnderstandingPrompt(base: string, params: PromptParams): string {
  return `${base}

TASK: Generate a COMPREHENSION CHECK question to verify ${params.studentName} understood the concept.

STRICT RULES:
1. Create ONE multiple choice question that tests conceptual understanding (not memorization)
2. ALL 4 options (A, B, C, D) must be REAL, PLAUSIBLE answers — NO throwaway options
3. NO options like "Yes!", "Not sure yet", "I don't know", or "All of the above"
4. The correct answer must NOT contain the calculation or give away the answer
5. Each wrong option should represent a common misunderstanding
6. Frame it using a concrete example (e.g., "Which word in this sentence is a noun: 'The happy dog ran fast'?")
7. Keep it at the SAME difficulty level as the teaching — this is a check, not a trick

OUTPUT FORMAT (JSON):
{
  "questionText": "A concrete question testing understanding of the concept",
  "options": [
    {"id": "A", "text": "Plausible answer 1", "isCorrect": false},
    {"id": "B", "text": "Plausible answer 2", "isCorrect": true},
    {"id": "C", "text": "Plausible answer 3", "isCorrect": false},
    {"id": "D", "text": "Plausible answer 4", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Clear explanation of why B is correct and what the others represent"
}

Respond ONLY with valid JSON.`;
}

/** Step 3: Guided practice — easier problems, scaffolded */
function buildGuidedPracticePrompt(base: string, params: PromptParams): string {
  return `${base}

TASK: Generate a GUIDED PRACTICE problem for ${params.studentName}.

This is scaffolded practice — make it accessible but meaningful:
1. Create ONE multiple choice question that applies the concept
2. Difficulty: EASY to MODERATE (this is practice, not a test)
3. All 4 options must be plausible (no throwaway answers)
4. The question should test APPLICATION of the concept, not just recall
5. Include a thorough explanation that teaches even if they get it wrong

OUTPUT FORMAT (JSON):
{
  "questionText": "A practice problem applying the concept",
  "options": [
    {"id": "A", "text": "Plausible answer 1", "isCorrect": false},
    {"id": "B", "text": "Plausible answer 2", "isCorrect": true},
    {"id": "C", "text": "Plausible answer 3", "isCorrect": false},
    {"id": "D", "text": "Plausible answer 4", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Detailed explanation of the correct answer and why each wrong answer is incorrect"
}

Respond ONLY with valid JSON.`;
}

/** Step 4: Independent practice — harder, no hints */
function buildIndependentPracticePrompt(base: string, params: PromptParams): string {
  return `${base}

TASK: Generate an INDEPENDENT PRACTICE problem for ${params.studentName}.

This is a real test of understanding — make it challenging:
1. Create ONE multiple choice question that is HARDER than guided practice
2. Difficulty: MODERATE to HARD
3. Require the student to APPLY the concept to a new situation, not just recall
4. All 4 options must be plausible and tricky — common mistakes as wrong answers
5. The question should require multi-step thinking or combining with prior knowledge
6. Include a brief explanation (student only sees it after answering)

OUTPUT FORMAT (JSON):
{
  "questionText": "A challenging problem requiring application of the concept",
  "options": [
    {"id": "A", "text": "Plausible answer 1", "isCorrect": false},
    {"id": "B", "text": "Plausible answer 2", "isCorrect": true},
    {"id": "C", "text": "Plausible answer 3", "isCorrect": false},
    {"id": "D", "text": "Plausible answer 4", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Brief explanation of the correct answer"
}

Respond ONLY with valid JSON.`;
}

/** Step 5: Mastery proof — transfer to completely new context */
function buildMasteryProofPrompt(base: string, params: PromptParams): string {
  const isELA = isELASubject(params.domain);
  const transferExample = isELA
    ? "Instead of identifying a noun in a sentence, ask them to pick a sentence that correctly uses 3 different nouns."
    : "Instead of solving 3+4, ask them to find which real-world situation uses this math concept.";

  return `${base}

TASK: Generate a MASTERY PROOF question for ${params.studentName}.

This question must prove TRANSFER — the student can apply the concept in a COMPLETELY NEW context they have NOT seen:
1. Do NOT use the same format as previous questions
2. Instead of the typical identify/solve format, require CREATIVE APPLICATION
3. ${transferExample}
4. The question should prove the student truly understands, not just memorized a pattern
5. All 4 options must be plausible
6. This is the FINAL test — if they get this right, they have mastered the concept

OUTPUT FORMAT (JSON):
{
  "questionText": "A transfer question applying the concept in a completely new way",
  "options": [
    {"id": "A", "text": "Plausible answer 1", "isCorrect": false},
    {"id": "B", "text": "Plausible answer 2", "isCorrect": true},
    {"id": "C", "text": "Plausible answer 3", "isCorrect": false},
    {"id": "D", "text": "Plausible answer 4", "isCorrect": false}
  ],
  "correctAnswer": "B",
  "explanation": "Explanation of why this proves mastery of the concept"
}

Respond ONLY with valid JSON.`;
}

/**
 * Build a remediation prompt for when a student gets a guided practice question wrong.
 * Explains exactly what went wrong and re-teaches with a new example.
 */
export function buildRemediationPrompt(
  params: PromptParams,
  questionText: string,
  studentAnswer: string,
  correctAnswer: string,
  explanation: string
): string {
  const persona = getPersonaName(params.personaId);
  const tone = getPersonaTone(params.personaId);
  const ageInst = getAgeInstruction(params.ageGroup);

  return `You are ${persona}, an AI tutor helping a student who got a question wrong.

PERSONALITY: ${tone}
STUDENT: ${params.studentName} (age group: ${params.ageGroup})
LANGUAGE LEVEL: ${ageInst}

CONCEPT: "${params.nodeTitle}"
DESCRIPTION: ${params.nodeDescription}

THE QUESTION WAS: ${questionText}
STUDENT ANSWERED: ${studentAnswer}
CORRECT ANSWER WAS: ${correctAnswer}
EXPLANATION: ${explanation}

TASK: Help ${params.studentName} understand what went wrong. Be kind but specific:
1. "whatWentWrong": Explain EXACTLY which part of their thinking was incorrect (1-2 sentences). Don't just say "wrong" — identify the specific misunderstanding.
2. "reExplanation": Re-explain the concept using DIFFERENT words and a DIFFERENT approach than the original teaching (2-3 sentences).
3. "newExample": Give a NEW concrete example that specifically addresses their mistake (1-2 sentences).

Be encouraging! This is a learning moment, not a failure.

OUTPUT FORMAT (JSON):
{
  "whatWentWrong": "Specific explanation of the student's misunderstanding",
  "reExplanation": "The concept re-explained with a different approach",
  "newExample": "A new example that addresses their specific mistake"
}

Respond ONLY with valid JSON.`;
}

export function parseStepResponse(rawResponse: string): PracticeResponse {
  try {
    // Strategy 1: Strip markdown code blocks and parse
    let cleaned = rawResponse.replace(/```(?:json)?\n?|\n?```/g, "").trim();

    // Strategy 2: If that doesn't start with {, extract JSON object from the text
    if (!cleaned.startsWith("{")) {
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
    }

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
  } catch (err) {
    console.error(
      "[parseStepResponse] FAILED to parse Claude response:",
      err instanceof Error ? err.message : err,
      "| Raw response (first 500 chars):",
      rawResponse?.substring(0, 500) ?? "NULL"
    );
    return {
      questionText: "Which of these is correct?",
      options: [
        { id: "A", text: "Option A", isCorrect: false },
        { id: "B", text: "Option B", isCorrect: true },
        { id: "C", text: "Option C", isCorrect: false },
        { id: "D", text: "Option D", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "Let's try another one.",
    };
  }
}

export function parseRemediationResponse(rawResponse: string): RemediationResponse {
  try {
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      whatWentWrong: parsed.whatWentWrong || "Let's look at this more carefully.",
      reExplanation: parsed.reExplanation || "Let me explain this in a different way.",
      newExample: parsed.newExample || "Here's another way to think about it.",
    };
  } catch {
    return {
      whatWentWrong: "That's not quite right, but you're on the right track!",
      reExplanation: "Let me explain this concept in a different way.",
      newExample: "Let's look at a different example to make this clearer.",
    };
  }
}
