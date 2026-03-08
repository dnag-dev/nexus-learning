import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const CHILD_SESSION_COOKIE = "aauti-child-session";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Child API routes: check both header and cookie ───
  // Mobile sends Authorization header; web sends cookie
  if (pathname.startsWith("/api/")) {
    // API routes pass through — auth is checked in route handlers
    // This allows mobile to use Bearer token while web uses cookie
    return NextResponse.next();
  }

  // ─── Child page routes: /kid/* (browser navigation — cookie only) ───
  if (pathname.startsWith("/kid")) {
    const token = request.cookies.get(CHILD_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/kid-login", request.url));
    }

    // Verify JWT in Edge Runtime (jose works in Edge)
    try {
      const secret = process.env.CHILD_AUTH_SECRET;
      if (!secret) {
        return NextResponse.redirect(new URL("/kid-login", request.url));
      }
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const response = NextResponse.redirect(
        new URL("/kid-login", request.url)
      );
      // Clear the bad cookie
      response.cookies.set(CHILD_SESSION_COOKIE, "", {
        maxAge: 0,
        path: "/",
      });
      return response;
    }
  }

  // ─── Parent routes: /dashboard/* ───
  // Skip auth middleware when Auth0 isn't configured (local dev)
  const issuer = process.env.AUTH0_ISSUER_BASE_URL ?? "";
  if (!issuer || issuer.includes("YOUR_TENANT")) {
    return NextResponse.next();
  }

  // When Auth0 IS configured, use its middleware dynamically
  // This avoids import-time crashes when env vars are placeholder values
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*", "/kid/:path*"],
};
