import { handleAuth, handleLogin, handleLogout } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

const handler = handleAuth({
  login: handleLogin((req) => {
    const url = new URL(req.url ?? "http://localhost", "http://localhost");
    return { returnTo: url.searchParams.get("returnTo") || "/dashboard" };
  }),
  logout: handleLogout({
    returnTo: "/",
  }),
  onError(_req: Request, error: Error) {
    console.error("Auth0 error:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  },
});

export const GET = handler;
