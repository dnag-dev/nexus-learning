import { NextResponse } from "next/server";
import { CHILD_SESSION_COOKIE } from "@/lib/child-auth";

/**
 * POST /api/auth/child-logout
 *
 * Clears the child session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(CHILD_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
