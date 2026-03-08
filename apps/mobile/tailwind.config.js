/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aauti: {
          // Light mode primaries
          primary: "#6C5CE7",
          secondary: "#00CEC9",
          accent: "#FDCB6E",
          success: "#00B894",
          warning: "#E17055",
          danger: "#D63031",
          // Backgrounds
          bg: {
            light: "#F8F9FA",
            dark: "#060d1f",
          },
          // Surfaces
          surface: {
            light: "#FFFFFF",
            dark: "#0c1628",
          },
          surfaceAlt: {
            light: "#F0F0F5",
            dark: "#111827",
          },
          // Borders
          border: {
            light: "#E2E8F0",
            dark: "rgba(255,255,255,0.06)",
          },
          // Text
          text: {
            primary: "#2D3436",
            secondary: "#636E72",
            muted: "#B2BEC3",
            // Dark mode text
            darkPrimary: "#ffffff",
            darkSecondary: "#94a3b8",
            darkMuted: "#64748b",
          },
          // Dark mode accent colors
          dark: {
            primary: "#a78bfa",
            accent: "#06b6d4",
            success: "#34d399",
            error: "#f87171",
            xp: "#f97316",
          },
          // Subject colors
          math: "#3b82f6",
          english: "#a855f7",
        },
      },
    },
  },
  plugins: [],
};
