/**
 * GET /api/billing/subscription?userId=xxx
 *
 * Get current subscription info + feature gates.
 */

import { NextResponse } from "next/server";
import {
  getSubscription,
  getFeatureGates,
} from "../../../../lib/billing/subscription-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query param is required" },
        { status: 400 }
      );
    }

    const [subscription, features] = await Promise.all([
      getSubscription(userId),
      getFeatureGates(userId),
    ]);

    return NextResponse.json({
      subscription,
      features,
    });
  } catch (err) {
    console.error("[billing/subscription] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
