import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiAssistantForm } from "@/components/ai/AiAssistantForm";
import { getUniqueIngredientNames } from "@/lib/queries/ingredient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Allergen } from "@prisma/client";
import { buildLanguageAlternates } from "@/lib/seo/hreflang";

/** Personalization tur 5 (oturum 13): logged-in user'in tercihlerinden
 *  AI Asistan formunu on-doldurma. Mantik:
 *   - cuisine: ilk favori mutfak kod (string), yoksa "tr" default
 *   - dietSlug: allergen avoidance'a gore otomatik secim
 *     (GLUTEN -> glutensiz, SUT -> sutsuz; ikisi varsa GLUTEN onceligi).
 *     Ek olarak favoriteTags vegan/vejetaryen/alkolsuz icerirse dietSlug
 *     o slug'a set. Allergen daha kisitlayici, her ikisi varsa allergen
 *     yener.
 *   - personalized: true ise form ustunde "Tercihlerinize gore dolduruldu"
 *     bilgi cipi gosterilir.
 */
interface InitialPrefs {
  cuisine: string;
  dietSlug: string;
  personalized: boolean;
}

function derivePrefs(
  favoriteCuisines: string[],
  favoriteTags: string[],
  allergenAvoidances: Allergen[],
): InitialPrefs {
  let cuisine = "tr";
  let dietSlug = "";
  let personalized = false;

  if (favoriteCuisines.length > 0 && favoriteCuisines[0]) {
    cuisine = favoriteCuisines[0];
    personalized = true;
  }

  // Allergen oncelik: kisitlayici disiplin gucludur
  if (allergenAvoidances.includes("GLUTEN")) {
    dietSlug = "glutensiz";
    personalized = true;
  } else if (allergenAvoidances.includes("SUT")) {
    dietSlug = "sutsuz";
    personalized = true;
  } else {
    // Tag-based diet (vegan > vejetaryen > alkolsuz oncelik)
    if (favoriteTags.includes("vegan")) {
      dietSlug = "vegan";
      personalized = true;
    } else if (favoriteTags.includes("vejetaryen")) {
      dietSlug = "vejetaryen";
      personalized = true;
    } else if (favoriteTags.includes("alkolsuz")) {
      dietSlug = "alkolsuz";
      personalized = true;
    }
  }

  return { cuisine, dietSlug, personalized };
}

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
    alternates: { canonical: "/ai-asistan", languages: buildLanguageAlternates("/ai-asistan") },
    robots: hasParams ? { index: false, follow: true } : undefined,
  };
}

export default async function AiAsistanPage({
  searchParams,
}: AiAsistanPageProps) {
  const session = await auth();
  const params = await searchParams;
  const autoPantry = params.autoPantry === "1";
  const [knownIngredients, t, userPrefs] = await Promise.all([
    getUniqueIngredientNames(),
    getTranslations("aiAssistant"),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            favoriteCuisines: true,
            favoriteTags: true,
            allergenAvoidances: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const initialPrefs: InitialPrefs = userPrefs
    ? derivePrefs(
        userPrefs.favoriteCuisines,
        userPrefs.favoriteTags,
        userPrefs.allergenAvoidances,
      )
    : { cuisine: "tr", dietSlug: "", personalized: false };

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

      <AiAssistantForm
        knownIngredients={knownIngredients}
        initialPrefs={initialPrefs}
        isAuthenticated={Boolean(session?.user?.id)}
        autoLoadPantry={autoPantry}
      />
    </main>
  );
}
