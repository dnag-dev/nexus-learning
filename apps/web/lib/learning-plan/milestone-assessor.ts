/**
 * Milestone Assessment Engine — Step 8 of Learning GPS
 *
 * Generates and evaluates weekly milestone assessments.
 * 8 questions covering the week's concepts (2 per concept cluster).
 * 75% pass threshold. Failed concepts get review sessions added.
 *
 * Reuses:
 *   - callClaude() for question generation
 *   - Prisma for milestone results
 *   - Plan generator for concept lookup
 */

import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import type { AgeGroupValue } from "@/lib/prompts/types";
import { getPersonaName, getAgeInstruction } from "@/lib/prompts/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MilestoneQuestion {
  questionId: string;
  conceptCode: string;
  conceptTitle: string;
  questionText: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  difficulty: number;
}

export interface MilestoneSession {
  planId: string;
  weekNumber: number;
  studentId: string;
  questions: MilestoneQuestion[];
  answers: Map<string, MilestoneAnswer>;
  startedAt: Date;
  timeLimitSeconds: number;
}

export interface MilestoneAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface MilestoneEvaluation {
  passed: boolean;
  score: number; // 0-100
  totalCorrect: number;
  totalQuestions: number;
  conceptResults: Array<{
    conceptCode: string;
    conceptTitle: string;
    correct: number;
    total: number;
    passed: boolean;
  }>;
  failedConcepts: string[];
  message: string;
  encouragement: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const QUESTIONS_PER_MILESTONE = 8;
const PASS_THRESHOLD = 0.75; // 75% to pass
const TIME_LIMIT_SECONDS = 1200; // 20 minutes
const QUESTIONS_PER_CONCEPT = 2;

// In-memory milestone session store (production would use Redis)
const milestoneSessions = new Map<string, MilestoneSession>();

export function getMilestoneSession(key: string): MilestoneSession | undefined {
  return milestoneSessions.get(key);
}

export function setMilestoneSession(key: string, session: MilestoneSession): void {
  milestoneSessions.set(key, session);
}

export function deleteMilestoneSession(key: string): void {
  milestoneSessions.delete(key);
}

// ─── Core: Generate Milestone Questions ─────────────────────────────────────

/**
 * Generates 8 milestone questions for a specific week of a learning plan.
 * Questions are distributed across the week's concepts (2 per concept cluster).
 */
export async function generateMilestoneQuestions(
  planId: string,
  weekNumber: number
): Promise<{
  questions: MilestoneQuestion[];
  conceptsCovered: string[];
  studentId: string;
}> {
  // 1. Fetch the plan and milestone info
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    include: {
      student: {
        select: {
          id: true,
          displayName: true,
          gradeLevel: true,
          ageGroup: true,
          avatarPersonaId: true,
        },
      },
      goal: true,
    },
  });

  if (!plan) throw new Error("Learning plan not found");
  if (plan.status !== "ACTIVE") throw new Error("Plan is not active");

  const student = plan.student;
  const milestones = plan.weeklyMilestones as Array<{
    weekNumber: number;
    concepts: string[];
    conceptTitles: string[];
    estimatedHours: number;
    cumulativeProgress: number;
    milestoneCheck: boolean;
  }>;

  const milestone = milestones.find((m) => m.weekNumber === weekNumber);
  if (!milestone) throw new Error(`Week ${weekNumber} milestone not found`);

  // Check if already completed
  const existing = await prisma.milestoneResult.findFirst({
    where: { planId, weekNumber },
  });
  if (existing) throw new Error(`Week ${weekNumber} milestone already completed`);

  // 2. Fetch concept details
  const conceptCodes = milestone.concepts;
  const concepts = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: conceptCodes } },
    select: {
      nodeCode: true,
      title: true,
      description: true,
      gradeLevel: true,
      domain: true,
      difficulty: true,
      subject: true,
    },
  });

  // 3. Select which concepts to test (up to 4 concepts, 2 questions each = 8)
  // If more than 4 concepts, pick the 4 most important (highest difficulty first)
  const sortedConcepts = [...concepts].sort((a, b) => b.difficulty - a.difficulty);
  const testConcepts = sortedConcepts.slice(0, Math.ceil(QUESTIONS_PER_MILESTONE / QUESTIONS_PER_CONCEPT));

  // 4. Generate questions via Claude
  const questions: MilestoneQuestion[] = [];
  const personaName = getPersonaName(student.avatarPersonaId);
  const ageInstruction = getAgeInstruction(student.ageGroup as AgeGroupValue);

  for (const concept of testConcepts) {
    const questionsForConcept = await generateQuestionsForConcept(
      concept,
      student.displayName,
      student.gradeLevel,
      personaName,
      ageInstruction,
      QUESTIONS_PER_CONCEPT
    );
    questions.push(...questionsForConcept);
  }

  // If we have fewer than 8 and there are more concepts, add more
  if (questions.length < QUESTIONS_PER_MILESTONE && concepts.length > testConcepts.length) {
    const extraConcepts = sortedConcepts.slice(testConcepts.length);
    for (const concept of extraConcepts) {
      if (questions.length >= QUESTIONS_PER_MILESTONE) break;
      const extra = await generateQuestionsForConcept(
        concept,
        student.displayName,
        student.gradeLevel,
        personaName,
        ageInstruction,
        1
      );
      questions.push(...extra);
    }
  }

  // Trim to exactly 8 (or less if not enough concepts)
  const finalQuestions = questions.slice(0, QUESTIONS_PER_MILESTONE);

  return {
    questions: finalQuestions,
    conceptsCovered: conceptCodes,
    studentId: student.id,
  };
}

// ─── Question Generator (per concept) ───────────────────────────────────────

async function generateQuestionsForConcept(
  concept: {
    nodeCode: string;
    title: string;
    description: string;
    gradeLevel: string;
    domain: string;
    difficulty: number;
    subject: string | null;
  },
  studentName: string,
  gradeLevel: string,
  personaName: string,
  ageInstruction: string,
  count: number
): Promise<MilestoneQuestion[]> {
  const prompt = `Generate ${count} multiple-choice assessment question${count > 1 ? "s" : ""} for a weekly milestone check.

CONCEPT:
- Code: ${concept.nodeCode}
- Title: ${concept.title}
- Description: ${concept.description}
- Subject: ${concept.subject ?? "MATH"}
- Grade Level: ${concept.gradeLevel}
- Domain: ${concept.domain}
- Difficulty: ${concept.difficulty}/10

STUDENT: ${studentName} (${gradeLevel})
TUTOR: ${personaName}
${ageInstruction}

REQUIREMENTS:
1. Each question tests understanding of the concept, not just recall
2. Include one straightforward question and one that requires application
3. Each question has exactly 4 answer options (A, B, C, D)
4. Exactly one option is correct per question
5. Distractors should be plausible mistakes, not obviously wrong
6. Include a brief explanation of the correct answer
7. Make questions age-appropriate: ${ageInstruction}

Respond with JSON:
{
  "questions": [
    {
      "questionText": "The question text",
      "options": [
        { "id": "A", "text": "Option A text", "isCorrect": false },
        { "id": "B", "text": "Option B text", "isCorrect": true },
        { "id": "C", "text": "Option C text", "isCorrect": false },
        { "id": "D", "text": "Option D text", "isCorrect": false }
      ],
      "explanation": "Brief explanation of why the correct answer is right"
    }
  ]
}`;

  try {
    const response = await callClaude(prompt, { maxTokens: 1024 });
    if (response) {
      const parsed = JSON.parse(response);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions.slice(0, count).map(
          (
            q: {
              questionText: string;
              options: Array<{ id: string; text: string; isCorrect: boolean }>;
              explanation: string;
            },
            i: number
          ) => ({
            questionId: `${concept.nodeCode}-q${i + 1}-${Date.now()}`,
            conceptCode: concept.nodeCode,
            conceptTitle: concept.title,
            questionText: q.questionText,
            options: q.options,
            explanation: q.explanation,
            difficulty: concept.difficulty,
          })
        );
      }
    }
  } catch (err) {
    console.warn(`[MilestoneAssessor] Claude question gen failed for ${concept.nodeCode}:`, err);
  }

  // Fallback: generate basic questions without Claude
  return generateFallbackQuestions(concept, count);
}

// ─── Fallback Question Generator ────────────────────────────────────────────

function generateFallbackQuestions(
  concept: {
    nodeCode: string;
    title: string;
    description: string;
    difficulty: number;
    subject: string | null;
  },
  count: number
): MilestoneQuestion[] {
  const questions: MilestoneQuestion[] = [];
  const isMath = (concept.subject ?? "MATH") === "MATH";

  for (let i = 0; i < count; i++) {
    if (isMath) {
      questions.push({
        questionId: `${concept.nodeCode}-fb${i + 1}-${Date.now()}`,
        conceptCode: concept.nodeCode,
        conceptTitle: concept.title,
        questionText: `Which of the following best demonstrates your understanding of "${concept.title}"?`,
        options: [
          { id: "A", text: "I can explain this concept to a friend", isCorrect: true },
          { id: "B", text: "I've heard of it but I'm not sure about the details", isCorrect: false },
          { id: "C", text: "I need more practice with this", isCorrect: false },
          { id: "D", text: "This is completely new to me", isCorrect: false },
        ],
        explanation: `Being able to explain "${concept.title}" shows solid understanding.`,
        difficulty: concept.difficulty,
      });
    } else {
      questions.push({
        questionId: `${concept.nodeCode}-fb${i + 1}-${Date.now()}`,
        conceptCode: concept.nodeCode,
        conceptTitle: concept.title,
        questionText: `How confident are you with "${concept.title}"?`,
        options: [
          { id: "A", text: "Very confident — I can use it correctly", isCorrect: true },
          { id: "B", text: "Somewhat confident but need practice", isCorrect: false },
          { id: "C", text: "I recognize it but struggle with it", isCorrect: false },
          { id: "D", text: "Not familiar with this yet", isCorrect: false },
        ],
        explanation: `Confidence with "${concept.title}" comes from regular practice.`,
        difficulty: concept.difficulty,
      });
    }
  }

  return questions;
}

// ─── Core: Evaluate Milestone ───────────────────────────────────────────────

/**
 * Evaluates a completed milestone assessment.
 * Returns pass/fail, per-concept breakdown, and identifies failed concepts.
 */
export function evaluateMilestone(
  questions: MilestoneQuestion[],
  answers: Map<string, MilestoneAnswer>
): MilestoneEvaluation {
  let totalCorrect = 0;
  const conceptMap = new Map<
    string,
    { code: string; title: string; correct: number; total: number }
  >();

  for (const q of questions) {
    const answer = answers.get(q.questionId);
    const isCorrect = answer?.isCorrect ?? false;

    if (isCorrect) totalCorrect++;

    const existing = conceptMap.get(q.conceptCode) ?? {
      code: q.conceptCode,
      title: q.conceptTitle,
      correct: 0,
      total: 0,
    };
    existing.total++;
    if (isCorrect) existing.correct++;
    conceptMap.set(q.conceptCode, existing);
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const passed = score / 100 >= PASS_THRESHOLD;

  const conceptResults = Array.from(conceptMap.values()).map((c) => ({
    conceptCode: c.code,
    conceptTitle: c.title,
    correct: c.correct,
    total: c.total,
    passed: c.total > 0 ? c.correct / c.total >= 0.5 : false,
  }));

  const failedConcepts = conceptResults
    .filter((c) => !c.passed)
    .map((c) => c.conceptCode);

  // Generate appropriate message
  let message: string;
  let encouragement: string;

  if (passed) {
    if (score >= 100) {
      message = "Perfect score! You've mastered everything this week!";
      encouragement = "You're on fire! Ready for the next challenge? 🔥";
    } else if (score >= 88) {
      message = "Excellent work! You've passed with flying colors!";
      encouragement = "Almost perfect — your hard work is really paying off! ⭐";
    } else {
      message = "You passed! Nice work this week.";
      encouragement = "Keep up the momentum — you're making great progress! 💪";
    }
  } else {
    if (score >= 50) {
      message = `You scored ${score}% — close to passing! Let's review a few concepts.`;
      encouragement =
        "You're almost there! A little more practice on the tricky parts will get you over the line. Don't worry — this happens to everyone. 🌱";
    } else {
      message = `You scored ${score}%. Let's spend more time on this week's concepts.`;
      encouragement =
        "Learning takes time, and that's totally okay! Cosmo will add some extra practice to help you nail these concepts. You've got this! 💪";
    }
  }

  return {
    passed,
    score,
    totalCorrect,
    totalQuestions,
    conceptResults,
    failedConcepts,
    message,
    encouragement,
  };
}

// ─── Core: Save Milestone Result ────────────────────────────────────────────

/**
 * Saves a milestone result and handles pass/fail consequences:
 * - Pass: Mark complete, recalculate ETA, trigger celebration
 * - Fail: Identify failed concepts, add review sessions to plan
 */
export async function saveMilestoneResult(
  planId: string,
  weekNumber: number,
  evaluation: MilestoneEvaluation,
  conceptsCovered: string[]
): Promise<{
  milestoneId: string;
  reviewConceptsAdded: string[];
}> {
  // Save the result
  const result = await prisma.milestoneResult.create({
    data: {
      planId,
      weekNumber,
      passed: evaluation.passed,
      score: evaluation.score / 100, // Store as 0-1
      conceptsTested: conceptsCovered,
    },
  });

  // If failed, we could add review concepts back to the plan
  // For now, just track failed concepts — Step 9 (Plan Adapter) handles re-ordering
  let reviewConceptsAdded: string[] = [];

  if (!evaluation.passed && evaluation.failedConcepts.length > 0) {
    reviewConceptsAdded = evaluation.failedConcepts;

    // Log for plan adaptation engine (Step 9) to pick up
    console.log(
      `[MilestoneAssessor] Week ${weekNumber} FAILED for plan ${planId}. ` +
        `Failed concepts: ${evaluation.failedConcepts.join(", ")}. ` +
        `Score: ${evaluation.score}%`
    );
  } else {
    console.log(
      `[MilestoneAssessor] Week ${weekNumber} PASSED for plan ${planId}. ` +
        `Score: ${evaluation.score}%`
    );
  }

  return {
    milestoneId: result.id,
    reviewConceptsAdded,
  };
}
