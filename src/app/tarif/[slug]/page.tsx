import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { IngredientList } from "@/components/recipe/IngredientList";
import { RecipeSteps } from "@/components/recipe/RecipeSteps";
import { NutritionInfo } from "@/components/recipe/NutritionInfo";
import { BookmarkButton } from "@/components/recipe/BookmarkButton";
import { generateRecipeJsonLd } from "@/lib/seo";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import { getRecipeBySlug, incrementViewCount } from "@/lib/queries/recipe";
import { isBookmarked } from "@/lib/queries/user";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

interface TarifPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TarifPageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return { title: "Tarif Bulunamadı" };

  return {
    title: recipe.title,
    description: `${recipe.title} tarifi — ${getDifficultyLabel(recipe.difficulty)}, ${formatMinutes(recipe.totalMinutes)}, ${recipe.servingCount} kişilik${recipe.averageCalories ? `, ~${recipe.averageCalories} kcal` : ""}.`,
  };
}

export default async function TarifPage({ params }: TarifPageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const session = await auth();
  const bookmarked = session?.user?.id
    ? await isBookmarked(session.user.id, recipe.id)
    : false;

  // Görüntülenme sayısını arka planda artır
  incrementViewCount(slug).catch(() => {});

  const jsonLd = generateRecipeJsonLd(recipe);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Schema.org Recipe JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          {recipe._count.variations > 0 && (
            <Badge variant="info">{recipe._count.variations} varyasyon</Badge>
          )}
        </div>

        {/* Bookmark */}
        <div className="mt-4">
          <BookmarkButton recipeId={recipe.id} initialBookmarked={bookmarked} />
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted"
              >
                #{tag.name}
              </span>
            ))}
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

      {/* Variations Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">
            Topluluk Varyasyonları ({recipe._count.variations})
          </h2>
        </div>
        {recipe.variations && recipe.variations.length > 0 ? (
          <div className="mt-4 space-y-4">
            {recipe.variations.map((v) => (
              <div key={v.id} className="rounded-xl border border-border bg-bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-text">{v.miniTitle}</h3>
                    {v.description && (
                      <p className="mt-1 text-sm text-text-muted">{v.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-text-muted">❤️ {v.likeCount}</span>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  @{v.author.username}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-text-muted">
              Henüz varyasyon eklenmemiş. İlk varyasyonu sen ekle!
            </p>
          </div>
        )}
      </section>

      {/* View Count */}
      <div className="mt-8 text-center text-xs text-text-muted">
        {recipe.viewCount.toLocaleString("tr-TR")} görüntülenme
      </div>
    </div>
  );
}
