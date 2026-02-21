import { NextResponse } from "next/server";
import { getReportForWeek } from "@/lib/reports/narrative-report";

/**
 * GET /api/parent/child/:id/report/week/:weekStart
 *
 * Returns the weekly report for a specific week.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string; weekStart: string } }
) {
  try {
    const studentId = params.id;
    const weekStartDate = new Date(params.weekStart);

    if (isNaN(weekStartDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid weekStart date" },
        { status: 400 }
      );
    }

    const report = await getReportForWeek(studentId, weekStartDate);

    if (!report) {
      return NextResponse.json(
        { error: "No report found for this week" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Week report error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
