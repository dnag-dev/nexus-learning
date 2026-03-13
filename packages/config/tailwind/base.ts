import type { Config } from "tailwindcss";

const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        aauti: {
          primary: "#1CB0F6",
          "primary-shadow": "#0A85C7",
          brand: "#7C3AED",
          "brand-shadow": "#5B21B6",
          secondary: "#7C3AED",
          accent: "#FFC800",
          success: "#3DB54A",
          "success-shadow": "#2A8A35",
          warning: "#FF9600",
          danger: "#FF4B4B",
          xp: "#FFC800",
          streak: "#FF9600",
          bg: {
            light: "#F8F9FF",
            dark: "#060d1f",
          },
          surface: {
            DEFAULT: "#FFFFFF",
            alt: "#F3F4F6",
          },
          border: "#E2E8F0",
          text: {
            primary: "#1F2937",
            secondary: "#6B7280",
            muted: "#9CA3AF",
          },
          math: {
            DEFAULT: "#3b82f6",
            light: "#EFF6FF",
            border: "#BFDBFE",
          },
          english: {
            DEFAULT: "#a855f7",
            light: "#F5F3FF",
            border: "#DDD6FE",
          },
        },
        constellation: {
          dim: "#4A5568",
          glowing: "#4299E1",
          bright: "#ECC94B",
          pulsing: "#9F7AEA",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        aauti: "12px",
      },
      animation: {
        "star-pulse": "star-pulse 2s ease-in-out infinite",
        "star-glow": "star-glow 3s ease-in-out infinite",
        celebration: "celebration 0.6s ease-out",
      },
      keyframes: {
        "star-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.1)" },
        },
        "star-glow": {
          "0%, 100%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(1.5)" },
        },
        celebration: {
          "0%": { transform: "scale(0.8) rotate(-5deg)", opacity: "0" },
          "50%": { transform: "scale(1.1) rotate(3deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default baseConfig;
