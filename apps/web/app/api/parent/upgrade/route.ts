import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * POST /api/parent/upgrade
 *
 * Upgrades a parent's subscription plan.
 * In production this would go through Stripe — for now it updates the DB directly.
 */
export async function POST(request: Request) {
  try {
    const { parentId, plan } = await request.json();

    if (!parentId || !plan) {
      return NextResponse.json(
        { error: "parentId and plan are required" },
        { status: 400 }
      );
    }

    const validPlans = ["SPARK", "PRO", "FAMILY"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}. Must be one of ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: parentId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    if (user.subscription) {
      await prisma.subscription.update({
        where: { userId: parentId },
        data: {
          plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: parentId,
          plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    return NextResponse.json({
      success: true,
      plan,
      message: `Successfully upgraded to ${plan}!`,
    });
  } catch (err) {
    console.error("[parent/upgrade] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upgrade" },
      { status: 500 }
    );
  }
}
