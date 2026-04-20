import { NextResponse } from "next/server";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/lib/queries/recipe";
import { SITE_URL } from "@/lib/constants";
import {
  pickRecipeTitle,
  pickRecipeDescription,
  pickRecipeTipNote,
  pickRecipeServingSuggestion,
} from "@/lib/recipe/translate";
import { isValidLocale, type Locale } from "@/i18n/config";
import { cookies } from "next/headers";

/**
 * `/tarif/[slug]/pdf`, dinamik PDF export endpoint.
 *
 * @react-pdf/renderer React component ağacını PDF stream'e çeviriyor.
 * Puppeteer tarzı headless chrome'a gerek yok (Vercel Serverless
 * binary limit + cold start sıkıntısı); pure JS renderer, Vercel
 * friendly. Ilk istekte ~2-3s, cache ile sonraki isteklerde CDN'ten
 * dönerek hızlanır.
 *
 * Layout: header (emoji + başlık + meta), description, malzemeler,
 * adımlar, tip notu, alerjenler, footer (tarifle.app + URL).
 *
 * Cache: 1h public, 1 day CDN. Tarif güncellenirse stale-while-
 * revalidate, yeterince iyi (PDF indirmeli kullanıcılar tazelik
 * kritik değil).
 */
export const dynamic = "force-dynamic";

// Türkçe karakterler için Roboto regular + bold. Google Fonts CDN
// URL'leri, Font.register module-scope'da once yapılır.
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.1.0/files/roboto-latin-ext-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.1.0/files/roboto-latin-ext-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Roboto",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  headerBar: {
    height: 6,
    backgroundColor: "#e85d2c",
    marginLeft: -48,
    marginRight: -48,
    marginTop: -48,
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 9,
    color: "#6b6b6b",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: "#1a1a1a",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    marginBottom: 16,
    fontSize: 10,
    color: "#6b6b6b",
  },
  metaItem: { marginRight: 12 },
  description: {
    fontSize: 11,
    color: "#333",
    marginBottom: 20,
    lineHeight: 1.55,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 6,
    color: "#1a1a1a",
  },
  ingredientLine: {
    fontSize: 10.5,
    marginBottom: 2.5,
    paddingLeft: 10,
  },
  ingredientGroup: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 8,
    marginBottom: 3,
    color: "#6b6b6b",
  },
  stepWrap: {
    marginBottom: 6,
    flexDirection: "row",
  },
  stepNumber: {
    width: 18,
    fontSize: 10.5,
    fontWeight: 700,
    color: "#e85d2c",
  },
  stepText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  tipBlock: {
    marginTop: 14,
    padding: 10,
    backgroundColor: "#fdf4e8",
    borderLeft: 3,
    borderLeftColor: "#d4a843",
    borderLeftStyle: "solid",
  },
  tipLabel: {
    fontSize: 9,
    color: "#8a6a20",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  tipText: {
    fontSize: 10.5,
    color: "#4a3810",
    lineHeight: 1.5,
  },
  allergenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  allergenChip: {
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#fde8e8",
    color: "#a33a3a",
    marginRight: 4,
    marginBottom: 2,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd8cf",
    borderTopStyle: "solid",
    fontSize: 9,
    color: "#6b6b6b",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerBrand: { fontWeight: 700, color: "#e85d2c", fontSize: 11 },
});

const ALLERGEN_LABELS_TR: Record<string, string> = {
  GLUTEN: "Gluten",
  SUT: "Süt",
  YUMURTA: "Yumurta",
  KUSUYEMIS: "Kuruyemiş",
  YER_FISTIGI: "Yer fıstığı",
  SOYA: "Soya",
  DENIZ_URUNLERI: "Deniz ürünleri",
  SUSAM: "Susam",
  KEREVIZ: "Kereviz",
  HARDAL: "Hardal",
};

interface RecipeDetailLike {
  slug: string;
  title: string;
  description: string;
  emoji: string | null;
  totalMinutes: number;
  prepMinutes: number;
  cookMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  hungerBar: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  cuisine: string | null;
  category: { name: string; emoji: string | null };
  tipNote: string | null;
  servingSuggestion: string | null;
  allergens: string[];
  translations: unknown;
  ingredients: {
    name: string;
    amount: string;
    unit: string;
    group: string | null;
    sortOrder: number;
  }[];
  steps: { stepNumber: number; instruction: string }[];
}

function buildDocument(recipe: RecipeDetailLike, locale: Locale) {
  const title = pickRecipeTitle(recipe.title, recipe.translations, locale);
  const description = pickRecipeDescription(
    recipe.description,
    recipe.translations,
    locale,
  );
  const tipNote = pickRecipeTipNote(recipe.tipNote, recipe.translations, locale);
  const servingSuggestion = pickRecipeServingSuggestion(
    recipe.servingSuggestion,
    recipe.translations,
    locale,
  );

  // Group ingredients by `group` (null = default bucket)
  const grouped = new Map<string | null, typeof recipe.ingredients>();
  for (const ing of recipe.ingredients) {
    const key = ing.group ?? null;
    const arr = grouped.get(key) ?? [];
    arr.push(ing);
    grouped.set(key, arr);
  }

  const difficultyLabel =
    recipe.difficulty === "EASY"
      ? "Kolay"
      : recipe.difficulty === "MEDIUM"
        ? "Orta"
        : "Zor";

  return (
    <Document
      title={`${title}, Tarifle`}
      author="Tarifle"
      subject={title}
      creator="Tarifle"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} />
        <Text style={styles.eyebrow}>
          {recipe.category.emoji ?? "🍽"} {recipe.category.name}
        </Text>
        <Text style={styles.title}>
          {recipe.emoji ? `${recipe.emoji} ` : ""}
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>
            Toplam {recipe.totalMinutes} dk
          </Text>
          <Text style={styles.metaItem}>
            Hazırlık {recipe.prepMinutes} dk · Pişirme {recipe.cookMinutes} dk
          </Text>
          <Text style={styles.metaItem}>{recipe.servingCount} kişilik</Text>
          <Text style={styles.metaItem}>{difficultyLabel}</Text>
          {recipe.averageCalories !== null && (
            <Text style={styles.metaItem}>~{recipe.averageCalories} kcal</Text>
          )}
          {recipe.hungerBar !== null && (
            <Text style={styles.metaItem}>
              Açlık barı {recipe.hungerBar}/10
            </Text>
          )}
        </View>
        {description && <Text style={styles.description}>{description}</Text>}

        <Text style={styles.sectionTitle}>Malzemeler</Text>
        {[...grouped.entries()].map(([group, items]) => (
          <View key={group ?? "default"}>
            {group && <Text style={styles.ingredientGroup}>{group}</Text>}
            {items.map((ing) => (
              <Text key={ing.sortOrder} style={styles.ingredientLine}>
                • {ing.amount} {ing.unit} {ing.name}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Yapılış</Text>
        {recipe.steps.map((s) => (
          <View key={s.stepNumber} style={styles.stepWrap}>
            <Text style={styles.stepNumber}>{s.stepNumber}.</Text>
            <Text style={styles.stepText}>{s.instruction}</Text>
          </View>
        ))}

        {tipNote && (
          <View style={styles.tipBlock}>
            <Text style={styles.tipLabel}>Püf Noktası</Text>
            <Text style={styles.tipText}>{tipNote}</Text>
          </View>
        )}

        {servingSuggestion && (
          <View style={styles.tipBlock}>
            <Text style={styles.tipLabel}>Servis Önerisi</Text>
            <Text style={styles.tipText}>{servingSuggestion}</Text>
          </View>
        )}

        {recipe.allergens.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alerjenler</Text>
            <View style={styles.allergenRow}>
              {recipe.allergens.map((a) => (
                <Text key={a} style={styles.allergenChip}>
                  {ALLERGEN_LABELS_TR[a] ?? a}
                </Text>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text>
            <Text style={styles.footerBrand}>Tarifle</Text>, tarifle.app
          </Text>
          <Text>
            {SITE_URL}/tarif/{recipe.slug}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value ?? "tr";
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "tr";

  const doc = buildDocument(
    recipe as unknown as RecipeDetailLike,
    locale,
  );
  const stream = await pdf(doc).toBuffer();

  return new NextResponse(stream as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
