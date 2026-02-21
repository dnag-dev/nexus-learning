import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/auth/sync
 *
 * Syncs the Auth0 session user with the database.
 * Finds existing user by email or creates a new one.
 * Returns the database user ID + profile.
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
    include: { subscription: true, children: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "auth0", // Auth0 manages passwords
        role: "PARENT",
      },
      include: { subscription: true, children: true },
    });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name,
    plan: user.subscription?.plan ?? "SPARK",
    childCount: user.children.length,
    createdAt: user.createdAt.toISOString(),
  });
}
