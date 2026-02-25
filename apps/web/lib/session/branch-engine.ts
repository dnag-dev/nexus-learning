/**
 * Branch Engine — Topic Tree + Branch Unlock Logic
 *
 * Manages the visible topic tree where students can see:
 *   - Current concept highlighted
 *   - Prerequisites mastered
 *   - Next 3 unlocks
 *   - Advanced branches
 *
 * Students choose "deeper" vs "broader" when a cluster is mastered.
 */

import { prisma } from "@aauti/db";

// ─── Types ───

export interface BranchNode {
  nodeId: string;
  nodeCode: string;
  title: string;
  nexusScore: number;
  trulyMastered: boolean;
  isCurrent: boolean;
}

export interface TopicBranchInfo {
  id: string;
  name: string;
  description: string;
  domain: string;
  gradeLevel: string;
  isAdvanced: boolean;
  nodes: BranchNode[];
  unlocked: boolean;
  completed: boolean;
  progress: number; // 0-100%
  nodesCompleted: number;
  totalNodes: number;
}

export interface TopicTreeResult {
  branches: TopicBranchInfo[];
  unlockedBranchIds: string[];
  activeBranchId: string | null;
}

// ─── Core Functions ───

/**
 * Get the full topic tree for a student, with unlock status and progress.
 */
export async function getTopicTree(
  studentId: string,
  domain?: string
): Promise<TopicTreeResult> {
  // Get all branches (optionally filtered by domain)
  const branches = await prisma.topicBranch.findMany({
    where: domain ? { domain } : undefined,
    orderBy: [{ isAdvanced: "asc" }, { sortOrder: "asc" }],
    include: {
      unlocks: {
        where: { studentId },
      },
    },
  });

  // Get all mastery scores for this student
  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId },
    include: { node: { select: { id: true, nodeCode: true, title: true } } },
  });
  const masteryMap = new Map(
    masteryScores.map((m) => [m.nodeId, m])
  );

  // Get current session to find active node
  const activeSession = await prisma.learningSession.findFirst({
    where: { studentId, endedAt: null },
    select: { currentNodeId: true },
    orderBy: { startedAt: "desc" },
  });

  // Build branch info
  const branchInfos: TopicBranchInfo[] = [];
  const unlockedBranchIds: string[] = [];
  let activeBranchId: string | null = null;

  for (const branch of branches) {
    const unlock = branch.unlocks[0]; // unique per student+branch

    // Check if prerequisites are met
    const prereqsMet = await checkPrerequisitesMet(
      studentId,
      branch.prerequisiteBranchIds,
      branches
    );

    const unlocked = !!unlock || prereqsMet || branch.prerequisiteBranchIds.length === 0;
    if (unlocked) unlockedBranchIds.push(branch.id);

    // Build node list
    const nodes: BranchNode[] = [];
    let nodesCompleted = 0;

    // Get nodes for this branch
    const branchNodes = await prisma.knowledgeNode.findMany({
      where: { id: { in: branch.nodeIds } },
      select: { id: true, nodeCode: true, title: true },
    });

    // Preserve order from nodeIds
    for (const nodeId of branch.nodeIds) {
      const node = branchNodes.find((n) => n.id === nodeId);
      if (!node) continue;

      const mastery = masteryMap.get(nodeId);
      const isCurrent = activeSession?.currentNodeId === nodeId;
      if (isCurrent) activeBranchId = branch.id;

      const nodeInfo: BranchNode = {
        nodeId: node.id,
        nodeCode: node.nodeCode,
        title: node.title,
        nexusScore: mastery?.nexusScore ?? 0,
        trulyMastered: mastery?.trulyMastered ?? false,
        isCurrent,
      };
      nodes.push(nodeInfo);

      if (mastery?.trulyMastered) nodesCompleted++;
    }

    const totalNodes = nodes.length;
    const progress = totalNodes > 0 ? Math.round((nodesCompleted / totalNodes) * 100) : 0;
    const completed = nodesCompleted >= totalNodes && totalNodes > 0;

    branchInfos.push({
      id: branch.id,
      name: branch.name,
      description: branch.description,
      domain: branch.domain,
      gradeLevel: branch.gradeLevel,
      isAdvanced: branch.isAdvanced,
      nodes,
      unlocked,
      completed,
      progress,
      nodesCompleted,
      totalNodes,
    });
  }

  return { branches: branchInfos, unlockedBranchIds, activeBranchId };
}

/**
 * Check if a new branch has been unlocked (all prerequisites mastered).
 */
export async function checkBranchUnlock(
  studentId: string
): Promise<string[]> {
  const branches = await prisma.topicBranch.findMany({
    include: {
      unlocks: { where: { studentId } },
    },
  });

  const newlyUnlocked: string[] = [];

  for (const branch of branches) {
    // Skip already unlocked
    if (branch.unlocks.length > 0) continue;
    // Skip branches with no prerequisites (already available)
    if (branch.prerequisiteBranchIds.length === 0) continue;

    const prereqsMet = await checkPrerequisitesMet(
      studentId,
      branch.prerequisiteBranchIds,
      branches
    );

    if (prereqsMet) {
      // Create unlock record
      await prisma.branchUnlock.create({
        data: {
          studentId,
          branchId: branch.id,
          totalNodes: branch.nodeIds.length,
        },
      });
      newlyUnlocked.push(branch.id);
    }
  }

  return newlyUnlocked;
}

/**
 * Student chooses a branch to pursue (deeper vs broader).
 */
export async function chooseBranch(
  studentId: string,
  branchId: string
): Promise<{ nodeCode: string; title: string } | null> {
  const branch = await prisma.topicBranch.findUnique({
    where: { id: branchId },
  });
  if (!branch) return null;

  // Ensure unlock exists
  await prisma.branchUnlock.upsert({
    where: { studentId_branchId: { studentId, branchId } },
    update: {},
    create: {
      studentId,
      branchId,
      totalNodes: branch.nodeIds.length,
    },
  });

  // Find next unmastered node in branch
  return getNextBranchNode(studentId, branchId);
}

/**
 * Get the next unmastered node in a branch.
 */
export async function getNextBranchNode(
  studentId: string,
  branchId: string
): Promise<{ nodeCode: string; title: string } | null> {
  const branch = await prisma.topicBranch.findUnique({
    where: { id: branchId },
  });
  if (!branch) return null;

  for (const nodeId of branch.nodeIds) {
    const mastery = await prisma.masteryScore.findUnique({
      where: { studentId_nodeId: { studentId, nodeId } },
    });

    if (!mastery || !mastery.trulyMastered) {
      const node = await prisma.knowledgeNode.findUnique({
        where: { id: nodeId },
        select: { nodeCode: true, title: true },
      });
      if (node) return node;
    }
  }

  return null; // All nodes in branch mastered
}

// ─── Helpers ───

async function checkPrerequisitesMet(
  studentId: string,
  prerequisiteBranchIds: string[],
  allBranches: Array<{ id: string; nodeIds: string[]; unlocks: Array<{ completedAt: Date | null }> }>
): Promise<boolean> {
  if (prerequisiteBranchIds.length === 0) return true;

  for (const prereqId of prerequisiteBranchIds) {
    const prereqBranch = allBranches.find((b) => b.id === prereqId);
    if (!prereqBranch) return false;

    // Check if all nodes in prerequisite branch are mastered
    for (const nodeId of prereqBranch.nodeIds) {
      const mastery = await prisma.masteryScore.findUnique({
        where: { studentId_nodeId: { studentId, nodeId } },
        select: { trulyMastered: true },
      });
      if (!mastery?.trulyMastered) return false;
    }
  }

  return true;
}
