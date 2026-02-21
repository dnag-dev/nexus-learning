import { PrismaClient, GradeLevel, KnowledgeDomain } from "@prisma/client";

const prisma = new PrismaClient();

interface NodeSeed {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: GradeLevel;
  domain: KnowledgeDomain;
  difficulty: number;
  prerequisiteCodes: string[];
}

const knowledgeNodes: NodeSeed[] = [
  // ─── Kindergarten Counting & Cardinality (K.CC) ───
  {
    nodeCode: "K.CC.1",
    title: "Count to 100 by Ones and Tens",
    description:
      "Know the count sequence. Count to 100 by ones and by tens.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 1,
    prerequisiteCodes: [],
  },
  {
    nodeCode: "K.CC.2",
    title: "Count Forward from a Given Number",
    description:
      "Count forward beginning from a given number within the known sequence.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 2,
    prerequisiteCodes: ["K.CC.1"],
  },
  {
    nodeCode: "K.CC.3",
    title: "Write Numbers 0 to 20",
    description:
      "Write numbers from 0 to 20. Represent a number of objects with a written numeral.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 2,
    prerequisiteCodes: ["K.CC.1"],
  },
  {
    nodeCode: "K.CC.4",
    title: "Understand Counting and Cardinality",
    description:
      "Understand the relationship between numbers and quantities; connect counting to cardinality.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 3,
    prerequisiteCodes: ["K.CC.2", "K.CC.3"],
  },
  {
    nodeCode: "K.CC.5",
    title: "Count to Answer 'How Many?'",
    description:
      "Count to answer 'how many?' questions about as many as 20 things arranged in various configurations.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 3,
    prerequisiteCodes: ["K.CC.4"],
  },
  {
    nodeCode: "K.CC.6",
    title: "Identify Greater/Less/Equal",
    description:
      "Identify whether the number of objects in one group is greater than, less than, or equal to another group.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 4,
    prerequisiteCodes: ["K.CC.5"],
  },
  {
    nodeCode: "K.CC.7",
    title: "Compare Two Numbers Between 1 and 10",
    description:
      "Compare two numbers between 1 and 10 presented as written numerals.",
    gradeLevel: GradeLevel.K,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 4,
    prerequisiteCodes: ["K.CC.6"],
  },

  // ─── Grade 1 Operations & Algebraic Thinking (1.OA) ───
  {
    nodeCode: "1.OA.1",
    title: "Addition and Subtraction Word Problems to 20",
    description:
      "Use addition and subtraction within 20 to solve word problems involving adding to, taking from, putting together, taking apart, and comparing.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 3,
    prerequisiteCodes: ["K.CC.5", "K.CC.7"],
  },
  {
    nodeCode: "1.OA.2",
    title: "Addition Word Problems with Three Whole Numbers",
    description:
      "Solve word problems that call for addition of three whole numbers whose sum is less than or equal to 20.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 4,
    prerequisiteCodes: ["1.OA.1"],
  },
  {
    nodeCode: "1.OA.3",
    title: "Commutative and Associative Properties",
    description:
      "Apply properties of operations as strategies to add and subtract. Examples: commutative and associative properties of addition.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["1.OA.1"],
  },
  {
    nodeCode: "1.OA.4",
    title: "Subtraction as Unknown-Addend Problem",
    description:
      "Understand subtraction as an unknown-addend problem. For example, subtract 10 - 8 by finding the number that makes 10 when added to 8.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["1.OA.1"],
  },
  {
    nodeCode: "1.OA.5",
    title: "Relate Counting to Addition and Subtraction",
    description:
      "Relate counting to addition and subtraction, such as counting on 2 to add 2.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 3,
    prerequisiteCodes: ["K.CC.2", "1.OA.1"],
  },
  {
    nodeCode: "1.OA.6",
    title: "Add and Subtract Within 20",
    description:
      "Add and subtract within 20, demonstrating fluency for addition and subtraction within 10. Use strategies such as counting on, making ten, decomposing a number leading to a ten, using the relationship between addition and subtraction, and creating equivalent but easier or known sums.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["1.OA.3", "1.OA.4", "1.OA.5"],
  },
  {
    nodeCode: "1.OA.7",
    title: "Understand the Meaning of the Equal Sign",
    description:
      "Understand the meaning of the equal sign, and determine if equations involving addition and subtraction are true or false.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 4,
    prerequisiteCodes: ["1.OA.1"],
  },
  {
    nodeCode: "1.OA.8",
    title: "Determine Unknown Whole Number in Equations",
    description:
      "Determine the unknown whole number in an addition or subtraction equation relating three whole numbers. For example, determine the unknown number that makes the equation true in 8 + ? = 11.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["1.OA.6", "1.OA.7"],
  },

  // ─── Grade 1 Number & Operations in Base Ten (1.NBT) ───
  {
    nodeCode: "1.NBT.1",
    title: "Count to 120",
    description:
      "Count to 120, starting at any number less than 120. In this range, read and write numerals and represent a number of objects with a written numeral.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 3,
    prerequisiteCodes: ["K.CC.1", "K.CC.3"],
  },
  {
    nodeCode: "1.NBT.2",
    title: "Understand Place Value (Tens and Ones)",
    description:
      "Understand that the two digits of a two-digit number represent amounts of tens and ones. Understand 10 can be thought of as a bundle of ten ones called a 'ten.'",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["1.NBT.1", "K.CC.4"],
  },
  {
    nodeCode: "1.NBT.3",
    title: "Compare Two Two-Digit Numbers",
    description:
      "Compare two two-digit numbers based on meanings of the tens and ones digits, recording the results with the symbols >, =, and <.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["1.NBT.2", "K.CC.7"],
  },
  {
    nodeCode: "1.NBT.4",
    title: "Add Within 100",
    description:
      "Add within 100, including adding a two-digit number and a one-digit number, and adding a two-digit number and a multiple of 10, using concrete models or drawings and strategies based on place value.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["1.NBT.2", "1.OA.6"],
  },
  {
    nodeCode: "1.NBT.5",
    title: "Find 10 More or 10 Less",
    description:
      "Given a two-digit number, mentally find 10 more or 10 less than the number, without having to count; explain the reasoning used.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["1.NBT.2"],
  },
  {
    nodeCode: "1.NBT.6",
    title: "Subtract Multiples of 10",
    description:
      "Subtract multiples of 10 in the range 10-90 from multiples of 10 in the range 10-90 (positive or zero differences), using concrete models or drawings and strategies based on place value.",
    gradeLevel: GradeLevel.G1,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["1.NBT.5", "1.OA.4"],
  },
];

async function seed() {
  console.log("Seeding PostgreSQL knowledge nodes...");

  // Create all nodes first
  for (const node of knowledgeNodes) {
    await prisma.knowledgeNode.upsert({
      where: { nodeCode: node.nodeCode },
      update: {
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
      },
      create: {
        nodeCode: node.nodeCode,
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
      },
    });
    console.log(`  Created node: ${node.nodeCode} - ${node.title}`);
  }

  // Now create prerequisite relationships
  for (const node of knowledgeNodes) {
    if (node.prerequisiteCodes.length > 0) {
      const currentNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode: node.nodeCode },
      });
      if (!currentNode) continue;

      const prerequisites = await prisma.knowledgeNode.findMany({
        where: { nodeCode: { in: node.prerequisiteCodes } },
      });

      await prisma.knowledgeNode.update({
        where: { id: currentNode.id },
        data: {
          prerequisites: {
            connect: prerequisites.map((p) => ({ id: p.id })),
          },
        },
      });
      console.log(
        `  Linked ${node.nodeCode} prerequisites: ${node.prerequisiteCodes.join(", ")}`
      );
    }
  }

  // Create a demo parent user
  const demoParent = await prisma.user.upsert({
    where: { email: "demo@aautilearn.com" },
    update: {},
    create: {
      email: "demo@aautilearn.com",
      passwordHash: "PLACEHOLDER_HASH_USE_AUTH0",
      role: "PARENT",
    },
  });
  console.log(`  Created demo parent: ${demoParent.email}`);

  // Create a demo student
  const demoStudent = await prisma.student.upsert({
    where: { id: "demo-student-1" },
    update: {},
    create: {
      id: "demo-student-1",
      displayName: "Sofia",
      avatarPersonaId: "cosmo",
      gradeLevel: "K",
      ageGroup: "EARLY_5_7",
      parentId: demoParent.id,
    },
  });
  console.log(`  Created demo student: ${demoStudent.displayName}`);

  // Create streak data for demo student
  await prisma.streakData.upsert({
    where: { studentId: demoStudent.id },
    update: {},
    create: {
      studentId: demoStudent.id,
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
    },
  });

  // Create a demo subscription
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { userId: demoParent.id },
    update: {},
    create: {
      userId: demoParent.id,
      plan: "SPARK",
      status: "ACTIVE",
      currentPeriodEnd: oneMonthFromNow,
    },
  });
  console.log("  Created demo SPARK subscription");

  console.log("PostgreSQL seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
