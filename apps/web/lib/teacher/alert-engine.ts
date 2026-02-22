import { prisma } from "@aauti/db";

/**
 * Alert Engine — Phase 11
 *
 * Detects intervention-worthy situations for students.
 * Called on-demand when teacher loads dashboard/alerts.
 *
 * 5 detection rules:
 * 1. REPEATED_FAILURE — 3+ wrong on same concept in last 2 sessions
 * 2. PROLONGED_ABSENCE — last session > 5 days ago
 * 3. SUSTAINED_FRUSTRATION — 3+ sessions with FRUSTRATED emotional state
 * 4. LOW_MASTERY_VELOCITY — < 1 concept mastered per week for 3 weeks
 * 5. STRUGGLING_STUDENT — combination of 2+ other signals
 */

interface DetectedAlert {
  alertType: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export async function detectAlerts(
  teacherId: string,
  studentId: string
): Promise<DetectedAlert[]> {
  const alerts: DetectedAlert[] = [];
  const now = new Date();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { displayName: true },
  });

  if (!student) return alerts;

  // 1. REPEATED_FAILURE — check last 2 completed sessions
  const recentSessions = await prisma.learningSession.findMany({
    where: {
      studentId,
      state: "COMPLETED",
    },
    orderBy: { startedAt: "desc" },
    take: 2,
    select: {
      id: true,
      currentNodeId: true,
      questionsAnswered: true,
      correctAnswers: true,
    },
  });

  for (const session of recentSessions) {
    if (
      session.questionsAnswered >= 3 &&
      session.correctAnswers / session.questionsAnswered < 0.33
    ) {
      // Less than 33% correct on 3+ questions
      const existingAlert = await prisma.interventionAlert.findFirst({
        where: {
          teacherId,
          studentId,
          alertType: "REPEATED_FAILURE",
          status: { in: ["ALERT_ACTIVE", "ACKNOWLEDGED"] },
        },
      });

      if (!existingAlert) {
        alerts.push({
          alertType: "REPEATED_FAILURE",
          title: "Repeated Failure",
          description: `${student.displayName} scored below 33% in a recent session (${session.correctAnswers}/${session.questionsAnswered} correct).`,
          data: {
            sessionId: session.id,
            conceptId: session.currentNodeId,
            correctRate: session.correctAnswers / session.questionsAnswered,
          },
        });
      }
      break; // Only one alert per type
    }
  }

  // 2. PROLONGED_ABSENCE — last session > 5 days ago
  const lastSession = await prisma.learningSession.findFirst({
    where: { studentId },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  if (lastSession) {
    const daysSinceLastSession = Math.floor(
      (now.getTime() - lastSession.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSession >= 5) {
      const existingAlert = await prisma.interventionAlert.findFirst({
        where: {
          teacherId,
          studentId,
          alertType: "PROLONGED_ABSENCE",
          status: { in: ["ALERT_ACTIVE", "ACKNOWLEDGED"] },
        },
      });

      if (!existingAlert) {
        alerts.push({
          alertType: "PROLONGED_ABSENCE",
          title: "Prolonged Absence",
          description: `${student.displayName} hasn't practiced in ${daysSinceLastSession} days.`,
          data: {
            lastActiveDate: lastSession.startedAt.toISOString(),
            daysSinceLastSession,
          },
        });
      }
    }
  }

  // 3. SUSTAINED_FRUSTRATION — 3+ sessions with FRUSTRATED state
  const frustratedSessions = await prisma.learningSession.count({
    where: {
      studentId,
      emotionalStateAtEnd: "FRUSTRATED",
      startedAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) }, // Last 2 weeks
    },
  });

  if (frustratedSessions >= 3) {
    const existingAlert = await prisma.interventionAlert.findFirst({
      where: {
        teacherId,
        studentId,
        alertType: "SUSTAINED_FRUSTRATION",
        status: { in: ["ALERT_ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    if (!existingAlert) {
      alerts.push({
        alertType: "SUSTAINED_FRUSTRATION",
        title: "Sustained Frustration",
        description: `${student.displayName} has shown frustration in ${frustratedSessions} sessions over the past 2 weeks.`,
        data: { frustratedSessionCount: frustratedSessions },
      });
    }
  }

  // 4. LOW_MASTERY_VELOCITY — < 1 concept/week for 3 weeks
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const recentMasteries = await prisma.masteryScore.count({
    where: {
      studentId,
      level: "MASTERED",
      lastPracticed: { gte: threeWeeksAgo },
    },
  });

  if (recentMasteries < 3) {
    // Less than 1 per week over 3 weeks
    const existingAlert = await prisma.interventionAlert.findFirst({
      where: {
        teacherId,
        studentId,
        alertType: "LOW_MASTERY_VELOCITY",
        status: { in: ["ALERT_ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    if (!existingAlert) {
      alerts.push({
        alertType: "LOW_MASTERY_VELOCITY",
        title: "Low Mastery Velocity",
        description: `${student.displayName} has only mastered ${recentMasteries} concept(s) in the past 3 weeks.`,
        data: { conceptsMasteredInPeriod: recentMasteries },
      });
    }
  }

  // 5. STRUGGLING_STUDENT — combination of 2+ signals
  if (alerts.length >= 2) {
    const existingAlert = await prisma.interventionAlert.findFirst({
      where: {
        teacherId,
        studentId,
        alertType: "STRUGGLING_STUDENT",
        status: { in: ["ALERT_ACTIVE", "ACKNOWLEDGED"] },
      },
    });

    if (!existingAlert) {
      alerts.push({
        alertType: "STRUGGLING_STUDENT",
        title: "Struggling Student",
        description: `${student.displayName} is showing multiple warning signs: ${alerts.map((a) => a.alertType.toLowerCase().replace(/_/g, " ")).join(", ")}.`,
        data: { combinedSignals: alerts.map((a) => a.alertType) },
      });
    }
  }

  return alerts;
}

/**
 * Run alert detection for all students in a teacher's classes.
 * Creates new InterventionAlert records for detected issues.
 */
export async function runAlertDetection(teacherId: string): Promise<number> {
  // Get all students across teacher's classes
  const classStudents = await prisma.classStudent.findMany({
    where: {
      class: { teacherId },
    },
    select: { studentId: true },
  });

  const uniqueStudentIds = [...new Set(classStudents.map((cs) => cs.studentId))];
  let alertsCreated = 0;

  for (const studentId of uniqueStudentIds) {
    const detected = await detectAlerts(teacherId, studentId);

    for (const alert of detected) {
      await prisma.interventionAlert.create({
        data: {
          teacherId,
          studentId,
          alertType: alert.alertType as "REPEATED_FAILURE" | "PROLONGED_ABSENCE" | "SUSTAINED_FRUSTRATION" | "LOW_MASTERY_VELOCITY" | "STRUGGLING_STUDENT",
          title: alert.title,
          description: alert.description,
          data: JSON.parse(JSON.stringify(alert.data)),
        },
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}
