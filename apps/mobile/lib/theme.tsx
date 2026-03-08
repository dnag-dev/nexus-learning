/**
 * Theme system for Aauti Learn mobile app.
 *
 * Uses React Native's useColorScheme() to automatically follow
 * the system light/dark mode setting. No manual toggle needed.
 */

import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

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
  accent: string;
  accentLight: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  xp: string;
  xpLight: string;
  math: string;
  mathLight: string;
  english: string;
  englishLight: string;
  gold: string;
  tabBar: string;
  tabBarBorder: string;
}

export const lightColors: ThemeColors = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F0F5",
  border: "#E2E8F0",
  text: "#2D3436",
  textSecondary: "#636E72",
  textMuted: "#B2BEC3",
  primary: "#6C5CE7",
  primaryLight: "rgba(108,92,231,0.1)",
  accent: "#00CEC9",
  accentLight: "rgba(0,206,201,0.1)",
  success: "#00B894",
  successLight: "rgba(0,184,148,0.1)",
  error: "#D63031",
  errorLight: "rgba(214,48,49,0.1)",
  warning: "#E17055",
  warningLight: "rgba(225,112,85,0.1)",
  xp: "#F97316",
  xpLight: "rgba(249,115,22,0.1)",
  math: "#3b82f6",
  mathLight: "rgba(59,130,246,0.1)",
  english: "#a855f7",
  englishLight: "rgba(168,85,247,0.1)",
  gold: "#FDCB6E",
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
  accent: "#06b6d4",
  accentLight: "rgba(6,182,212,0.15)",
  success: "#34d399",
  successLight: "rgba(52,211,153,0.15)",
  error: "#f87171",
  errorLight: "rgba(248,113,113,0.15)",
  warning: "#fb923c",
  warningLight: "rgba(251,146,60,0.15)",
  xp: "#f97316",
  xpLight: "rgba(249,115,22,0.15)",
  math: "#3b82f6",
  mathLight: "rgba(59,130,246,0.15)",
  english: "#a855f7",
  englishLight: "rgba(168,85,247,0.15)",
  gold: "#fbbf24",
  tabBar: "#0c1628",
  tabBarBorder: "rgba(255,255,255,0.06)",
};

// ─── Context ───

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

// ─── Provider ───

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ─── Hook ───

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
