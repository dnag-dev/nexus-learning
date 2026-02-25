/**
 * GET /api/student/{id}/nexus-score?nodeId=xxx
 *   → Returns Nexus Score breakdown for a specific node
 *
 * GET /api/student/{id}/nexus-score (no nodeId)
 *   → Returns all nodes with nexus scores
 */

import { NextResponse } from "next/server";
import { calculateNexusScore, getAllNexusScores } from "@/lib/session/nexus-score";
import { prisma } from "@aauti/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  const { searchParams } = new URL(request.url);
  const nodeId = searchParams.get("nodeId");

  try {
    if (nodeId) {
      // Get score for specific node
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: nodeId },
        select: { gradeLevel: true, domain: true },
      });

      if (!node) {
        return NextResponse.json(
          { error: "Node not found" },
          { status: 404 }
        );
      }

      const breakdown = await calculateNexusScore(
        studentId,
        nodeId,
        node.gradeLevel,
        node.domain
      );

      const mastery = await prisma.masteryScore.findUnique({
        where: { studentId_nodeId: { studentId, nodeId } },
        select: { trulyMastered: true },
      });

      return NextResponse.json({
        ...breakdown,
        trulyMastered: mastery?.trulyMastered ?? false,
      });
    }

    // Get all nexus scores
    const scores = await getAllNexusScores(studentId);
    return NextResponse.json({ scores });
  } catch (err) {
    console.error("Nexus score API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get nexus score" },
      { status: 500 }
    );
  }
}
