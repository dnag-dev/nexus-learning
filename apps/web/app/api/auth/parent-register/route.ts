/**
 * POST /api/auth/parent-register
 *
 * Registers a new parent account with email + password.
 * Returns a JWT token + parent info (same shape as login).
 * Creates a SPARK (free) subscription by default.
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { hashPassword, createParentSession } from "@/lib/parent-auth";

// Basic email regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };

    // ─── Validation ───

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // ─── Check for existing account ───

    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ─── Create parent account ───

    const passwordHash = await hashPassword(password);

    // SPARK plan: free forever — set period end far in the future
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 100);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        role: "PARENT",
        subscription: {
          create: {
            plan: "SPARK",
            status: "ACTIVE",
            currentPeriodEnd: periodEnd,
          },
        },
      },
      include: {
        subscription: { select: { plan: true } },
      },
    });

    // ─── Create JWT session ───

    const token = await createParentSession(user.id);

    return NextResponse.json({
      parentId: user.id,
      email: user.email,
      name: name?.trim() || user.email.split("@")[0],
      plan: user.subscription?.plan ?? "SPARK",
      token,
      children: [], // New account — no children yet
    });
  } catch (error) {
    console.error("Parent registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
