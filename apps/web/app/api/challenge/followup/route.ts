/**
 * POST /api/challenge/followup
 *
 * Back-and-forth dialogue after initial challenge evaluation.
 * Max 3 exchanges. Claude asks probing questions based on
 * the student's previous answer and evaluation.
 *
 * Body: { studentId, conceptId, conversationHistory, exchangeNumber }
 * Returns: { followUp, isLastExchange }
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import {
  getPersonaName,
  getPersonaTone,
  getAgeInstruction,
  type AgeGroupValue,
} from "@/lib/prompts/types";

export const maxDuration = 30;

const MAX_EXCHANGES = 3;

interface ConversationEntry {
  role: "student" | "tutor";
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      conceptId,
      conversationHistory,
      exchangeNumber,
      scenario,
      question,
    } = body;

    if (!studentId || !conceptId || !conversationHistory) {
      return NextResponse.json(
        { error: "studentId, conceptId, and conversationHistory are required" },
        { status: 400 }
      );
    }

    const currentExchange = exchangeNumber ?? conversationHistory.length;
    if (currentExchange >= MAX_EXCHANGES) {
      return NextResponse.json({
        followUp: null,
        isLastExchange: true,
        message: "Great discussion! You've completed the challenge dialogue.",
      });
    }

    // Look up student and node
    const [student, node] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.knowledgeNode.findFirst({ where: { nodeCode: conceptId } }),
    ]);

    if (!student || !node) {
      return NextResponse.json(
        { error: "Student or concept not found" },
        { status: 404 }
      );
    }

    const personaName = getPersonaName(student.avatarPersonaId);
    const personaTone = getPersonaTone(student.avatarPersonaId);
    const ageInstruction = getAgeInstruction(
      student.ageGroup as AgeGroupValue
    );

    // Build conversation context
    const historyText = (conversationHistory as ConversationEntry[])
      .map(
        (entry) =>
          `${entry.role === "student" ? student.displayName : personaName}: ${entry.content}`
      )
      .join("\n\n");

    const isLastExchange = currentExchange + 1 >= MAX_EXCHANGES;

    const prompt = `You are ${personaName}, a tutor who is ${personaTone}.

Topic: ${node.title} — ${node.description}
${scenario ? `Scenario: ${scenario}` : ""}
${question ? `Original question: ${question}` : ""}

${ageInstruction}

Conversation so far:
${historyText}

This is exchange ${currentExchange + 1} of ${MAX_EXCHANGES}.
${isLastExchange ? "This is the FINAL exchange — wrap up with a summary and encouragement." : "Ask a probing follow-up question that deepens the student's thinking."}

Your follow-up should:
1. ${isLastExchange ? "Summarize what they learned and celebrate their effort" : "Build on what they said — push them to think deeper"}
2. ${isLastExchange ? "Give a final encouraging message" : "Ask ONE specific follow-up question"}
3. Be warm, specific, and age-appropriate

Respond in EXACTLY this JSON format:
{
  "response": "Your follow-up response (2-4 sentences)",
  "followUpQuestion": ${isLastExchange ? "null" : '"Your specific follow-up question"'},
  "insightGained": "Brief note about what the student demonstrated",
  "scoreAdjustment": 0
}

Only return valid JSON, nothing else.`;

    const response = await callClaude(prompt);
    if (!response) {
      return NextResponse.json({
        followUp: {
          response: isLastExchange
            ? `Great job thinking through this challenge, ${student.displayName}! You showed real understanding of ${node.title}. Keep up that curiosity!`
            : `That's interesting! Can you tell me more about how you'd apply ${node.title} in another situation?`,
          followUpQuestion: isLastExchange
            ? null
            : `How else might you use ${node.title}?`,
          insightGained: "Student engaged with the challenge",
          scoreAdjustment: 0,
        },
        isLastExchange,
        exchangeNumber: currentExchange + 1,
      });
    }

    try {
      const parsed = JSON.parse(response);

      return NextResponse.json({
        followUp: {
          response: parsed.response ?? "Great thinking!",
          followUpQuestion: isLastExchange
            ? null
            : (parsed.followUpQuestion ?? null),
          insightGained: parsed.insightGained ?? "",
          scoreAdjustment: Math.max(
            -10,
            Math.min(10, parsed.scoreAdjustment ?? 0)
          ),
        },
        isLastExchange,
        exchangeNumber: currentExchange + 1,
      });
    } catch {
      return NextResponse.json({
        followUp: {
          response: response.slice(0, 500),
          followUpQuestion: isLastExchange ? null : "Can you explain more?",
          insightGained: "",
          scoreAdjustment: 0,
        },
        isLastExchange,
        exchangeNumber: currentExchange + 1,
      });
    }
  } catch (err) {
    console.error("[challenge/followup] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate follow-up" },
      { status: 500 }
    );
  }
}
