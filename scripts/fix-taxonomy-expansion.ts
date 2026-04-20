/**
 * One-shot: apply cuisine reassignments enabled by the 18 Apr 2026
 * taxonomy expansion (pe/gb/pl/au added to `src/lib/cuisines.ts`).
 * These 6 recipes were flagged in batch 1-3 Codex audits as "cuisine
 * mismatch" but couldn't be fixed earlier because the target country
 * code didn't exist in our taxonomy.
 *
 * Also fixes one data bug flagged in batch 3 audit:
 *   samsun-kaz-tiridi, recipe carries goose meat but `vejetaryen` tag
 *   slipped into the tags list. Removes the tag.
 *
 * Idempotent: skips if cuisine is already correct / tag already removed.
 *
 *   npx tsx scripts/fix-taxonomy-expansion.ts
 *   npx tsx scripts/fix-taxonomy-expansion.ts --apply
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

const CUISINE_FIXES: readonly CuisineFix[] = [
  { slug: "pisco-sour", expected: "pe", reason: "Peruvian classic cocktail." },
  { slug: "lomo-saltado", expected: "pe", reason: "Peruvian stir-fry with beef and soy sauce." },
  { slug: "london-fog", expected: "gb", reason: "British tea-latte drink (named after London fog)." },
  { slug: "limonlu-posset", expected: "gb", reason: "Traditional English lemon posset." },
  { slug: "pierogi", expected: "pl", reason: "Polish stuffed dumplings." },
  { slug: "pavlova", expected: "au", reason: "Australian/NZ meringue dessert, 'au' is the more common attribution." },
];

const TAG_REMOVAL = {
  slug: "samsun-kaz-tiridi",
  tag: "vejetaryen",
  reason:
    "Recipe contains goose meat; 'vejetaryen' tag was an inconsistency flagged by Codex batch 3 audit.",
};

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

async function applyTagFix(): Promise<{ applied: number; skipped: number }> {
  console.log(`\n== Tag cleanup (1) ==`);

  const recipe = await prisma.recipe.findUnique({
    where: { slug: TAG_REMOVAL.slug },
    select: {
      id: true,
      slug: true,
      tags: { select: { id: true, tag: { select: { id: true, slug: true } } } },
    },
  });
  if (!recipe) {
    console.log(`❌ [${TAG_REMOVAL.slug}] not found, skip.`);
    return { applied: 0, skipped: 0 };
  }

  const link = recipe.tags.find((rt) => rt.tag.slug === TAG_REMOVAL.tag);
  if (!link) {
    console.log(`⏭️  [${TAG_REMOVAL.slug}] no "${TAG_REMOVAL.tag}" tag, skip.`);
    return { applied: 0, skipped: 1 };
  }

  console.log(
    `${APPLY ? "✅" : "📋"} [${TAG_REMOVAL.slug}] remove tag "${TAG_REMOVAL.tag}"`,
  );
  console.log(`     reason: ${TAG_REMOVAL.reason}`);

  if (APPLY) {
    await prisma.recipeTag.delete({ where: { id: link.id } });
    return { applied: 1, skipped: 0 };
  }
  return { applied: 0, skipped: 0 };
}

async function main() {
  if (APPLY) assertDbTarget("fix-taxonomy-expansion");

  console.log(
    `${APPLY ? "APPLYING" : "DRY-RUN"}, taxonomy expansion cuisine fixes + batch 3 tag cleanup`,
  );

  const cuisineResult = await applyCuisineFixes();
  const tagResult = await applyTagFix();

  const appliedTotal = cuisineResult.applied + tagResult.applied;
  const skippedTotal = cuisineResult.skipped + tagResult.skipped;

  console.log("");
  if (APPLY) {
    console.log(
      `🎉 done, ${appliedTotal} update(s) applied, ${skippedTotal} already in place.`,
    );
    console.log("  cuisine: ", cuisineResult.applied, "applied,", cuisineResult.skipped, "skipped");
    console.log("  tag:     ", tagResult.applied, "applied,", tagResult.skipped, "skipped");
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
