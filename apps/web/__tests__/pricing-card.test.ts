/**
 * PricingCard Tests — Phase 10: Billing
 *
 * Tests:
 *  - formatINR outputs correct ₹ strings
 *  - getPriceDisplay formats interval correctly
 *  - getButtonText returns correct CTA per state
 *  - getButtonStyle returns correct classes
 *  - PLAN_ICONS has entries for all 4 plans
 *  - PLAN_BADGE_COLORS has entries for all 4 plans
 *  - FAQ_ITEMS has correct structure
 */

import { describe, it, expect } from "vitest";
import {
  formatINR,
  getPriceDisplay,
  getButtonText,
  getButtonStyle,
  PLAN_ICONS,
  PLAN_BADGE_COLORS,
  FAQ_ITEMS,
} from "../components/parent/PricingCard";
import { PLAN_CONFIGS } from "../lib/billing/stripe-client";

// ─── Tests ───

describe("PricingCard", () => {
  describe("formatINR", () => {
    it("formats 0 as 'Free'", () => {
      expect(formatINR(0)).toBe("Free");
    });

    it("formats 599 with ₹", () => {
      expect(formatINR(599)).toContain("₹");
      expect(formatINR(599)).toContain("599");
    });

    it("formats 4999 with ₹", () => {
      expect(formatINR(4999)).toContain("₹");
      expect(formatINR(4999)).toContain("4,999");
    });

    it("formats 899 with ₹", () => {
      expect(formatINR(899)).toContain("₹");
      expect(formatINR(899)).toContain("899");
    });

    it("returns 'Free' only for 0", () => {
      expect(formatINR(1)).not.toBe("Free");
      expect(formatINR(0)).toBe("Free");
    });
  });

  describe("getPriceDisplay", () => {
    it("SPARK shows 'Free forever'", () => {
      expect(getPriceDisplay(PLAN_CONFIGS.SPARK)).toBe("Free forever");
    });

    it("PRO shows ₹599/month", () => {
      const display = getPriceDisplay(PLAN_CONFIGS.PRO);
      expect(display).toContain("599");
      expect(display).toContain("/month");
    });

    it("FAMILY shows ₹899/month", () => {
      const display = getPriceDisplay(PLAN_CONFIGS.FAMILY);
      expect(display).toContain("899");
      expect(display).toContain("/month");
    });

    it("ANNUAL shows /year", () => {
      const display = getPriceDisplay(PLAN_CONFIGS.ANNUAL);
      expect(display).toContain("/year");
    });
  });

  describe("getButtonText", () => {
    it("shows 'Current Plan' when plan matches", () => {
      expect(getButtonText("PRO", "PRO")).toBe("Current Plan");
      expect(getButtonText("SPARK", "SPARK")).toBe("Current Plan");
    });

    it("shows 'Get Started' for upgrade from SPARK", () => {
      expect(getButtonText("PRO", "SPARK")).toBe("Get Started");
      expect(getButtonText("FAMILY", "SPARK")).toBe("Get Started");
    });

    it("shows 'Get Started' when no current plan", () => {
      expect(getButtonText("PRO", null)).toBe("Get Started");
    });

    it("shows 'Downgrade' for SPARK when on paid plan", () => {
      expect(getButtonText("SPARK", "PRO")).toBe("Downgrade");
    });

    it("shows 'Switch Plan' for plan-to-plan change", () => {
      expect(getButtonText("FAMILY", "PRO")).toBe("Switch Plan");
      expect(getButtonText("PRO", "FAMILY")).toBe("Switch Plan");
    });
  });

  describe("getButtonStyle", () => {
    it("current plan has gray disabled style", () => {
      const style = getButtonStyle("PRO", "PRO", false);
      expect(style).toContain("gray");
      expect(style).toContain("cursor-default");
    });

    it("popular plan has purple style", () => {
      const style = getButtonStyle("PRO", "SPARK", true);
      expect(style).toContain("purple");
    });

    it("non-popular non-current has dark style", () => {
      const style = getButtonStyle("FAMILY", "SPARK", false);
      expect(style).toContain("gray-900");
    });
  });

  describe("PLAN_ICONS", () => {
    it("has entry for SPARK", () => {
      expect(PLAN_ICONS.SPARK).toBeDefined();
      expect(typeof PLAN_ICONS.SPARK).toBe("string");
    });

    it("has entry for PRO", () => {
      expect(PLAN_ICONS.PRO).toBeDefined();
    });

    it("has entry for FAMILY", () => {
      expect(PLAN_ICONS.FAMILY).toBeDefined();
    });

    it("has entry for ANNUAL", () => {
      expect(PLAN_ICONS.ANNUAL).toBeDefined();
    });

    it("has 4 entries total", () => {
      expect(Object.keys(PLAN_ICONS)).toHaveLength(4);
    });
  });

  describe("PLAN_BADGE_COLORS", () => {
    it("has color for SPARK", () => {
      expect(PLAN_BADGE_COLORS.SPARK).toBeDefined();
      expect(PLAN_BADGE_COLORS.SPARK).toContain("bg-");
    });

    it("has color for PRO", () => {
      expect(PLAN_BADGE_COLORS.PRO).toContain("purple");
    });

    it("has color for FAMILY", () => {
      expect(PLAN_BADGE_COLORS.FAMILY).toContain("blue");
    });

    it("has color for ANNUAL", () => {
      expect(PLAN_BADGE_COLORS.ANNUAL).toContain("amber");
    });

    it("all colors have bg and text classes", () => {
      for (const color of Object.values(PLAN_BADGE_COLORS)) {
        expect(color).toMatch(/bg-/);
        expect(color).toMatch(/text-/);
      }
    });
  });

  describe("FAQ_ITEMS", () => {
    it("has at least 5 questions", () => {
      expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
    });

    it("each FAQ has question and answer", () => {
      for (const faq of FAQ_ITEMS) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
        expect(typeof faq.question).toBe("string");
        expect(typeof faq.answer).toBe("string");
      }
    });

    it("questions end with ?", () => {
      for (const faq of FAQ_ITEMS) {
        expect(faq.question.endsWith("?")).toBe(true);
      }
    });

    it("has a question about free trial", () => {
      const trialQ = FAQ_ITEMS.find(
        (f) =>
          f.question.toLowerCase().includes("trial") ||
          f.question.toLowerCase().includes("free")
      );
      expect(trialQ).toBeDefined();
    });

    it("has a question about cancellation", () => {
      const cancelQ = FAQ_ITEMS.find(
        (f) =>
          f.question.toLowerCase().includes("cancel")
      );
      expect(cancelQ).toBeDefined();
    });

    it("has a question about plan changes", () => {
      const changeQ = FAQ_ITEMS.find(
        (f) =>
          f.question.toLowerCase().includes("change") ||
          f.question.toLowerCase().includes("switch")
      );
      expect(changeQ).toBeDefined();
    });

    it("has a question about Family plan", () => {
      const familyQ = FAQ_ITEMS.find(
        (f) =>
          f.question.toLowerCase().includes("family") ||
          f.answer.toLowerCase().includes("family")
      );
      expect(familyQ).toBeDefined();
    });
  });
});
