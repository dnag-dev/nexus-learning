import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { hashPin, validatePin, validateUsername } from "@/lib/child-auth";

/**
 * POST /api/parent/children
 *
 * Add a child profile to a parent account.
 * Body: { parentId, displayName, gradeLevel, ageGroup, username?, pin? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parentId, displayName, gradeLevel, ageGroup, username, pin } = body;

    if (!parentId || !displayName) {
      return NextResponse.json(
        { error: "parentId and displayName are required" },
        { status: 400 }
      );
    }

    // Verify parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: { children: true, subscription: true },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check child limit based on plan
    const plan = parent.subscription?.plan ?? "SPARK";
    const limits: Record<string, number> = {
      SPARK: 1,
      PRO: 2,
      FAMILY: 4,
      ANNUAL: 2,
    };
    const maxChildren = limits[plan] ?? 1;

    if (parent.children.length >= maxChildren) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan allows up to ${maxChildren} child profile${maxChildren > 1 ? "s" : ""}. Upgrade to add more.`,
        },
        { status: 403 }
      );
    }

    // Validate username if provided
    let normalizedUsername: string | undefined;
    if (username) {
      const usernameError = validateUsername(username);
      if (usernameError) {
        return NextResponse.json({ error: usernameError }, { status: 400 });
      }
      normalizedUsername = username.toLowerCase();

      // Check uniqueness
      const existing = await prisma.student.findFirst({
        where: { username: { equals: normalizedUsername, mode: "insensitive" } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This username is already taken. Try another!" },
          { status: 409 }
        );
      }
    }

    // Validate and hash PIN if provided
    let pinHash: string | undefined;
    if (pin) {
      if (!username) {
        return NextResponse.json(
          { error: "Username is required when setting a PIN" },
          { status: 400 }
        );
      }
      const pinError = validatePin(pin);
      if (pinError) {
        return NextResponse.json({ error: pinError }, { status: 400 });
      }
      pinHash = await hashPin(pin);
    }

    // Create child
    const child = await prisma.student.create({
      data: {
        displayName,
        gradeLevel: gradeLevel || "G3",
        ageGroup: ageGroup || "MID_8_10",
        parentId,
        avatarPersonaId: "cosmo",
        username: normalizedUsername ?? null,
        pinHash: pinHash ?? null,
      },
    });

    return NextResponse.json({
      id: child.id,
      displayName: child.displayName,
      gradeLevel: child.gradeLevel,
      ageGroup: child.ageGroup,
      username: child.username,
      hasKidLogin: !!child.username && !!child.pinHash,
    });
  } catch (err) {
    console.error("[parent/children] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
