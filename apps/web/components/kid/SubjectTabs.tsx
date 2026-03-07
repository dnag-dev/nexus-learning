"use client";

/**
 * SubjectTabs — Math / English subject switcher for kid dashboards.
 *
 * ⚠️  CRITICAL FEATURE: Subject switching.
 * This component allows students to switch between Math and English subjects.
 * The selected subject flows through to:
 * 1. TopicSearchInput (filters topic search by subject)
 * 2. Session start link (passes subject param)
 * 3. Topic tree display (filters by domain)
 *
 * DO NOT REMOVE — ensures students can access both Math and English content.
 *
 * Three visual variants:
 * - "young" (Tier 1, K-G3): Large, colorful pill tabs
 * - "mid" (Tier 2, G4-G7): Compact pill tabs
 * - "teen" (Tier 3, G8-G12): Clean underline tabs
 */

import { useState, useCallback } from "react";

export type Subject = "MATH" | "ENGLISH";

interface SubjectTabsProps {
  subject: Subject;
  onSubjectChange: (subject: Subject) => void;
  variant?: "young" | "mid" | "teen";
}

export default function SubjectTabs({
  subject,
  onSubjectChange,
  variant = "mid",
}: SubjectTabsProps) {
  const handleSwitch = useCallback(
    (newSubject: Subject) => {
      if (newSubject !== subject) {
        onSubjectChange(newSubject);
      }
    },
    [subject, onSubjectChange]
  );

  // ─── Young variant (K-G3): Large colorful pills ───
  if (variant === "young") {
    return (
      <div className="flex justify-center gap-3">
        <button
          onClick={() => handleSwitch("MATH")}
          className={`px-6 py-3 rounded-full text-base font-bold transition-all duration-200 ${
            subject === "MATH"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          🔢 Math
        </button>
        <button
          onClick={() => handleSwitch("ENGLISH")}
          className={`px-6 py-3 rounded-full text-base font-bold transition-all duration-200 ${
            subject === "ENGLISH"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          📖 English
        </button>
      </div>
    );
  }

  // ─── Teen variant (G8-G12): Clean underline tabs ───
  if (variant === "teen") {
    return (
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => handleSwitch("MATH")}
          className={`pb-2 text-sm font-medium transition-all ${
            subject === "MATH"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Math
        </button>
        <button
          onClick={() => handleSwitch("ENGLISH")}
          className={`pb-2 text-sm font-medium transition-all ${
            subject === "ENGLISH"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          English
        </button>
      </div>
    );
  }

  // ─── Mid variant (G4-G7): Compact pill tabs ───
  return (
    <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
      <button
        onClick={() => handleSwitch("MATH")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          subject === "MATH"
            ? "bg-purple-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        🔢 Math
      </button>
      <button
        onClick={() => handleSwitch("ENGLISH")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
          subject === "ENGLISH"
            ? "bg-purple-600 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
      >
        📖 English
      </button>
    </div>
  );
}
