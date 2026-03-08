/**
 * Dashboard data hook — fetches gamification, next concept, and mastery stats.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getGamification,
  getNextConcept,
  getTopicTree,
} from "@aauti/api-client";

interface DashboardData {
  // Gamification
  xp: number;
  level: number;
  streak: number;
  levelTitle: string;
  // Next concept
  nextConcept: {
    nodeId: string;
    nodeCode: string;
    title: string;
    gradeLevel: string;
    domain: string;
  } | null;
  // Mastery stats
  masteryCount: number;
  totalCount: number;
  // Loading state
  loading: boolean;
  error: string | null;
  // Subject filter
  subject: "math" | "english";
  setSubject: (s: "math" | "english") => void;
  // Refresh
  refresh: () => void;
}

export function useDashboard(studentId: string | null): DashboardData {
  const [subject, setSubject] = useState<"math" | "english">("math");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [levelTitle, setLevelTitle] = useState("Star Seeker");

  const [nextConcept, setNextConcept] =
    useState<DashboardData["nextConcept"]>(null);
  const [masteryCount, setMasteryCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const apiSubject = subject === "math" ? "MATH" : "ENGLISH";

      // Fetch gamification, next concept, and topic tree in parallel
      const [gamResult, conceptResult, treeResult] = await Promise.allSettled([
        getGamification(studentId),
        getNextConcept(studentId, apiSubject as "MATH" | "ENGLISH"),
        getTopicTree(studentId),
      ]);

      if (gamResult.status === "fulfilled") {
        const g = gamResult.value;
        setXp(g.xp);
        setLevel(g.level);
        setStreak(g.streak?.current ?? 0);
        setLevelTitle(g.title || "Star Seeker");
      }

      if (conceptResult.status === "fulfilled") {
        const c = conceptResult.value;
        setNextConcept(
          c.nodeId
            ? {
                nodeId: c.nodeId,
                nodeCode: c.nodeCode,
                title: c.title,
                gradeLevel: c.gradeLevel,
                domain: c.domain,
              }
            : null
        );
      }

      if (treeResult.status === "fulfilled") {
        const t = treeResult.value;
        setMasteryCount(t.masteredCount ?? 0);
        setTotalCount(t.totalNodes ?? 0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, subject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    xp,
    level,
    streak,
    levelTitle,
    nextConcept,
    masteryCount,
    totalCount,
    loading,
    error,
    subject,
    setSubject,
    refresh: fetchData,
  };
}
