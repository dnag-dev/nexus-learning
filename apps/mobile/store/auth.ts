/**
 * Auth store — manages child AND parent authentication state.
 *
 * Uses expo-secure-store for token persistence and
 * Zustand for reactive state management.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import {
  login as apiLogin,
  getSession as apiGetSession,
  parentRegister as apiParentRegister,
  parentLogin as apiParentLogin,
  getParentSession as apiGetParentSession,
} from "@aauti/api-client";
import { initializeApi } from "../lib/api";

const TOKEN_KEY = "aauti-child-token";
const PROFILE_KEY = "aauti-child-profile";
const PARENT_TOKEN_KEY = "aauti-parent-token";
const PARENT_PROFILE_KEY = "aauti-parent-profile";

interface ChildProfile {
  studentId: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel?: string;
  ageGroup?: string;
  xp?: number;
  level?: number;
}

export interface ParentChild {
  id: string;
  displayName: string;
  avatarPersonaId: string;
  gradeLevel: string;
}

interface ParentProfile {
  parentId: string;
  email: string;
  name: string;
  plan: string;
  children: ParentChild[];
}

interface AuthState {
  // State
  token: string | null;
  profile: ChildProfile | null;
  parentProfile: ParentProfile | null;
  selectedChildId: string | null;
  isParent: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;

  // Actions
  loginAsChild: (username: string, pin: string) => Promise<void>;
  registerAsParent: (email: string, password: string, name?: string) => Promise<void>;
  loginAsParent: (email: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  selectChild: (childId: string) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Configure api-client token getter
  initializeApi(() => get().token);

  return {
    token: null,
    profile: null,
    parentProfile: null,
    selectedChildId: null,
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
          parentProfile: null,
          selectedChildId: null,
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

    registerAsParent: async (email: string, password: string, name?: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiParentRegister(email, password, name);

        const token = response.token;
        if (!token) {
          throw new Error("No token received from server");
        }

        const parentProfile: ParentProfile = {
          parentId: response.parentId,
          email: response.email,
          name: response.name,
          plan: response.plan,
          children: response.children,
        };

        // Persist token and profile
        await SecureStore.setItemAsync(PARENT_TOKEN_KEY, token);
        await SecureStore.setItemAsync(
          PARENT_PROFILE_KEY,
          JSON.stringify(parentProfile)
        );

        set({
          token,
          profile: null,
          parentProfile,
          selectedChildId: null,
          isParent: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    loginAsParent: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiParentLogin(email, password);

        const token = response.token;
        if (!token) {
          throw new Error("No token received from server");
        }

        const parentProfile: ParentProfile = {
          parentId: response.parentId,
          email: response.email,
          name: response.name,
          plan: response.plan,
          children: response.children,
        };

        // Auto-select the first child
        const firstChildId =
          response.children.length > 0 ? response.children[0].id : null;

        // Persist token and profile
        await SecureStore.setItemAsync(PARENT_TOKEN_KEY, token);
        await SecureStore.setItemAsync(
          PARENT_PROFILE_KEY,
          JSON.stringify(parentProfile)
        );

        set({
          token,
          profile: null,
          parentProfile,
          selectedChildId: firstChildId,
          isParent: true,
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
        // Try child token first
        const childToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (childToken) {
          set({ token: childToken });

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

            await SecureStore.setItemAsync(
              PROFILE_KEY,
              JSON.stringify(profile)
            );

            set({ profile, isParent: false, isRestoring: false });
            return;
          } catch {
            // Token expired — try cached profile
            const cached = await SecureStore.getItemAsync(PROFILE_KEY);
            if (cached) {
              try {
                const profile = JSON.parse(cached) as ChildProfile;
                set({ profile, isParent: false, isRestoring: false });
                return;
              } catch {
                // Corrupt cache
              }
            }

            // Clear expired child session
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(PROFILE_KEY);
            set({ token: null });
          }
        }

        // Try parent token
        const parentToken = await SecureStore.getItemAsync(PARENT_TOKEN_KEY);
        if (parentToken) {
          set({ token: parentToken });

          try {
            const session = await apiGetParentSession();
            const parentProfile: ParentProfile = {
              parentId: session.parentId,
              email: session.email,
              name: session.name,
              plan: session.plan,
              children: session.children,
            };

            const firstChildId =
              session.children.length > 0 ? session.children[0].id : null;

            await SecureStore.setItemAsync(
              PARENT_PROFILE_KEY,
              JSON.stringify(parentProfile)
            );

            set({
              parentProfile,
              selectedChildId: firstChildId,
              isParent: true,
              isRestoring: false,
            });
            return;
          } catch {
            // Token expired — try cached profile
            const cached = await SecureStore.getItemAsync(PARENT_PROFILE_KEY);
            if (cached) {
              try {
                const parentProfile = JSON.parse(cached) as ParentProfile;
                const firstChildId =
                  parentProfile.children.length > 0
                    ? parentProfile.children[0].id
                    : null;
                set({
                  parentProfile,
                  selectedChildId: firstChildId,
                  isParent: true,
                  isRestoring: false,
                });
                return;
              } catch {
                // Corrupt cache
              }
            }

            // Clear expired parent session
            await SecureStore.deleteItemAsync(PARENT_TOKEN_KEY);
            await SecureStore.deleteItemAsync(PARENT_PROFILE_KEY);
            set({ token: null });
          }
        }

        // No valid session found
        set({ isRestoring: false });
      } catch {
        set({ isRestoring: false });
      }
    },

    selectChild: (childId: string) => {
      set({ selectedChildId: childId });
    },

    logout: () => {
      const { isParent } = get();

      // Clear state immediately so UI updates
      set({
        token: null,
        profile: null,
        parentProfile: null,
        selectedChildId: null,
        isParent: false,
        error: null,
      });

      // Clean up stored credentials
      if (isParent) {
        SecureStore.deleteItemAsync(PARENT_TOKEN_KEY).catch(() => {});
        SecureStore.deleteItemAsync(PARENT_PROFILE_KEY).catch(() => {});
      } else {
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        SecureStore.deleteItemAsync(PROFILE_KEY).catch(() => {});
      }
    },

    clearError: () => set({ error: null }),
  };
});
