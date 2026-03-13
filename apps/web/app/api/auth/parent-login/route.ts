/**
 * POST /api/auth/parent-login
 *
 * Authenticates a parent with email + password.
 * Returns a JWT token + parent info + children list.
 * Used by the mobile app for parent login.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { verifyPassword, createParentSession } from "@/lib/parent-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
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
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password (rejects placeholder hashes)
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT session
    const token = await createParentSession(user.id);

    return NextResponse.json({
      parentId: user.id,
      email: user.email,
      name: user.email.split("@")[0],
      plan: user.subscription?.plan ?? "SPARK",
      token,
      children: user.children,
    });
  } catch (error) {
    console.error("Parent login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
