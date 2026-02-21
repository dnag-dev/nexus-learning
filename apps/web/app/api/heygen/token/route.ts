/**
 * POST /api/heygen/token
 *
 * Server-side endpoint that creates a HeyGen LiveAvatar session token.
 * The client uses this token to initialize the @heygen/liveavatar-web-sdk.
 * This keeps the HEYGEN_API_KEY secret on the server.
 *
 * Request body (optional): { avatarId?: string }
 * Response: { sessionToken: string, sessionId: string }
 */

import { NextResponse } from "next/server";
import {
  createSessionToken,
  isHeyGenAvailable,
  getAvatarId,
} from "@/lib/avatar/heygen-client";
import type { PersonaId } from "@/lib/personas/persona-config";

export async function POST(request: Request) {
  if (!isHeyGenAvailable()) {
    return NextResponse.json(
      { error: "HeyGen is not configured" },
      { status: 503 }
    );
  }

  try {
    // Optionally accept personaId to resolve avatar
    let avatarId: string | undefined;
    try {
      const body = await request.json();
      if (body.personaId) {
        avatarId = getAvatarId(body.personaId as PersonaId);
      } else if (body.avatarId) {
        avatarId = body.avatarId;
      }
    } catch {
      // No body or invalid JSON — use default avatar
    }

    const result = await createSessionToken(avatarId);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create LiveAvatar session token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionToken: result.sessionToken,
      sessionId: result.sessionId,
    });
  } catch (err) {
    console.error("POST /api/heygen/token error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
