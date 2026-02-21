import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/parent/:id/notifications/:notifId/read
 *
 * Mark a single notification as read.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string; notifId: string } }
) {
  try {
    const notif = await prisma.notification.findUnique({
      where: { id: params.notifId },
    });

    if (!notif) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await prisma.notification.update({
      where: { id: params.notifId },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
