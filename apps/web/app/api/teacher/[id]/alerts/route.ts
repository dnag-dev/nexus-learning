import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { runAlertDetection } from "@/lib/teacher/alert-engine";

/**
 * GET /api/teacher/:id/alerts
 *
 * Lists all alerts for a teacher, optionally filtered by status.
 * Also runs alert detection to create new alerts.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status"); // ALERT_ACTIVE, ACKNOWLEDGED, RESOLVED

    // Run detection first to catch new issues
    try {
      await runAlertDetection(teacherId);
    } catch (err) {
      console.error("Alert detection error (non-fatal):", err);
    }

    // Build where clause
    const where: Record<string, unknown> = { teacherId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const alerts = await prisma.interventionAlert.findMany({
      where,
      include: {
        student: {
          select: { id: true, displayName: true, avatarPersonaId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      alerts.map((a) => ({
        id: a.id,
        alertType: a.alertType,
        status: a.status,
        title: a.title,
        description: a.description,
        studentId: a.studentId,
        studentName: a.student.displayName,
        avatarPersonaId: a.student.avatarPersonaId,
        data: a.data,
        createdAt: a.createdAt.toISOString(),
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    console.error("List alerts error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
