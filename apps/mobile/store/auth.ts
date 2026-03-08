/**
 * Auth store — manages child authentication state.
 *
 * Uses expo-secure-store for token persistence and
 * Zustand for reactive state management.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, getSession as apiGetSession } from "@aauti/api-client";
import { initializeApi } from "../lib/api";

const TOKEN_KEY = "aauti-child-token";
const PROFILE_KEY = "aauti-child-profile";

interface ChildProfile {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel?: string;
  ageGroup?: string;
  xp?: number;
  level?: number;
}

interface AuthState {
  // State
  token: string | null;
  profile: ChildProfile | null;
  isParent: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;

  // Actions
  loginAsChild: (username: string, pin: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Configure api-client token getter
  initializeApi(() => get().token);

  return {
    token: null,
    profile: null,
    isParent: false,
    isLoading: false,
    isRestoring: true,
    error: null,

    loginAsChild: async (username: string, pin: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiLogin(username, pin);

        const token = response.token;
        if (!token) {
          throw new Error("No token received from server");
        }

        const profile: ChildProfile = {
          studentId: response.studentId,
          displayName: response.displayName,
          avatarPersonaId: response.avatarPersonaId,
        };

        // Persist token and profile
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));

        set({
          token,
          profile,
          isParent: false,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Login failed";
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    restoreSession: async () => {
      set({ isRestoring: true });
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) {
          set({ isRestoring: false });
          return;
        }

        // Set token first so API calls work
        set({ token });

        // Validate with server
        try {
          const session = await apiGetSession();
          const profile: ChildProfile = {
            studentId: session.studentId,
            displayName: session.displayName,
            avatarPersonaId: session.avatarPersonaId,
            gradeLevel: session.gradeLevel,
            ageGroup: session.ageGroup,
            xp: session.xp,
            level: session.level,
          };

          // Update persisted profile with fresh data
          await SecureStore.setItemAsync(
            PROFILE_KEY,
            JSON.stringify(profile)
          );

          set({ profile, isRestoring: false });
        } catch {
          // Token expired or invalid — try cached profile as fallback
          const cached = await SecureStore.getItemAsync(PROFILE_KEY);
          if (cached) {
            try {
              const profile = JSON.parse(cached) as ChildProfile;
              set({ profile, isRestoring: false });
              return;
            } catch {
              // Corrupt cache
            }
          }

          // Fully expired — clear everything
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(PROFILE_KEY);
          set({ token: null, profile: null, isRestoring: false });
        }
      } catch {
        set({ isRestoring: false });
      }
    },

    logout: () => {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      SecureStore.deleteItemAsync(PROFILE_KEY);
      set({
        token: null,
        profile: null,
        isParent: false,
        error: null,
      });
    },

    clearError: () => set({ error: null }),
  };
});
