"use client";

import { createContext, useContext } from "react";

interface ChildContextValue {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  xp: number;
  level: number;
}

export const ChildContext = createContext<ChildContextValue>({
  studentId: "",
  displayName: "",
  avatarPersonaId: "cosmo",
  xp: 0,
  level: 1,
});

export function useChild() {
  return useContext(ChildContext);
}
