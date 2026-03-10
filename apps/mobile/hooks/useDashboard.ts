/**
 * Dashboard data hook — fetches gamification, next concept, and mastery stats.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getGamification,
  getNextConcept,
  getMasteryMap,
} from "@aauti/api-client";

// English domain names — used only as fallback when node.subject isn't the enum
const ENGLISH_DOMAINS = new Set([
  "GRAMMAR", "READING", "WRITING", "VOCABULARY", "LITERATURE",
  "PHONICS", "SPELLING", "COMPREHENSION", "LANGUAGE_ARTS", "ELA", "ENGLISH",
]);

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

      // Fetch gamification, next concept, and mastery map in parallel
      const [gamResult, conceptResult, mapResult] = await Promise.allSettled([
        getGamification(studentId),
        getNextConcept(studentId, apiSubject as "MATH" | "ENGLISH"),
        getMasteryMap(studentId),
      ]);

      if (gamResult.status === "fulfilled") {
        const g = gamResult.value;
        setXp(g.xp ?? 0);
        setLevel(g.level ?? 1);
        // Streak can be an object or a number
        const s = g.streak as any;
        setStreak(typeof s === "object" ? s?.current ?? 0 : s ?? 0);
        setLevelTitle((g as any).title || "Star Seeker");
      }

      const mapNodes =
        mapResult.status === "fulfilled"
          ? ((mapResult.value as any).nodes ?? [])
          : [];

      if (conceptResult.status === "fulfilled") {
        const c = conceptResult.value as any;
        if (c.title) {
          // next-concept API doesn't return nodeId/nodeCode — look it up from mastery map
          const match = mapNodes.find(
            (n: any) => n.name === c.title || n.nodeCode === c.nodeCode
          );
          setNextConcept({
            nodeId: match?.id || c.nodeId || "",
            nodeCode: match?.nodeCode || c.nodeCode || "",
            title: c.title,
            gradeLevel: match?.gradeLevel || c.gradeLevel || "",
            domain: match?.subject || c.domain || c.goalName || "",
          });
        } else {
          setNextConcept(null);
        }
      }

      if (mapResult.status === "fulfilled") {
        const nodes = mapNodes;
        // Filter by selected subject — API returns subject as enum (MATH/ENGLISH)
        // or as domain name (COUNTING, GRAMMAR, etc.) depending on endpoint
        const targetSubject = subject === "english" ? "ENGLISH" : "MATH";
        const subjectNodes = nodes.filter((n: any) => {
          const subj = (n.subject || "").toUpperCase();
          // Direct enum match first
          if (subj === "MATH" || subj === "ENGLISH") return subj === targetSubject;
          // Fallback: classify domain names
          const isEnglish = ENGLISH_DOMAINS.has(subj);
          return subject === "english" ? isEnglish : !isEnglish;
        });
        const mastered = subjectNodes.filter(
          (n: any) => (n.probability ?? n.bktProbability ?? 0) >= 0.85
        ).length;

        setMasteryCount(mastered);
        setTotalCount(subjectNodes.length);
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
