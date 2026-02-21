/**
 * GET /api/review/summary?sessionId=xxx
 *
 * Get the summary of a completed review session.
 */

import { NextResponse } from "next/server";
import { getReviewSummary } from "@/lib/spaced-repetition/review-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query param is required" },
        { status: 400 }
      );
    }

    const summary = await getReviewSummary(sessionId);

    if (!summary) {
      return NextResponse.json(
        { error: "Review session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Review summary error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get review summary" },
      { status: 500 }
    );
  }
}
