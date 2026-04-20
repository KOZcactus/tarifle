/**
 * Full-text search layer over Recipe.searchVector (Postgres tsvector,
 * generated STORED column). `$queryRaw` with `websearch_to_tsquery` +
 * `ts_rank_cd` gives TR-aware stemming (mantı↔mantılar) and accent-
 * insensitive matching (manti→mantı) that Prisma's typed `contains`
 * can't express.
 *
 * Why `$queryRaw`: Prisma's `String.search` filter only supports the
 * `simple` Postgres config (no stemming). We need `turkish` dict +
 * `immutable_unaccent` on both sides, which requires raw SQL.
 *
 * Contract: returns matching recipe IDs + relevance rank, already
 * filtered to `status = 'PUBLISHED'` so callers don't accidentally
 * leak drafts. Downstream filters (category/difficulty/maxMinutes/
 * tags/allergens) apply via Prisma over the returned ID set.
 */
import { prisma } from "@/lib/prisma";

export interface SearchRecipeIdsOptions {
  /** Raw user input from the /tarifler `?q=` param. */
  query: string;
  /** Upper bound on candidate rows before filters layer on. Default 500. */
  limit?: number;
}

export interface RankedRecipeId {
  id: string;
  /** ts_rank_cd score, higher is more relevant. Only meaningful for sort. */
  rank: number;
}

/**
 * Prepares raw user input for `websearch_to_tsquery`. Strips characters
 * Postgres treats specially to avoid injection-like parse failures:
 * backslashes, null bytes, and stray control chars. Keeps `- " ' ()`
 *, websearch syntax handles them naturally.
 *
 * Intentionally does NOT normalize Turkish characters here; unaccent is
 * applied SQL-side (`immutable_unaccent($1)`) so the logic lives on the
 * same side as the indexed column.
 */
export function sanitizeQueryInput(raw: string): string {
  return raw
    .replace(/\x00/g, "") // null bytes
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "") // control chars
    .trim();
}

/**
 * Returns recipe IDs ranked by relevance. Combines two sources:
 *
 *   1. **FTS path** (title/description/tipNote/servingSuggestion/slug):
 *      tsvector match with TR stemming + unaccent. Rank via ts_rank_cd,
 *      respecting the A/B/C column weights from the migration.
 *
 *   2. **Ingredient path** (recipe_ingredients.name contains query):
 *      returns recipes that match ONLY on ingredient name (and weren't
 *      already in set 1). Rank = 0 so they always sort below FTS hits.
 *
 * This preserves the pre-FTS behaviour, "tuz" still lists every recipe
 * using salt, while giving title/description matches the ms-level tsvector
 * path. When the catalog grows to 5k+ we can add pg_trgm to ingredient
 * names too; for 500 rows a seq scan on recipe_ingredients is fine.
 *
 * Empty array when the query is whitespace-only, caller skips the search
 * layer entirely and renders the unfiltered catalog.
 */
export async function searchRecipeIds(
  opts: SearchRecipeIdsOptions,
): Promise<RankedRecipeId[]> {
  const { query, limit = 500 } = opts;
  const clean = sanitizeQueryInput(query);
  if (!clean) return [];

  // websearch_to_tsquery: user-friendly syntax, quoted phrases, `-`
  // exclusion, implicit AND. Safer than plainto_tsquery (which chokes
  // on punctuation). The CROSS JOIN with a single-row subquery binds
  // the parsed query once per statement rather than re-parsing per row.
  const ftsRows = await prisma.$queryRaw<RankedRecipeId[]>`
    SELECT r."id",
           ts_rank_cd(r."searchVector", q.query) AS rank
    FROM "recipes" r,
         websearch_to_tsquery('turkish', public.immutable_unaccent(${clean})) AS q(query)
    WHERE r."searchVector" @@ q.query
      AND r."status" = 'PUBLISHED'
    ORDER BY rank DESC, r."title" ASC
    LIMIT ${limit}
  `;

  // Neon's serverless driver hands rank back as a Decimal-like number;
  // cast to a plain JS number so downstream math (clamping, comparisons)
  // works without surprises.
  const ftsResults: RankedRecipeId[] = ftsRows.map((r) => ({
    id: r.id,
    rank: Number(r.rank),
  }));
  const ftsIds = new Set(ftsResults.map((r) => r.id));

  const remaining = Math.max(0, limit - ftsResults.length);
  if (remaining === 0) return ftsResults;

  // Ingredient fallback, run as a plain Prisma query (typed, cacheable).
  // `insensitive` mode respects ICU collation so "Pirinç" matches "pirinc"
  // at the Unicode level; combined with the ingredient synonym list in
  // lib/ingredients.ts this covers the common morphological cases.
  const ingRows = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: Array.from(ftsIds) },
      ingredients: {
        some: { name: { contains: clean, mode: "insensitive" } },
      },
    },
    select: { id: true },
    take: remaining,
  });

  const combined: RankedRecipeId[] = [
    ...ftsResults,
    ...ingRows.map((r) => ({ id: r.id, rank: 0 })),
  ];

  // Trigram fuzzy fallback, FTS + ingredient contains hâlâ boşsa
  // "typo tolerance" için pg_trgm similarity devreye girer. "domatez
  // corbasi" → "domates çorbası" bulsun. Similarity threshold 0.3
  // konservatif, 0.1-0.2 aralığı alakasız dönüş verir, 0.4+ çok katı.
  //
  // Title + slug üzerinde GIN trigram index var (pg_trgm migration),
  // %> operator'ü indexi kullanır → ms-level lookup. Ingredient name
  // üzerinde de ayrı bir pass, tarifte geçen yiyecek adı typo'sunu da
  // yakalamak için.
  //
  // Sadece hiç sonuç yoksa ek maliyet ödüyoruz; mevcut arama akışı
  // yavaşlamaz.
  if (combined.length === 0) {
    const trgmRows = await prisma.$queryRaw<RankedRecipeId[]>`
      SELECT r."id",
             GREATEST(
               similarity(r."title", ${clean}),
               similarity(r."slug", ${clean})
             ) AS rank
      FROM "recipes" r
      WHERE r."status" = 'PUBLISHED'
        AND (r."title" % ${clean} OR r."slug" % ${clean})
      ORDER BY rank DESC, r."title" ASC
      LIMIT ${limit}
    `;
    return trgmRows.map((r) => ({ id: r.id, rank: Number(r.rank) }));
  }

  return combined;
}
