/**
 * Tarifle typography scale.
 *
 * Web font: PP Editorial New (display) + Inter (body)
 * Mobile: System default (San Francisco iOS / Roboto Android) +
 * custom display font (PP Editorial New) sadece h1/h2 için (perf).
 */

export const fontFamily = {
  // Mobile system default
  systemRegular: "System",
  systemMedium: "System",
  systemBold: "System",
  // Custom display (loaded via expo-font)
  display: "PPEditorialNew",
  displayItalic: "PPEditorialNew-Italic",
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  huge: 48,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  tight: 1.1,
  base: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
