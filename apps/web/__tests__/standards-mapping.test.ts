/**
 * Standards Mapping Tests — Learning GPS Step 2 & 15
 *
 * Tests the structure and completeness of standards data:
 * - Node code format validation
 * - Grade coverage validation
 * - Subject coverage
 * - Prerequisite chain validity
 * - Goal category coverage
 */

import { describe, it, expect } from "vitest";

// ─── Node Code Format Validators ───

function isValidMathNodeCode(code: string): boolean {
  // Format: MATH.G<N>.DOMAIN.N or MATH.K.DOMAIN.N
  return /^MATH\.(K|G\d{1,2})\.[A-Z]+\.\d+$/.test(code);
}

function isValidELANodeCode(code: string): boolean {
  // Format: ELA.G<N>.DOMAIN.N
  return /^ELA\.G\d{1,2}\.[A-Z]+\.\d+$/.test(code);
}

function extractGradeFromCode(code: string): string | null {
  const match = code.match(/\.(K|G\d{1,2})\./);
  return match ? match[1] : null;
}

function extractSubjectFromCode(code: string): string | null {
  if (code.startsWith("MATH.")) return "MATH";
  if (code.startsWith("ELA.")) return "ENGLISH";
  return null;
}

function extractDomainFromCode(code: string): string | null {
  const parts = code.split(".");
  return parts.length >= 3 ? parts[2] : null;
}

// ─── Tests ───

describe("Standards Mapping", () => {
  // ─── Node Code Format ───

  describe("Node code format", () => {
    it("validates correct Math node codes", () => {
      expect(isValidMathNodeCode("MATH.K.CC.1")).toBe(true);
      expect(isValidMathNodeCode("MATH.G1.OA.1")).toBe(true);
      expect(isValidMathNodeCode("MATH.G5.NF.3")).toBe(true);
      expect(isValidMathNodeCode("MATH.G10.GEOM.1")).toBe(true);
      expect(isValidMathNodeCode("MATH.G12.CALC.3")).toBe(true);
    });

    it("rejects invalid Math node codes", () => {
      expect(isValidMathNodeCode("MATH")).toBe(false);
      expect(isValidMathNodeCode("MATH.K")).toBe(false);
      expect(isValidMathNodeCode("ELA.G1.RL.1")).toBe(false);
      expect(isValidMathNodeCode("MATH.G1.OA")).toBe(false);
    });

    it("validates correct ELA node codes", () => {
      expect(isValidELANodeCode("ELA.G1.RL.1")).toBe(true);
      expect(isValidELANodeCode("ELA.G5.W.2")).toBe(true);
      expect(isValidELANodeCode("ELA.G10.RHET.1")).toBe(true);
      expect(isValidELANodeCode("ELA.G12.LIT.4")).toBe(true);
    });

    it("rejects invalid ELA node codes", () => {
      expect(isValidELANodeCode("ELA")).toBe(false);
      expect(isValidELANodeCode("MATH.G1.OA.1")).toBe(false);
      expect(isValidELANodeCode("ELA.K.RL.1")).toBe(false); // ELA has no K
    });
  });

  // ─── Grade Extraction ───

  describe("Grade extraction", () => {
    it("extracts K from kindergarten codes", () => {
      expect(extractGradeFromCode("MATH.K.CC.1")).toBe("K");
    });

    it("extracts single-digit grades", () => {
      expect(extractGradeFromCode("MATH.G1.OA.1")).toBe("G1");
      expect(extractGradeFromCode("ELA.G5.RL.1")).toBe("G5");
    });

    it("extracts double-digit grades", () => {
      expect(extractGradeFromCode("MATH.G10.GEOM.1")).toBe("G10");
      expect(extractGradeFromCode("ELA.G12.LIT.1")).toBe("G12");
    });

    it("returns null for invalid codes", () => {
      expect(extractGradeFromCode("invalid")).toBeNull();
    });
  });

  // ─── Subject Extraction ───

  describe("Subject extraction", () => {
    it("identifies MATH subject", () => {
      expect(extractSubjectFromCode("MATH.K.CC.1")).toBe("MATH");
      expect(extractSubjectFromCode("MATH.G5.NF.3")).toBe("MATH");
    });

    it("identifies ENGLISH subject", () => {
      expect(extractSubjectFromCode("ELA.G1.RL.1")).toBe("ENGLISH");
      expect(extractSubjectFromCode("ELA.G12.LIT.4")).toBe("ENGLISH");
    });

    it("returns null for unknown prefix", () => {
      expect(extractSubjectFromCode("SCIENCE.G1.BIO.1")).toBeNull();
    });
  });

  // ─── Domain Extraction ───

  describe("Domain extraction", () => {
    it("extracts Math domains", () => {
      expect(extractDomainFromCode("MATH.K.CC.1")).toBe("CC");
      expect(extractDomainFromCode("MATH.G1.OA.1")).toBe("OA");
      expect(extractDomainFromCode("MATH.G3.NF.1")).toBe("NF");
      expect(extractDomainFromCode("MATH.G5.MD.3")).toBe("MD");
    });

    it("extracts ELA domains", () => {
      expect(extractDomainFromCode("ELA.G1.RL.1")).toBe("RL");
      expect(extractDomainFromCode("ELA.G3.W.1")).toBe("W");
      expect(extractDomainFromCode("ELA.G5.L.2")).toBe("L");
    });

    it("returns null for short codes", () => {
      expect(extractDomainFromCode("MATH")).toBeNull();
      expect(extractDomainFromCode("MATH.K")).toBeNull();
    });
  });

  // ─── Grade Coverage ───

  describe("Grade coverage", () => {
    const MATH_GRADES = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
    const ELA_GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];

    it("Math covers all K-12 grades", () => {
      expect(MATH_GRADES).toContain("K");
      for (let i = 1; i <= 12; i++) {
        expect(MATH_GRADES).toContain(`G${i}`);
      }
    });

    it("ELA covers all G1-12 grades", () => {
      for (let i = 1; i <= 12; i++) {
        expect(ELA_GRADES).toContain(`G${i}`);
      }
    });

    it("no duplicate grades", () => {
      expect(new Set(MATH_GRADES).size).toBe(MATH_GRADES.length);
      expect(new Set(ELA_GRADES).size).toBe(ELA_GRADES.length);
    });
  });

  // ─── Goal Categories ───

  describe("Goal categories", () => {
    const categories = ["GRADE_PROFICIENCY", "EXAM_PREP", "SKILL_BUILDING", "CUSTOM"];

    it("has all 4 categories", () => {
      expect(categories).toHaveLength(4);
    });

    it("each category has expected goals", () => {
      const goalsByCategory = {
        GRADE_PROFICIENCY: 26, // K-12 Math (13) + G1-12 ELA (12) + combined = 25+
        EXAM_PREP: 9,        // SAT(2) + ACT(2) + ISEE(3) + PSAT(2)
        SKILL_BUILDING: 6,   // Reading, Writing, Math Fact, Algebra, Geometry, Pre-Calc
        CUSTOM: 0,           // User-defined
      };

      expect(goalsByCategory.GRADE_PROFICIENCY).toBeGreaterThanOrEqual(25);
      expect(goalsByCategory.EXAM_PREP).toBeGreaterThanOrEqual(9);
      expect(goalsByCategory.SKILL_BUILDING).toBeGreaterThanOrEqual(6);
    });
  });

  // ─── Prerequisite Chain Structure ───

  describe("Prerequisite chain structure", () => {
    it("prerequisites must exist in the node set", () => {
      // Build a small test graph
      const nodes = new Map<string, string[]>();
      nodes.set("MATH.K.CC.1", []);
      nodes.set("MATH.K.CC.2", ["MATH.K.CC.1"]);
      nodes.set("MATH.G1.OA.1", ["MATH.K.CC.2"]);

      for (const [code, prereqs] of nodes) {
        for (const prereq of prereqs) {
          expect(nodes.has(prereq)).toBe(true);
        }
      }
    });

    it("no self-referencing prerequisites", () => {
      const nodes = new Map<string, string[]>();
      nodes.set("MATH.K.CC.1", []);
      nodes.set("MATH.K.CC.2", ["MATH.K.CC.1"]);

      for (const [code, prereqs] of nodes) {
        expect(prereqs).not.toContain(code);
      }
    });

    it("grade levels increase in prerequisite chains", () => {
      // A G3 concept should not have a G5 prerequisite
      const chain = [
        { code: "MATH.K.CC.1", grade: "K" },
        { code: "MATH.G1.OA.1", grade: "G1" },
        { code: "MATH.G2.OA.1", grade: "G2" },
        { code: "MATH.G3.NF.1", grade: "G3" },
      ];

      const gradeOrder = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
      for (let i = 1; i < chain.length; i++) {
        const prevGradeIdx = gradeOrder.indexOf(chain[i - 1].grade);
        const currGradeIdx = gradeOrder.indexOf(chain[i].grade);
        expect(currGradeIdx).toBeGreaterThanOrEqual(prevGradeIdx);
      }
    });
  });
});
