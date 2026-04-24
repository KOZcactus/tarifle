/**
 * D: Home "Şu saatte ne yesek?" bannerı.
 *
 * Server component. getTimeHintTr ile TR timezone saati tespit eder,
 * kategoriye göre popüler 4 tarif çeker. Saat dışı "none" durumda hiç
 * render edilmez (boş section boşaltır ana sayfa).
 *
 * Kural tabanlı, sıfır LLM. Seasonal banner ile çakışmaz (Seasonal =
 * Bahar Sofrası / Ramazan / Kurban gibi, TimeAware = gün içi
 * mikro-zaman). İkisi birlikte render edilebilir.
 */
import Link from "next/link";
import { getTimeHintTr, type TimeHintKind } from "@/lib/ai/time-context";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

interface CategoryFilter {
  categorySlug?: string;
  type?: "YEMEK" | "CORBA" | "SALATA" | "TATLI" | "KAHVALTI" | "APERATIF" | "ATISTIRMALIK" | "KOKTEYL" | "ICECEK" | "SOS";
}

// Hint → kategori + süre kısıtı mapping
function hintToFilter(kind: TimeHintKind): CategoryFilter | null {
  switch (kind) {
    case "breakfast-quick":
      return { categorySlug: "kahvaltiliklar" };
    case "lunch-medium":
      return { categorySlug: "corbalar" };
    case "afternoon-snack":
      return { categorySlug: "atistirmaliklar" };
    case "dinner-quick":
      return { type: "YEMEK" };
    case "dinner-weekend-long":
      return { type: "YEMEK" }; // kısıt yok, uzun tarifler dahil
    case "late-night-sweet":
      return { categorySlug: "tatlilar" };
    case "none":
    default:
      return null;
  }
}

const getTimeAwareRecipes = unstable_cache(
  async (
    hintKind: string,
    maxMinutes: number | undefined,
    categorySlug: string | undefined,
    type: string | undefined,
  ) => {
    return prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(type ? { type: type as "YEMEK" } : {}),
        ...(maxMinutes ? { totalMinutes: { lte: maxMinutes } } : {}),
      },
      orderBy: [{ viewCount: "desc" }, { slug: "asc" }],
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        emoji: true,
        totalMinutes: true,
        cuisine: true,
      },
    });
  },
  ["time-aware-banner-v1"],
  { revalidate: 15 * 60, tags: ["recipes"] }, // 15 dk cache
);

export async function TimeAwareBanner() {
  const hint = getTimeHintTr();
  if (hint.kind === "none") return null;
  const filter = hintToFilter(hint.kind);
  if (!filter) return null;

  const t = await getTranslations("home.timeAware");
  const recipes = await getTimeAwareRecipes(
    hint.kind,
    hint.suggestedMaxMinutes,
    filter.categorySlug,
    filter.type,
  );
  if (recipes.length === 0) return null;

  const headline = t(`headline.${hint.labelKey}`);
  const subtitle = t(`subtitle.${hint.labelKey}`);

  return (
    <section
      className="rounded-2xl border border-accent-blue/30 bg-accent-blue/5 p-5 dark:border-accent-blue/40 dark:bg-accent-blue/10"
      aria-labelledby="time-aware-heading"
    >
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2
            id="time-aware-heading"
            className="font-heading text-lg font-semibold text-text sm:text-xl"
          >
            {headline}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        </div>
        {hint.suggestedMaxMinutes && (
          <span className="shrink-0 rounded-full border border-accent-blue/40 bg-white px-2 py-0.5 text-[11px] font-medium text-accent-blue dark:bg-accent-blue/20">
            ≤{hint.suggestedMaxMinutes} dk
          </span>
        )}
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {recipes.map((r) => (
          <li key={r.id}>
            <Link
              href={`/tarif/${r.slug}`}
              className="flex h-full flex-col gap-1 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-left transition-colors hover:border-accent-blue hover:bg-accent-blue/5"
            >
              <span className="text-2xl" aria-hidden>
                {r.emoji ?? "🍽️"}
              </span>
              <span className="line-clamp-2 text-sm font-medium text-text">
                {r.title}
              </span>
              <span className="mt-auto text-[11px] text-text-muted">
                ⏱ {r.totalMinutes} dk
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
