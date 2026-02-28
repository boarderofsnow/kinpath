import { Platform, type ViewStyle } from "react-native";

// ── Color Palette ───────────────────────────────────────────
// Mirrors packages/web/tailwind.config.ts KinPath Design System v2

export const colors = {
  // Primary — Warm Teal: calming, trustworthy, gender-neutral
  brand: {
    50: "#f0fdfb",
    100: "#cbfcf0",
    200: "#97f8e1",
    300: "#5aecce",
    400: "#29d4b7",
    500: "#10b89f",
    600: "#099483",
    700: "#0b776b",
    800: "#0e5e56",
    900: "#114e48",
  },
  // Secondary — Modern Sage: trust indicators, vetting, calm accents
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
  // Accent — Warm Amber: standout CTAs, joyful moments
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
  // Stone neutrals
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
  },
  // Domain-specific colors (child development)
  domain: {
    motor: { bg: "#dbeafe", text: "#2563eb" },
    language: { bg: "#ede9fe", text: "#7c3aed" },
    cognitive: { bg: "#fef3c7", text: "#b45309" },
    social: { bg: "#ffe4e6", text: "#e11d48" },
  },
  // Semantic
  background: "#f0eeec",
  foreground: "#1c1917",
  white: "#ffffff",
  error: "#dc2626",
  errorLight: "#fef2f2",
} as const;

// ── Typography ──────────────────────────────────────────────

export const fonts = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  display: "DMSerifDisplay_400Regular",
} as const;

export const typography = {
  // Display headings — DM Serif Display
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 44,
  },
  displayMedium: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
  },
  displaySmall: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
  },
  // Section / UI headings — Inter Bold
  headingLarge: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    lineHeight: 28,
  },
  headingMedium: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  headingSmall: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  // Body text — Inter Regular/Medium
  bodyLarge: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  // Labels — Inter Medium/SemiBold
  labelLarge: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  labelSmall: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
  },
  // Overline — uppercase section titles
  overline: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
} as const;

// ── Spacing ─────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

// ── Border Radii ────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

// ── Shadows ─────────────────────────────────────────────────
// Mirrors web's custom box-shadow system

export const shadows: Record<string, ViewStyle> = {
  soft: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
  }) as ViewStyle,

  card: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
  }) as ViewStyle,

  cardHover: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
  }) as ViewStyle,

  glow: Platform.select({
    ios: {
      shadowColor: colors.brand[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }) as ViewStyle,
};

// ── Common Style Fragments ──────────────────────────────────

export const cardBase: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: `${colors.stone[200]}99`, // ~60% opacity
  ...shadows.card,
};

export const pillBase: ViewStyle = {
  borderRadius: radii.full,
  paddingHorizontal: 14,
  paddingVertical: 7,
};
