/**
 * Insights Engine — Phase 9: Parent Dashboard
 *
 * Data-driven insights for parent dashboard.
 * Analyzes session patterns, mastery velocity, emotional health,
 * and attention trends to surface actionable cards.
 */

import { prisma } from "@aauti/db";

// ─── Types ───

export type InsightPriority = "HIGH" | "MEDIUM" | "LOW";
export type TrendDirection = "accelerating" | "steady" | "slowing";

export interface BestLearningTime {
  dayOfWeek: string;
  hourOfDay: number;
  avgAccuracy: number;
  sessionCount: number;
}

export interface LearningVelocity {
  nodesPerWeek: number;
  trend: TrendDirection;
  currentWeekNodes: number;
  previousWeekNodes: number;
}

export interface AttentionSpanTrend {
  avgSessionMinutes: number;
  trend: TrendDirection;
  recommendation: string;
}

export interface EmotionalHealthScore {
  score: number; // 0-100
  dominantState: string;
  interventionRate: number; // 0-1
  frustrationRate: number; // 0-1
  engagementRate: number; // 0-1
}

export interface InsightCard {
  title: string;
  description: string;
  metric: string;
  trend: TrendDirection | "positive" | "negative" | "neutral";
  recommendation: string;
  priority: InsightPriority;
}

// ─── Constants ───

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMOTIONAL_WEIGHTS: Record<string, number> = {
  ENGAGED: 1.0,
  EXCITED: 1.0,
  BREAKTHROUGH: 1.0,
  NEUTRAL: 0.6,
  CONFUSED: 0.3,
  ANXIOUS: 0.2,
  BORED: 0.2,
  FRUSTRATED: 0.0,
};

// ─── Best Learning Time ───

// Timezone offset in hours from UTC for display purposes.
// Default: US Eastern (UTC-5). Server stores timestamps in UTC;
// we shift to approximate the student's local time.
const TZ_OFFSET_HOURS = -5;

/**
 * Analyze session start times vs accuracy to find optimal learning windows.
 * Applies a timezone offset to convert UTC timestamps to approximate local time.
 */
export async function getBestLearningTime(
  studentId: string
): Promise<BestLearningTime> {
  const sessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      state: "COMPLETED",
      questionsAnswered: { gte: 1 },
    },
    select: {
      startedAt: true,
      questionsAnswered: true,
      correctAnswers: true,
    },
    orderBy: { startedAt: "desc" },
    take: 50, // Last 50 sessions
  });

  if (sessions.length === 0) {
    return {
      dayOfWeek: "Monday",
      hourOfDay: 16,
      avgAccuracy: 0,
      sessionCount: 0,
    };
  }

  // Group by day+hour and calculate average accuracy
  // Apply timezone offset to convert UTC → approximate local time
  const buckets: Record<string, { total: number; correct: number; count: number }> = {};

  for (const s of sessions) {
    const localDate = new Date(s.startedAt.getTime() + TZ_OFFSET_HOURS * 60 * 60 * 1000);
    const day = localDate.getUTCDay();
    const hour = localDate.getUTCHours();
    const key = `${day}-${hour}`;

    if (!buckets[key]) {
      buckets[key] = { total: 0, correct: 0, count: 0 };
    }
    buckets[key].total += s.questionsAnswered;
    buckets[key].correct += s.correctAnswers;
    buckets[key].count++;
  }

  // Find best bucket (min 2 sessions for statistical significance)
  let bestKey = "";
  let bestAccuracy = 0;

  for (const [key, data] of Object.entries(buckets)) {
    if (data.count < 2) continue;
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      bestKey = key;
    }
  }

  // Fallback to most frequent time if no bucket has 2+ sessions
  if (!bestKey) {
    let maxCount = 0;
    for (const [key, data] of Object.entries(buckets)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        bestKey = key;
        bestAccuracy = data.total > 0 ? data.correct / data.total : 0;
      }
    }
  }

  if (!bestKey) {
    return {
      dayOfWeek: "Monday",
      hourOfDay: 16,
      avgAccuracy: 0,
      sessionCount: 0,
    };
  }

  const [dayStr, hourStr] = bestKey.split("-");
  return {
    dayOfWeek: DAY_NAMES[parseInt(dayStr)],
    hourOfDay: parseInt(hourStr),
    avgAccuracy: Math.round(bestAccuracy * 100) / 100,
    sessionCount: buckets[bestKey].count,
  };
}

// ─── Learning Velocity ───

/**
 * Calculate nodes mastered per week and detect trend.
 */
export async function getLearningVelocity(
  studentId: string
): Promise<LearningVelocity> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [currentWeek, previousWeek] = await Promise.all([
    prisma.masteryScore.count({
      where: {
        studentId,
        level: "MASTERED",
        lastPracticed: { gte: oneWeekAgo },
      },
    }),
    prisma.masteryScore.count({
      where: {
        studentId,
        level: "MASTERED",
        lastPracticed: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    }),
  ]);

  const trend = calculateTrend(currentWeek, previousWeek);
  const avg = (currentWeek + previousWeek) / 2;

  return {
    nodesPerWeek: Math.round(avg * 10) / 10,
    trend,
    currentWeekNodes: currentWeek,
    previousWeekNodes: previousWeek,
  };
}

// ─── Attention Span Trend ───

/**
 * Analyze average session duration and detect trends.
 */
export async function getAttentionSpanTrend(
  studentId: string
): Promise<AttentionSpanTrend> {
  const twoWeeksAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000
  );
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentSessions, olderSessions] = await Promise.all([
    prisma.learningSession.findMany({
      where: {
        studentId,
        state: "COMPLETED",
        startedAt: { gte: oneWeekAgo },
        durationSeconds: { gt: 0, lte: 7200 }, // Skip bad data (>120 min)
      },
      select: { durationSeconds: true },
    }),
    prisma.learningSession.findMany({
      where: {
        studentId,
        state: "COMPLETED",
        startedAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        durationSeconds: { gt: 0, lte: 7200 }, // Skip bad data (>120 min)
      },
      select: { durationSeconds: true },
    }),
  ]);

  const recentAvg = average(recentSessions.map((s) => s.durationSeconds / 60));
  const olderAvg = average(olderSessions.map((s) => s.durationSeconds / 60));
  const overallAvg = recentAvg || olderAvg || 0;

  const trend = calculateTrend(recentAvg, olderAvg);

  let recommendation: string;
  if (overallAvg < 10) {
    recommendation =
      "Sessions are quite short. Try setting a 15-minute timer for focused learning.";
  } else if (overallAvg > 30) {
    recommendation =
      "Great focus! Consider adding short breaks to maintain energy.";
  } else if (trend === "slowing") {
    recommendation =
      "Session times are decreasing. Shorter, more frequent sessions may help.";
  } else {
    recommendation =
      "Session length is healthy. Keep up the consistent practice!";
  }

  return {
    avgSessionMinutes: Math.round(overallAvg * 10) / 10,
    trend,
    recommendation,
  };
}

// ─── Emotional Health Score ───

/**
 * Calculate emotional health score from emotional logs.
 * Score 0-100, where 100 = consistently engaged/excited.
 */
export async function getEmotionalHealthScore(
  studentId: string
): Promise<EmotionalHealthScore> {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const logs = await prisma.emotionalLog.findMany({
    where: {
      studentId,
      timestamp: { gte: twoWeeksAgo },
    },
    select: {
      detectedState: true,
      triggeredAdaptation: true,
    },
  });

  if (logs.length === 0) {
    return {
      score: 75, // Default neutral score
      dominantState: "NEUTRAL",
      interventionRate: 0,
      frustrationRate: 0,
      engagementRate: 0,
    };
  }

  // Count states
  const stateCounts: Record<string, number> = {};
  let adaptationCount = 0;

  for (const log of logs) {
    const state = log.detectedState;
    stateCounts[state] = (stateCounts[state] || 0) + 1;
    if (log.triggeredAdaptation) adaptationCount++;
  }

  // Dominant state
  let dominantState = "NEUTRAL";
  let maxCount = 0;
  for (const [state, count] of Object.entries(stateCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantState = state;
    }
  }

  // Calculate weighted score
  let weightedSum = 0;
  for (const [state, count] of Object.entries(stateCounts)) {
    weightedSum += (EMOTIONAL_WEIGHTS[state] ?? 0.5) * count;
  }
  const score = Math.round((weightedSum / logs.length) * 100);

  const frustrationRate =
    (stateCounts["FRUSTRATED"] || 0) / logs.length;
  const engagementRate =
    ((stateCounts["ENGAGED"] || 0) + (stateCounts["EXCITED"] || 0)) /
    logs.length;

  return {
    score: Math.min(100, Math.max(0, score)),
    dominantState,
    interventionRate: Math.round((adaptationCount / logs.length) * 100) / 100,
    frustrationRate: Math.round(frustrationRate * 100) / 100,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
}

// ─── Insight Cards Generator ───

/**
 * Generate 3-5 actionable insight cards for parent dashboard.
 */
export async function generateInsightCards(
  studentId: string
): Promise<InsightCard[]> {
  const [learningTime, velocity, attention, emotional] = await Promise.all([
    getBestLearningTime(studentId),
    getLearningVelocity(studentId),
    getAttentionSpanTrend(studentId),
    getEmotionalHealthScore(studentId),
  ]);

  const cards: InsightCard[] = [];

  // 1. Learning velocity card
  if (velocity.currentWeekNodes > 0 || velocity.previousWeekNodes > 0) {
    cards.push({
      title: "Learning Pace",
      description:
        velocity.trend === "accelerating"
          ? `Mastering concepts faster! ${velocity.currentWeekNodes} nodes this week vs ${velocity.previousWeekNodes} last week.`
          : velocity.trend === "slowing"
            ? `Learning pace has slowed. ${velocity.currentWeekNodes} nodes this week vs ${velocity.previousWeekNodes} last week.`
            : `Steady learning pace — ${velocity.nodesPerWeek} nodes per week on average.`,
      metric: `${velocity.nodesPerWeek} nodes/week`,
      trend: velocity.trend,
      recommendation:
        velocity.trend === "slowing"
          ? "Try shorter, more frequent sessions to rebuild momentum."
          : "Great pace! Consistent practice is the key to lasting mastery.",
      priority: velocity.trend === "slowing" ? "HIGH" : "LOW",
    });
  }

  // 2. Emotional health card (only show when there's real data)
  if (emotional.engagementRate > 0 || emotional.frustrationRate > 0) cards.push({
    title: "Emotional Wellness",
    description:
      emotional.score >= 70
        ? `Positive learning experience — ${emotional.engagementRate * 100}% engagement rate.`
        : emotional.score >= 40
          ? `Some struggles detected. Frustration rate: ${emotional.frustrationRate * 100}%.`
          : `High stress detected. ${emotional.frustrationRate * 100}% frustration rate needs attention.`,
    metric: `${emotional.score}/100`,
    trend: emotional.score >= 70 ? "positive" : emotional.score >= 40 ? "neutral" : "negative",
    recommendation:
      emotional.frustrationRate > 0.3
        ? "Consider encouraging breaks when frustrated. The tutor adapts automatically, but your support helps too."
        : "Your child is learning in a positive emotional state. Keep it up!",
    priority: emotional.score < 40 ? "HIGH" : emotional.score < 70 ? "MEDIUM" : "LOW",
  });

  // 3. Best learning time card
  if (learningTime.sessionCount > 0) {
    const hour = learningTime.hourOfDay;
    // Sanity check: if calculated best time is late night (10 PM - 6 AM),
    // show a general "Evenings" label instead of a specific odd hour
    const isLateNight = hour < 7 || hour >= 20;
    const hourLabel = isLateNight ? "Evenings" : formatHour(hour);
    const dayLabel = learningTime.dayOfWeek;
    const metricLabel = isLateNight ? `${dayLabel} evenings` : `${dayLabel} ${hourLabel}`;
    const descTime = isLateNight
      ? `evenings on ${dayLabel}s`
      : `${dayLabel}s around ${hourLabel}`;

    cards.push({
      title: "Best Study Time",
      description: `Peak performance ${descTime} with ${Math.round(learningTime.avgAccuracy * 100)}% accuracy.`,
      metric: metricLabel,
      trend: "positive",
      recommendation: isLateNight
        ? `Best results on ${dayLabel} evenings. Based on recent activity patterns.`
        : `Try scheduling study sessions on ${dayLabel}s around ${hourLabel} for the best results.`,
      priority: "MEDIUM",
    });
  }

  // 4. Attention span card
  if (attention.avgSessionMinutes > 0) {
    cards.push({
      title: "Focus & Attention",
      description: `Average session length: ${attention.avgSessionMinutes} minutes. Trend: ${attention.trend}.`,
      metric: `${attention.avgSessionMinutes} min`,
      trend: attention.trend,
      recommendation: attention.recommendation,
      priority: attention.trend === "slowing" ? "MEDIUM" : "LOW",
    });
  }

  // 5. Streak motivation card (if available)
  const streak = await prisma.streakData.findUnique({
    where: { studentId },
  });
  if (streak && streak.currentStreak > 0) {
    cards.push({
      title: "Streak Momentum",
      description: `${streak.currentStreak}-day learning streak! Longest ever: ${streak.longestStreak} days.`,
      metric: `${streak.currentStreak} days`,
      trend: streak.currentStreak >= streak.longestStreak ? "positive" : "steady",
      recommendation:
        streak.currentStreak >= 7
          ? "Amazing consistency! Streaks build habits that last."
          : "Encourage daily practice to build a strong streak.",
      priority: "LOW",
    });
  }

  // Sort by priority
  const priorityOrder: Record<InsightPriority, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };
  cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return cards.slice(0, 5);
}

// ─── Helpers ───

export function calculateTrend(
  current: number,
  previous: number
): TrendDirection {
  if (previous === 0 && current === 0) return "steady";
  if (previous === 0) return "accelerating";
  const change = (current - previous) / previous;
  if (change > 0.15) return "accelerating";
  if (change < -0.15) return "slowing";
  return "steady";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
