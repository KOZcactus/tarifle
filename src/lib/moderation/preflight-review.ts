/**
 * Rule-based pre-flight for user-submitted reviews. Mirrors the variation
 * preflight's philosophy (soft signals → PENDING_REVIEW, hard profanity
 * handled separately by `blacklist.ts`) but tuned for the review shape:
 * short comment text, no ingredient/step structure to check.
 *
 * Scope is intentionally narrow — reviews carry less content than variations,
 * so we only flag the patterns that legit users almost never produce:
 *   - empty/too-short comment when a comment was given at all
 *   - spam-style repeated characters
 *   - link/URL dropping
 *   - excessive caps (shouting reviews)
 *
 * Rating-only submissions (no comment) skip every string check by definition
 * — there's nothing to preflight. They always go straight to PUBLISHED.
 */

export type ReviewPreflightFlag =
  | "repeated_chars"
  | "excessive_caps"
  | "contains_url";

export interface ReviewPreflightInput {
  comment?: string | null;
}

export interface ReviewPreflightResult {
  flags: ReviewPreflightFlag[];
  /** If true, the review should land in PENDING_REVIEW, not PUBLISHED. */
  needsReview: boolean;
}

// 5+ identical characters in a row = "aaaaaa" style spam signal. Same
// threshold as variation preflight so the two surfaces behave consistently.
const REPEATED_CHAR_PATTERN = /(.)\1{4,}/u;

const URL_PATTERN =
  /(https?:\/\/|www\.)\S+|\b[\w.-]+\.(com|net|org|io|co|info|tr|gov|edu)\b/iu;

// Minimum uppercase ratio to flag "SHOUTING" comments. Zod already enforces
// a 10-char minimum so the sample size is always meaningful by the time we
// get here.
const CAPS_RATIO_THRESHOLD = 0.7;

/**
 * Undo common link-obfuscation tricks so "site . com" / "site[dot]com" /
 * "site (nokta) com" collapse into their real shape before the URL regex
 * runs. Kept identical to `preflight.ts` — same spam-evasion tactics show
 * up here.
 */
function unobfuscateForUrlCheck(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\w)\s*(?:dot|nokta)\s*(\w)/g, "$1.$2")
    .replace(/\s*[[(\{]\s*(?:dot|nokta|\.)\s*[\])}]\s*/g, ".")
    .replace(/\s*\.\s*/g, ".");
}

function uppercaseRatio(text: string): number {
  const letters = Array.from(text).filter((c) => /\p{L}/u.test(c));
  if (letters.length < 8) return 0;
  const upper = letters.filter(
    (c) => c === c.toLocaleUpperCase("tr") && c !== c.toLocaleLowerCase("tr"),
  );
  return upper.length / letters.length;
}

export function computeReviewPreflightFlags(
  input: ReviewPreflightInput,
): ReviewPreflightResult {
  const comment = input.comment?.trim();
  if (!comment) {
    return { flags: [], needsReview: false };
  }

  const flags = new Set<ReviewPreflightFlag>();

  if (REPEATED_CHAR_PATTERN.test(comment)) flags.add("repeated_chars");

  const unobfuscated = unobfuscateForUrlCheck(comment);
  if (URL_PATTERN.test(comment) || URL_PATTERN.test(unobfuscated)) {
    flags.add("contains_url");
  }

  if (uppercaseRatio(comment) > CAPS_RATIO_THRESHOLD) {
    flags.add("excessive_caps");
  }

  return {
    flags: Array.from(flags),
    needsReview: flags.size > 0,
  };
}

/** Human-readable Turkish labels for admin queue rendering. */
export const REVIEW_FLAG_LABELS: Record<ReviewPreflightFlag, string> = {
  repeated_chars: "Tekrar eden karakter deseni (spam şüphesi)",
  excessive_caps: "Aşırı büyük harf kullanımı",
  contains_url: "Yorum içinde bağlantı/URL var",
};
