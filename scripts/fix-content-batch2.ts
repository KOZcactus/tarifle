/**
 * One-shot: apply content corrections flagged by Codex during batch 2
 * translation audit (docs/translations-batch-2.json issues field).
 *
 * Two fix families:
 *   A. Cuisine reassignment (25), recipes whose Recipe.cuisine field was
 *      wrong (international dish marked 'tr', Turkish dish marked 'th' or
 *      'cn', etc).
 *   B. Missing ingredient (16 adds across 15 recipes), a step references
 *      an ingredient that wasn't in the ingredients list.
 *
 * Deliberately skipped:
 *   Cuisine taxonomy gaps (7 recipes), no country code available:
 *     - limonlu-posset, london-fog        (British / no `gb`)
 *     - lomo-saltado, pisco-sour          (Peruvian / no `pe`)
 *     - pavlova                            (Australia-NZ / no `au`)
 *     - pierogi                            (Polish / no `pl`)
 *     - pina-colada                        (Caribbean / no reliable code)
 *     - orman-meyveli-protein-shake        (generic healthy shake, no
 *                                           canonical cuisine)
 *   Future taxonomy expansion could address these.
 *
 *   Reverse "unused ingredient" (5), ingredient listed but not used in
 *   steps. Could be intentional serving-side garnish or legitimate
 *   recipe simplification; needs case-by-case review:
 *     maqluba (yoğurt), mas-fasulyesi-yemegi (yoğurt),
 *     pazi-kavurmasi (yoğurt), peynir-toplari (kraker),
 *     peynirli-quesadilla (taze soğan).
 *
 *   Nicoise-salatasi: Codex flagged dressing components ambiguously
 *   (mustard-based dressing), the recipe lists vinaigrette base oil+lemon
 *   but not hardal. Manual content review, deferred.
 *
 *   6 calorie anomalies, all legitimate (low-cal drinks + dipping
 *   sauces): kimchi, kusburnu-cayi, limonlu-zencefil-cayi, mirra,
 *   nuoc-cham, ponzu-sos.
 *
 *   1 false positive: medianoche-sandwich "vejetaryen tag yok", no
 *   vejetaryen tag is CORRECT because the sandwich contains pork.
 *
 *   Idempotent: skips if cuisine is already correct / ingredient already
 *   exists.
 *
 *   npx tsx scripts/fix-content-batch2.ts
 *   npx tsx scripts/fix-content-batch2.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

interface CuisineFix {
  slug: string;
  expected: string;
  reason: string;
}

interface IngredientFix {
  slug: string;
  ingredientName: string;
  amount: string;
  unit: string;
  reason: string;
}

const CUISINE_FIXES: readonly CuisineFix[] = [
  { slug: "key-lime-pie", expected: "us", reason: "Florida-origin American pie." },
  { slug: "klasik-menemen", expected: "tr", reason: "Classic Turkish breakfast, was mis-marked 'th'." },
  { slug: "kombe", expected: "tr", reason: "Mardin regional Turkish cookie, was mis-marked 'th'." },
  { slug: "koshari", expected: "me", reason: "Egyptian street food, 'me' closest in taxonomy (no `eg`)." },
  { slug: "kottbullar", expected: "se", reason: "Swedish meatballs." },
  { slug: "kulebyaka", expected: "ru", reason: "Russian pie." },
  { slug: "kvass", expected: "ru", reason: "Russian fermented drink." },
  { slug: "lor-mantisi", expected: "tr", reason: "Turkish ricotta mantı, was mis-marked 'cn'." },
  { slug: "loubia", expected: "ma", reason: "Moroccan white-bean stew." },
  { slug: "maduros", expected: "cu", reason: "Cuban-style sweet plantains." },
  { slug: "magrip-saksukasi", expected: "ma", reason: "North African (Maghrib) shakshuka, was mis-marked 'cn'." },
  { slug: "mai-tai", expected: "us", reason: "Tiki cocktail (California origin)." },
  { slug: "manhattan", expected: "us", reason: "Classic American whisky cocktail." },
  { slug: "mansaf", expected: "me", reason: "Jordanian/Levantine lamb-rice, 'me' covers Levant." },
  { slug: "manti", expected: "tr", reason: "Turkish mantı, was mis-marked 'cn'." },
  { slug: "maqluba", expected: "me", reason: "Palestinian/Levantine layered rice, 'me' covers Levant." },
  { slug: "margarita", expected: "mx", reason: "Mexican tequila cocktail." },
  { slug: "martini", expected: "us", reason: "Classic American gin/vermouth cocktail." },
  { slug: "mechoui", expected: "ma", reason: "Maghrib slow-roasted lamb." },
  { slug: "medovik", expected: "ru", reason: "Russian honey cake." },
  { slug: "mi-quang", expected: "vn", reason: "Vietnamese Quảng-region noodle dish." },
  { slug: "moscow-mule", expected: "us", reason: "American cocktail (LA origin, despite the name)." },
  { slug: "muhallebi", expected: "tr", reason: "Turkish milk pudding, was mis-marked 'th'." },
  { slug: "mujaddara", expected: "me", reason: "Levantine lentil-rice dish." },
  { slug: "musakhan", expected: "me", reason: "Palestinian sumac chicken." },
  { slug: "negroni-sbagliato", expected: "it", reason: "Italian aperitivo cocktail." },
  { slug: "nom-hoa-chuoi", expected: "vn", reason: "Vietnamese banana-blossom salad." },
  { slug: "okroshka", expected: "ru", reason: "Russian cold kvass soup." },
  { slug: "old-fashioned", expected: "us", reason: "Classic American whisky cocktail." },
  { slug: "paloma", expected: "mx", reason: "Mexican tequila cocktail." },
  { slug: "panettone", expected: "it", reason: "Italian Christmas bread." },
  { slug: "pasta-alla-norma", expected: "it", reason: "Sicilian/Italian pasta." },
  { slug: "patates-graten", expected: "fr", reason: "French potato gratin." },
  { slug: "patatesli-yumurta", expected: "tr", reason: "Turkish breakfast skillet, was mis-marked 'th'." },
  { slug: "pazi-kavurmasi", expected: "tr", reason: "Turkish chard sauté, was mis-marked 'th'." },
  { slug: "penicillin-kokteyl", expected: "us", reason: "Modern NYC whisky cocktail." },
  { slug: "pepecura", expected: "tr", reason: "Karadeniz pepeçura, was mis-marked 'th'." },
  { slug: "picadillo-cubano", expected: "cu", reason: "Cuban ground-beef dish." },
  { slug: "pirozhki", expected: "ru", reason: "Russian stuffed buns." },
];

const INGREDIENT_FIXES: readonly IngredientFix[] = [
  {
    slug: "khobz-eldar",
    ingredientName: "Kuru maya",
    amount: "1",
    unit: "çay kaşığı",
    reason: "Step 1 kneads yeasted dough; ingredient list was missing yeast.",
  },
  {
    slug: "kolbaszli-lecso",
    ingredientName: "Toz kırmızı biber",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 3 adds paprika; ingredient list was missing it.",
  },
  {
    slug: "koshari",
    ingredientName: "Sarımsak",
    amount: "2",
    unit: "diş",
    reason: "Step 2 simmers tomato sauce with garlic; ingredient list was missing it.",
  },
  {
    slug: "koz-patlicanli-humus",
    ingredientName: "Zeytinyağı",
    amount: "1",
    unit: "yemek kaşığı",
    reason: "Step 3 drizzles olive oil on serving; ingredient list was missing it.",
  },
  {
    slug: "kulebyaka",
    ingredientName: "Kuru maya",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 1 prepares yeasted dough; ingredient list was missing yeast.",
  },
  {
    slug: "medianoche",
    ingredientName: "Salatalık turşusu",
    amount: "4",
    unit: "dilim",
    reason: "Step 2 uses pickles; ingredient list was missing them.",
  },
  {
    slug: "medianoche-sandwich",
    ingredientName: "Salatalık turşusu",
    amount: "4",
    unit: "dilim",
    reason: "Step 2 uses pickles; ingredient list was missing them.",
  },
  {
    slug: "minestrone",
    ingredientName: "Zeytinyağı",
    amount: "2",
    unit: "yemek kaşığı",
    reason: "Step 1 sautés vegetables in olive oil; ingredient list was missing it.",
  },
  {
    slug: "musakhan",
    ingredientName: "Zeytinyağı",
    amount: "3",
    unit: "yemek kaşığı",
    reason: "Step 2 uses olive oil; ingredient list was missing it.",
  },
  {
    slug: "nom-hoa-chuoi",
    ingredientName: "Limon",
    amount: "1",
    unit: "adet",
    reason: "Step 1 soaks banana blossom in lemon water; ingredient list was missing lemon.",
  },
  {
    slug: "nom-hoa-chuoi",
    ingredientName: "Taze nane",
    amount: "1",
    unit: "tutam",
    reason: "Step 2 tosses with fresh herbs; ingredient list was missing fresh herbs.",
  },
  {
    slug: "nuoc-cham",
    ingredientName: "Kırmızı biber",
    amount: "1",
    unit: "adet",
    reason: "Step 3 adds chili; ingredient list was missing chili pepper.",
  },
  {
    slug: "oyakodon",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 1 cooks onion; ingredient list was missing onion.",
  },
  {
    slug: "pamonha",
    ingredientName: "Mısır yaprağı",
    amount: "8",
    unit: "adet",
    reason: "Step 2 wraps in corn husks; ingredient list was missing corn husks.",
  },
  {
    slug: "picadillo-cubano",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 1 sautés meat with onion; ingredient list was missing onion.",
  },
  {
    slug: "pirozhki",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 2 sautés ground meat with onion; ingredient list was missing onion.",
  },
];

async function applyCuisineFixes(): Promise<{ applied: number; skipped: number }> {
  let applied = 0;
  let skipped = 0;

  console.log(`\n== Cuisine fixes (${CUISINE_FIXES.length}) ==`);

  for (const fix of CUISINE_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, cuisine: true },
    });
    if (!recipe) {
      console.log(`❌ [${fix.slug}] not found, skip.`);
      continue;
    }

    if (recipe.cuisine === fix.expected) {
      console.log(`⏭️  [${fix.slug}] already "${recipe.cuisine}", skip.`);
      skipped++;
      continue;
    }

    console.log(
      `${APPLY ? "✅" : "📋"} [${fix.slug}] cuisine ${recipe.cuisine} → ${fix.expected}`,
    );
    console.log(`     reason: ${fix.reason}`);

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { cuisine: fix.expected },
      });
      applied++;
    }
  }

  return { applied, skipped };
}

async function applyIngredientFixes(): Promise<{ applied: number; skipped: number }> {
  let applied = 0;
  let skipped = 0;

  console.log(`\n== Missing ingredient fixes (${INGREDIENT_FIXES.length}) ==`);

  for (const fix of INGREDIENT_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: {
        id: true,
        slug: true,
        ingredients: {
          select: { name: true, sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        },
      },
    });
    if (!recipe) {
      console.log(`❌ [${fix.slug}] not found, skip.`);
      continue;
    }

    const existing = await prisma.recipeIngredient.findFirst({
      where: {
        recipeId: recipe.id,
        name: { equals: fix.ingredientName, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });
    if (existing) {
      console.log(`⏭️  [${fix.slug}] already has "${existing.name}", skip.`);
      skipped++;
      continue;
    }

    const nextSortOrder = (recipe.ingredients[0]?.sortOrder ?? 0) + 1;

    console.log(
      `${APPLY ? "✅" : "📋"} [${fix.slug}] → add "${fix.ingredientName} ${fix.amount} ${fix.unit}" (sortOrder ${nextSortOrder})`,
    );
    console.log(`     reason: ${fix.reason}`);

    if (APPLY) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          name: fix.ingredientName,
          amount: fix.amount,
          unit: fix.unit,
          sortOrder: nextSortOrder,
          isOptional: false,
        },
      });
      applied++;
    }
  }

  return { applied, skipped };
}

async function main() {
  if (APPLY) assertDbTarget("fix-content-batch2");

  console.log(`${APPLY ? "APPLYING" : "DRY-RUN"}, content fixes from batch 2 audit`);

  const cuisineResult = await applyCuisineFixes();
  const ingredientResult = await applyIngredientFixes();

  const appliedTotal = cuisineResult.applied + ingredientResult.applied;
  const skippedTotal = cuisineResult.skipped + ingredientResult.skipped;

  console.log("");
  if (APPLY) {
    console.log(
      `🎉 done, ${appliedTotal} update(s) applied, ${skippedTotal} already in place.`,
    );
    console.log("  cuisine:    ", cuisineResult.applied, "applied,", cuisineResult.skipped, "skipped");
    console.log("  ingredient: ", ingredientResult.applied, "applied,", ingredientResult.skipped, "skipped");
  } else {
    console.log(
      `Dry-run only. Pass --apply to write. ${skippedTotal} already in place, ${appliedTotal} would be updated.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
