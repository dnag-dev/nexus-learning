/**
 * POST /api/goals/interpret
 *
 * Takes a free-text custom goal description and uses Claude to
 * interpret it, mapping it to the closest available LearningGoal.
 *
 * Example input: "I want my kid to be ready for 5th grade math"
 * Example output: { goalId: "...", goalName: "Common Core Math — Grade 5", confidence: 0.95 }
 */

import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { callClaude } from "@/lib/session/claude-client";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, studentId } = body as {
      text?: string;
      studentId?: string;
    };

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your learning goal" },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Goal description too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Fetch all available goals
    const allGoals = await prisma.learningGoal.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        gradeLevel: true,
        examType: true,
        estimatedHours: true,
        requiredNodeIds: true,
      },
    });

    // Build a compact summary of available goals for Claude
    const goalSummary = allGoals.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      grade: g.gradeLevel,
      exam: g.examType,
      concepts: g.requiredNodeIds.length,
      hours: g.estimatedHours,
    }));

    // Fetch student info if available
    let studentContext = "";
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { displayName: true, gradeLevel: true, ageGroup: true },
      });
      if (student) {
        studentContext = `Student: ${student.displayName}, Grade: ${student.gradeLevel}, Age Group: ${student.ageGroup}`;
      }
    }

    const prompt = `You are a learning goal interpreter. A parent or student has described their learning goal in natural language. Match it to the closest available goal from our system.

AVAILABLE GOALS:
${JSON.stringify(goalSummary, null, 2)}

${studentContext ? `STUDENT CONTEXT: ${studentContext}` : ""}

USER'S GOAL DESCRIPTION: "${text}"

INSTRUCTIONS:
1. Analyze what the user wants to achieve
2. Match it to the BEST available goal (by id)
3. If no goal matches well, pick the closest one and explain why
4. If the goal is ambiguous, suggest 2-3 options

Respond with JSON:
{
  "primaryMatch": {
    "goalId": "the best matching goal ID",
    "goalName": "the goal name",
    "confidence": 0.0-1.0,
    "reason": "1-sentence explanation of why this matches"
  },
  "alternativeMatches": [
    {
      "goalId": "alternative goal ID",
      "goalName": "the goal name",
      "reason": "why this could also work"
    }
  ],
  "interpretation": "1-sentence summary of what the user is trying to achieve"
}`;

    const response = await callClaude(prompt, { maxTokens: 512 });

    if (response) {
      try {
        const parsed = JSON.parse(response);
        return NextResponse.json(parsed);
      } catch {
        console.warn("[goals/interpret] Failed to parse Claude response");
      }
    }

    // Fallback: simple keyword matching
    const textLower = text.toLowerCase();
    let bestMatch = allGoals[0];
    let bestScore = 0;

    for (const goal of allGoals) {
      let score = 0;
      const nameLower = goal.name.toLowerCase();
      const descLower = goal.description.toLowerCase();

      // Check for grade mentions
      const gradeMatch = textLower.match(/(?:grade|g)\s*(\d+)/i);
      if (gradeMatch && goal.gradeLevel === parseInt(gradeMatch[1])) score += 5;

      // Check for kindergarten
      if (textLower.includes("kindergarten") && goal.gradeLevel === 0) score += 5;

      // Check for subject mentions
      if (textLower.includes("math") && nameLower.includes("math")) score += 3;
      if ((textLower.includes("english") || textLower.includes("ela") || textLower.includes("reading") || textLower.includes("writing")) && nameLower.includes("ela")) score += 3;

      // Check for exam mentions
      if (textLower.includes("sat") && goal.examType === "SAT") score += 5;
      if (textLower.includes("act") && goal.examType === "ACT") score += 5;
      if (textLower.includes("isee") && goal.examType?.startsWith("ISEE")) score += 5;
      if (textLower.includes("psat") && goal.examType === "PSAT") score += 5;

      // Check for skill mentions
      if (textLower.includes("fluency") && nameLower.includes("fluency")) score += 4;
      if (textLower.includes("algebra") && nameLower.includes("algebra")) score += 4;
      if (textLower.includes("geometry") && nameLower.includes("geometry")) score += 4;

      // Keyword overlap with description
      const words = textLower.split(/\s+/);
      for (const word of words) {
        if (word.length > 3 && descLower.includes(word)) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = goal;
      }
    }

    return NextResponse.json({
      primaryMatch: {
        goalId: bestMatch.id,
        goalName: bestMatch.name,
        confidence: Math.min(bestScore / 10, 1.0),
        reason: `Matched based on keyword analysis of your description.`,
      },
      alternativeMatches: [],
      interpretation: `Looking for: ${text}`,
    });
  } catch (err) {
    console.error("[goals/interpret] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to interpret goal" },
      { status: 500 }
    );
  }
}
