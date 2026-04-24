/**
 * LocalStorage-backed "recent ingredients" memory for the AI modals.
 * Each successful plan/suggestion pushes the user's pantry tokens into
 * a deduped LRU list, capped at 12. The modals render the list as
 * quick-add chips so a returning user doesn't retype their staples.
 *
 * Zero backend cost; intentional client-only so the list stays on the
 * device (privacy + KVKK friendly).
 */

const STORAGE_KEY = "tarifle-pantry-history";
const MAX_HISTORY = 12;
const MAX_ITEM_LENGTH = 80;

function trLower(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı");
}

function safeParse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= MAX_ITEM_LENGTH)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function readPantryHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

/**
 * Adds pantry ingredients to the history with LRU semantics:
 *   - New items appear first
 *   - Duplicates (Turkish-locale case-insensitive) collapse, kept copy
 *     uses the latest casing
 *   - Cap at MAX_HISTORY (oldest trimmed)
 *
 * Returns the updated list for optional UI sync.
 */
export function pushToPantryHistory(incoming: string[]): string[] {
  if (typeof window === "undefined") return [];
  const current = readPantryHistory();
  const seen = new Map<string, string>();
  for (const raw of incoming) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > MAX_ITEM_LENGTH) continue;
    seen.set(trLower(trimmed), trimmed);
  }
  for (const existing of current) {
    const key = trLower(existing);
    if (!seen.has(key)) seen.set(key, existing);
  }
  const next = Array.from(seen.values()).slice(0, MAX_HISTORY);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode, drop silently */
  }
  return next;
}

export function clearPantryHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
