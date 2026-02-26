/**
 * Learning Plan Generator Engine — Step 4 of Learning GPS
 *
 * Generates personalized learning plans for students based on their goals.
 * Determines concept sequence (prerequisite-ordered), estimates hours,
 * generates weekly milestones, and creates a Claude-powered narrative.
 *
 * Reuses:
 *   - BKT engine mastery data (bkt-engine.ts)
 *   - Neo4j getShortestLearningPath / getAllNodes for prerequisite ordering
 *   - Prisma for fallback ordering
 *   - callClaude() for personalized narrative
 */

import { prisma, getShortestLearningPath, getAllNodes } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";
import type { AgeGroupValue } from "@/lib/prompts/types";
import { getPersonaName, getAgeInstruction } from "@/lib/prompts/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratePlanInput {
  goalId: string;
  studentId: string;
  weeklyHoursAvailable: number;
  targetDate?: Date;
}

export interface GeneratePlanResult {
  planId: string;
  conceptSequence: string[];
  totalEstimatedHours: number;
  projectedCompletionDate: Date;
  weeklyMilestones: WeeklyMilestone[];
  narrative: string;
  conceptsAlreadyMastered: number;
  conceptsRemaining: number;
}

export interface WeeklyMilestone {
  weekNumber: number;
  concepts: string[];
  conceptTitles: string[];
  estimatedHours: number;
  cumulativeProgress: number; // 0-100
  milestoneCheck: boolean; // whether a milestone assessment is due
}

interface ConceptEstimate {
  nodeCode: string;
  title: string;
  description: string;
  domain: string;
  difficulty: number;
  gradeLevel: string;
  estimatedHours: number;
  isMastered: boolean;
  bktProbability: number;
}

// ─── Difficulty-based Hour Estimates ─────────────────────────────────────────

const BASE_HOURS_BY_DIFFICULTY: Record<number, number> = {
  1: 0.4,  // Very easy
  2: 0.5,  // Easy
  3: 0.6,  // Easy-medium
  4: 0.75, // Medium
  5: 1.0,  // Medium
  6: 1.25, // Medium-hard
  7: 1.5,  // Hard
  8: 2.0,  // Very hard
  9: 2.5,  // Expert
  10: 3.0, // Master
};

/**
 * Grade factor adjusts estimated time based on student grade vs concept grade.
 * If a student is below the concept's grade level, they'll take longer.
 * If above, they'll be faster.
 */
function getGradeFactor(studentGradeNum: number, conceptGradeNum: number): number {
  const diff = conceptGradeNum - studentGradeNum;
  if (diff <= -2) return 0.6;  // Student is 2+ grades above → faster
  if (diff === -1) return 0.8; // Student is 1 grade above
  if (diff === 0) return 1.0;  // At grade level
  if (diff === 1) return 1.2;  // 1 grade below → slightly slower
  return 1.5;                  // 2+ grades below → considerably slower
}

/**
 * Velocity factor adjusts estimates based on student's historical learning speed.
 * A velocity > 1 means student learns faster than average.
 */
function getVelocityFactor(historicalVelocity: number | null): number {
  if (!historicalVelocity || historicalVelocity <= 0) return 1.0;
  // If student typically completes 1.5x faster, reduce estimates by 1/1.5
  return Math.max(0.5, Math.min(2.0, 1.0 / historicalVelocity));
}

/**
 * Partial mastery discount: if a student already has some BKT probability,
 * reduce the estimated hours proportionally.
 */
function getPartialMasteryDiscount(bktProbability: number): number {
  if (bktProbability <= 0.3) return 1.0;   // No prior knowledge
  if (bktProbability <= 0.5) return 0.75;  // Some exposure
  if (bktProbability <= 0.7) return 0.5;   // Developing
  if (bktProbability <= 0.85) return 0.3;  // Proficient but not mastered
  return 0;                                 // Effectively mastered → skip
}

// ─── Grade Level Helpers ────────────────────────────────────────────────────

const GRADE_ORDER = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"];

function gradeToNum(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx >= 0 ? idx : 0;
}

// ─── Core: Concept Ordering via Topological Sort ────────────────────────────

/**
 * Orders concepts by prerequisite chain using topological sort.
 * Tries Neo4j pathfinding first, falls back to PostgreSQL prerequisites.
 */
async function orderConceptsByPrerequisites(
  nodeCodeSet: Set<string>
): Promise<string[]> {
  const codes = Array.from(nodeCodeSet);
  if (codes.length === 0) return [];
  if (codes.length === 1) return codes;

  // Build adjacency graph from PostgreSQL prerequisite data
  const nodes = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: codes } },
    select: {
      nodeCode: true,
      difficulty: true,
      gradeLevel: true,
      prerequisites: { select: { nodeCode: true } },
    },
  });

  // Build in-degree map and adjacency list (only edges within our concept set)
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map<string, typeof nodes[0]>();

  for (const node of nodes) {
    inDegree.set(node.nodeCode, 0);
    adjacency.set(node.nodeCode, []);
    nodeMap.set(node.nodeCode, node);
  }

  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      if (nodeCodeSet.has(prereq.nodeCode)) {
        // prereq → node (prereq is prerequisite OF node)
        const adj = adjacency.get(prereq.nodeCode);
        if (adj) adj.push(node.nodeCode);
        inDegree.set(node.nodeCode, (inDegree.get(node.nodeCode) ?? 0) + 1);
      }
    }
  }

  // Kahn's algorithm with tie-breaking by grade level then difficulty
  const queue: string[] = [];
  for (const [code, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(code);
  }

  // Sort queue by grade level, then difficulty for stable ordering
  const sortKey = (code: string) => {
    const n = nodeMap.get(code);
    if (!n) return 0;
    return gradeToNum(n.gradeLevel) * 100 + n.difficulty;
  };

  queue.sort((a, b) => sortKey(a) - sortKey(b));

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = adjacency.get(current) ?? [];
    const newReady: string[] = [];

    for (const neighbor of neighbors) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) {
        newReady.push(neighbor);
      }
    }

    // Sort newly ready nodes by grade + difficulty
    newReady.sort((a, b) => sortKey(a) - sortKey(b));
    queue.push(...newReady);
    // Re-sort entire queue to maintain global ordering
    queue.sort((a, b) => sortKey(a) - sortKey(b));
  }

  // Any nodes not in result (circular deps?) — append by difficulty
  const remaining = codes.filter((c) => !result.includes(c));
  remaining.sort((a, b) => sortKey(a) - sortKey(b));
  result.push(...remaining);

  return result;
}

// ─── Core: Student Mastery Map ──────────────────────────────────────────────

/**
 * Fetch student's mastery scores for all concepts in a goal.
 * Returns a map of nodeCode → bktProbability.
 */
async function getStudentMasteryMap(
  studentId: string,
  nodeCodes: string[]
): Promise<Map<string, number>> {
  const masteryMap = new Map<string, number>();

  // Get the node IDs for these codes
  const nodeRows = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: nodeCodes } },
    select: { id: true, nodeCode: true },
  });

  const nodeIdToCode = new Map<string, string>();
  const nodeIds: string[] = [];
  for (const row of nodeRows) {
    nodeIdToCode.set(row.id, row.nodeCode);
    nodeIds.push(row.id);
  }

  // Fetch mastery scores
  const scores = await prisma.masteryScore.findMany({
    where: {
      studentId,
      nodeId: { in: nodeIds },
    },
    select: { nodeId: true, bktProbability: true },
  });

  for (const score of scores) {
    const code = nodeIdToCode.get(score.nodeId);
    if (code) {
      masteryMap.set(code, score.bktProbability);
    }
  }

  return masteryMap;
}

// ─── Core: Estimate Hours per Concept ───────────────────────────────────────

function estimateHoursPerConcept(
  difficulty: number,
  conceptGradeNum: number,
  studentGradeNum: number,
  historicalVelocity: number | null,
  bktProbability: number
): number {
  const baseHours = BASE_HOURS_BY_DIFFICULTY[difficulty] ?? 1.0;
  const gradeFactor = getGradeFactor(studentGradeNum, conceptGradeNum);
  const velocityFactor = getVelocityFactor(historicalVelocity);
  const masteryDiscount = getPartialMasteryDiscount(bktProbability);

  const estimated = baseHours * gradeFactor * velocityFactor * masteryDiscount;
  // Minimum 0.25 hours for any concept that isn't fully mastered
  return masteryDiscount > 0 ? Math.max(0.25, Math.round(estimated * 100) / 100) : 0;
}

// ─── Core: Calculate Student Historical Velocity ────────────────────────────

/**
 * Calculates the student's historical learning velocity.
 * Returns a multiplier: >1 means faster than average, <1 means slower.
 * Based on concepts mastered per session hour in the last 4 weeks.
 */
async function calculateHistoricalVelocity(
  studentId: string
): Promise<number | null> {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentSessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      startedAt: { gte: fourWeeksAgo },
      state: "COMPLETED",
    },
    select: {
      durationSeconds: true,
      correctAnswers: true,
      questionsAnswered: true,
    },
  });

  if (recentSessions.length < 3) return null; // Not enough data

  const totalHours = recentSessions.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0) / 3600,
    0
  );
  const totalCorrect = recentSessions.reduce(
    (sum, s) => sum + (s.correctAnswers ?? 0),
    0
  );
  const totalQuestions = recentSessions.reduce(
    (sum, s) => sum + (s.questionsAnswered ?? 0),
    0
  );

  if (totalHours <= 0 || totalQuestions <= 0) return null;

  // Accuracy as a proxy for learning speed
  const accuracy = totalCorrect / totalQuestions;
  // concepts per hour (roughly 1 concept = 8-12 correct answers)
  const conceptsPerHour = (totalCorrect / 10) / totalHours;

  // Normalize: average student does ~1 concept/hour
  // Return velocity multiplier
  const velocity = conceptsPerHour * (0.5 + accuracy * 0.5);
  return Math.max(0.3, Math.min(3.0, velocity));
}

// ─── Core: Generate Weekly Milestones ───────────────────────────────────────

function generateWeeklyMilestones(
  concepts: ConceptEstimate[],
  hoursPerWeek: number
): WeeklyMilestone[] {
  const milestones: WeeklyMilestone[] = [];
  const activeConcepts = concepts.filter((c) => !c.isMastered && c.estimatedHours > 0);
  const totalHours = activeConcepts.reduce((sum, c) => sum + c.estimatedHours, 0);

  let weekNumber = 1;
  let currentWeekHours = 0;
  let currentWeekConcepts: string[] = [];
  let currentWeekTitles: string[] = [];
  let cumulativeHours = 0;

  for (const concept of activeConcepts) {
    // If adding this concept exceeds the week's budget, start a new week
    if (currentWeekHours + concept.estimatedHours > hoursPerWeek && currentWeekConcepts.length > 0) {
      cumulativeHours += currentWeekHours;
      milestones.push({
        weekNumber,
        concepts: currentWeekConcepts,
        conceptTitles: currentWeekTitles,
        estimatedHours: Math.round(currentWeekHours * 100) / 100,
        cumulativeProgress: totalHours > 0
          ? Math.round((cumulativeHours / totalHours) * 100)
          : 0,
        milestoneCheck: weekNumber % 1 === 0, // Every week has a milestone check
      });
      weekNumber++;
      currentWeekHours = 0;
      currentWeekConcepts = [];
      currentWeekTitles = [];
    }

    currentWeekConcepts.push(concept.nodeCode);
    currentWeekTitles.push(concept.title);
    currentWeekHours += concept.estimatedHours;
  }

  // Flush remaining concepts
  if (currentWeekConcepts.length > 0) {
    cumulativeHours += currentWeekHours;
    milestones.push({
      weekNumber,
      concepts: currentWeekConcepts,
      conceptTitles: currentWeekTitles,
      estimatedHours: Math.round(currentWeekHours * 100) / 100,
      cumulativeProgress: 100,
      milestoneCheck: true, // Final week always has a milestone
    });
  }

  return milestones;
}

// ─── Core: Generate Claude Narrative ────────────────────────────────────────

async function generatePlanNarrative(
  studentName: string,
  ageGroup: AgeGroupValue,
  personaId: string,
  goalName: string,
  totalConcepts: number,
  masteredConcepts: number,
  remainingConcepts: number,
  totalEstimatedHours: number,
  weekCount: number,
  firstFewConcepts: string[]
): Promise<string> {
  const personaName = getPersonaName(personaId);
  const ageInstruction = getAgeInstruction(ageGroup);

  const prompt = `Generate a personalized, encouraging learning plan narrative for a student.

CONTEXT:
- Student name: ${studentName}
- Tutor persona: ${personaName} (${personaId})
- Age group instruction: ${ageInstruction}
- Goal: ${goalName}
- Total concepts in goal: ${totalConcepts}
- Already mastered: ${masteredConcepts}
- Remaining to learn: ${remainingConcepts}
- Estimated total hours: ${totalEstimatedHours}
- Estimated weeks: ${weekCount}
- First concepts to learn: ${firstFewConcepts.join(", ")}

REQUIREMENTS:
- Write 2-3 short paragraphs as the tutor persona
- Acknowledge what the student already knows
- Preview what they'll learn first
- Give a motivational estimate of completion
- Use the persona's voice and tone
- Match the age group's language level

Respond with JSON:
{
  "narrative": "The full narrative text with proper line breaks between paragraphs"
}`;

  try {
    const response = await callClaude(prompt, { maxTokens: 512 });
    if (response) {
      const parsed = JSON.parse(response);
      if (parsed.narrative) return parsed.narrative;
    }
  } catch (err) {
    console.warn("[PlanGenerator] Claude narrative generation failed:", err);
  }

  // Fallback narrative
  const progressPct = totalConcepts > 0
    ? Math.round((masteredConcepts / totalConcepts) * 100)
    : 0;

  return `Hey ${studentName}! 🎯 I'm excited to help you with ${goalName}!\n\n` +
    `${masteredConcepts > 0
      ? `You've already mastered ${masteredConcepts} concept${masteredConcepts > 1 ? "s" : ""} (${progressPct}%) — great start! `
      : ""}` +
    `We have ${remainingConcepts} concept${remainingConcepts > 1 ? "s" : ""} to work through together. ` +
    `At your pace, we should finish in about ${weekCount} week${weekCount > 1 ? "s" : ""}.\n\n` +
    `First up: ${firstFewConcepts.slice(0, 3).join(", ")}. Let's do this! 💪`;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Generate a complete learning plan for a student-goal pair.
 *
 * Algorithm:
 * 1. Fetch goal → get requiredNodeIds
 * 2. Fetch student mastery → identify what's already mastered (bkt > 0.85)
 * 3. Order remaining by prerequisite chain (topological sort)
 * 4. Estimate hours per concept (difficulty × grade factor × velocity × mastery discount)
 * 5. Generate weekly milestones
 * 6. Call Claude for personalized narrative
 * 7. Save LearningPlan to PostgreSQL
 */
export async function generateLearningPlan(
  input: GeneratePlanInput
): Promise<GeneratePlanResult> {
  const { goalId, studentId, weeklyHoursAvailable, targetDate } = input;

  // 1. Fetch goal
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });
  if (!goal) throw new Error(`Goal not found: ${goalId}`);

  // 2. Fetch student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new Error(`Student not found: ${studentId}`);

  const requiredCodes = goal.requiredNodeIds;
  if (requiredCodes.length === 0) {
    throw new Error(`Goal "${goal.name}" has no required node IDs`);
  }

  console.log(
    `[PlanGenerator] Generating plan for "${goal.name}" — ${requiredCodes.length} required concepts`
  );

  // 3. Fetch all node details
  const allNodes = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: requiredCodes } },
    select: {
      nodeCode: true,
      title: true,
      description: true,
      domain: true,
      difficulty: true,
      gradeLevel: true,
    },
  });

  const nodeDetails = new Map(allNodes.map((n) => [n.nodeCode, n]));

  // 4. Fetch student mastery for all required concepts
  const masteryMap = await getStudentMasteryMap(studentId, requiredCodes);

  // 5. Calculate historical velocity
  const historicalVelocity = await calculateHistoricalVelocity(studentId);
  const studentGradeNum = gradeToNum(student.gradeLevel);

  console.log(
    `[PlanGenerator] Student grade: ${student.gradeLevel} (${studentGradeNum}), ` +
    `velocity: ${historicalVelocity?.toFixed(2) ?? "N/A"}`
  );

  // 6. Build concept estimates
  const conceptEstimates: ConceptEstimate[] = [];
  const masteredThreshold = 0.85;

  for (const code of requiredCodes) {
    const node = nodeDetails.get(code);
    if (!node) {
      console.warn(`[PlanGenerator] Node ${code} not found in database — skipping`);
      continue;
    }

    const bktProb = masteryMap.get(code) ?? 0;
    const isMastered = bktProb >= masteredThreshold;
    const hours = estimateHoursPerConcept(
      node.difficulty,
      gradeToNum(node.gradeLevel),
      studentGradeNum,
      historicalVelocity,
      bktProb
    );

    conceptEstimates.push({
      nodeCode: code,
      title: node.title,
      description: node.description,
      domain: node.domain,
      difficulty: node.difficulty,
      gradeLevel: node.gradeLevel,
      estimatedHours: hours,
      isMastered,
      bktProbability: bktProb,
    });
  }

  const mastered = conceptEstimates.filter((c) => c.isMastered);
  const remaining = conceptEstimates.filter((c) => !c.isMastered);

  console.log(
    `[PlanGenerator] ${mastered.length} mastered, ${remaining.length} remaining`
  );

  // 7. Order remaining concepts by prerequisites
  const remainingCodes = new Set(remaining.map((c) => c.nodeCode));
  const orderedCodes = await orderConceptsByPrerequisites(remainingCodes);

  // Map ordered codes back to estimates
  const orderedEstimates: ConceptEstimate[] = [];
  for (const code of orderedCodes) {
    const est = remaining.find((c) => c.nodeCode === code);
    if (est) orderedEstimates.push(est);
  }

  // Full sequence: mastered first (for tracking), then remaining in order
  const fullSequence = [
    ...mastered.map((c) => c.nodeCode),
    ...orderedCodes,
  ];

  // 8. Calculate totals
  const totalEstimatedHours = orderedEstimates.reduce(
    (sum, c) => sum + c.estimatedHours,
    0
  );
  const roundedHours = Math.round(totalEstimatedHours * 10) / 10;

  // 9. Generate weekly milestones
  const milestones = generateWeeklyMilestones(orderedEstimates, weeklyHoursAvailable);
  const weekCount = milestones.length;

  // 10. Calculate projected completion date
  const weeksToComplete = weeklyHoursAvailable > 0
    ? Math.ceil(totalEstimatedHours / weeklyHoursAvailable)
    : weekCount;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + weeksToComplete * 7);

  // Use target date if provided and later than projected
  const completionDate = targetDate && targetDate > projectedDate
    ? targetDate
    : projectedDate;

  console.log(
    `[PlanGenerator] ${roundedHours}h total, ${weekCount} weeks, ` +
    `projected: ${projectedDate.toISOString().split("T")[0]}`
  );

  // 11. Generate Claude narrative
  const narrative = await generatePlanNarrative(
    student.displayName,
    student.ageGroup as AgeGroupValue,
    student.avatarPersonaId,
    goal.name,
    conceptEstimates.length,
    mastered.length,
    remaining.length,
    roundedHours,
    weekCount,
    orderedEstimates.slice(0, 5).map((c) => c.title)
  );

  // 12. Save to database
  const plan = await prisma.learningPlan.create({
    data: {
      studentId,
      goalId,
      status: "ACTIVE",
      conceptSequence: fullSequence,
      totalEstimatedHours: roundedHours,
      hoursCompleted: 0,
      projectedCompletionDate: completionDate,
      targetCompletionDate: targetDate ?? null,
      weeklyMilestones: JSON.parse(JSON.stringify(milestones)),
      currentConceptIndex: mastered.length, // Start after mastered concepts
      velocityHoursPerWeek: weeklyHoursAvailable,
      isAheadOfSchedule: true,
      lastRecalculatedAt: new Date(),
    },
  });

  console.log(`[PlanGenerator] ✅ Plan created: ${plan.id}`);

  return {
    planId: plan.id,
    conceptSequence: fullSequence,
    totalEstimatedHours: roundedHours,
    projectedCompletionDate: completionDate,
    weeklyMilestones: milestones,
    narrative,
    conceptsAlreadyMastered: mastered.length,
    conceptsRemaining: remaining.length,
  };
}

// ─── Helper: Get Required Concepts for Goal ─────────────────────────────────

/**
 * Returns the full list of required concept nodes for a goal,
 * with their details from PostgreSQL.
 */
export async function getRequiredConceptsForGoal(
  goalId: string
): Promise<Array<{ nodeCode: string; title: string; difficulty: number; gradeLevel: string }>> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });
  if (!goal) return [];

  const nodes = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: goal.requiredNodeIds } },
    select: { nodeCode: true, title: true, difficulty: true, gradeLevel: true },
    orderBy: [{ gradeLevel: "asc" }, { difficulty: "asc" }],
  });

  return nodes;
}

// ─── Helper: Get Student Mastery Summary for Goal ───────────────────────────

/**
 * Returns mastery summary for a student-goal pair:
 * how many mastered, developing, novice, and overall progress.
 */
export async function getStudentMasteryForGoal(
  studentId: string,
  goalId: string
): Promise<{
  totalConcepts: number;
  mastered: number;
  developing: number;
  novice: number;
  overallProgress: number;
  masteryDetails: Array<{
    nodeCode: string;
    title: string;
    bktProbability: number;
    level: string;
  }>;
}> {
  const goal = await prisma.learningGoal.findUnique({
    where: { id: goalId },
  });
  if (!goal) {
    return { totalConcepts: 0, mastered: 0, developing: 0, novice: 0, overallProgress: 0, masteryDetails: [] };
  }

  const nodes = await prisma.knowledgeNode.findMany({
    where: { nodeCode: { in: goal.requiredNodeIds } },
    select: { id: true, nodeCode: true, title: true },
  });

  const nodeIds = nodes.map((n) => n.id);
  const nodeIdToInfo = new Map(nodes.map((n) => [n.id, { nodeCode: n.nodeCode, title: n.title }]));

  const scores = await prisma.masteryScore.findMany({
    where: { studentId, nodeId: { in: nodeIds } },
    select: { nodeId: true, bktProbability: true, level: true },
  });

  const scoreMap = new Map(scores.map((s) => [s.nodeId, s]));

  let mastered = 0;
  let developing = 0;
  let novice = 0;
  const details: Array<{
    nodeCode: string;
    title: string;
    bktProbability: number;
    level: string;
  }> = [];

  for (const node of nodes) {
    const score = scoreMap.get(node.id);
    const bkt = score?.bktProbability ?? 0;
    const level = score?.level ?? "NOVICE";

    if (bkt >= 0.85) mastered++;
    else if (bkt >= 0.5) developing++;
    else novice++;

    details.push({
      nodeCode: node.nodeCode,
      title: node.title,
      bktProbability: bkt,
      level,
    });
  }

  const totalConcepts = nodes.length;
  const overallProgress = totalConcepts > 0
    ? Math.round((mastered / totalConcepts) * 100)
    : 0;

  return {
    totalConcepts,
    mastered,
    developing,
    novice,
    overallProgress,
    masteryDetails: details,
  };
}

// ─── Helper: Get Active Plans for Student ───────────────────────────────────

export async function getActivePlansForStudent(
  studentId: string
): Promise<Array<{
  id: string;
  goalName: string;
  goalCategory: string;
  status: string;
  progress: number;
  totalEstimatedHours: number;
  hoursCompleted: number;
  projectedCompletionDate: Date;
  isAheadOfSchedule: boolean;
  conceptsTotal: number;
  currentConceptIndex: number;
}>> {
  const plans = await prisma.learningPlan.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { goal: true },
    orderBy: { createdAt: "desc" },
  });

  return plans.map((plan) => ({
    id: plan.id,
    goalName: plan.goal.name,
    goalCategory: plan.goal.category,
    status: plan.status,
    progress: plan.conceptSequence.length > 0
      ? Math.round((plan.currentConceptIndex / plan.conceptSequence.length) * 100)
      : 0,
    totalEstimatedHours: plan.totalEstimatedHours,
    hoursCompleted: plan.hoursCompleted,
    projectedCompletionDate: plan.projectedCompletionDate,
    isAheadOfSchedule: plan.isAheadOfSchedule,
    conceptsTotal: plan.conceptSequence.length,
    currentConceptIndex: plan.currentConceptIndex,
  }));
}

// ─── Helper: Get Next Concept in Plan ───────────────────────────────────────

/**
 * Returns the next concept the student should work on in their active plan.
 * Considers the concept sequence and current index.
 */
export async function getNextConceptInPlan(
  planId: string
): Promise<{
  nodeCode: string;
  title: string;
  description: string;
  estimatedHours: number;
  positionInPlan: number;
  totalInPlan: number;
} | null> {
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
  });
  if (!plan || plan.status !== "ACTIVE") return null;

  const idx = plan.currentConceptIndex;
  if (idx >= plan.conceptSequence.length) return null;

  const nodeCode = plan.conceptSequence[idx];
  const node = await prisma.knowledgeNode.findFirst({
    where: { nodeCode },
    select: { nodeCode: true, title: true, description: true, difficulty: true },
  });

  if (!node) return null;

  const estimatedHours = BASE_HOURS_BY_DIFFICULTY[node.difficulty] ?? 1.0;

  return {
    nodeCode: node.nodeCode,
    title: node.title,
    description: node.description,
    estimatedHours,
    positionInPlan: idx + 1,
    totalInPlan: plan.conceptSequence.length,
  };
}

// ─── Helper: Advance Plan After Concept Mastered ────────────────────────────

/**
 * Called when a student masters a concept. Advances the plan's current index
 * and updates hours completed.
 */
export async function advancePlanAfterMastery(
  planId: string,
  masteredNodeCode: string,
  sessionHours: number
): Promise<void> {
  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
  });
  if (!plan || plan.status !== "ACTIVE") return;

  // Find this concept in the sequence
  const idx = plan.conceptSequence.indexOf(masteredNodeCode);
  if (idx < 0) return;

  // Only advance if this is at or near the current index
  const newIndex = Math.max(plan.currentConceptIndex, idx + 1);
  const newHoursCompleted = plan.hoursCompleted + sessionHours;

  // Check if plan is complete
  const isComplete = newIndex >= plan.conceptSequence.length;

  await prisma.learningPlan.update({
    where: { id: planId },
    data: {
      currentConceptIndex: newIndex,
      hoursCompleted: newHoursCompleted,
      status: isComplete ? "COMPLETED" : "ACTIVE",
      lastRecalculatedAt: new Date(),
    },
  });

  if (isComplete) {
    console.log(`[PlanGenerator] 🎉 Plan ${planId} COMPLETED!`);
  } else {
    console.log(
      `[PlanGenerator] Plan ${planId} advanced to index ${newIndex}/${plan.conceptSequence.length}`
    );
  }
}
