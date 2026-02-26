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

  // ─── Grade 2 Operations & Algebraic Thinking (2.OA) ───
  {
    nodeCode: "2.OA.1",
    title: "Add and Subtract Within 100 Word Problems",
    description:
      "Use addition and subtraction within 100 to solve one- and two-step word problems involving adding to, taking from, putting together, taking apart, and comparing.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 4,
    prerequisiteCodes: ["1.OA.1", "1.OA.6"],
  },
  {
    nodeCode: "2.OA.2",
    title: "Fluently Add and Subtract Within 20",
    description:
      "Fluently add and subtract within 20 using mental strategies. By end of Grade 2, know from memory all sums of two one-digit numbers.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 3,
    prerequisiteCodes: ["1.OA.6"],
  },
  {
    nodeCode: "2.OA.3",
    title: "Determine Odd or Even",
    description:
      "Determine whether a group of objects (up to 20) has an odd or even number of members by pairing objects or counting by 2s.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 4,
    prerequisiteCodes: ["2.OA.2"],
  },
  {
    nodeCode: "2.OA.4",
    title: "Use Addition for Rectangular Arrays",
    description:
      "Use addition to find the total number of objects arranged in rectangular arrays with up to 5 rows and up to 5 columns. Write an equation to express the total as a sum of equal addends.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["2.OA.2"],
  },

  // ─── Grade 2 Number & Operations in Base Ten (2.NBT) ───
  {
    nodeCode: "2.NBT.1",
    title: "Understand Place Value: Hundreds, Tens, Ones",
    description:
      "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones. 100 can be thought of as a bundle of ten tens called a 'hundred.'",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["1.NBT.2"],
  },
  {
    nodeCode: "2.NBT.2",
    title: "Count Within 1000 and Skip-Count",
    description:
      "Count within 1000; skip-count by 5s, 10s, and 100s.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 4,
    prerequisiteCodes: ["2.NBT.1", "1.NBT.1"],
  },
  {
    nodeCode: "2.NBT.3",
    title: "Read and Write Numbers to 1000",
    description:
      "Read and write numbers to 1000 using base-ten numerals, number names, and expanded form.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["2.NBT.1"],
  },
  {
    nodeCode: "2.NBT.4",
    title: "Compare Two Three-Digit Numbers",
    description:
      "Compare two three-digit numbers based on meanings of the hundreds, tens, and ones digits, using >, =, and < symbols.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["2.NBT.3", "1.NBT.3"],
  },
  {
    nodeCode: "2.NBT.5",
    title: "Fluently Add and Subtract Within 100",
    description:
      "Fluently add and subtract within 100 using strategies based on place value, properties of operations, and/or the relationship between addition and subtraction.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["1.NBT.4", "2.OA.2"],
  },
  {
    nodeCode: "2.NBT.7",
    title: "Add and Subtract Within 1000",
    description:
      "Add and subtract within 1000 using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["2.NBT.5", "2.NBT.1"],
  },

  // ─── Grade 2 Measurement & Data (2.MD) ───
  {
    nodeCode: "2.MD.1",
    title: "Measure Length Using Appropriate Tools",
    description:
      "Measure the length of an object by selecting and using appropriate tools such as rulers, yardsticks, meter sticks, and measuring tapes.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 4,
    prerequisiteCodes: ["2.NBT.3"],
  },
  {
    nodeCode: "2.MD.8",
    title: "Solve Word Problems Involving Money",
    description:
      "Solve word problems involving dollar bills, quarters, dimes, nickels, and pennies, using $ and ¢ symbols appropriately.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 6,
    prerequisiteCodes: ["2.OA.1", "2.NBT.5"],
  },

  // ─── Grade 2 Geometry (2.G) ───
  {
    nodeCode: "2.G.1",
    title: "Recognize and Draw Shapes",
    description:
      "Recognize and draw shapes having specified attributes, such as a given number of angles or a given number of equal faces. Identify triangles, quadrilaterals, pentagons, hexagons, and cubes.",
    gradeLevel: GradeLevel.G2,
    domain: KnowledgeDomain.GEOMETRY,
    difficulty: 3,
    prerequisiteCodes: [],
  },

  // ─── Grade 3 Operations & Algebraic Thinking (3.OA) ───
  {
    nodeCode: "3.OA.1",
    title: "Interpret Products of Whole Numbers",
    description:
      "Interpret products of whole numbers, e.g., interpret 5 × 7 as the total number of objects in 5 groups of 7 objects each.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 4,
    prerequisiteCodes: ["2.OA.4"],
  },
  {
    nodeCode: "3.OA.2",
    title: "Interpret Whole-Number Quotients",
    description:
      "Interpret whole-number quotients of whole numbers, e.g., interpret 56 ÷ 8 as the number of objects in each share when 56 objects are partitioned equally into 8 shares.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.OA.1"],
  },
  {
    nodeCode: "3.OA.3",
    title: "Multiply and Divide Word Problems",
    description:
      "Use multiplication and division within 100 to solve word problems in situations involving equal groups, arrays, and measurement quantities.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.OA.1", "3.OA.2"],
  },
  {
    nodeCode: "3.OA.4",
    title: "Determine Unknown in Multiplication/Division",
    description:
      "Determine the unknown whole number in a multiplication or division equation relating three whole numbers. For example, determine the unknown number that makes the equation true: 8 × ? = 48.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.OA.3"],
  },
  {
    nodeCode: "3.OA.5",
    title: "Apply Properties of Multiplication",
    description:
      "Apply properties of operations as strategies to multiply and divide. Examples: commutative property, associative property, distributive property.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.OA.1"],
  },
  {
    nodeCode: "3.OA.7",
    title: "Fluently Multiply and Divide Within 100",
    description:
      "Fluently multiply and divide within 100, using strategies such as the relationship between multiplication and division or properties of operations. By end of Grade 3, know from memory all products of two one-digit numbers.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.OA.3", "3.OA.5"],
  },
  {
    nodeCode: "3.OA.8",
    title: "Two-Step Word Problems",
    description:
      "Solve two-step word problems using the four operations. Represent these problems using equations with a letter standing for the unknown quantity.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["3.OA.7", "2.OA.1"],
  },
  {
    nodeCode: "3.OA.9",
    title: "Identify Arithmetic Patterns",
    description:
      "Identify arithmetic patterns (including patterns in the addition table or multiplication table), and explain them using properties of operations.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.OA.7"],
  },

  // ─── Grade 3 Number & Operations in Base Ten (3.NBT) ───
  {
    nodeCode: "3.NBT.1",
    title: "Round Whole Numbers to Nearest 10 or 100",
    description:
      "Use place value understanding to round whole numbers to the nearest 10 or 100.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 4,
    prerequisiteCodes: ["2.NBT.1"],
  },
  {
    nodeCode: "3.NBT.2",
    title: "Fluently Add and Subtract Within 1000",
    description:
      "Fluently add and subtract within 1000 using strategies and algorithms based on place value, properties of operations, and/or the relationship between addition and subtraction.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["2.NBT.7"],
  },

  // ─── Grade 3 Number & Operations — Fractions (3.NF) ───
  {
    nodeCode: "3.NF.1",
    title: "Understand Fractions as Parts of a Whole",
    description:
      "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts. Understand a fraction a/b as the quantity formed by a parts of size 1/b.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.OA.2"],
  },
  {
    nodeCode: "3.NF.2",
    title: "Understand Fractions on a Number Line",
    description:
      "Understand a fraction as a number on the number line; represent fractions on a number line diagram.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.NF.1"],
  },
  {
    nodeCode: "3.NF.3",
    title: "Explain Fraction Equivalence and Comparison",
    description:
      "Explain equivalence of fractions and compare fractions by reasoning about their size. Two fractions are equivalent if they are the same size or the same point on a number line.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["3.NF.2"],
  },

  // ─── Grade 3 Measurement & Data (3.MD) ───
  {
    nodeCode: "3.MD.7",
    title: "Relate Area to Multiplication and Addition",
    description:
      "Relate area to the operations of multiplication and addition. Find the area of a rectangle with whole-number side lengths by tiling it and show that the area is the same as multiplying the side lengths.",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 6,
    prerequisiteCodes: ["3.OA.7"],
  },

  // ─── Grade 3 Geometry (3.G) ───
  {
    nodeCode: "3.G.1",
    title: "Understand Categories of Shapes",
    description:
      "Understand that shapes in different categories may share attributes, and that the shared attributes can define a larger category (e.g., quadrilaterals).",
    gradeLevel: GradeLevel.G3,
    domain: KnowledgeDomain.GEOMETRY,
    difficulty: 4,
    prerequisiteCodes: ["2.G.1"],
  },

  // ─── Grade 4 Operations & Algebraic Thinking (4.OA) ───
  {
    nodeCode: "4.OA.1",
    title: "Interpret Multiplication as Comparison",
    description:
      "Interpret a multiplication equation as a comparison, e.g., interpret 35 = 5 × 7 as a statement that 35 is 5 times as many as 7.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.OA.3"],
  },
  {
    nodeCode: "4.OA.2",
    title: "Multiplicative Comparison Word Problems",
    description:
      "Multiply or divide to solve word problems involving multiplicative comparison, distinguishing multiplicative comparison from additive comparison.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["4.OA.1"],
  },
  {
    nodeCode: "4.OA.3",
    title: "Multi-Step Word Problems",
    description:
      "Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["3.OA.8", "4.OA.2"],
  },
  {
    nodeCode: "4.OA.4",
    title: "Factor Pairs and Prime/Composite Numbers",
    description:
      "Find all factor pairs for a whole number in the range 1-100. Determine whether a given whole number in the range 1-100 is prime or composite.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.OA.7"],
  },

  // ─── Grade 4 Number & Operations in Base Ten (4.NBT) ───
  {
    nodeCode: "4.NBT.1",
    title: "Generalize Place Value Understanding",
    description:
      "Recognize that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["2.NBT.1", "3.NBT.1"],
  },
  {
    nodeCode: "4.NBT.2",
    title: "Read, Write, and Compare Multi-Digit Numbers",
    description:
      "Read and write multi-digit whole numbers using base-ten numerals, number names, and expanded form. Compare two multi-digit numbers based on meanings of the digits.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["4.NBT.1"],
  },
  {
    nodeCode: "4.NBT.3",
    title: "Round Multi-Digit Whole Numbers",
    description:
      "Use place value understanding to round multi-digit whole numbers to any place.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 5,
    prerequisiteCodes: ["4.NBT.2", "3.NBT.1"],
  },
  {
    nodeCode: "4.NBT.4",
    title: "Fluently Add and Subtract Multi-Digit Numbers",
    description:
      "Fluently add and subtract multi-digit whole numbers using the standard algorithm.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 5,
    prerequisiteCodes: ["3.NBT.2"],
  },
  {
    nodeCode: "4.NBT.5",
    title: "Multiply up to Four-Digit by One-Digit",
    description:
      "Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers, using strategies based on place value and the properties of operations.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["3.OA.7", "4.NBT.1"],
  },
  {
    nodeCode: "4.NBT.6",
    title: "Divide up to Four-Digit by One-Digit",
    description:
      "Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["4.NBT.5"],
  },

  // ─── Grade 4 Number & Operations — Fractions (4.NF) ───
  {
    nodeCode: "4.NF.1",
    title: "Explain Fraction Equivalence with Visual Models",
    description:
      "Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b) by using visual fraction models. Generate equivalent fractions.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["3.NF.3"],
  },
  {
    nodeCode: "4.NF.2",
    title: "Compare Fractions with Different Denominators",
    description:
      "Compare two fractions with different numerators and different denominators. Recognize that comparisons are valid only when the fractions refer to the same whole.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["4.NF.1"],
  },
  {
    nodeCode: "4.NF.3",
    title: "Add and Subtract Fractions (Same Denominator)",
    description:
      "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole. Decompose a fraction into a sum of fractions with the same denominator.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["4.NF.2"],
  },
  {
    nodeCode: "4.NF.4",
    title: "Multiply a Fraction by a Whole Number",
    description:
      "Apply and extend previous understandings of multiplication to multiply a fraction by a whole number. Understand a multiple of a/b as a multiple of 1/b.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["4.NF.1", "4.NBT.5"],
  },

  // ─── Grade 4 Measurement & Data (4.MD) ───
  {
    nodeCode: "4.MD.3",
    title: "Apply Area and Perimeter Formulas",
    description:
      "Apply the area and perimeter formulas for rectangles in real-world and mathematical problems.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 6,
    prerequisiteCodes: ["3.MD.7", "4.NBT.5"],
  },

  // ─── Grade 4 Geometry (4.G) ───
  {
    nodeCode: "4.G.1",
    title: "Draw and Identify Lines, Angles, and Shapes",
    description:
      "Draw points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines. Identify these in two-dimensional figures.",
    gradeLevel: GradeLevel.G4,
    domain: KnowledgeDomain.GEOMETRY,
    difficulty: 5,
    prerequisiteCodes: ["3.G.1"],
  },

  // ─── Grade 5 Operations & Algebraic Thinking (5.OA) ───
  {
    nodeCode: "5.OA.1",
    title: "Use Grouping Symbols in Expressions",
    description:
      "Use parentheses, brackets, or braces in numerical expressions, and evaluate expressions with these symbols.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["4.OA.3"],
  },
  {
    nodeCode: "5.OA.2",
    title: "Write and Interpret Numerical Expressions",
    description:
      "Write simple expressions that record calculations with numbers, and interpret numerical expressions without evaluating them.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["5.OA.1"],
  },
  {
    nodeCode: "5.OA.3",
    title: "Generate and Analyze Patterns",
    description:
      "Generate two numerical patterns using two given rules. Identify apparent relationships between corresponding terms. Form ordered pairs and graph on a coordinate plane.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["3.OA.9"],
  },

  // ─── Grade 5 Number & Operations in Base Ten (5.NBT) ───
  {
    nodeCode: "5.NBT.1",
    title: "Understand the Place Value System",
    description:
      "Recognize that in a multi-digit number, a digit in one place represents 10 times as much as it represents in the place to its right and 1/10 of what it represents in the place to its left.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 6,
    prerequisiteCodes: ["4.NBT.1"],
  },
  {
    nodeCode: "5.NBT.2",
    title: "Explain Powers of 10 Patterns",
    description:
      "Explain patterns in the number of zeros of the product when multiplying a number by powers of 10, and explain patterns in the placement of the decimal point.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 6,
    prerequisiteCodes: ["5.NBT.1"],
  },
  {
    nodeCode: "5.NBT.3",
    title: "Read, Write, and Compare Decimals",
    description:
      "Read, write, and compare decimals to thousandths using base-ten numerals, number names, and expanded form. Compare two decimals to thousandths using >, =, and <.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.COUNTING,
    difficulty: 6,
    prerequisiteCodes: ["5.NBT.2"],
  },
  {
    nodeCode: "5.NBT.5",
    title: "Fluently Multiply Multi-Digit Whole Numbers",
    description:
      "Fluently multiply multi-digit whole numbers using the standard algorithm.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 6,
    prerequisiteCodes: ["4.NBT.5"],
  },
  {
    nodeCode: "5.NBT.6",
    title: "Divide Multi-Digit Numbers",
    description:
      "Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors, using strategies based on place value and the relationship between multiplication and division.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["4.NBT.6", "5.NBT.5"],
  },
  {
    nodeCode: "5.NBT.7",
    title: "Add, Subtract, Multiply, and Divide Decimals",
    description:
      "Add, subtract, multiply, and divide decimals to hundredths, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between operations.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["5.NBT.3", "5.NBT.5"],
  },

  // ─── Grade 5 Number & Operations — Fractions (5.NF) ───
  {
    nodeCode: "5.NF.1",
    title: "Add and Subtract Fractions (Unlike Denominators)",
    description:
      "Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions producing a common denominator.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["4.NF.3", "4.NF.1"],
  },
  {
    nodeCode: "5.NF.2",
    title: "Fraction Addition/Subtraction Word Problems",
    description:
      "Solve word problems involving addition and subtraction of fractions referring to the same whole, including cases of unlike denominators.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["5.NF.1"],
  },
  {
    nodeCode: "5.NF.3",
    title: "Interpret Fractions as Division",
    description:
      "Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b). Solve word problems involving division of whole numbers leading to answers in the form of fractions or mixed numbers.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 7,
    prerequisiteCodes: ["5.NF.1", "5.NBT.6"],
  },
  {
    nodeCode: "5.NF.4",
    title: "Multiply Fractions",
    description:
      "Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction. Find the area of a rectangle with fractional side lengths.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 8,
    prerequisiteCodes: ["4.NF.4", "5.NF.1"],
  },
  {
    nodeCode: "5.NF.6",
    title: "Real-World Fraction Multiplication Problems",
    description:
      "Solve real-world problems involving multiplication of fractions and mixed numbers using visual fraction models or equations.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.OPERATIONS,
    difficulty: 8,
    prerequisiteCodes: ["5.NF.4"],
  },

  // ─── Grade 5 Measurement & Data (5.MD) ───
  {
    nodeCode: "5.MD.1",
    title: "Convert Measurement Units",
    description:
      "Convert among different-sized standard measurement units within a given measurement system, and use these conversions in solving multi-step real-world problems.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 6,
    prerequisiteCodes: ["5.NBT.7"],
  },
  {
    nodeCode: "5.MD.3",
    title: "Understand Volume Concepts",
    description:
      "Recognize volume as an attribute of solid figures and understand concepts of volume measurement. A cube with side length 1 unit has 'one cubic unit' of volume.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.MEASUREMENT,
    difficulty: 7,
    prerequisiteCodes: ["5.NBT.5", "4.MD.3"],
  },

  // ─── Grade 5 Geometry (5.G) ───
  {
    nodeCode: "5.G.1",
    title: "Graph Points on a Coordinate Plane",
    description:
      "Use a pair of perpendicular number lines (axes) to define a coordinate system. Graph points in the first quadrant of the coordinate plane and interpret coordinate values in context.",
    gradeLevel: GradeLevel.G5,
    domain: KnowledgeDomain.GEOMETRY,
    difficulty: 6,
    prerequisiteCodes: ["5.OA.3"],
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

  // ─── Teacher Dashboard Seed Data ───

  // Create a demo school
  const demoSchool = await prisma.school.upsert({
    where: { id: "demo-school-1" },
    update: {},
    create: {
      id: "demo-school-1",
      name: "Demo Elementary School",
      district: "Demo Unified School District",
    },
  });
  console.log(`  Created demo school: ${demoSchool.name}`);

  // Create a demo teacher user
  const demoTeacher = await prisma.user.upsert({
    where: { email: "teacher@test.com" },
    update: { role: "TEACHER" },
    create: {
      email: "teacher@test.com",
      passwordHash: "PLACEHOLDER_HASH_USE_AUTH0",
      role: "TEACHER",
    },
  });
  console.log(`  Created demo teacher user: ${demoTeacher.email}`);

  // Create teacher profile
  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: demoTeacher.id },
    update: { schoolId: demoSchool.id },
    create: {
      userId: demoTeacher.id,
      schoolId: demoSchool.id,
    },
  });
  console.log(`  Created teacher profile: ${teacherProfile.id}`);

  // Create a demo class
  const demoClass = await prisma.class.upsert({
    where: { id: "demo-class-1" },
    update: {},
    create: {
      id: "demo-class-1",
      name: "Grade 1 - Section A",
      gradeLevel: "G1",
      teacherId: teacherProfile.id,
    },
  });
  console.log(`  Created demo class: ${demoClass.name}`);

  // Create a second class
  const demoClass2 = await prisma.class.upsert({
    where: { id: "demo-class-2" },
    update: {},
    create: {
      id: "demo-class-2",
      name: "Kindergarten - Section B",
      gradeLevel: "K",
      teacherId: teacherProfile.id,
    },
  });
  console.log(`  Created demo class: ${demoClass2.name}`);

  // Create additional demo students for the teacher's classes
  const student2 = await prisma.student.upsert({
    where: { id: "demo-student-2" },
    update: {},
    create: {
      id: "demo-student-2",
      displayName: "Aarav",
      avatarPersonaId: "zara",
      gradeLevel: "G1",
      ageGroup: "EARLY_5_7",
      parentId: demoParent.id,
    },
  });

  const student3 = await prisma.student.upsert({
    where: { id: "demo-student-3" },
    update: {},
    create: {
      id: "demo-student-3",
      displayName: "Maya",
      avatarPersonaId: "pip",
      gradeLevel: "G1",
      ageGroup: "EARLY_5_7",
      parentId: demoParent.id,
    },
  });

  const student4 = await prisma.student.upsert({
    where: { id: "demo-student-4" },
    update: {},
    create: {
      id: "demo-student-4",
      displayName: "Kai",
      avatarPersonaId: "koda",
      gradeLevel: "K",
      ageGroup: "EARLY_5_7",
      parentId: demoParent.id,
    },
  });
  console.log("  Created additional demo students: Aarav, Maya, Kai");

  // Create streak data for new students
  for (const s of [student2, student3, student4]) {
    await prisma.streakData.upsert({
      where: { studentId: s.id },
      update: {},
      create: {
        studentId: s.id,
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
      },
    });
  }

  // Enroll students in classes
  // Sofia + Aarav + Maya in Grade 1 - Section A
  for (const sid of [demoStudent.id, student2.id, student3.id]) {
    await prisma.classStudent.upsert({
      where: {
        classId_studentId: { classId: demoClass.id, studentId: sid },
      },
      update: {},
      create: {
        classId: demoClass.id,
        studentId: sid,
      },
    });
  }
  console.log("  Enrolled Sofia, Aarav, Maya in Grade 1 - Section A");

  // Kai in Kindergarten - Section B
  await prisma.classStudent.upsert({
    where: {
      classId_studentId: { classId: demoClass2.id, studentId: student4.id },
    },
    update: {},
    create: {
      classId: demoClass2.id,
      studentId: student4.id,
    },
  });
  console.log("  Enrolled Kai in Kindergarten - Section B");

  // Create a demo assignment
  const g1Nodes = await prisma.knowledgeNode.findMany({
    where: { gradeLevel: "G1", domain: "OPERATIONS" },
    take: 3,
  });

  if (g1Nodes.length > 0) {
    await prisma.assignment.upsert({
      where: { id: "demo-assignment-1" },
      update: {},
      create: {
        id: "demo-assignment-1",
        classId: demoClass.id,
        title: "Addition and Subtraction Basics",
        description:
          "Practice addition and subtraction word problems within 20.",
        nodeIds: g1Nodes.map((n) => n.id),
        status: "ASSIGNMENT_ACTIVE",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      },
    });
    console.log("  Created demo assignment: Addition and Subtraction Basics");
  }

  // ─── Learning GPS Demo Seed Data ───
  console.log("\n  Seeding Learning GPS demo data...");

  // Create GPS demo student: Ishan (Grade 5, active learning plan)
  const ishanStudent = await prisma.student.upsert({
    where: { id: "demo-student-ishan" },
    update: { gradeLevel: "G5", ageGroup: "MID_8_10" },
    create: {
      id: "demo-student-ishan",
      displayName: "Ishan",
      avatarPersonaId: "cosmo",
      gradeLevel: "G5",
      ageGroup: "MID_8_10",
      parentId: demoParent.id,
    },
  });
  console.log(`  Created GPS demo student: ${ishanStudent.displayName} (G5)`);

  // Create streak data for Ishan
  await prisma.streakData.upsert({
    where: { studentId: ishanStudent.id },
    update: { currentStreak: 5, longestStreak: 12, totalDaysActive: 15 },
    create: {
      studentId: ishanStudent.id,
      currentStreak: 5,
      longestStreak: 12,
      totalDaysActive: 15,
    },
  });

  // Enroll Ishan in the teacher's Grade 1 class for teacher visibility
  await prisma.classStudent.upsert({
    where: {
      classId_studentId: { classId: demoClass.id, studentId: ishanStudent.id },
    },
    update: {},
    create: {
      classId: demoClass.id,
      studentId: ishanStudent.id,
    },
  });

  // Find G5 math nodes to build the plan's concept sequence
  const g5MathNodes = await prisma.knowledgeNode.findMany({
    where: { gradeLevel: "G5", subject: "MATH" },
    orderBy: { difficulty: "asc" },
  });

  // Also include prerequisite nodes from lower grades (a realistic plan)
  const g4MathNodes = await prisma.knowledgeNode.findMany({
    where: { gradeLevel: "G4", subject: "MATH" },
    orderBy: { difficulty: "asc" },
    take: 5,
  });

  const planNodeCodes = [
    ...g4MathNodes.map((n) => n.nodeCode),
    ...g5MathNodes.map((n) => n.nodeCode),
  ];

  if (planNodeCodes.length > 0) {
    // Create or find a Grade 5 Math goal
    const g5Goal = await prisma.learningGoal.upsert({
      where: { id: "demo-goal-g5-math" },
      update: {},
      create: {
        id: "demo-goal-g5-math",
        name: "Grade 5 Math Proficiency",
        category: "GRADE_PROFICIENCY",
        description: "Master all Grade 5 Common Core Math standards",
        requiredNodeIds: planNodeCodes,
        gradeLevel: 5,
        estimatedHours: planNodeCodes.length * 0.85,
      },
    });

    // Calculate index for ~34% progress
    const totalConcepts = planNodeCodes.length;
    const currentIndex = Math.round(totalConcepts * 0.34);
    const hoursCompleted = currentIndex * 0.8; // ~0.8 hours per concept on average

    // Target date: 6 weeks from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 42);

    // Projected completion: 5 weeks from now (slightly ahead)
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + 35);

    // Create the active learning plan
    const ishanPlan = await prisma.learningPlan.upsert({
      where: { id: "demo-plan-ishan-g5-math" },
      update: {
        currentConceptIndex: currentIndex,
        hoursCompleted,
        projectedCompletionDate: projectedDate,
        isAheadOfSchedule: true,
        lastRecalculatedAt: new Date(),
      },
      create: {
        id: "demo-plan-ishan-g5-math",
        studentId: ishanStudent.id,
        goalId: g5Goal.id,
        status: "ACTIVE",
        conceptSequence: planNodeCodes,
        totalEstimatedHours: totalConcepts * 0.85,
        hoursCompleted,
        projectedCompletionDate: projectedDate,
        targetCompletionDate: targetDate,
        weeklyMilestones: [],
        currentConceptIndex: currentIndex,
        velocityHoursPerWeek: 3.5,
        isAheadOfSchedule: true,
        lastRecalculatedAt: new Date(),
      },
    });
    console.log(
      `  Created GPS plan: ${g5Goal.name} — ${currentIndex}/${totalConcepts} concepts (${Math.round((currentIndex / totalConcepts) * 100)}%)`
    );

    // Create mastery scores for completed concepts (simulating progress)
    const completedNodes = planNodeCodes.slice(0, currentIndex);
    const allPlanNodes = await prisma.knowledgeNode.findMany({
      where: { nodeCode: { in: completedNodes } },
    });

    for (const node of allPlanNodes) {
      // Mastered concepts: high BKT, MASTERED or ADVANCED level
      const bkt = 0.85 + Math.random() * 0.14; // 0.85-0.99
      const level = bkt >= 0.9 ? "MASTERED" : "ADVANCED";

      await prisma.masteryScore.upsert({
        where: {
          studentId_nodeId: { studentId: ishanStudent.id, nodeId: node.id },
        },
        update: {
          bktProbability: Math.round(bkt * 100) / 100,
          level: level as any,
          practiceCount: Math.floor(Math.random() * 8) + 5,
          correctCount: Math.floor(Math.random() * 6) + 4,
          lastPracticed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          studentId: ishanStudent.id,
          nodeId: node.id,
          bktProbability: Math.round(bkt * 100) / 100,
          level: level as any,
          practiceCount: Math.floor(Math.random() * 8) + 5,
          correctCount: Math.floor(Math.random() * 6) + 4,
          lastPracticed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`  Created ${allPlanNodes.length} mastery scores for completed concepts`);

    // Create an ETA snapshot (history)
    await prisma.eTASnapshot.create({
      data: {
        planId: ishanPlan.id,
        conceptsRemaining: totalConcepts - currentIndex,
        conceptsMastered: currentIndex,
        hoursRemaining: (totalConcepts - currentIndex) * 0.85,
        velocityAtSnapshot: 3.5,
        projectedCompletion: projectedDate,
        isAheadOfSchedule: true,
        daysDifference: 7, // 7 days ahead
        insight: "You're 1 week ahead of schedule — great momentum!",
      },
    });
    console.log("  Created ETA snapshot for GPS plan");

    // Create a completed milestone (week 2 passed)
    // Delete existing first (no compound unique), then create
    await prisma.milestoneResult.deleteMany({
      where: { planId: ishanPlan.id, weekNumber: 2 },
    });
    await prisma.milestoneResult.create({
      data: {
        planId: ishanPlan.id,
        weekNumber: 2,
        passed: true,
        score: 0.88, // Stored as 0-1
        conceptsTested: completedNodes.slice(0, 4),
      },
    });
    console.log("  Created milestone result: Week 2 passed (88%)");

    // Create a few demo learning sessions linked to the plan
    const recentSessions = [
      { daysAgo: 0, questions: 12, correct: 10, duration: 900 },
      { daysAgo: 1, questions: 15, correct: 13, duration: 1100 },
      { daysAgo: 3, questions: 10, correct: 8, duration: 750 },
    ];

    for (const sess of recentSessions) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - sess.daysAgo);

      const nodeIdx = Math.min(currentIndex - 1, g5MathNodes.length - 1);
      const sessionNode = g5MathNodes[Math.max(0, nodeIdx)];

      if (sessionNode) {
        await prisma.learningSession.create({
          data: {
            studentId: ishanStudent.id,
            state: "COMPLETED",
            currentNodeId: sessionNode.id,
            subject: "MATH",
            planId: ishanPlan.id,
            questionsAnswered: sess.questions,
            correctAnswers: sess.correct,
            durationSeconds: sess.duration,
            startedAt: sessionDate,
            endedAt: new Date(sessionDate.getTime() + sess.duration * 1000),
          },
        });
      }
    }
    console.log("  Created 3 recent learning sessions for GPS demo");
  } else {
    console.log("  ⚠ No G5 math nodes found — run standards seed first for full GPS demo");
  }

  // Create additional demo students with varied progress for teacher GPS view
  const gpsStudents = [
    { id: "demo-student-5", name: "Zara", grade: "G3", persona: "zara", progress: 0.6 },
    { id: "demo-student-6", name: "Ethan", grade: "G4", persona: "nova", progress: 0.15 },
    { id: "demo-student-7", name: "Lila", grade: "G2", persona: "pip", progress: 0.85 },
    { id: "demo-student-8", name: "Noah", grade: "G5", persona: "koda", progress: 0.45 },
  ];

  for (const s of gpsStudents) {
    const student = await prisma.student.upsert({
      where: { id: s.id },
      update: { gradeLevel: s.grade as any },
      create: {
        id: s.id,
        displayName: s.name,
        avatarPersonaId: s.persona,
        gradeLevel: s.grade as any,
        ageGroup: "MID_8_10",
        parentId: demoParent.id,
      },
    });

    await prisma.streakData.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        currentStreak: Math.floor(Math.random() * 10),
        longestStreak: Math.floor(Math.random() * 20),
        totalDaysActive: Math.floor(Math.random() * 30),
      },
    });

    // Enroll in teacher's class
    await prisma.classStudent.upsert({
      where: {
        classId_studentId: { classId: demoClass.id, studentId: student.id },
      },
      update: {},
      create: {
        classId: demoClass.id,
        studentId: student.id,
      },
    });
  }
  console.log("  Created 4 additional GPS demo students: Zara, Ethan, Lila, Noah");

  console.log("\n  ✅ Learning GPS seed data complete!");
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
