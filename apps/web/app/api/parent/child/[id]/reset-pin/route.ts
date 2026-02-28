import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { hashPin, validatePin, validateUsername } from "@/lib/child-auth";

/**
 * POST /api/parent/child/:id/reset-pin
 *
 * Reset or set a child's kid-login credentials (username + PIN).
 * Body: { parentId, username?, pin?, removeLogin? }
 *
 * - If removeLogin is true: clears username and pinHash
 * - If username + pin provided: updates/sets kid login credentials
 * - If only pin provided: updates PIN only (username stays)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const childId = params.id;
    const body = await request.json();
    const { parentId, username, pin, removeLogin } = body;

    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    // Verify child belongs to parent
    const child = await prisma.student.findFirst({
      where: { id: childId, parentId },
      select: { id: true, displayName: true, username: true, pinHash: true },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found or does not belong to this parent" },
        { status: 404 }
      );
    }

    // Remove kid login entirely
    if (removeLogin) {
      await prisma.student.update({
        where: { id: childId },
        data: { username: null, pinHash: null },
      });

      return NextResponse.json({
        success: true,
        message: `Kid login removed for ${child.displayName}`,
        hasKidLogin: false,
      });
    }

    // Validate PIN
    if (!pin) {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      );
    }

    const pinError = validatePin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    // Validate and check username uniqueness if changing it
    let normalizedUsername = child.username; // Keep existing by default
    if (username !== undefined) {
      if (username) {
        const usernameError = validateUsername(username);
        if (usernameError) {
          return NextResponse.json({ error: usernameError }, { status: 400 });
        }
        normalizedUsername = username.toLowerCase();

        // Check uniqueness (excluding this child)
        const existing = await prisma.student.findFirst({
          where: {
            username: { equals: normalizedUsername, mode: "insensitive" },
            id: { not: childId },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "This username is already taken. Try another!" },
            { status: 409 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Username is required when setting a PIN" },
          { status: 400 }
        );
      }
    }

    // If child has no username yet and none was provided, require it
    if (!normalizedUsername && !username) {
      return NextResponse.json(
        { error: "Username is required to set up kid login" },
        { status: 400 }
      );
    }

    // Hash and save
    const newPinHash = await hashPin(pin);
    await prisma.student.update({
      where: { id: childId },
      data: {
        username: normalizedUsername,
        pinHash: newPinHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: `PIN ${child.pinHash ? "reset" : "set"} for ${child.displayName}`,
      username: normalizedUsername,
      hasKidLogin: true,
    });
  } catch (err) {
    console.error("[reset-pin] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
