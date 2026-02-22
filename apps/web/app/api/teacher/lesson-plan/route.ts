import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { buildLessonPlanPrompt } from "@/lib/teacher/lesson-plan-prompt";

/**
 * POST /api/teacher/lesson-plan
 *
 * Generates a lesson plan using Claude AI.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, nodeIds, duration, gradeLevel } = body;

    if (!nodeIds || nodeIds.length === 0 || !duration) {
      return NextResponse.json(
        { error: "nodeIds and duration are required" },
        { status: 400 }
      );
    }

    // Get concept details
    const nodes = await prisma.knowledgeNode.findMany({
      where: { id: { in: nodeIds } },
      select: { id: true, title: true, nodeCode: true, description: true },
    });

    // Get class size + mastery distribution if classId provided
    let classSize = 25; // default
    let masteryDistribution = undefined;

    if (classId) {
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  masteryScores: {
                    where: { nodeId: { in: nodeIds } },
                  },
                },
              },
            },
          },
        },
      });

      if (classData) {
        classSize = classData.students.length || 25;

        // Compute mastery distribution
        const dist = { novice: 0, developing: 0, proficient: 0, mastered: 0 };
        classData.students.forEach((enrollment) => {
          const scores = enrollment.student.masteryScores;
          if (scores.length === 0) {
            dist.novice++;
          } else {
            // Average mastery level
            const avgLevel = scores.reduce((sum, s) => {
              const levelMap: Record<string, number> = {
                NOVICE: 0,
                DEVELOPING: 1,
                PROFICIENT: 2,
                ADVANCED: 3,
                MASTERED: 4,
              };
              return sum + (levelMap[s.level] ?? 0);
            }, 0) / scores.length;

            if (avgLevel >= 3.5) dist.mastered++;
            else if (avgLevel >= 2) dist.proficient++;
            else if (avgLevel >= 1) dist.developing++;
            else dist.novice++;
          }
        });
        masteryDistribution = dist;
      }
    }

    const prompt = buildLessonPlanPrompt({
      concepts: nodes,
      gradeLevel: gradeLevel || "G1",
      duration,
      classSize,
      masteryDistribution,
    });

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return a demo lesson plan if no API key
      return NextResponse.json({
        title: `Lesson: ${nodes.map((n) => n.title).join(", ")}`,
        objectives: [
          `Students will understand ${nodes[0]?.title || "the concept"}`,
          "Students will practice with guided examples",
          "Students will demonstrate understanding independently",
        ],
        warmUp: {
          duration: 5,
          activity: "Quick review of prerequisite concepts with a class discussion",
          materials: ["Whiteboard"],
        },
        mainActivity: {
          duration: Math.round(duration * 0.35),
          activity: `Direct instruction on ${nodes.map((n) => n.title).join(" and ")}`,
          steps: [
            "Introduce the concept with visual aids",
            "Demonstrate with concrete examples",
            "Check for understanding with class questions",
          ],
          materials: ["Visual aids", "Manipulatives"],
        },
        guidedPractice: {
          duration: Math.round(duration * 0.25),
          activity: "Work through problems together as a class",
          examples: ["Example problem 1", "Example problem 2"],
        },
        independentPractice: {
          duration: Math.round(duration * 0.25),
          activity: "Students practice independently with worksheet",
          problems: ["Practice problem 1", "Practice problem 2", "Practice problem 3"],
        },
        assessment: {
          duration: 5,
          method: "Exit ticket with 2 problems",
          exitTicket: "Solve these problems to show your understanding",
        },
        differentiation: {
          struggling: "Provide manipulatives and additional visual support",
          advanced: "Extension problems with higher complexity",
          ell: "Use visual vocabulary cards and partner support",
        },
        materials: ["Whiteboard", "Worksheets", "Manipulatives", "Visual aids"],
        _demo: true,
      });
    }

    // Real Claude API call
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", errText);
      return NextResponse.json(
        { error: "Failed to generate lesson plan" },
        { status: 502 }
      );
    }

    const claudeData = await claudeRes.json();
    const responseText =
      claudeData.content?.[0]?.text || "{}";

    // Parse JSON from Claude response
    try {
      const lessonPlan = JSON.parse(responseText);
      return NextResponse.json(lessonPlan);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const lessonPlan = JSON.parse(jsonMatch[0]);
        return NextResponse.json(lessonPlan);
      }
      return NextResponse.json(
        { error: "Failed to parse lesson plan", raw: responseText },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Lesson plan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
