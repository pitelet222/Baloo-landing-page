import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A18",
        muted: "#6F756E",
        line: "#ECEBE5",
        paper: "#FFFFFF",
        canvas: "#FBFBF8",
        natural: { DEFAULT: "#2E7D52", soft: "#E7F1EB" },
        processed: { DEFAULT: "#B5701F", soft: "#F6ECDD" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { tool: "640px" },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { rise: "rise 0.35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
