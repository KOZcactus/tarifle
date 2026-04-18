/**
 * One-shot: apply content corrections flagged by Codex during batch 1
 * translation audit (docs/translations-batch-1.json issues field).
 *
 * Two fix families:
 *   A. Cuisine reassignment (14) — recipes whose Recipe.cuisine field was
 *      wrong (international dish marked 'tr', Turkish dish marked 'th' or
 *      'cn'). Codex's systematic review surfaced these.
 *   B. Missing ingredient (7) — a step or description references an
 *      ingredient that wasn't in the recipe's ingredients list.
 *
 * Deliberately skipped:
 *   - giresun-fasulye-tursusu-kavurmasi: Codex flagged "tuz" in tip but tuz
 *     is a pantry staple per AI matcher rules — not required as an ingredient.
 *   - kayseri-mantisi-otantik: Codex noted description mentions garlic yogurt
 *     and chili-oil that aren't in ingredients. This is a description/serving
 *     style mismatch rather than a content bug — deferred for content pass.
 *   - Calorie anomalies (6): all legitimate low-cal drinks (filtre kahve,
 *     greek coffee, kakule Türk kahvesi, ihlamur, agua fresca) or air-light
 *     snack (deniz yosunu cipsi). Same pattern as batch 0 beverages.
 *
 * Cuisine note: halloumi-izgara was flagged as 'cy' (Cyprus) but Cyprus
 * isn't in our cuisine taxonomy — using 'gr' (Greek) since halloumi is a
 * shared Cypriot/Greek tradition and 'gr' is the closest supported code.
 *
 * Idempotent: skips if cuisine is already correct / ingredient already
 * exists. Safe to re-run.
 *
 * Dev-safe, prod requires --confirm-prod per project convention.
 *
 *   npx tsx scripts/fix-content-batch1.ts
 *   npx tsx scripts/fix-content-batch1.ts --apply
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
  isOptional?: boolean;
  reason: string;
}

const CUISINE_FIXES: readonly CuisineFix[] = [
  { slug: "clam-chowder", expected: "us", reason: "New England clam chowder — US dish." },
  { slug: "crema-catalana", expected: "es", reason: "Catalan custard dessert — Spain." },
  { slug: "dakgalbi", expected: "kr", reason: "Korean spicy stir-fried chicken." },
  { slug: "dan-dan-noodle", expected: "cn", reason: "Sichuan Chinese noodle dish." },
  { slug: "erzurum-cag-kebabi", expected: "tr", reason: "Erzurum regional Turkish kebab — was mis-marked 'th'." },
  { slug: "fatteh", expected: "me", reason: "Levantine/Middle Eastern chickpea-yogurt dish." },
  { slug: "firinda-karniyarik", expected: "tr", reason: "Classic Turkish stuffed eggplant — was mis-marked 'cn'." },
  { slug: "golubtsy", expected: "ru", reason: "Russian stuffed cabbage rolls." },
  { slug: "gumbo", expected: "us", reason: "Louisiana/Creole American stew." },
  {
    slug: "halloumi-izgara",
    expected: "gr",
    reason:
      "Grilled halloumi — Cypriot/Greek tradition. 'cy' isn't in our taxonomy, 'gr' is the closest supported code.",
  },
  { slug: "harira", expected: "ma", reason: "Moroccan chickpea-lentil soup." },
  { slug: "hasir-kunefe", expected: "tr", reason: "Turkish künefe variant — was mis-marked 'th'." },
  { slug: "hosmerim", expected: "tr", reason: "Turkish milk dessert — was mis-marked 'th'." },
  {
    slug: "karadeniz-hamsi-kayganasi",
    expected: "tr",
    reason: "Black Sea Turkish anchovy omelette — was mis-marked 'th'.",
  },
];

const INGREDIENT_FIXES: readonly IngredientFix[] = [
  {
    slug: "congee",
    ingredientName: "Taze soğan",
    amount: "2",
    unit: "dal",
    reason: "Step 3 serves with spring onion; ingredient list was missing it.",
  },
  {
    slug: "cuban-picadillo",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 1 sautés meat with onion; ingredient list was missing it.",
  },
  {
    slug: "dana-solyanka",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 1 browns meat with onion; ingredient list was missing it.",
  },
  {
    slug: "egg-drop-soup",
    ingredientName: "Taze soğan",
    amount: "2",
    unit: "dal",
    reason: "Step 3 garnishes with spring onion; ingredient list was missing it.",
  },
  {
    slug: "escondidinho",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 2 cooks ground meat with onion; ingredient list was missing it.",
  },
  {
    slug: "fattoush",
    ingredientName: "Zeytinyağı",
    amount: "3",
    unit: "yemek kaşığı",
    reason: "Step 3 dresses with olive oil; ingredient list was missing this core dressing component.",
  },
  {
    slug: "jeyuk-bokkeum",
    ingredientName: "Susam",
    amount: "1",
    unit: "yemek kaşığı",
    reason: "Step 3 garnishes with toasted sesame; ingredient list was missing it.",
  },
  {
    slug: "jeyuk-bokkeum",
    ingredientName: "Taze soğan",
    amount: "2",
    unit: "dal",
    reason: "Step 3 garnishes with spring onion; ingredient list was missing it.",
  },
];

async function applyCuisineFixes(): Promise<{ applied: number; skipped: number }> {
  let applied = 0;
  let skipped = 0;

  console.log(`\n== Cuisine fixes (${CUISINE_FIXES.length}) ==`);

  for (const fix of CUISINE_FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, title: true, cuisine: true },
    });
    if (!recipe) {
      console.log(`❌ [${fix.slug}] not found in DB — skip.`);
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
        title: true,
        ingredients: {
          select: { name: true, sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        },
      },
    });
    if (!recipe) {
      console.log(`❌ [${fix.slug}] not found in DB — skip.`);
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
          isOptional: fix.isOptional ?? false,
        },
      });
      applied++;
    }
  }

  return { applied, skipped };
}

async function main() {
  if (APPLY) assertDbTarget("fix-content-batch1");

  console.log(`${APPLY ? "APPLYING" : "DRY-RUN"} — content fixes from batch 1 audit`);

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
    console.log(
      "\nNext: run `npx tsx scripts/audit-deep.ts` to verify the content is consistent.",
    );
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
