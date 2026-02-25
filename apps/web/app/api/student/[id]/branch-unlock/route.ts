/**
 * POST /api/student/{id}/branch-unlock
 *   Body: { branchId }
 *   → Record student's branch choice and return next node
 */

import { NextResponse } from "next/server";
import { chooseBranch, checkBranchUnlock } from "@/lib/session/branch-engine";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;

  try {
    const body = await request.json();
    const { branchId } = body;

    if (!branchId) {
      return NextResponse.json(
        { error: "branchId is required" },
        { status: 400 }
      );
    }

    const nextNode = await chooseBranch(studentId, branchId);

    // Also check for any newly unlocked branches
    const newlyUnlocked = await checkBranchUnlock(studentId);

    return NextResponse.json({
      nextNode,
      newlyUnlockedBranches: newlyUnlocked,
    });
  } catch (err) {
    console.error("Branch unlock API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unlock branch" },
      { status: 500 }
    );
  }
}
