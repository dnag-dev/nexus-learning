/**
 * GET /api/student/[id]/next-concept
 *
 * Returns the next concept for a student to learn.
 * 1. Tries active learning plan first
 * 2. Falls back to the next unmastered node at their grade level
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;

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
      const nodeCode = plan.conceptSequence[plan.currentConceptIndex];
      const node = await prisma.knowledgeNode.findFirst({
        where: { nodeCode },
        select: { nodeCode: true, title: true, description: true, difficulty: true },
      });

      // Get the next node in sequence for "unlocks" info
      let unlocksTitle: string | null = null;
      if (plan.currentConceptIndex + 1 < plan.conceptSequence.length) {
        const nextCode = plan.conceptSequence[plan.currentConceptIndex + 1];
        const nextNode = await prisma.knowledgeNode.findFirst({
          where: { nodeCode: nextCode },
          select: { title: true },
        });
        unlocksTitle = nextNode?.title ?? null;
      }

      if (node) {
        return NextResponse.json({
          title: node.title,
          description: node.description,
          estimatedMinutes: Math.round((node.difficulty <= 4 ? 0.5 : 1.0) * 20),
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
      where: { gradeLevel: student.gradeLevel },
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
