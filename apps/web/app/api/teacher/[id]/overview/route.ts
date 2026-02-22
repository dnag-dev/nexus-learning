import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

/**
 * GET /api/teacher/:id/overview
 *
 * Returns teacher overview: classes, stats, recent alerts.
 * :id is the TeacherProfile ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        school: true,
        classes: {
          include: {
            students: true,
            assignments: {
              where: { status: "ASSIGNMENT_ACTIVE" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        alerts: {
          where: { status: "ALERT_ACTIVE" },
          include: { student: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Build class summaries
    const classes = teacher.classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      studentCount: cls.students.length,
      activeAssignments: cls.assignments.length,
    }));

    // Compute stats
    const totalStudents = teacher.classes.reduce(
      (sum, cls) => sum + cls.students.length,
      0
    );
    const activeAlerts = await prisma.interventionAlert.count({
      where: { teacherId, status: "ALERT_ACTIVE" },
    });
    const activeAssignments = await prisma.assignment.count({
      where: {
        class: { teacherId },
        status: "ASSIGNMENT_ACTIVE",
      },
    });

    // Recent alerts
    const recentAlerts = teacher.alerts.map((alert) => ({
      id: alert.id,
      alertType: alert.alertType,
      title: alert.title,
      description: alert.description,
      studentName: alert.student.displayName,
      studentId: alert.studentId,
      createdAt: alert.createdAt.toISOString(),
    }));

    return NextResponse.json({
      schoolName: teacher.school?.name ?? null,
      classes,
      stats: {
        totalStudents,
        activeAlerts,
        activeAssignments,
      },
      recentAlerts,
    });
  } catch (err) {
    console.error("Teacher overview error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
