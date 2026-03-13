/**
 * Theme system for Aauti Learn mobile app.
 *
 * Manual light/dark toggle persisted with AsyncStorage.
 * Default: Light mode.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "aauti_theme_preference";

// ─── Color Tokens ───

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryShadow: string;
  accent: string;
  accentLight: string;
  accentShadow: string;
  success: string;
  successLight: string;
  successShadow: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  xp: string;
  xpLight: string;
  math: string;
  mathLight: string;
  mathBorder: string;
  english: string;
  englishLight: string;
  englishBorder: string;
  gold: string;
  tabBar: string;
  tabBarBorder: string;
}

export const lightColors: ThemeColors = {
  background: "#F8F9FF",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F4F6",
  border: "#E2E8F0",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  primary: "#1CB0F6",
  primaryLight: "rgba(28,176,246,0.1)",
  primaryShadow: "#0A85C7",
  accent: "#7C3AED",
  accentLight: "rgba(124,58,237,0.1)",
  accentShadow: "#5B21B6",
  success: "#3DB54A",
  successLight: "rgba(61,181,74,0.1)",
  successShadow: "#2A8A35",
  error: "#FF4B4B",
  errorLight: "rgba(255,75,75,0.1)",
  warning: "#FF9600",
  warningLight: "rgba(255,150,0,0.1)",
  xp: "#FFC800",
  xpLight: "rgba(255,200,0,0.12)",
  math: "#3b82f6",
  mathLight: "#EFF6FF",
  mathBorder: "#BFDBFE",
  english: "#a855f7",
  englishLight: "#F5F3FF",
  englishBorder: "#DDD6FE",
  gold: "#FFC800",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E2E8F0",
};

export const darkColors: ThemeColors = {
  background: "#060d1f",
  surface: "#0c1628",
  surfaceAlt: "#111827",
  border: "rgba(255,255,255,0.06)",
  text: "#ffffff",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  primary: "#a78bfa",
  primaryLight: "rgba(167,139,250,0.15)",
  primaryShadow: "#7c3aed",
  accent: "#06b6d4",
  accentLight: "rgba(6,182,212,0.15)",
  accentShadow: "#0891b2",
  success: "#34d399",
  successLight: "rgba(52,211,153,0.15)",
  successShadow: "#059669",
  error: "#f87171",
  errorLight: "rgba(248,113,113,0.15)",
  warning: "#fb923c",
  warningLight: "rgba(251,146,60,0.15)",
  xp: "#f97316",
  xpLight: "rgba(249,115,22,0.15)",
  math: "#3b82f6",
  mathLight: "rgba(59,130,246,0.15)",
  mathBorder: "rgba(59,130,246,0.3)",
  english: "#a855f7",
  englishLight: "rgba(168,85,247,0.15)",
  englishBorder: "rgba(168,85,247,0.3)",
  gold: "#fbbf24",
  tabBar: "#0c1628",
  tabBarBorder: "rgba(255,255,255,0.06)",
};

// ─── Context ───

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

// ─── Provider ───

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === "dark") setIsDark(true);
      // Default is light — no action needed if val is null or "light"
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      toggleTheme,
    }),
    [isDark, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ───

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
