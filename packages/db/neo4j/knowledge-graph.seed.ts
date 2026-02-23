import { getSession, closeNeo4j, verifyConnectivity } from "./neo4j-client";

interface GraphNode {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const nodes: GraphNode[] = [
  // ─── Kindergarten Counting & Cardinality (K.CC) ───
  {
    nodeCode: "K.CC.1",
    title: "Count to 100 by Ones and Tens",
    description:
      "Know the count sequence. Count to 100 by ones and by tens.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 1,
  },
  {
    nodeCode: "K.CC.2",
    title: "Count Forward from a Given Number",
    description:
      "Count forward beginning from a given number within the known sequence.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 2,
  },
  {
    nodeCode: "K.CC.3",
    title: "Write Numbers 0 to 20",
    description:
      "Write numbers from 0 to 20. Represent a number of objects with a written numeral.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 2,
  },
  {
    nodeCode: "K.CC.4",
    title: "Understand Counting and Cardinality",
    description:
      "Understand the relationship between numbers and quantities; connect counting to cardinality.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 3,
  },
  {
    nodeCode: "K.CC.5",
    title: "Count to Answer 'How Many?'",
    description:
      "Count to answer 'how many?' questions about as many as 20 things.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 3,
  },
  {
    nodeCode: "K.CC.6",
    title: "Identify Greater/Less/Equal",
    description:
      "Identify whether the number of objects in one group is greater than, less than, or equal to another group.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 4,
  },
  {
    nodeCode: "K.CC.7",
    title: "Compare Two Numbers Between 1 and 10",
    description:
      "Compare two numbers between 1 and 10 presented as written numerals.",
    gradeLevel: "K",
    domain: "COUNTING",
    difficulty: 4,
  },
  // ─── Grade 1 Operations & Algebraic Thinking (1.OA) ───
  {
    nodeCode: "1.OA.1",
    title: "Addition and Subtraction Word Problems to 20",
    description:
      "Use addition and subtraction within 20 to solve word problems.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 3,
  },
  {
    nodeCode: "1.OA.2",
    title: "Addition Word Problems with Three Numbers",
    description:
      "Solve word problems that call for addition of three whole numbers whose sum is ≤ 20.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 4,
  },
  {
    nodeCode: "1.OA.3",
    title: "Commutative and Associative Properties",
    description:
      "Apply properties of operations as strategies to add and subtract.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 5,
  },
  {
    nodeCode: "1.OA.4",
    title: "Subtraction as Unknown-Addend Problem",
    description:
      "Understand subtraction as an unknown-addend problem. E.g., 10 − 8 by finding ? + 8 = 10.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 5,
  },
  {
    nodeCode: "1.OA.5",
    title: "Relate Counting to Addition and Subtraction",
    description:
      "Relate counting to addition and subtraction, such as counting on 2 to add 2.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 3,
  },
  {
    nodeCode: "1.OA.6",
    title: "Add and Subtract Within 20",
    description:
      "Add and subtract within 20, demonstrating fluency within 10. Use strategies: counting on, making ten, decomposing.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 5,
  },
  {
    nodeCode: "1.OA.7",
    title: "Understand the Meaning of the Equal Sign",
    description:
      "Understand the equal sign and determine if equations are true or false.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 4,
  },
  {
    nodeCode: "1.OA.8",
    title: "Determine Unknown in Equations",
    description:
      "Determine the unknown whole number in an addition or subtraction equation. E.g., 8 + ? = 11.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 6,
  },
  // ─── Grade 1 Number & Operations in Base Ten (1.NBT) ───
  {
    nodeCode: "1.NBT.1",
    title: "Count to 120",
    description:
      "Count to 120, starting at any number less than 120. Read and write numerals.",
    gradeLevel: "1",
    domain: "COUNTING",
    difficulty: 3,
  },
  {
    nodeCode: "1.NBT.2",
    title: "Understand Place Value (Tens and Ones)",
    description:
      "Understand that two digits of a two-digit number represent tens and ones. 10 = a bundle of ten ones.",
    gradeLevel: "1",
    domain: "COUNTING",
    difficulty: 5,
  },
  {
    nodeCode: "1.NBT.3",
    title: "Compare Two Two-Digit Numbers",
    description:
      "Compare two two-digit numbers using >, =, and < based on tens and ones.",
    gradeLevel: "1",
    domain: "COUNTING",
    difficulty: 5,
  },
  {
    nodeCode: "1.NBT.4",
    title: "Add Within 100",
    description:
      "Add within 100 including two-digit + one-digit and two-digit + multiple of 10.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 6,
  },
  {
    nodeCode: "1.NBT.5",
    title: "Find 10 More or 10 Less",
    description:
      "Mentally find 10 more or 10 less than a two-digit number without counting.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 5,
  },
  {
    nodeCode: "1.NBT.6",
    title: "Subtract Multiples of 10",
    description:
      "Subtract multiples of 10 (10-90) from multiples of 10 (10-90) using place value strategies.",
    gradeLevel: "1",
    domain: "OPERATIONS",
    difficulty: 6,
  },
];

const edges: GraphEdge[] = [
  // K.CC chain
  { from: "K.CC.1", to: "K.CC.2" },
  { from: "K.CC.1", to: "K.CC.3" },
  { from: "K.CC.2", to: "K.CC.4" },
  { from: "K.CC.3", to: "K.CC.4" },
  { from: "K.CC.4", to: "K.CC.5" },
  { from: "K.CC.5", to: "K.CC.6" },
  { from: "K.CC.6", to: "K.CC.7" },
  // K.CC → 1.OA
  { from: "K.CC.5", to: "1.OA.1" },
  { from: "K.CC.7", to: "1.OA.1" },
  // 1.OA chain
  { from: "1.OA.1", to: "1.OA.2" },
  { from: "1.OA.1", to: "1.OA.3" },
  { from: "1.OA.1", to: "1.OA.4" },
  { from: "K.CC.2", to: "1.OA.5" },
  { from: "1.OA.1", to: "1.OA.5" },
  { from: "1.OA.3", to: "1.OA.6" },
  { from: "1.OA.4", to: "1.OA.6" },
  { from: "1.OA.5", to: "1.OA.6" },
  { from: "1.OA.1", to: "1.OA.7" },
  { from: "1.OA.6", to: "1.OA.8" },
  { from: "1.OA.7", to: "1.OA.8" },
  // K.CC → 1.NBT
  { from: "K.CC.1", to: "1.NBT.1" },
  { from: "K.CC.3", to: "1.NBT.1" },
  { from: "1.NBT.1", to: "1.NBT.2" },
  { from: "K.CC.4", to: "1.NBT.2" },
  { from: "1.NBT.2", to: "1.NBT.3" },
  { from: "K.CC.7", to: "1.NBT.3" },
  // 1.NBT operations
  { from: "1.NBT.2", to: "1.NBT.4" },
  { from: "1.OA.6", to: "1.NBT.4" },
  { from: "1.NBT.2", to: "1.NBT.5" },
  { from: "1.NBT.5", to: "1.NBT.6" },
  { from: "1.OA.4", to: "1.NBT.6" },
];

async function seed() {
  const connected = await verifyConnectivity();
  if (!connected) {
    console.error("Cannot connect to Neo4j. Is it running?");
    process.exit(1);
  }

  const session = getSession();
  if (!session) {
    console.error("Neo4j is unavailable. Cannot seed knowledge graph.");
    process.exit(1);
  }

  try {
    // Clear existing data
    console.log("Clearing existing knowledge graph...");
    await session.run("MATCH (n:KnowledgeNode) DETACH DELETE n");

    // Create constraint for unique nodeCode
    console.log("Creating constraints...");
    await session.run(
      "CREATE CONSTRAINT knowledge_node_code IF NOT EXISTS FOR (n:KnowledgeNode) REQUIRE n.nodeCode IS UNIQUE"
    );

    // Create all nodes
    console.log("Creating knowledge nodes...");
    for (const node of nodes) {
      await session.run(
        `CREATE (n:KnowledgeNode {
          nodeCode: $nodeCode,
          title: $title,
          description: $description,
          gradeLevel: $gradeLevel,
          domain: $domain,
          difficulty: $difficulty
        })`,
        {
          nodeCode: node.nodeCode,
          title: node.title,
          description: node.description,
          gradeLevel: node.gradeLevel,
          domain: node.domain,
          difficulty: node.difficulty,
        }
      );
      console.log(`  Created: ${node.nodeCode} — ${node.title}`);
    }

    // Create prerequisite relationships
    console.log("Creating prerequisite relationships...");
    for (const edge of edges) {
      await session.run(
        `MATCH (from:KnowledgeNode {nodeCode: $from})
         MATCH (to:KnowledgeNode {nodeCode: $to})
         CREATE (from)-[:PREREQUISITE_OF]->(to)`,
        { from: edge.from, to: edge.to }
      );
      console.log(`  ${edge.from} → PREREQUISITE_OF → ${edge.to}`);
    }

    // Verify counts
    const nodeCount = await session.run(
      "MATCH (n:KnowledgeNode) RETURN count(n) AS count"
    );
    const edgeCount = await session.run(
      "MATCH ()-[r:PREREQUISITE_OF]->() RETURN count(r) AS count"
    );
    console.log(
      `\nSeed complete: ${nodeCount.records[0].get("count")} nodes, ${edgeCount.records[0].get("count")} relationships`
    );
  } catch (error) {
    console.error("Neo4j seed failed:", error);
    throw error;
  } finally {
    await session.close();
    await closeNeo4j();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
