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

/** Tüm kategoriler — tarif sayısı ile birlikte.
 *  Cached 5 dk — kategoriler nadir değişir (admin panel'den CRUD), TTL
 *  yeterli. Seed sonrası `revalidateTag("categories")` çağrısı ile force
 *  edilebilir ama şu an otomatik trigger yok. */
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
  { revalidate: 300, tags: ["categories"] },
);

/** Tek kategori — slug ile */
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
