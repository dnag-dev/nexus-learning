import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/auth/set-role
 *
 * Switches a user's role to TEACHER (or back to PARENT).
 * Creates a TeacherProfile if one doesn't exist when switching to TEACHER.
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email as string;
  const body = await request.json();
  const { role } = body;

  if (!role || !["PARENT", "TEACHER"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be PARENT or TEACHER." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { teacherProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update role
  await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  // Create TeacherProfile if switching to TEACHER and doesn't exist
  if (role === "TEACHER" && !user.teacherProfile) {
    await prisma.teacherProfile.create({
      data: { userId: user.id },
    });
  }

  return NextResponse.json({ success: true, role });
}
