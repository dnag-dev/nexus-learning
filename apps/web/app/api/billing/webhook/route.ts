/**
 * POST /api/billing/webhook
 *
 * Stripe webhook endpoint.
 * Verifies signature, processes event, logs to WebhookLog.
 */

import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "../../../../lib/billing/stripe-client";
import { processWebhookEvent, HANDLED_EVENTS } from "../../../../lib/billing/webhook-handler";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const event = verifyWebhookSignature(body, signature, webhookSecret);
    if (!event) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Only process events we care about
    if (!HANDLED_EVENTS.includes(event.type as (typeof HANDLED_EVENTS)[number])) {
      return NextResponse.json({ received: true, action: "ignored" });
    }

    const result = await processWebhookEvent(
      event.id,
      event.type,
      event.data.object as unknown as Record<string, unknown>
    );

    if (!result.success) {
      console.error(`[webhook] Failed to process ${event.type}:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      action: result.action,
    });
  } catch (err) {
    console.error("[billing/webhook] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Disable Next.js body parsing for webhook signature verification
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
