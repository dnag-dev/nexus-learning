/**
 * Seed: Math Knowledge Nodes G6-G12
 *
 * ~80 nodes covering middle school through high school math:
 * G6: Ratios, Proportions, Number System
 * G7: Proportional Relationships, Expressions & Equations, Geometry
 * G8: Linear Equations, Functions, Pythagorean Theorem, Transformations
 * G9-G10: Algebra I & II (equations, inequalities, quadratics, polynomials)
 * G11-G12: Pre-Calculus, Trigonometry, Calculus Prep
 *
 * Prerequisite chains connect back to existing G5 nodes where applicable.
 */

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
  subject: "MATH";
}

const mathNodes: NodeSeed[] = [
  // ═══ Grade 6 ═══

  // Ratios & Proportional Relationships
  {
    nodeCode: "6.RP.1",
    title: "Understand Ratios",
    description: "Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.RATIOS, difficulty: 2, prerequisiteCodes: ["5.NF.2"], subject: "MATH",
  },
  {
    nodeCode: "6.RP.2",
    title: "Unit Rates",
    description: "Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠ 0.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.RATIOS, difficulty: 3, prerequisiteCodes: ["6.RP.1"], subject: "MATH",
  },
  {
    nodeCode: "6.RP.3",
    title: "Solve Ratio and Rate Problems",
    description: "Use ratio and rate reasoning to solve real-world and mathematical problems, e.g., using tables, tape diagrams, double number lines.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.RATIOS, difficulty: 3, prerequisiteCodes: ["6.RP.2"], subject: "MATH",
  },

  // The Number System
  {
    nodeCode: "6.NS.1",
    title: "Divide Fractions by Fractions",
    description: "Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["5.NF.2"], subject: "MATH",
  },
  {
    nodeCode: "6.NS.5",
    title: "Understand Positive and Negative Numbers",
    description: "Understand that positive and negative numbers are used together to describe quantities having opposite directions or values.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 2, prerequisiteCodes: ["5.NBT.1"], subject: "MATH",
  },
  {
    nodeCode: "6.NS.6",
    title: "Rational Numbers on the Number Line",
    description: "Understand a rational number as a point on the number line. Use number lines and coordinate axes.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["6.NS.5"], subject: "MATH",
  },
  {
    nodeCode: "6.NS.7",
    title: "Order and Absolute Value of Rational Numbers",
    description: "Understand ordering and absolute value of rational numbers.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["6.NS.6"], subject: "MATH",
  },

  // Expressions & Equations
  {
    nodeCode: "6.EE.1",
    title: "Write and Evaluate Numerical Expressions with Exponents",
    description: "Write and evaluate numerical expressions involving whole-number exponents.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.EXPRESSIONS, difficulty: 2, prerequisiteCodes: ["5.OA.1"], subject: "MATH",
  },
  {
    nodeCode: "6.EE.2",
    title: "Read, Write, and Evaluate Expressions with Variables",
    description: "Write, read, and evaluate expressions in which letters stand for numbers.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.EXPRESSIONS, difficulty: 3, prerequisiteCodes: ["6.EE.1"], subject: "MATH",
  },
  {
    nodeCode: "6.EE.5",
    title: "Solve One-Step Equations",
    description: "Understand solving an equation or inequality as a process of answering a question.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.EQUATIONS, difficulty: 3, prerequisiteCodes: ["6.EE.2"], subject: "MATH",
  },
  {
    nodeCode: "6.EE.7",
    title: "Solve Real-World Equations",
    description: "Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.EQUATIONS, difficulty: 4, prerequisiteCodes: ["6.EE.5"], subject: "MATH",
  },

  // Geometry & Statistics
  {
    nodeCode: "6.G.1",
    title: "Area of Polygons",
    description: "Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.GEOMETRY, difficulty: 3, prerequisiteCodes: ["5.G.1"], subject: "MATH",
  },
  {
    nodeCode: "6.SP.1",
    title: "Recognize Statistical Questions",
    description: "Recognize a statistical question as one that anticipates variability in the data related to the question.",
    gradeLevel: GradeLevel.G6, domain: KnowledgeDomain.STATISTICS, difficulty: 2, prerequisiteCodes: ["5.MD.2"], subject: "MATH",
  },

  // ═══ Grade 7 ═══

  {
    nodeCode: "7.RP.1",
    title: "Compute Unit Rates with Fractions",
    description: "Compute unit rates associated with ratios of fractions, including ratios of lengths, areas, and other quantities.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.RATIOS, difficulty: 3, prerequisiteCodes: ["6.RP.3"], subject: "MATH",
  },
  {
    nodeCode: "7.RP.2",
    title: "Recognize Proportional Relationships",
    description: "Recognize and represent proportional relationships between quantities.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.RATIOS, difficulty: 3, prerequisiteCodes: ["7.RP.1"], subject: "MATH",
  },
  {
    nodeCode: "7.RP.3",
    title: "Percentages and Proportional Reasoning",
    description: "Use proportional relationships to solve multistep ratio and percent problems.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.RATIOS, difficulty: 4, prerequisiteCodes: ["7.RP.2"], subject: "MATH",
  },
  {
    nodeCode: "7.NS.1",
    title: "Add and Subtract Rational Numbers",
    description: "Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["6.NS.7"], subject: "MATH",
  },
  {
    nodeCode: "7.NS.2",
    title: "Multiply and Divide Rational Numbers",
    description: "Apply and extend previous understandings of multiplication and division to multiply and divide rational numbers.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["7.NS.1"], subject: "MATH",
  },
  {
    nodeCode: "7.EE.1",
    title: "Apply Properties of Operations to Expressions",
    description: "Apply properties of operations as strategies to add, subtract, factor, and expand linear expressions.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.EXPRESSIONS, difficulty: 3, prerequisiteCodes: ["6.EE.2"], subject: "MATH",
  },
  {
    nodeCode: "7.EE.4",
    title: "Solve Two-Step Equations and Inequalities",
    description: "Use variables to represent quantities and construct simple equations and inequalities to solve problems.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.EQUATIONS, difficulty: 4, prerequisiteCodes: ["7.EE.1", "6.EE.7"], subject: "MATH",
  },
  {
    nodeCode: "7.G.4",
    title: "Circles: Area and Circumference",
    description: "Know the formulas for the area and circumference of a circle and use them to solve problems.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.GEOMETRY, difficulty: 3, prerequisiteCodes: ["6.G.1"], subject: "MATH",
  },
  {
    nodeCode: "7.G.6",
    title: "Surface Area and Volume",
    description: "Solve real-world and mathematical problems involving area, volume and surface area of two- and three-dimensional objects.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.GEOMETRY, difficulty: 4, prerequisiteCodes: ["7.G.4"], subject: "MATH",
  },
  {
    nodeCode: "7.SP.1",
    title: "Random Sampling and Inferences",
    description: "Understand that statistics can be used to gain information about a population by examining a sample.",
    gradeLevel: GradeLevel.G7, domain: KnowledgeDomain.STATISTICS, difficulty: 3, prerequisiteCodes: ["6.SP.1"], subject: "MATH",
  },

  // ═══ Grade 8 ═══

  {
    nodeCode: "8.NS.1",
    title: "Irrational Numbers",
    description: "Know that numbers that are not rational are called irrational. Understand informally that every number has a decimal expansion.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 3, prerequisiteCodes: ["7.NS.2"], subject: "MATH",
  },
  {
    nodeCode: "8.EE.1",
    title: "Properties of Integer Exponents",
    description: "Know and apply the properties of integer exponents to generate equivalent numerical expressions.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.EXPRESSIONS, difficulty: 3, prerequisiteCodes: ["6.EE.1"], subject: "MATH",
  },
  {
    nodeCode: "8.EE.5",
    title: "Graph Proportional Relationships (Slope)",
    description: "Graph proportional relationships, interpreting the unit rate as the slope of the graph.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.EQUATIONS, difficulty: 3, prerequisiteCodes: ["7.RP.2"], subject: "MATH",
  },
  {
    nodeCode: "8.EE.7",
    title: "Solve Linear Equations in One Variable",
    description: "Solve linear equations in one variable, including equations with rational number coefficients.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.EQUATIONS, difficulty: 4, prerequisiteCodes: ["7.EE.4", "8.EE.1"], subject: "MATH",
  },
  {
    nodeCode: "8.EE.8",
    title: "Systems of Two Linear Equations",
    description: "Analyze and solve pairs of simultaneous linear equations.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.EQUATIONS, difficulty: 4, prerequisiteCodes: ["8.EE.7"], subject: "MATH",
  },
  {
    nodeCode: "8.F.1",
    title: "Understand Functions",
    description: "Understand that a function is a rule that assigns to each input exactly one output.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.FUNCTIONS, difficulty: 3, prerequisiteCodes: ["8.EE.5"], subject: "MATH",
  },
  {
    nodeCode: "8.F.2",
    title: "Compare Functions Represented Differently",
    description: "Compare properties of two functions each represented in a different way (algebraically, graphically, numerically, verbally).",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["8.F.1"], subject: "MATH",
  },
  {
    nodeCode: "8.F.4",
    title: "Model Linear Relationships",
    description: "Construct a function to model a linear relationship between two quantities. Determine the rate of change and initial value.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["8.F.2"], subject: "MATH",
  },
  {
    nodeCode: "8.G.1",
    title: "Transformations: Translations, Rotations, Reflections",
    description: "Verify experimentally the properties of rotations, reflections, and translations.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.GEOMETRY, difficulty: 3, prerequisiteCodes: ["7.G.6"], subject: "MATH",
  },
  {
    nodeCode: "8.G.6",
    title: "Pythagorean Theorem",
    description: "Explain a proof of the Pythagorean Theorem and its converse.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.GEOMETRY, difficulty: 4, prerequisiteCodes: ["8.G.1"], subject: "MATH",
  },
  {
    nodeCode: "8.G.7",
    title: "Apply the Pythagorean Theorem",
    description: "Apply the Pythagorean Theorem to determine unknown side lengths in right triangles in real-world and mathematical problems.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.GEOMETRY, difficulty: 4, prerequisiteCodes: ["8.G.6"], subject: "MATH",
  },
  {
    nodeCode: "8.SP.1",
    title: "Scatter Plots and Association",
    description: "Construct and interpret scatter plots for bivariate measurement data to investigate patterns of association.",
    gradeLevel: GradeLevel.G8, domain: KnowledgeDomain.STATISTICS, difficulty: 3, prerequisiteCodes: ["7.SP.1"], subject: "MATH",
  },

  // ═══ Grade 9 (Algebra I) ═══

  {
    nodeCode: "HSA.REI.1",
    title: "Explain Equation Solving Steps",
    description: "Explain each step in solving a simple equation as following from the equality of numbers asserted at the previous step.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 3, prerequisiteCodes: ["8.EE.7"], subject: "MATH",
  },
  {
    nodeCode: "HSA.REI.3",
    title: "Solve Linear Equations and Inequalities",
    description: "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 3, prerequisiteCodes: ["HSA.REI.1"], subject: "MATH",
  },
  {
    nodeCode: "HSA.REI.6",
    title: "Solve Systems of Linear Equations",
    description: "Solve systems of linear equations exactly and approximately, focusing on pairs of linear equations in two variables.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 4, prerequisiteCodes: ["8.EE.8", "HSA.REI.3"], subject: "MATH",
  },
  {
    nodeCode: "HSA.SSE.1",
    title: "Interpret Algebraic Expressions",
    description: "Interpret expressions that represent a quantity in terms of its context.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 3, prerequisiteCodes: ["8.EE.1"], subject: "MATH",
  },
  {
    nodeCode: "HSA.SSE.2",
    title: "Use Structure to Rewrite Expressions",
    description: "Use the structure of an expression to identify ways to rewrite it.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 4, prerequisiteCodes: ["HSA.SSE.1"], subject: "MATH",
  },
  {
    nodeCode: "HSA.APR.1",
    title: "Polynomial Arithmetic",
    description: "Understand that polynomials form a system analogous to the integers. Perform arithmetic operations on polynomials.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 4, prerequisiteCodes: ["HSA.SSE.2"], subject: "MATH",
  },
  {
    nodeCode: "HSA.CED.1",
    title: "Create Equations in One Variable",
    description: "Create equations and inequalities in one variable and use them to solve problems.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.ALGEBRA, difficulty: 3, prerequisiteCodes: ["HSA.REI.3"], subject: "MATH",
  },
  {
    nodeCode: "HSF.IF.1",
    title: "Understand Function Notation",
    description: "Understand that a function from one set to another set assigns to each element of the domain exactly one element of the range. Use function notation.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.FUNCTIONS, difficulty: 3, prerequisiteCodes: ["8.F.1"], subject: "MATH",
  },
  {
    nodeCode: "HSF.IF.4",
    title: "Interpret Key Features of Functions",
    description: "For a function that models a relationship between two quantities, interpret key features of graphs and tables.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.IF.1", "8.F.4"], subject: "MATH",
  },
  {
    nodeCode: "HSF.BF.1",
    title: "Write Functions from Context",
    description: "Write a function that describes a relationship between two quantities.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.IF.4"], subject: "MATH",
  },
  {
    nodeCode: "HSF.LE.1",
    title: "Linear vs. Exponential Models",
    description: "Distinguish between situations that can be modeled with linear functions and with exponential functions.",
    gradeLevel: GradeLevel.G9, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.BF.1"], subject: "MATH",
  },

  // ═══ Grade 10 (Geometry / Algebra II) ═══

  {
    nodeCode: "HSG.CO.1",
    title: "Geometric Definitions (Point, Line, Angle)",
    description: "Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.GEOMETRY, difficulty: 2, prerequisiteCodes: ["8.G.1"], subject: "MATH",
  },
  {
    nodeCode: "HSG.CO.6",
    title: "Rigid Motions and Congruence",
    description: "Use geometric descriptions of rigid motions to transform figures and predict the effect of a given rigid motion.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.GEOMETRY, difficulty: 3, prerequisiteCodes: ["HSG.CO.1"], subject: "MATH",
  },
  {
    nodeCode: "HSG.SRT.1",
    title: "Similarity Transformations",
    description: "Verify experimentally the properties of dilations given by a center and a scale factor.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.GEOMETRY, difficulty: 3, prerequisiteCodes: ["HSG.CO.6"], subject: "MATH",
  },
  {
    nodeCode: "HSG.SRT.6",
    title: "Trigonometric Ratios",
    description: "Understand that by similarity, side ratios in right triangles are properties of the angles, leading to definitions of trigonometric ratios.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.TRIGONOMETRY, difficulty: 4, prerequisiteCodes: ["HSG.SRT.1", "8.G.7"], subject: "MATH",
  },
  {
    nodeCode: "HSG.SRT.8",
    title: "Apply Trigonometry to Solve Problems",
    description: "Use trigonometric ratios and the Pythagorean Theorem to solve right triangles in applied problems.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.TRIGONOMETRY, difficulty: 4, prerequisiteCodes: ["HSG.SRT.6"], subject: "MATH",
  },
  {
    nodeCode: "HSA.REI.4",
    title: "Solve Quadratic Equations",
    description: "Solve quadratic equations in one variable using factoring, completing the square, or the quadratic formula.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.ALGEBRA, difficulty: 4, prerequisiteCodes: ["HSA.APR.1", "HSA.REI.3"], subject: "MATH",
  },
  {
    nodeCode: "HSA.REI.7",
    title: "Solve Systems with Nonlinear Equations",
    description: "Solve a simple system consisting of a linear equation and a quadratic equation in two variables.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.ALGEBRA, difficulty: 5, prerequisiteCodes: ["HSA.REI.4", "HSA.REI.6"], subject: "MATH",
  },
  {
    nodeCode: "HSF.IF.7",
    title: "Graph Functions (Linear, Quadratic, Polynomial)",
    description: "Graph functions expressed symbolically and show key features of the graph.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.IF.4", "HSA.REI.4"], subject: "MATH",
  },
  {
    nodeCode: "HSS.ID.6",
    title: "Fit Functions to Data",
    description: "Represent data on two quantitative variables on a scatter plot, and describe how the variables are related. Fit a function to data.",
    gradeLevel: GradeLevel.G10, domain: KnowledgeDomain.STATISTICS, difficulty: 4, prerequisiteCodes: ["8.SP.1", "HSF.LE.1"], subject: "MATH",
  },

  // ═══ Grade 11 (Pre-Calculus) ═══

  {
    nodeCode: "HSF.TF.1",
    title: "Radian Measure and the Unit Circle",
    description: "Understand radian measure of an angle as the length of the arc on the unit circle subtended by the angle.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.TRIGONOMETRY, difficulty: 4, prerequisiteCodes: ["HSG.SRT.8"], subject: "MATH",
  },
  {
    nodeCode: "HSF.TF.2",
    title: "Unit Circle and Trigonometric Functions",
    description: "Explain how the unit circle in the coordinate plane enables the extension of trigonometric functions to all real numbers.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.TRIGONOMETRY, difficulty: 4, prerequisiteCodes: ["HSF.TF.1"], subject: "MATH",
  },
  {
    nodeCode: "HSF.TF.5",
    title: "Model Periodic Phenomena with Trig Functions",
    description: "Choose trigonometric functions to model periodic phenomena with specified amplitude, frequency, and midline.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.TRIGONOMETRY, difficulty: 5, prerequisiteCodes: ["HSF.TF.2"], subject: "MATH",
  },
  {
    nodeCode: "HSF.BF.3",
    title: "Identify Effect of Transformations on Functions",
    description: "Identify the effect on the graph of replacing f(x) by f(x) + k, k f(x), f(kx), and f(x + k).",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.IF.7"], subject: "MATH",
  },
  {
    nodeCode: "HSF.BF.4",
    title: "Find Inverse Functions",
    description: "Find inverse functions. Solve an equation of the form f(x) = c for a simple function f.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.FUNCTIONS, difficulty: 4, prerequisiteCodes: ["HSF.BF.3"], subject: "MATH",
  },
  {
    nodeCode: "HSN.CN.1",
    title: "Complex Numbers",
    description: "Know there is a complex number i such that i² = −1, and every complex number has the form a + bi.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.NUMBER_SYSTEM, difficulty: 4, prerequisiteCodes: ["HSA.REI.4"], subject: "MATH",
  },
  {
    nodeCode: "HSA.APR.3",
    title: "Identify Zeros of Polynomials",
    description: "Identify zeros of polynomials when suitable factorizations are available, and use the zeros to construct a rough graph.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.ALGEBRA, difficulty: 4, prerequisiteCodes: ["HSA.APR.1", "HSA.REI.4"], subject: "MATH",
  },
  {
    nodeCode: "HSA.APR.6",
    title: "Polynomial Long Division",
    description: "Rewrite simple rational expressions in different forms using polynomial long division.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.ALGEBRA, difficulty: 5, prerequisiteCodes: ["HSA.APR.3"], subject: "MATH",
  },
  {
    nodeCode: "HSF.LE.4",
    title: "Logarithmic Functions",
    description: "For exponential models, express as a logarithm the solution to ab^ct = d where a, c, and d are numbers and the base b is 2, 10, or e.",
    gradeLevel: GradeLevel.G11, domain: KnowledgeDomain.FUNCTIONS, difficulty: 5, prerequisiteCodes: ["HSF.LE.1", "HSF.BF.4"], subject: "MATH",
  },

  // ═══ Grade 12 (Calculus Prep / AP) ═══

  {
    nodeCode: "HSF.LIM.1",
    title: "Understand Limits Intuitively",
    description: "Understand limits of functions intuitively using tables, graphs, and algebraic manipulation.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 4, prerequisiteCodes: ["HSF.BF.3", "HSF.LE.4"], subject: "MATH",
  },
  {
    nodeCode: "HSF.LIM.2",
    title: "Evaluate Limits Algebraically",
    description: "Evaluate limits using algebraic techniques including factoring, rationalizing, and L'Hôpital's rule.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.LIM.1"], subject: "MATH",
  },
  {
    nodeCode: "HSF.DER.1",
    title: "Definition of the Derivative",
    description: "Understand the derivative of a function at a point as the limit of the difference quotient. Interpret as instantaneous rate of change.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.LIM.2"], subject: "MATH",
  },
  {
    nodeCode: "HSF.DER.2",
    title: "Basic Differentiation Rules",
    description: "Apply the power rule, sum/difference rule, product rule, and quotient rule for differentiation.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.DER.1", "HSA.APR.6"], subject: "MATH",
  },
  {
    nodeCode: "HSF.DER.3",
    title: "Chain Rule and Implicit Differentiation",
    description: "Apply the chain rule for composite functions. Use implicit differentiation to find derivatives.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.DER.2", "HSF.TF.5"], subject: "MATH",
  },
  {
    nodeCode: "HSF.INT.1",
    title: "Antiderivatives and Indefinite Integrals",
    description: "Find antiderivatives and indefinite integrals of basic functions using known rules.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.DER.2"], subject: "MATH",
  },
  {
    nodeCode: "HSF.INT.2",
    title: "Definite Integrals and Area Under Curves",
    description: "Evaluate definite integrals using the Fundamental Theorem of Calculus. Compute area under curves.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.CALCULUS, difficulty: 5, prerequisiteCodes: ["HSF.INT.1", "HSF.LIM.2"], subject: "MATH",
  },
  {
    nodeCode: "HSS.IC.1",
    title: "Statistical Inference and Sampling",
    description: "Understand statistics as a process for making inferences about population parameters based on a random sample.",
    gradeLevel: GradeLevel.G12, domain: KnowledgeDomain.STATISTICS, difficulty: 4, prerequisiteCodes: ["HSS.ID.6"], subject: "MATH",
  },
];

async function seedMathG6G12() {
  console.log("📐 Seeding Math G6-G12 nodes...");

  // Create all nodes
  for (const node of mathNodes) {
    await prisma.knowledgeNode.upsert({
      where: { nodeCode: node.nodeCode },
      update: {
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
        subject: node.subject,
      },
      create: {
        nodeCode: node.nodeCode,
        title: node.title,
        description: node.description,
        gradeLevel: node.gradeLevel,
        domain: node.domain,
        difficulty: node.difficulty,
        subject: node.subject,
      },
    });
  }
  console.log(`  ✅ ${mathNodes.length} Math G6-G12 nodes upserted`);

  // Set prerequisites
  let prereqCount = 0;
  for (const node of mathNodes) {
    if (node.prerequisiteCodes.length > 0) {
      // Get prerequisite node IDs
      const prereqNodes = await prisma.knowledgeNode.findMany({
        where: { nodeCode: { in: node.prerequisiteCodes } },
        select: { id: true },
      });

      if (prereqNodes.length > 0) {
        await prisma.knowledgeNode.update({
          where: { nodeCode: node.nodeCode },
          data: { prerequisites: { connect: prereqNodes.map((n) => ({ id: n.id })) } },
        });
        prereqCount += prereqNodes.length;
      }
    }
  }
  console.log(`  ✅ ${prereqCount} prerequisite links created`);
  console.log(`📐 Math G6-G12 seeding complete!`);
}

// Run if executed directly
seedMathG6G12()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export { seedMathG6G12, mathNodes };
