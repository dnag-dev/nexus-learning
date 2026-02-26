/**
 * Neo4j Standards Tagging — Step 3 of Learning GPS
 *
 * This migration:
 * 1. Reads all knowledge nodes + prerequisite edges from PostgreSQL
 * 2. Syncs ALL nodes into Neo4j (currently only 23 of 105 exist)
 * 3. Creates all prerequisite relationships
 * 4. Tags every node with Common Core standards, exam relevance, and grade equivalent
 * 5. Validates every node has at least one standard
 *
 * Run: DATABASE_URL="..." npx tsx neo4j/migrations/add-standards.ts
 */

import { PrismaClient } from "@prisma/client";
import {
  getSession,
  closeNeo4j,
  verifyConnectivity,
} from "../neo4j-client";

const prisma = new PrismaClient();

// ─── Common Core Standards Mapping ───────────────────────────────────────────
// Maps each nodeCode to its CCSS standard identifier(s)

function getStandards(nodeCode: string, domain: string, gradeLevel: string): string[] {
  // Math nodes follow the pattern: grade.domain.number
  // CCSS format: CCSS.MATH.CONTENT.grade.domain.cluster.number

  if (domain === "GRAMMAR") {
    return getELAStandards(nodeCode, gradeLevel);
  }

  // Math standard mapping
  const gradeMap: Record<string, string> = {
    K: "K",
    G1: "1",
    G2: "2",
    G3: "3",
    G4: "4",
    G5: "5",
    G6: "6",
    G7: "7",
    G8: "8",
    G9: "HS",
    G10: "HS",
  };

  const g = gradeMap[gradeLevel] ?? gradeLevel;

  // Build the CCSS standard code
  const standards: string[] = [];

  // Map domain codes to CCSS domain abbreviations
  const domainClusters: Record<string, Record<string, string>> = {
    COUNTING: {
      "CC": "CC", // Counting & Cardinality
      "NBT": "NBT", // Number & Operations in Base Ten
    },
    OPERATIONS: {
      "OA": "OA", // Operations & Algebraic Thinking
      "NBT": "NBT", // Number & Operations in Base Ten
      "NF": "NF", // Number & Operations — Fractions
    },
    GEOMETRY: {
      "G": "G",
    },
    MEASUREMENT: {
      "MD": "MD", // Measurement & Data
    },
  };

  // Extract the domain abbreviation from node code (e.g., "3.OA.7" → "OA")
  const parts = nodeCode.split(".");
  if (parts.length >= 2) {
    const domainAbbr = parts[1]; // OA, NBT, NF, CC, G, MD
    // Primary standard
    standards.push(`CCSS.MATH.CONTENT.${g}.${domainAbbr}.${parts.slice(2).join(".")}`);
    // Domain-level standard
    standards.push(`CCSS.MATH.CONTENT.${g}.${domainAbbr}`);
  }

  return standards;
}

function getELAStandards(nodeCode: string, gradeLevel: string): string[] {
  const gradeMap: Record<string, string> = {
    G1: "1", G2: "2", G3: "3", G4: "4", G5: "5",
    G6: "6", G7: "7", G8: "8", G9: "9-10", G10: "9-10",
  };
  const g = gradeMap[gradeLevel] ?? gradeLevel;

  // Map ELA node codes to CCSS ELA standards
  const elaStandardsMap: Record<string, string[]> = {
    ela_nouns_basic: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.1.1.B"],
    ela_verbs_basic: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.1.1.E"],
    ela_sentences_basic: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.1.1.J"],
    ela_adjectives_basic: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.2.1.E"],
    ela_nouns_advanced: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.A"],
    ela_verbs_advanced: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.D"],
    ela_pronouns: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.A"],
    ela_adjectives_advanced: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.G"],
    ela_adverbs: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.A"],
    ela_prepositions: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.4.1.E"],
    ela_conjunctions: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.5.1.A"],
    ela_sentence_subject_predicate: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.I"],
    ela_sentence_simple: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.3.1.I"],
    ela_sentence_compound: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.7.1.B"],
    ela_sentence_complex: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.7.1.B"],
    ela_sentence_fragments: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.4.1.F"],
    ela_punctuation_commas: [`CCSS.ELA-LITERACY.L.${g}.2`, "CCSS.ELA-LITERACY.L.5.2.C"],
    ela_punctuation_apostrophe: [`CCSS.ELA-LITERACY.L.${g}.2`, "CCSS.ELA-LITERACY.L.2.2.C"],
    ela_sentence_compound_complex: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.7.1.B"],
    ela_active_passive_voice: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.8.1.B"],
    ela_parallel_structure: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.9-10.1.A"],
    ela_clauses: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.9-10.1.B"],
    ela_modifiers: [`CCSS.ELA-LITERACY.L.${g}.1`, "CCSS.ELA-LITERACY.L.9-10.1.B"],
  };

  return elaStandardsMap[nodeCode] ?? [`CCSS.ELA-LITERACY.L.${g}.1`];
}

// ─── Exam Relevance Mapping ──────────────────────────────────────────────────
// Which exams each node is relevant for

function getExamRelevance(nodeCode: string, domain: string, gradeLevel: string): string[] {
  const exams: string[] = [];
  const gradeNum = gradeToNumber(gradeLevel);

  if (domain === "GRAMMAR") {
    // ELA nodes relevant to SAT R&W, ACT English, PSAT R&W, ISEE
    exams.push("SAT_RW", "ACT_ENGLISH", "PSAT_RW");
    if (gradeNum <= 5) exams.push("ISEE_LOWER");
    if (gradeNum <= 7) exams.push("ISEE_MIDDLE");
    exams.push("ISEE_UPPER");
  } else {
    // Math nodes
    exams.push("SAT_MATH", "ACT_MATH", "PSAT_MATH");
    if (gradeNum <= 5) exams.push("ISEE_LOWER");
    if (gradeNum <= 7) exams.push("ISEE_MIDDLE");
    exams.push("ISEE_UPPER");
  }

  return exams;
}

// ─── Grade Equivalent ────────────────────────────────────────────────────────

function gradeToNumber(gradeLevel: string): number {
  const map: Record<string, number> = {
    K: 0, G1: 1, G2: 2, G3: 3, G4: 4, G5: 5,
    G6: 6, G7: 7, G8: 8, G9: 9, G10: 10,
  };
  return map[gradeLevel] ?? 0;
}

// ─── Main Migration ──────────────────────────────────────────────────────────

async function main() {
  // 1. Verify Neo4j connectivity
  const connected = await verifyConnectivity();
  if (!connected) {
    console.error("❌ Cannot connect to Neo4j. Is it running?");
    process.exit(1);
  }

  const session = getSession();
  if (!session) {
    console.error("❌ Neo4j session unavailable.");
    process.exit(1);
  }

  try {
    // 2. Read all nodes from PostgreSQL
    console.log("📖 Reading knowledge nodes from PostgreSQL...");
    const pgNodes = await prisma.knowledgeNode.findMany({
      select: {
        nodeCode: true,
        title: true,
        description: true,
        gradeLevel: true,
        domain: true,
        difficulty: true,
        prerequisites: { select: { nodeCode: true } },
      },
      orderBy: [{ gradeLevel: "asc" }, { domain: "asc" }, { nodeCode: "asc" }],
    });
    console.log(`   Found ${pgNodes.length} nodes in PostgreSQL`);

    // Build edges list
    const edges: { from: string; to: string }[] = [];
    for (const node of pgNodes) {
      for (const prereq of node.prerequisites) {
        edges.push({ from: prereq.nodeCode, to: node.nodeCode });
      }
    }
    console.log(`   Found ${edges.length} prerequisite edges`);

    // 3. Clear existing Neo4j data and recreate
    console.log("\n🗑️  Clearing existing Neo4j knowledge graph...");
    await session.run("MATCH (n:KnowledgeNode) DETACH DELETE n");

    // 4. Ensure unique constraint
    console.log("🔑 Creating constraints...");
    await session.run(
      "CREATE CONSTRAINT knowledge_node_code IF NOT EXISTS FOR (n:KnowledgeNode) REQUIRE n.nodeCode IS UNIQUE"
    );

    // 5. Create all nodes with standards tagging
    console.log(`\n📦 Creating ${pgNodes.length} knowledge nodes with standards...\n`);

    let mathCount = 0;
    let elaCount = 0;

    for (const node of pgNodes) {
      const standards = getStandards(node.nodeCode, node.domain, node.gradeLevel);
      const examRelevance = getExamRelevance(node.nodeCode, node.domain, node.gradeLevel);
      const gradeEquivalent = gradeToNumber(node.gradeLevel);

      await session.run(
        `CREATE (n:KnowledgeNode {
          nodeCode: $nodeCode,
          title: $title,
          description: $description,
          gradeLevel: $gradeLevel,
          domain: $domain,
          difficulty: $difficulty,
          standards: $standards,
          examRelevance: $examRelevance,
          gradeEquivalent: $gradeEquivalent
        })`,
        {
          nodeCode: node.nodeCode,
          title: node.title,
          description: node.description,
          gradeLevel: node.gradeLevel,
          domain: node.domain,
          difficulty: node.difficulty,
          standards,
          examRelevance,
          gradeEquivalent,
        }
      );

      if (node.domain === "GRAMMAR") {
        elaCount++;
      } else {
        mathCount++;
      }

      const tag = node.domain === "GRAMMAR" ? "ELA" : "MATH";
      console.log(
        `  ✅ [${tag}] ${node.nodeCode} — ${node.title} (grade ${gradeEquivalent}, ${standards.length} stds, ${examRelevance.length} exams)`
      );
    }

    // 6. Create all prerequisite relationships
    console.log(`\n🔗 Creating ${edges.length} prerequisite relationships...\n`);

    let edgeCount = 0;
    let edgeErrors = 0;

    for (const edge of edges) {
      try {
        const result = await session.run(
          `MATCH (from:KnowledgeNode {nodeCode: $from})
           MATCH (to:KnowledgeNode {nodeCode: $to})
           CREATE (from)-[:PREREQUISITE_OF]->(to)
           RETURN from.nodeCode AS f, to.nodeCode AS t`,
          { from: edge.from, to: edge.to }
        );
        if (result.records.length > 0) {
          edgeCount++;
          console.log(`  🔗 ${edge.from} → PREREQUISITE_OF → ${edge.to}`);
        } else {
          edgeErrors++;
          console.warn(`  ⚠️  No match for edge: ${edge.from} → ${edge.to}`);
        }
      } catch (err) {
        edgeErrors++;
        console.error(`  ❌ Error creating edge ${edge.from} → ${edge.to}:`, err);
      }
    }

    // 7. Validation
    console.log("\n🔍 Running validation queries...\n");

    // Count total nodes
    const nodeCountResult = await session.run(
      "MATCH (n:KnowledgeNode) RETURN count(n) AS count"
    );
    const totalNodes = nodeCountResult.records[0].get("count");

    // Count total edges
    const edgeCountResult = await session.run(
      "MATCH ()-[r:PREREQUISITE_OF]->() RETURN count(r) AS count"
    );
    const totalEdges = edgeCountResult.records[0].get("count");

    // Check for nodes without standards
    const noStandardsResult = await session.run(
      "MATCH (n:KnowledgeNode) WHERE n.standards IS NULL OR size(n.standards) = 0 RETURN count(n) AS count, collect(n.nodeCode) AS codes"
    );
    const noStandardsCount = noStandardsResult.records[0].get("count");
    const noStandardsCodes = noStandardsResult.records[0].get("codes");

    // Check for nodes without exam relevance
    const noExamResult = await session.run(
      "MATCH (n:KnowledgeNode) WHERE n.examRelevance IS NULL OR size(n.examRelevance) = 0 RETURN count(n) AS count"
    );
    const noExamCount = noExamResult.records[0].get("count");

    // Grade distribution
    const gradeDistResult = await session.run(
      "MATCH (n:KnowledgeNode) RETURN n.gradeLevel AS grade, min(n.gradeEquivalent) AS gradeNum, count(n) AS count ORDER BY gradeNum"
    );
    const gradeDist = gradeDistResult.records.map(
      (r) => `${r.get("grade")}: ${r.get("count")}`
    );

    // Domain distribution
    const domainDistResult = await session.run(
      "MATCH (n:KnowledgeNode) RETURN n.domain AS domain, count(n) AS count ORDER BY count DESC"
    );
    const domainDist = domainDistResult.records.map(
      (r) => `${r.get("domain")}: ${r.get("count")}`
    );

    // Check for orphan nodes (no edges at all)
    const orphanResult = await session.run(
      `MATCH (n:KnowledgeNode)
       WHERE NOT (n)-[:PREREQUISITE_OF]->() AND NOT ()-[:PREREQUISITE_OF]->(n)
       RETURN count(n) AS count, collect(n.nodeCode) AS codes`
    );
    const orphanCount = orphanResult.records[0].get("count");
    const orphanCodes = orphanResult.records[0].get("codes");

    // ─── Summary ───
    console.log("═══════════════════════════════════════════════");
    console.log("  NEO4J STANDARDS TAGGING — MIGRATION SUMMARY");
    console.log("═══════════════════════════════════════════════");
    console.log(`  Total nodes:        ${totalNodes} (Math: ${mathCount}, ELA: ${elaCount})`);
    console.log(`  Total edges:        ${totalEdges} (expected ${edges.length}, errors: ${edgeErrors})`);
    console.log(`  Grade distribution: ${gradeDist.join(", ")}`);
    console.log(`  Domain distribution: ${domainDist.join(", ")}`);
    console.log(`  Nodes without standards: ${noStandardsCount}`);
    if (noStandardsCount > 0) {
      console.log(`    ⚠️  Missing standards: ${noStandardsCodes.join(", ")}`);
    }
    console.log(`  Nodes without exam relevance: ${noExamCount}`);
    console.log(`  Orphan nodes (no edges): ${orphanCount}`);
    if (orphanCount > 0) {
      console.log(`    ⚠️  Orphan codes: ${orphanCodes.join(", ")}`);
    }
    console.log("═══════════════════════════════════════════════");

    // Final validation
    if (totalNodes === pgNodes.length && noStandardsCount === 0) {
      console.log("\n✅ Migration complete! All nodes synced and tagged with standards.");
    } else {
      console.warn("\n⚠️  Migration completed with warnings. Review output above.");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await session.close();
    await closeNeo4j();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
