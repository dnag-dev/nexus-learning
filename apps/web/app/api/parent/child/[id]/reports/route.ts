import { NextResponse } from "next/server";
import { getLatestReport, listReports } from "@/lib/reports/narrative-report";

/**
 * GET /api/parent/child/:id/reports
 *
 * Returns latest report + previous reports list.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const [latest, all] = await Promise.all([
      getLatestReport(studentId),
      listReports(studentId, 10),
    ]);

    return NextResponse.json({
      latest,
      previous: all,
    });
  } catch (err) {
    console.error("Child reports error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
