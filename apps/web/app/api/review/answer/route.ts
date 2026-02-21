/**
 * POST /api/review/answer
 *
 * Process a review answer for a specific node.
 * Updates BKT, scheduler, awards XP, fires events.
 */

import { NextResponse } from "next/server";
import { processReviewAnswer } from "@/lib/spaced-repetition/review-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, nodeId, isCorrect } = body;

    if (!sessionId || !nodeId || isCorrect === undefined) {
      return NextResponse.json(
        { error: "sessionId, nodeId, and isCorrect are required" },
        { status: 400 }
      );
    }

    const result = await processReviewAnswer(sessionId, nodeId, isCorrect);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Review answer error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process review answer" },
      { status: 500 }
    );
  }
}
