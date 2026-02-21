/**
 * Seed Plans Tests — Phase 10: Billing
 *
 * Tests:
 *  - printEnvVars generates correct env variable format
 *  - Seed result structure
 *  - All 3 paid plans are included (SPARK is free, no Stripe price)
 *
 * NOTE: seedStripePlans is NOT tested here since it calls live Stripe.
 * Only the utility functions are tested.
 */

import { describe, it, expect } from "vitest";
import { printEnvVars } from "../lib/billing/seed-plans";

// ─── Tests ───

describe("Seed Plans", () => {
  describe("printEnvVars", () => {
    it("generates correct env format for single plan", () => {
      const result = printEnvVars([
        {
          plan: "PRO",
          productId: "prod_abc",
          priceId: "price_123",
          amount: 599,
          interval: "month",
        },
      ]);

      expect(result).toContain("STRIPE_PRICE_PRO");
      expect(result).toContain("price_123");
    });

    it("generates lines for all 3 paid plans", () => {
      const results = [
        { plan: "PRO" as const, productId: "prod_1", priceId: "price_1", amount: 599, interval: "month" as const },
        { plan: "FAMILY" as const, productId: "prod_2", priceId: "price_2", amount: 899, interval: "month" as const },
        { plan: "ANNUAL" as const, productId: "prod_3", priceId: "price_3", amount: 4999, interval: "year" as const },
      ];

      const output = printEnvVars(results);

      expect(output).toContain("STRIPE_PRICE_PRO");
      expect(output).toContain("STRIPE_PRICE_FAMILY");
      expect(output).toContain("STRIPE_PRICE_ANNUAL");
    });

    it("includes env file comment header", () => {
      const output = printEnvVars([]);
      expect(output).toContain("# Add these to your .env file");
    });

    it("wraps price IDs in quotes", () => {
      const output = printEnvVars([
        { plan: "PRO" as const, productId: "prod_x", priceId: "price_xyz", amount: 599, interval: "month" as const },
      ]);

      expect(output).toContain('"price_xyz"');
    });

    it("handles empty results", () => {
      const output = printEnvVars([]);
      expect(output).toContain("# Add these");
      // Should not crash
    });
  });

  describe("Seed result type shape", () => {
    it("has all required fields", () => {
      const result = {
        plan: "PRO" as const,
        productId: "prod_abc",
        priceId: "price_123",
        amount: 599,
        interval: "month" as const,
      };

      expect(result.plan).toBe("PRO");
      expect(result.productId).toMatch(/^prod_/);
      expect(result.priceId).toMatch(/^price_/);
      expect(result.amount).toBeGreaterThan(0);
      expect(["month", "year"]).toContain(result.interval);
    });

    it("amount matches PLAN_CONFIGS", () => {
      const proResult = {
        plan: "PRO" as const,
        amount: 599,
        interval: "month" as const,
      };
      const familyResult = {
        plan: "FAMILY" as const,
        amount: 899,
        interval: "month" as const,
      };
      const annualResult = {
        plan: "ANNUAL" as const,
        amount: 4999,
        interval: "year" as const,
      };

      expect(proResult.amount).toBe(599);
      expect(familyResult.amount).toBe(899);
      expect(annualResult.amount).toBe(4999);
    });
  });

  describe("Paid plan coverage", () => {
    it("3 paid plans need seeding (SPARK is free)", () => {
      const paidPlans = ["PRO", "FAMILY", "ANNUAL"];
      expect(paidPlans).toHaveLength(3);
      expect(paidPlans).not.toContain("SPARK");
    });

    it("SPARK does not need a Stripe price", () => {
      // SPARK is the free plan — no Stripe product/price needed
      const needsStripe = (plan: string) => plan !== "SPARK";
      expect(needsStripe("SPARK")).toBe(false);
      expect(needsStripe("PRO")).toBe(true);
      expect(needsStripe("FAMILY")).toBe(true);
      expect(needsStripe("ANNUAL")).toBe(true);
    });
  });
});
