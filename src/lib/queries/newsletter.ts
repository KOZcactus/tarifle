import { prisma } from "@/lib/prisma";
import { getFeaturedRecipes, getRecentRecipes } from "./recipe";
import { getCuisineStats, type CuisineStat } from "./cuisine-stats";
import type { RecipeCard } from "@/types/recipe";

/**
 * Newsletter subscriber fetch + content assembly for the weekly send.
 *
 * Split into two helpers so the cron endpoint can fetch both in parallel:
 *   - `getActiveSubscribers` → all ACTIVE subs with unsubscribe token + locale
 *   - `getNewsletterContent` → shared editorial bundle (featured + recent + cuisines)
 *
 * Content is the same for every recipient in a given run, we assemble it
 * once and reuse it per send. Localized labels are rendered in the template,
 * not here.
 */

export interface ActiveSubscriber {
  id: string;
  email: string;
  locale: string;
  unsubscribeToken: string;
}

export async function getActiveSubscribers(): Promise<ActiveSubscriber[]> {
  return prisma.newsletterSubscription.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      email: true,
      locale: true,
      unsubscribeToken: true,
    },
    orderBy: { confirmedAt: "asc" },
  });
}

export interface NewsletterContent {
  featured: RecipeCard[];
  recent: RecipeCard[];
  topCuisines: CuisineStat[];
}

/**
 * Haftalık bülten için editoryel içerik paketi.
 *
 * - featured: `getFeaturedRecipes(6)`, `isFeatured=true` havuzundan
 *   haftalık rotate edilmiş 6 tarif (zaten unstable_cache arkasında).
 * - recent: son 14 günde eklenen tarif (cap 6), Codex batch sonrası
 *   bülten açısından "yeni içerik" görünürlüğü.
 * - topCuisines: tarif sayısına göre üst 4 mutfak, küratorluk hissi
 *   için "bu hafta öne çıkan mutfaklar" satırı.
 */
export async function getNewsletterContent(): Promise<NewsletterContent> {
  const [featured, recent, allCuisines] = await Promise.all([
    getFeaturedRecipes(6),
    getRecentRecipes(14, 6),
    getCuisineStats(),
  ]);

  return {
    featured,
    recent,
    topCuisines: allCuisines.slice(0, 4),
  };
}
