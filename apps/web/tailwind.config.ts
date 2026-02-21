import type { Config } from "tailwindcss";
import baseConfig from "../../packages/config/tailwind/base";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      ...baseConfig.theme?.extend,
      keyframes: {
        ...(baseConfig.theme?.extend as Record<string, unknown>)?.keyframes as Record<string, unknown> ?? {},
        "avatar-speak": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "avatar-happy": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "avatar-think": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        ...(baseConfig.theme?.extend as Record<string, unknown>)?.animation as Record<string, unknown> ?? {},
        "avatar-speak": "avatar-speak 0.6s ease-in-out infinite",
        "avatar-happy": "avatar-happy 1s ease-in-out infinite",
        "avatar-think": "avatar-think 2s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
