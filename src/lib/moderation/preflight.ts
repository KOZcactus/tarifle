/**
 * Rule-based pre-flight checks for user-submitted variations. Run AFTER the
 * hard blacklist filter — if blacklist catches profanity we reject outright
 * with an explicit error. Pre-flight signals are softer: each one suggests
 * the content might need a human eye, but none of them on its own means the
 * content is definitely bad. When any fire, the variation is saved as
 * `PENDING_REVIEW` so a moderator can glance at it before it goes live.
 *
 * The rules are deliberately conservative — we'd rather flag a legit user
 * and unblock them in seconds than auto-publish a spam post. The admin UI
 * shows the exact flag codes so reviewers know what tripped the net.
 *
 * Scope: string-level heuristics only. No external services, no AI. If we
 * ever add Claude-assisted pre-classification, it slots in as an extra
 * signal on top of these.
 */

export type PreflightFlag =
  | "too_short"
  | "too_long"
  | "repeated_chars"
  | "excessive_caps"
  | "contains_url"
  | "missing_steps"
  | "too_many_steps";

export interface PreflightInput {
  miniTitle: string;
  description?: string | null;
  ingredients: string[];
  steps: string[];
  notes?: string | null;
}

export interface PreflightResult {
  flags: PreflightFlag[];
  /** If true, the variation should land in PENDING_REVIEW, not PUBLISHED. */
  needsReview: boolean;
}

const MIN_TOTAL_CONTENT_CHARS = 30;
const MAX_TOTAL_CONTENT_CHARS = 15_000;
const MIN_STEPS = 1;
const MAX_STEPS = 25;

// 5+ identical characters in a row = "aaaaaa" style spam signal. We accept
// 4 in a row (common in real Turkish words and emphasis — "merhabaaa").
const REPEATED_CHAR_PATTERN = /(.)\1{4,}/u;

const URL_PATTERN =
  /(https?:\/\/|www\.)\S+|\b[\w.-]+\.(com|net|org|io|co|info|tr|gov|edu)\b/iu;

// Share of uppercase letters in a string, ignoring digits/punctuation. Used
// to flag SHOUTING titles like "EN GÜZEL YEMEK!!!". Threshold is deliberately
// high so legitimate Turkish ALL-CAPS like "GÜL" (proper noun) at low volume
// don't trip.
function uppercaseRatio(text: string): number {
  const letters = Array.from(text).filter((c) => /\p{L}/u.test(c));
  if (letters.length < 8) return 0; // too short to meaningfully measure
  const upper = letters.filter((c) => c === c.toLocaleUpperCase("tr") && c !== c.toLocaleLowerCase("tr"));
  return upper.length / letters.length;
}

export function computePreflightFlags(input: PreflightInput): PreflightResult {
  const flags = new Set<PreflightFlag>();

  const allText = [
    input.miniTitle,
    input.description ?? "",
    input.ingredients.join("\n"),
    input.steps.join("\n"),
    input.notes ?? "",
  ]
    .join("\n")
    .trim();

  if (allText.length < MIN_TOTAL_CONTENT_CHARS) flags.add("too_short");
  if (allText.length > MAX_TOTAL_CONTENT_CHARS) flags.add("too_long");

  if (input.steps.length < MIN_STEPS) flags.add("missing_steps");
  if (input.steps.length > MAX_STEPS) flags.add("too_many_steps");

  if (REPEATED_CHAR_PATTERN.test(allText)) flags.add("repeated_chars");

  if (URL_PATTERN.test(allText)) flags.add("contains_url");

  // CAPS check targets title + description — users abbreviating in steps
  // (e.g. "TL", "MM") shouldn't trigger it.
  const titleDesc = `${input.miniTitle} ${input.description ?? ""}`;
  if (uppercaseRatio(titleDesc) > 0.7) flags.add("excessive_caps");

  return {
    flags: Array.from(flags),
    needsReview: flags.size > 0,
  };
}

/** Human-readable Turkish labels for flag codes. Used in the admin UI. */
export const FLAG_LABELS: Record<PreflightFlag, string> = {
  too_short: "Çok kısa içerik",
  too_long: "Aşırı uzun içerik",
  repeated_chars: "Tekrar eden karakter deseni (spam şüphesi)",
  excessive_caps: "Aşırı büyük harf kullanımı",
  contains_url: "Metin içinde bağlantı/URL var",
  missing_steps: "Adım verilmemiş",
  too_many_steps: "Çok fazla adım",
};
