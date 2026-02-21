/**
 * POST /api/billing/portal
 *
 * Create a Stripe Customer Portal session.
 * Body: { userId }
 */

import { NextResponse } from "next/server";
import { createCustomerPortalSession } from "../../../../lib/billing/subscription-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/billing`;

    const result = await createCustomerPortalSession(userId, returnUrl);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[billing/portal] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
