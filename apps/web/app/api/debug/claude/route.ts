/**
 * GET /api/debug/claude
 *
 * Diagnostic endpoint to test Claude API connectivity on Vercel.
 * Tests raw fetch with different model names to find what works.
 */

import { NextResponse } from "next/server";

export const maxDuration = 30;

const MODELS_TO_TEST = [
  "claude-sonnet-4-5-20250929",
  "claude-3-5-haiku-latest",
  "claude-haiku-4-5-20250929",
];

export async function GET() {
  const aautiKey = process.env.AAUTI_ANTHROPIC_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const resolvedKey = aautiKey || anthropicKey;

  if (!resolvedKey) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    keySource: aautiKey ? "AAUTI_ANTHROPIC_KEY" : "ANTHROPIC_API_KEY",
    keyPrefix: resolvedKey.substring(0, 12),
  };

  // Test each model with raw fetch
  for (const model of MODELS_TO_TEST) {
    try {
      const startTime = Date.now();
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": resolvedKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 20,
          messages: [{ role: "user", content: "Say: OK" }],
        }),
      });
      const elapsed = Date.now() - startTime;
      const body = await resp.json();

      results[model] = {
        status: resp.ok ? "SUCCESS" : `HTTP_${resp.status}`,
        elapsed_ms: elapsed,
        response: resp.ok ? body?.content?.[0]?.text : body?.error?.message,
        model_returned: body?.model,
      };
    } catch (err) {
      results[model] = {
        status: "ERROR",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(results);
}
