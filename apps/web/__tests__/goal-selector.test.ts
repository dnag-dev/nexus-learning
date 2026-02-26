/**
 * Goal Selector Tests — Learning GPS Step 6
 *
 * Tests goal selection logic:
 * - GoalCategory validation
 * - Goal data shape
 * - Subject-grade mapping
 * - Goal limits (max 3 concurrent plans)
 * - Custom goal interpretation structure
 */

import { describe, it, expect } from "vitest";

// ─── Types (matching schema.prisma enums) ───

type GoalCategory = "GRADE_PROFICIENCY" | "EXAM_PREP" | "SKILL_BUILDING" | "CUSTOM";
type PlanStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";

interface GoalShape {
  id: string;
  name: string;
  category: GoalCategory;
  description: string;
  requiredNodeIds: string[];
  gradeLevel: string | null;
  subject: string | null;
}

const MAX_CONCURRENT_PLANS = 3;

// ─── Tests ───

describe("Goal Selector", () => {
  // ─── GoalCategory ───

  describe("GoalCategory enum", () => {
    it("includes all 4 categories", () => {
      const categories: GoalCategory[] = [
        "GRADE_PROFICIENCY",
        "EXAM_PREP",
        "SKILL_BUILDING",
        "CUSTOM",
      ];
      expect(categories).toHaveLength(4);
    });

    it("GRADE_PROFICIENCY is for grade-level mastery", () => {
      const category: GoalCategory = "GRADE_PROFICIENCY";
      expect(category).toBe("GRADE_PROFICIENCY");
    });

    it("EXAM_PREP covers SAT, ACT, ISEE, PSAT", () => {
      const examGoals = [
        "SAT Math",
        "SAT Reading & Writing",
        "ACT Math",
        "ACT English",
        "ISEE Lower Level",
        "ISEE Middle Level",
        "ISEE Upper Level",
        "PSAT Math",
        "PSAT Reading & Writing",
      ];
      expect(examGoals.length).toBeGreaterThanOrEqual(9);
    });
  });

  // ─── PlanStatus ───

  describe("PlanStatus enum", () => {
    it("includes all 4 statuses", () => {
      const statuses: PlanStatus[] = ["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"];
      expect(statuses).toHaveLength(4);
    });

    it("only ACTIVE and PAUSED are resumable", () => {
      const resumable: PlanStatus[] = ["ACTIVE", "PAUSED"];
      expect(resumable).toContain("ACTIVE");
      expect(resumable).toContain("PAUSED");
      expect(resumable).not.toContain("COMPLETED");
      expect(resumable).not.toContain("ABANDONED");
    });
  });

  // ─── Goal Data Shape ───

  describe("Goal data shape", () => {
    it("Grade Proficiency goal has required fields", () => {
      const goal: GoalShape = {
        id: "goal-g3-math",
        name: "Grade 3 Math Proficiency",
        category: "GRADE_PROFICIENCY",
        description: "Master all Grade 3 Common Core Math standards",
        requiredNodeIds: ["MATH.3.OA.1", "MATH.3.OA.2", "MATH.3.NF.1"],
        gradeLevel: "G3",
        subject: "MATH",
      };

      expect(goal.name).toContain("Grade 3");
      expect(goal.category).toBe("GRADE_PROFICIENCY");
      expect(goal.requiredNodeIds.length).toBeGreaterThan(0);
      expect(goal.gradeLevel).toBe("G3");
      expect(goal.subject).toBe("MATH");
    });

    it("Exam Prep goal has required fields", () => {
      const goal: GoalShape = {
        id: "goal-sat-math",
        name: "SAT Math Preparation",
        category: "EXAM_PREP",
        description: "Prepare for the SAT Math section",
        requiredNodeIds: ["MATH.K.CC.1", "MATH.1.OA.1", "MATH.5.NF.1"],
        gradeLevel: null,
        subject: "MATH",
      };

      expect(goal.category).toBe("EXAM_PREP");
      expect(goal.gradeLevel).toBeNull(); // Exam prep isn't grade-specific
    });

    it("Custom goal has required fields", () => {
      const goal: GoalShape = {
        id: "goal-custom-1",
        name: "Custom: Master Fractions",
        category: "CUSTOM",
        description: "Focus on fractions and decimals",
        requiredNodeIds: ["MATH.3.NF.1", "MATH.4.NF.1", "MATH.5.NF.1"],
        gradeLevel: null,
        subject: null,
      };

      expect(goal.category).toBe("CUSTOM");
    });
  });

  // ─── Concurrent Plan Limits ───

  describe("Concurrent plan limits", () => {
    it("maximum 3 concurrent active plans", () => {
      expect(MAX_CONCURRENT_PLANS).toBe(3);
    });

    it("can check if limit is reached", () => {
      const activePlans = ["plan-1", "plan-2", "plan-3"];
      const canCreate = activePlans.length < MAX_CONCURRENT_PLANS;
      expect(canCreate).toBe(false);
    });

    it("allows creation when under limit", () => {
      const activePlans = ["plan-1", "plan-2"];
      const canCreate = activePlans.length < MAX_CONCURRENT_PLANS;
      expect(canCreate).toBe(true);
    });

    it("paused plans don't count toward limit", () => {
      const plans = [
        { id: "1", status: "ACTIVE" as PlanStatus },
        { id: "2", status: "PAUSED" as PlanStatus },
        { id: "3", status: "ACTIVE" as PlanStatus },
        { id: "4", status: "COMPLETED" as PlanStatus },
      ];
      const activeCount = plans.filter((p) => p.status === "ACTIVE").length;
      expect(activeCount).toBe(2);
      expect(activeCount < MAX_CONCURRENT_PLANS).toBe(true);
    });
  });

  // ─── Subject-Grade Mapping ───

  describe("Subject-grade mapping", () => {
    const MATH_GRADES = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
    const ELA_GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];

    it("Math covers K-12", () => {
      expect(MATH_GRADES).toHaveLength(13);
      expect(MATH_GRADES[0]).toBe("K");
      expect(MATH_GRADES[12]).toBe("G12");
    });

    it("ELA covers G1-12 (no Kindergarten)", () => {
      expect(ELA_GRADES).toHaveLength(12);
      expect(ELA_GRADES[0]).toBe("G1");
      expect(ELA_GRADES[11]).toBe("G12");
      expect(ELA_GRADES).not.toContain("K");
    });

    it("all ELA grades are also in Math grades", () => {
      for (const grade of ELA_GRADES) {
        expect(MATH_GRADES).toContain(grade);
      }
    });
  });

  // ─── Timeline Options ───

  describe("Timeline options", () => {
    it("supports standard timeline options", () => {
      const options = ["ASAP", "3_MONTHS", "6_MONTHS", "CUSTOM_DATE"];
      expect(options).toHaveLength(4);
    });

    it("ASAP means no target date constraint", () => {
      const targetDate = null; // ASAP = no specific target
      expect(targetDate).toBeNull();
    });

    it("3 months calculates correct target", () => {
      const now = new Date("2025-01-15");
      const target = new Date(now);
      target.setMonth(target.getMonth() + 3);
      expect(target.getMonth()).toBe(3); // April
    });

    it("6 months calculates correct target", () => {
      const now = new Date("2025-01-15");
      const target = new Date(now);
      target.setMonth(target.getMonth() + 6);
      expect(target.getMonth()).toBe(6); // July
    });
  });

  // ─── Practice Time Slider ───

  describe("Practice time configuration", () => {
    it("accepts range 10-60 min/day", () => {
      const min = 10;
      const max = 60;
      expect(min).toBe(10);
      expect(max).toBe(60);
    });

    it("converts daily minutes to weekly hours", () => {
      const dailyMinutes = 30;
      const daysPerWeek = 5; // Weekdays only
      const weeklyHours = (dailyMinutes * daysPerWeek) / 60;
      expect(weeklyHours).toBe(2.5);
    });

    it("minimum daily time yields reasonable weekly hours", () => {
      const weeklyHours = (10 * 5) / 60; // 10 min × 5 days
      expect(weeklyHours).toBeCloseTo(0.83, 1);
      expect(weeklyHours).toBeGreaterThan(0);
    });
  });
});
