/**
 * GET /api/parent/child/[id]/activity-log
 *
 * Returns activity log entries for a student.
 * Used by the parent dashboard Activity tab.
 *
 * Query params:
 *   - limit (default 50)
 *   - offset (default 0)
 *   - eventType (optional filter)
 *   - since (ISO date, optional — only events after this date)
 *   - format ("json" | "csv") — csv returns CSV download
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { getActivityLog, getActivitySummary } from "@/lib/activity-log";
import type { ActivityEventType } from "@/lib/activity-log";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, displayName: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const eventType = url.searchParams.get("eventType") as ActivityEventType | null;
    const sinceParam = url.searchParams.get("since");
    const format = url.searchParams.get("format") ?? "json";
    const since = sinceParam ? new Date(sinceParam) : undefined;

    // CSV export
    if (format === "csv") {
      const { entries } = await getActivityLog(studentId, {
        limit: 1000, // Max 1000 for CSV
        eventType: eventType ?? undefined,
        since,
      });

      const csvRows = [
        "Date,Time,Event Type,Title,Detail",
        ...entries.map((e) => {
          const d = new Date(e.createdAt);
          const date = d.toLocaleDateString();
          const time = d.toLocaleTimeString();
          const title = `"${(e.title ?? "").replace(/"/g, '""')}"`;
          const detail = `"${(e.detail ?? "").replace(/"/g, '""')}"`;
          return `${date},${time},${e.eventType},${title},${detail}`;
        }),
      ];

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${student.displayName}-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // JSON response with entries + summary
    const [logResult, summary] = await Promise.all([
      getActivityLog(studentId, {
        limit,
        offset,
        eventType: eventType ?? undefined,
        since,
      }),
      getActivitySummary(studentId),
    ]);

    return NextResponse.json({
      entries: logResult.entries,
      total: logResult.total,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < logResult.total,
      },
    });
  } catch (err) {
    console.error("[Activity Log API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}
