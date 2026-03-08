"use client";

import { createContext, useContext } from "react";

interface ChildContextValue {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  // Single source of truth for XP — always read from here, not from session sums
  xp: number;
  level: number;
  gradeLevel: string;
  ageGroup: string;
  firstLoginComplete: boolean;
  /** Call after XP-changing actions (session complete, etc.) to refresh header values */
  refreshProfile: () => void;
}

export const ChildContext = createContext<ChildContextValue>({
  studentId: "",
  displayName: "",
  avatarPersonaId: "cosmo",
  xp: 0,
  level: 1,
  gradeLevel: "G3",
  ageGroup: "MID_8_10",
  firstLoginComplete: true,
  refreshProfile: () => {},
});

export function useChild() {
  return useContext(ChildContext);
}
