/**
 * POST /api/billing/checkout
 *
 * Create a Stripe Checkout Session.
 * Body: { userId, planKey, withTrial? }
 */

import { NextResponse } from "next/server";
import { createCheckoutSession } from "../../../../lib/billing/subscription-service";
import type { PlanKey } from "../../../../lib/billing/stripe-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planKey, withTrial } = body as {
      userId: string;
      planKey: PlanKey;
      withTrial?: boolean;
    };

    if (!userId || !planKey) {
      return NextResponse.json(
        { error: "userId and planKey are required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/billing?success=true&plan=${planKey}`;
    const cancelUrl = `${baseUrl}/billing?canceled=true`;

    const result = await createCheckoutSession(
      userId,
      planKey,
      successUrl,
      cancelUrl,
      withTrial ?? false
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
