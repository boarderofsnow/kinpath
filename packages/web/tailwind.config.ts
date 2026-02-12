import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // KinPath brand colors — adjust as needed
        brand: {
          50: "#fdf4f0",
          100: "#fbe5dc",
          200: "#f7c9b8",
          300: "#f0a48a",
          400: "#e87a5b",
          500: "#dc5a3a", // Primary
          600: "#c44428",
          700: "#a33522",
          800: "#862e21",
          900: "#6e2a20",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e3ebe3",
          200: "#c8d7c8",
          300: "#a2bba2",
          400: "#7a9c7a",
          500: "#5a805a", // Secondary
          600: "#466646",
          700: "#3a5239",
          800: "#304330",
          900: "#293829",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
