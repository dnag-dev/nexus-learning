/**
 * GET /api/student/[id]/next-concept?subject=MATH|ENGLISH
 *
 * Returns the next concept for a student to learn, filtered by subject.
 * 1. Tries active learning plan first
 * 2. Falls back to the next unmastered node at their grade level + subject
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@aauti/db";

const GRADE_TO_INDEX: Record<string, number> = {
  K: 0, G1: 1, G2: 2, G3: 3, G4: 4, G5: 5, G6: 6,
  G7: 7, G8: 8, G9: 9, G10: 10, G11: 11, G12: 12,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  // Subject filter — defaults to MATH for backward compatibility
  const subjectParam = request.nextUrl.searchParams.get("subject");
  const subject = subjectParam === "ENGLISH" ? "ENGLISH" : "MATH";

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { gradeLevel: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 1. Try active learning plan
    const plan = await prisma.learningPlan.findFirst({
      where: { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { goal: true },
    });

    if (plan && plan.currentConceptIndex < plan.conceptSequence.length) {
      // Walk the plan sequence, skipping concepts more than 1 grade below student
      const studentGradeIdx = GRADE_TO_INDEX[student.gradeLevel] ?? 0;
      let planNode = null;
      let planIdx = plan.currentConceptIndex;

      while (planIdx < plan.conceptSequence.length) {
        const nodeCode = plan.conceptSequence[planIdx];
        const candidate = await prisma.knowledgeNode.findFirst({
          where: { nodeCode },
          select: { nodeCode: true, title: true, description: true, difficulty: true, gradeLevel: true },
        });

        if (candidate) {
          const nodeGradeIdx = GRADE_TO_INDEX[candidate.gradeLevel] ?? 0;
          // Accept if within 1 grade below student level (or above)
          if (studentGradeIdx - nodeGradeIdx <= 1) {
            planNode = candidate;
            break;
          }
        }
        planIdx++;
      }

      if (planNode) {
        // Get the next node in sequence for "unlocks" info
        let unlocksTitle: string | null = null;
        if (planIdx + 1 < plan.conceptSequence.length) {
          const nextCode = plan.conceptSequence[planIdx + 1];
          const nextNode = await prisma.knowledgeNode.findFirst({
            where: { nodeCode: nextCode },
            select: { title: true },
          });
          unlocksTitle = nextNode?.title ?? null;
        }

        return NextResponse.json({
          title: planNode.title,
          nodeCode: planNode.nodeCode,
          description: planNode.description,
          estimatedMinutes: Math.round((planNode.difficulty <= 4 ? 0.5 : 1.0) * 20),
          unlocks: unlocksTitle,
          source: "learning_plan",
          goalName: plan.goal?.name ?? null,
        });
      }
    }

    // 2. Fallback: next unmastered node at student's grade level
    const masteredNodeIds = await prisma.masteryScore.findMany({
      where: {
        studentId,
        bktProbability: { gte: 0.85 },
      },
      select: { nodeId: true },
    });
    const masteredIds = new Set(masteredNodeIds.map((m) => m.nodeId));

    const candidates = await prisma.knowledgeNode.findMany({
      where: { gradeLevel: student.gradeLevel, subject: subject as any },
      orderBy: { difficulty: "asc" },
      take: 20,
      select: {
        id: true,
        nodeCode: true,
        title: true,
        description: true,
        difficulty: true,
      },
    });

    const nextNode = candidates.find((n) => !masteredIds.has(n.id));

    if (nextNode) {
      // Find what comes after this node
      const nextIdx = candidates.indexOf(nextNode);
      const afterNode = nextIdx + 1 < candidates.length ? candidates[nextIdx + 1] : null;

      return NextResponse.json({
        title: nextNode.title,
        nodeCode: nextNode.nodeCode,
        description: nextNode.description,
        estimatedMinutes: 20,
        unlocks: afterNode?.title ?? null,
        source: "grade_level",
        goalName: null,
      });
    }

    return NextResponse.json({ title: null, source: "none" });
  } catch (err) {
    console.error("Next concept error:", err);
    return NextResponse.json(
      { error: "Failed to fetch next concept" },
      { status: 500 }
    );
  }
}
