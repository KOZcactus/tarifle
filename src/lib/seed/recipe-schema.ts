/**
 * Zod schema mirroring `docs/RECIPE_FORMAT.md`. The seed script runs every
 * candidate recipe through `seedRecipeSchema.safeParse(...)` BEFORE touching
 * the DB, so a single bad Codex entry no longer blows up a 500-recipe
 * batch — it's rejected with a clear per-field message and the rest of the
 * batch continues. See `scripts/seed-recipes.ts`.
 *
 * Why a separate schema file (not `src/lib/validators.ts`): the shapes here
 * are seed-only. User-facing forms have their own (stricter) constraints
 * on some fields (e.g. variationSchema trims and caps differently).
 * Keeping them apart avoids cross-contamination as either side evolves.
 */
import { z } from "zod";

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
});

const stepSchema = z.object({
  stepNumber: z.number().int().min(1),
  instruction: z.string().min(1).max(1000),
  tip: z.string().max(500).optional().nullable(),
  timerSeconds: z.number().int().min(1).max(86400).optional().nullable(),
});

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

    prepMinutes: z.number().int().min(0).max(1440),
    cookMinutes: z.number().int().min(0).max(1440),
    totalMinutes: z.number().int().min(1).max(1440),
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
    // default to empty — the retrofit script then fills them.
    allergens: z.array(z.enum(ALLERGEN)).max(10).default([]),

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
      // Take the most specific error per row — the first issue is usually
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
