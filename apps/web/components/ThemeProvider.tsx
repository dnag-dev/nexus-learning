"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const THEME_STORAGE_KEY = "aauti_theme";

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
});

export function useWebTheme() {
  return useContext(ThemeContext);
}

export function WebThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      }
    } catch {
      // SSR or localStorage unavailable
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      } catch {
        // localStorage unavailable
      }
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
