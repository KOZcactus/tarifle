/**
 * One-shot: add missing ingredients flagged by Codex during batch 0
 * translation audit. Each fix targets a single recipe where steps or
 * description reference an ingredient that isn't in the ingredient list.
 *
 * Source: docs/translations-batch-0.json "issues" field.
 *   - briam                : step 2 adds garlic → Sarımsak
 *   - bun-bo-hue           : step 1 boils with onion → Soğan
 *   - bun-cha              : step 1 kneads with garlic → Sarımsak
 *   - antep-katikli-dolma  : description mentions "sarımsaklı yoğurt" → Sarımsak
 *
 * Idempotent: skips if the named ingredient already exists on the recipe.
 * Adds with a sensible small quantity (2 diş) — the steps already expect
 * a small amount so this won't throw off the recipe's balance.
 *
 * Runs dry-run by default. --apply to write. Dev-safe, prod requires
 * --confirm-prod per the project convention.
 *
 *   npx tsx scripts/fix-missing-ingredients-batch0.ts
 *   npx tsx scripts/fix-missing-ingredients-batch0.ts --apply
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

interface Fix {
  slug: string;
  ingredientName: string;
  amount: string;
  unit: string;
  /** Why this fix — mirrors the Codex issue so the audit log makes sense. */
  reason: string;
}

const FIXES: readonly Fix[] = [
  {
    slug: "briam",
    ingredientName: "Sarımsak",
    amount: "2",
    unit: "diş",
    reason: "Step 2 mentions garlic; ingredient list was missing it.",
  },
  {
    slug: "bun-bo-hue",
    ingredientName: "Soğan",
    amount: "1",
    unit: "adet",
    reason: "Step 1 boils broth with onion; ingredient list was missing it.",
  },
  {
    slug: "bun-cha",
    ingredientName: "Sarımsak",
    amount: "3",
    unit: "diş",
    reason: "Step 1 kneads meat with garlic; ingredient list was missing it.",
  },
  {
    slug: "antep-katikli-dolma",
    ingredientName: "Sarımsak",
    amount: "2",
    unit: "diş",
    reason:
      'Description mentions "sarımsaklı yoğurt"; ingredient list was missing garlic.',
  },
];

async function main() {
  if (APPLY) assertDbTarget("fix-missing-ingredients-batch0");

  console.log(`${APPLY ? "APPLYING" : "DRY-RUN"} — ${FIXES.length} fix(es)`);
  console.log("");

  let applied = 0;
  let skipped = 0;

  for (const fix of FIXES) {
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

    // Idempotency: does the recipe already have an ingredient whose name
    // case-insensitively matches what we're about to add?
    const existing = await prisma.recipeIngredient.findFirst({
      where: {
        recipeId: recipe.id,
        name: {
          equals: fix.ingredientName,
          mode: "insensitive",
        },
      },
      select: { id: true, name: true },
    });
    if (existing) {
      console.log(
        `⏭️  [${fix.slug}] already has "${existing.name}" — skip.`,
      );
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

  console.log("");
  if (APPLY) {
    console.log(`🎉 done — ${applied} ingredient(s) added, ${skipped} already existed.`);
    console.log(
      "Next: run `npx tsx scripts/audit-deep.ts` to verify step-ingredient mismatches are gone.",
    );
  } else {
    console.log(`Dry-run only. Pass --apply to write. ${skipped} already in place.`);
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
