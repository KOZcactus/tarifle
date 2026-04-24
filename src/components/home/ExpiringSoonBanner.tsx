/**
 * C: Home "Bu hafta bitirmen gereken X malzeme" bannerı.
 *
 * Sadece şu koşullarda render:
 *   - Login user
 *   - User.pantryExpiryTracking = true (opt-in)
 *   - UserPantry'de 3 gün içinde veya geçmiş SKT'li en az 1 malzeme var
 *
 * Pantry'deki yaklaşan expiry malzemelerini içeren tarifler fetch
 * edilir (raw SQL: ingredient.name OR-chain). Kural tabanlı, LLM yok.
 * Zero-waste UX: kullanıcı dolaptaki israfı azaltan tarifleri görür.
 */
import Link from "next/link";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

interface ExpiringSoonBannerProps {
  session: Session | null;
}

interface ExpiringRecipe {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  total_minutes: number;
  match_count: bigint;
}

export async function ExpiringSoonBanner({ session }: ExpiringSoonBannerProps) {
  const userId = session?.user?.id;
  if (!userId) return null;

  // Opt-in kontrolu
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pantryExpiryTracking: true },
  });
  if (!user?.pantryExpiryTracking) return null;

  // 3 gün içinde veya geçmiş SKT'li pantry item'lar
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 3);
  const expiring = await prisma.userPantryItem.findMany({
    where: {
      userId,
      expiryDate: { not: null, lte: threshold },
    },
    select: { ingredientName: true, displayName: true, expiryDate: true },
    orderBy: { expiryDate: "asc" },
    take: 10,
  });
  if (expiring.length === 0) return null;

  // Yakın malzeme listesi + recipe query (raw SQL, OR chain)
  const expiringNames = expiring.map((e) => e.ingredientName);
  // Prisma queryRaw: text array binding
  const recipes = await prisma.$queryRaw<ExpiringRecipe[]>`
    SELECT r.id, r.slug, r.title, r.emoji, r."totalMinutes" AS total_minutes,
           COUNT(DISTINCT lower(i.name)) AS match_count
    FROM recipes r
    JOIN recipe_ingredients i ON i."recipeId" = r.id
    WHERE r.status = 'PUBLISHED'
      AND EXISTS (
        SELECT 1 FROM unnest(${expiringNames}::text[]) AS needle
        WHERE lower(i.name) LIKE '%' || needle || '%'
      )
    GROUP BY r.id
    ORDER BY match_count DESC, r."viewCount" DESC
    LIMIT 4
  `;
  if (recipes.length === 0) return null;

  const t = await getTranslations("home.expiringSoon");
  const displayNames = expiring.slice(0, 3).map((e) => e.displayName ?? e.ingredientName);

  return (
    <section
      className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 dark:border-amber-700/60 dark:bg-amber-950/40"
      aria-labelledby="expiring-heading"
    >
      <header className="mb-3">
        <h2
          id="expiring-heading"
          className="font-heading text-lg font-semibold text-amber-950 dark:text-amber-100 sm:text-xl"
        >
          ⏳ {t("headline", { count: expiring.length })}
        </h2>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
          {t("subtitle", { names: displayNames.join(", ") })}
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {recipes.map((r) => (
          <li key={r.id}>
            <Link
              href={`/tarif/${r.slug}`}
              className="flex h-full flex-col gap-1 rounded-xl border border-amber-300/40 bg-white px-3 py-2.5 text-left transition-colors hover:border-amber-500 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-950/60 dark:hover:bg-amber-900/60"
            >
              <span className="text-2xl" aria-hidden>
                {r.emoji ?? "🍽️"}
              </span>
              <span className="line-clamp-2 text-sm font-medium text-amber-950 dark:text-amber-100">
                {r.title}
              </span>
              <span className="mt-auto text-[11px] text-amber-800/70 dark:text-amber-200/70">
                ⏱ {r.total_minutes} dk · {String(r.match_count)} eşleşme
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/dolap"
        className="mt-3 inline-block text-xs font-medium text-amber-900 underline-offset-4 hover:underline dark:text-amber-200"
      >
        {t("manageLink")} →
      </Link>
    </section>
  );
}
