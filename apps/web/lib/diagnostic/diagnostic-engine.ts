import { prisma } from "@aauti/db";
import type {
  DiagnosticState,
  DiagnosticResponse,
  PlacementResult,
} from "./types";

/**
 * Ordered list of knowledge nodes by difficulty for binary search.
 * Sorted by grade level then difficulty — this is the "number line"
 * the binary search operates on.
 */
const ORDERED_NODES = [
  // Kindergarten Counting (easiest)
  { nodeCode: "K.CC.1", grade: 0.0, difficulty: 1 },
  { nodeCode: "K.CC.2", grade: 0.1, difficulty: 2 },
  { nodeCode: "K.CC.3", grade: 0.2, difficulty: 2 },
  { nodeCode: "K.CC.4", grade: 0.3, difficulty: 3 },
  { nodeCode: "K.CC.5", grade: 0.4, difficulty: 3 },
  { nodeCode: "K.CC.6", grade: 0.5, difficulty: 4 },
  { nodeCode: "K.CC.7", grade: 0.6, difficulty: 4 },
  // Grade 1 Operations — lower
  { nodeCode: "1.OA.1", grade: 1.0, difficulty: 3 },
  { nodeCode: "1.OA.5", grade: 1.1, difficulty: 3 },
  { nodeCode: "1.OA.7", grade: 1.2, difficulty: 4 },
  { nodeCode: "1.OA.2", grade: 1.25, difficulty: 4 },
  { nodeCode: "1.OA.3", grade: 1.3, difficulty: 5 },
  { nodeCode: "1.OA.4", grade: 1.35, difficulty: 5 },
  { nodeCode: "1.OA.6", grade: 1.4, difficulty: 5 },
  { nodeCode: "1.OA.8", grade: 1.5, difficulty: 6 },
  // Grade 1 Number & Base Ten
  { nodeCode: "1.NBT.1", grade: 1.55, difficulty: 3 },
  { nodeCode: "1.NBT.2", grade: 1.6, difficulty: 5 },
  { nodeCode: "1.NBT.5", grade: 1.65, difficulty: 5 },
  { nodeCode: "1.NBT.3", grade: 1.7, difficulty: 5 },
  { nodeCode: "1.NBT.4", grade: 1.8, difficulty: 6 },
  { nodeCode: "1.NBT.6", grade: 1.9, difficulty: 6 },
] as const;

const MAX_QUESTIONS = 20;

/**
 * Select the starting index based on the student's registered grade level.
 */
function getGradeMidpoint(gradeLevel: string): number {
  switch (gradeLevel) {
    case "K":
      return 3; // K.CC.4 — middle of kindergarten
    case "G1":
      return 10; // 1.OA.2 — middle of grade 1
    case "G2":
    case "G3":
    case "G4":
    case "G5":
      return ORDERED_NODES.length - 3; // Near the top of our current graph
    default:
      return Math.floor(ORDERED_NODES.length / 2);
  }
}

/**
 * Creates a fresh diagnostic state for a student.
 */
export function createDiagnosticState(
  sessionId: string,
  studentId: string,
  gradeLevel: string
): DiagnosticState {
  const midpoint = getGradeMidpoint(gradeLevel);

  return {
    sessionId,
    studentId,
    totalQuestions: MAX_QUESTIONS,
    questionsAnswered: 0,
    responses: [],
    currentNodeCode: ORDERED_NODES[midpoint].nodeCode,
    searchLow: 0,
    searchHigh: ORDERED_NODES.length - 1,
    confirmedMastered: [],
    confirmedUnmastered: [],
    status: "in_progress",
  };
}

/**
 * Core binary search: select the next question node based on prior responses.
 *
 * Algorithm:
 * 1. Start at the grade-appropriate midpoint
 * 2. If student answers correctly → move UP (harder concepts)
 * 3. If student answers incorrectly → move DOWN (easier concepts)
 * 4. Each step halves the search space
 * 5. After 20 questions, the frontier is identified with ~95% confidence
 */
export function selectNextQuestion(
  state: DiagnosticState
): { nodeCode: string; nodeIndex: number } | null {
  if (
    state.questionsAnswered >= MAX_QUESTIONS ||
    state.searchLow > state.searchHigh
  ) {
    return null;
  }

  // Already-asked node codes
  const asked = new Set(state.responses.map((r) => r.nodeCode));

  // Binary search midpoint
  let mid = Math.floor((state.searchLow + state.searchHigh) / 2);

  // If we already asked this node, scan nearby for an unasked one
  let offset = 0;
  while (
    asked.has(ORDERED_NODES[mid + offset]?.nodeCode) &&
    asked.has(ORDERED_NODES[mid - offset]?.nodeCode)
  ) {
    offset++;
    if (mid + offset > state.searchHigh && mid - offset < state.searchLow) {
      return null; // exhausted all options in range
    }
  }

  // Pick the closest unasked node
  if (
    mid + offset <= state.searchHigh &&
    !asked.has(ORDERED_NODES[mid + offset]?.nodeCode)
  ) {
    mid = mid + offset;
  } else if (
    mid - offset >= state.searchLow &&
    !asked.has(ORDERED_NODES[mid - offset]?.nodeCode)
  ) {
    mid = mid - offset;
  }

  if (mid < 0 || mid >= ORDERED_NODES.length) return null;

  return {
    nodeCode: ORDERED_NODES[mid].nodeCode,
    nodeIndex: mid,
  };
}

/**
 * Process an answer and update the binary search bounds.
 */
export function processAnswer(
  state: DiagnosticState,
  response: DiagnosticResponse
): DiagnosticState {
  const nodeIndex = ORDERED_NODES.findIndex(
    (n) => n.nodeCode === response.nodeCode
  );

  const newState = {
    ...state,
    questionsAnswered: state.questionsAnswered + 1,
    responses: [...state.responses, response],
  };

  if (response.isCorrect) {
    // Student knows this — move to harder material (higher index)
    newState.confirmedMastered = [
      ...state.confirmedMastered,
      response.nodeCode,
    ];
    newState.searchLow = Math.max(state.searchLow, nodeIndex + 1);
  } else {
    // Student doesn't know this — move to easier material (lower index)
    newState.confirmedUnmastered = [
      ...state.confirmedUnmastered,
      response.nodeCode,
    ];
    newState.searchHigh = Math.min(state.searchHigh, nodeIndex - 1);
  }

  // Check if diagnostic is complete
  if (
    newState.questionsAnswered >= MAX_QUESTIONS ||
    newState.searchLow > newState.searchHigh
  ) {
    newState.status = "complete";
  }

  // Set the next node to test
  const next = selectNextQuestion(newState);
  newState.currentNodeCode = next?.nodeCode ?? null;

  return newState;
}

/**
 * Calculate the final placement result from all diagnostic responses.
 */
export function calculatePlacementResult(
  state: DiagnosticState
): PlacementResult {
  const totalCorrect = state.responses.filter((r) => r.isCorrect).length;
  const totalQuestions = state.responses.length;

  // Find the highest confirmed mastered node (the frontier)
  let highestMasteredIndex = -1;
  for (const nodeCode of state.confirmedMastered) {
    const idx = ORDERED_NODES.findIndex((n) => n.nodeCode === nodeCode);
    if (idx > highestMasteredIndex) {
      highestMasteredIndex = idx;
    }
  }

  // Frontier: the node just above the highest mastered
  const frontierIndex = Math.min(
    highestMasteredIndex + 1,
    ORDERED_NODES.length - 1
  );
  const frontierNode = ORDERED_NODES[Math.max(frontierIndex, 0)];

  // Recommended start: the frontier itself (where learning should begin)
  // If no mastery at all, start at the very beginning
  const startIndex = highestMasteredIndex >= 0 ? frontierIndex : 0;
  const startNode = ORDERED_NODES[startIndex];

  // Grade estimate based on the frontier position
  const gradeEstimate =
    highestMasteredIndex >= 0 ? frontierNode.grade : ORDERED_NODES[0].grade;

  // Confidence: higher when more questions were asked and search space is narrow
  const searchSpaceReduction =
    1 - (state.searchHigh - state.searchLow + 1) / ORDERED_NODES.length;
  const questionRatio = totalQuestions / MAX_QUESTIONS;
  const confidence = Math.min(
    0.99,
    0.5 + searchSpaceReduction * 0.3 + questionRatio * 0.2
  );

  // Detect gaps: nodes below the frontier that were answered incorrectly
  const gapNodes = state.confirmedUnmastered.filter((nodeCode) => {
    const idx = ORDERED_NODES.findIndex((n) => n.nodeCode === nodeCode);
    return idx < frontierIndex;
  });

  // All nodes at or below frontier that were answered correctly
  const masteredNodes = state.confirmedMastered.filter((nodeCode) => {
    const idx = ORDERED_NODES.findIndex((n) => n.nodeCode === nodeCode);
    return idx <= highestMasteredIndex;
  });

  // Generate a grade-level-friendly summary
  const gradeLabel =
    gradeEstimate < 1
      ? `Kindergarten (${Math.round(gradeEstimate * 10) * 10}%)`
      : `Grade ${Math.floor(gradeEstimate)} (${Math.round((gradeEstimate % 1) * 100)}% through)`;

  const summary =
    totalCorrect === 0
      ? "Let's start from the very beginning — every expert was once a beginner!"
      : gapNodes.length > 0
        ? `Great work! You're at a ${gradeLabel} math level. We found ${gapNodes.length} gap${gapNodes.length > 1 ? "s" : ""} we'll help you fill in.`
        : `Awesome! You're at a ${gradeLabel} math level. You have a solid foundation — let's keep building!`;

  return {
    frontierNodeCode: frontierNode.nodeCode,
    frontierNodeTitle: "", // Will be filled by the caller from DB
    gradeEstimate,
    confidence,
    masteredNodes,
    gapNodes,
    recommendedStartNode: startNode.nodeCode,
    totalCorrect,
    totalQuestions,
    summary,
  };
}

/**
 * Save the diagnostic result to the database.
 */
export async function saveDiagnosticResult(
  studentId: string,
  sessionId: string,
  result: PlacementResult
): Promise<void> {
  // Update the session with results
  await prisma.learningSession.update({
    where: { id: sessionId },
    data: {
      state: "COMPLETED",
      endedAt: new Date(),
      questionsAnswered: result.totalQuestions,
      correctAnswers: result.totalCorrect,
      durationSeconds: 0, // Caller should set this from actual timing
    },
  });

  // Create initial mastery scores for confirmed mastered nodes
  for (const nodeCode of result.masteredNodes) {
    const node = await prisma.knowledgeNode.findUnique({
      where: { nodeCode },
    });
    if (!node) continue;

    await prisma.masteryScore.upsert({
      where: {
        studentId_nodeId: { studentId, nodeId: node.id },
      },
      update: {
        level: "PROFICIENT",
        bktProbability: 0.85,
        practiceCount: 1,
        correctCount: 1,
        lastPracticed: new Date(),
      },
      create: {
        studentId,
        nodeId: node.id,
        level: "PROFICIENT",
        bktProbability: 0.85,
        practiceCount: 1,
        correctCount: 1,
        lastPracticed: new Date(),
      },
    });
  }

  // Mark gap nodes as NOVICE so the system knows to remediate them
  for (const nodeCode of result.gapNodes) {
    const node = await prisma.knowledgeNode.findUnique({
      where: { nodeCode },
    });
    if (!node) continue;

    await prisma.masteryScore.upsert({
      where: {
        studentId_nodeId: { studentId, nodeId: node.id },
      },
      update: {
        level: "NOVICE",
        bktProbability: 0.1,
        practiceCount: 1,
        correctCount: 0,
        lastPracticed: new Date(),
      },
      create: {
        studentId,
        nodeId: node.id,
        level: "NOVICE",
        bktProbability: 0.1,
        practiceCount: 1,
        correctCount: 0,
        lastPracticed: new Date(),
      },
    });
  }
}

/**
 * Get the ordered node list for external use (e.g., by prompt generator).
 */
export function getOrderedNodes() {
  return [...ORDERED_NODES];
}
