import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BenchmarkSeed {
  domain: string;
  gradeLevel: string;
  targetTimeMs: number;
  description: string;
}

const benchmarks: BenchmarkSeed[] = [
  // ─── Math: Counting ───
  { domain: "COUNTING", gradeLevel: "K", targetTimeMs: 10000, description: "Counting to 20" },
  { domain: "COUNTING", gradeLevel: "G1", targetTimeMs: 8000, description: "Counting to 120" },

  // ─── Math: Operations — Addition ───
  { domain: "OPERATIONS", gradeLevel: "K", targetTimeMs: 10000, description: "Addition within 5" },
  { domain: "OPERATIONS", gradeLevel: "G1", targetTimeMs: 8000, description: "Addition within 20" },
  { domain: "OPERATIONS", gradeLevel: "G2", targetTimeMs: 6000, description: "Addition within 100" },
  { domain: "OPERATIONS", gradeLevel: "G3", targetTimeMs: 8000, description: "Multi-digit addition" },
  { domain: "OPERATIONS", gradeLevel: "G4", targetTimeMs: 10000, description: "Multi-digit addition with regrouping" },
  { domain: "OPERATIONS", gradeLevel: "G5", targetTimeMs: 15000, description: "Decimal operations" },

  // ─── Math: Geometry ───
  { domain: "GEOMETRY", gradeLevel: "K", targetTimeMs: 12000, description: "Shape identification" },
  { domain: "GEOMETRY", gradeLevel: "G1", targetTimeMs: 10000, description: "Shape attributes" },
  { domain: "GEOMETRY", gradeLevel: "G2", targetTimeMs: 10000, description: "2D and 3D shapes" },
  { domain: "GEOMETRY", gradeLevel: "G3", targetTimeMs: 12000, description: "Area and perimeter" },
  { domain: "GEOMETRY", gradeLevel: "G4", targetTimeMs: 15000, description: "Angles and classification" },
  { domain: "GEOMETRY", gradeLevel: "G5", targetTimeMs: 18000, description: "Coordinate geometry" },

  // ─── Math: Measurement ───
  { domain: "MEASUREMENT", gradeLevel: "K", targetTimeMs: 12000, description: "Comparing lengths" },
  { domain: "MEASUREMENT", gradeLevel: "G1", targetTimeMs: 10000, description: "Measuring lengths" },
  { domain: "MEASUREMENT", gradeLevel: "G2", targetTimeMs: 10000, description: "Standard units" },
  { domain: "MEASUREMENT", gradeLevel: "G3", targetTimeMs: 12000, description: "Time and measurement" },
  { domain: "MEASUREMENT", gradeLevel: "G4", targetTimeMs: 15000, description: "Unit conversion" },

  // ─── Math: Data ───
  { domain: "DATA", gradeLevel: "G1", targetTimeMs: 12000, description: "Organizing data" },
  { domain: "DATA", gradeLevel: "G2", targetTimeMs: 10000, description: "Reading graphs" },
  { domain: "DATA", gradeLevel: "G3", targetTimeMs: 12000, description: "Bar graphs and pictographs" },

  // ─── English: Grammar ───
  { domain: "GRAMMAR", gradeLevel: "K", targetTimeMs: 12000, description: "Basic sentence structure" },
  { domain: "GRAMMAR", gradeLevel: "G1", targetTimeMs: 10000, description: "Nouns and verbs" },
  { domain: "GRAMMAR", gradeLevel: "G2", targetTimeMs: 10000, description: "Parts of speech" },
  { domain: "GRAMMAR", gradeLevel: "G3", targetTimeMs: 10000, description: "Subject-verb agreement" },
  { domain: "GRAMMAR", gradeLevel: "G4", targetTimeMs: 12000, description: "Complex sentences" },
  { domain: "GRAMMAR", gradeLevel: "G5", targetTimeMs: 12000, description: "Advanced grammar" },

  // ─── English: Reading ───
  { domain: "READING", gradeLevel: "K", targetTimeMs: 15000, description: "Letter recognition" },
  { domain: "READING", gradeLevel: "G1", targetTimeMs: 15000, description: "Phonics and decoding" },
  { domain: "READING", gradeLevel: "G2", targetTimeMs: 20000, description: "Reading comprehension" },
  { domain: "READING", gradeLevel: "G3", targetTimeMs: 25000, description: "Inference and main idea" },
  { domain: "READING", gradeLevel: "G4", targetTimeMs: 30000, description: "Text analysis" },
  { domain: "READING", gradeLevel: "G5", targetTimeMs: 30000, description: "Critical reading" },

  // ─── English: Writing ───
  { domain: "WRITING", gradeLevel: "G1", targetTimeMs: 20000, description: "Basic sentences" },
  { domain: "WRITING", gradeLevel: "G2", targetTimeMs: 20000, description: "Paragraph writing" },
  { domain: "WRITING", gradeLevel: "G3", targetTimeMs: 25000, description: "Narrative writing" },
  { domain: "WRITING", gradeLevel: "G4", targetTimeMs: 30000, description: "Essay structure" },
  { domain: "WRITING", gradeLevel: "G5", targetTimeMs: 30000, description: "Persuasive writing" },

  // ─── English: Vocabulary ───
  { domain: "VOCABULARY", gradeLevel: "K", targetTimeMs: 10000, description: "Basic vocabulary" },
  { domain: "VOCABULARY", gradeLevel: "G1", targetTimeMs: 10000, description: "Sight words" },
  { domain: "VOCABULARY", gradeLevel: "G2", targetTimeMs: 10000, description: "Context clues" },
  { domain: "VOCABULARY", gradeLevel: "G3", targetTimeMs: 10000, description: "Word roots and prefixes" },
  { domain: "VOCABULARY", gradeLevel: "G4", targetTimeMs: 12000, description: "Academic vocabulary" },
  { domain: "VOCABULARY", gradeLevel: "G5", targetTimeMs: 12000, description: "Advanced vocabulary" },
];

async function seedBenchmarks() {
  console.log("Seeding fluency benchmarks...");

  for (const b of benchmarks) {
    await prisma.fluencyBenchmark.upsert({
      where: {
        domain_gradeLevel: {
          domain: b.domain,
          gradeLevel: b.gradeLevel,
        },
      },
      update: {
        targetTimeMs: b.targetTimeMs,
        description: b.description,
      },
      create: {
        domain: b.domain,
        gradeLevel: b.gradeLevel,
        targetTimeMs: b.targetTimeMs,
        description: b.description,
      },
    });
  }

  console.log(`Seeded ${benchmarks.length} fluency benchmarks.`);
}

seedBenchmarks()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Benchmark seed error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
