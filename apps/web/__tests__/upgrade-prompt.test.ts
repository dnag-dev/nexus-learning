/**
 * UpgradePrompt Tests — Phase 10: Billing
 *
 * Tests:
 *  - FEATURE_UPGRADE_MESSAGES has entries for all features
 *  - getUpgradeMessage returns correct messages
 *  - getRecommendedPlan returns correct plan
 *  - Default message for unknown features
 */

import { describe, it, expect } from "vitest";
import {
  FEATURE_UPGRADE_MESSAGES,
  getUpgradeMessage,
  getRecommendedPlan,
} from "../components/parent/UpgradePrompt";

// ─── Tests ───

describe("UpgradePrompt", () => {
  describe("FEATURE_UPGRADE_MESSAGES", () => {
    it("has message for avatar", () => {
      expect(FEATURE_UPGRADE_MESSAGES.avatar).toBeDefined();
      expect(typeof FEATURE_UPGRADE_MESSAGES.avatar).toBe("string");
    });

    it("has message for voice", () => {
      expect(FEATURE_UPGRADE_MESSAGES.voice).toBeDefined();
    });

    it("has message for boss_challenge", () => {
      expect(FEATURE_UPGRADE_MESSAGES.boss_challenge).toBeDefined();
    });

    it("has message for detailed_reports", () => {
      expect(FEATURE_UPGRADE_MESSAGES.detailed_reports).toBeDefined();
    });

    it("has message for narrative_reports", () => {
      expect(FEATURE_UPGRADE_MESSAGES.narrative_reports).toBeDefined();
    });

    it("has message for extra_children", () => {
      expect(FEATURE_UPGRADE_MESSAGES.extra_children).toBeDefined();
    });

    it("has message for unlimited_time", () => {
      expect(FEATURE_UPGRADE_MESSAGES.unlimited_time).toBeDefined();
    });

    it("has 7 total feature messages", () => {
      expect(Object.keys(FEATURE_UPGRADE_MESSAGES)).toHaveLength(7);
    });

    it("all messages are non-empty strings", () => {
      for (const msg of Object.values(FEATURE_UPGRADE_MESSAGES)) {
        expect(msg.length).toBeGreaterThan(10);
      }
    });
  });

  describe("getUpgradeMessage", () => {
    it("returns known message for avatar", () => {
      const msg = getUpgradeMessage("avatar");
      expect(msg).toBe(FEATURE_UPGRADE_MESSAGES.avatar);
    });

    it("returns known message for voice", () => {
      const msg = getUpgradeMessage("voice");
      expect(msg).toBe(FEATURE_UPGRADE_MESSAGES.voice);
    });

    it("returns default message for unknown feature", () => {
      const msg = getUpgradeMessage("teleportation");
      expect(msg).toContain("teleportation");
      expect(msg).toContain("Upgrade");
    });

    it("default message is different from known messages", () => {
      const defaultMsg = getUpgradeMessage("xyz");
      for (const known of Object.values(FEATURE_UPGRADE_MESSAGES)) {
        expect(defaultMsg).not.toBe(known);
      }
    });
  });

  describe("getRecommendedPlan", () => {
    it("recommends FAMILY for extra_children", () => {
      expect(getRecommendedPlan("extra_children")).toBe("FAMILY");
    });

    it("recommends PRO for avatar", () => {
      expect(getRecommendedPlan("avatar")).toBe("PRO");
    });

    it("recommends PRO for voice", () => {
      expect(getRecommendedPlan("voice")).toBe("PRO");
    });

    it("recommends PRO for boss_challenge", () => {
      expect(getRecommendedPlan("boss_challenge")).toBe("PRO");
    });

    it("recommends PRO for detailed_reports", () => {
      expect(getRecommendedPlan("detailed_reports")).toBe("PRO");
    });

    it("recommends PRO for narrative_reports", () => {
      expect(getRecommendedPlan("narrative_reports")).toBe("PRO");
    });

    it("recommends PRO for unlimited_time", () => {
      expect(getRecommendedPlan("unlimited_time")).toBe("PRO");
    });

    it("recommends PRO for unknown features", () => {
      expect(getRecommendedPlan("anything")).toBe("PRO");
    });
  });

  describe("Feature → Plan mapping consistency", () => {
    it("all feature messages mention learning or child context", () => {
      for (const msg of Object.values(FEATURE_UPGRADE_MESSAGES)) {
        const lowerMsg = msg.toLowerCase();
        const hasContext =
          lowerMsg.includes("learn") ||
          lowerMsg.includes("child") ||
          lowerMsg.includes("tutor") ||
          lowerMsg.includes("report") ||
          lowerMsg.includes("assess") ||
          lowerMsg.includes("knowledge") ||
          lowerMsg.includes("explor") ||
          lowerMsg.includes("profile");
        expect(hasContext).toBe(true);
      }
    });
  });
});
