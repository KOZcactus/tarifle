import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { IngredientList } from "@/components/recipe/IngredientList";
import { AllergenBadges } from "@/components/recipe/AllergenBadges";
import { RecipeSteps } from "@/components/recipe/RecipeSteps";
import { NutritionInfo } from "@/components/recipe/NutritionInfo";
import { SaveMenu } from "@/components/recipe/SaveMenu";
import { ShareMenu } from "@/components/recipe/ShareMenu";
import { VariationForm } from "@/components/recipe/VariationForm";
import { CookingMode } from "@/components/recipe/CookingMode";
import { PrintButton } from "@/components/recipe/PrintButton";
import { AgeGate } from "@/components/recipe/AgeGate";
import { VariationCard } from "@/components/recipe/VariationCard";
import { SimilarRecipes } from "@/components/recipe/SimilarRecipes";
import { generateRecipeJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import { CUISINE_FLAG, CUISINE_LABEL, type CuisineCode } from "@/lib/cuisines";
import { SITE_URL } from "@/lib/constants";
import { getRecipeBySlug, incrementViewCount } from "@/lib/queries/recipe";
import { getSimilarRecipes } from "@/lib/queries/similar-recipes";
import { isBookmarked, getLikedVariationIds } from "@/lib/queries/user";
import { getCollectionsForRecipe } from "@/lib/queries/collection";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

type VariationSort = "yeni" | "begeni" | "kolay";
const VARIATION_SORTS: VariationSort[] = ["yeni", "begeni", "kolay"];
const VARIATION_SORT_LABELS: Record<VariationSort, string> = {
  yeni: "En yeni",
  begeni: "En çok beğeni",
  kolay: "En az malzeme",
};

interface TarifPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ siralama?: string }>;
}

export async function generateMetadata({ params }: TarifPageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return { title: "Tarif Bulunamadı" };

  // Canonical yönetimi: tarifle.app non-www kanonik, www→non-www 308
  // redirect Cloudflare'de. Bu alternates.canonical `metadataBase`
  // (SITE_URL) ile çözülür; `?siralama=` gibi view state'leri
  // indekslenmesin diye her tarifin kanonu param-free slug URL'i.
  //
  // OpenGraph image'ı src/app/tarif/[slug]/opengraph-image.tsx
  // convention'ı otomatik ekliyor — burada manual image referansı
  // vermeye gerek yok, duplicate olur.
  const cuisineLabel = recipe.cuisine
    ? CUISINE_LABEL[recipe.cuisine as CuisineCode]
    : null;
  const cuisineSeo = cuisineLabel ? `${cuisineLabel} mutfağından ` : "";

  return {
    title: recipe.title,
    description: `${cuisineSeo}${recipe.title} tarifi — ${getDifficultyLabel(recipe.difficulty)}, ${formatMinutes(recipe.totalMinutes)}, ${recipe.servingCount} kişilik${recipe.averageCalories ? `, ~${recipe.averageCalories} kcal` : ""}.`,
    alternates: {
      canonical: `/tarif/${recipe.slug}`,
    },
    openGraph: {
      title: recipe.title,
      description: recipe.description.slice(0, 200),
      url: `/tarif/${recipe.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description.slice(0, 200),
    },
  };
}

export default async function TarifPage({ params, searchParams }: TarifPageProps) {
  const { slug } = await params;
  const { siralama } = await searchParams;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const session = await auth();
  const variationIds = recipe.variations?.map((v) => v.id) ?? [];
  const [bookmarked, userCollections, similarRecipes, likedVariationIds] =
    await Promise.all([
      session?.user?.id
        ? isBookmarked(session.user.id, recipe.id)
        : Promise.resolve(false),
      session?.user?.id
        ? getCollectionsForRecipe(session.user.id, recipe.id)
        : Promise.resolve([]),
      getSimilarRecipes(recipe.id, 6),
      session?.user?.id
        ? getLikedVariationIds(session.user.id, variationIds)
        : Promise.resolve(new Set<string>()),
    ]);

  // Surface admin/moderator UI inline on community variations so a moderator
  // can hide a clearly-bad post without leaving the recipe page. `session.user.role`
  // is populated by the jwt + session callbacks in lib/auth.ts and typed by
  // src/types/next-auth.d.ts.
  const isModerator =
    session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  // Variation sıralama — URL'den okur, default "yeni". Server-side
  // sıralıyoruz ki kullanıcı paylaştığı linkte aynı sırayı görür.
  const activeSort: VariationSort = (VARIATION_SORTS as string[]).includes(
    siralama ?? "",
  )
    ? (siralama as VariationSort)
    : "yeni";

  const sortedVariations = recipe.variations
    ? [...recipe.variations].sort((a, b) => {
        if (activeSort === "begeni") return b.likeCount - a.likeCount;
        if (activeSort === "kolay") {
          const aLen = Array.isArray(a.ingredients) ? a.ingredients.length : 0;
          const bLen = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
          return aLen - bLen;
        }
        // "yeni" — most recent first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    : [];

  // Görüntülenme sayısını arka planda artır
  incrementViewCount(slug).catch(() => {});

  const jsonLd = generateRecipeJsonLd(recipe);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Ana Sayfa", url: "/" },
    { name: "Tarifler", url: "/tarifler" },
    {
      name: recipe.category.name,
      url: `/tarifler?kategori=${recipe.category.slug}`,
    },
    { name: recipe.title, url: `/tarif/${recipe.slug}` },
  ]);
  const isAlcoholic = recipe.tags.some(({ tag }) => tag.slug === "alkollu");

  const content = (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Schema.org Recipe JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Schema.org BreadcrumbList JSON-LD — Google Search'te kartın
          altına "Ana Sayfa › Tarifler › Kategori › Tarif" şeridi çıkar. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
        <Link href="/tarifler" className="hover:text-text">
          Tarifler
        </Link>
        <span className="mx-2">›</span>
        <Link
          href={`/tarifler/${recipe.category.slug}`}
          className="hover:text-text"
        >
          {recipe.category.emoji} {recipe.category.name}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-text">{recipe.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{recipe.emoji}</span>
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">{recipe.title}</h1>
            <p className="mt-2 text-text-muted">{recipe.description}</p>
          </div>
        </div>

        {/* Meta Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={recipe.difficulty === "EASY" ? "success" : recipe.difficulty === "MEDIUM" ? "warning" : "primary"}>
            {getDifficultyLabel(recipe.difficulty)}
          </Badge>
          <Badge>⏱️ {formatMinutes(recipe.totalMinutes)}</Badge>
          <Badge>{recipe.servingCount} kişilik</Badge>
          {recipe.averageCalories && <Badge>~{recipe.averageCalories} kcal</Badge>}
          {recipe.cuisine && CUISINE_LABEL[recipe.cuisine as CuisineCode] && (
            <Badge>
              {CUISINE_FLAG[recipe.cuisine as CuisineCode]} {CUISINE_LABEL[recipe.cuisine as CuisineCode]}
            </Badge>
          )}
          {recipe._count.variations > 0 && (
            <Badge variant="info">{recipe._count.variations} uyarlama</Badge>
          )}
        </div>

        {/* Save + share actions */}
        <div className="mt-4 flex flex-wrap items-start gap-2 print:hidden">
          <SaveMenu
            recipeId={recipe.id}
            initialBookmarked={bookmarked}
            initialCollections={userCollections}
            ingredientCount={recipe.ingredients.length}
          />
          <ShareMenu
            title={recipe.title}
            url={`${SITE_URL}/tarif/${recipe.slug}`}
            text={`${recipe.emoji ?? ""} ${recipe.title} — Tarifle`}
          />
        </div>

        {/* Tags — diet tags (vegan/vejetaryen) get a loud green badge so
            veg-aware visitors spot them at a glance; the rest stay as the
            muted #hashtag chips. Filter-by-slug keeps the list iteration
            single-pass. */}
        {recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.tags.map(({ tag }) => {
              const isDiet = tag.slug === "vegan" || tag.slug === "vejetaryen";
              if (isDiet) {
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full border border-accent-green/40 bg-accent-green/15 px-2.5 py-0.5 text-xs font-medium text-accent-green"
                    title={
                      tag.slug === "vegan"
                        ? "Vegan uyumlu — hayvansal ürün içermiyor"
                        : "Vejetaryen uyumlu — et/tavuk/balık içermiyor"
                    }
                  >
                    <span aria-hidden="true">🌱</span>
                    {tag.name}
                  </span>
                );
              }
              return (
                <span
                  key={tag.id}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted"
                >
                  #{tag.name}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* Image Placeholder */}
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="mb-8 h-64 w-full rounded-xl object-cover sm:h-80"
        />
      ) : (
        <div className="mb-8 flex h-64 items-center justify-center rounded-xl bg-bg-card sm:h-80">
          <span className="text-8xl">{recipe.emoji}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3 print:hidden">
        <CookingMode
          steps={recipe.steps}
          recipeTitle={recipe.title}
          recipeEmoji={recipe.emoji}
        />
        <PrintButton />
      </div>

      {/* Ingredients + Steps — Side by Side on Desktop */}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <IngredientList
              ingredients={recipe.ingredients}
              baseServingCount={recipe.servingCount}
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-bg-card p-5">
            <RecipeSteps steps={recipe.steps} />
          </div>
        </div>
      </div>

      {/* Tip Note */}
      {recipe.tipNote && (
        <div className="mt-6 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
          <p className="text-sm">
            <span className="font-semibold text-secondary">💡 Püf Noktası:</span>{" "}
            {recipe.tipNote}
          </p>
        </div>
      )}

      {/* Serving Suggestion */}
      {recipe.servingSuggestion && (
        <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/10 p-4">
          <p className="text-sm">
            <span className="font-semibold text-accent-green">🍽️ Servis Önerisi:</span>{" "}
            {recipe.servingSuggestion}
          </p>
        </div>
      )}

      {/* Nutrition */}
      <div className="mt-6">
        <NutritionInfo
          calories={recipe.averageCalories}
          protein={recipe.protein}
          carbs={recipe.carbs}
          fat={recipe.fat}
        />
      </div>

      {/* Allergen disclosure — collapsed by default so the info is
          available without dominating the page (first impression
          shouldn't be "dikkat! alerjen!" for every recipe). Native
          <details>/<summary> = accessible keyboard toggling + no JS.
          "İçerebilir" framing reflects the fact that inference is
          rule-based and can miss niche ingredients. */}
      {recipe.allergens.length > 0 && (
        <details className="group mt-4 rounded-xl border border-border bg-bg-card">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
            <span>
              <span aria-hidden="true" className="mr-1.5">⚠</span>
              Bu tarif alerjen madde içerebilir
            </span>
            <span
              aria-hidden="true"
              className="text-xs transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="border-t border-border px-4 pb-4 pt-3">
            <AllergenBadges allergens={recipe.allergens} tone="subtle" />
            <p className="mt-3 text-xs text-text-muted">
              Alerjin varsa malzeme listesine bir de sen göz at.
            </p>
          </div>
        </details>
      )}

      {/* Variations Section */}
      <section className="mt-12 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold">
            Topluluk Uyarlamaları ({recipe._count.variations})
          </h2>
          {sortedVariations.length > 1 && (
            <div className="flex items-center gap-1 text-sm">
              {VARIATION_SORTS.map((s) => {
                const isActive = s === activeSort;
                const href =
                  s === "yeni"
                    ? `/tarif/${recipe.slug}`
                    : `/tarif/${recipe.slug}?siralama=${s}`;
                return (
                  <Link
                    key={s}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      isActive
                        ? "bg-bg-card font-medium text-text"
                        : "text-text-muted hover:bg-bg-card"
                    }`}
                  >
                    {VARIATION_SORT_LABELS[s]}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {sortedVariations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {sortedVariations.map((v) => (
              <VariationCard
                key={v.id}
                variation={v}
                isModerator={isModerator}
                isOwnVariation={session?.user?.id === v.authorId}
                isLikedByUser={likedVariationIds.has(v.id)}
                recipeSlug={recipe.slug}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-text-muted">
              Henüz uyarlama eklenmemiş. İlk uyarlamayı sen ekle!
            </p>
          </div>
        )}

        <div className="mt-4">
          <VariationForm recipeId={recipe.id} recipeSlug={recipe.slug} />
        </div>
      </section>

      {/* Similar recipes — kural tabanlı öneri (kategori + type + tag
          ortaklığı). Print mode gizler, uyarlama bölümünden sonra gelir. */}
      <div className="print:hidden">
        <SimilarRecipes recipes={similarRecipes} />
      </div>

      {/* Cuisine discovery link */}
      {recipe.cuisine && CUISINE_LABEL[recipe.cuisine as CuisineCode] && (
        <div className="mt-6 print:hidden">
          <Link
            href={`/tarifler?mutfak=${recipe.cuisine}`}
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm transition-all hover:border-primary hover:shadow-sm"
          >
            <span className="text-lg">{CUISINE_FLAG[recipe.cuisine as CuisineCode]}</span>
            <span className="text-text-muted group-hover:text-text">
              {CUISINE_LABEL[recipe.cuisine as CuisineCode]} mutfağından diğer tarifler →
            </span>
          </Link>
        </div>
      )}

      {/* View Count */}
      <div className="mt-8 text-center text-xs text-text-muted print:hidden">
        {recipe.viewCount.toLocaleString("tr-TR")} görüntülenme
      </div>
    </div>
  );

  if (isAlcoholic) {
    return <AgeGate>{content}</AgeGate>;
  }

  return content;
}
