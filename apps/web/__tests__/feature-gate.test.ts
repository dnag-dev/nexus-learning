/**
 * Feature Gate Tests — Phase 10: Billing
 *
 * Tests:
 *  - isFeatureAvailable for each feature × each plan
 *  - canAddChildForPlan with various child counts
 *  - getDailyMinutesLimit returns correct values
 *  - getAvailableFeatures returns correct sets
 *  - getLockedFeatures returns correct sets
 *  - getUpgradeGains shows features gained by upgrading
 */

import { describe, it, expect } from "vitest";
import {
  isFeatureAvailable,
  canAddChildForPlan,
  getDailyMinutesLimit,
  getAvailableFeatures,
  getLockedFeatures,
  getUpgradeGains,
  getEnrichedPlanConfig,
  type GatedFeature,
} from "../lib/billing/feature-gate";

// ─── Tests ───

describe("Feature Gate", () => {
  describe("isFeatureAvailable — SPARK plan", () => {
    it("denies avatar", () => {
      const result = isFeatureAvailable("SPARK", "avatar");
      expect(result.allowed).toBe(false);
      expect(result.requiredPlan).toBe("PRO");
    });

    it("denies voice", () => {
      const result = isFeatureAvailable("SPARK", "voice");
      expect(result.allowed).toBe(false);
    });

    it("denies boss_challenge", () => {
      const result = isFeatureAvailable("SPARK", "boss_challenge");
      expect(result.allowed).toBe(false);
    });

    it("denies detailed_reports", () => {
      const result = isFeatureAvailable("SPARK", "detailed_reports");
      expect(result.allowed).toBe(false);
    });

    it("denies narrative_reports", () => {
      const result = isFeatureAvailable("SPARK", "narrative_reports");
      expect(result.allowed).toBe(false);
    });

    it("denies unlimited_time", () => {
      const result = isFeatureAvailable("SPARK", "unlimited_time");
      expect(result.allowed).toBe(false);
    });

    it("denies extra_children", () => {
      const result = isFeatureAvailable("SPARK", "extra_children");
      expect(result.allowed).toBe(false);
    });

    it("all denied features have reason string", () => {
      const features: GatedFeature[] = [
        "avatar",
        "voice",
        "boss_challenge",
        "detailed_reports",
        "narrative_reports",
        "unlimited_time",
        "extra_children",
      ];

      for (const f of features) {
        const result = isFeatureAvailable("SPARK", f);
        if (!result.allowed) {
          expect(result.reason).toBeTruthy();
          expect(typeof result.reason).toBe("string");
        }
      }
    });
  });

  describe("isFeatureAvailable — PRO plan", () => {
    it("allows avatar", () => {
      expect(isFeatureAvailable("PRO", "avatar").allowed).toBe(true);
    });

    it("allows voice", () => {
      expect(isFeatureAvailable("PRO", "voice").allowed).toBe(true);
    });

    it("allows boss_challenge", () => {
      expect(isFeatureAvailable("PRO", "boss_challenge").allowed).toBe(true);
    });

    it("allows detailed_reports", () => {
      expect(isFeatureAvailable("PRO", "detailed_reports").allowed).toBe(true);
    });

    it("allows narrative_reports", () => {
      expect(isFeatureAvailable("PRO", "narrative_reports").allowed).toBe(true);
    });

    it("allows unlimited_time", () => {
      expect(isFeatureAvailable("PRO", "unlimited_time").allowed).toBe(true);
    });

    it("allows extra_children", () => {
      expect(isFeatureAvailable("PRO", "extra_children").allowed).toBe(true);
    });
  });

  describe("isFeatureAvailable — FAMILY plan", () => {
    it("allows all features", () => {
      const features: GatedFeature[] = [
        "avatar",
        "voice",
        "boss_challenge",
        "detailed_reports",
        "narrative_reports",
        "unlimited_time",
        "extra_children",
      ];

      for (const f of features) {
        expect(isFeatureAvailable("FAMILY", f).allowed).toBe(true);
      }
    });
  });

  describe("isFeatureAvailable — ANNUAL plan", () => {
    it("allows all features", () => {
      const features: GatedFeature[] = [
        "avatar",
        "voice",
        "boss_challenge",
        "detailed_reports",
        "narrative_reports",
        "unlimited_time",
        "extra_children",
      ];

      for (const f of features) {
        expect(isFeatureAvailable("ANNUAL", f).allowed).toBe(true);
      }
    });
  });

  describe("isFeatureAvailable — unknown plan", () => {
    it("defaults to SPARK (denies premium features)", () => {
      expect(isFeatureAvailable("UNKNOWN", "avatar").allowed).toBe(false);
      expect(isFeatureAvailable("UNKNOWN", "voice").allowed).toBe(false);
    });
  });

  describe("canAddChildForPlan", () => {
    it("SPARK allows 1st child", () => {
      const result = canAddChildForPlan("SPARK", 0);
      expect(result.allowed).toBe(true);
    });

    it("SPARK denies 2nd child", () => {
      const result = canAddChildForPlan("SPARK", 1);
      expect(result.allowed).toBe(false);
      expect(result.requiredPlan).toBe("PRO");
    });

    it("PRO allows 2nd child", () => {
      const result = canAddChildForPlan("PRO", 1);
      expect(result.allowed).toBe(true);
    });

    it("PRO denies 3rd child", () => {
      const result = canAddChildForPlan("PRO", 2);
      expect(result.allowed).toBe(false);
      expect(result.requiredPlan).toBe("FAMILY");
    });

    it("FAMILY allows up to 4 children", () => {
      expect(canAddChildForPlan("FAMILY", 0).allowed).toBe(true);
      expect(canAddChildForPlan("FAMILY", 1).allowed).toBe(true);
      expect(canAddChildForPlan("FAMILY", 2).allowed).toBe(true);
      expect(canAddChildForPlan("FAMILY", 3).allowed).toBe(true);
    });

    it("FAMILY denies 5th child", () => {
      const result = canAddChildForPlan("FAMILY", 4);
      expect(result.allowed).toBe(false);
    });

    it("denied result has reason string", () => {
      const result = canAddChildForPlan("SPARK", 1);
      expect(result.reason).toBeTruthy();
      expect(result.reason).toContain("1");
    });
  });

  describe("getDailyMinutesLimit", () => {
    it("SPARK = 20 minutes", () => {
      expect(getDailyMinutesLimit("SPARK")).toBe(20);
    });

    it("PRO = unlimited (-1)", () => {
      expect(getDailyMinutesLimit("PRO")).toBe(-1);
    });

    it("FAMILY = unlimited (-1)", () => {
      expect(getDailyMinutesLimit("FAMILY")).toBe(-1);
    });

    it("ANNUAL = unlimited (-1)", () => {
      expect(getDailyMinutesLimit("ANNUAL")).toBe(-1);
    });

    it("unknown plan = 20 (SPARK default)", () => {
      expect(getDailyMinutesLimit("NOPE")).toBe(20);
    });
  });

  describe("getAvailableFeatures", () => {
    it("SPARK has 0 gated features", () => {
      const features = getAvailableFeatures("SPARK");
      expect(features).toHaveLength(0);
    });

    it("PRO has all 7 features", () => {
      const features = getAvailableFeatures("PRO");
      expect(features).toHaveLength(7);
    });

    it("FAMILY has all 7 features", () => {
      const features = getAvailableFeatures("FAMILY");
      expect(features).toHaveLength(7);
    });

    it("ANNUAL has all 7 features", () => {
      const features = getAvailableFeatures("ANNUAL");
      expect(features).toHaveLength(7);
    });
  });

  describe("getLockedFeatures", () => {
    it("SPARK has all 7 locked", () => {
      const locked = getLockedFeatures("SPARK");
      expect(locked).toHaveLength(7);
    });

    it("PRO has 0 locked", () => {
      const locked = getLockedFeatures("PRO");
      expect(locked).toHaveLength(0);
    });
  });

  describe("getUpgradeGains", () => {
    it("SPARK → PRO gains all 7 features", () => {
      const gains = getUpgradeGains("SPARK", "PRO");
      expect(gains).toHaveLength(7);
    });

    it("PRO → FAMILY gains 0 features (same features)", () => {
      const gains = getUpgradeGains("PRO", "FAMILY");
      expect(gains).toHaveLength(0);
    });

    it("PRO → PRO gains 0 features", () => {
      const gains = getUpgradeGains("PRO", "PRO");
      expect(gains).toHaveLength(0);
    });

    it("SPARK → SPARK gains 0 features", () => {
      const gains = getUpgradeGains("SPARK", "SPARK");
      expect(gains).toHaveLength(0);
    });
  });

  describe("getEnrichedPlanConfig", () => {
    it("includes availableFeatures and lockedFeatures", () => {
      const enriched = getEnrichedPlanConfig("SPARK");
      expect(enriched.availableFeatures).toBeDefined();
      expect(enriched.lockedFeatures).toBeDefined();
      expect(Array.isArray(enriched.availableFeatures)).toBe(true);
      expect(Array.isArray(enriched.lockedFeatures)).toBe(true);
    });

    it("available + locked = 7 total features", () => {
      const enriched = getEnrichedPlanConfig("SPARK");
      expect(
        enriched.availableFeatures.length + enriched.lockedFeatures.length
      ).toBe(7);
    });

    it("PRO has 7 available and 0 locked", () => {
      const enriched = getEnrichedPlanConfig("PRO");
      expect(enriched.availableFeatures).toHaveLength(7);
      expect(enriched.lockedFeatures).toHaveLength(0);
    });
  });
});
