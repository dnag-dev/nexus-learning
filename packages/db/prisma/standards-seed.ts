/**
 * Standards Seed — Step 2 of Learning GPS
 *
 * Seeds LearningGoal records for:
 * - Grade Proficiency (K-8 Math + K-8 ELA = 18 goals)
 * - Exam Prep (SAT, ACT, ISEE, PSAT = 11 goals)
 * - Skill Goals (fluency, readiness = 6 goals)
 *
 * Run: npx tsx packages/db/prisma/standards-seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Node code mappings by grade (from existing seed.ts + seed-ela.ts) ───

const MATH_NODES_BY_GRADE: Record<string, string[]> = {
  K: ["K.CC.1", "K.CC.2", "K.CC.3", "K.CC.4", "K.CC.5", "K.CC.6", "K.CC.7"],
  G1: [
    "1.OA.1", "1.OA.2", "1.OA.3", "1.OA.4", "1.OA.5", "1.OA.6", "1.OA.7", "1.OA.8",
    "1.NBT.1", "1.NBT.2", "1.NBT.3", "1.NBT.4", "1.NBT.5", "1.NBT.6",
  ],
  G2: [
    "2.OA.1", "2.OA.2", "2.OA.3", "2.OA.4",
    "2.NBT.1", "2.NBT.2", "2.NBT.3", "2.NBT.4", "2.NBT.5", "2.NBT.7",
    "2.MD.1", "2.MD.8", "2.G.1",
  ],
  G3: [
    "3.OA.1", "3.OA.2", "3.OA.3", "3.OA.4", "3.OA.5", "3.OA.7", "3.OA.8", "3.OA.9",
    "3.NBT.1", "3.NBT.2", "3.NF.1", "3.NF.2", "3.NF.3", "3.MD.7", "3.G.1",
  ],
  G4: [
    "4.OA.1", "4.OA.2", "4.OA.3", "4.OA.4",
    "4.NBT.1", "4.NBT.2", "4.NBT.3", "4.NBT.4", "4.NBT.5", "4.NBT.6",
    "4.NF.1", "4.NF.2", "4.NF.3", "4.NF.4", "4.MD.3", "4.G.1",
  ],
  G5: [
    "5.OA.1", "5.OA.2", "5.OA.3",
    "5.NBT.1", "5.NBT.2", "5.NBT.3", "5.NBT.5", "5.NBT.6", "5.NBT.7",
    "5.NF.1", "5.NF.2", "5.NF.3", "5.NF.4", "5.NF.6", "5.MD.1", "5.MD.3", "5.G.1",
  ],
  // G6-G12: Populated in Step 15
  G6: ["6.RP.1", "6.RP.2", "6.RP.3", "6.NS.1", "6.NS.5", "6.NS.6", "6.NS.7", "6.EE.1", "6.EE.2", "6.EE.5", "6.EE.7", "6.G.1", "6.SP.1"],
  G7: ["7.RP.1", "7.RP.2", "7.RP.3", "7.NS.1", "7.NS.2", "7.EE.1", "7.EE.4", "7.G.4", "7.G.6", "7.SP.1"],
  G8: ["8.NS.1", "8.EE.1", "8.EE.5", "8.EE.7", "8.EE.8", "8.F.1", "8.F.2", "8.F.4", "8.G.1", "8.G.6", "8.G.7", "8.SP.1"],
  G9: ["HSA.REI.1", "HSA.REI.3", "HSA.REI.6", "HSA.SSE.1", "HSA.SSE.2", "HSA.APR.1", "HSA.CED.1", "HSF.IF.1", "HSF.IF.4", "HSF.BF.1", "HSF.LE.1"],
  G10: ["HSG.CO.1", "HSG.CO.6", "HSG.SRT.1", "HSG.SRT.6", "HSG.SRT.8", "HSA.REI.4", "HSA.REI.7", "HSF.IF.7", "HSS.ID.6"],
  G11: ["HSF.TF.1", "HSF.TF.2", "HSF.TF.5", "HSF.BF.3", "HSF.BF.4", "HSN.CN.1", "HSA.APR.3", "HSA.APR.6", "HSF.LE.4"],
  G12: ["HSF.LIM.1", "HSF.LIM.2", "HSF.DER.1", "HSF.DER.2", "HSF.DER.3", "HSF.INT.1", "HSF.INT.2", "HSS.IC.1"],
};

const ELA_NODES_BY_GRADE: Record<string, string[]> = {
  // ELA nodes aren't grade-tagged in the seed — they're topic-based
  // Map them roughly by difficulty progression
  K: ["ela_nouns_basic", "ela_verbs_basic"],
  G1: ["ela_sentences_basic", "ela_adjectives_basic"],
  G2: [
    "ela_nouns_advanced", "ela_verbs_advanced", "ela_pronouns",
    "ela_adjectives_advanced", "ela_adverbs",
  ],
  G3: [
    "ela_prepositions", "ela_conjunctions",
    "ela_sentence_subject_predicate", "ela_sentence_simple",
  ],
  G4: [
    "ela_sentence_compound", "ela_sentence_complex",
    "ela_sentence_fragments", "ela_punctuation_commas",
  ],
  G5: [
    "ela_punctuation_apostrophe", "ela_sentence_compound_complex",
    "ela_parallel_structure", "ela_active_passive_voice",
    "ela_clauses", "ela_modifiers",
  ],
  // G6-G12: Populated in Step 15
  G6: ["6.RL.1", "6.RL.2", "6.RL.4", "6.RL.6", "6.W.1", "6.W.2", "6.W.3", "6.L.4"],
  G7: ["7.RL.1", "7.RL.3", "7.RI.6", "7.RI.8", "7.RI.9", "7.W.1", "7.W.7", "7.L.5"],
  G8: ["8.RL.3", "8.RL.6", "8.RI.5", "8.RI.8", "8.W.1", "8.W.7", "8.L.5"],
  G9: ["9.RL.1", "9.RL.2", "9.RL.5", "9.RI.5", "9.RI.6", "9.W.1", "9.W.2", "9.W.7"],
  G10: ["10.RL.3", "10.RL.6", "10.RI.6", "10.W.1", "10.W.2", "10.L.5"],
  G11: ["11.RL.3", "11.RL.5", "11.RI.6", "11.W.1", "11.W.2", "11.W.7"],
  G12: ["12.RL.3", "12.RL.6", "12.RI.6", "12.W.1", "12.W.2", "12.W.7"],
};

// Cumulative: grade proficiency includes all prior grades
function cumulativeMathNodes(upToGrade: string): string[] {
  const gradeOrder = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
  const idx = gradeOrder.indexOf(upToGrade);
  const nodes: string[] = [];
  for (let i = 0; i <= idx; i++) {
    nodes.push(...(MATH_NODES_BY_GRADE[gradeOrder[i]] ?? []));
  }
  return nodes;
}

function cumulativeELANodes(upToGrade: string): string[] {
  const gradeOrder = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
  const idx = gradeOrder.indexOf(upToGrade);
  const nodes: string[] = [];
  for (let i = 0; i <= idx; i++) {
    nodes.push(...(ELA_NODES_BY_GRADE[gradeOrder[i]] ?? []));
  }
  return nodes;
}

// ─── Goal Definitions ───

interface GoalDef {
  name: string;
  description: string;
  category: "GRADE_PROFICIENCY" | "EXAM_PREP" | "SKILL_BUILDING" | "CUSTOM";
  gradeLevel?: number;
  examType?: string;
  standardsCovered: string[];
  requiredNodeIds: string[];
  estimatedHours: number;
}

const GRADE_NUM: Record<string, number> = {
  K: 0, G1: 1, G2: 2, G3: 3, G4: 4, G5: 5, G6: 6, G7: 7, G8: 8,
  G9: 9, G10: 10, G11: 11, G12: 12,
};

function gradeLabel(g: string): string {
  return g === "K" ? "Kindergarten" : `Grade ${GRADE_NUM[g]}`;
}

const goals: GoalDef[] = [];

// ─── GRADE PROFICIENCY: Math K-12 ───
for (const grade of ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"]) {
  const nodes = cumulativeMathNodes(grade);
  goals.push({
    name: `Common Core Math — ${gradeLabel(grade)}`,
    description: `Master all Common Core Math standards through ${gradeLabel(grade)}. Covers ${nodes.length} concepts from counting to ${grade === "K" ? "number recognition" : grade <= "G3" ? "multiplication and fractions" : "advanced operations and geometry"}.`,
    category: "GRADE_PROFICIENCY",
    gradeLevel: GRADE_NUM[grade],
    standardsCovered: [`CCSS.MATH.${grade}`],
    requiredNodeIds: nodes,
    estimatedHours: Math.max(nodes.length * 0.75, 5),
  });
}

// ─── GRADE PROFICIENCY: ELA K-12 ───
for (const grade of ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"]) {
  const nodes = cumulativeELANodes(grade);
  goals.push({
    name: `Common Core ELA — ${gradeLabel(grade)}`,
    description: `Master all Common Core English Language Arts standards through ${gradeLabel(grade)}. Covers grammar, reading comprehension, writing, and vocabulary.`,
    category: "GRADE_PROFICIENCY",
    gradeLevel: GRADE_NUM[grade],
    standardsCovered: [`CCSS.ELA.${grade}`],
    requiredNodeIds: nodes,
    estimatedHours: Math.max(nodes.length * 0.75, 5),
  });
}

// ─── EXAM PREP ───

// SAT Math — maps to algebra, functions, data analysis, geometry (through G10)
const SAT_MATH_NODES = cumulativeMathNodes("G10");
goals.push({
  name: "SAT Math Prep",
  description: "Prepare for the SAT Math section. Covers Heart of Algebra, Passport to Advanced Math, Problem Solving and Data Analysis, and Additional Topics in Math.",
  category: "EXAM_PREP",
  examType: "SAT",
  standardsCovered: ["SAT.MATH.HOA", "SAT.MATH.PAM", "SAT.MATH.PSDA", "SAT.MATH.ATM"],
  requiredNodeIds: SAT_MATH_NODES,
  estimatedHours: 120,
});

// SAT Reading and Writing (through G10)
const SAT_RW_NODES = cumulativeELANodes("G10");
goals.push({
  name: "SAT Reading & Writing Prep",
  description: "Prepare for the SAT Reading and Writing section. Covers Command of Evidence, Words in Context, Analysis in History/Social Studies/Science, Expression of Ideas, and Standard English Conventions.",
  category: "EXAM_PREP",
  examType: "SAT",
  standardsCovered: ["SAT.RW.COE", "SAT.RW.WIC", "SAT.RW.AHSS", "SAT.RW.EOI", "SAT.RW.SEC"],
  requiredNodeIds: SAT_RW_NODES,
  estimatedHours: 100,
});

// ACT Math
goals.push({
  name: "ACT Math Prep",
  description: "Prepare for the ACT Math section. Covers pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, and trigonometry.",
  category: "EXAM_PREP",
  examType: "ACT",
  standardsCovered: ["ACT.MATH"],
  requiredNodeIds: cumulativeMathNodes("G10"),
  estimatedHours: 110,
});

// ACT English
goals.push({
  name: "ACT English Prep",
  description: "Prepare for the ACT English section. Covers production of writing, knowledge of language, and conventions of standard English.",
  category: "EXAM_PREP",
  examType: "ACT",
  standardsCovered: ["ACT.ENG"],
  requiredNodeIds: cumulativeELANodes("G5"),
  estimatedHours: 90,
});

// ISEE Lower Level (Grades 5-6)
goals.push({
  name: "ISEE Lower Level Prep",
  description: "Prepare for the ISEE Lower Level exam (Grades 5-6 entry). Covers quantitative reasoning, reading comprehension, verbal reasoning, and math achievement.",
  category: "EXAM_PREP",
  examType: "ISEE_LOWER",
  gradeLevel: 5,
  standardsCovered: ["ISEE.LOWER"],
  requiredNodeIds: cumulativeMathNodes("G5"),
  estimatedHours: 60,
});

// ISEE Middle Level (Grades 7-8)
goals.push({
  name: "ISEE Middle Level Prep",
  description: "Prepare for the ISEE Middle Level exam (Grades 7-8 entry). Covers quantitative reasoning, reading comprehension, verbal reasoning, and math achievement.",
  category: "EXAM_PREP",
  examType: "ISEE_MIDDLE",
  gradeLevel: 7,
  standardsCovered: ["ISEE.MIDDLE"],
  requiredNodeIds: [...cumulativeMathNodes("G5"), ...cumulativeELANodes("G5")],
  estimatedHours: 80,
});

// ISEE Upper Level (Grades 9-12)
goals.push({
  name: "ISEE Upper Level Prep",
  description: "Prepare for the ISEE Upper Level exam (Grades 9-12 entry). Covers advanced quantitative reasoning, reading comprehension, verbal reasoning, and math achievement.",
  category: "EXAM_PREP",
  examType: "ISEE_UPPER",
  gradeLevel: 9,
  standardsCovered: ["ISEE.UPPER"],
  requiredNodeIds: [...cumulativeMathNodes("G5"), ...cumulativeELANodes("G5")],
  estimatedHours: 100,
});

// PSAT Math
goals.push({
  name: "PSAT Math Prep",
  description: "Prepare for the PSAT/NMSQT Math section. Similar to SAT Math but calibrated for 10th/11th graders.",
  category: "EXAM_PREP",
  examType: "PSAT",
  standardsCovered: ["PSAT.MATH"],
  requiredNodeIds: cumulativeMathNodes("G5"),
  estimatedHours: 80,
});

// PSAT Reading and Writing
goals.push({
  name: "PSAT Reading & Writing Prep",
  description: "Prepare for the PSAT/NMSQT Reading and Writing section. Covers evidence-based reading and writing skills.",
  category: "EXAM_PREP",
  examType: "PSAT",
  standardsCovered: ["PSAT.RW"],
  requiredNodeIds: cumulativeELANodes("G5"),
  estimatedHours: 70,
});

// ─── SKILL BUILDING ───

goals.push({
  name: "Reading Fluency",
  description: "Build reading fluency to grade level. Focus on speed, accuracy, and comprehension of grade-appropriate texts.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.READING_FLUENCY"],
  requiredNodeIds: cumulativeELANodes("G3"),
  estimatedHours: 30,
});

goals.push({
  name: "Writing Proficiency",
  description: "Develop strong writing skills including grammar, sentence structure, and paragraph organization.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.WRITING"],
  requiredNodeIds: cumulativeELANodes("G5"),
  estimatedHours: 40,
});

goals.push({
  name: "Math Fact Fluency",
  description: "Master basic math facts (addition, subtraction, multiplication, division) with automatic recall speed.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.MATH_FACTS"],
  requiredNodeIds: [
    ...MATH_NODES_BY_GRADE["K"]!,
    ...MATH_NODES_BY_GRADE["G1"]!,
    ...MATH_NODES_BY_GRADE["G2"]!,
    "3.OA.1", "3.OA.2", "3.OA.7",
  ],
  estimatedHours: 25,
});

goals.push({
  name: "Algebra Readiness",
  description: "Build a strong foundation for algebra. Master pre-algebra concepts including operations, fractions, ratios, and basic equations.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.ALGEBRA_READY"],
  requiredNodeIds: cumulativeMathNodes("G5"),
  estimatedHours: 50,
});

goals.push({
  name: "Geometry Readiness",
  description: "Prepare for formal geometry. Master shapes, measurements, area, perimeter, volume, and spatial reasoning.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.GEOMETRY_READY"],
  requiredNodeIds: [
    "2.G.1", "3.G.1", "3.MD.7", "4.G.1", "4.MD.3", "5.G.1", "5.MD.3",
  ],
  estimatedHours: 35,
});

goals.push({
  name: "Pre-Calculus Readiness",
  description: "Prepare for pre-calculus. Covers all foundational math through advanced algebra, including functions, trigonometry basics, and analytical thinking.",
  category: "SKILL_BUILDING",
  standardsCovered: ["SKILL.PRECALC_READY"],
  requiredNodeIds: cumulativeMathNodes("G5"),
  estimatedHours: 150,
});

// ─── Seed Runner ───

async function main() {
  console.log(`\n🎯 Seeding ${goals.length} Learning Goals...\n`);

  let created = 0;
  let skipped = 0;

  for (const goal of goals) {
    // Upsert by name to avoid duplicates on re-run
    const existing = await prisma.learningGoal.findFirst({
      where: { name: goal.name },
    });

    if (existing) {
      await prisma.learningGoal.update({
        where: { id: existing.id },
        data: {
          description: goal.description,
          category: goal.category,
          gradeLevel: goal.gradeLevel ?? null,
          examType: goal.examType ?? null,
          standardsCovered: goal.standardsCovered,
          requiredNodeIds: goal.requiredNodeIds,
          estimatedHours: goal.estimatedHours,
        },
      });
      skipped++;
      console.log(`  ↻ Updated: ${goal.name} (${goal.requiredNodeIds.length} nodes)`);
    } else {
      await prisma.learningGoal.create({
        data: {
          name: goal.name,
          description: goal.description,
          category: goal.category,
          gradeLevel: goal.gradeLevel ?? null,
          examType: goal.examType ?? null,
          standardsCovered: goal.standardsCovered,
          requiredNodeIds: goal.requiredNodeIds,
          estimatedHours: goal.estimatedHours,
        },
      });
      created++;
      console.log(`  ✅ Created: ${goal.name} (${goal.requiredNodeIds.length} nodes)`);
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} updated`);
  console.log(`   Total goals: ${goals.length}`);
  console.log(`   Grade Proficiency: 18 (Math K-8 + ELA K-8)`);
  console.log(`   Exam Prep: 11 (SAT, ACT, ISEE, PSAT)`);
  console.log(`   Skill Building: 6`);
  console.log(`\n✅ Standards seed complete!\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
