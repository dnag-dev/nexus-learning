/**
 * POST /api/admin/seed-curriculum
 *
 * Upserts all K-G5 math curriculum nodes into the database.
 * Protected by ADMIN_SEED_KEY environment variable.
 *
 * Usage:
 *   curl -X POST https://nexus-learning-dnag.vercel.app/api/admin/seed-curriculum \
 *     -H "Authorization: Bearer YOUR_ADMIN_SEED_KEY"
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

// ─── Auth ───

function verifyAdminKey(request: Request): boolean {
  const key = process.env.ADMIN_SEED_KEY;
  if (!key) return false;
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${key}`;
}

// ─── Types ───

interface NodeSeed {
  nodeCode: string;
  title: string;
  description: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  prerequisiteCodes: string[];
}

// ─── K-G5 Math Curriculum (Common Core aligned) ───

const knowledgeNodes: NodeSeed[] = [
  // ─── Kindergarten Counting & Cardinality (K.CC) ───
  { nodeCode: "K.CC.1", title: "Count to 100 by Ones and Tens", description: "Know the count sequence. Count to 100 by ones and by tens.", gradeLevel: "K", domain: "COUNTING", difficulty: 1, prerequisiteCodes: [] },
  { nodeCode: "K.CC.2", title: "Count Forward from a Given Number", description: "Count forward beginning from a given number within the known sequence.", gradeLevel: "K", domain: "COUNTING", difficulty: 2, prerequisiteCodes: ["K.CC.1"] },
  { nodeCode: "K.CC.3", title: "Write Numbers 0 to 20", description: "Write numbers from 0 to 20. Represent a number of objects with a written numeral.", gradeLevel: "K", domain: "COUNTING", difficulty: 2, prerequisiteCodes: ["K.CC.1"] },
  { nodeCode: "K.CC.4", title: "Understand Counting and Cardinality", description: "Understand the relationship between numbers and quantities; connect counting to cardinality.", gradeLevel: "K", domain: "COUNTING", difficulty: 3, prerequisiteCodes: ["K.CC.2", "K.CC.3"] },
  { nodeCode: "K.CC.5", title: "Count to Answer 'How Many?'", description: "Count to answer 'how many?' questions about as many as 20 things arranged in various configurations.", gradeLevel: "K", domain: "COUNTING", difficulty: 3, prerequisiteCodes: ["K.CC.4"] },
  { nodeCode: "K.CC.6", title: "Identify Greater/Less/Equal", description: "Identify whether the number of objects in one group is greater than, less than, or equal to another group.", gradeLevel: "K", domain: "COUNTING", difficulty: 4, prerequisiteCodes: ["K.CC.5"] },
  { nodeCode: "K.CC.7", title: "Compare Two Numbers Between 1 and 10", description: "Compare two numbers between 1 and 10 presented as written numerals.", gradeLevel: "K", domain: "COUNTING", difficulty: 4, prerequisiteCodes: ["K.CC.6"] },

  // ─── Grade 1 Operations & Algebraic Thinking (1.OA) ───
  { nodeCode: "1.OA.1", title: "Addition and Subtraction Word Problems to 20", description: "Use addition and subtraction within 20 to solve word problems.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 3, prerequisiteCodes: ["K.CC.5", "K.CC.7"] },
  { nodeCode: "1.OA.2", title: "Three Addend Problems", description: "Solve word problems that call for addition of three whole numbers whose sum is less than or equal to 20.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.OA.1"] },
  { nodeCode: "1.OA.3", title: "Commutative and Associative Properties", description: "Apply properties of operations (commutative and associative) as strategies to add and subtract.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.OA.1"] },
  { nodeCode: "1.OA.4", title: "Subtraction as Unknown-Addend", description: "Understand subtraction as an unknown-addend problem.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.OA.1"] },
  { nodeCode: "1.OA.5", title: "Counting On to Add and Subtract", description: "Relate counting to addition and subtraction (e.g., by counting on 2 to add 2).", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 3, prerequisiteCodes: ["K.CC.5"] },
  { nodeCode: "1.OA.6", title: "Fluently Add and Subtract Within 10", description: "Add and subtract within 20 using strategies. Fluently add and subtract within 10.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.OA.3", "1.OA.5"] },
  { nodeCode: "1.OA.7", title: "Understand the Equals Sign", description: "Understand the meaning of the equal sign and determine if equations are true or false.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.OA.1"] },
  { nodeCode: "1.OA.8", title: "Determine Unknown Number in Equations", description: "Determine the unknown whole number in an addition or subtraction equation.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.OA.7", "1.OA.4"] },

  // ─── Grade 1 Number & Operations in Base Ten (1.NBT) ───
  { nodeCode: "1.NBT.1", title: "Count to 120", description: "Count to 120, starting at any number less than 120. Read and write numerals to 120.", gradeLevel: "G1", domain: "COUNTING", difficulty: 3, prerequisiteCodes: ["K.CC.1", "K.CC.3"] },
  { nodeCode: "1.NBT.2", title: "Understand Place Value (Tens and Ones)", description: "Understand that the two digits of a two-digit number represent amounts of tens and ones.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.NBT.1"] },
  { nodeCode: "1.NBT.3", title: "Compare Two Two-Digit Numbers", description: "Compare two two-digit numbers based on meanings of the tens and ones digits using >, =, <.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.NBT.2"] },
  { nodeCode: "1.NBT.4", title: "Add Within 100", description: "Add within 100 including adding a two-digit number and a one-digit number using place value.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.NBT.2", "1.OA.6"] },
  { nodeCode: "1.NBT.5", title: "Mentally Find 10 More or Less", description: "Given a two-digit number, mentally find 10 more or 10 less without counting.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.NBT.2"] },
  { nodeCode: "1.NBT.6", title: "Subtract Multiples of 10", description: "Subtract multiples of 10 in the range 10-90 from multiples of 10 in the range 10-90.", gradeLevel: "G1", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.NBT.5", "1.OA.6"] },

  // ─── Grade 2 Operations & Algebraic Thinking (2.OA) ───
  { nodeCode: "2.OA.1", title: "Addition and Subtraction Word Problems to 100", description: "Use addition and subtraction within 100 to solve one- and two-step word problems.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["1.OA.6", "1.NBT.4"] },
  { nodeCode: "2.OA.2", title: "Fluently Add and Subtract Within 20", description: "Fluently add and subtract within 20 using mental strategies. Know all sums of two one-digit numbers.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.OA.6"] },
  { nodeCode: "2.OA.3", title: "Determine Even or Odd", description: "Determine whether a group of objects (up to 20) has an odd or even number of members.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 4, prerequisiteCodes: ["2.OA.2"] },
  { nodeCode: "2.OA.4", title: "Use Addition to Find Rectangular Arrays", description: "Use addition to find the total number of objects in rectangular arrays (up to 5 rows and 5 columns).", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["2.OA.2"] },

  // ─── Grade 2 Number & Operations in Base Ten (2.NBT) ───
  { nodeCode: "2.NBT.1", title: "Understand Three-Digit Place Value", description: "Understand that the three digits of a three-digit number represent hundreds, tens, and ones.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["1.NBT.2"] },
  { nodeCode: "2.NBT.2", title: "Count Within 1000; Skip-Count by 5s, 10s, 100s", description: "Count within 1000; skip-count by 5s, 10s, and 100s.", gradeLevel: "G2", domain: "COUNTING", difficulty: 4, prerequisiteCodes: ["2.NBT.1"] },
  { nodeCode: "2.NBT.3", title: "Read and Write Numbers to 1000", description: "Read and write numbers to 1000 using base-ten numerals, number names, and expanded form.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["2.NBT.1"] },
  { nodeCode: "2.NBT.4", title: "Compare Two Three-Digit Numbers", description: "Compare two three-digit numbers based on meanings of the hundreds, tens, and ones digits using >, =, <.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["2.NBT.3"] },
  { nodeCode: "2.NBT.5", title: "Fluently Add and Subtract Within 100", description: "Fluently add and subtract within 100 using strategies based on place value and properties of operations.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["2.OA.1", "2.NBT.1"] },
  { nodeCode: "2.NBT.7", title: "Add and Subtract Within 1000", description: "Add and subtract within 1000 using concrete models, drawings, and strategies based on place value.", gradeLevel: "G2", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["2.NBT.5"] },

  // ─── Grade 2 Measurement & Data (2.MD) ───
  { nodeCode: "2.MD.1", title: "Measure with Standard Units", description: "Measure the length of an object by selecting and using appropriate tools (rulers, yardsticks, meter sticks).", gradeLevel: "G2", domain: "MEASUREMENT", difficulty: 4, prerequisiteCodes: ["1.NBT.2"] },
  { nodeCode: "2.MD.8", title: "Solve Money Word Problems", description: "Solve word problems involving dollar bills, quarters, dimes, nickels, and pennies using $ and ¢ symbols.", gradeLevel: "G2", domain: "MEASUREMENT", difficulty: 6, prerequisiteCodes: ["2.NBT.5"] },

  // ─── Grade 2 Geometry (2.G) ───
  { nodeCode: "2.G.1", title: "Recognize and Draw Shapes", description: "Recognize and draw shapes having specified attributes such as a given number of angles or faces.", gradeLevel: "G2", domain: "GEOMETRY", difficulty: 4, prerequisiteCodes: ["1.NBT.1"] },

  // ─── Grade 3 Operations & Algebraic Thinking (3.OA) ───
  { nodeCode: "3.OA.1", title: "Interpret Multiplication", description: "Interpret products of whole numbers, e.g., 5 × 7 as the total number of objects in 5 groups of 7.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["2.OA.4"] },
  { nodeCode: "3.OA.2", title: "Interpret Division", description: "Interpret whole-number quotients of whole numbers, e.g., 56 ÷ 8 as objects partitioned into equal shares.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["3.OA.1"] },
  { nodeCode: "3.OA.3", title: "Multiplication and Division Word Problems", description: "Use multiplication and division within 100 to solve word problems.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.1", "3.OA.2"] },
  { nodeCode: "3.OA.4", title: "Find Unknown in Multiplication/Division", description: "Determine the unknown whole number in a multiplication or division equation.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.3"] },
  { nodeCode: "3.OA.5", title: "Properties of Multiplication", description: "Apply properties of operations (commutative, associative, distributive) to multiply and divide.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.3"] },
  { nodeCode: "3.OA.7", title: "Fluently Multiply and Divide Within 100", description: "Fluently multiply and divide within 100 using strategies and known relationships.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.OA.5"] },
  { nodeCode: "3.OA.8", title: "Two-Step Word Problems (All Operations)", description: "Solve two-step word problems using the four operations. Represent using equations with a letter for the unknown.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.OA.7", "2.NBT.7"] },
  { nodeCode: "3.OA.9", title: "Identify Arithmetic Patterns", description: "Identify arithmetic patterns (including patterns in the addition table or multiplication table) and explain them.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.7"] },

  // ─── Grade 3 Number & Operations in Base Ten (3.NBT) ───
  { nodeCode: "3.NBT.1", title: "Round Whole Numbers to Nearest 10 or 100", description: "Use place value understanding to round whole numbers to the nearest 10 or 100.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 5, prerequisiteCodes: ["2.NBT.4"] },
  { nodeCode: "3.NBT.2", title: "Fluently Add and Subtract Within 1000", description: "Fluently add and subtract within 1000 using strategies and algorithms based on place value.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["2.NBT.7", "3.NBT.1"] },

  // ─── Grade 3 Fractions (3.NF) ───
  { nodeCode: "3.NF.1", title: "Understand Fractions as Parts of a Whole", description: "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.1"] },
  { nodeCode: "3.NF.2", title: "Fractions on a Number Line", description: "Understand a fraction as a number on the number line; represent fractions on a number line diagram.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.NF.1"] },
  { nodeCode: "3.NF.3", title: "Equivalent Fractions and Comparing Fractions", description: "Explain equivalence of fractions and compare fractions by reasoning about their size.", gradeLevel: "G3", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.NF.2"] },

  // ─── Grade 3 Measurement & Data (3.MD) ───
  { nodeCode: "3.MD.7", title: "Area of Rectangles", description: "Relate area to the operations of multiplication and addition. Find area of rectangles.", gradeLevel: "G3", domain: "MEASUREMENT", difficulty: 6, prerequisiteCodes: ["3.OA.7", "2.G.1"] },

  // ─── Grade 3 Geometry (3.G) ───
  { nodeCode: "3.G.1", title: "Understand Categories of Shapes", description: "Understand that shapes in different categories may share attributes. Recognize rhombuses, rectangles, squares.", gradeLevel: "G3", domain: "GEOMETRY", difficulty: 5, prerequisiteCodes: ["2.G.1"] },

  // ─── Grade 4 Operations & Algebraic Thinking (4.OA) ───
  { nodeCode: "4.OA.1", title: "Multiplicative Comparisons", description: "Interpret a multiplication equation as a comparison. Represent verbal statements of multiplicative comparisons.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.OA.3"] },
  { nodeCode: "4.OA.2", title: "Multiplicative Comparison Word Problems", description: "Multiply or divide to solve word problems involving multiplicative comparison.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["4.OA.1"] },
  { nodeCode: "4.OA.3", title: "Multi-Step Word Problems", description: "Solve multistep word problems with whole numbers using the four operations including interpreting remainders.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.OA.8", "4.OA.2"] },
  { nodeCode: "4.OA.4", title: "Factors and Multiples", description: "Find all factor pairs for a whole number 1-100. Determine whether a number is prime or composite.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.OA.7"] },

  // ─── Grade 4 Number & Operations in Base Ten (4.NBT) ───
  { nodeCode: "4.NBT.1", title: "Place Value and Powers of 10", description: "Recognize that a digit in one place represents ten times what it represents in the place to its right.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["3.NBT.1"] },
  { nodeCode: "4.NBT.2", title: "Read, Write, and Compare Multi-Digit Numbers", description: "Read and write multi-digit whole numbers using base-ten numerals, names, expanded form. Compare using >, =, <.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["4.NBT.1"] },
  { nodeCode: "4.NBT.3", title: "Round Multi-Digit Numbers", description: "Use place value understanding to round multi-digit whole numbers to any place.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 6, prerequisiteCodes: ["4.NBT.2"] },
  { nodeCode: "4.NBT.4", title: "Fluently Add and Subtract Multi-Digit Numbers", description: "Fluently add and subtract multi-digit whole numbers using the standard algorithm.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.NBT.2", "4.NBT.3"] },
  { nodeCode: "4.NBT.5", title: "Multiply up to 4-Digit by 1-Digit", description: "Multiply a whole number of up to four digits by a one-digit whole number using strategies based on place value.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["4.NBT.4", "3.OA.7"] },
  { nodeCode: "4.NBT.6", title: "Divide up to 4-Digit by 1-Digit", description: "Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["4.NBT.5"] },

  // ─── Grade 4 Fractions (4.NF) ───
  { nodeCode: "4.NF.1", title: "Equivalent Fractions Using Multiplication", description: "Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b) using visual fraction models.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["3.NF.3"] },
  { nodeCode: "4.NF.2", title: "Compare Fractions with Different Denominators", description: "Compare two fractions with different numerators and different denominators using common denominators or benchmarks.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["4.NF.1"] },
  { nodeCode: "4.NF.3", title: "Add and Subtract Fractions (Same Denominator)", description: "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["4.NF.1"] },
  { nodeCode: "4.NF.4", title: "Multiply Fractions by Whole Numbers", description: "Apply understanding of multiplication to multiply a fraction by a whole number.", gradeLevel: "G4", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["4.NF.3", "4.OA.1"] },

  // ─── Grade 4 Measurement & Data (4.MD) ───
  { nodeCode: "4.MD.3", title: "Apply Area and Perimeter Formulas", description: "Apply the area and perimeter formulas for rectangles in real-world and mathematical problems.", gradeLevel: "G4", domain: "MEASUREMENT", difficulty: 7, prerequisiteCodes: ["3.MD.7", "4.NBT.5"] },

  // ─── Grade 4 Geometry (4.G) ───
  { nodeCode: "4.G.1", title: "Lines, Angles, and Classify Shapes", description: "Draw and identify lines, angles (right, acute, obtuse), and perpendicular and parallel lines. Classify 2D figures.", gradeLevel: "G4", domain: "GEOMETRY", difficulty: 6, prerequisiteCodes: ["3.G.1"] },

  // ─── Grade 5 Operations & Algebraic Thinking (5.OA) ───
  { nodeCode: "5.OA.1", title: "Evaluate Expressions with Grouping Symbols", description: "Use parentheses, brackets, or braces in numerical expressions and evaluate expressions with these symbols.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["4.OA.3"] },
  { nodeCode: "5.OA.2", title: "Write and Interpret Numerical Expressions", description: "Write simple expressions that record calculations with numbers and interpret numerical expressions without evaluating.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["5.OA.1"] },
  { nodeCode: "5.OA.3", title: "Generate and Analyze Patterns", description: "Generate two numerical patterns using given rules. Identify relationships between corresponding terms.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["5.OA.2"] },

  // ─── Grade 5 Number & Operations in Base Ten (5.NBT) ───
  { nodeCode: "5.NBT.1", title: "Place Value System (Powers of 10)", description: "Recognize that a digit in one place represents 10 times as much as it represents in the place to its right and 1/10 of what it represents in the place to its left.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["4.NBT.1"] },
  { nodeCode: "5.NBT.2", title: "Explain Patterns in Powers of 10", description: "Explain patterns in the number of zeros of the product when multiplying by powers of 10.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["5.NBT.1"] },
  { nodeCode: "5.NBT.3", title: "Read, Write, Compare Decimals to Thousandths", description: "Read, write, and compare decimals to thousandths using base-ten numerals, names, and expanded form.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 7, prerequisiteCodes: ["5.NBT.1"] },
  { nodeCode: "5.NBT.5", title: "Fluently Multiply Multi-Digit Numbers", description: "Fluently multiply multi-digit whole numbers using the standard algorithm.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["4.NBT.5"] },
  { nodeCode: "5.NBT.6", title: "Divide up to 4-Digit by 2-Digit", description: "Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 9, prerequisiteCodes: ["5.NBT.5", "4.NBT.6"] },
  { nodeCode: "5.NBT.7", title: "Add, Subtract, Multiply, Divide Decimals", description: "Add, subtract, multiply, and divide decimals to hundredths using various strategies.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 9, prerequisiteCodes: ["5.NBT.3", "5.NBT.5"] },

  // ─── Grade 5 Fractions (5.NF) ───
  { nodeCode: "5.NF.1", title: "Add and Subtract Fractions (Unlike Denominators)", description: "Add and subtract fractions with unlike denominators by replacing given fractions with equivalent fractions.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["4.NF.3", "4.NF.1"] },
  { nodeCode: "5.NF.2", title: "Fraction Word Problems (Add/Subtract)", description: "Solve word problems involving addition and subtraction of fractions including mixed numbers.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["5.NF.1"] },
  { nodeCode: "5.NF.3", title: "Interpret Fractions as Division", description: "Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b).", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 8, prerequisiteCodes: ["5.NF.1"] },
  { nodeCode: "5.NF.4", title: "Multiply Fractions and Mixed Numbers", description: "Apply understanding of multiplication to multiply a fraction or whole number by a fraction.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 9, prerequisiteCodes: ["5.NF.3", "4.NF.4"] },
  { nodeCode: "5.NF.6", title: "Fraction Multiplication Word Problems", description: "Solve real-world problems involving multiplication of fractions and mixed numbers.", gradeLevel: "G5", domain: "OPERATIONS", difficulty: 9, prerequisiteCodes: ["5.NF.4"] },

  // ─── Grade 5 Measurement & Data (5.MD) ───
  { nodeCode: "5.MD.1", title: "Measurement Unit Conversions", description: "Convert among different-sized standard measurement units within a given measurement system.", gradeLevel: "G5", domain: "MEASUREMENT", difficulty: 7, prerequisiteCodes: ["4.MD.3", "5.NBT.2"] },
  { nodeCode: "5.MD.3", title: "Volume of Rectangular Prisms", description: "Recognize volume as an attribute of solid figures and understand concepts of volume measurement.", gradeLevel: "G5", domain: "MEASUREMENT", difficulty: 8, prerequisiteCodes: ["5.MD.1", "5.NBT.5"] },

  // ─── Grade 5 Geometry (5.G) ───
  { nodeCode: "5.G.1", title: "Graph Points on a Coordinate Plane", description: "Use a pair of perpendicular number lines (axes) to define a coordinate system. Graph points in the first quadrant.", gradeLevel: "G5", domain: "GEOMETRY", difficulty: 6, prerequisiteCodes: ["5.OA.3"] },
];

// ─── Handler ───

export async function POST(request: Request) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const results = { created: 0, updated: 0, linked: 0, errors: [] as string[] };

    // 1. Upsert all nodes
    for (const node of knowledgeNodes) {
      try {
        await prisma.knowledgeNode.upsert({
          where: { nodeCode: node.nodeCode },
          update: {
            title: node.title,
            description: node.description,
            gradeLevel: node.gradeLevel as any,
            domain: node.domain as any,
            difficulty: node.difficulty,
          },
          create: {
            nodeCode: node.nodeCode,
            title: node.title,
            description: node.description,
            gradeLevel: node.gradeLevel as any,
            domain: node.domain as any,
            difficulty: node.difficulty,
          },
        });
        results.created++;
      } catch (err) {
        results.errors.push(
          `Node ${node.nodeCode}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }

    // 2. Link prerequisites
    for (const node of knowledgeNodes) {
      if (node.prerequisiteCodes.length === 0) continue;

      try {
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
              set: prerequisites.map((p) => ({ id: p.id })),
            },
          },
        });
        results.linked++;
      } catch (err) {
        results.errors.push(
          `Prerequisites for ${node.nodeCode}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      total: knowledgeNodes.length,
      upserted: results.created,
      prerequisitesLinked: results.linked,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Seed curriculum error:", error);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 }
    );
  }
}
