/**
 * Stripe Plan Seeding Script — Phase 10: Billing
 *
 * Creates Stripe products + prices for all 4 plans (INR).
 * Run: npx ts-node apps/web/lib/billing/seed-plans.ts
 *
 * Outputs the price IDs to set in environment variables.
 */

import { getStripeClient, PLAN_CONFIGS, type PlanKey } from "./stripe-client";

interface SeedResult {
  plan: PlanKey;
  productId: string;
  priceId: string;
  amount: number;
  interval: "month" | "year";
}

/**
 * Seed Stripe products and prices for all paid plans.
 * Returns the created price IDs for env configuration.
 */
export async function seedStripePlans(): Promise<SeedResult[]> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const results: SeedResult[] = [];

  const paidPlans: PlanKey[] = ["PRO", "FAMILY", "ANNUAL"];

  for (const planKey of paidPlans) {
    const config = PLAN_CONFIGS[planKey];

    // Create product
    const product = await stripe.products.create({
      name: `Aauti Learn — ${config.name}`,
      description: config.description,
      metadata: { planKey },
    });

    // Create price (INR, in paise)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: config.priceINR * 100, // INR paise
      currency: "inr",
      recurring: { interval: config.interval },
      metadata: { planKey },
    });

    results.push({
      plan: planKey,
      productId: product.id,
      priceId: price.id,
      amount: config.priceINR,
      interval: config.interval,
    });
  }

  return results;
}

/**
 * Print seed results as env variables.
 */
export function printEnvVars(results: SeedResult[]): string {
  const lines = results.map(
    (r) => `STRIPE_PRICE_${r.plan}="${r.priceId}"`
  );
  return [
    "# Add these to your .env file:",
    ...lines,
  ].join("\n");
}

// ─── CLI Runner ───

if (require.main === module) {
  seedStripePlans()
    .then((results) => {
      console.log("Stripe plans seeded successfully!\n");
      console.log(printEnvVars(results));
      console.log("\nDetailed results:");
      for (const r of results) {
        console.log(`  ${r.plan}: product=${r.productId} price=${r.priceId} ₹${r.amount}/${r.interval}`);
      }
    })
    .catch((err) => {
      console.error("Failed to seed Stripe plans:", err);
      process.exit(1);
    });
}
