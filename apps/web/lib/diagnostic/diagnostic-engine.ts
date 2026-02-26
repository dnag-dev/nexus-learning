/**
 * Diagnostic Engine — Binary Search Placement System
 *
 * Two modes:
 * 1. Standard mode: binary search through hardcoded ORDERED_NODES (K-G1 math)
 * 2. Goal-aware mode: binary search through goal's requiredNodeIds
 *    fetched from DB and ordered by grade + difficulty
 *
 * Algorithm: Start at midpoint of concept space. Correct → move up 2 nodes.
 * Wrong → move down 2 nodes. After 20 questions → frontier identified.
 */

import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
// callClaude(prompt: string, opts?) → string | null
import type {
  DiagnosticState,
  DiagnosticResponse,
  PlacementResult,
  OrderedNode,
  SkillMapEntry,
  SkillMapResult,
} from "./types";

// ─── Default Ordered Nodes (Standard Mode — K-G1 Math) ─────────────────────

const DEFAULT_ORDERED_NODES: readonly OrderedNode[] = [
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

// ─── Grade-level Helpers ────────────────────────────────────────────────────

/** Map grade string "K", "G1", "G2", etc. to numeric value */
function gradeToNumber(gradeLevel: string): number {
  if (gradeLevel === "K") return 0;
  const match = gradeLevel.match(/^G(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Select the starting index based on the student's registered grade level.
 * For default (standard) mode only.
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
      return DEFAULT_ORDERED_NODES.length - 3;
    default:
      return Math.floor(DEFAULT_ORDERED_NODES.length / 2);
  }
}

/**
 * Get the ordered nodes for a given state.
 * Returns goal-specific nodes if available, otherwise defaults.
 */
function getNodeList(state: DiagnosticState): readonly OrderedNode[] {
  return state.orderedNodes ?? DEFAULT_ORDERED_NODES;
}

// ─── Standard Mode ──────────────────────────────────────────────────────────

/**
 * Creates a fresh diagnostic state for a student (standard mode).
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
    currentNodeCode: DEFAULT_ORDERED_NODES[midpoint].nodeCode,
    searchLow: 0,
    searchHigh: DEFAULT_ORDERED_NODES.length - 1,
    confirmedMastered: [],
    confirmedUnmastered: [],
    status: "in_progress",
  };
}

// ─── Goal-Aware Mode ────────────────────────────────────────────────────────

/**
 * Fetches a goal's required nodes from the DB, orders them by
 * grade + difficulty, and returns an OrderedNode array suitable
 * for binary search.
 */
export async function buildGoalNodeList(
  goalId: string
): Promise<{ orderedNodes: OrderedNode[]; goalName: string }> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });

  if (!goal) {
    throw new Error(`Learning goal ${goalId} not found`);
  }

  if (!goal.requiredNodeIds || goal.requiredNodeIds.length === 0) {
    throw new Error(`Goal "${goal.name}" has no required concepts`);
  }

  // Fetch all required nodes from DB
  const nodes = await prisma.knowledgeNode.findMany({
    where: {
      nodeCode: { in: goal.requiredNodeIds },
    },
    orderBy: [{ gradeLevel: "asc" }, { difficulty: "asc" }],
  });

  if (nodes.length === 0) {
    throw new Error(
      `No knowledge nodes found for goal "${goal.name}" (${goal.requiredNodeIds.length} required)`
    );
  }

  // Build ordered node list sorted by grade (numeric) + difficulty
  const orderedNodes: OrderedNode[] = nodes
    .map((n) => ({
      nodeCode: n.nodeCode,
      grade: gradeToNumber(n.gradeLevel) + n.difficulty * 0.01,
      difficulty: n.difficulty,
      title: n.title,
      domain: n.domain,
    }))
    .sort((a, b) => a.grade - b.grade || a.difficulty - b.difficulty);

  return { orderedNodes, goalName: goal.name };
}

/**
 * Creates a goal-aware diagnostic state for a student.
 * Binary search operates on the goal's concept space instead of the
 * hardcoded default list.
 */
export async function createGoalDiagnosticState(
  sessionId: string,
  studentId: string,
  gradeLevel: string,
  goalId: string
): Promise<DiagnosticState> {
  const { orderedNodes, goalName } = await buildGoalNodeList(goalId);

  // Start at middle difficulty concept within the goal's space
  const midpoint = Math.floor(orderedNodes.length / 2);

  // Cap questions at min(20, conceptCount) — no point asking more questions
  // than there are concepts
  const totalQuestions = Math.min(MAX_QUESTIONS, orderedNodes.length);

  return {
    sessionId,
    studentId,
    totalQuestions,
    questionsAnswered: 0,
    responses: [],
    currentNodeCode: orderedNodes[midpoint].nodeCode,
    searchLow: 0,
    searchHigh: orderedNodes.length - 1,
    confirmedMastered: [],
    confirmedUnmastered: [],
    status: "in_progress",
    goalId,
    goalName,
    orderedNodes,
  };
}

// ─── Core Binary Search (works for both modes) ─────────────────────────────

/**
 * Core binary search: select the next question node based on prior responses.
 *
 * Algorithm:
 * 1. Start at the grade-appropriate midpoint
 * 2. If student answers correctly → move UP (harder concepts)
 * 3. If student answers incorrectly → move DOWN (easier concepts)
 * 4. Each step halves the search space
 * 5. After N questions, the frontier is identified with ~95% confidence
 *
 * In goal-aware mode, uses the state's orderedNodes instead of DEFAULT_ORDERED_NODES.
 */
export function selectNextQuestion(
  state: DiagnosticState
): { nodeCode: string; nodeIndex: number } | null {
  const nodes = getNodeList(state);

  if (
    state.questionsAnswered >= state.totalQuestions ||
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
    asked.has(nodes[mid + offset]?.nodeCode) &&
    asked.has(nodes[mid - offset]?.nodeCode)
  ) {
    offset++;
    if (mid + offset > state.searchHigh && mid - offset < state.searchLow) {
      return null; // exhausted all options in range
    }
  }

  // Pick the closest unasked node
  if (
    mid + offset <= state.searchHigh &&
    !asked.has(nodes[mid + offset]?.nodeCode)
  ) {
    mid = mid + offset;
  } else if (
    mid - offset >= state.searchLow &&
    !asked.has(nodes[mid - offset]?.nodeCode)
  ) {
    mid = mid - offset;
  }

  if (mid < 0 || mid >= nodes.length) return null;

  return {
    nodeCode: nodes[mid].nodeCode,
    nodeIndex: mid,
  };
}

/**
 * Process an answer and update the binary search bounds.
 * Works for both standard and goal-aware modes.
 */
export function processAnswer(
  state: DiagnosticState,
  response: DiagnosticResponse
): DiagnosticState {
  const nodes = getNodeList(state);
  const nodeIndex = nodes.findIndex(
    (n) => n.nodeCode === response.nodeCode
  );

  const newState: DiagnosticState = {
    ...state,
    questionsAnswered: state.questionsAnswered + 1,
    responses: [...state.responses, response],
    // Preserve goal-aware fields
    goalId: state.goalId,
    goalName: state.goalName,
    orderedNodes: state.orderedNodes,
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
    newState.questionsAnswered >= newState.totalQuestions ||
    newState.searchLow > newState.searchHigh
  ) {
    newState.status = "complete";
  }

  // Set the next node to test
  const next = selectNextQuestion(newState);
  newState.currentNodeCode = next?.nodeCode ?? null;

  return newState;
}

// ─── Placement Result ───────────────────────────────────────────────────────

/**
 * Calculate the final placement result from all diagnostic responses.
 * Works for both standard and goal-aware modes.
 */
export function calculatePlacementResult(
  state: DiagnosticState
): PlacementResult {
  const nodes = getNodeList(state);
  const totalCorrect = state.responses.filter((r) => r.isCorrect).length;
  const totalQuestions = state.responses.length;

  // Find the highest confirmed mastered node (the frontier)
  let highestMasteredIndex = -1;
  for (const nodeCode of state.confirmedMastered) {
    const idx = nodes.findIndex((n) => n.nodeCode === nodeCode);
    if (idx > highestMasteredIndex) {
      highestMasteredIndex = idx;
    }
  }

  // Frontier: the node just above the highest mastered
  const frontierIndex = Math.min(
    highestMasteredIndex + 1,
    nodes.length - 1
  );
  const frontierNode = nodes[Math.max(frontierIndex, 0)];

  // Recommended start: the frontier itself (where learning should begin)
  // If no mastery at all, start at the very beginning
  const startIndex = highestMasteredIndex >= 0 ? frontierIndex : 0;
  const startNode = nodes[startIndex];

  // Grade estimate based on the frontier position
  const gradeEstimate =
    highestMasteredIndex >= 0 ? frontierNode.grade : nodes[0].grade;

  // Confidence: higher when more questions were asked and search space is narrow
  const searchSpaceReduction =
    1 - (state.searchHigh - state.searchLow + 1) / nodes.length;
  const questionRatio = totalQuestions / state.totalQuestions;
  const confidence = Math.min(
    0.99,
    0.5 + searchSpaceReduction * 0.3 + questionRatio * 0.2
  );

  // Detect gaps: nodes below the frontier that were answered incorrectly
  const gapNodes = state.confirmedUnmastered.filter((nodeCode) => {
    const idx = nodes.findIndex((n) => n.nodeCode === nodeCode);
    return idx < frontierIndex;
  });

  // All nodes at or below frontier that were answered correctly
  const masteredNodes = state.confirmedMastered.filter((nodeCode) => {
    const idx = nodes.findIndex((n) => n.nodeCode === nodeCode);
    return idx <= highestMasteredIndex;
  });

  // Generate a grade-level-friendly summary
  const isGoalMode = !!state.goalId;
  let summary: string;

  if (isGoalMode) {
    // Goal-aware summary
    const pctMastered = Math.round(
      (masteredNodes.length / nodes.length) * 100
    );
    summary =
      totalCorrect === 0
        ? `Let's start at the beginning of your ${state.goalName ?? "goal"} journey — every expert was once a beginner!`
        : gapNodes.length > 0
          ? `You've already mastered ${pctMastered}% of the concepts for "${state.goalName}". We found ${gapNodes.length} gap${gapNodes.length > 1 ? "s" : ""} to strengthen. Let's build your personalized path!`
          : `Excellent! You've mastered ${pctMastered}% of "${state.goalName}" concepts. Let's keep building from here!`;
  } else {
    // Standard mode summary
    const gradeLabel =
      gradeEstimate < 1
        ? `Kindergarten (${Math.round(gradeEstimate * 10) * 10}%)`
        : `Grade ${Math.floor(gradeEstimate)} (${Math.round((gradeEstimate % 1) * 100)}% through)`;

    summary =
      totalCorrect === 0
        ? "Let's start from the very beginning — every expert was once a beginner!"
        : gapNodes.length > 0
          ? `Great work! You're at a ${gradeLabel} math level. We found ${gapNodes.length} gap${gapNodes.length > 1 ? "s" : ""} we'll help you fill in.`
          : `Awesome! You're at a ${gradeLabel} math level. You have a solid foundation — let's keep building!`;
  }

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

// ─── Skill Map (Goal-Aware Only) ────────────────────────────────────────────

/** Estimate hours to learn a concept based on difficulty */
function estimateHoursForDifficulty(difficulty: number): number {
  if (difficulty <= 2) return 0.5;
  if (difficulty <= 4) return 1.0;
  if (difficulty <= 6) return 1.5;
  if (difficulty <= 8) return 2.0;
  return 2.5;
}

/**
 * Generates a comprehensive skill map after a goal-aware diagnostic completes.
 * Shows every concept in the goal with mastery status and estimated hours.
 */
export async function generateSkillMap(
  state: DiagnosticState,
  sessionId: string
): Promise<SkillMapResult> {
  if (!state.goalId || !state.orderedNodes) {
    throw new Error("Skill map can only be generated for goal-aware diagnostics");
  }

  const goalId = state.goalId;
  const goalName = state.goalName ?? "Unknown Goal";
  const studentId = state.studentId;

  // Get all ordered nodes for this goal
  const orderedNodes = state.orderedNodes;

  // Build sets for quick lookup
  const masteredSet = new Set(state.confirmedMastered);
  const unmasteredSet = new Set(state.confirmedUnmastered);
  const testedSet = new Set(state.responses.map((r) => r.nodeCode));
  const correctSet = new Set(
    state.responses.filter((r) => r.isCorrect).map((r) => r.nodeCode)
  );

  // Find the frontier index for inferring untested concepts
  let highestMasteredIndex = -1;
  for (const nodeCode of state.confirmedMastered) {
    const idx = orderedNodes.findIndex((n) => n.nodeCode === nodeCode);
    if (idx > highestMasteredIndex) highestMasteredIndex = idx;
  }

  // Fetch existing mastery scores from DB for this student
  const existingMasteries = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { node: { select: { nodeCode: true } } },
  });
  const existingMasteryMap = new Map(
    existingMasteries.map((m) => [m.node.nodeCode, m.bktProbability])
  );

  // Build skill map entries
  const entries: SkillMapEntry[] = orderedNodes.map((node, index) => {
    const wasTested = testedSet.has(node.nodeCode);
    const wasCorrect = wasTested ? correctSet.has(node.nodeCode) : undefined;
    const existingBkt = existingMasteryMap.get(node.nodeCode) ?? 0;

    let status: SkillMapEntry["status"];
    let bktProbability: number;

    if (masteredSet.has(node.nodeCode)) {
      status = "mastered";
      bktProbability = Math.max(0.85, existingBkt);
    } else if (unmasteredSet.has(node.nodeCode)) {
      status = "gap";
      bktProbability = Math.min(0.3, existingBkt || 0.1);
    } else if (!wasTested && index <= highestMasteredIndex) {
      // Untested but below the frontier — infer likely mastered
      status = existingBkt >= 0.85 ? "mastered" : "in_progress";
      bktProbability = existingBkt || 0.6;
    } else if (!wasTested && index > highestMasteredIndex) {
      // Untested and above the frontier — likely not mastered
      status = existingBkt >= 0.85 ? "mastered" : "untested";
      bktProbability = existingBkt || 0.2;
    } else {
      status = "untested";
      bktProbability = existingBkt || 0.2;
    }

    const estimatedHoursToLearn =
      status === "mastered" ? 0 : estimateHoursForDifficulty(node.difficulty);

    return {
      nodeCode: node.nodeCode,
      title: node.title ?? node.nodeCode,
      domain: node.domain ?? "Math",
      gradeLevel:
        node.grade < 1
          ? "K"
          : `G${Math.floor(node.grade)}`,
      difficulty: node.difficulty,
      status,
      bktProbability,
      estimatedHoursToLearn,
      wasTested,
      wasCorrect,
    };
  });

  // Calculate summary stats
  const totalConcepts = entries.length;
  const masteredCount = entries.filter((e) => e.status === "mastered").length;
  const gapCount = entries.filter((e) => e.status === "gap").length;
  const untestedCount = entries.filter(
    (e) => e.status === "untested" || e.status === "in_progress"
  ).length;
  const totalEstimatedHours = entries.reduce(
    (sum, e) => sum + estimateHoursForDifficulty(e.difficulty),
    0
  );
  const remainingEstimatedHours = entries.reduce(
    (sum, e) => sum + e.estimatedHoursToLearn,
    0
  );
  const completionPercentage = Math.round(
    (masteredCount / totalConcepts) * 100
  );

  // Generate Claude narrative for the skill map
  let narrative = "";
  try {
    const prompt = `You are Cosmo, a friendly bear guide for a child's learning platform.

Student diagnostic results for goal "${goalName}":
- Total concepts: ${totalConcepts}
- Already mastered: ${masteredCount} (${completionPercentage}%)
- Knowledge gaps found: ${gapCount}
- Untested concepts: ${untestedCount}
- Estimated remaining hours: ${remainingEstimatedHours.toFixed(1)}
- Mastered concepts: ${entries
      .filter((e) => e.status === "mastered")
      .map((e) => e.title)
      .slice(0, 5)
      .join(", ")}
- Gap concepts: ${entries
      .filter((e) => e.status === "gap")
      .map((e) => e.title)
      .slice(0, 5)
      .join(", ")}

Respond with ONLY a JSON object: {"narrative": "<2-3 sentence encouraging narrative about the student's diagnostic results>"}`;

    const claudeResult = await callClaude(prompt, { maxTokens: 200 });
    if (claudeResult) {
      try {
        const parsed = JSON.parse(claudeResult) as { narrative?: string };
        narrative = parsed.narrative ?? "";
      } catch {
        // If not valid JSON, use the raw text
        narrative = claudeResult.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Fallback narrative
    if (masteredCount === 0) {
      narrative = `Exciting! You're starting a brand new adventure with "${goalName}". Cosmo will guide you through ${totalConcepts} concepts — one step at a time!`;
    } else if (gapCount > 0) {
      narrative = `Great news! You already know ${masteredCount} out of ${totalConcepts} concepts for "${goalName}". We found ${gapCount} area${gapCount > 1 ? "s" : ""} to strengthen. Cosmo has the perfect plan!`;
    } else {
      narrative = `Wow! You've already mastered ${completionPercentage}% of "${goalName}"! Just ${totalConcepts - masteredCount} more concepts to go. Let's finish strong!`;
    }
  }

  return {
    goalId,
    goalName,
    sessionId,
    studentId,
    entries,
    totalConcepts,
    masteredCount,
    gapCount,
    untestedCount,
    totalEstimatedHours,
    remainingEstimatedHours,
    narrative,
    completionPercentage,
  };
}

// ─── Save Results ───────────────────────────────────────────────────────────

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

// ─── Exports for External Use ───────────────────────────────────────────────

/**
 * Get the default ordered node list for external use (e.g., by prompt generator).
 */
export function getOrderedNodes() {
  return [...DEFAULT_ORDERED_NODES];
}
