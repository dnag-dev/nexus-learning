import { NextResponse } from "next/server";
import { buildWeeklyReport } from "@/lib/reports/narrative-report";

/**
 * POST /api/parent/child/:id/reports/generate
 *
 * Trigger generation of a weekly report for the current week.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const report = await buildWeeklyReport(studentId);

    if (!report) {
      return NextResponse.json(
        { error: "Could not generate report — student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
