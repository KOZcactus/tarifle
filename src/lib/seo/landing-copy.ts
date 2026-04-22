/**
 * Landing sayfası SEO copy (intro + FAQ) lookup.
 *
 * Codex Mod C teslimi `docs/seo-copy-v1.json`. 38 item array:
 *   { slug, type: "category" | "cuisine" | "diet", intro, faqs: [{q, a}, ...] }
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §12.
 *
 * Bu modül JSON'u build-time import eder (statik), runtime fs read yok.
 * Lookup O(1), Map cache. Slug+type pair unique key.
 *
 * Cuisine slug normalization: Codex "ingiltere" yazdı, sistem "ingiliz"
 * (CUISINE_SLUG mapping). Alias tablosu mismatch'i kapatır.
 */
import seoCopyData from "../../../docs/seo-copy-v1.json";

export type LandingCopyType = "category" | "cuisine" | "diet";

export interface LandingCopyFaq {
  q: string;
  a: string;
}

export interface LandingCopyItem {
  slug: string;
  type: LandingCopyType;
  intro: string;
  faqs: LandingCopyFaq[];
}

/**
 * Codex slug → site slug alias. Mod C teslimde 1 mismatch:
 * - "ingiltere" (Codex) → "ingiliz" (CUISINE_SLUG.gb)
 * Yeni mismatch çıkarsa buraya ekle, JSON'u Codex'e geri vermeden çöz.
 */
const SLUG_ALIAS: Record<LandingCopyType, Record<string, string>> = {
  category: {},
  cuisine: {
    ingiltere: "ingiliz",
  },
  diet: {},
};

function normaliseSlug(type: LandingCopyType, slug: string): string {
  return SLUG_ALIAS[type][slug] ?? slug;
}

const data = seoCopyData as LandingCopyItem[];

const COPY_MAP = new Map<string, LandingCopyItem>();
for (const item of data) {
  const normalised = normaliseSlug(item.type, item.slug);
  COPY_MAP.set(`${item.type}:${normalised}`, { ...item, slug: normalised });
}

/**
 * Slug + type için landing copy döndür. Yoksa null (sayfa intro+FAQ
 * göstermez, fallback CUISINE_DESCRIPTION_TR/EN gibi mevcut metinler).
 */
export function getLandingCopy(
  type: LandingCopyType,
  slug: string,
): LandingCopyItem | null {
  return COPY_MAP.get(`${type}:${slug}`) ?? null;
}
