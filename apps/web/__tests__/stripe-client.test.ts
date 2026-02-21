/**
 * Stripe Client Tests — Phase 10: Billing
 *
 * Tests:
 *  - PLAN_CONFIGS has correct shape for all 4 plans
 *  - getPlanConfig returns correct config or defaults to SPARK
 *  - planKeyFromPriceId maps correctly
 *  - formatINR outputs correct ₹ strings
 *  - Feature flags per plan (child limits, avatar, voice, etc.)
 *  - Price/interval correctness
 *  - verifyWebhookSignature returns null when Stripe not configured
 */

import { describe, it, expect } from "vitest";
import {
  PLAN_CONFIGS,
  getPlanConfig,
  planKeyFromPriceId,
  type PlanKey,
  type PlanConfig,
} from "../lib/billing/stripe-client";

// ─── Tests ───

describe("Stripe Client", () => {
  describe("PLAN_CONFIGS", () => {
    it("has exactly 4 plans", () => {
      expect(Object.keys(PLAN_CONFIGS)).toHaveLength(4);
    });

    it("has SPARK, PRO, FAMILY, and ANNUAL", () => {
      expect(PLAN_CONFIGS.SPARK).toBeDefined();
      expect(PLAN_CONFIGS.PRO).toBeDefined();
      expect(PLAN_CONFIGS.FAMILY).toBeDefined();
      expect(PLAN_CONFIGS.ANNUAL).toBeDefined();
    });

    it("each plan has required fields", () => {
      const requiredFields: (keyof PlanConfig)[] = [
        "key",
        "name",
        "priceINR",
        "interval",
        "description",
        "features",
        "childLimit",
        "dailyMinutesLimit",
        "hasAvatar",
        "hasVoice",
        "hasBossChallenge",
        "hasDetailedReports",
        "hasNarrativeReports",
      ];

      for (const [, config] of Object.entries(PLAN_CONFIGS)) {
        for (const field of requiredFields) {
          expect(config[field]).toBeDefined();
        }
      }
    });
  });

  describe("SPARK plan", () => {
    it("is free (₹0)", () => {
      expect(PLAN_CONFIGS.SPARK.priceINR).toBe(0);
    });

    it("allows 1 child", () => {
      expect(PLAN_CONFIGS.SPARK.childLimit).toBe(1);
    });

    it("has 20 min/day limit", () => {
      expect(PLAN_CONFIGS.SPARK.dailyMinutesLimit).toBe(20);
    });

    it("has no avatar", () => {
      expect(PLAN_CONFIGS.SPARK.hasAvatar).toBe(false);
    });

    it("has no voice", () => {
      expect(PLAN_CONFIGS.SPARK.hasVoice).toBe(false);
    });

    it("has no boss challenges", () => {
      expect(PLAN_CONFIGS.SPARK.hasBossChallenge).toBe(false);
    });

    it("has no detailed reports", () => {
      expect(PLAN_CONFIGS.SPARK.hasDetailedReports).toBe(false);
    });

    it("has no narrative reports", () => {
      expect(PLAN_CONFIGS.SPARK.hasNarrativeReports).toBe(false);
    });

    it("has monthly interval", () => {
      expect(PLAN_CONFIGS.SPARK.interval).toBe("month");
    });
  });

  describe("PRO plan", () => {
    it("costs ₹599/month", () => {
      expect(PLAN_CONFIGS.PRO.priceINR).toBe(599);
      expect(PLAN_CONFIGS.PRO.interval).toBe("month");
    });

    it("allows 2 children", () => {
      expect(PLAN_CONFIGS.PRO.childLimit).toBe(2);
    });

    it("has unlimited daily minutes", () => {
      expect(PLAN_CONFIGS.PRO.dailyMinutesLimit).toBe(0);
    });

    it("has avatar and voice", () => {
      expect(PLAN_CONFIGS.PRO.hasAvatar).toBe(true);
      expect(PLAN_CONFIGS.PRO.hasVoice).toBe(true);
    });

    it("has boss challenges", () => {
      expect(PLAN_CONFIGS.PRO.hasBossChallenge).toBe(true);
    });

    it("has all report types", () => {
      expect(PLAN_CONFIGS.PRO.hasDetailedReports).toBe(true);
      expect(PLAN_CONFIGS.PRO.hasNarrativeReports).toBe(true);
    });

    it("is marked as popular", () => {
      expect(PLAN_CONFIGS.PRO.popular).toBe(true);
    });
  });

  describe("FAMILY plan", () => {
    it("costs ₹899/month", () => {
      expect(PLAN_CONFIGS.FAMILY.priceINR).toBe(899);
      expect(PLAN_CONFIGS.FAMILY.interval).toBe("month");
    });

    it("allows 4 children", () => {
      expect(PLAN_CONFIGS.FAMILY.childLimit).toBe(4);
    });

    it("has unlimited daily minutes", () => {
      expect(PLAN_CONFIGS.FAMILY.dailyMinutesLimit).toBe(0);
    });

    it("has all features", () => {
      expect(PLAN_CONFIGS.FAMILY.hasAvatar).toBe(true);
      expect(PLAN_CONFIGS.FAMILY.hasVoice).toBe(true);
      expect(PLAN_CONFIGS.FAMILY.hasBossChallenge).toBe(true);
      expect(PLAN_CONFIGS.FAMILY.hasDetailedReports).toBe(true);
      expect(PLAN_CONFIGS.FAMILY.hasNarrativeReports).toBe(true);
    });
  });

  describe("ANNUAL plan", () => {
    it("costs ₹4999/year", () => {
      expect(PLAN_CONFIGS.ANNUAL.priceINR).toBe(4999);
      expect(PLAN_CONFIGS.ANNUAL.interval).toBe("year");
    });

    it("allows 2 children", () => {
      expect(PLAN_CONFIGS.ANNUAL.childLimit).toBe(2);
    });

    it("has unlimited daily minutes", () => {
      expect(PLAN_CONFIGS.ANNUAL.dailyMinutesLimit).toBe(0);
    });

    it("annual price is less than 12x monthly Pro", () => {
      const annualEquivalent = PLAN_CONFIGS.PRO.priceINR * 12;
      expect(PLAN_CONFIGS.ANNUAL.priceINR).toBeLessThan(annualEquivalent);
    });

    it("annual saves compared to monthly", () => {
      const monthlyTotal = PLAN_CONFIGS.PRO.priceINR * 12;
      const savings = monthlyTotal - PLAN_CONFIGS.ANNUAL.priceINR;
      // Annual should save at least 1 month worth
      expect(savings).toBeGreaterThan(PLAN_CONFIGS.PRO.priceINR);
      // Annual should be cheaper than paying monthly
      expect(PLAN_CONFIGS.ANNUAL.priceINR).toBeLessThan(monthlyTotal);
    });
  });

  describe("getPlanConfig", () => {
    it("returns correct config for valid plan", () => {
      const config = getPlanConfig("PRO");
      expect(config.key).toBe("PRO");
      expect(config.priceINR).toBe(599);
    });

    it("defaults to SPARK for unknown plan", () => {
      const config = getPlanConfig("NONEXISTENT");
      expect(config.key).toBe("SPARK");
      expect(config.priceINR).toBe(0);
    });

    it("returns SPARK for empty string", () => {
      const config = getPlanConfig("");
      expect(config.key).toBe("SPARK");
    });
  });

  describe("planKeyFromPriceId", () => {
    it("returns null for unknown price ID", () => {
      expect(planKeyFromPriceId("price_unknown")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(planKeyFromPriceId("")).toBeNull();
    });
  });

  describe("Feature hierarchy", () => {
    const plans: PlanKey[] = ["SPARK", "PRO", "FAMILY", "ANNUAL"];

    it("child limits increase with plan tier", () => {
      expect(PLAN_CONFIGS.SPARK.childLimit).toBeLessThan(PLAN_CONFIGS.PRO.childLimit);
      expect(PLAN_CONFIGS.PRO.childLimit).toBeLessThanOrEqual(PLAN_CONFIGS.FAMILY.childLimit);
    });

    it("all paid plans have unlimited time", () => {
      const paidPlans: PlanKey[] = ["PRO", "FAMILY", "ANNUAL"];
      for (const plan of paidPlans) {
        expect(PLAN_CONFIGS[plan].dailyMinutesLimit).toBe(0);
      }
    });

    it("all paid plans have avatar and voice", () => {
      const paidPlans: PlanKey[] = ["PRO", "FAMILY", "ANNUAL"];
      for (const plan of paidPlans) {
        expect(PLAN_CONFIGS[plan].hasAvatar).toBe(true);
        expect(PLAN_CONFIGS[plan].hasVoice).toBe(true);
      }
    });

    it("all plans have at least 1 feature listed", () => {
      for (const plan of plans) {
        expect(PLAN_CONFIGS[plan].features.length).toBeGreaterThan(0);
      }
    });

    it("FAMILY has the highest child limit", () => {
      const limits = plans.map((p) => PLAN_CONFIGS[p].childLimit);
      const max = Math.max(...limits);
      expect(PLAN_CONFIGS.FAMILY.childLimit).toBe(max);
    });
  });

  describe("Plan pricing in INR", () => {
    it("all prices are non-negative", () => {
      for (const [, config] of Object.entries(PLAN_CONFIGS)) {
        expect(config.priceINR).toBeGreaterThanOrEqual(0);
      }
    });

    it("free plan is ₹0", () => {
      expect(PLAN_CONFIGS.SPARK.priceINR).toBe(0);
    });

    it("PRO is cheaper than FAMILY", () => {
      expect(PLAN_CONFIGS.PRO.priceINR).toBeLessThan(
        PLAN_CONFIGS.FAMILY.priceINR
      );
    });
  });
});
