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
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "teaching-dot": {
          "0%, 80%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 12px 2px rgba(108, 92, 231, 0.25)" },
          "50%": { boxShadow: "0 0 22px 6px rgba(108, 92, 231, 0.45)" },
        },
        "star-burst": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.3) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "0.7" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "meter-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 4px rgba(108, 92, 231, 0.3))" },
          "50%": { filter: "drop-shadow(0 0 12px rgba(108, 92, 231, 0.6))" },
        },
        "streak-bump": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        "streak-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "ring-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(253, 203, 110, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 20px rgba(253, 203, 110, 0.7))" },
        },
      },
      animation: {
        ...(baseConfig.theme?.extend as Record<string, unknown>)?.animation as Record<string, unknown> ?? {},
        "avatar-speak": "avatar-speak 0.6s ease-in-out infinite",
        "avatar-happy": "avatar-happy 1s ease-in-out infinite",
        "avatar-think": "avatar-think 2s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "teaching-dot": "teaching-dot 1.4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "star-burst": "star-burst 0.8s ease-out forwards",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "meter-glow": "meter-glow 2s ease-in-out",
        "streak-bump": "streak-bump 0.4s ease-out",
        "streak-shake": "streak-shake 0.4s ease-out",
        "ring-glow": "ring-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
