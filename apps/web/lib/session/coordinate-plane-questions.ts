/**
 * Coordinate Plane Question Bank — pre-built interactive questions.
 *
 * These are used as fallback questions when Claude is unavailable, and also
 * serve as the template format for Claude-generated coordinate plane questions.
 *
 * Each question asks the student to plot a point at (correctX, correctY).
 * The tolerance field (default 0.5) determines how close a tap needs to be.
 *
 * Grade progression:
 * - G3-G4: First quadrant only (positive x, positive y), small numbers
 * - G5: First quadrant, larger grid, coordinate interpretation
 * - G6: All four quadrants introduced, integers
 * - G7-G8: All four quadrants, negative coordinates, larger ranges
 */

export interface CoordinatePlaneQuestionData {
  questionText: string;
  questionType: "coordinate_plane";
  correctX: number;
  correctY: number;
  tolerance: number;
  explanation: string;
  gridMin: number;
  gridMax: number;
  /** Grade levels this question is appropriate for */
  gradeLevels: string[];
  /** Math domain this maps to */
  domain: string;
}

// ─── Grade 3-4: First Quadrant, Small Numbers ───

const GRADE_3_4_QUESTIONS: CoordinatePlaneQuestionData[] = [
  {
    questionText: "Plot the point (2, 3) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 2,
    correctY: 3,
    tolerance: 0.6,
    explanation:
      "The point (2, 3) means go 2 steps right along the x-axis and 3 steps up along the y-axis.",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is the point (4, 1)? Tap to place it!",
    questionType: "coordinate_plane",
    correctX: 4,
    correctY: 1,
    tolerance: 0.6,
    explanation:
      "Start at the origin (0, 0). Move 4 steps right, then 1 step up. That's (4, 1)!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (1, 5) on the grid.",
    questionType: "coordinate_plane",
    correctX: 1,
    correctY: 5,
    tolerance: 0.6,
    explanation:
      "For (1, 5): go 1 step right on the x-axis and 5 steps up on the y-axis.",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A treasure is hidden at (3, 4). Tap to find it!",
    questionType: "coordinate_plane",
    correctX: 3,
    correctY: 4,
    tolerance: 0.6,
    explanation:
      "The treasure at (3, 4) is found by going 3 right and 4 up from the origin!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A frog jumped to (5, 2). Where did it land?",
    questionType: "coordinate_plane",
    correctX: 5,
    correctY: 2,
    tolerance: 0.6,
    explanation:
      "The frog at (5, 2) is 5 steps right and 2 steps up from the start!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (2, 5) on the grid.",
    questionType: "coordinate_plane",
    correctX: 2,
    correctY: 5,
    tolerance: 0.6,
    explanation:
      "For (2, 5): go 2 steps right and 5 steps up from the origin!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A cookie is at (4, 4). Tap to grab it!",
    questionType: "coordinate_plane",
    correctX: 4,
    correctY: 4,
    tolerance: 0.6,
    explanation:
      "The cookie at (4, 4) is 4 steps right and 4 steps up!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is (1, 1)? Place it on the grid!",
    questionType: "coordinate_plane",
    correctX: 1,
    correctY: 1,
    tolerance: 0.6,
    explanation:
      "The point (1, 1) is just 1 step right and 1 step up from the origin!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A balloon floated to (3, 6). Where is the balloon?",
    questionType: "coordinate_plane",
    correctX: 3,
    correctY: 6,
    tolerance: 0.6,
    explanation:
      "The balloon at (3, 6) is 3 steps right and 6 steps up — way up high!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (6, 3) on the coordinate grid.",
    questionType: "coordinate_plane",
    correctX: 6,
    correctY: 3,
    tolerance: 0.6,
    explanation:
      "For (6, 3): go 6 steps right along the bottom and 3 steps up!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A star is at (5, 5). Tap where the star is!",
    questionType: "coordinate_plane",
    correctX: 5,
    correctY: 5,
    tolerance: 0.6,
    explanation:
      "The star at (5, 5) is 5 steps right and 5 steps up from the origin!",
    gridMin: 0,
    gridMax: 6,
    gradeLevels: ["G3", "G4"],
    domain: "GEOMETRY",
  },
];

// ─── Grade 5: First Quadrant, Larger Grid ───

const GRADE_5_QUESTIONS: CoordinatePlaneQuestionData[] = [
  {
    questionText: "Plot the point (6, 8) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 6,
    correctY: 8,
    tolerance: 0.5,
    explanation:
      "The ordered pair (6, 8) means x = 6 (horizontal) and y = 8 (vertical).",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText:
      "A bird is sitting at coordinates (3, 7). Where is the bird?",
    questionType: "coordinate_plane",
    correctX: 3,
    correctY: 7,
    tolerance: 0.5,
    explanation:
      "The bird at (3, 7) is found at x = 3 and y = 7 on the coordinate plane.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A park bench is located at (8, 2). Tap to show where it is!",
    questionType: "coordinate_plane",
    correctX: 8,
    correctY: 2,
    tolerance: 0.5,
    explanation:
      "The bench at (8, 2) is 8 units right along the x-axis and 2 units up on the y-axis.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the ordered pair (5, 5) on the grid.",
    questionType: "coordinate_plane",
    correctX: 5,
    correctY: 5,
    tolerance: 0.5,
    explanation:
      "The point (5, 5) is right in the middle — 5 units right and 5 units up.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A cat is hiding at position (1, 9). Find the cat!",
    questionType: "coordinate_plane",
    correctX: 1,
    correctY: 9,
    tolerance: 0.5,
    explanation:
      "The cat at (1, 9) is 1 unit right and 9 units up from the origin.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (9, 4) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 9,
    correctY: 4,
    tolerance: 0.5,
    explanation:
      "For (9, 4): move 9 units right along the x-axis and 4 units up along the y-axis.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A flag is planted at (7, 6). Where is the flag?",
    questionType: "coordinate_plane",
    correctX: 7,
    correctY: 6,
    tolerance: 0.5,
    explanation:
      "The flag at (7, 6) is found by going 7 units right and 6 units up.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (2, 10) on the grid.",
    questionType: "coordinate_plane",
    correctX: 2,
    correctY: 10,
    tolerance: 0.5,
    explanation:
      "The point (2, 10) is 2 units right and all the way up to 10 on the y-axis.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A star is shining at (10, 1). Tap to find the star!",
    questionType: "coordinate_plane",
    correctX: 10,
    correctY: 1,
    tolerance: 0.5,
    explanation:
      "The star at (10, 1) is at the far right of the x-axis and just 1 unit up.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is the point (4, 3)? Place it on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 4,
    correctY: 3,
    tolerance: 0.5,
    explanation:
      "The point (4, 3) means go 4 units right on the x-axis and 3 units up on the y-axis.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A robot is standing at (8, 9). Show where the robot is!",
    questionType: "coordinate_plane",
    correctX: 8,
    correctY: 9,
    tolerance: 0.5,
    explanation:
      "The robot at (8, 9) is 8 units right and 9 units up from the origin.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the ordered pair (0, 6) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 0,
    correctY: 6,
    tolerance: 0.5,
    explanation:
      "The point (0, 6) is right on the y-axis — 0 units right and 6 units up.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A ladybug landed at (7, 0). Where did it land?",
    questionType: "coordinate_plane",
    correctX: 7,
    correctY: 0,
    tolerance: 0.5,
    explanation:
      "The ladybug at (7, 0) is right on the x-axis — 7 units to the right and 0 units up.",
    gridMin: 0,
    gridMax: 10,
    gradeLevels: ["G5"],
    domain: "GEOMETRY",
  },
];

// ─── Grade 6: All Four Quadrants, Integers ───

const GRADE_6_QUESTIONS: CoordinatePlaneQuestionData[] = [
  {
    questionText: "Plot the point (-3, 2) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: -3,
    correctY: 2,
    tolerance: 0.5,
    explanation:
      "The point (-3, 2) is in Quadrant II: 3 units left of the origin (negative x) and 2 units up (positive y).",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is the point (4, -5)? Tap to place it.",
    questionType: "coordinate_plane",
    correctX: 4,
    correctY: -5,
    tolerance: 0.5,
    explanation:
      "The point (4, -5) is in Quadrant IV: 4 units right (positive x) and 5 units down (negative y).",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (-2, -4) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: -2,
    correctY: -4,
    tolerance: 0.5,
    explanation:
      "The point (-2, -4) is in Quadrant III: 2 units left and 4 units down from the origin.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (5, -2) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 5,
    correctY: -2,
    tolerance: 0.5,
    explanation:
      "The point (5, -2) is in Quadrant IV: 5 units right and 2 units down.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A fish is swimming at (-5, -1). Where is the fish?",
    questionType: "coordinate_plane",
    correctX: -5,
    correctY: -1,
    tolerance: 0.5,
    explanation:
      "The fish at (-5, -1) is in Quadrant III: 5 units left and 1 unit down.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (-4, 5) on the grid.",
    questionType: "coordinate_plane",
    correctX: -4,
    correctY: 5,
    tolerance: 0.5,
    explanation:
      "The point (-4, 5) is in Quadrant II: 4 units left and 5 units up.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is (0, -3)? Place it on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 0,
    correctY: -3,
    tolerance: 0.5,
    explanation:
      "The point (0, -3) is on the y-axis, 3 units below the origin.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A rocket launched from (6, -4). Tap the launch site!",
    questionType: "coordinate_plane",
    correctX: 6,
    correctY: -4,
    tolerance: 0.5,
    explanation:
      "The launch site (6, -4) is in Quadrant IV: 6 units right and 4 units down.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the ordered pair (2, -6) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 2,
    correctY: -6,
    tolerance: 0.5,
    explanation:
      "The point (2, -6) is in Quadrant IV: 2 units right and 6 units down.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A spy is hiding at (-6, 3). Find the spy!",
    questionType: "coordinate_plane",
    correctX: -6,
    correctY: 3,
    tolerance: 0.5,
    explanation:
      "The spy at (-6, 3) is in Quadrant II: 6 units left and 3 units up.",
    gridMin: -6,
    gridMax: 6,
    gradeLevels: ["G6"],
    domain: "GEOMETRY",
  },
];

// ─── Grade 7-8: All Four Quadrants, Larger Range ───

const GRADE_7_8_QUESTIONS: CoordinatePlaneQuestionData[] = [
  {
    questionText: "Plot the point (-7, 5) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: -7,
    correctY: 5,
    tolerance: 0.5,
    explanation:
      "The point (-7, 5) is in Quadrant II. Move 7 units left along the x-axis and 5 units up along the y-axis.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText:
      "A submarine is at position (3, -8) on a grid. Plot its location.",
    questionType: "coordinate_plane",
    correctX: 3,
    correctY: -8,
    tolerance: 0.5,
    explanation:
      "The submarine at (3, -8) is in Quadrant IV: 3 units right and 8 units below the origin.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the reflection of (5, 3) across the y-axis.",
    questionType: "coordinate_plane",
    correctX: -5,
    correctY: 3,
    tolerance: 0.5,
    explanation:
      "Reflecting (5, 3) across the y-axis changes the sign of x: (-5, 3). The y-coordinate stays the same.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (-9, -6) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: -9,
    correctY: -6,
    tolerance: 0.5,
    explanation:
      "The point (-9, -6) is in Quadrant III: 9 units left and 6 units down from the origin.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A spaceship is at coordinates (8, -7). Plot its location!",
    questionType: "coordinate_plane",
    correctX: 8,
    correctY: -7,
    tolerance: 0.5,
    explanation:
      "The spaceship at (8, -7) is in Quadrant IV: 8 units right and 7 units down.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the reflection of (4, -6) across the x-axis.",
    questionType: "coordinate_plane",
    correctX: 4,
    correctY: 6,
    tolerance: 0.5,
    explanation:
      "Reflecting (4, -6) across the x-axis changes the sign of y: (4, 6). The x-coordinate stays the same.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Where is the point (-6, 9)? Place it on the grid.",
    questionType: "coordinate_plane",
    correctX: -6,
    correctY: 9,
    tolerance: 0.5,
    explanation:
      "The point (-6, 9) is in Quadrant II: 6 units left and 9 units up.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A drone is hovering at (-4, -9). Tap its position!",
    questionType: "coordinate_plane",
    correctX: -4,
    correctY: -9,
    tolerance: 0.5,
    explanation:
      "The drone at (-4, -9) is in Quadrant III: 4 units left and 9 units down.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the reflection of (-3, 7) across the y-axis.",
    questionType: "coordinate_plane",
    correctX: 3,
    correctY: 7,
    tolerance: 0.5,
    explanation:
      "Reflecting (-3, 7) across the y-axis flips the x-sign: (3, 7).",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "Plot the point (10, -10) on the coordinate plane.",
    questionType: "coordinate_plane",
    correctX: 10,
    correctY: -10,
    tolerance: 0.5,
    explanation:
      "The point (10, -10) is at the far bottom-right corner of the grid.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
  {
    questionText: "A treasure chest sank to (-8, -3). Find it on the map!",
    questionType: "coordinate_plane",
    correctX: -8,
    correctY: -3,
    tolerance: 0.5,
    explanation:
      "The chest at (-8, -3) is in Quadrant III: 8 units left and 3 units down.",
    gridMin: -10,
    gridMax: 10,
    gradeLevels: ["G7", "G8"],
    domain: "GEOMETRY",
  },
];

// ─── All questions combined ───

export const ALL_COORDINATE_QUESTIONS: CoordinatePlaneQuestionData[] = [
  ...GRADE_3_4_QUESTIONS,
  ...GRADE_5_QUESTIONS,
  ...GRADE_6_QUESTIONS,
  ...GRADE_7_8_QUESTIONS,
];

/**
 * Get fallback coordinate plane questions appropriate for a grade level.
 * Returns questions sorted by difficulty (easier first).
 */
export function getCoordinatePlaneFallbacks(
  gradeLevel: string
): CoordinatePlaneQuestionData[] {
  return ALL_COORDINATE_QUESTIONS.filter((q) =>
    q.gradeLevels.includes(gradeLevel)
  );
}

/**
 * Pick a random coordinate plane fallback question for the given grade,
 * avoiding previously asked questions.
 */
export function pickCoordinatePlaneFallback(
  gradeLevel: string,
  previousQuestionTexts: string[] = []
): CoordinatePlaneQuestionData | null {
  const candidates = getCoordinatePlaneFallbacks(gradeLevel);
  if (candidates.length === 0) return null;

  // Filter out previously asked
  const unseen = candidates.filter(
    (q) =>
      !previousQuestionTexts.some(
        (prev) =>
          prev.includes(q.questionText) || q.questionText.includes(prev)
      )
  );

  const pool = unseen.length > 0 ? unseen : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Check if a node is appropriate for coordinate plane questions.
 * Returns true for geometry nodes related to coordinate graphing.
 */
export function isCoordinatePlaneNode(
  nodeCode: string,
  nodeTitle: string,
  domain: string
): boolean {
  if (domain !== "GEOMETRY") return false;

  // Known coordinate plane node codes
  const coordinateNodeCodes = new Set([
    "3.G.CP.1", // Plot points in Quadrant I
    "4.G.CP.1", // Identify coordinates of plotted points
    "5.G.1", // Graph Points on a Coordinate Plane
    "6.G.CP.1", // Plot points in all four quadrants
    "6.NS.6", // Understand rational numbers on number line/coordinate plane
    "6.G.1", // Area by composing into geometric shapes (uses coordinates)
    "7.G.CP.1", // Reflect points across axes
    "8.G.1", // Verify properties of transformations (uses coordinate plane)
    "8.G.6", // Distance formula (coordinate plane)
  ]);

  if (coordinateNodeCodes.has(nodeCode)) return true;

  // Also match by title keywords
  const lowerTitle = nodeTitle.toLowerCase();
  return (
    lowerTitle.includes("coordinate") ||
    lowerTitle.includes("graph points") ||
    lowerTitle.includes("plot") ||
    lowerTitle.includes("ordered pair")
  );
}
