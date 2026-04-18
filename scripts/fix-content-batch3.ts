/**
 * One-shot: apply content corrections flagged by Codex during batch 3
 * translation audit (docs/translations-batch-3.json issues field).
 *
 * Two fix families:
 *   A. Cuisine reassignment (30) — recipes whose Recipe.cuisine was wrong.
 *   B. Missing ingredient (11) — step references a missing ingredient.
 *
 * Deliberately skipped:
 *   Taxonomy gaps (2 — waiting for future expansion):
 *     - pupusa (El Salvador, no `sv` code)
 *     - tkemali (Georgian, no `ge` code)
 *
 *   Ambiguous content (2 — deferred for manual content review):
 *     - salade-lyonnaise: dressing components not itemised
 *     - tavuklu-noodle: pan-Asian, no canonical cuisine
 *
 *   Already-correct (1):
 *     - slata-mechouia is already 'ma' (Codex flagged Tunisian context;
 *       'ma' covers Maghreb including Tunisia, so no change needed)
 *
 *   Reverse/content issues (3 — deferred, need manual review):
 *     - sambousek: yoğurt listed but not used
 *     - pulled-pork-sandvic: slug/title says pork but ingredients are beef
 *     - tavuk-sote: "Baharatlar" vague (not specific spice names)
 *
 *   Time inconsistencies (6 — total_minutes vs. rest time ambiguity;
 *   need schema-level decision about whether chill/rest time should be
 *   in total_minutes or a separate field): soguk-cay, tavuk-doner,
 *   tavuk-sis, tiramisu, trilece, zencefilli-limonata.
 *
 *   Allergen flags (2 — user-safety concern, manual review required):
 *     - sutlac GLUTEN (likely corn starch, no wheat)
 *     - tavuk-gogsu GLUTEN (rice-based dessert)
 *
 *   5 legitimate calorie anomalies (çay/kahve/şalgam/salsa):
 *     salgam-suyu, salsa-roja, turk-kahvesi, zencefil-cayi,
 *     zencefilli-ihlamur.
 *
 * Idempotent. Dev-safe, prod requires --confirm-prod.
 *
 *   npx tsx scripts/fix-content-batch3.ts
 *   npx tsx scripts/fix-content-batch3.ts --apply
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
  { slug: "profiterol", expected: "fr", reason: "French pastry (choux + cream)." },
  { slug: "ribollita", expected: "it", reason: "Tuscan bread-bean soup." },
  { slug: "romesco-sos", expected: "es", reason: "Catalan nut-pepper sauce." },
  { slug: "salpicao", expected: "br", reason: "Brazilian chicken salad." },
  { slug: "san-sebastian-cheesecake", expected: "es", reason: "Basque burnt cheesecake." },
  { slug: "scallion-pancake", expected: "cn", reason: "Chinese savoury pancake." },
  { slug: "sezar-salata", expected: "us", reason: "Caesar salad — Tijuana-origin, canonical as American restaurant dish." },
  { slug: "shchi", expected: "ru", reason: "Russian cabbage soup." },
  { slug: "sichuan-yesil-fasulye", expected: "cn", reason: "Sichuan-style dry-fried beans." },
  { slug: "sidecar", expected: "fr", reason: "Classic cognac cocktail of Paris origin." },
  { slug: "sinh-to-bo", expected: "vn", reason: "Vietnamese avocado smoothie." },
  { slug: "sini-koftesi", expected: "tr", reason: "Hatay-region Turkish tray kofte — was mis-marked 'th'." },
  { slug: "solyanka", expected: "ru", reason: "Russian thick, sour-salty soup." },
  { slug: "sopa-de-lima", expected: "mx", reason: "Yucatán lime soup." },
  { slug: "tacos-al-pastor", expected: "mx", reason: "Mexico City spit-grilled pork tacos." },
  { slug: "tamal-en-cazuela", expected: "cu", reason: "Cuban cornmeal casserole." },
  { slug: "tartar-sos", expected: "fr", reason: "French-origin classic mayonnaise sauce." },
  { slug: "tavuklu-sezar-wrap", expected: "us", reason: "Caesar wrap — US café standard." },
  { slug: "tepsi-kebabi", expected: "tr", reason: "Hatay regional Turkish tray kebab — was mis-marked 'th'." },
  { slug: "thit-kho", expected: "vn", reason: "Vietnamese braised pork belly." },
  { slug: "tutu-de-feijao", expected: "br", reason: "Brazilian bean-flour mash." },
  { slug: "vaca-frita", expected: "cu", reason: "Cuban crispy beef." },
  { slug: "vatapa", expected: "br", reason: "Bahian Brazilian seafood stew." },
  { slug: "waldorf-salatasi", expected: "us", reason: "Classic NYC Waldorf-Astoria salad." },
  {
    slug: "whiskey-highball",
    expected: "jp",
    reason: "Highball culture is strongly associated with Japanese whisky bars.",
  },
  { slug: "whiskey-sour", expected: "us", reason: "Classic American bar cocktail." },
  { slug: "yaprak-sarma", expected: "tr", reason: "Turkish grape-leaf dolma — was mis-marked 'cn'." },
  { slug: "yuca-con-mojo", expected: "cu", reason: "Cuban yuca with garlic-citrus sauce." },
];

const INGREDIENT_FIXES: readonly IngredientFix[] = [
  {
    slug: "semla",
    ingredientName: "Kuru maya",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 1 prepares yeasted dough; ingredient list was missing yeast.",
  },
  {
    slug: "shawarma-pilavi",
    ingredientName: "Sarımsak",
    amount: "2",
    unit: "diş",
    reason: "Description calls for garlic yogurt; ingredient list was missing garlic.",
  },
  {
    slug: "sinop-nokulu",
    ingredientName: "Kuru maya",
    amount: "1",
    unit: "çay kaşığı",
    reason: "Step 1 prepares yeasted dough; ingredient list was missing yeast.",
  },
  {
    slug: "skagenrora",
    ingredientName: "Limon",
    amount: "1",
    unit: "adet",
    reason: "Step 2 adds lemon juice; ingredient list was missing lemon.",
  },
  {
    slug: "sopa-de-ajo",
    ingredientName: "Toz kırmızı biber",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 2 stirs in paprika; ingredient list was missing it.",
  },
  {
    slug: "sundubu-jjigae",
    ingredientName: "Susam yağı",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 1 uses sesame oil; ingredient list was missing it.",
  },
  {
    slug: "tatli-eksi-tavuk",
    ingredientName: "Toz şeker",
    amount: "2",
    unit: "yemek kaşığı",
    reason: "Step 2 adds sugar to the sauce; ingredient list was missing sugar.",
  },
  {
    slug: "tavuklu-hortobagyi-palacsinta",
    ingredientName: "Toz kırmızı biber",
    amount: "1",
    unit: "tatlı kaşığı",
    reason: "Step 3 simmers paprika sauce; ingredient list was missing paprika.",
  },
  {
    slug: "tokat-bat",
    ingredientName: "Maydanoz",
    amount: "1",
    unit: "tutam",
    reason: "Step 3 tops with fresh herbs; ingredient list was missing parsley.",
  },
  {
    slug: "umm-ali",
    ingredientName: "Toz şeker",
    amount: "3",
    unit: "yemek kaşığı",
    reason: "Step 2 warms milk with sugar; ingredient list was missing sugar.",
  },
  {
    slug: "yam-woon-sen",
    ingredientName: "Kişniş",
    amount: "1",
    unit: "tutam",
    reason: "Step 3 tosses with fresh herbs; ingredient list was missing cilantro.",
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
      console.log(`❌ [${fix.slug}] not found — skip.`);
      continue;
    }
    if (recipe.cuisine === fix.expected) {
      console.log(`⏭️  [${fix.slug}] already "${recipe.cuisine}" — skip.`);
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
      console.log(`❌ [${fix.slug}] not found — skip.`);
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
      console.log(`⏭️  [${fix.slug}] already has "${existing.name}" — skip.`);
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
  if (APPLY) assertDbTarget("fix-content-batch3");

  console.log(`${APPLY ? "APPLYING" : "DRY-RUN"} — content fixes from batch 3 audit`);

  const cuisineResult = await applyCuisineFixes();
  const ingredientResult = await applyIngredientFixes();

  const appliedTotal = cuisineResult.applied + ingredientResult.applied;
  const skippedTotal = cuisineResult.skipped + ingredientResult.skipped;

  console.log("");
  if (APPLY) {
    console.log(
      `🎉 done — ${appliedTotal} update(s) applied, ${skippedTotal} already in place.`,
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
