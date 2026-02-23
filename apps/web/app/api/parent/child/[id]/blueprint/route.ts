import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";

/**
 * Blueprint API — Manage a student's learning focus / blueprint.
 *
 * POST /api/parent/child/:id/blueprint
 *   Body: { text, source, subject? }
 *   - text: Free-text description of what the student should focus on
 *   - source: "KID" | "PARENT" | "TEACHER"
 *   - subject: "MATH" | "ENGLISH" (optional, helps Claude pick the right nodes)
 *
 *   Priority enforcement: TEACHER > PARENT > KID.
 *   A KID blueprint cannot overwrite a PARENT or TEACHER blueprint.
 *   A PARENT blueprint cannot overwrite a TEACHER blueprint.
 *
 *   Uses Claude to parse free text into relevant node codes.
 *
 * GET /api/parent/child/:id/blueprint
 *   Returns current blueprint { text, nodes, source, updatedAt }
 */

export const maxDuration = 30;

// Priority order: TEACHER highest, KID lowest
const SOURCE_PRIORITY: Record<string, number> = {
  TEACHER: 3,
  PARENT: 2,
  KID: 1,
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { text, source, subject } = body;

    if (!text || !source) {
      return NextResponse.json(
        { error: "text and source are required" },
        { status: 400 }
      );
    }

    if (!["KID", "PARENT", "TEACHER"].includes(source)) {
      return NextResponse.json(
        { error: "source must be KID, PARENT, or TEACHER" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // ─── Priority check: higher-priority source cannot be overwritten by lower ───
    if (student.blueprintSource) {
      const existingPriority = SOURCE_PRIORITY[student.blueprintSource] ?? 0;
      const newPriority = SOURCE_PRIORITY[source] ?? 0;
      if (newPriority < existingPriority) {
        return NextResponse.json({
          warning: `A ${student.blueprintSource.toLowerCase()} blueprint already exists. Only a ${student.blueprintSource.toLowerCase()} or higher can update it.`,
          currentSource: student.blueprintSource,
          currentText: student.blueprintText,
        });
      }
    }

    // ─── Use Claude to parse the text into node codes ───
    const allNodes = await prisma.knowledgeNode.findMany({
      where: subject ? { subject: subject as any } : undefined,
      select: { nodeCode: true, title: true, description: true, domain: true },
    });

    const nodeList = allNodes
      .map((n) => `${n.nodeCode}: ${n.title} (${n.domain})`)
      .join("\n");

    const parsePrompt = `You are a learning assistant. A ${source.toLowerCase()} described what a student should focus on.

STUDENT'S FOCUS REQUEST: "${text}"

AVAILABLE KNOWLEDGE NODES:
${nodeList}

TASK: Pick the 3-5 most relevant node codes that match this focus request. Return ONLY a JSON array of node code strings.

Example: ["ela_nouns_basic", "ela_adjectives_basic", "ela_verbs_basic"]

If the text doesn't clearly match any nodes, pick the 3 most foundational/beginner nodes for the subject.

Respond ONLY with a valid JSON array of strings.`;

    let parsedNodes: string[] = [];

    const claudeResponse = await callClaude(parsePrompt);
    if (claudeResponse) {
      try {
        const cleaned = claudeResponse.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          // Validate that all returned codes actually exist
          const validCodes = new Set(allNodes.map((n) => n.nodeCode));
          parsedNodes = parsed.filter(
            (code: string) => typeof code === "string" && validCodes.has(code)
          );
        }
      } catch {
        console.warn("[blueprint] Failed to parse Claude response, using fallback");
      }
    }

    // Fallback: if Claude failed or returned nothing, pick first 3 foundational nodes
    if (parsedNodes.length === 0) {
      parsedNodes = allNodes
        .slice(0, 3)
        .map((n) => n.nodeCode);
    }

    // ─── Save blueprint to student record ───
    await prisma.student.update({
      where: { id: studentId },
      data: {
        blueprintText: text,
        blueprintNodes: parsedNodes,
        blueprintSource: source,
        blueprintUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      text,
      nodes: parsedNodes,
      source,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[blueprint] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        blueprintText: true,
        blueprintNodes: true,
        blueprintSource: true,
        blueprintUpdatedAt: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      text: student.blueprintText,
      nodes: student.blueprintNodes,
      source: student.blueprintSource,
      updatedAt: student.blueprintUpdatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("[blueprint] GET Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
