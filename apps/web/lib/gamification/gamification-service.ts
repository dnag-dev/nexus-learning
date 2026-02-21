/**
 * Gamification Service — Phase 7: Real Data Wiring
 *
 * Central service that processes gamification events and updates the database.
 * Called from API routes when sessions complete, answers are submitted, etc.
 *
 * Handles:
 *  - XP awards → Student.xp / Student.level
 *  - Streak updates → StreakData
 *  - Badge checks → Badge table
 *  - Boss challenge unlocks → BossChallenge table
 *  - Event bus emissions
 */

import { prisma } from "@aauti/db";
import { awardXP, type XPSource } from "./xp";
import {
  updateDailyStreak,
  isPerfectSession,
  isSpeedSession,
  isComeback,
  getFreezesEarned,
  addFreezes,
  getToday,
  daysBetween,
  type StreakStatus,
} from "./streak";
import {
  checkMasteryBadges,
  checkSessionBadges,
  checkBossBadges,
  checkTimeOfDayBadge,
  checkStreakBadge,
  getBadgeById,
  type BadgeCheckResult,
} from "./badges";
import { getEventBus, createEvent } from "./event-bus";

// ─── Types ───

export interface GamificationResult {
  xpAwarded: number;
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
  newTitle: string | null;
  streakUpdate: {
    newCurrent: number;
    newLongest: number;
    milestoneReached: boolean;
    milestoneLabel: string | null;
    streakBroken: boolean;
    freezeUsed: boolean;
  } | null;
  badgesEarned: Array<{
    badgeId: string;
    name: string;
    icon: string;
    xpReward: number;
  }>;
}

// ─── Core: Process correct answer ───

export async function processCorrectAnswer(
  studentId: string,
  nodeCode: string,
  nodeTitle: string
): Promise<{ xpAwarded: number; newXP: number }> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  const result = awardXP(student.xp, student.level, "correct_answer");

  await prisma.student.update({
    where: { id: studentId },
    data: { xp: result.newXP, level: result.newLevel },
  });

  const bus = getEventBus();
  bus.fire(createEvent("correct_answer", studentId, { nodeCode, nodeTitle, xpAwarded: result.xpAwarded }));

  if (result.leveledUp) {
    bus.fire(createEvent("level_up", studentId, {
      newLevel: result.newLevel,
      newTitle: result.newTitle,
    }));
  }

  return { xpAwarded: result.xpAwarded, newXP: result.newXP };
}

// ─── Core: Process node mastered ───

export async function processNodeMastered(
  studentId: string,
  nodeCode: string,
  nodeTitle: string
): Promise<GamificationResult> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  // Award mastery XP
  const xpResult = awardXP(student.xp, student.level, "node_mastered");

  await prisma.student.update({
    where: { id: studentId },
    data: { xp: xpResult.newXP, level: xpResult.newLevel },
  });

  const bus = getEventBus();
  bus.fire(createEvent("node_mastered", studentId, { nodeCode, nodeTitle }));

  if (xpResult.leveledUp) {
    bus.fire(createEvent("level_up", studentId, {
      newLevel: xpResult.newLevel,
      newTitle: xpResult.newTitle,
    }));
  }

  // Check mastery badges
  const masteredCount = await prisma.masteryScore.count({
    where: { studentId, level: "MASTERED" },
  });

  const earnedBadges = await prisma.badge.findMany({ where: { studentId } });
  const earnedSet = new Set(earnedBadges.map((b) => b.badgeType));
  const newMasteryBadges = checkMasteryBadges(masteredCount, earnedSet);

  const badgesEarned = await awardBadges(studentId, newMasteryBadges, xpResult.newXP, xpResult.newLevel);

  // Emit star lit event
  bus.fire(createEvent("constellation_star_lit", studentId, { nodeCode, nodeTitle }));

  return {
    xpAwarded: xpResult.xpAwarded,
    newXP: xpResult.newXP + badgesEarned.reduce((sum, b) => sum + b.xpReward, 0),
    newLevel: xpResult.newLevel,
    leveledUp: xpResult.leveledUp,
    newTitle: xpResult.newTitle,
    streakUpdate: null,
    badgesEarned,
  };
}

// ─── Core: Process session complete ───

export async function processSessionComplete(
  studentId: string,
  sessionId: string
): Promise<GamificationResult> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { currentNode: true },
  });
  if (!session) throw new Error("Session not found");

  const bus = getEventBus();
  let totalXpAwarded = 0;
  const allBadgesEarned: Array<{ badgeId: string; name: string; icon: string; xpReward: number }> = [];

  // 1. Award session complete XP
  let currentXP = student.xp;
  let currentLevel = student.level;

  const sessionXP = awardXP(currentXP, currentLevel, "session_complete");
  currentXP = sessionXP.newXP;
  currentLevel = sessionXP.newLevel;
  totalXpAwarded += sessionXP.xpAwarded;

  bus.fire(createEvent("session_complete", studentId, { sessionId }));

  if (sessionXP.leveledUp) {
    bus.fire(createEvent("level_up", studentId, {
      newLevel: sessionXP.newLevel,
      newTitle: sessionXP.newTitle,
    }));
  }

  // 2. Check perfect session
  const perfect = isPerfectSession(
    session.questionsAnswered,
    session.correctAnswers,
    session.hintsUsed
  );

  if (perfect && session.questionsAnswered > 0) {
    const perfectXP = awardXP(currentXP, currentLevel, "perfect_session");
    currentXP = perfectXP.newXP;
    currentLevel = perfectXP.newLevel;
    totalXpAwarded += perfectXP.xpAwarded;

    bus.fire(createEvent("perfect_session", studentId, { sessionId }));
  }

  // 3. Update streak
  const streakUpdate = await updateStreakInDB(studentId);

  if (streakUpdate && streakUpdate.milestoneReached) {
    const milestoneXP = awardXP(currentXP, currentLevel, "streak_milestone", streakUpdate.milestoneXpReward);
    currentXP = milestoneXP.newXP;
    currentLevel = milestoneXP.newLevel;
    totalXpAwarded += milestoneXP.xpAwarded;

    bus.fire(createEvent("streak_milestone", studentId, {
      streakCount: streakUpdate.newCurrent,
      milestoneLabel: streakUpdate.milestoneLabel,
    }));

    // Check streak badge
    if (streakUpdate.milestoneBadgeType) {
      const earnedBadges = await prisma.badge.findMany({ where: { studentId } });
      const earnedSet = new Set(earnedBadges.map((b) => b.badgeType));
      const streakBadge = checkStreakBadge(streakUpdate.milestoneBadgeType, earnedSet);
      if (streakBadge) {
        const badges = await awardBadges(studentId, [streakBadge], currentXP, currentLevel);
        allBadgesEarned.push(...badges);
        currentXP += badges.reduce((sum, b) => sum + b.xpReward, 0);
      }
    }
  }

  // 4. Check session count badges
  const totalSessions = await prisma.learningSession.count({
    where: { studentId, state: "COMPLETED" },
  });

  const earnedBadges = await prisma.badge.findMany({ where: { studentId } });
  const earnedSet = new Set(earnedBadges.map((b) => b.badgeType));
  const sessionBadges = checkSessionBadges(totalSessions, earnedSet);
  const newSessionBadges = await awardBadges(studentId, sessionBadges, currentXP, currentLevel);
  allBadgesEarned.push(...newSessionBadges);
  currentXP += newSessionBadges.reduce((sum, b) => sum + b.xpReward, 0);

  // 5. Check time-of-day badge
  const hour = new Date().getHours();
  const refreshedEarned = new Set([...earnedSet, ...allBadgesEarned.map(b => b.badgeId)]);
  const todBadge = checkTimeOfDayBadge(hour, refreshedEarned);
  if (todBadge) {
    const todBadges = await awardBadges(studentId, [todBadge], currentXP, currentLevel);
    allBadgesEarned.push(...todBadges);
    currentXP += todBadges.reduce((sum, b) => sum + b.xpReward, 0);
  }

  // 6. Check perfect session badge
  if (perfect && !refreshedEarned.has("perfect_session")) {
    const perfBadge = getBadgeById("perfect_session");
    if (perfBadge) {
      const perfBadges = await awardBadges(
        studentId,
        [{ earned: true, badgeId: "perfect_session", badge: perfBadge }],
        currentXP,
        currentLevel
      );
      allBadgesEarned.push(...perfBadges);
      currentXP += perfBadges.reduce((sum, b) => sum + b.xpReward, 0);
    }
  }

  // 7. Final DB update with accumulated XP
  const finalLevelInfo = awardXP(0, 1, "correct_answer", 0); // Just for level calc
  await prisma.student.update({
    where: { id: studentId },
    data: { xp: currentXP, level: currentLevel },
  });

  return {
    xpAwarded: totalXpAwarded + allBadgesEarned.reduce((sum, b) => sum + b.xpReward, 0),
    newXP: currentXP,
    newLevel: currentLevel,
    leveledUp: currentLevel > student.level,
    newTitle: currentLevel > student.level ? sessionXP.newTitle : null,
    streakUpdate: streakUpdate
      ? {
          newCurrent: streakUpdate.newCurrent,
          newLongest: streakUpdate.newLongest,
          milestoneReached: streakUpdate.milestoneReached,
          milestoneLabel: streakUpdate.milestoneLabel,
          streakBroken: streakUpdate.streakBroken,
          freezeUsed: streakUpdate.freezeUsed,
        }
      : null,
    badgesEarned: allBadgesEarned,
  };
}

// ─── DB Helpers ───

async function updateStreakInDB(studentId: string): Promise<{
  newCurrent: number;
  newLongest: number;
  milestoneReached: boolean;
  milestoneLabel: string | null;
  milestoneXpReward: number;
  milestoneBadgeType: string | null;
  streakBroken: boolean;
  freezeUsed: boolean;
} | null> {
  // Get or create streak data
  let streakData = await prisma.streakData.findUnique({
    where: { studentId },
  });

  if (!streakData) {
    streakData = await prisma.streakData.create({
      data: {
        studentId,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(0), // Force first day to count
        totalDaysActive: 0,
        freezesAvailable: 0,
        freezesUsed: 0,
      },
    });
  }

  const today = getToday();
  const lastActiveStr = streakData.lastActiveDate.toISOString().split("T")[0];

  // Handle edge case: streak exists with currentStreak=0 and lastActiveDate=today
  // This means the record was auto-created (e.g., during seed/diagnostic) but never
  // properly initialized as a streak. Treat as first-day activity.
  const isUninitializedToday =
    streakData.currentStreak === 0 &&
    streakData.totalDaysActive === 0 &&
    lastActiveStr === today;

  const status: StreakStatus = {
    type: "daily",
    current: streakData.currentStreak,
    longest: streakData.longestStreak,
    // If uninitialized today, pretend last active was yesterday so it counts as a new day
    lastActiveDate: isUninitializedToday ? "1970-01-01" : lastActiveStr,
    isActive: streakData.currentStreak > 0,
    freezesAvailable: streakData.freezesAvailable,
    freezesUsed: streakData.freezesUsed,
  };

  const result = updateDailyStreak(status, today);

  if (!result.updated) return null;

  // Update freeze counts
  let newFreezes = streakData.freezesAvailable;
  let newFreezesUsed = streakData.freezesUsed;

  if (result.freezeUsed) {
    newFreezes = Math.max(0, newFreezes - 1);
    newFreezesUsed += 1;
  }

  // Add freezes from milestone
  if (result.milestoneReached) {
    const earnedFreezes = getFreezesEarned(result.milestoneReached.streakCount);
    if (earnedFreezes > 0) {
      newFreezes = addFreezes(newFreezes, earnedFreezes);
    }
  }

  await prisma.streakData.update({
    where: { studentId },
    data: {
      currentStreak: result.newCurrent,
      longestStreak: result.newLongest,
      lastActiveDate: new Date(today + "T00:00:00Z"),
      totalDaysActive: { increment: 1 },
      freezesAvailable: newFreezes,
      freezesUsed: newFreezesUsed,
    },
  });

  return {
    newCurrent: result.newCurrent,
    newLongest: result.newLongest,
    milestoneReached: result.milestoneReached !== null,
    milestoneLabel: result.milestoneReached?.label ?? null,
    milestoneXpReward: result.milestoneReached?.xpReward ?? 0,
    milestoneBadgeType: result.milestoneReached?.badgeType ?? null,
    streakBroken: result.streakBroken,
    freezeUsed: result.freezeUsed,
  };
}

async function awardBadges(
  studentId: string,
  badges: BadgeCheckResult[],
  currentXP: number,
  currentLevel: number
): Promise<Array<{ badgeId: string; name: string; icon: string; xpReward: number }>> {
  const awarded: Array<{ badgeId: string; name: string; icon: string; xpReward: number }> = [];
  const bus = getEventBus();

  for (const badge of badges) {
    if (!badge.earned) continue;

    try {
      await prisma.badge.create({
        data: {
          studentId,
          badgeType: badge.badgeId,
          category: badge.badge.category,
        },
      });

      // Award badge bonus XP
      if (badge.badge.xpReward > 0) {
        const xpResult = awardXP(currentXP, currentLevel, "badge_bonus", badge.badge.xpReward);
        await prisma.student.update({
          where: { id: studentId },
          data: { xp: xpResult.newXP, level: xpResult.newLevel },
        });
        currentXP = xpResult.newXP;
        currentLevel = xpResult.newLevel;
      }

      bus.fire(createEvent("badge_earned", studentId, {
        badgeId: badge.badgeId,
        badgeName: badge.badge.name,
        category: badge.badge.category,
        xpReward: badge.badge.xpReward,
      }));

      awarded.push({
        badgeId: badge.badgeId,
        name: badge.badge.name,
        icon: badge.badge.icon,
        xpReward: badge.badge.xpReward,
      });
    } catch {
      // Badge already exists (unique constraint) — skip silently
    }
  }

  return awarded;
}

// ─── Fetch Gamification Data for UI ───

export async function getStudentGamificationData(studentId: string) {
  const [student, streakData, badges, bossChallenges, masteryScores] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.streakData.findUnique({ where: { studentId } }),
    prisma.badge.findMany({ where: { studentId }, orderBy: { earnedAt: "desc" } }),
    prisma.bossChallenge.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.masteryScore.findMany({
      where: { studentId },
      include: { node: true },
    }),
  ]);

  if (!student) return null;

  return {
    xp: student.xp,
    level: student.level,
    streak: streakData
      ? {
          type: "daily" as const,
          current: streakData.currentStreak,
          longest: streakData.longestStreak,
          lastActiveDate: streakData.lastActiveDate.toISOString().split("T")[0],
          isActive: streakData.currentStreak > 0,
          freezesAvailable: streakData.freezesAvailable,
          freezesUsed: streakData.freezesUsed,
        }
      : null,
    badges: badges.map((b) => ({
      badgeType: b.badgeType,
      category: b.category,
      earnedAt: b.earnedAt,
      displayed: b.displayed,
    })),
    bossChallenges: bossChallenges.map((bc) => ({
      id: bc.id,
      status: bc.status,
      challengeType: bc.challengeType,
      score: bc.score,
      completedAt: bc.completedAt,
    })),
    masteryMap: masteryScores.map((ms) => ({
      nodeId: ms.nodeId,
      nodeCode: ms.node.nodeCode,
      nodeTitle: ms.node.title,
      domain: ms.node.domain,
      gradeLevel: ms.node.gradeLevel,
      level: ms.level,
      bktProbability: ms.bktProbability,
      difficulty: ms.node.difficulty,
    })),
  };
}

/**
 * Get full mastery map for constellation display.
 * Returns all knowledge nodes + student's mastery overlay.
 */
export async function getMasteryMap(studentId: string, gradeLevel?: string) {
  const where = gradeLevel ? { gradeLevel: gradeLevel as never } : {};

  const [allNodes, masteryScores] = await Promise.all([
    prisma.knowledgeNode.findMany({
      where,
      include: {
        prerequisites: { select: { nodeCode: true } },
        successors: { select: { nodeCode: true } },
      },
      orderBy: [{ domain: "asc" }, { difficulty: "asc" }],
    }),
    prisma.masteryScore.findMany({
      where: { studentId },
      include: { node: true },
    }),
  ]);

  const masteryMap = new Map(
    masteryScores.map((ms) => [ms.nodeId, ms])
  );

  const now = new Date();
  const nodes = allNodes.map((node) => {
    const mastery = masteryMap.get(node.id);
    // Phase 8: Check if node is due for review
    const dueForReview = mastery?.nextReviewAt
      ? mastery.nextReviewAt <= now && mastery.practiceCount > 0
      : false;
    return {
      id: node.id,
      nodeCode: node.nodeCode,
      name: node.title,
      description: node.description,
      subject: node.domain,
      gradeLevel: node.gradeLevel,
      difficulty: node.difficulty,
      masteryLevel: mastery ? masteryLevelToNumber(mastery.level) : 0,
      masteryStatus: mastery?.level ?? "NOVICE",
      bktProbability: mastery?.bktProbability ?? 0,
      dueForReview,
      prerequisites: node.prerequisites.map((p) => p.nodeCode),
      successors: node.successors.map((s) => s.nodeCode),
    };
  });

  // Build edges from prerequisites
  const nodeCodeToId = new Map(allNodes.map((n) => [n.nodeCode, n.id]));
  const edges: Array<{ from: string; to: string }> = [];

  for (const node of allNodes) {
    for (const prereq of node.prerequisites) {
      const fromId = nodeCodeToId.get(prereq.nodeCode);
      if (fromId) {
        edges.push({ from: fromId, to: node.id });
      }
    }
  }

  return { nodes, edges };
}

function masteryLevelToNumber(level: string): number {
  switch (level) {
    case "NOVICE": return 0;
    case "DEVELOPING": return 1;
    case "PROFICIENT": return 2;
    case "ADVANCED": return 3;
    case "MASTERED": return 4;
    default: return 0;
  }
}
