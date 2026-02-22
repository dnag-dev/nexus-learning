import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/auth/sync
 *
 * Syncs the Auth0 session user with the database.
 * Finds existing user by email or creates a new one.
 * Returns the database user ID + profile + role.
 * For TEACHER role, also returns teacherProfileId + schoolName.
 */
export async function GET() {
  const session = await getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email as string;
  const name = (session.user.name as string) || email.split("@")[0];

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscription: true,
      children: true,
      teacherProfile: {
        include: { school: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "auth0", // Auth0 manages passwords
        role: "PARENT",
      },
      include: {
        subscription: true,
        children: true,
        teacherProfile: {
          include: { school: true },
        },
      },
    });
  }

  // Base response
  const response: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    name,
    role: user.role,
    plan: user.subscription?.plan ?? "SPARK",
    childCount: user.children.length,
    createdAt: user.createdAt.toISOString(),
  };

  // Add teacher-specific data
  if (user.role === "TEACHER" && user.teacherProfile) {
    response.teacherProfileId = user.teacherProfile.id;
    response.schoolName = user.teacherProfile.school?.name ?? null;
  }

  return NextResponse.json(response);
}
