import { getSession } from "./neo4j-client";
import type { KnowledgeGraphNode, LearningPath } from "@aauti/types";

function recordToNode(record: Record<string, unknown>): KnowledgeGraphNode {
  return {
    nodeCode: record.nodeCode as string,
    title: record.title as string,
    description: record.description as string,
    gradeLevel: record.gradeLevel as string,
    domain: record.domain as string,
    difficulty: record.difficulty as number,
  };
}

export async function getPrerequisites(
  nodeCode: string
): Promise<KnowledgeGraphNode[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (prereq:KnowledgeNode)-[:PREREQUISITE_OF]->(target:KnowledgeNode {nodeCode: $nodeCode})
       RETURN prereq {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       } AS node
       ORDER BY prereq.difficulty`,
      { nodeCode }
    );
    return result.records.map((r) => recordToNode(r.get("node")));
  } finally {
    await session.close();
  }
}

export async function getSuccessors(
  nodeCode: string
): Promise<KnowledgeGraphNode[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (source:KnowledgeNode {nodeCode: $nodeCode})-[:PREREQUISITE_OF]->(successor:KnowledgeNode)
       RETURN successor {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       } AS node
       ORDER BY successor.difficulty`,
      { nodeCode }
    );
    return result.records.map((r) => recordToNode(r.get("node")));
  } finally {
    await session.close();
  }
}

export async function getShortestLearningPath(
  fromNodeCode: string,
  toNodeCode: string
): Promise<LearningPath> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH path = shortestPath(
         (start:KnowledgeNode {nodeCode: $fromNodeCode})-[:PREREQUISITE_OF*]->(end:KnowledgeNode {nodeCode: $toNodeCode})
       )
       RETURN [n IN nodes(path) | n {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       }] AS pathNodes,
       [r IN relationships(path) |
         { from: startNode(r).nodeCode, to: endNode(r).nodeCode, relationship: type(r) }
       ] AS pathEdges`,
      { fromNodeCode, toNodeCode }
    );

    if (result.records.length === 0) {
      return { nodes: [], edges: [], totalDifficulty: 0 };
    }

    const record = result.records[0];
    const pathNodes: KnowledgeGraphNode[] = (
      record.get("pathNodes") as Record<string, unknown>[]
    ).map(recordToNode);

    const pathEdges = record.get("pathEdges") as Array<{
      from: string;
      to: string;
      relationship: string;
    }>;

    const totalDifficulty = pathNodes.reduce(
      (sum, node) => sum + node.difficulty,
      0
    );

    return {
      nodes: pathNodes,
      edges: pathEdges.map((e) => ({
        from: e.from,
        to: e.to,
        relationship: "PREREQUISITE_OF" as const,
      })),
      totalDifficulty,
    };
  } finally {
    await session.close();
  }
}

export async function getNodesByGradeAndDomain(
  grade: string,
  domain: string
): Promise<KnowledgeGraphNode[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (n:KnowledgeNode)
       WHERE n.gradeLevel = $grade AND n.domain = $domain
       RETURN n {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       } AS node
       ORDER BY n.difficulty, n.nodeCode`,
      { grade, domain }
    );
    return result.records.map((r) => recordToNode(r.get("node")));
  } finally {
    await session.close();
  }
}

export async function getNodeByCode(
  nodeCode: string
): Promise<KnowledgeGraphNode | null> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (n:KnowledgeNode {nodeCode: $nodeCode})
       RETURN n {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       } AS node`,
      { nodeCode }
    );
    if (result.records.length === 0) return null;
    return recordToNode(result.records[0].get("node"));
  } finally {
    await session.close();
  }
}

export async function getAllNodes(): Promise<KnowledgeGraphNode[]> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (n:KnowledgeNode)
       RETURN n {
         .nodeCode, .title, .description, .gradeLevel, .domain, .difficulty
       } AS node
       ORDER BY n.gradeLevel, n.domain, n.difficulty, n.nodeCode`
    );
    return result.records.map((r) => recordToNode(r.get("node")));
  } finally {
    await session.close();
  }
}
