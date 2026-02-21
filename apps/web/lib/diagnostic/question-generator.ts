import Anthropic from "@anthropic-ai/sdk";
import {
  buildDiagnosticSystemPrompt,
  buildDiagnosticUserPrompt,
  parseDiagnosticResponse,
  getFallbackQuestion,
} from "../ai/claude/prompts/diagnostic";
import type { DiagnosticQuestion } from "./types";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

interface GenerateQuestionInput {
  nodeCode: string;
  nodeTitle: string;
  nodeDescription: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  studentName: string;
  studentAge: number;
  personaId: string;
}

/**
 * Generate a diagnostic question using Claude AI, with fallback to
 * hardcoded questions when the API is unavailable.
 */
export async function generateDiagnosticQuestion(
  input: GenerateQuestionInput
): Promise<DiagnosticQuestion> {
  const client = getAnthropicClient();

  // Try Claude first
  if (client) {
    try {
      const systemPrompt = buildDiagnosticSystemPrompt(input.personaId);
      const userPrompt = buildDiagnosticUserPrompt(input);

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.7,
      });

      const content = response.content[0];
      if (content.type === "text") {
        return parseDiagnosticResponse(
          content.text,
          input.nodeCode,
          input.nodeTitle,
          input.gradeLevel,
          input.domain,
          input.difficulty
        );
      }
    } catch (err) {
      console.warn(
        `Claude API failed for ${input.nodeCode}, falling back to hardcoded question:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Fallback to hardcoded questions
  const fallback = getFallbackQuestion(input.nodeCode);
  if (fallback) return fallback;

  // Ultimate fallback — should never happen with full coverage
  throw new Error(
    `No question available for node ${input.nodeCode} — neither Claude nor fallback`
  );
}
