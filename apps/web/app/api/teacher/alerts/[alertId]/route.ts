import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * PATCH /api/teacher/alerts/:alertId
 *
 * Updates alert status (acknowledge or resolve).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { alertId: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !["ACKNOWLEDGED", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be ACKNOWLEDGED or RESOLVED" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }

    const alert = await prisma.interventionAlert.update({
      where: { id: params.alertId },
      data: updateData,
    });

    return NextResponse.json(alert);
  } catch (err) {
    console.error("Update alert error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
