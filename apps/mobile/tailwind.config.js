/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
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
      },
    },
  },
  plugins: [],
};
