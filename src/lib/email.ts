/**
 * Canonicalise an email for use as a primary key.
 *
 * - Trim surrounding whitespace.
 * - Lowercase with the "en-US" locale so Turkish i/ı/İ/I rules don't mangle
 *   ASCII domain/local parts. Turkish-locale lowercasing would map "İ" → "i"
 *   but also "I" → "ı", which breaks addresses like "Info@example.com".
 *
 * Use this anywhere an email enters the system: register, login, OAuth callbacks.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
