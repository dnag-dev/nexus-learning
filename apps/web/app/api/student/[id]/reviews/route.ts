/**
 * GET /api/student/:id/reviews
 *
 * Returns due review summary, due nodes list, and upcoming review forecast.
 * Used by the dashboard review widget and review home page.
 *
 * Query params:
 *  - forecastDays (optional, default 7): Number of days to forecast
 */

import { NextResponse } from "next/server";
import { getDueReviewSummary } from "@/lib/spaced-repetition/notifications";
import { getDueNodes, getUpcomingReviews } from "@/lib/spaced-repetition/scheduler";

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

    const [summary, dueNodeRecords, forecast] = await Promise.all([
      getDueReviewSummary(studentId),
      getDueNodes(studentId),
      getUpcomingReviews(studentId, forecastDays),
    ]);

    // Map due nodes into the shape the kid review page expects
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nodes = dueNodeRecords.map((ms) => ({
      nodeId: ms.nodeId,
      nodeCode: ms.node.nodeCode,
      title: ms.node.title,
      domain: ms.node.domain,
      gradeLevel: ms.node.gradeLevel,
      bktProbability: ms.bktProbability,
      lastReviewedAt: ms.lastPracticed?.toISOString() ?? null,
      nextReviewAt: ms.nextReviewAt?.toISOString() ?? now.toISOString(),
      isOverdue: ms.nextReviewAt ? ms.nextReviewAt <= oneDayAgo : false,
    }));

    return NextResponse.json({
      summary,
      nodes,
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
