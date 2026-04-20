import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sortOrder: number;
  _count: {
    recipes: number;
  };
}

export interface CategoryCardData extends CategoryWithCount {
  description: string | null;
}

/** Tüm kategoriler + description + tarif sayısı, `/kategoriler` landing
 *  page için. Cached 30 dk (session 11 tune: önceki 10 dk, ama kategori
 *  CRUD admin-only ve günlük ~0 değişim; uzun TTL Neon compute azaltır,
 *  revalidateTag("categories") mutation sonrası zaten invalidate eder). */
export const getCategoriesForLanding = unstable_cache(
  async (): Promise<CategoryCardData[]> => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        emoji: true,
        description: true,
        sortOrder: true,
        _count: { select: { recipes: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return categories;
  },
  ["categories-for-landing-v1"],
  { revalidate: 1800, tags: ["categories"] },
);

/** Tüm kategoriler, tarif sayısı ile birlikte.
 *  Cached 1 sa (session 11 tune: önceki 5 dk; kategori CRUD nadir,
 *  admin-only. Seed'de yeni kategori yok, mevcut 17 sabit. Uzun TTL
 *  hot-path Neon query'sini azaltır). Seed sonrası `revalidateTag
 *  ("categories")` çağrısı ile force edilebilir ama şu an otomatik
 *  trigger yok. */
export const getCategories = unstable_cache(
  async (): Promise<CategoryWithCount[]> => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        emoji: true,
        sortOrder: true,
        _count: {
          select: { recipes: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return categories;
  },
  ["categories-v1"],
  { revalidate: 3600, tags: ["categories"] },
);

/** Tek kategori, slug ile */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      emoji: true,
      description: true,
    },
  });
}
