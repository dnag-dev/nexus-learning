import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/parent/:id/notifications
 *
 * Returns notifications for all children of a parent.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parentId = params.id;

    // Get all children for this parent
    const children = await prisma.student.findMany({
      where: { parentId },
      select: { id: true, displayName: true },
    });

    const childIds = children.map((c) => c.id);
    const childNameMap = new Map(children.map((c) => [c.id, c.displayName]));

    // Get recent notifications for all children
    const notifications = await prisma.notification.findMany({
      where: {
        studentId: { in: childIds },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
        childId: n.studentId,
        childName: childNameMap.get(n.studentId) || "Unknown",
      })),
    });
  } catch (err) {
    console.error("Parent notifications error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
