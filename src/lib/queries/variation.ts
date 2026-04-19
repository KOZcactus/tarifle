import { prisma } from "@/lib/prisma";

/**
 * Variation query helpers — `/uyarlama/[id]` permalink sayfası ve OG
 * image route'u tarafından kullanılır.
 *
 * Access rules:
 *   - PUBLISHED: herkes görür.
 *   - PENDING_REVIEW / HIDDEN / REJECTED: sadece owner veya admin görür;
 *     diğerlerine `null` döner (404 render edilsin).
 *
 * Tarife ait alanlar (title, slug, emoji) join'le gelir — paylaşım
 * kartında "<Tarif adı> için uyarlama" bağlamı için gereklidir.
 */
export interface VariationView {
  id: string;
  miniTitle: string;
  description: string | null;
  notes: string | null;
  likeCount: number;
  status: "PUBLISHED" | "PENDING_REVIEW" | "HIDDEN" | "REJECTED" | "DRAFT";
  createdAt: Date;
  ingredients: unknown;
  steps: unknown;
  author: {
    id: string;
    username: string;
    name: string | null;
  };
  recipe: {
    id: string;
    slug: string;
    title: string;
    emoji: string | null;
  };
}

export async function getVariationById(
  id: string,
  viewerId: string | null,
): Promise<VariationView | null> {
  const row = await prisma.variation.findUnique({
    where: { id },
    select: {
      id: true,
      miniTitle: true,
      description: true,
      notes: true,
      likeCount: true,
      status: true,
      authorId: true,
      createdAt: true,
      ingredients: true,
      steps: true,
      author: {
        select: { id: true, username: true, name: true },
      },
      recipe: {
        select: { id: true, slug: true, title: true, emoji: true },
      },
    },
  });
  if (!row) return null;

  // Only PUBLISHED is publicly viewable. Owner + admin bypass for in-flight
  // moderation — admin check piggybacks the ADMIN role fetch done elsewhere;
  // here we accept owner directly and let the page layer widen when needed.
  if (row.status !== "PUBLISHED") {
    if (!viewerId || row.authorId !== viewerId) {
      // Owner olmasa bile admin görmek isterse action tarafı kontrol eder;
      // permalink sayfası için sadece PUBLISHED + owner görünür.
      return null;
    }
  }

  return {
    id: row.id,
    miniTitle: row.miniTitle,
    description: row.description,
    notes: row.notes,
    likeCount: row.likeCount,
    status: row.status,
    createdAt: row.createdAt,
    ingredients: row.ingredients,
    steps: row.steps,
    author: row.author,
    recipe: row.recipe,
  };
}
