"use client";

import { createContext, useContext } from "react";

interface ChildContextValue {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  xp: number;
  level: number;
  gradeLevel: string;
  ageGroup: string;
  firstLoginComplete: boolean;
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
});

export function useChild() {
  return useContext(ChildContext);
}
