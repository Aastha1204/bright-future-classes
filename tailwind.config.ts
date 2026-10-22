import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "rgb(var(--primary) / <alpha-value>)", light: "rgb(var(--primary-light) / <alpha-value>)" },
        accent: "rgb(var(--accent) / <alpha-value>)",
        hot: "rgb(var(--hot) / <alpha-value>)",
        warm: "rgb(var(--warm) / <alpha-value>)",
        cold: "rgb(var(--cold) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["Rupee", "var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["Rupee", "var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.10)",
        glow: "0 0 0 4px rgb(239 68 68 / 0.15), 0 0 24px rgb(239 68 68 / 0.45)",
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        flash: { "0%": { backgroundColor: "rgb(250 204 21 / 0.55)" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: { bob: "bob 4s ease-in-out infinite", flash: "flash 1.2s ease-out" },
    },
  },
  plugins: [],
};
export default config;
