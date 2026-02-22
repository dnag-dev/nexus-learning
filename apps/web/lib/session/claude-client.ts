/**
 * Shared Claude client for teaching session prompts.
 * Supports both blocking (callClaude) and streaming (streamClaude) modes.
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic | null {
  // Use AAUTI_ANTHROPIC_KEY first (avoids conflict with Claude Code shell env),
  // then fall back to standard ANTHROPIC_API_KEY.
  const key =
    process.env.AAUTI_ANTHROPIC_KEY ||
    (process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")
      ? process.env.ANTHROPIC_API_KEY
      : undefined);
  if (!key) {
    console.warn(
      "[Claude] No valid Anthropic API key found. Set AAUTI_ANTHROPIC_KEY in .env.local."
    );
    return null;
  }
  if (!client) {
    console.log(
      "[Claude] Initializing client with key:",
      key.substring(0, 12) + "..."
    );
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

/** Blocking call — waits for full response */
export async function callClaude(prompt: string): Promise<string | null> {
  const claude = getClaudeClient();
  if (!claude) {
    console.warn("[Claude] Client not available — falling back");
    return null;
  }

  try {
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
      temperature: TEMPERATURE,
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

/**
 * Streaming call — yields text deltas as they arrive from the API.
 * Use this for visible word-by-word rendering (teaching explanations).
 */
export async function* streamClaude(
  prompt: string
): AsyncGenerator<string, void, undefined> {
  const claude = getClaudeClient();
  if (!claude) {
    console.warn("[Claude] Client not available — cannot stream");
    return;
  }

  try {
    const stream = claude.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
      temperature: TEMPERATURE,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } catch (err) {
    console.warn(
      "Claude streaming failed:",
      err instanceof Error ? err.message : err
    );
    // Caller should handle empty generator as a failure
  }
}
