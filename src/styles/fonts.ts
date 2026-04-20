import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

/**
 * Heading font, only 600 (semibold) and 700 (bold) weights are used
 * across the codebase. Dropping 400/500/800 cuts ~60KB of font files
 * from the critical path, improving LCP.
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["600", "700"],
  adjustFontFallback: true,
});

/**
 * Body font, variable font, single file covers all weights.
 * latin-ext for Turkish character support (ş, ç, ğ, ö, ü, ı, İ).
 */
export const geistSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
  display: "swap",
  adjustFontFallback: true,
});

/** Mono font, code blocks and pre-formatted text only. */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
