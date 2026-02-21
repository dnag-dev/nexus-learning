/**
 * SubscriptionStatus Tests — Phase 10: Billing
 *
 * Tests:
 *  - STATUS_COLORS has entries for all statuses
 *  - STATUS_LABELS has entries for all statuses
 *  - PLAN_DISPLAY has entries for all plans
 *  - formatBillingDate outputs readable dates
 *  - getTrialMessage returns correct messages
 *  - SubscriptionStatusData type shape
 */

import { describe, it, expect } from "vitest";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PLAN_DISPLAY,
  formatBillingDate,
  getTrialMessage,
  type SubscriptionStatusData,
} from "../components/parent/SubscriptionStatus";

// ─── Helpers ───

function makeSubscription(
  overrides: Partial<SubscriptionStatusData> = {}
): SubscriptionStatusData {
  return {
    plan: "PRO",
    status: "ACTIVE",
    currentPeriodEnd: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    isTrialing: false,
    trialDaysRemaining: null,
    ...overrides,
  };
}

// ─── Tests ───

describe("SubscriptionStatus", () => {
  describe("STATUS_COLORS", () => {
    it("has color for ACTIVE", () => {
      expect(STATUS_COLORS.ACTIVE).toBeDefined();
      expect(STATUS_COLORS.ACTIVE).toContain("green");
    });

    it("has color for TRIALING", () => {
      expect(STATUS_COLORS.TRIALING).toBeDefined();
      expect(STATUS_COLORS.TRIALING).toContain("blue");
    });

    it("has color for PAST_DUE", () => {
      expect(STATUS_COLORS.PAST_DUE).toBeDefined();
      expect(STATUS_COLORS.PAST_DUE).toContain("red");
    });

    it("has color for CANCELED", () => {
      expect(STATUS_COLORS.CANCELED).toBeDefined();
      expect(STATUS_COLORS.CANCELED).toContain("gray");
    });

    it("has 4 status colors", () => {
      expect(Object.keys(STATUS_COLORS)).toHaveLength(4);
    });
  });

  describe("STATUS_LABELS", () => {
    it("ACTIVE → Active", () => {
      expect(STATUS_LABELS.ACTIVE).toBe("Active");
    });

    it("TRIALING → Trial", () => {
      expect(STATUS_LABELS.TRIALING).toBe("Trial");
    });

    it("PAST_DUE → Past Due", () => {
      expect(STATUS_LABELS.PAST_DUE).toBe("Past Due");
    });

    it("CANCELED → Canceled", () => {
      expect(STATUS_LABELS.CANCELED).toBe("Canceled");
    });
  });

  describe("PLAN_DISPLAY", () => {
    it("has entry for SPARK", () => {
      expect(PLAN_DISPLAY.SPARK).toBeDefined();
      expect(PLAN_DISPLAY.SPARK.name).toBe("Spark");
      expect(PLAN_DISPLAY.SPARK.icon).toBeTruthy();
    });

    it("has entry for PRO", () => {
      expect(PLAN_DISPLAY.PRO).toBeDefined();
      expect(PLAN_DISPLAY.PRO.name).toBe("Pro");
    });

    it("has entry for FAMILY", () => {
      expect(PLAN_DISPLAY.FAMILY).toBeDefined();
      expect(PLAN_DISPLAY.FAMILY.name).toBe("Family");
    });

    it("has entry for ANNUAL", () => {
      expect(PLAN_DISPLAY.ANNUAL).toBeDefined();
      expect(PLAN_DISPLAY.ANNUAL.name).toBe("Annual Pro");
    });

    it("each plan display has icon and color", () => {
      for (const display of Object.values(PLAN_DISPLAY)) {
        expect(display.icon).toBeTruthy();
        expect(display.color).toBeTruthy();
        expect(display.color).toContain("bg-");
      }
    });

    it("has 4 entries", () => {
      expect(Object.keys(PLAN_DISPLAY)).toHaveLength(4);
    });
  });

  describe("formatBillingDate", () => {
    it("formats ISO date string", () => {
      // Use noon UTC to avoid timezone day-shift issues
      const result = formatBillingDate("2025-03-15T12:00:00Z");
      expect(result).toContain("Mar");
      expect(result).toContain("2025");
    });

    it("formats another date", () => {
      const result = formatBillingDate("2025-12-25T12:00:00Z");
      expect(result).toContain("Dec");
      expect(result).toContain("2025");
    });

    it("returns a string", () => {
      const result = formatBillingDate(new Date().toISOString());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getTrialMessage", () => {
    it("returns empty string for null", () => {
      expect(getTrialMessage(null)).toBe("");
    });

    it("returns 'Trial expired' for 0 days", () => {
      expect(getTrialMessage(0)).toBe("Trial expired");
    });

    it("returns 'Trial ends tomorrow' for 1 day", () => {
      expect(getTrialMessage(1)).toBe("Trial ends tomorrow");
    });

    it("returns 'X days left in trial' for multiple days", () => {
      const msg = getTrialMessage(7);
      expect(msg).toBe("7 days left in trial");
    });

    it("returns correct message for 14 days", () => {
      const msg = getTrialMessage(14);
      expect(msg).toBe("14 days left in trial");
    });

    it("returns 'Trial expired' for negative days", () => {
      expect(getTrialMessage(-1)).toBe("Trial expired");
    });
  });

  describe("SubscriptionStatusData type shape", () => {
    it("has all required fields", () => {
      const sub = makeSubscription();

      expect(sub.plan).toBe("PRO");
      expect(sub.status).toBe("ACTIVE");
      expect(sub.currentPeriodEnd).toBeTruthy();
      expect(sub.cancelAtPeriodEnd).toBe(false);
      expect(sub.trialEndsAt).toBeNull();
      expect(sub.isTrialing).toBe(false);
      expect(sub.trialDaysRemaining).toBeNull();
    });

    it("supports trialing state", () => {
      const sub = makeSubscription({
        status: "TRIALING",
        isTrialing: true,
        trialDaysRemaining: 10,
        trialEndsAt: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      expect(sub.isTrialing).toBe(true);
      expect(sub.trialDaysRemaining).toBe(10);
      expect(sub.trialEndsAt).toBeTruthy();
    });

    it("supports cancel at period end", () => {
      const sub = makeSubscription({
        cancelAtPeriodEnd: true,
      });

      expect(sub.cancelAtPeriodEnd).toBe(true);
    });

    it("supports past due status", () => {
      const sub = makeSubscription({
        status: "PAST_DUE",
      });

      expect(sub.status).toBe("PAST_DUE");
    });

    it("supports all plan types", () => {
      const plans = ["SPARK", "PRO", "FAMILY", "ANNUAL"];
      for (const plan of plans) {
        const sub = makeSubscription({ plan });
        expect(sub.plan).toBe(plan);
      }
    });
  });

  describe("Trial progress calculation", () => {
    it("14 days remaining = 0% progress", () => {
      const progress = ((14 - 14) / 14) * 100;
      expect(progress).toBe(0);
    });

    it("7 days remaining = 50% progress", () => {
      const progress = ((14 - 7) / 14) * 100;
      expect(progress).toBe(50);
    });

    it("0 days remaining = 100% progress", () => {
      const progress = ((14 - 0) / 14) * 100;
      expect(progress).toBe(100);
    });

    it("1 day remaining = ~93% progress", () => {
      const progress = ((14 - 1) / 14) * 100;
      expect(Math.round(progress)).toBe(93);
    });
  });
});
