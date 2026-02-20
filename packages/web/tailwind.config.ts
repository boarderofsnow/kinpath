import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // KinPath Design System v3 — Updated palette
        // Primary — Muted Sage: calming, trustworthy, gender-neutral
        brand: {
          50: "#f3f5f2",
          100: "#e2e7e0",
          200: "#c5cfc2",
          300: "#a3b39f",
          400: "#8f9e8c", // Palette sage
          500: "#6e836b", // Primary
          600: "#576a55",
          700: "#465544",
          800: "#3a4639",
          900: "#303a2f",
        },
        // Secondary — Dark Slate: for grounding, trust indicators, strong text
        sage: {
          50: "#f0f2f3",
          100: "#dce0e2",
          200: "#b8c0c5",
          300: "#8e9aa1",
          400: "#6b7980",
          500: "#536068",
          600: "#4a555c",
          700: "#3d4a4f", // Palette charcoal
          800: "#343e43",
          900: "#2a3236",
        },
        // Accent — Warm Camel: for standout CTAs and joyful moments
        accent: {
          50: "#faf6f1",
          100: "#f2e8db",
          200: "#e5d0b6",
          300: "#d4b28a",
          400: "#c99b70", // Palette tan
          500: "#b58560", // Palette terracotta
          600: "#9c6d4a",
          700: "#81573d",
          800: "#6a4735",
          900: "#573c2e",
        },
        // Warm cream override for stone neutrals
        stone: {
          50: "#faf9f7",
          100: "#f3f1ed",
          200: "#e8e0d6", // Palette cream
          300: "#d6cbbe",
          400: "#bfb0a0",
          500: "#a89785",
          600: "#8e7d6d",
          700: "#75665a",
          800: "#61544b",
          900: "#524840",
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
