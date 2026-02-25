import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BranchSeed {
  name: string;
  description: string;
  domain: string;
  gradeLevel: string;
  nodeCodes: string[]; // will be resolved to node IDs
  prerequisiteBranchNames: string[];
  isAdvanced: boolean;
  sortOrder: number;
}

const branchSeeds: BranchSeed[] = [
  // ─── Kindergarten Math ───
  {
    name: "Counting Basics",
    description: "Learn to count objects and understand numbers",
    domain: "COUNTING",
    gradeLevel: "K",
    nodeCodes: ["K.CC.1", "K.CC.2", "K.CC.3", "K.CC.4", "K.CC.5"],
    prerequisiteBranchNames: [],
    isAdvanced: false,
    sortOrder: 1,
  },
  {
    name: "Comparing Numbers",
    description: "Compare groups and numbers to find which is more",
    domain: "COUNTING",
    gradeLevel: "K",
    nodeCodes: ["K.CC.6", "K.CC.7"],
    prerequisiteBranchNames: ["Counting Basics"],
    isAdvanced: false,
    sortOrder: 2,
  },
  {
    name: "Addition & Subtraction Intro",
    description: "Start adding and subtracting within 10",
    domain: "OPERATIONS",
    gradeLevel: "K",
    nodeCodes: ["K.OA.1", "K.OA.2", "K.OA.3", "K.OA.4", "K.OA.5"],
    prerequisiteBranchNames: ["Counting Basics"],
    isAdvanced: false,
    sortOrder: 3,
  },
  {
    name: "Numbers & Base Ten (K)",
    description: "Understand place value with teens and tens",
    domain: "OPERATIONS",
    gradeLevel: "K",
    nodeCodes: ["K.NBT.1"],
    prerequisiteBranchNames: ["Addition & Subtraction Intro"],
    isAdvanced: false,
    sortOrder: 4,
  },
  {
    name: "Shapes & Geometry (K)",
    description: "Identify and describe 2D and 3D shapes",
    domain: "GEOMETRY",
    gradeLevel: "K",
    nodeCodes: ["K.G.1", "K.G.2", "K.G.3"],
    prerequisiteBranchNames: [],
    isAdvanced: false,
    sortOrder: 5,
  },
  {
    name: "Measurement (K)",
    description: "Compare and measure objects",
    domain: "MEASUREMENT",
    gradeLevel: "K",
    nodeCodes: ["K.MD.1", "K.MD.2", "K.MD.3"],
    prerequisiteBranchNames: ["Counting Basics"],
    isAdvanced: false,
    sortOrder: 6,
  },

  // ─── Grade 1 Math ───
  {
    name: "Addition & Subtraction (G1)",
    description: "Add and subtract within 20 with strategies",
    domain: "OPERATIONS",
    gradeLevel: "G1",
    nodeCodes: ["1.OA.1", "1.OA.2", "1.OA.3", "1.OA.4", "1.OA.5", "1.OA.6"],
    prerequisiteBranchNames: ["Addition & Subtraction Intro"],
    isAdvanced: false,
    sortOrder: 10,
  },
  {
    name: "Place Value (G1)",
    description: "Understand tens and ones place value",
    domain: "OPERATIONS",
    gradeLevel: "G1",
    nodeCodes: ["1.NBT.1", "1.NBT.2", "1.NBT.3", "1.NBT.4", "1.NBT.5", "1.NBT.6"],
    prerequisiteBranchNames: ["Numbers & Base Ten (K)"],
    isAdvanced: false,
    sortOrder: 11,
  },
  {
    name: "Measurement & Data (G1)",
    description: "Measure lengths and organize data",
    domain: "MEASUREMENT",
    gradeLevel: "G1",
    nodeCodes: ["1.MD.1", "1.MD.2", "1.MD.3", "1.MD.4"],
    prerequisiteBranchNames: ["Measurement (K)"],
    isAdvanced: false,
    sortOrder: 12,
  },
  {
    name: "Geometry (G1)",
    description: "Shapes and their attributes",
    domain: "GEOMETRY",
    gradeLevel: "G1",
    nodeCodes: ["1.G.1", "1.G.2", "1.G.3"],
    prerequisiteBranchNames: ["Shapes & Geometry (K)"],
    isAdvanced: false,
    sortOrder: 13,
  },

  // ─── Grade 2 Math ───
  {
    name: "Addition & Subtraction (G2)",
    description: "Add and subtract within 100 and solve word problems",
    domain: "OPERATIONS",
    gradeLevel: "G2",
    nodeCodes: ["2.OA.1", "2.OA.2", "2.OA.3", "2.OA.4"],
    prerequisiteBranchNames: ["Addition & Subtraction (G1)"],
    isAdvanced: false,
    sortOrder: 20,
  },
  {
    name: "Place Value (G2)",
    description: "Understand hundreds, tens, and ones",
    domain: "OPERATIONS",
    gradeLevel: "G2",
    nodeCodes: ["2.NBT.1", "2.NBT.2", "2.NBT.3", "2.NBT.4", "2.NBT.5", "2.NBT.6", "2.NBT.7", "2.NBT.8", "2.NBT.9"],
    prerequisiteBranchNames: ["Place Value (G1)"],
    isAdvanced: false,
    sortOrder: 21,
  },

  // ─── Grade 3 Math ───
  {
    name: "Multiplication Basics",
    description: "Learn multiplication as equal groups and arrays",
    domain: "OPERATIONS",
    gradeLevel: "G3",
    nodeCodes: ["3.OA.1", "3.OA.2", "3.OA.3", "3.OA.4", "3.OA.5"],
    prerequisiteBranchNames: ["Addition & Subtraction (G2)"],
    isAdvanced: false,
    sortOrder: 30,
  },
  {
    name: "Multiplication Fluency",
    description: "Master multiplication facts within 100",
    domain: "OPERATIONS",
    gradeLevel: "G3",
    nodeCodes: ["3.OA.6", "3.OA.7", "3.OA.8", "3.OA.9"],
    prerequisiteBranchNames: ["Multiplication Basics"],
    isAdvanced: true,
    sortOrder: 31,
  },
  {
    name: "Fractions Intro",
    description: "Understand fractions as parts of a whole",
    domain: "OPERATIONS",
    gradeLevel: "G3",
    nodeCodes: ["3.NF.1", "3.NF.2", "3.NF.3"],
    prerequisiteBranchNames: ["Multiplication Basics"],
    isAdvanced: false,
    sortOrder: 32,
  },

  // ─── English Language Arts ───
  {
    name: "Sentence & Word Basics",
    description: "Learn what nouns, verbs, and sentences are",
    domain: "GRAMMAR",
    gradeLevel: "G1",
    nodeCodes: ["ela_sentences_basic", "ela_nouns_basic", "ela_verbs_basic"],
    prerequisiteBranchNames: [],
    isAdvanced: false,
    sortOrder: 100,
  },
  {
    name: "Describing Words",
    description: "Learn adjectives and how they make sentences better",
    domain: "GRAMMAR",
    gradeLevel: "G2",
    nodeCodes: ["ela_adjectives_basic"],
    prerequisiteBranchNames: ["Sentence & Word Basics"],
    isAdvanced: false,
    sortOrder: 101,
  },
  {
    name: "Nouns & Verbs Deep Dive",
    description: "Explore types of nouns and verbs",
    domain: "GRAMMAR",
    gradeLevel: "G3",
    nodeCodes: ["ela_nouns_advanced", "ela_verbs_advanced"],
    prerequisiteBranchNames: ["Sentence & Word Basics"],
    isAdvanced: false,
    sortOrder: 102,
  },
  {
    name: "Parts of Speech Mastery",
    description: "Master pronouns, adverbs, and advanced adjectives",
    domain: "GRAMMAR",
    gradeLevel: "G4",
    nodeCodes: ["ela_pronouns", "ela_adverbs", "ela_adjectives_advanced"],
    prerequisiteBranchNames: ["Nouns & Verbs Deep Dive", "Describing Words"],
    isAdvanced: false,
    sortOrder: 103,
  },
  {
    name: "Connecting Words",
    description: "Learn conjunctions and prepositions",
    domain: "GRAMMAR",
    gradeLevel: "G5",
    nodeCodes: ["ela_conjunctions", "ela_prepositions"],
    prerequisiteBranchNames: ["Parts of Speech Mastery"],
    isAdvanced: false,
    sortOrder: 104,
  },
  {
    name: "Punctuation & Sentence Parts",
    description: "Master commas, apostrophes, subjects, and predicates",
    domain: "GRAMMAR",
    gradeLevel: "G6",
    nodeCodes: ["ela_punctuation_commas", "ela_punctuation_apostrophe", "ela_sentence_subject_predicate", "ela_sentence_simple"],
    prerequisiteBranchNames: ["Connecting Words"],
    isAdvanced: false,
    sortOrder: 105,
  },
  {
    name: "Sentence Construction",
    description: "Build compound and complex sentences",
    domain: "GRAMMAR",
    gradeLevel: "G7",
    nodeCodes: ["ela_sentence_compound", "ela_sentence_complex", "ela_sentence_fragments"],
    prerequisiteBranchNames: ["Punctuation & Sentence Parts"],
    isAdvanced: false,
    sortOrder: 106,
  },
  {
    name: "Advanced Writing Style",
    description: "Master voice, parallel structure, and compound-complex sentences",
    domain: "GRAMMAR",
    gradeLevel: "G9",
    nodeCodes: ["ela_active_passive_voice", "ela_parallel_structure", "ela_sentence_compound_complex"],
    prerequisiteBranchNames: ["Sentence Construction"],
    isAdvanced: true,
    sortOrder: 107,
  },
  {
    name: "Expert Grammar",
    description: "Master clauses and modifiers for precise writing",
    domain: "GRAMMAR",
    gradeLevel: "G10",
    nodeCodes: ["ela_clauses", "ela_modifiers"],
    prerequisiteBranchNames: ["Advanced Writing Style"],
    isAdvanced: true,
    sortOrder: 108,
  },
];

async function seedBranches() {
  console.log("Seeding topic branches...");

  // Fetch all knowledge nodes to map codes to IDs
  const allNodes = await prisma.knowledgeNode.findMany({
    select: { id: true, nodeCode: true },
  });
  const codeToId = new Map(allNodes.map((n) => [n.nodeCode, n.id]));

  // Track created branches for prerequisite linking
  const nameToId = new Map<string, string>();

  let created = 0;
  let skipped = 0;

  for (const branch of branchSeeds) {
    // Resolve node codes to IDs (skip codes not found in DB)
    const nodeIds = branch.nodeCodes
      .map((code) => codeToId.get(code))
      .filter((id): id is string => id !== undefined);

    if (nodeIds.length === 0) {
      console.log(`  Skipping "${branch.name}" — no matching nodes found`);
      skipped++;
      continue;
    }

    // Resolve prerequisite branch IDs
    const prerequisiteBranchIds = branch.prerequisiteBranchNames
      .map((name) => nameToId.get(name))
      .filter((id): id is string => id !== undefined);

    // Upsert by name + domain + gradeLevel
    const existing = await prisma.topicBranch.findFirst({
      where: {
        name: branch.name,
        domain: branch.domain,
        gradeLevel: branch.gradeLevel,
      },
    });

    if (existing) {
      await prisma.topicBranch.update({
        where: { id: existing.id },
        data: {
          description: branch.description,
          nodeIds,
          prerequisiteBranchIds,
          isAdvanced: branch.isAdvanced,
          sortOrder: branch.sortOrder,
        },
      });
      nameToId.set(branch.name, existing.id);
    } else {
      const record = await prisma.topicBranch.create({
        data: {
          name: branch.name,
          description: branch.description,
          domain: branch.domain,
          gradeLevel: branch.gradeLevel,
          nodeIds,
          prerequisiteBranchIds,
          isAdvanced: branch.isAdvanced,
          sortOrder: branch.sortOrder,
        },
      });
      nameToId.set(branch.name, record.id);
    }

    created++;
    console.log(`  ✓ ${branch.name} (${nodeIds.length} nodes)`);
  }

  console.log(`Seeded ${created} topic branches (${skipped} skipped).`);
}

seedBranches()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Branch seed error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
