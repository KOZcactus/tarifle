/**
 * Content quality metrics for admin analytics dashboard.
 *
 * Coverage'ları tek sorguda toplar: isFeatured, Mod B (EN+DE full
 * ingredients/steps), tipNote, servingSuggestion, allergen. Audit-deep
 * tetikleme overhead'i büyük, burada DB'de yalın field check ile %-
 * based coverage cards besliyoruz. Admin "Content Quality" widget'i.
 */
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface ContentQualityStats {
  total: number;
  featuredCount: number;
  featuredRatio: number;
  tipNoteCount: number;
  tipNoteRatio: number;
  servingSuggestionCount: number;
  servingSuggestionRatio: number;
  modBFullCount: number;
  modBFullRatio: number;
  allergenTaggedCount: number;
  allergenTaggedRatio: number;
  hungerBarCount: number;
  hungerBarRatio: number;
  /** Recipe.imageUrl dolu olan PUBLISHED tarif sayisi (editor gorseli). */
  imageUrlCount: number;
  imageUrlRatio: number;
  /** En az bir VISIBLE RecipePhoto sahibi tarif sayisi (kullanici foto). */
  userPhotoCount: number;
  userPhotoRatio: number;
}

async function computeContentQualityStats(): Promise<ContentQualityStats> {
  // Raw SQL ile tek query'de full tarama, N+1'den kaçınır. Prisma count
  // ayrı ayrı ~8 sorgu, bu tek query'de aggregate.
  const rows = await prisma.$queryRaw<
    {
      total: bigint;
      featured: bigint;
      tipnote: bigint;
      serving: bigint;
      modb: bigint;
      allergen: bigint;
      hungerbar: bigint;
      imageurl: bigint;
      userphoto: bigint;
    }[]
  >`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE r."isFeatured" = true) AS featured,
      COUNT(*) FILTER (WHERE r."tipNote" IS NOT NULL AND LENGTH(TRIM(r."tipNote")) > 0) AS tipnote,
      COUNT(*) FILTER (WHERE r."servingSuggestion" IS NOT NULL AND LENGTH(TRIM(r."servingSuggestion")) > 0) AS serving,
      COUNT(*) FILTER (
        WHERE r."translations" -> 'en' -> 'ingredients' IS NOT NULL
          AND jsonb_array_length(r."translations" -> 'en' -> 'ingredients') > 0
          AND r."translations" -> 'de' -> 'ingredients' IS NOT NULL
          AND jsonb_array_length(r."translations" -> 'de' -> 'ingredients') > 0
      ) AS modb,
      COUNT(*) FILTER (WHERE array_length(r."allergens", 1) > 0) AS allergen,
      COUNT(*) FILTER (WHERE r."hungerBar" IS NOT NULL) AS hungerbar,
      COUNT(*) FILTER (WHERE r."imageUrl" IS NOT NULL AND LENGTH(TRIM(r."imageUrl")) > 0) AS imageurl,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM recipe_photos rp
          WHERE rp."recipeId" = r.id AND rp.status = 'VISIBLE'
        )
      ) AS userphoto
    FROM recipes r
    WHERE r.status = 'PUBLISHED'
  `;
  const r = rows[0];
  const total = Number(r.total);
  const pct = (n: bigint) =>
    total > 0 ? Number(((Number(n) / total) * 100).toFixed(1)) : 0;

  return {
    total,
    featuredCount: Number(r.featured),
    featuredRatio: pct(r.featured),
    tipNoteCount: Number(r.tipnote),
    tipNoteRatio: pct(r.tipnote),
    servingSuggestionCount: Number(r.serving),
    servingSuggestionRatio: pct(r.serving),
    modBFullCount: Number(r.modb),
    modBFullRatio: pct(r.modb),
    allergenTaggedCount: Number(r.allergen),
    allergenTaggedRatio: pct(r.allergen),
    hungerBarCount: Number(r.hungerbar),
    hungerBarRatio: pct(r.hungerbar),
    imageUrlCount: Number(r.imageurl),
    imageUrlRatio: pct(r.imageurl),
    userPhotoCount: Number(r.userphoto),
    userPhotoRatio: pct(r.userphoto),
  };
}

/**
 * Cache: 5 dakika TTL. Content quality widget dashboard'da görünür,
 * saniyelik güncelleme gerekmez; Neon compute azaltma için cache.
 */
export const getContentQualityStats = unstable_cache(
  computeContentQualityStats,
  ["admin-content-quality-stats-v2"],
  { revalidate: 300, tags: ["admin-content-quality"] },
);
