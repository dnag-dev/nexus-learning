/**
 * POST /api/challenge/generate
 *
 * Generate an open-ended challenge problem for a concept.
 * Requires the student to have FLUENT mastery level on the concept.
 *
 * Body: { studentId, conceptId (nodeCode) }
 * Returns: { challenge, concept, isUnlocked }
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { generateChallenge } from "@/lib/session/challenge-engine";
import type { AgeGroupValue } from "@/lib/prompts/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, conceptId } = body;

    if (!studentId || !conceptId) {
      return NextResponse.json(
        { error: "studentId and conceptId are required" },
        { status: 400 }
      );
    }

    // Look up student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Look up knowledge node
    const node = await prisma.knowledgeNode.findFirst({
      where: { nodeCode: conceptId },
    });
    if (!node) {
      return NextResponse.json(
        { error: "Concept not found" },
        { status: 404 }
      );
    }

    // Check fluency gate — must be FLUENT or trulyMastered
    const mastery = await prisma.masteryScore.findUnique({
      where: { studentId_nodeId: { studentId, nodeId: node.id } },
    });

    const isUnlocked =
      mastery?.level === "FLUENT" ||
      mastery?.level === "MASTERED" ||
      mastery?.trulyMastered === true ||
      (mastery?.bktProbability ?? 0) >= 0.9;

    if (!isUnlocked) {
      return NextResponse.json({
        isUnlocked: false,
        requiredLevel: "FLUENT",
        currentLevel: mastery?.level ?? "NOVICE",
        message:
          "You need to master this concept first before taking on the challenge!",
      });
    }

    // Generate challenge
    const challenge = await generateChallenge(
      node.title,
      node.description,
      node.domain,
      node.gradeLevel,
      student.displayName,
      student.ageGroup as AgeGroupValue,
      student.avatarPersonaId
    );

    return NextResponse.json({
      isUnlocked: true,
      challenge,
      concept: {
        nodeCode: node.nodeCode,
        title: node.title,
        description: node.description,
        domain: node.domain,
        gradeLevel: node.gradeLevel,
      },
      student: {
        name: student.displayName,
        personaId: student.avatarPersonaId,
      },
    });
  } catch (err) {
    console.error("[challenge/generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
