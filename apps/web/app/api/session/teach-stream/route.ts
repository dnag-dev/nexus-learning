/**
 * SSE endpoint: streams teaching content from Claude.
 *
 * GET /api/session/teach-stream?sessionId=xxx
 *
 * Events:
 *   data: {"type":"started"}                          — connection alive
 *   data: {"type":"progress"}                         — heartbeat (every ~1s)
 *   data: {"type":"done","emoji":"...","hook":"...",...} — all structured teaching content
 *   data: {"type":"error","message":"..."}            — fallback triggered
 */
import { prisma } from "@aauti/db";
import { streamClaude, callClaude } from "@/lib/session/claude-client";
import * as teachingPrompt from "@/lib/prompts/teaching.prompt";
import type { AgeGroupValue, EmotionalStateValue } from "@/lib/prompts/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up session + student + node
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { student: true, currentNode: true },
  });

  if (!session?.currentNode || !session.student) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const student = session.student;
  const node = session.currentNode;

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
    currentEmotionalState: "NEUTRAL" as EmotionalStateValue,
  };

  const prompt = teachingPrompt.buildPrompt(promptParams);
  const encoder = new TextEncoder();

  const fallbackDone = {
    type: "done" as const,
    emoji: "📚",
    hook: `Let's learn about ${node.title}!`,
    explanation: node.description,
    example: "You'll see this in everyday life.",
    checkQuestion: "Are you ready to try some practice questions?",
    checkAnswer: "Yes!",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      let accumulated = "";
      let streamed = false;

      try {
        sendEvent({ type: "started" });

        // Heartbeat every ~1s so client knows we're alive
        const heartbeat = setInterval(() => {
          sendEvent({ type: "progress" });
        }, 1000);

        // Accumulate the full response (content is short ~150 words)
        for await (const delta of streamClaude(prompt)) {
          accumulated += delta;
          streamed = true;
        }

        clearInterval(heartbeat);

        if (!streamed) {
          // Streaming returned nothing — fall back to blocking call
          const fullResponse = await callClaude(prompt);
          if (fullResponse) {
            accumulated = fullResponse;
          }
        }

        if (accumulated) {
          const parsed = teachingPrompt.parseResponse(accumulated);
          sendEvent({
            type: "done",
            emoji: parsed.emoji,
            hook: parsed.hook,
            explanation: parsed.explanation,
            example: parsed.example,
            checkQuestion: parsed.checkQuestion,
            checkAnswer: parsed.checkAnswer,
          });
        } else {
          sendEvent(fallbackDone);
        }
      } catch (err) {
        console.error("teach-stream error:", err);
        sendEvent({ type: "error", message: "Streaming failed" });
        sendEvent(fallbackDone);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
