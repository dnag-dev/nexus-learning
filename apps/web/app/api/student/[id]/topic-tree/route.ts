/**
 * GET /api/student/{id}/topic-tree?domain=MATH
 *   → Returns topic tree with branches, progress, and unlock status
 */

import { NextResponse } from "next/server";
import { getTopicTree } from "@/lib/session/branch-engine";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") ?? undefined;

  try {
    const tree = await getTopicTree(studentId, domain);
    return NextResponse.json(tree);
  } catch (err) {
    console.error("Topic tree API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get topic tree" },
      { status: 500 }
    );
  }
}
