import type { Config } from "tailwindcss";

// Curiosbot 2.0 design tokens — derived from the live site palette (docs/01-brand-analysis.md)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0067FF", 50: "#E7F6FF", 400: "#3D8BFF", 500: "#0067FF", 600: "#0052CC", 700: "#003D99" },
        violet: { DEFAULT: "#7C3AED", 400: "#9F6BF5", 500: "#7C3AED", 600: "#6427CC" },
        ink: { DEFAULT: "#0F172A", 900: "#070614", 800: "#0F172A", 700: "#1B2438", 600: "#364151", 300: "#D1DAE5" },
        signal: "#22D3EE",
        copper: "#C99A67",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-open-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg,#0067FF 0%,#7C3AED 100%)",
        "grid-fade": "radial-gradient(ellipse at 50% 0%,rgba(0,103,255,.25),transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.06), 0 20px 60px -20px rgba(0,103,255,.45)",
      },
    },
  },
  plugins: [],
};
export default config;
