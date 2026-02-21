/**
 * POST /api/billing/trial
 *
 * Start a 14-day free trial on Pro plan.
 * Body: { userId }
 */

import { NextResponse } from "next/server";
import { startFreeTrial } from "../../../../lib/billing/subscription-service";

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

    const started = await startFreeTrial(userId);

    if (!started) {
      return NextResponse.json(
        { error: "Trial already used or active subscription exists" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "14-day Pro trial started",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("[billing/trial] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
