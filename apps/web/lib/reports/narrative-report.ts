/**
 * Weekly Narrative Report — Phase 9: Parent Dashboard
 *
 * Claude-generated weekly summary for parents.
 * Fetches all learning data for the week and builds a warm,
 * parent-friendly narrative about the child's progress.
 */

import { prisma } from "@aauti/db";
import { callClaude } from "../session/claude-client";
import { getEmotionalHealthScore } from "./insights";

// ─── Types ───

export interface WeeklyReportData {
  id: string;
  studentId: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  reportText: string;
  stats: WeeklyStats;
  generatedAt: string;
  viewedAt: string | null;
}

export interface WeeklyStats {
  totalSessions: number;
  totalTimeMinutes: number;
  questionsAnswered: number;
  overallAccuracy: number; // 0-1
  nodesMastered: number;
  nodesInProgress: number;
  streakDays: number;
  badgesEarned: number;
  bossCompleted: number;
  emotionalScore: number; // 0-100
  dominantEmotion: string;
}

export interface WeekRange {
  start: Date;
  end: Date;
}

// ─── Week Calculation ───

/**
 * Get the Monday-Sunday week range for a given date.
 */
export function getWeekRange(date: Date): WeekRange {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Get the previous week's range.
 */
export function getPreviousWeekRange(date: Date): WeekRange {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return getWeekRange(d);
}

// ─── Data Fetching ───

/**
 * Gather all learning data for a student's week.
 */
export async function gatherWeeklyData(
  studentId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyStats> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { streakData: true },
  });

  // Sessions this week
  const sessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      startedAt: { gte: weekStart, lte: weekEnd },
      state: "COMPLETED",
    },
    select: {
      durationSeconds: true,
      questionsAnswered: true,
      correctAnswers: true,
      sessionType: true,
    },
  });

  // Nodes mastered this week
  const masteredThisWeek = await prisma.masteryScore.count({
    where: {
      studentId,
      level: "MASTERED",
      lastPracticed: { gte: weekStart, lte: weekEnd },
    },
  });

  // Nodes in progress
  const inProgress = await prisma.masteryScore.count({
    where: {
      studentId,
      level: { in: ["DEVELOPING", "PROFICIENT", "ADVANCED"] },
      lastPracticed: { gte: weekStart, lte: weekEnd },
    },
  });

  // Badges earned this week
  const badgesCount = await prisma.badge.count({
    where: {
      studentId,
      earnedAt: { gte: weekStart, lte: weekEnd },
    },
  });

  // Boss challenges completed
  const bossCount = await prisma.bossChallenge.count({
    where: {
      studentId,
      status: "COMPLETED",
      completedAt: { gte: weekStart, lte: weekEnd },
    },
  });

  // Emotional health
  const emotionalHealth = await getEmotionalHealthScore(studentId);

  // Aggregate session stats
  const totalTime = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalQuestions = sessions.reduce(
    (sum, s) => sum + s.questionsAnswered,
    0
  );
  const totalCorrect = sessions.reduce(
    (sum, s) => sum + s.correctAnswers,
    0
  );

  return {
    totalSessions: sessions.length,
    totalTimeMinutes: Math.round(totalTime / 60),
    questionsAnswered: totalQuestions,
    overallAccuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
    nodesMastered: masteredThisWeek,
    nodesInProgress: inProgress,
    streakDays: student?.streakData?.currentStreak ?? 0,
    badgesEarned: badgesCount,
    bossCompleted: bossCount,
    emotionalScore: emotionalHealth.score,
    dominantEmotion: emotionalHealth.dominantState,
  };
}

// ─── Claude Prompt Builder ───

/**
 * Build the Claude prompt for narrative report generation.
 */
export function buildReportPrompt(
  studentName: string,
  stats: WeeklyStats,
  topStrengths: string[],
  areasToImprove: string[],
  weekLabel: string
): string {
  return `You are writing a weekly learning report for a parent about their child's progress.
The tone should be: warm, specific, encouraging, non-technical. Write like a caring teacher — not a data analyst.
Use the child's name throughout. Keep it to 3-4 paragraphs, approximately 200 words total.

STUDENT: ${studentName}
WEEK: ${weekLabel}

THIS WEEK'S DATA:
- Sessions completed: ${stats.totalSessions}
- Total practice time: ${stats.totalTimeMinutes} minutes
- Questions answered: ${stats.questionsAnswered}
- Overall accuracy: ${Math.round(stats.overallAccuracy * 100)}%
- Concepts mastered: ${stats.nodesMastered}
- Concepts in progress: ${stats.nodesInProgress}
- Learning streak: ${stats.streakDays} days
- Badges earned: ${stats.badgesEarned}
- Boss challenges completed: ${stats.bossCompleted}
- Emotional wellness score: ${stats.emotionalScore}/100
- Dominant emotional state: ${stats.dominantEmotion}

STRONGEST AREAS: ${topStrengths.length > 0 ? topStrengths.join(", ") : "Still exploring!"}
AREAS NEEDING WORK: ${areasToImprove.length > 0 ? areasToImprove.join(", ") : "No specific areas of concern"}

FORMAT:
Paragraph 1 — Highlight the week's biggest achievement or milestone
Paragraph 2 — What concepts were practiced and what was mastered
Paragraph 3 — Where the child struggled and how they responded (focus on resilience)
Paragraph 4 — Looking ahead: areas to encourage and what's coming next

IMPORTANT: Write for parents, not educators. Avoid jargon. Be specific and personal.
Do NOT use bullet points — write flowing prose.`;
}

// ─── Report Generation ───

/**
 * Generate a weekly narrative report for a student.
 */
export async function buildWeeklyReport(
  studentId: string,
  weekStartDate?: Date
): Promise<WeeklyReportData | null> {
  const targetDate = weekStartDate ?? new Date();
  const { start, end } = getWeekRange(targetDate);

  // Check if report already exists
  const existing = await prisma.weeklyReport.findUnique({
    where: {
      studentId_weekStart: {
        studentId,
        weekStart: start,
      },
    },
  });

  if (existing) {
    return formatReport(existing);
  }

  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) return null;

  // Gather data
  const stats = await gatherWeeklyData(studentId, start, end);

  // Get top strengths and weaknesses
  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId, practiceCount: { gte: 1 } },
    include: { node: true },
    orderBy: { bktProbability: "desc" },
  });

  const topStrengths = masteryScores
    .slice(0, 3)
    .map((m) => m.node.title);

  const areasToImprove = [...masteryScores]
    .sort((a, b) => a.bktProbability - b.bktProbability)
    .slice(0, 3)
    .filter((m) => m.bktProbability < 0.7)
    .map((m) => m.node.title);

  const weekLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Generate report text via Claude
  const prompt = buildReportPrompt(
    student.displayName,
    stats,
    topStrengths,
    areasToImprove,
    weekLabel
  );

  let reportText = await callClaude(prompt);

  // Fallback if Claude is unavailable
  if (!reportText) {
    reportText = buildFallbackReport(student.displayName, stats, weekLabel);
  }

  // Save to DB
  const report = await prisma.weeklyReport.create({
    data: {
      studentId,
      weekStart: start,
      weekEnd: end,
      reportText,
      stats: JSON.parse(JSON.stringify(stats)),
    },
  });

  return formatReport(report);
}

/**
 * Get the latest report for a student.
 */
export async function getLatestReport(
  studentId: string
): Promise<WeeklyReportData | null> {
  const report = await prisma.weeklyReport.findFirst({
    where: { studentId },
    orderBy: { weekStart: "desc" },
  });

  if (!report) return null;
  return formatReport(report);
}

/**
 * Get a report for a specific week.
 */
export async function getReportForWeek(
  studentId: string,
  weekStart: Date
): Promise<WeeklyReportData | null> {
  const { start } = getWeekRange(weekStart);

  const report = await prisma.weeklyReport.findUnique({
    where: {
      studentId_weekStart: {
        studentId,
        weekStart: start,
      },
    },
  });

  if (!report) return null;
  return formatReport(report);
}

/**
 * List all reports for a student (newest first).
 */
export async function listReports(
  studentId: string,
  limit: number = 10
): Promise<WeeklyReportData[]> {
  const reports = await prisma.weeklyReport.findMany({
    where: { studentId },
    orderBy: { weekStart: "desc" },
    take: limit,
  });

  return reports.map(formatReport);
}

/**
 * Mark a report as viewed.
 */
export async function markReportViewed(reportId: string): Promise<void> {
  await prisma.weeklyReport.update({
    where: { id: reportId },
    data: { viewedAt: new Date() },
  });
}

// ─── Helpers ───

function formatReport(report: {
  id: string;
  studentId: string;
  weekStart: Date;
  weekEnd: Date;
  reportText: string;
  stats: unknown;
  generatedAt: Date;
  viewedAt: Date | null;
}): WeeklyReportData {
  return {
    id: report.id,
    studentId: report.studentId,
    weekStart: report.weekStart.toISOString().split("T")[0],
    weekEnd: report.weekEnd.toISOString().split("T")[0],
    reportText: report.reportText,
    stats: report.stats as WeeklyStats,
    generatedAt: report.generatedAt.toISOString(),
    viewedAt: report.viewedAt?.toISOString() ?? null,
  };
}

function buildFallbackReport(
  studentName: string,
  stats: WeeklyStats,
  weekLabel: string
): string {
  const accuracy = Math.round(stats.overallAccuracy * 100);

  if (stats.totalSessions === 0) {
    return `${studentName} didn't have any learning sessions this week (${weekLabel}). That's okay — sometimes we all need a break! When ${studentName} is ready, the constellation awaits with new concepts to explore. Even a short 10-minute session can make a big difference.`;
  }

  return `This week (${weekLabel}), ${studentName} showed great dedication with ${stats.totalSessions} learning sessions totaling ${stats.totalTimeMinutes} minutes of focused practice. ${studentName} answered ${stats.questionsAnswered} questions with an impressive ${accuracy}% accuracy rate${stats.nodesMastered > 0 ? ` and mastered ${stats.nodesMastered} new concept${stats.nodesMastered > 1 ? "s" : ""}` : ""}.

${stats.streakDays > 0 ? `${studentName} maintained a ${stats.streakDays}-day learning streak, showing wonderful consistency. ` : ""}${stats.badgesEarned > 0 ? `${stats.badgesEarned} new badge${stats.badgesEarned > 1 ? "s were" : " was"} earned along the way! ` : ""}Keep encouraging ${studentName} to explore new concepts at their own pace — the journey of learning is just as important as the destination.`;
}
