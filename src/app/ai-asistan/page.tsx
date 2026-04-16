import type { Metadata } from "next";
import { AiAssistantForm } from "@/components/ai/AiAssistantForm";
import { getUniqueIngredientNames } from "@/lib/queries/ingredient";

export const metadata: Metadata = {
  title: "AI Asistan",
  description:
    "Elindeki malzemeleri yaz, sana en uygun tarifleri öne çıkaralım. Eksik olanları da göstereceğiz.",
};

export default async function AiAsistanPage() {
  const knownIngredients = await getUniqueIngredientNames();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          AI Asistan
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          Elindekinden tarif bul
        </h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          Dolabındaki malzemeleri yaz, sana en çok uyan tarifleri getirelim. Eksikleri
          de görürsün — böylece markete gitmeden ne pişirebileceğini anlarsın.
        </p>
      </header>

      <AiAssistantForm knownIngredients={knownIngredients} />
    </main>
  );
}
