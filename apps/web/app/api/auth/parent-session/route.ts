/**
 * GET /api/auth/parent-session
 *
 * Verifies the parent's JWT token and returns their profile + children.
 * Used by the mobile app to restore parent sessions on app launch.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { verifyParentSession } from "@/lib/parent-auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifyParentSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: session.parentId },
      include: {
        children: {
          select: {
            id: true,
            displayName: true,
            avatarPersonaId: true,
            gradeLevel: true,
          },
        },
        subscription: { select: { plan: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      parentId: user.id,
      email: user.email,
      name: user.email.split("@")[0],
      plan: user.subscription?.plan ?? "SPARK",
      children: user.children,
    });
  } catch (error) {
    console.error("Parent session verify error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}
