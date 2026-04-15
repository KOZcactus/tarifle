/**
 * One-shot (idempotent) retrofit: walk every Recipe that has an empty
 * `allergens` array, run the rule-based inference against its ingredients,
 * and write the inferred set back. Re-runnable safely:
 *
 *   - Recipes with a non-empty allergens array are SKIPPED (we trust
 *     explicit author/Codex labelling over inference).
 *   - Recipes where inference returns an empty list also get a no-op
 *     update (still writes `[]`) so they're not re-visited needlessly.
 *
 * Run after any new seed batch to ensure recipes without explicit
 * allergens get auto-inferred.
 *
 *   npx tsx scripts/retrofit-allergens.ts
 *   npx tsx scripts/retrofit-allergens.ts --dry-run   # preview only
 *   npx tsx scripts/retrofit-allergens.ts --force     # overwrite existing
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import { inferAllergensFromIngredients } from "../src/lib/allergens";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

async function main() {
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      allergens: true,
      ingredients: {
        select: { name: true },
      },
    },
    orderBy: { slug: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let noChange = 0;

  for (const r of recipes) {
    const hasExisting = r.allergens.length > 0;
    if (hasExisting && !FORCE) {
      skipped++;
      continue;
    }

    const inferred = inferAllergensFromIngredients(r.ingredients);

    // Skip the write if inference matches current (includes the common
    // "no allergens found on either side" case) — Prisma still no-ops DB-
    // side but this keeps logs clean.
    const sameSet =
      inferred.length === r.allergens.length &&
      inferred.every((a) => r.allergens.includes(a));
    if (sameSet) {
      noChange++;
      continue;
    }

    const arrow = hasExisting ? "(forced)" : "";
    console.log(
      `  ${r.slug.padEnd(30)} ${arrow} ${r.allergens.join(",") || "∅"} → ${inferred.join(",") || "∅"}`,
    );

    if (!DRY_RUN) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: inferred },
      });
    }
    updated++;
  }

  const verb = DRY_RUN ? "Would update" : "Updated";
  console.log(
    `\n${verb}: ${updated} | Skipped (already tagged): ${skipped} | No change: ${noChange} | Total: ${recipes.length}`,
  );
  if (DRY_RUN) console.log("(dry run — no writes)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("retrofit failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
