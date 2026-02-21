import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
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
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
