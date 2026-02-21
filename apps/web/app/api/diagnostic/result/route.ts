import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch the session
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        student: true,
        currentNode: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.state !== "COMPLETED") {
      return NextResponse.json(
        { error: "Diagnostic is not yet complete", state: session.state },
        { status: 400 }
      );
    }

    // Fetch the student's mastery scores created by the diagnostic
    const masteryScores = await prisma.masteryScore.findMany({
      where: { studentId: session.studentId },
      include: { node: true },
      orderBy: { node: { difficulty: "asc" } },
    });

    const mastered = masteryScores
      .filter((s) => s.level === "PROFICIENT" || s.level === "ADVANCED" || s.level === "MASTERED")
      .map((s) => ({
        nodeCode: s.node.nodeCode,
        title: s.node.title,
        level: s.level,
        bktProbability: s.bktProbability,
      }));

    const gaps = masteryScores
      .filter((s) => s.level === "NOVICE")
      .map((s) => ({
        nodeCode: s.node.nodeCode,
        title: s.node.title,
        level: s.level,
        bktProbability: s.bktProbability,
      }));

    // Estimate grade level from the highest mastered node
    const gradeMap: Record<string, number> = {
      K: 0,
      G1: 1,
      G2: 2,
      G3: 3,
      G4: 4,
      G5: 5,
    };

    let highestGrade = 0;
    for (const m of mastered) {
      const node = await prisma.knowledgeNode.findUnique({
        where: { nodeCode: m.nodeCode },
      });
      if (node) {
        const gradeNum = gradeMap[node.gradeLevel] ?? 0;
        if (gradeNum > highestGrade) highestGrade = gradeNum;
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      studentId: session.studentId,
      studentName: session.student.displayName,
      completedAt: session.endedAt,
      questionsAnswered: session.questionsAnswered,
      correctAnswers: session.correctAnswers,
      accuracy:
        session.questionsAnswered > 0
          ? Math.round(
              (session.correctAnswers / session.questionsAnswered) * 100
            )
          : 0,
      gradeEstimate: highestGrade,
      gradeLevelLabel:
        highestGrade === 0 ? "Kindergarten" : `Grade ${highestGrade}`,
      mastered,
      gaps,
      totalMastered: mastered.length,
      totalGaps: gaps.length,
      recommendation:
        gaps.length > 0
          ? `We found ${gaps.length} area${gaps.length > 1 ? "s" : ""} to strengthen. We'll weave these into your learning path!`
          : mastered.length > 0
            ? "Solid foundation! You're ready to move forward."
            : "Let's start from the beginning — every expert was once a beginner!",
    });
  } catch (err) {
    console.error("Diagnostic result error:", err);
    return NextResponse.json(
      { error: "Failed to fetch diagnostic result" },
      { status: 500 }
    );
  }
}
