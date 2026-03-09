/**
 * Topic tree data hook — fetches mastery map and groups nodes by grade.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { getMasteryMap } from "@aauti/api-client";
import type { MasteryMapNode } from "@aauti/api-client";

// ─── Subject classification ───
// The API returns domain-level subjects (COUNTING, ALGEBRA, GRAMMAR, etc.)
// We map them to the two top-level categories: math vs english.

const ENGLISH_SUBJECTS = new Set([
  "GRAMMAR",
  "READING",
  "WRITING",
  "VOCABULARY",
  "LITERATURE",
  "PHONICS",
  "SPELLING",
  "COMPREHENSION",
  "LANGUAGE_ARTS",
  "ELA",
  "ENGLISH",
]);

function isMathSubject(subject: string): boolean {
  return !ENGLISH_SUBJECTS.has(subject.toUpperCase());
}

function isEnglishSubject(subject: string): boolean {
  return ENGLISH_SUBJECTS.has(subject.toUpperCase());
}

// ─── Grade ordering ───

const GRADE_ORDER = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

function gradeSort(a: string, b: string): number {
  const ai = GRADE_ORDER.indexOf(a);
  const bi = GRADE_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

// ─── Types ───

export type NodeState = "locked" | "available" | "in_progress" | "mastered";

export interface TopicNode {
  id: string;
  nodeCode: string;
  title: string;
  gradeLevel: string;
  domain: string;
  subject: string;
  state: NodeState;
  masteryPercent: number;
  prerequisiteNames: string[];
}

export interface GradeGroup {
  grade: string;
  label: string;
  nodes: TopicNode[];
  mastered: number;
  total: number;
}

export interface TopicTreeData {
  grades: GradeGroup[];
  totalNodes: number;
  totalMastered: number;
  loading: boolean;
  error: string | null;
  subject: "math" | "english";
  setSubject: (s: "math" | "english") => void;
  refresh: () => void;
}

// ─── Mastery level → state mapping ───

function toNodeState(node: MasteryMapNode): NodeState {
  // API doesn't return isLocked — infer from prerequisites & mastery
  const p = node.bktProbability ?? 0;
  if (p >= 0.85) return "mastered";
  if (p > 0) return "in_progress";
  return "available";
}

// ─── Hook ───

export function useTopicTree(studentId: string | null): TopicTreeData {
  const [subject, setSubject] = useState<"math" | "english">("math");
  const [rawNodes, setRawNodes] = useState<MasteryMapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getMasteryMap(studentId);
      setRawNodes(result.nodes ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load topic tree"
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter by subject and group by grade
  const { grades, totalNodes, totalMastered } = useMemo(() => {
    const filterFn =
      subject === "math" ? isMathSubject : isEnglishSubject;
    const filtered = rawNodes.filter(
      (n) => !n.subject || filterFn(n.subject)
    );

    // Group by grade
    const gradeMap = new Map<string, TopicNode[]>();

    for (const node of filtered) {
      const grade = node.gradeLevel || "?";
      const topicNode: TopicNode = {
        id: node.id,
        nodeCode: node.nodeCode,
        title: (node as any).name || node.title || node.nodeCode,
        gradeLevel: grade,
        domain: node.domain || node.subject,
        subject: node.subject,
        state: toNodeState(node),
        masteryPercent: Math.round((node.bktProbability ?? 0) * 100),
        prerequisiteNames: (node as any).prerequisites ?? node.prerequisiteNames ?? [],
      };

      const existing = gradeMap.get(grade);
      if (existing) {
        existing.push(topicNode);
      } else {
        gradeMap.set(grade, [topicNode]);
      }
    }

    // Sort grades
    const sortedGrades = [...gradeMap.keys()].sort(gradeSort);

    let totalN = 0;
    let totalM = 0;

    const gradeGroups: GradeGroup[] = sortedGrades.map((grade) => {
      const nodes = gradeMap.get(grade)!;
      const mastered = nodes.filter((n) => n.state === "mastered").length;
      totalN += nodes.length;
      totalM += mastered;

      return {
        grade,
        label: grade === "K" ? "Kindergarten" : `Grade ${grade}`,
        nodes,
        mastered,
        total: nodes.length,
      };
    });

    return { grades: gradeGroups, totalNodes: totalN, totalMastered: totalM };
  }, [rawNodes, subject]);

  return {
    grades,
    totalNodes,
    totalMastered,
    loading,
    error,
    subject,
    setSubject,
    refresh: fetchData,
  };
}
