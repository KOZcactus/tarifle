/**
 * Tarifle brand renkleri.
 *
 * Web tarafı: globals.css'te `--color-primary: #a03b0f` gibi CSS
 * değişkenleri olarak kullanılır.
 * Mobile: bu dosyadan import edilir, React Native StyleSheet.
 *
 * Single source of truth: bu dosya. Web CSS değişkenleri buradan
 * üretilir (Phase 0'da web build script ek).
 */

export const colors = {
  // Brand primary
  primary: "#a03b0f",            // Deep terracotta (signature)
  primaryDark: "#7a2c0a",
  primaryLight: "#c4502a",

  // Brand secondary
  secondary: "#f4ead5",          // Warm cream (background accent)
  secondaryDark: "#e6d6b3",
  secondaryLight: "#fbf6e9",

  // Brand accent
  accent: "#2d5016",             // Forest green (vegan/sebze ikonları)
  accentLight: "#4a7d27",

  // Neutral palette (UI gri tonları)
  background: "#ffffff",
  backgroundDark: "#1a1410",
  surface: "#fafafa",
  surfaceDark: "#2a201a",

  textPrimary: "#1f1410",
  textSecondary: "#6a5d50",
  textMuted: "#a09080",
  textInverse: "#ffffff",

  border: "#e5dfd0",
  borderStrong: "#c4b89c",
  borderDark: "#3a2f25",

  // Semantic
  success: "#2d7a3d",
  warning: "#d68900",
  error: "#c53030",
  info: "#2563eb",

  // Allergen colors (UI ikonu)
  allergenGluten: "#d4a574",
  allergenSut: "#fff8e0",
  allergenYumurta: "#f4d35e",
  allergenKusuyemis: "#9b6f44",
  allergenDeniz: "#5d8aa8",

  // Diet badge colors
  vegan: "#4a7d27",
  vejetaryen: "#7da356",
  glutensiz: "#d4a574",
  dusukSeker: "#8aa3d4",
  ketoHassas: "#a85a3a",
  akdeniz: "#7ba5b3",
} as const;

export type ColorKey = keyof typeof colors;
