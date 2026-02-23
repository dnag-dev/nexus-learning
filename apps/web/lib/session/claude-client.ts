/**
 * Shared Claude client for teaching session prompts.
 * Supports both blocking (callClaude) and streaming (streamClaude) modes.
 *
 * Uses Haiku for fast question generation (fits within Vercel 10s timeout)
 * and Sonnet for richer content (celebrations, teaching explanations).
 */

import Anthropic from "@anthropic-ai/sdk";

/** Fast model for structured outputs (questions, celebrations) — responds in 1-3s */
const FAST_MODEL = "claude-3-5-haiku-20241022";
/** Rich model for teaching explanations and streaming content */
const RICH_MODEL = "claude-sonnet-4-5-20250929";

const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;

let client: Anthropic | null = null;
let keySource: string = "none";

function resolveApiKey(): string | undefined {
  // Priority 1: AAUTI_ANTHROPIC_KEY (avoids conflict with Claude Code shell env)
  const aautiKey = process.env.AAUTI_ANTHROPIC_KEY;
  if (aautiKey && aautiKey.length > 10) {
    keySource = "AAUTI_ANTHROPIC_KEY";
    return aautiKey;
  }

  // Priority 2: ANTHROPIC_API_KEY (any valid key — relaxed check for Vercel)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.length > 10) {
    keySource = "ANTHROPIC_API_KEY";
    return anthropicKey;
  }

  keySource = "none";
  return undefined;
}

export function getClaudeClient(): Anthropic | null {
  const key = resolveApiKey();
  if (!key) {
    console.error(
      "[Claude] No valid Anthropic API key found.",
      `AAUTI_ANTHROPIC_KEY set: ${!!process.env.AAUTI_ANTHROPIC_KEY}`,
      `ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`,
      `ANTHROPIC_API_KEY length: ${process.env.ANTHROPIC_API_KEY?.length ?? 0}`,
      `ANTHROPIC_API_KEY prefix: ${process.env.ANTHROPIC_API_KEY?.substring(0, 8) ?? "N/A"}`
    );
    return null;
  }
  if (!client) {
    console.log(
      `[Claude] Initializing client (source: ${keySource}, prefix: ${key.substring(0, 12)}...)`
    );
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

/**
 * Blocking call — waits for full response.
 * Uses the fast Haiku model by default (1-3s response time) to fit within
 * Vercel serverless timeouts. Use model="rich" for Sonnet.
 */
export async function callClaude(
  prompt: string,
  options?: { model?: "fast" | "rich"; maxTokens?: number }
): Promise<string | null> {
  const claude = getClaudeClient();
  if (!claude) {
    console.error("[Claude] Client not available — no API key found. Falling back.");
    return null;
  }

  const model = options?.model === "rich" ? RICH_MODEL : FAST_MODEL;
  const maxTokens = options?.maxTokens ?? MAX_TOKENS;

  try {
    console.log(
      `[Claude] Calling ${model} (maxTokens: ${maxTokens}, prompt length: ${prompt.length})`
    );
    const startTime = Date.now();

    const response = await claude.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      temperature: TEMPERATURE,
    });

    const elapsed = Date.now() - startTime;
    console.log(
      `[Claude] Response received in ${elapsed}ms (model: ${response.model}, tokens: ${response.usage?.output_tokens})`
    );

    const content = response.content[0];
    if (content.type === "text") return content.text;

    console.warn("[Claude] Non-text response type:", content.type);
    return null;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.constructor.name : typeof err;
    console.error(
      `[Claude] API call FAILED (model: ${model}):`,
      `[${errorName}] ${errorMsg}`
    );
    return null;
  }
}

/**
 * Streaming call — yields text deltas as they arrive from the API.
 * Use this for visible word-by-word rendering (teaching explanations).
 * Always uses the rich (Sonnet) model for quality.
 */
export async function* streamClaude(
  prompt: string
): AsyncGenerator<string, void, undefined> {
  const claude = getClaudeClient();
  if (!claude) {
    console.error("[Claude] Client not available — cannot stream");
    return;
  }

  try {
    console.log(
      `[Claude] Starting stream (model: ${RICH_MODEL}, prompt length: ${prompt.length})`
    );

    const stream = claude.messages.stream({
      model: RICH_MODEL,
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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Claude] Streaming FAILED: ${errorMsg}`);
    // Caller should handle empty generator as a failure
  }
}
