import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/register
 *
 * Registers an Expo push token for a user (student or parent).
 * Mobile app calls this after obtaining notification permission.
 *
 * NOTE: Token persistence requires a PushToken model in the DB schema.
 * For now, this endpoint logs the token and returns success.
 * A future migration will add the PushToken table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId, userType, platform } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token and userId are required" },
        { status: 400 }
      );
    }

    // Log the registration (will persist to DB after PushToken migration)
    console.log(
      `[Notifications] Register token for ${userType}=${userId} on ${platform}: ${token.slice(0, 20)}...`
    );

    // TODO: Once PushToken model is added to Prisma schema:
    // await prisma.pushToken.upsert({
    //   where: { userId_platform: { userId, platform: platform || "unknown" } },
    //   update: { token, userType: userType || "student", updatedAt: new Date() },
    //   create: { token, userId, userType: userType || "student", platform: platform || "unknown" },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push token registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
