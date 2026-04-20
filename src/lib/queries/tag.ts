import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  _count: {
    recipeTags: number;
  };
}

/** Tüm etiketler — tarif sayısı ile birlikte, en çok kullanılandan en aza.
 *  Cached 10 dk — admin tag CRUD'u nadir, yeni etiket eklendiğinde
 *  `revalidateTag("tags")` ile invalidate edilir. Hot path: `/kategoriler`,
 *  `/etiket/[tag]`, homepage chip grid — cache kazancı yüksek. */
export const getTags = unstable_cache(
  async (): Promise<TagWithCount[]> => {
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
  },
  ["tags-v1"],
  { revalidate: 600, tags: ["tags"] },
);
