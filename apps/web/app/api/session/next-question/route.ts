/**
 * GET /api/session/next-question?sessionId=xxx
 *
 * Returns the next question for a session, aware of the 5-step learning loop.
 * Reads the session's learningStep and generates the appropriate question type:
 *   Step 1 → auto-advance to Step 2 (check understanding)
 *   Step 2 → check_understanding question
 *   Step 3 → guided_practice question
 *   Step 4 → independent_practice question
 *   Step 5 → mastery_proof question
 *
 * Tries prefetch cache first, then generates on-demand using Claude.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getPrefetchedQuestion } from "@/lib/session/question-prefetch";
import { callClaude } from "@/lib/session/claude-client";
import * as stepPrompt from "@/lib/prompts/step-question.prompt";
import type {
  AgeGroupValue,
  EmotionalStateValue,
  LearningStepType,
} from "@/lib/prompts/types";

export const maxDuration = 30;

function stepToType(step: number): LearningStepType {
  switch (step) {
    case 2:
      return "check_understanding";
    case 3:
      return "guided_practice";
    case 4:
      return "independent_practice";
    case 5:
      return "mastery_proof";
    default:
      return "check_understanding";
  }
}

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
      // Read step from session for metadata
      const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
        select: { learningStep: true },
      });
      return NextResponse.json({
        question: prefetched,
        source: "prefetch",
        learningStep: session?.learningStep ?? 2,
      });
    }
  } catch (e) {
    console.warn("[next-question] Prefetch error (non-critical):", e);
  }

  // Generate on-demand
  console.log(`[next-question] Generating on-demand for ${sessionId}`);

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
  let step = session.learningStep;

  // Auto-advance from Step 1 (teaching) to Step 2 (check understanding)
  if (step === 1) {
    step = 2;
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { learningStep: 2, stepCorrectCount: 0, stepTotalCount: 0 },
    });
    console.log(
      `[next-question] Auto-advanced step 1→2 for ${sessionId}`
    );
  }

  const stepType = stepToType(step);

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

  // Fetch previously asked questions in this session to avoid repeats
  const previousResponses = await prisma.questionResponse.findMany({
    where: { sessionId, nodeId: node.id },
    select: { questionText: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const previousQuestions = previousResponses.length > 0
    ? previousResponses.map((r) => r.questionText).join("\n- ")
    : undefined;

  // Generate step-aware question
  const prompt = stepPrompt.buildStepPrompt(promptParams, stepType, {
    previousQuestions,
  });
  const claudeResponse = await callClaude(prompt);

  if (claudeResponse) {
    console.log(
      `[next-question] Claude generated ${stepType} question for ${sessionId}`
    );
    const question = stepPrompt.parseStepResponse(claudeResponse);
    if (question) {
      return NextResponse.json({
        question,
        source: "on-demand",
        learningStep: step,
      });
    }
    console.warn(`[next-question] Parse failed for ${sessionId} — using fallback`);
  }

  // Fallback
  console.error(
    `[next-question] Claude unavailable/unparseable for ${sessionId} — using fallback`
  );

  const question = generateFallbackQuestion(
    node.title,
    node.difficulty,
    node.domain
  );
  return NextResponse.json({
    question,
    source: "fallback",
    learningStep: step,
  });
}

// ─── Fallback Questions ───

const ELA_DOMAINS = new Set(["GRAMMAR", "READING", "WRITING", "VOCABULARY"]);

function generateFallbackQuestion(
  nodeTitle: string,
  difficulty: number,
  domain: string
) {
  if (ELA_DOMAINS.has(domain)) {
    return generateELAFallbackQuestion(nodeTitle, difficulty);
  }
  return generateMathFallbackQuestion(nodeTitle, difficulty);
}

function generateELAFallbackQuestion(
  nodeTitle: string,
  difficulty: number
) {
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
      explanation:
        "The subject is 'dog' — it's the person, place, or thing doing the action (running).",
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
      explanation:
        "'Bird' is a noun — it names a living thing. 'Song' is also a noun!",
    },
  ];

  const mediumQuestions = [
    {
      questionText: `${nodeTitle}: Which sentence uses a comma correctly?`,
      options: [
        {
          id: "A",
          text: "I like apples oranges and bananas.",
          isCorrect: false,
        },
        {
          id: "B",
          text: "I like apples, oranges, and bananas.",
          isCorrect: true,
        },
        {
          id: "C",
          text: "I like, apples oranges and bananas.",
          isCorrect: false,
        },
        {
          id: "D",
          text: "I like apples oranges, and bananas.",
          isCorrect: false,
        },
      ],
      correctAnswer: "B",
      explanation:
        "When listing 3 or more items, put a comma after each item except the last.",
    },
  ];

  const questions = difficulty <= 4 ? easyQuestions : mediumQuestions;
  const idx = Math.floor(Math.random() * questions.length);
  return questions[idx];
}

function generateMathFallbackQuestion(
  nodeTitle: string,
  difficulty: number
) {
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
      explanation:
        "12 + 15 = 27. Add the ones (2+5=7) and tens (10+10=20), then combine: 27!",
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
