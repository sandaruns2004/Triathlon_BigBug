import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Waypoint Flow Design System ─────────────────────
        "wp-green":   "#146B45",  // Deep brand green — nav, headings
        "wp-action":  "#1F8A5B",  // Primary buttons, interactive
        "wp-success": "#168050",  // Delivered / confirmed
        "wp-pale":    "#EAF6EF",  // Surfaces, selected states
        "wp-ink":     "#17221D",  // Primary text
        "wp-muted":   "#63716A",  // Secondary text, labels
        "wp-border":  "#DCE5DF",  // Card borders, dividers
        "wp-canvas":  "#F6F8F7",  // Page background
        // amber-* → attention / at-risk
        // red-*   → blocked / failed ONLY
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card:  "10px",
        panel: "14px",
      },
      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.08)",
        drawer: "0 4px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
