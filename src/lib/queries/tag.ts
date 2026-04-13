import { prisma } from "@/lib/prisma";

export interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  _count: {
    recipeTags: number;
  };
}

/** Tüm etiketler — tarif sayısı ile birlikte, en çok kullanılandan en aza */
export async function getTags(): Promise<TagWithCount[]> {
  return prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { recipeTags: true },
      },
    },
    orderBy: { recipeTags: { _count: "desc" } },
  });
}
