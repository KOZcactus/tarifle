import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiAssistantForm } from "@/components/ai/AiAssistantForm";
import { getUniqueIngredientNames } from "@/lib/queries/ingredient";

interface AiAsistanPageProps {
  searchParams: Promise<{ m?: string; [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: AiAsistanPageProps): Promise<Metadata> {
  const t = await getTranslations("metadata.aiAssistant");
  const params = await searchParams;
  // User-prefilled ingredient URLs (`?m=domates,tavuk`) are private input,
  // not landing pages. Block indexing on any parameterised variant and
  // point crawlers back to the clean /ai-asistan page via canonical.
  const hasParams = Object.keys(params).length > 0;
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/ai-asistan" },
    robots: hasParams ? { index: false, follow: true } : undefined,
  };
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
