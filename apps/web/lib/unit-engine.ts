/**
 * Unit Engine — Phase 13: Unit/Cluster structure utilities.
 *
 * Provides server-side helpers for:
 *   - Fetching units with cluster and node data
 *   - Aggregating mastery per unit/cluster
 *   - Checking unit completion
 *
 * IMPORTANT: Does NOT replace TopicBranch/BranchUnlock (Phase 4).
 * Units are a higher-level grouping on top of existing branch structure.
 */

import { prisma } from "@aauti/db";
import { getMasteryState, aggregateMasteryStates, type MasteryState } from "./mastery-states";

export interface UnitNodeSummary {
  nodeId: string;
  nodeCode: string;
  title: string;
  bktProbability: number;
  masteryState: MasteryState;
  practiceCount: number;
}

export interface ClusterSummary {
  id: string;
  name: string;
  orderIndex: number;
  nodes: UnitNodeSummary[];
  stateCounts: Record<MasteryState, number>;
}

export interface UnitSummary {
  id: string;
  name: string;
  description: string;
  gradeLevel: string;
  subject: string;
  orderIndex: number;
  clusters: ClusterSummary[];
  totalNodes: number;
  masteredNodes: number;
  stateCounts: Record<MasteryState, number>;
  isComplete: boolean;
}

/**
 * Get all units for a student in a specific grade + subject,
 * including cluster breakdowns and mastery states.
 */
export async function getUnitsForStudent(
  studentId: string,
  gradeLevel: string,
  subject: string
): Promise<UnitSummary[]> {
  // Fetch units with clusters and nodes
  const units = await prisma.unit.findMany({
    where: { gradeLevel: gradeLevel as any, subject: subject as any },
    include: {
      clusters: {
        include: { nodes: true },
        orderBy: { orderIndex: "asc" },
      },
      nodes: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  if (units.length === 0) return [];

  // Gather all node IDs across all units
  const allNodeIds = units.flatMap((u) => u.nodes.map((n) => n.id));

  // Fetch mastery scores for all nodes in one query
  const masteryScores = await prisma.masteryScore.findMany({
    where: {
      studentId,
      nodeId: { in: allNodeIds },
    },
  });

  // Build mastery lookup: nodeId → bktProbability
  const masteryMap = new Map<string, { bkt: number; practiceCount: number }>();
  for (const ms of masteryScores) {
    masteryMap.set(ms.nodeId, {
      bkt: ms.bktProbability,
      practiceCount: ms.practiceCount,
    });
  }

  // Build unit summaries
  return units.map((unit) => {
    const clusters: ClusterSummary[] = unit.clusters.map((cluster) => {
      const clusterNodes: UnitNodeSummary[] = cluster.nodes.map((node) => {
        const mastery = masteryMap.get(node.id);
        const bkt = mastery?.bkt ?? 0;
        return {
          nodeId: node.id,
          nodeCode: node.nodeCode,
          title: node.title,
          bktProbability: bkt,
          masteryState: getMasteryState(bkt),
          practiceCount: mastery?.practiceCount ?? 0,
        };
      });

      return {
        id: cluster.id,
        name: cluster.name,
        orderIndex: cluster.orderIndex,
        nodes: clusterNodes,
        stateCounts: aggregateMasteryStates(clusterNodes.map((n) => n.bktProbability)),
      };
    });

    // Also include nodes not assigned to any cluster (unclustered)
    const clusteredNodeIds = new Set(clusters.flatMap((c) => c.nodes.map((n) => n.nodeId)));
    const unclusteredNodes = unit.nodes
      .filter((n) => !clusteredNodeIds.has(n.id))
      .map((node) => {
        const mastery = masteryMap.get(node.id);
        const bkt = mastery?.bkt ?? 0;
        return {
          nodeId: node.id,
          nodeCode: node.nodeCode,
          title: node.title,
          bktProbability: bkt,
          masteryState: getMasteryState(bkt),
          practiceCount: mastery?.practiceCount ?? 0,
        };
      });

    if (unclusteredNodes.length > 0) {
      clusters.push({
        id: `${unit.id}_unclustered`,
        name: "Other Topics",
        orderIndex: 999,
        nodes: unclusteredNodes,
        stateCounts: aggregateMasteryStates(unclusteredNodes.map((n) => n.bktProbability)),
      });
    }

    const allUnitNodes = clusters.flatMap((c) => c.nodes);
    const totalNodes = allUnitNodes.length;
    const masteredNodes = allUnitNodes.filter((n) => n.bktProbability >= 0.85).length;

    return {
      id: unit.id,
      name: unit.name,
      description: unit.description,
      gradeLevel: unit.gradeLevel,
      subject: unit.subject,
      orderIndex: unit.orderIndex,
      clusters,
      totalNodes,
      masteredNodes,
      stateCounts: aggregateMasteryStates(allUnitNodes.map((n) => n.bktProbability)),
      isComplete: totalNodes > 0 && masteredNodes === totalNodes,
    };
  });
}

/**
 * Get a single unit by ID with student mastery data.
 */
export async function getUnitDetail(
  unitId: string,
  studentId: string
): Promise<UnitSummary | null> {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      clusters: {
        include: { nodes: true },
        orderBy: { orderIndex: "asc" },
      },
      nodes: true,
    },
  });

  if (!unit) return null;

  const allNodeIds = unit.nodes.map((n) => n.id);
  const masteryScores = await prisma.masteryScore.findMany({
    where: { studentId, nodeId: { in: allNodeIds } },
  });

  const masteryMap = new Map<string, { bkt: number; practiceCount: number }>();
  for (const ms of masteryScores) {
    masteryMap.set(ms.nodeId, { bkt: ms.bktProbability, practiceCount: ms.practiceCount });
  }

  const clusters: ClusterSummary[] = unit.clusters.map((cluster) => {
    const clusterNodes: UnitNodeSummary[] = cluster.nodes.map((node) => {
      const mastery = masteryMap.get(node.id);
      const bkt = mastery?.bkt ?? 0;
      return {
        nodeId: node.id,
        nodeCode: node.nodeCode,
        title: node.title,
        bktProbability: bkt,
        masteryState: getMasteryState(bkt),
        practiceCount: mastery?.practiceCount ?? 0,
      };
    });
    return {
      id: cluster.id,
      name: cluster.name,
      orderIndex: cluster.orderIndex,
      nodes: clusterNodes,
      stateCounts: aggregateMasteryStates(clusterNodes.map((n) => n.bktProbability)),
    };
  });

  const allNodes = clusters.flatMap((c) => c.nodes);
  const totalNodes = allNodes.length;
  const masteredNodes = allNodes.filter((n) => n.bktProbability >= 0.85).length;

  return {
    id: unit.id,
    name: unit.name,
    description: unit.description,
    gradeLevel: unit.gradeLevel,
    subject: unit.subject,
    orderIndex: unit.orderIndex,
    clusters,
    totalNodes,
    masteredNodes,
    stateCounts: aggregateMasteryStates(allNodes.map((n) => n.bktProbability)),
    isComplete: totalNodes > 0 && masteredNodes === totalNodes,
  };
}
