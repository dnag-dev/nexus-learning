"use client";

import { createContext, useContext } from "react";

interface ParentContextValue {
  parentId: string;
  email: string;
  name: string;
  plan: string;
}

export const ParentContext = createContext<ParentContextValue>({
  parentId: "",
  email: "",
  name: "",
  plan: "SPARK",
});

export function useParent() {
  return useContext(ParentContext);
}
