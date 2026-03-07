/**
 * Grade Progression — Core Adaptive Loop
 *
 * Grades are checkpoints, not ceilings. A student can be Grade 7 Math
 * while still in Grade 5 ELA — each subject advances independently.
 *
 * After every topic mastery event, we check:
 * 1. Has the student mastered ALL nodes for their current grade in this subject?
 * 2. If yes → fire GRADE_COMPLETED event, show celebration, unlock next grade
 *
 * The "current grade" per subject is derived from the student's gradeLevel field
 * on the Student model. Future: per-subject grade tracking.
 */

import { prisma } from "@aauti/db";

// ─── Grade index utilities ───
const GRADE_ORDER = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];

function gradeIndex(grade: string): number {
  return GRADE_ORDER.indexOf(grade);
}

function nextGrade(grade: string): string | null {
  const idx = gradeIndex(grade);
  if (idx < 0 || idx >= GRADE_ORDER.length - 1) return null;
  return GRADE_ORDER[idx + 1];
}

export function gradeDisplayName(grade: string): string {
  if (grade === "K") return "Kindergarten";
  return `Grade ${grade.replace("G", "")}`;
}

// ─── Grade Completion Check ───

export interface GradeCompletionResult {
  isGradeComplete: boolean;
  totalNodes: number;
  masteredCount: number;
  /** Progress as 0-100 percentage */
  progressPercent: number;
  /** The grade that was checked */
  grade: string;
  /** Subject that was checked */
  subject: string;
  /** The next grade to unlock (null if at max) */
  nextGrade: string | null;
  /** Preview of upcoming topics in the next grade */
  upcomingTopics: string[];
}

/**
 * Check if a student has mastered all nodes for a specific grade + subject.
 *
 * Returns detailed progress info including next-grade preview.
 * Called after CONCEPT_MASTERED events to detect grade completion.
 */
export async function checkGradeCompletion(
  studentId: string,
  subject: string,
  grade: string
): Promise<GradeCompletionResult> {
  // Get all nodes for this grade + subject
  const allNodesForGrade = await prisma.knowledgeNode.findMany({
    where: {
      gradeLevel: grade as never,
      subject: subject as never,
    },
    select: { id: true, title: true },
  });

  if (allNodesForGrade.length === 0) {
    return {
      isGradeComplete: false,
      totalNodes: 0,
      masteredCount: 0,
      progressPercent: 0,
      grade,
      subject,
      nextGrade: nextGrade(grade),
      upcomingTopics: [],
    };
  }

  // Count how many are mastered (BKT ≥ 0.85)
  const masteredScores = await prisma.masteryScore.findMany({
    where: {
      studentId,
      nodeId: { in: allNodesForGrade.map((n) => n.id) },
      bktProbability: { gte: 0.85 },
    },
    select: { nodeId: true },
  });

  const masteredCount = masteredScores.length;
  const totalNodes = allNodesForGrade.length;
  const isGradeComplete = masteredCount >= totalNodes && totalNodes > 0;
  const progressPercent = totalNodes > 0 ? Math.round((masteredCount / totalNodes) * 100) : 0;

  // Preview topics for the next grade
  const next = nextGrade(grade);
  let upcomingTopics: string[] = [];
  if (next) {
    const nextGradeNodes = await prisma.knowledgeNode.findMany({
      where: {
        gradeLevel: next as never,
        subject: subject as never,
      },
      select: { title: true },
      orderBy: { difficulty: "asc" },
      take: 4,
    });
    upcomingTopics = nextGradeNodes.map((n) => n.title);
  }

  return {
    isGradeComplete,
    totalNodes,
    masteredCount,
    progressPercent,
    grade,
    subject,
    nextGrade: next,
    upcomingTopics,
  };
}

// ─── Grade Progress for Multiple Grades ───

export interface GradeBandProgress {
  grade: string;
  gradeDisplay: string;
  subject: string;
  totalNodes: number;
  masteredCount: number;
  progressPercent: number;
  isComplete: boolean;
  /** Whether student has access (current grade or below, or completed) */
  isUnlocked: boolean;
}

/**
 * Get grade-band progress for a student across all grades in a subject.
 * Used for the topic tree / curriculum map display.
 *
 * Returns grades from K through student's grade + LOOKAHEAD, marking
 * locked/unlocked status.
 */
export async function getGradeBandProgress(
  studentId: string,
  subject: string,
  studentGrade: string
): Promise<GradeBandProgress[]> {
  const studentIdx = gradeIndex(studentGrade);
  const maxIdx = Math.min(studentIdx + 2, GRADE_ORDER.length - 1); // show up to +2

  const bands: GradeBandProgress[] = [];

  for (let i = 0; i <= maxIdx; i++) {
    const grade = GRADE_ORDER[i];

    // Count total and mastered nodes for this grade + subject
    const [totalNodes, masteredCount] = await Promise.all([
      prisma.knowledgeNode.count({
        where: { gradeLevel: grade as never, subject: subject as never },
      }),
      prisma.masteryScore.count({
        where: {
          studentId,
          node: { gradeLevel: grade as never, subject: subject as never },
          bktProbability: { gte: 0.85 },
        },
      }),
    ]);

    const isComplete = masteredCount >= totalNodes && totalNodes > 0;
    const isUnlocked = i <= studentIdx + 2; // Student can access up to 2 grades ahead

    bands.push({
      grade,
      gradeDisplay: gradeDisplayName(grade),
      subject,
      totalNodes,
      masteredCount,
      progressPercent: totalNodes > 0 ? Math.round((masteredCount / totalNodes) * 100) : 0,
      isComplete,
      isUnlocked,
    });
  }

  return bands;
}
