/**
 * GET /api/debug/claude
 *
 * Diagnostic endpoint to test Claude API connectivity on Vercel.
 * Returns detailed diagnostics about key detection, client initialization,
 * and a test API call.
 */

import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {},
    clientInit: {},
    apiCall: {},
  };

  // 1. Check environment variables
  const aautiKey = process.env.AAUTI_ANTHROPIC_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  diagnostics.env = {
    AAUTI_ANTHROPIC_KEY_set: !!aautiKey,
    AAUTI_ANTHROPIC_KEY_length: aautiKey?.length ?? 0,
    AAUTI_ANTHROPIC_KEY_prefix: aautiKey?.substring(0, 12) ?? "not set",
    ANTHROPIC_API_KEY_set: !!anthropicKey,
    ANTHROPIC_API_KEY_length: anthropicKey?.length ?? 0,
    ANTHROPIC_API_KEY_prefix: anthropicKey?.substring(0, 12) ?? "not set",
    ANTHROPIC_API_KEY_startsWithSkAnt: anthropicKey?.startsWith("sk-ant-") ?? false,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ?? "not set",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "not set",
  };

  // 2. Determine which key would be used
  const resolvedKey =
    aautiKey ||
    (anthropicKey?.startsWith("sk-ant-") ? anthropicKey : undefined);

  diagnostics.clientInit = {
    resolvedKeyFound: !!resolvedKey,
    resolvedKeyPrefix: resolvedKey?.substring(0, 12) ?? "none",
    resolvedKeyLength: resolvedKey?.length ?? 0,
    keySource: aautiKey
      ? "AAUTI_ANTHROPIC_KEY"
      : anthropicKey?.startsWith("sk-ant-")
        ? "ANTHROPIC_API_KEY"
        : "NONE",
  };

  if (!resolvedKey) {
    diagnostics.apiCall = {
      status: "SKIPPED",
      reason: "No valid API key found",
      suggestion:
        "Set AAUTI_ANTHROPIC_KEY or ANTHROPIC_API_KEY (must start with sk-ant-) in Vercel env vars",
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // 3. Try a minimal Claude API call
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: resolvedKey });

    const startTime = Date.now();
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 50,
      messages: [{ role: "user", content: "Say exactly: HELLO_DIAGNOSTIC_OK" }],
      temperature: 0,
    });
    const elapsed = Date.now() - startTime;

    const content = response.content[0];
    diagnostics.apiCall = {
      status: "SUCCESS",
      elapsed_ms: elapsed,
      model: response.model,
      responseType: content.type,
      responseText:
        content.type === "text" ? content.text.substring(0, 100) : "non-text",
      usage: response.usage,
    };
  } catch (err) {
    diagnostics.apiCall = {
      status: "FAILED",
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack:
        err instanceof Error
          ? err.stack?.split("\n").slice(0, 5).join("\n")
          : undefined,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  return NextResponse.json(diagnostics);
}
