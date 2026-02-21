/**
 * Shared Claude client for teaching session prompts.
 */

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callClaude(prompt: string): Promise<string | null> {
  const claude = getClaudeClient();
  if (!claude) return null;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.content[0];
    if (content.type === "text") return content.text;
    return null;
  } catch (err) {
    console.warn(
      "Claude API call failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
