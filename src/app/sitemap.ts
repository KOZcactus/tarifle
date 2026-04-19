/**
 * Dynamic sitemap for search engines. Next.js reads this file convention
 * and serves the output at `/sitemap.xml`.
 *
 * Composition:
 *   - Static pages: home, /tarifler, /ai-asistan, /hakkimizda, KVKK, etc.
 *   - All PUBLISHED recipes: `/tarif/<slug>`
 *   - All categories: `/tarifler?kategori=<slug>`
 *   - Active cuisines: `/tarifler?mutfak=<code>` (≥3 recipes)
 *
 * Drafts, hidden, and pending-review recipes are excluded — we don't
 * want Google indexing content that may be moderated away.
 *
 * `lastModified` drives Google's "have I seen this version?" heuristic;
 * we use `updatedAt` (or `createdAt` for older seeds that pre-date the
 * column) so edited recipes get re-crawled faster.
 *
 * Changefreq / priority: conservative defaults. Recipes are "weekly"
 * because variations land as user content; categories are "monthly"
 * since the set rarely changes; static pages are "yearly" unless
 * genuinely live.
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { CUISINE_CODES, CUISINE_SLUG, type CuisineCode } from "@/lib/cuisines";
import { DIETS } from "@/lib/diets";

// Build-time prerender'ı kapatıyoruz: CI'da DATABASE_URL placeholder
// olduğu için Prisma bağlanamaz, build düşer (`/sitemap.xml` prerender
// error). force-dynamic ile her istek runtime'da render edilir; CDN
// edge cache (Vercel) hâlâ saatlik tutar.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, categories, cuisineCodes, tags] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { sortOrder: "asc" },
    }),
    // Active cuisines with ≥3 recipes — worth indexing as landing pages
    prisma.recipe
      .groupBy({
        by: ["cuisine"],
        where: { status: "PUBLISHED", cuisine: { not: null } },
        _count: true,
      })
      .then((rows) =>
        rows
          .filter((r) => r.cuisine && r._count >= 3)
          .map((r) => r.cuisine!),
      ),
    // Tags with ≥3 recipes — indexable etiket landing candidates
    prisma.tag.findMany({
      where: { recipeTags: { some: {} } },
      select: {
        slug: true,
        _count: { select: { recipeTags: true } },
      },
    }),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/tarifler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kategoriler`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/ai-asistan`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/kesfet`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/yasal`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/yasal/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/yasal/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/yasal/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/yasal/cerez-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/yasal/guvenlik`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/yasal/iletisim-aydinlatma`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const recipePages: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${SITE_URL}/tarif/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Use the path-based landing (`/tarifler/[kategori]`) instead of the
  // query-string variant. The path route is the real canonical; sending
  // crawlers to `?kategori=X` would conflict with the noindex rule on
  // parameterised /tarifler variants.
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/tarifler/${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Programatik landing — /mutfak/[cuisine]. Query-string variant
  // (`/tarifler?mutfak=X`) deprecate edildi, path-based route canonical
  // kaynak. Aktif cuisine listesi (≥3 tarif) set olarak kontrol edilir.
  const activeCuisineSet = new Set<string>(cuisineCodes);
  const cuisinePages: MetadataRoute.Sitemap = CUISINE_CODES.filter((code) =>
    activeCuisineSet.has(code),
  ).map((code) => ({
    url: `${SITE_URL}/mutfak/${CUISINE_SLUG[code as CuisineCode]}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Programatik landing — /etiket/[tag]. ≥3 tarif filtresi; 0-1 tariflik
  // etiketlerde thin content oluşur, index dışı tutulur.
  const tagPages: MetadataRoute.Sitemap = tags
    .filter((t) => t._count.recipeTags >= 3)
    .map((t) => ({
      url: `${SITE_URL}/etiket/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // Programatik landing — /diyet/[diet]. Sabit 5 slug, filtre config
  // DIETS tablosunda.
  const dietPages: MetadataRoute.Sitemap = DIETS.map((d) => ({
    url: `${SITE_URL}/diyet/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...cuisinePages,
    ...tagPages,
    ...dietPages,
    ...categoryPages,
    ...recipePages,
  ];
}
