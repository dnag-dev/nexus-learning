"use client";

import { createContext, useContext } from "react";

export interface AautiUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export interface UserContextValue {
  user: AautiUser | null;
  isLoading: boolean;
  error: Error | null;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  error: null,
});

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
