import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  verifyChildSession,
  CHILD_SESSION_COOKIE,
} from "@/lib/child-auth";

/**
 * GET /api/auth/child-session
 *
 * Verifies the child's JWT cookie and returns their profile.
 * Used by the child layout to check authentication on mount.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CHILD_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const session = await verifyChildSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    // Fetch fresh student data
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      select: {
        id: true,
        displayName: true,
        avatarPersonaId: true,
        xp: true,
        level: true,
        gradeLevel: true,
        ageGroup: true,
        firstLoginComplete: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      studentId: student.id,
      displayName: student.displayName,
      avatarPersonaId: student.avatarPersonaId,
      xp: student.xp,
      level: student.level,
      gradeLevel: student.gradeLevel,
      ageGroup: student.ageGroup,
      firstLoginComplete: student.firstLoginComplete,
    });
  } catch (error) {
    console.error("Child session verify error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
}
