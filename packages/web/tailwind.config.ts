import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // KinPath Design System v2
        // Primary — Warm Teal: calming, trustworthy, gender-neutral
        brand: {
          50: "#f0fdfb",
          100: "#cbfcf0",
          200: "#97f8e1",
          300: "#5aecce",
          400: "#29d4b7",
          500: "#10b89f", // Primary
          600: "#099483",
          700: "#0b776b",
          800: "#0e5e56",
          900: "#114e48",
        },
        // Secondary — Modern Sage: for trust indicators, vetting, calm accents
        sage: {
          50: "#f4f7f2",
          100: "#e4ebe0",
          200: "#c9d7c2",
          300: "#a5bc9b",
          400: "#7e9e72",
          500: "#5f8253",
          600: "#4b6842",
          700: "#3c5236",
          800: "#32432e",
          900: "#2b3828",
        },
        // Accent — Warm Amber: for standout CTAs and joyful moments
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // Accent
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px -1px rgb(0 0 0 / 0.05)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 4px 12px -4px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
