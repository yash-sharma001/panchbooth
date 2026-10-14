import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        "ink-dim": "var(--ink-dim)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        deva: "var(--deva)",
        asura: "var(--asura)",
        earth: "var(--earth)",
        water: "var(--water)",
        fire: "var(--fire)",
        air: "var(--air)",
        akasha: "var(--akasha)",
        p0: "var(--p0)",
        p1: "var(--p1)",
        p2: "var(--p2)",
        p3: "var(--p3)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px"
      }
    }
  },
  plugins: []
};

export default config;
