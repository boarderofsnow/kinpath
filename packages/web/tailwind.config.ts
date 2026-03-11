import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // KinPath Design System v3 — Forest Sage palette
        // Primary — Forest Green: deep, sophisticated, trustworthy
        brand: {
          50: "#f0f6f2",
          100: "#EBF5EF", // Icon circles, pale green tint
          200: "#C9DED1", // Info box border
          300: "#8FA898", // Muted/sage gray text
          400: "#5A9B78", // Divider sage, lighter accents
          500: "#3D7A5A", // CTA button — forest sage
          600: "#326A4C", // CTA hover
          700: "#2B4035", // Header/footer — deep forest
          800: "#223329",
          900: "#1A2E22", // Near-black forest — headings
        },
        // Secondary — Modern Sage: trust indicators, vetting, calm accents
        sage: {
          50: "#F3F8F5", // Info box background
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
        // Accent — Warm Amber: sparingly used for standout moments
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px -1px rgb(0 0 0 / 0.05)",
        card: "0 2px 8px rgb(27 48 35 / 0.08), 0 8px 24px rgb(27 48 35 / 0.06)",
        "card-hover":
          "0 4px 12px rgb(27 48 35 / 0.1), 0 12px 32px rgb(27 48 35 / 0.08)",
        glow: "0 0 20px -5px rgb(43 64 53 / 0.25)",
        "inner-soft": "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "bounce-subtle": "bounceSubtle 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceSubtle: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
