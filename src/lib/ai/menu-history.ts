/**
 * AI v4.3 Anti-repeat seed (#6): localStorage LRU son önerilen slug'lar.
 *
 * Kullanıcı v4 menü planlayıcıyı her açtığında planner son 14 gün
 * içinde önerilen slug'ları "excludeSlugs" olarak alır, pool'u onlar
 * dışından seçer. "Hep aynı 20 tarifi görüyorum" hissini engeller.
 *
 * Storage şekli:
 *   { slug, at }  // at = unix ms
 * LRU: en eski N entry'yi at sort'tan düşür. Max 200 slug tutar.
 * Kalıcı veri değil, kullanıcı cihaza bağlı; birden fazla cihaz
 * kullanan kullanıcı cihaz başına ayrı history'ye sahiptir (kabul).
 */

const KEY = "tarifle.menu.history.v1";
const MAX_ENTRIES = 200;
const DEFAULT_WINDOW_DAYS = 14;

interface Entry {
  slug: string;
  at: number;
}

function safeParse(raw: string | null): Entry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e): e is Entry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Entry).slug === "string" &&
        typeof (e as Entry).at === "number",
    );
  } catch {
    return [];
  }
}

function readAll(): Entry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY));
}

function writeAll(entries: Entry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage dolu / privacy modu; sessizce geç.
  }
}

/**
 * Yeni üretilen menü slug'larını history'ye ekler. Aynı slug birden
 * fazla kez gelirse en yeni timestamp'i tutar (reset semantik: "bu
 * tarif yeniden önerildi, sayacı sıfırla").
 */
export function pushGeneratedSlugs(slugs: string[]): void {
  if (slugs.length === 0) return;
  const current = readAll();
  const now = Date.now();
  const slugSet = new Set(slugs.filter((s) => s && s.length > 0));
  const filtered = current.filter((e) => !slugSet.has(e.slug));
  const next: Entry[] = [
    ...Array.from(slugSet).map((slug) => ({ slug, at: now })),
    ...filtered,
  ].slice(0, MAX_ENTRIES);
  writeAll(next);
}

/**
 * Son `windowDays` gün içinde önerilmiş slug'ları döndürür. Planner
 * bunları `excludeSlugs` olarak alır, pool'dan çıkarır.
 */
export function readRecentSlugs(windowDays = DEFAULT_WINDOW_DAYS): string[] {
  const current = readAll();
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return current.filter((e) => e.at >= cutoff).map((e) => e.slug);
}

/** Test + debug için tüm history'yi sıfırlar. */
export function clearMenuHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
