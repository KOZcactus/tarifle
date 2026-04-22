import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getRecipeForAdminEdit } from "@/lib/queries/admin";
import { RecipeContentEditForm } from "@/components/admin/RecipeContentEditForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [{ slug }, t] = await Promise.all([
    params,
    getTranslations("admin.pageTitles"),
  ]);
  return {
    title: t("recipeEdit", { title: slug }),
    robots: { index: false, follow: false },
  };
}

export default async function AdminRecipeEditPage({ params }: PageProps) {
  const { slug } = await params;
  const [recipe, t] = await Promise.all([
    getRecipeForAdminEdit(slug),
    getTranslations("admin.contentEdit"),
  ]);
  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <nav className="mb-4 text-sm text-text-muted">
        <Link href={`/admin/tarifler/${slug}`} className="hover:text-primary">
          {t("backToDetail")}
        </Link>
      </nav>
      <RecipeContentEditForm
        recipeId={recipe.id}
        slug={recipe.slug}
        title={recipe.title}
        initialIngredients={recipe.ingredients}
        initialSteps={recipe.steps}
        initialTipNote={recipe.tipNote}
        initialServingSuggestion={recipe.servingSuggestion}
      />
    </div>
  );
}
