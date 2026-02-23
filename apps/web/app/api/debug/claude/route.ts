/**
 * GET /api/debug/claude
 *
 * Diagnostic endpoint to test Claude API connectivity on Vercel.
 * Tests both SDK and raw fetch approaches.
 */

import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {},
    clientInit: {},
    sdkCall: {},
    rawFetchCall: {},
  };

  // 1. Check environment variables
  const aautiKey = process.env.AAUTI_ANTHROPIC_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const resolvedKey = aautiKey || anthropicKey;

  diagnostics.env = {
    AAUTI_ANTHROPIC_KEY_set: !!aautiKey,
    AAUTI_ANTHROPIC_KEY_length: aautiKey?.length ?? 0,
    AAUTI_ANTHROPIC_KEY_prefix: aautiKey?.substring(0, 12) ?? "not set",
    ANTHROPIC_API_KEY_set: !!anthropicKey,
    ANTHROPIC_API_KEY_length: anthropicKey?.length ?? 0,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ?? "not set",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "not set",
  };

  diagnostics.clientInit = {
    resolvedKeyFound: !!resolvedKey,
    resolvedKeyPrefix: resolvedKey?.substring(0, 12) ?? "none",
    keySource: aautiKey ? "AAUTI_ANTHROPIC_KEY" : anthropicKey ? "ANTHROPIC_API_KEY" : "NONE",
  };

  if (!resolvedKey) {
    return NextResponse.json(
      { ...diagnostics, error: "No API key found" },
      { status: 500 }
    );
  }

  // 2. Test with raw fetch (bypasses SDK)
  try {
    const startTime = Date.now();
    const fetchResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": resolvedKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 20,
        messages: [{ role: "user", content: "Say: OK" }],
      }),
    });
    const elapsed = Date.now() - startTime;
    const responseBody = await fetchResponse.json();

    diagnostics.rawFetchCall = {
      status: fetchResponse.ok ? "SUCCESS" : "HTTP_ERROR",
      httpStatus: fetchResponse.status,
      elapsed_ms: elapsed,
      responseType: responseBody?.content?.[0]?.type ?? "unknown",
      responseText: responseBody?.content?.[0]?.text?.substring(0, 50) ?? "N/A",
      model: responseBody?.model ?? "unknown",
      usage: responseBody?.usage,
      error: responseBody?.error ?? null,
    };
  } catch (err) {
    diagnostics.rawFetchCall = {
      status: "NETWORK_ERROR",
      errorMessage: err instanceof Error ? err.message : String(err),
      errorType: err instanceof Error ? err.constructor.name : typeof err,
    };
  }

  // 3. Test with SDK
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: resolvedKey });

    const startTime = Date.now();
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 20,
      messages: [{ role: "user", content: "Say: OK" }],
      temperature: 0,
    });
    const elapsed = Date.now() - startTime;

    const content = response.content[0];
    diagnostics.sdkCall = {
      status: "SUCCESS",
      elapsed_ms: elapsed,
      model: response.model,
      responseText: content.type === "text" ? content.text.substring(0, 50) : "non-text",
      usage: response.usage,
    };
  } catch (err) {
    diagnostics.sdkCall = {
      status: "FAILED",
      errorType: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  const overallStatus =
    (diagnostics.rawFetchCall as Record<string, unknown>).status === "SUCCESS" ||
    (diagnostics.sdkCall as Record<string, unknown>).status === "SUCCESS"
      ? 200
      : 500;

  return NextResponse.json(diagnostics, { status: overallStatus });
}
