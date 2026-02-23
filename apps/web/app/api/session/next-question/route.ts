/**
 * GET /api/session/next-question?sessionId=xxx
 *
 * Returns a practice question for a session.
 * Tries prefetch cache first (works in long-lived Node.js, not Vercel serverless),
 * then generates on-demand using Claude (Haiku for speed).
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getPrefetchedQuestion } from "@/lib/session/question-prefetch";
import { callClaude } from "@/lib/session/claude-client";
import * as practicePrompt from "@/lib/prompts/practice.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";

// Allow up to 30s for Claude API call (Pro plan); on Hobby plan this is capped at 10s
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Try to get the prefetched question (works in dev, may miss on Vercel serverless)
  try {
    const prefetched = await getPrefetchedQuestion(sessionId);
    if (prefetched) {
      console.log(`[next-question] Prefetch HIT for ${sessionId}`);
      return NextResponse.json({ question: prefetched, source: "prefetch" });
    }
  } catch (e) {
    console.warn("[next-question] Prefetch error (non-critical):", e);
  }

  // Generate on-demand (primary path on Vercel serverless)
  console.log(
    `[next-question] Generating on-demand for ${sessionId}`
  );

  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { student: true, currentNode: true },
  });

  if (!session?.currentNode || !session.student) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  const student = session.student;
  const node = session.currentNode;

  const existing = await prisma.masteryScore.findUnique({
    where: {
      studentId_nodeId: { studentId: session.studentId, nodeId: node.id },
    },
  });

  const promptParams = {
    nodeCode: node.nodeCode,
    nodeTitle: node.title,
    nodeDescription: node.description,
    gradeLevel: node.gradeLevel,
    domain: node.domain,
    difficulty: node.difficulty,
    studentName: student.displayName,
    ageGroup: student.ageGroup as AgeGroupValue,
    personaId: student.avatarPersonaId,
    currentEmotionalState: "ENGAGED" as EmotionalStateValue,
    bktProbability: existing?.bktProbability ?? 0.3,
  };

  const prompt = practicePrompt.buildPrompt(promptParams);

  // Use fast model (Haiku) for question generation — responds in 1-3s
  const claudeResponse = await callClaude(prompt);

  if (claudeResponse) {
    console.log(`[next-question] Claude generated question for ${sessionId}`);
    const question = practicePrompt.parseResponse(claudeResponse);
    return NextResponse.json({ question, source: "on-demand" });
  }

  // Fallback: generate a contextual question without Claude
  console.error(
    `[next-question] Claude FAILED for ${sessionId} — using fallback question for "${node.title}"`
  );

  const question = generateFallbackQuestion(node.title, node.difficulty, node.domain);
  return NextResponse.json({ question, source: "fallback" });
}

/**
 * ELA domain set — matches the set in types.ts.
 * Used to pick subject-appropriate fallback questions.
 */
const ELA_DOMAINS = new Set(["GRAMMAR", "READING", "WRITING", "VOCABULARY"]);

/**
 * Generate a basic fallback question when Claude is unavailable.
 * Uses the node's difficulty level and domain to adjust the question.
 * Subject-aware: returns ELA questions for English nodes, math for math nodes.
 */
function generateFallbackQuestion(nodeTitle: string, difficulty: number, domain: string) {
  if (ELA_DOMAINS.has(domain)) {
    return generateELAFallbackQuestion(nodeTitle, difficulty);
  }
  return generateMathFallbackQuestion(nodeTitle, difficulty);
}

/** ELA fallback questions for when Claude is unavailable */
function generateELAFallbackQuestion(nodeTitle: string, difficulty: number) {
  const easyQuestions = [
    {
      questionText: `Let's practice ${nodeTitle}! In the sentence "The dog runs fast", what is the subject?`,
      options: [
        { id: "A", text: "dog", isCorrect: true },
        { id: "B", text: "runs", isCorrect: false },
        { id: "C", text: "fast", isCorrect: false },
        { id: "D", text: "the", isCorrect: false },
      ],
      correctAnswer: "A",
      explanation: "The subject is 'dog' — it's the person, place, or thing doing the action (running).",
    },
    {
      questionText: `${nodeTitle} practice: Which word is a verb? "The cat sleeps on the soft bed."`,
      options: [
        { id: "A", text: "cat", isCorrect: false },
        { id: "B", text: "sleeps", isCorrect: true },
        { id: "C", text: "soft", isCorrect: false },
        { id: "D", text: "bed", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "'Sleeps' is a verb — it tells us what the cat is doing!",
    },
    {
      questionText: `Time to practice ${nodeTitle}! Which word is a noun? "The happy bird sings a pretty song."`,
      options: [
        { id: "A", text: "happy", isCorrect: false },
        { id: "B", text: "sings", isCorrect: false },
        { id: "C", text: "bird", isCorrect: true },
        { id: "D", text: "pretty", isCorrect: false },
      ],
      correctAnswer: "C",
      explanation: "'Bird' is a noun — it names a living thing. 'Song' is also a noun!",
    },
  ];

  const mediumQuestions = [
    {
      questionText: `${nodeTitle}: Which sentence uses a comma correctly?`,
      options: [
        { id: "A", text: "I like apples oranges and bananas.", isCorrect: false },
        { id: "B", text: "I like apples, oranges, and bananas.", isCorrect: true },
        { id: "C", text: "I like, apples oranges and bananas.", isCorrect: false },
        { id: "D", text: "I like apples oranges, and bananas.", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "When listing 3 or more items, put a comma after each item except the last. This is called the serial (Oxford) comma!",
    },
    {
      questionText: `${nodeTitle}: "Although she was tired, she finished her homework." What type of sentence is this?`,
      options: [
        { id: "A", text: "Simple sentence", isCorrect: false },
        { id: "B", text: "Compound sentence", isCorrect: false },
        { id: "C", text: "Complex sentence", isCorrect: true },
        { id: "D", text: "Fragment", isCorrect: false },
      ],
      correctAnswer: "C",
      explanation: "This is a complex sentence — it has one independent clause and one dependent clause starting with 'Although'.",
    },
  ];

  const questions = difficulty <= 4 ? easyQuestions : mediumQuestions;
  const idx = Math.floor(Math.random() * questions.length);
  return questions[idx];
}

/** Math fallback questions (original behavior) */
function generateMathFallbackQuestion(nodeTitle: string, difficulty: number) {
  const easyQuestions = [
    {
      questionText: `Let's practice ${nodeTitle}! What is 3 + 4?`,
      options: [
        { id: "A", text: "6", isCorrect: false },
        { id: "B", text: "7", isCorrect: true },
        { id: "C", text: "8", isCorrect: false },
        { id: "D", text: "5", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "3 + 4 = 7. You can count up from 3: 4, 5, 6, 7!",
    },
    {
      questionText: `${nodeTitle} practice: What is 6 + 2?`,
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "9", isCorrect: false },
        { id: "C", text: "8", isCorrect: true },
        { id: "D", text: "6", isCorrect: false },
      ],
      correctAnswer: "C",
      explanation: "6 + 2 = 8. Two more than 6 is 8!",
    },
    {
      questionText: `Time to practice ${nodeTitle}! What is 9 - 4?`,
      options: [
        { id: "A", text: "5", isCorrect: true },
        { id: "B", text: "4", isCorrect: false },
        { id: "C", text: "6", isCorrect: false },
        { id: "D", text: "3", isCorrect: false },
      ],
      correctAnswer: "A",
      explanation: "9 - 4 = 5. If you take away 4 from 9, you get 5!",
    },
  ];

  const mediumQuestions = [
    {
      questionText: `${nodeTitle}: What is 12 + 15?`,
      options: [
        { id: "A", text: "25", isCorrect: false },
        { id: "B", text: "27", isCorrect: true },
        { id: "C", text: "26", isCorrect: false },
        { id: "D", text: "28", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "12 + 15 = 27. Add the ones (2+5=7) and tens (10+10=20), then combine: 27!",
    },
    {
      questionText: `${nodeTitle}: What is 8 x 3?`,
      options: [
        { id: "A", text: "21", isCorrect: false },
        { id: "B", text: "24", isCorrect: true },
        { id: "C", text: "27", isCorrect: false },
        { id: "D", text: "18", isCorrect: false },
      ],
      correctAnswer: "B",
      explanation: "8 x 3 = 24. That's 8 + 8 + 8 = 24!",
    },
  ];

  const questions = difficulty <= 4 ? easyQuestions : mediumQuestions;
  const idx = Math.floor(Math.random() * questions.length);
  return questions[idx];
}
