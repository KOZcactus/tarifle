/**
 * One-shot (idempotent) retrofit: walk every Recipe, infer its cuisine
 * code from title/slug/description, and write it. Re-runnable safely:
 *
 *   - Recipes with a non-null cuisine are SKIPPED (we trust explicit
 *     author/Codex labelling over inference).
 *   - Re-running after a new batch only processes the new recipes.
 *
 * Run after any new seed batch to ensure recipes without explicit
 * cuisine tags get auto-inferred.
 *
 *   npx tsx scripts/retrofit-cuisine.ts
 *   npx tsx scripts/retrofit-cuisine.ts --dry-run   # preview only
 *   npx tsx scripts/retrofit-cuisine.ts --force      # overwrite existing
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import {
  inferCuisineFromRecipe,
  CUISINE_LABEL,
  type CuisineCode,
} from "../src/lib/cuisines";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

async function main() {
  assertDbTarget("retrofit-cuisine");
  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      cuisine: true,
      ingredients: {
        select: { name: true },
      },
    },
    orderBy: { slug: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let noChange = 0;

  // Distribution counter for summary
  const distribution: Record<string, number> = {};

  for (const r of recipes) {
    const hasExisting = r.cuisine !== null;
    if (hasExisting && !FORCE) {
      skipped++;
      if (r.cuisine) {
        distribution[r.cuisine] = (distribution[r.cuisine] ?? 0) + 1;
      }
      continue;
    }

    const inferred = inferCuisineFromRecipe({
      title: r.title,
      slug: r.slug,
      description: r.description,
      ingredients: r.ingredients,
    });

    // Track distribution
    distribution[inferred] = (distribution[inferred] ?? 0) + 1;

    // Skip the write if inference matches current
    if (r.cuisine === inferred) {
      noChange++;
      continue;
    }

    const arrow = hasExisting ? "(forced)" : "";
    const fromLabel = r.cuisine
      ? `${r.cuisine} (${CUISINE_LABEL[r.cuisine as CuisineCode] ?? "?"})`
      : "∅";
    const toLabel = `${inferred} (${CUISINE_LABEL[inferred]})`;
    console.log(
      `  ${r.slug.padEnd(35)} ${arrow} ${fromLabel} → ${toLabel}`,
    );

    if (!DRY_RUN) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { cuisine: inferred },
      });
    }
    updated++;
  }

  const verb = DRY_RUN ? "Would update" : "Updated";
  console.log(
    `\n${verb}: ${updated} | Skipped (already tagged): ${skipped} | No change: ${noChange} | Total: ${recipes.length}`,
  );

  // Print distribution
  console.log("\nMutfak dağılımı:");
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  for (const [code, count] of sorted) {
    const label = CUISINE_LABEL[code as CuisineCode] ?? code;
    const pct = ((count / recipes.length) * 100).toFixed(1);
    console.log(`  ${label.padEnd(15)} ${String(count).padStart(4)} (%${pct})`);
  }

  if (DRY_RUN) console.log("\n(dry run, no writes)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("retrofit failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
