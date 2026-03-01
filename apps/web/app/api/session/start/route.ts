import { NextResponse } from "next/server";
import { prisma } from "@aauti/db";
import { transitionState } from "@/lib/session/state-machine";
import { checkReviewsOnSessionStart } from "@/lib/spaced-repetition/scheduler-job";
import { getNextConceptInPlan } from "@/lib/learning-plan/plan-generator";

// Allow up to 30s (Pro plan); on Hobby plan this is capped at 10s
export const maxDuration = 30;

/**
 * Grade levels for each subject.
 * Math uses K-G5; English (ELA) uses G1-G10 (matching seeded ELA nodes).
 */
const MATH_GRADES = ["K", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
const ELA_GRADES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, nodeCode, subject: requestedSubject, planId, topic } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
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

    // Determine subject — defaults to MATH for backward compatibility
    const subject = requestedSubject === "ENGLISH" ? "ENGLISH" : "MATH";
    const gradeLevels = subject === "ENGLISH" ? ELA_GRADES : MATH_GRADES;

    // ─── Blueprint integration ───
    // If student has blueprint nodes, prioritize those for the selected subject.
    let blueprintNodeCodes: string[] = [];
    if (student.blueprintNodes && student.blueprintNodes.length > 0) {
      blueprintNodeCodes = student.blueprintNodes;
    }

    // Find the node to teach — either specified or recommend one
    let targetNode;
    let resolvedPlanId: string | null = planId || null;

    if (nodeCode) {
      // ─── Explicit node requested ───
      targetNode = await prisma.knowledgeNode.findUnique({
        where: { nodeCode },
      });
    } else if (topic && typeof topic === "string" && topic.trim().length >= 2) {
      // ─── Topic search: find the best matching concept by title/description ───
      targetNode = await findConceptByTopic(topic.trim(), subject);
    } else if (planId) {
      // ─── Plan-aware mode: pick next concept from specified plan ───
      const nextInPlan = await getNextConceptInPlan(planId);
      if (nextInPlan) {
        targetNode = await prisma.knowledgeNode.findFirst({
          where: { nodeCode: nextInPlan.nodeCode },
        });
      }
      // If plan has no next concept, fall through to default selection
    } else {
      // ─── Smart sequencer: pick the most urgent concept across all active plans ───
      const selectedFromPlan = await selectMostUrgentConcept(studentId);
      if (selectedFromPlan) {
        targetNode = await prisma.knowledgeNode.findFirst({
          where: { nodeCode: selectedFromPlan.nodeCode },
        });
        resolvedPlanId = selectedFromPlan.planId;
      }
    }

    if (!targetNode) {
      // ─── Legacy fallback: Blueprint nodes or grade-based selection ───

      // Priority 1: Blueprint nodes (unmastered, for this subject)
      if (blueprintNodeCodes.length > 0) {
        const blueprintNodes = await prisma.knowledgeNode.findMany({
          where: {
            nodeCode: { in: blueprintNodeCodes },
            subject: subject as any,
          },
          orderBy: { difficulty: "asc" },
        });

        for (const node of blueprintNodes) {
          const mastery = await prisma.masteryScore.findUnique({
            where: {
              studentId_nodeId: { studentId, nodeId: node.id },
            },
          });
          if (!mastery || mastery.bktProbability < 0.9) {
            targetNode = node;
            break;
          }
        }
      }

      // Priority 2: First unmastered node for the subject
      // Enforce grade-level proximity: search within ±2 of student's grade first,
      // only going wider if nothing found (prevents G5 student learning G1 content)
      if (!targetNode) {
        const studentGradeIdx = gradeLevels.indexOf(student.gradeLevel);
        const effectiveIdx = studentGradeIdx >= 0 ? studentGradeIdx : 0;

        // Build ordered grade search: student's grade first, then ±1, ±2
        // Only go beyond ±2 as absolute last resort
        const orderedGrades: string[] = [];
        const seen = new Set<string>();
        for (let distance = 0; distance <= Math.max(effectiveIdx, gradeLevels.length - effectiveIdx - 1); distance++) {
          for (const offset of [0, 1, -1]) {
            const idx = effectiveIdx + (distance * (offset || 1));
            if (idx >= 0 && idx < gradeLevels.length && !seen.has(gradeLevels[idx])) {
              // For grades beyond ±2, only include them after exhausting nearby grades
              if (Math.abs(idx - effectiveIdx) <= 2 || orderedGrades.length === 0) {
                orderedGrades.push(gradeLevels[idx]);
              }
              seen.add(gradeLevels[idx]);
            }
          }
        }
        // Add any remaining grades beyond ±2 at the very end
        for (let i = 0; i < gradeLevels.length; i++) {
          if (!seen.has(gradeLevels[i])) {
            orderedGrades.push(gradeLevels[i]);
          }
        }

        for (const grade of orderedGrades) {
          if (targetNode) break;

          const gradeNodes = await prisma.knowledgeNode.findMany({
            where: {
              gradeLevel: grade as any,
              subject: subject as any,
            },
            orderBy: { difficulty: "asc" },
          });

          for (const node of gradeNodes) {
            const mastery = await prisma.masteryScore.findUnique({
              where: {
                studentId_nodeId: { studentId, nodeId: node.id },
              },
            });
            if (!mastery || mastery.bktProbability < 0.9) {
              targetNode = node;
              break;
            }
          }
        }
      }

      // Ultimate fallback: if literally every node in this subject is mastered
      if (!targetNode) {
        const anyNode = await prisma.knowledgeNode.findFirst({
          where: { subject: subject as any },
          orderBy: { difficulty: "asc" },
        });
        if (anyNode) targetNode = anyNode;
      }
    }

    if (!targetNode) {
      return NextResponse.json(
        { error: "No knowledge node found to teach" },
        { status: 404 }
      );
    }

    // Create session in IDLE state, recording the subject and planId
    const session = await prisma.learningSession.create({
      data: {
        studentId,
        state: "IDLE",
        currentNodeId: targetNode.id,
        emotionalStateAtStart: "NEUTRAL",
        subject: subject as any,
        ...(resolvedPlanId ? { planId: resolvedPlanId } : {}),
      },
    });

    // Transition IDLE → TEACHING
    const result = await transitionState(
      session.id,
      "TEACHING",
      "START_SESSION",
      { nodeCode: targetNode.nodeCode }
    );

    // ═══ SPACED REPETITION: Check for due reviews ═══
    let reviewSuggestion = null;
    try {
      reviewSuggestion = await checkReviewsOnSessionStart(studentId);
    } catch (e) {
      console.error("Review check error (non-critical):", e);
    }

    // ═══ GPS: Build "Today's Plan" context ═══
    // When session is part of a learning plan, provide rich context about
    // why this concept was chosen and where the student is in their journey.
    let todaysPlan = null;
    if (resolvedPlanId) {
      try {
        const plan = await prisma.learningPlan.findUnique({
          where: { id: resolvedPlanId },
          include: { goal: true },
        });
        if (plan) {
          const idx = plan.conceptSequence.indexOf(targetNode.nodeCode);
          const progress = plan.conceptSequence.length > 0
            ? Math.round((plan.currentConceptIndex / plan.conceptSequence.length) * 100)
            : 0;

          todaysPlan = {
            planId: plan.id,
            goalName: plan.goal.name,
            goalCategory: plan.goal.category,
            positionInPlan: idx >= 0 ? idx + 1 : plan.currentConceptIndex + 1,
            totalInPlan: plan.conceptSequence.length,
            progress,
            isAheadOfSchedule: plan.isAheadOfSchedule,
            reason: nodeCode
              ? "You selected this concept"
              : planId
                ? "Next in your learning plan"
                : "Most urgent across your active plans",
          };
        }
      } catch (e) {
        console.error("Today's Plan context error (non-critical):", e);
      }
    }

    // Return session metadata immediately — teaching content will stream
    // via /api/session/teach-stream SSE endpoint.
    return NextResponse.json({
      sessionId: session.id,
      state: result.newState,
      recommendedAction: result.recommendedAction,
      node: {
        nodeCode: targetNode.nodeCode,
        title: targetNode.title,
        description: targetNode.description,
        gradeLevel: targetNode.gradeLevel,
        domain: targetNode.domain,
        difficulty: targetNode.difficulty,
      },
      subject,
      teaching: null, // Streamed separately
      persona: {
        id: student.avatarPersonaId,
        studentName: student.displayName,
      },
      reviewSuggestion,
      // Plan-aware metadata
      ...(resolvedPlanId ? { planId: resolvedPlanId } : {}),
      todaysPlan,
    });
  } catch (err) {
    console.error("Session start error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start session",
      },
      { status: 500 }
    );
  }
}

// ─── Smart Sequencer: Multi-Plan Concept Selection ───

/**
 * When a student has multiple active plans, pick the best concept to teach next.
 * Priority:
 * 1. Plans with a milestone due within 3 days (most urgent)
 * 2. Plans behind schedule (need catch-up)
 * 3. Plans with nearest target date
 * 4. Most recently active plan (recency)
 */
async function selectMostUrgentConcept(
  studentId: string
): Promise<{ nodeCode: string; planId: string } | null> {
  const activePlans = await prisma.learningPlan.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { goal: true, milestoneResults: { orderBy: { weekNumber: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  if (activePlans.length === 0) return null;
  if (activePlans.length === 1) {
    // Single plan — just use getNextConceptInPlan
    const next = await getNextConceptInPlan(activePlans[0].id);
    return next ? { nodeCode: next.nodeCode, planId: activePlans[0].id } : null;
  }

  // Score each plan for urgency
  const now = new Date();
  const scored = await Promise.all(
    activePlans.map(async (plan) => {
      let urgencyScore = 0;

      // Factor 1: Milestone due within 3 days (+50 urgency)
      const weeksSinceStart = Math.floor(
        (now.getTime() - plan.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const lastMilestoneWeek =
        plan.milestoneResults.length > 0 ? plan.milestoneResults[0].weekNumber : 0;
      if (weeksSinceStart > lastMilestoneWeek) {
        urgencyScore += 50; // Milestone due
      }

      // Factor 2: Behind schedule (+30 urgency)
      if (!plan.isAheadOfSchedule) {
        urgencyScore += 30;
      }

      // Factor 3: Target date proximity (+0-20 urgency based on days remaining)
      if (plan.targetCompletionDate) {
        const daysToTarget = Math.max(
          0,
          (plan.targetCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        urgencyScore += Math.max(0, 20 - Math.floor(daysToTarget / 7));
      }

      // Factor 4: Recency — plans with recent sessions get slight boost
      const lastSession = await prisma.learningSession.findFirst({
        where: { studentId, planId: plan.id, state: "COMPLETED" },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true },
      });

      // Plans NOT studied recently get urgency boost (balance attention)
      if (lastSession) {
        const daysSinceSession = Math.floor(
          (now.getTime() - lastSession.startedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        urgencyScore += Math.min(15, daysSinceSession * 3); // Up to +15 for neglected plans
      } else {
        urgencyScore += 15; // Never studied = highest recency urgency
      }

      return { plan, urgencyScore };
    })
  );

  // Sort by urgency (highest first)
  scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // Try each plan in urgency order until we find a next concept
  for (const { plan } of scored) {
    const next = await getNextConceptInPlan(plan.id);
    if (next) {
      return { nodeCode: next.nodeCode, planId: plan.id };
    }
  }

  return null;
}

// ─── Topic Search: Find Concept by Free-Text ───

/**
 * Searches knowledge nodes by title and description to find the best match
 * for a user's free-text topic request (e.g., "exponents", "fractions").
 *
 * Scoring strategy:
 * - Exact word match in title: +10
 * - Partial match in title: +5
 * - Match in description: +3
 * - Prefer lower difficulty (more introductory) concepts: +1 for difficulty ≤ 3
 */
async function findConceptByTopic(
  topic: string,
  subject: string
): Promise<{ id: string; nodeCode: string; title: string; description: string; gradeLevel: string; domain: string; difficulty: number; subject: string } | null> {
  // Fetch all nodes for this subject (typically ~100-200 nodes, fast query)
  const allNodes = await prisma.knowledgeNode.findMany({
    where: { subject: subject as any },
    orderBy: { difficulty: "asc" },
  });

  if (allNodes.length === 0) return null;

  const topicLower = topic.toLowerCase();
  const topicWords = topicLower.split(/\s+/).filter((w) => w.length >= 2);

  // Score each node
  const scored = allNodes.map((node) => {
    const titleLower = node.title.toLowerCase();
    const descLower = node.description.toLowerCase();
    let score = 0;

    for (const word of topicWords) {
      // Exact word boundary match in title (strongest signal)
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
      if (wordRegex.test(titleLower)) {
        score += 10;
      } else if (titleLower.includes(word)) {
        // Partial match in title
        score += 5;
      }

      // Match in description
      if (descLower.includes(word)) {
        score += 3;
      }
    }

    // Bonus for introductory-level concepts (easier = better starting point)
    if (node.difficulty <= 3) {
      score += 1;
    }

    return { node, score };
  });

  // Sort by score descending, then difficulty ascending (prefer easier if tied)
  scored.sort((a, b) => b.score - a.score || a.node.difficulty - b.node.difficulty);

  // Return the best match if it has any relevance
  if (scored[0] && scored[0].score > 0) {
    return scored[0].node;
  }

  return null;
}
