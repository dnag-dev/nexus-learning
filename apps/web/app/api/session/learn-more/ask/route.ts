/**
 * POST /api/session/learn-more/ask
 *
 * Live Q&A for the Learn More panel's Ask tab.
 * Students type a question about the current concept and get a Claude-powered answer.
 * Rate limited to 5 questions per session per node.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import {
  buildAskPrompt,
  parseAskResponse,
} from "@/lib/prompts/learn-more.prompt";
import type { AgeGroupValue } from "@/lib/prompts/types";

export const maxDuration = 15;

// In-memory rate limiter (sessionId:nodeId → count)
const askCounts = new Map<string, number>();

// Cleanup stale entries every 5 minutes
const RATE_LIMIT = 5;
setInterval(() => {
  askCounts.clear();
}, 5 * 60 * 1000);

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, question } = body as {
    sessionId?: string;
    question?: string;
  };

  if (!sessionId || !question) {
    return NextResponse.json(
      { error: "sessionId and question are required" },
      { status: 400 }
    );
  }

  if (question.length > 500) {
    return NextResponse.json(
      { error: "Question too long (max 500 characters)" },
      { status: 400 }
    );
  }

  // Fetch session
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

  const node = session.currentNode;
  const student = session.student;

  // Rate limit check
  const rateLimitKey = `${sessionId}:${node.id}`;
  const currentCount = askCounts.get(rateLimitKey) ?? 0;
  if (currentCount >= RATE_LIMIT) {
    return NextResponse.json(
      {
        answer:
          "You've asked a lot of great questions! Try solving the practice problem now — I believe in you! 💪",
        rateLimited: true,
      },
      { status: 200 }
    );
  }

  // Build prompt and call Claude
  const promptParams = {
    nodeTitle: node.title,
    nodeDescription: node.description,
    gradeLevel: node.gradeLevel,
    domain: node.domain,
    difficulty: node.difficulty,
    ageGroup: student.ageGroup as AgeGroupValue,
    personaId: student.avatarPersonaId,
  };

  const prompt = buildAskPrompt(promptParams, question, student.displayName);
  const claudeResponse = await callClaude(prompt, { maxTokens: 512 });

  if (claudeResponse) {
    const answer = parseAskResponse(claudeResponse);
    if (answer) {
      askCounts.set(rateLimitKey, currentCount + 1);
      return NextResponse.json({
        answer,
        questionsRemaining: RATE_LIMIT - currentCount - 1,
      });
    }
  }

  // Fallback
  return NextResponse.json({
    answer: `Great question! ${node.title} can be tricky. Try breaking the problem into smaller steps and see if that helps. You're doing awesome! 🌟`,
    questionsRemaining: RATE_LIMIT - currentCount,
  });
}
