import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      sub: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
      email_verified: session.user.email_verified,
    },
  });
}
