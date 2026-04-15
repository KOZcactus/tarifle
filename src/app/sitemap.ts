/**
 * Dynamic sitemap for search engines. Next.js reads this file convention
 * and serves the output at `/sitemap.xml`.
 *
 * Composition:
 *   - Static pages: home, /tarifler, /ai-asistan, /hakkimizda, KVKK, etc.
 *   - All PUBLISHED recipes: `/tarif/<slug>`
 *   - All categories: `/tarifler?kategori=<slug>`
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

export const revalidate = 3600; // re-generate at most hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, categories] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/tarifler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/ai-asistan`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/kesfet`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kullanim-sartlari`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const recipePages: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${SITE_URL}/tarif/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/tarifler?kategori=${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...recipePages];
}
