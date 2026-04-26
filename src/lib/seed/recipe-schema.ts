/**
 * Zod schema mirroring `docs/RECIPE_FORMAT.md`. The seed script runs every
 * candidate recipe through `seedRecipeSchema.safeParse(...)` BEFORE touching
 * the DB, so a single bad Codex entry no longer blows up a 500-recipe
 * batch, it's rejected with a clear per-field message and the rest of the
 * batch continues. See `scripts/seed-recipes.ts`.
 *
 * Why a separate schema file (not `src/lib/validators.ts`): the shapes here
 * are seed-only. User-facing forms have their own (stricter) constraints
 * on some fields (e.g. variationSchema trims and caps differently).
 * Keeping them apart avoids cross-contamination as either side evolves.
 */
import { z } from "zod";
import { CUISINE_CODES } from "@/lib/cuisines";

const CATEGORY_SLUGS = [
  "et-yemekleri",
  "tavuk-yemekleri",
  "sebze-yemekleri",
  "corbalar",
  "baklagil-yemekleri",
  "salatalar",
  "kahvaltiliklar",
  "hamur-isleri",
  "tatlilar",
  "aperatifler",
  "icecekler",
  "kokteyller",
  "kahve-sicak-icecekler",
  "makarna-pilav",
  "soslar-dippler",
  "smoothie-shake",
  "atistirmaliklar",
] as const;

const TAG_SLUGS = [
  "pratik",
  "30-dakika-alti",
  "dusuk-kalorili",
  "yuksek-protein",
  "firinda",
  "tek-tencere",
  "misafir-sofrasi",
  "cocuk-dostu",
  "butce-dostu",
  "vegan",
  "vejetaryen",
  "alkollu",
  "alkolsuz",
  "kis-tarifi",
  "yaz-tarifi",
] as const;

const RECIPE_TYPES = [
  "YEMEK",
  "TATLI",
  "ICECEK",
  "KOKTEYL",
  "APERATIF",
  "SALATA",
  "CORBA",
  "KAHVALTI",
  "ATISTIRMALIK",
  "SOS",
] as const;

const DIFFICULTY = ["EASY", "MEDIUM", "HARD"] as const;

const ALLERGEN = [
  "GLUTEN",
  "SUT",
  "YUMURTA",
  "KUSUYEMIS",
  "YER_FISTIGI",
  "SOYA",
  "DENIZ_URUNLERI",
  "SUSAM",
  "KEREVIZ",
  "HARDAL",
] as const;

// Slug regex: lowercase ASCII + digits + dashes. The runtime upstream is
// stricter (must be unique in DB) but we can at least catch formatting
// mistakes before the DB layer. e.g. accidentally leaving a Turkish
// character in like "koftesi" → "köftesi".
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.string().max(50),
  unit: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(1),
  isOptional: z.boolean().optional(),
  // Optional section label for multi-component recipes. "Hamur için",
  // "Şerbet için", "Sos için"... Leave null for simple recipes. Convention:
  // "X için" phrasing keeps group headers consistent across Codex entries.
  group: z.string().trim().min(1).max(80).optional().nullable(),
});

const stepSchema = z.object({
  stepNumber: z.number().int().min(1),
  instruction: z.string().min(1).max(1000),
  tip: z.string().max(500).optional().nullable(),
  timerSeconds: z.number().int().min(1).max(86400).optional().nullable(),
});

/**
 * Per-locale translation payload for a recipe. All fields are optional,
 * Codex can translate just the title, or everything. Ingredient/step arrays
 * mirror the primary TR ones by `sortOrder` / `stepNumber`, NOT by array
 * index, so missing entries don't break alignment when rendered.
 *
 * The UI language toggle (Faz 3) reads this via `recipe.translations[locale]`.
 * Until then: harmless JSONB column, no behaviour change.
 */
const localeTranslationSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(20).max(500).optional(),
  tipNote: z.string().max(500).optional().nullable(),
  servingSuggestion: z.string().max(500).optional().nullable(),
  ingredients: z
    .array(
      z.object({
        sortOrder: z.number().int().min(1),
        name: z.string().min(1).max(200),
      }),
    )
    .optional(),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().min(1),
        instruction: z.string().min(1).max(1000),
        tip: z.string().max(500).optional().nullable(),
      }),
    )
    .optional(),
});

/**
 * Multi-locale bucket keyed by ISO 639-1 lowercase code (en, de, fr, ...).
 * Today only `en` is foreseen; the loose record shape is future-proof.
 */
const translationsSchema = z.record(
  z.string().regex(/^[a-z]{2}$/, "locale kodu 2 küçük harf olmalı"),
  localeTranslationSchema,
);

export const seedRecipeSchema = z
  .object({
    title: z.string().min(2).max(200),
    slug: z
      .string()
      .min(2)
      .max(200)
      .regex(
        slugRegex,
        "slug sadece küçük harf, rakam ve tire içerebilir (TR karakter YOK)",
      ),
    emoji: z.string().max(10).optional().nullable(),

    description: z.string().min(20).max(500),

    categorySlug: z.enum(CATEGORY_SLUGS),
    type: z.enum(RECIPE_TYPES),
    difficulty: z.enum(DIFFICULTY),

    // Marine'li tarifler (Sauerbraten 3 gun, ekşi maya ekmek 12 saat,
    // tahin helvası dinlenme, vb.) icin cap 7 gun (10080 dk). Prep + cook
    // hala 24 saat altinda; total marine/dinlenme dahil 7 gune kadar.
    prepMinutes: z.number().int().min(0).max(1440),
    cookMinutes: z.number().int().min(0).max(1440),
    totalMinutes: z.number().int().min(1).max(10080),
    servingCount: z.number().int().min(1).max(50),

    averageCalories: z.number().int().min(1).max(3000).optional().nullable(),
    protein: z.number().min(0).max(500).optional().nullable(),
    carbs: z.number().min(0).max(500).optional().nullable(),
    fat: z.number().min(0).max(500).optional().nullable(),

    isFeatured: z.boolean().default(false),

    tipNote: z.string().max(500).optional().nullable(),
    servingSuggestion: z.string().max(500).optional().nullable(),

    tags: z.array(z.enum(TAG_SLUGS)).max(5).default([]),
    // Allergens field is new (Apr 2026). Legacy seed entries without it
    // default to empty, the retrofit script then fills them.
    allergens: z.array(z.enum(ALLERGEN)).max(10).default([]),

    // Cuisine origin code, one of the supported codes (see
    // src/lib/cuisines.ts, 32 kod oturum 25 itibariyle). Optional +
    // nullable: legacy seed entries default to null, the retrofit script
    // fills them. New Codex batches should include this explicitly.
    cuisine: z.enum(CUISINE_CODES).optional().nullable(),

    // Hunger bar, 1-10 integer tokluk puanı (porsiyon başı). Default
    // olarak `scripts/retrofit-hunger-bar.ts` formül ile doldurur.
    // Codex manuel override gerekliyse (özel vaka, tek kişilik ağır
    // yemek vs) explicit verir; yoksa retrofit hesaplar.
    hungerBar: z.number().int().min(1).max(10).optional().nullable(),

    // Opsiyonel EN/DE çevirileri. TR primary language, translations
    // UI language toggle'ı (Faz 3) canlıya alınınca devreye girer.
    // Codex dilerse batch ile birlikte EN çevirisi de gönderebilir.
    translations: translationsSchema.optional().nullable(),

    ingredients: z.array(ingredientSchema).min(1).max(40),
    steps: z.array(stepSchema).min(1).max(30),
  })
  // Soft-consistency check: prep + cook shouldn't exceed total by more
  // than 15 minutes of fudge. Prevents "prep 60 + cook 90 but total 30"
  // typos. `superRefine` lets us build a dynamic message with the actual
  // numbers so Codex knows which fields to fix.
  .superRefine((r, ctx) => {
    if (r.prepMinutes + r.cookMinutes > r.totalMinutes + 15) {
      ctx.addIssue({
        code: "custom",
        path: ["totalMinutes"],
        message: `prepMinutes (${r.prepMinutes}) + cookMinutes (${r.cookMinutes}) toplamı totalMinutes (${r.totalMinutes}) değerinden çok fazla. Kontrol et.`,
      });
    }
  });

export type SeedRecipe = z.infer<typeof seedRecipeSchema>;

/**
 * Validates an array of candidate recipes. Returns both the valid subset
 * (ready to hand to Prisma) and a list of per-index failures so the seed
 * script can log them all up-front rather than dying on the first bad row.
 */
export function validateSeedRecipes(candidates: readonly unknown[]): {
  valid: SeedRecipe[];
  errors: { index: number; title: string; message: string }[];
} {
  const valid: SeedRecipe[] = [];
  const errors: { index: number; title: string; message: string }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const raw = candidates[i];
    const parsed = seedRecipeSchema.safeParse(raw);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      // Grab something human-friendly to identify the row in logs even if
      // title itself is the broken field.
      const title =
        raw && typeof raw === "object" && "title" in raw
          ? String((raw as { title: unknown }).title ?? "<no title>")
          : "<no title>";
      // Take the most specific error per row, the first issue is usually
      // the most obvious one to fix.
      const first = parsed.error.issues[0];
      const pathStr = first?.path.join(".") || "(root)";
      errors.push({
        index: i,
        title,
        message: `${pathStr}: ${first?.message ?? "unknown"}`,
      });
    }
  }

  return { valid, errors };
}
