/**
 * Shared Claude client for teaching session prompts.
 * Supports both blocking (callClaude) and streaming (streamClaude) modes.
 *
 * Uses raw fetch instead of the Anthropic SDK because SDK v0.78.0 has
 * connection errors on Vercel serverless. Raw fetch works perfectly.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;

let resolvedKey: string | null = null;

function getApiKey(): string | null {
  if (resolvedKey) return resolvedKey;

  // Priority 1: AAUTI_ANTHROPIC_KEY (avoids conflict with Claude Code shell env)
  const aautiKey = process.env.AAUTI_ANTHROPIC_KEY;
  if (aautiKey && aautiKey.length > 10) {
    resolvedKey = aautiKey;
    console.log(`[Claude] Using AAUTI_ANTHROPIC_KEY (prefix: ${aautiKey.substring(0, 12)}...)`);
    return resolvedKey;
  }

  // Priority 2: ANTHROPIC_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey.length > 10) {
    resolvedKey = anthropicKey;
    console.log(`[Claude] Using ANTHROPIC_API_KEY (prefix: ${anthropicKey.substring(0, 12)}...)`);
    return resolvedKey;
  }

  console.error(
    "[Claude] No valid Anthropic API key found.",
    `AAUTI_ANTHROPIC_KEY set: ${!!aautiKey}`,
    `ANTHROPIC_API_KEY set: ${!!anthropicKey}`
  );
  return null;
}

// Keep the SDK client for backward compatibility (used by callers importing it)
// but all API calls now go through raw fetch
export function getClaudeClient(): { apiKey: string } | null {
  const key = getApiKey();
  return key ? { apiKey: key } : null;
}

/**
 * Blocking call — waits for full response.
 * Uses raw fetch to the Anthropic Messages API (bypasses SDK connection issues on Vercel).
 */
export async function callClaude(
  prompt: string,
  options?: { maxTokens?: number }
): Promise<string | null> {
  const key = getApiKey();
  if (!key) {
    console.error("[Claude] No API key — falling back");
    return null;
  }

  const maxTokens = options?.maxTokens ?? MAX_TOKENS;

  try {
    console.log(
      `[Claude] Calling ${MODEL} via fetch (maxTokens: ${maxTokens}, prompt: ${prompt.length} chars)`
    );
    const startTime = Date.now();

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: TEMPERATURE,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(
        `[Claude] API returned HTTP ${response.status} in ${elapsed}ms:`,
        (errorBody as Record<string, unknown>)?.error ?? errorBody
      );
      return null;
    }

    const data = await response.json();
    const content = (data as { content: Array<{ type: string; text?: string }> }).content?.[0];

    console.log(
      `[Claude] Response in ${elapsed}ms (model: ${(data as { model: string }).model}, tokens: ${(data as { usage: { output_tokens: number } }).usage?.output_tokens})`
    );

    if (content?.type === "text" && content.text) {
      return content.text;
    }

    console.warn("[Claude] No text content in response");
    return null;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Claude] Fetch FAILED: ${errorMsg}`);
    return null;
  }
}

/**
 * Streaming call — yields text deltas as they arrive from the API.
 * Uses raw fetch with SSE parsing (bypasses SDK connection issues on Vercel).
 */
export async function* streamClaude(
  prompt: string
): AsyncGenerator<string, void, undefined> {
  const key = getApiKey();
  if (!key) {
    console.error("[Claude] No API key — cannot stream");
    return;
  }

  try {
    console.log(
      `[Claude] Starting stream via fetch (model: ${MODEL}, prompt: ${prompt.length} chars)`
    );

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Claude] Stream HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
      return;
    }

    if (!response.body) {
      console.error("[Claude] No response body for stream");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const event = JSON.parse(data);
          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            event.delta?.text
          ) {
            yield event.delta.text;
          }
        } catch {
          // Skip non-JSON SSE lines
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Claude] Stream FAILED: ${errorMsg}`);
  }
}
