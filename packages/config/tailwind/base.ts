import type { Config } from "tailwindcss";

const baseConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        aauti: {
          primary: "#6C5CE7",
          secondary: "#00CEC9",
          accent: "#FDCB6E",
          success: "#00B894",
          warning: "#E17055",
          danger: "#D63031",
          bg: {
            light: "#F8F9FA",
            dark: "#1A1A2E",
          },
          text: {
            primary: "#2D3436",
            secondary: "#636E72",
            muted: "#B2BEC3",
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
