import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import {
  verifyPin,
  createChildSession,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  CHILD_SESSION_COOKIE,
  CHILD_SESSION_MAX_AGE,
} from "@/lib/child-auth";

/**
 * POST /api/auth/child-login
 *
 * Authenticates a child with username + 4-digit PIN.
 * Sets an HTTP-only JWT cookie on success.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, pin } = body as { username?: string; pin?: string };

    if (!username || !pin) {
      return NextResponse.json(
        { error: "Username and PIN are required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateCheck = checkRateLimit(username);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        },
        { status: 429 }
      );
    }

    // Find student by username (case-insensitive)
    const student = await prisma.student.findFirst({
      where: {
        username: {
          equals: username.toLowerCase(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        displayName: true,
        avatarPersonaId: true,
        pinHash: true,
        xp: true,
        level: true,
      },
    });

    if (!student || !student.pinHash) {
      recordFailedAttempt(username);
      return NextResponse.json(
        { error: "Wrong username or PIN" },
        { status: 401 }
      );
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, student.pinHash);
    if (!pinValid) {
      recordFailedAttempt(username);
      return NextResponse.json(
        { error: "Wrong username or PIN" },
        { status: 401 }
      );
    }

    // Success — clear rate limit, update lastLoginAt
    clearAttempts(username);

    await prisma.student.update({
      where: { id: student.id },
      data: { lastLoginAt: new Date() },
    });

    // Create JWT session
    const token = await createChildSession(student.id);

    // Set cookie and return response
    const response = NextResponse.json({
      studentId: student.id,
      displayName: student.displayName,
      avatarPersonaId: student.avatarPersonaId,
    });

    response.cookies.set(CHILD_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CHILD_SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Child login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
