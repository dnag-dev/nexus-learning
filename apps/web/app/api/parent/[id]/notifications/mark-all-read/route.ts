import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/parent/:id/notifications/mark-all-read
 *
 * Mark all notifications as read for all children of a parent.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    const children = await prisma.student.findMany({
      where: { parentId },
      select: { id: true },
    });

    const childIds = children.map((c) => c.id);

    await prisma.notification.updateMany({
      where: {
        studentId: { in: childIds },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mark all read error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
