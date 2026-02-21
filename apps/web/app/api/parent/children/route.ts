import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/parent/children
 *
 * Add a child profile to a parent account.
 * Body: { parentId, displayName, gradeLevel, ageGroup }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { parentId, displayName, gradeLevel, ageGroup } = body;

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

    // Create child
    const child = await prisma.student.create({
      data: {
        displayName,
        gradeLevel: gradeLevel || "G3",
        ageGroup: ageGroup || "MID_8_10",
        parentId,
        avatarPersonaId: "cosmo", // Default persona
      },
    });

    return NextResponse.json({
      id: child.id,
      displayName: child.displayName,
      gradeLevel: child.gradeLevel,
      ageGroup: child.ageGroup,
    });
  } catch (err) {
    console.error("[parent/children] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
