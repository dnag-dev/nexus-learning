/**
 * GET /api/student/:id/reviews
 *
 * Returns due review summary and upcoming review forecast.
 * Used by the dashboard review widget and review home page.
 *
 * Query params:
 *  - forecastDays (optional, default 7): Number of days to forecast
 */

import { NextResponse } from "next/server";
import { getDueReviewSummary } from "@/lib/spaced-repetition/notifications";
import { getUpcomingReviews } from "@/lib/spaced-repetition/scheduler";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const forecastDays = parseInt(url.searchParams.get("forecastDays") ?? "7", 10);

    const [summary, forecast] = await Promise.all([
      getDueReviewSummary(studentId),
      getUpcomingReviews(studentId, forecastDays),
    ]);

    return NextResponse.json({
      summary,
      forecast,
    });
  } catch (err) {
    console.error("GET /api/student/[id]/reviews error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
