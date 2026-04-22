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
 * Drafts, hidden, and pending-review recipes are excluded, we don't
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
import { getAllBlogPosts } from "@/lib/blog";

// Build-time prerender'ı kapatıyoruz: CI'da DATABASE_URL placeholder
// olduğu için Prisma bağlanamaz, build düşer (`/sitemap.xml` prerender
// error). force-dynamic ile her istek runtime'da render edilir; CDN
// edge cache (Vercel) hâlâ saatlik tutar.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, categories, cuisineCodes, tags, blogPosts] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
        isFeatured: true,
        viewCount: true,
        imageUrl: true,
        translations: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { sortOrder: "asc" },
    }),
    // Active cuisines with ≥3 recipes, worth indexing as landing pages
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
    // Tags with ≥3 recipes, indexable etiket landing candidates
    prisma.tag.findMany({
      where: { recipeTags: { some: {} } },
      select: {
        slug: true,
        _count: { select: { recipeTags: true } },
      },
    }),
    // Blog posts, file-based content; all MDX files in content/blog/.
    getAllBlogPosts(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/tarifler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/kategoriler`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/ai-asistan`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/kesfet`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
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

  // Recipe priority v2 (oturum 13 sonrasi tuning):
  // Cok-sinyalli composite formul. Base 0.7, kalite/populariteye gore
  // adim adim artar, max 1.0. Google priority kesin emir degil ama
  // crawl bütcesinde guclu sinyal; oncelikli olanlari en uste ittirir.
  //
  //   Base                                       0.70
  //   + isFeatured                               +0.10 (editor curated)
  //   + imageUrl var (editor gorseli)            +0.05
  //   + Mod B tam (EN + DE ingredients dolu)     +0.05 (cok dilli icerik)
  //   + viewCount >= 100                         +0.05 (popularite)
  //   + viewCount >= 500                         +0.10 (yuksek populariter)
  //   ───────────────────────────────────────────
  //   Cap                                        1.00
  //
  // changeFrequency: isFeatured tariflerde daily (seasonal+review ivmesi),
  // diger tarif normal weekly.
  function recipePriority(r: {
    isFeatured: boolean;
    viewCount: number;
    imageUrl: string | null;
    translations: unknown;
  }): number {
    let p = 0.7;
    if (r.isFeatured) p += 0.1;
    if (r.imageUrl) p += 0.05;
    // Mod B tam check, translations.en.ingredients + de.ingredients
    // ikisi de array length > 0 ise tam cevirili.
    const t = r.translations as
      | { en?: { ingredients?: unknown[] }; de?: { ingredients?: unknown[] } }
      | null;
    const enIng = Array.isArray(t?.en?.ingredients) ? t.en.ingredients.length : 0;
    const deIng = Array.isArray(t?.de?.ingredients) ? t.de.ingredients.length : 0;
    if (enIng > 0 && deIng > 0) p += 0.05;
    if (r.viewCount >= 500) p += 0.1;
    else if (r.viewCount >= 100) p += 0.05;
    // Floating point cleanup: 0.7 + 0.1 = 0.7999...9 JS quirk; iki ondalik
    // basamaga yuvarla (sitemap XML "0.7999999999999999" gosteriyordu).
    return Math.min(Math.round(p * 100) / 100, 1.0);
  }

  const recipePages: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${SITE_URL}/tarif/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: r.isFeatured ? "daily" : "weekly",
    priority: recipePriority(r),
  }));

  // Use the path-based landing (`/tarifler/[kategori]`) instead of the
  // query-string variant. The path route is the real canonical; sending
  // crawlers to `?kategori=X` would conflict with the noindex rule on
  // parameterised /tarifler variants.
  //
  // Priority 0.7 (önceki 0.6): 17 kategori hub sayfaları programmatic
  // landing + cross-link ağı, recipe detay'lardan sonra en yüksek
  // discovery sayfaları. changeFrequency weekly (önceki monthly):
  // yeni tarif eklendikçe listeleri güncelleniyor.
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/tarifler/${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Programatik landing, /mutfak/[cuisine]. Query-string variant
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

  // Programatik landing, /etiket/[tag]. ≥3 tarif filtresi; 0-1 tariflik
  // etiketlerde thin content oluşur, index dışı tutulur. Priority 0.6:
  // kategori hub'ından hafif düşük (kategori daha geniş, tag daraltıcı
  // filter). Çok popüler tag'leri (10+ tarif) 0.7'ye çıkar.
  const tagPages: MetadataRoute.Sitemap = tags
    .filter((t) => t._count.recipeTags >= 3)
    .map((t) => ({
      url: `${SITE_URL}/etiket/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: t._count.recipeTags >= 10 ? 0.7 : 0.6,
    }));

  // Programatik landing, /diyet/[diet]. Sabit 5 slug, filtre config
  // DIETS tablosunda.
  const dietPages: MetadataRoute.Sitemap = DIETS.map((d) => ({
    url: `${SITE_URL}/diyet/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog yazıları, MDX frontmatter `date` → lastModified. Tarifler
  // kadar sık güncellenmediği için weekly + priority 0.6.
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...cuisinePages,
    ...tagPages,
    ...dietPages,
    ...categoryPages,
    ...blogPages,
    ...recipePages,
  ];
}
