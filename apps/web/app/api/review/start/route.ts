/**
 * POST /api/review/start
 *
 * Build and start a spaced repetition review session.
 * Returns the review session with due nodes to review.
 */

import { NextResponse } from "next/server";
import { buildReviewSession } from "@/lib/spaced-repetition/review-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const session = await buildReviewSession(studentId);

    if (!session) {
      return NextResponse.json(
        { error: "No nodes due for review", hasReviews: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasReviews: true,
      session,
    });
  } catch (err) {
    console.error("Review start error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start review" },
      { status: 500 }
    );
  }
}
