import { NextResponse } from "next/server";
import { getLatestReport, markReportViewed } from "@/lib/reports/narrative-report";

/**
 * GET /api/parent/child/:id/report/latest
 *
 * Returns the latest weekly report for a child.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const report = await getLatestReport(studentId);

    if (!report) {
      return NextResponse.json(
        { error: "No reports found" },
        { status: 404 }
      );
    }

    // Mark as viewed
    if (!report.viewedAt) {
      await markReportViewed(report.id);
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Latest report error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
