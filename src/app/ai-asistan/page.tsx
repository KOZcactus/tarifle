import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiAssistantForm } from "@/components/ai/AiAssistantForm";
import { getUniqueIngredientNames } from "@/lib/queries/ingredient";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.aiAssistant");
  return { title: t("title"), description: t("description") };
}

export default async function AiAsistanPage() {
  const [knownIngredients, t] = await Promise.all([
    getUniqueIngredientNames(),
    getTranslations("aiAssistant"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("pageEyebrow")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">{t("pageSubtitle")}</p>
      </header>

      <AiAssistantForm knownIngredients={knownIngredients} />
    </main>
  );
}
