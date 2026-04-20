/**
 * Backfill nutrition data (averageCalories, protein, carbs, fat) for
 * recipes that have null values. Uses rule-based estimation from
 * ingredient names + amounts.
 *
 * Run:
 *   npx tsx scripts/retrofit-nutrition.ts --dry-run      # preview
 *   npx tsx scripts/retrofit-nutrition.ts --validate      # compare with existing values
 *   npx tsx scripts/retrofit-nutrition.ts                 # apply to null-only recipes
 *   npx tsx scripts/retrofit-nutrition.ts --force         # overwrite existing values
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { estimateNutrition } from "../src/lib/nutrition";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const VALIDATE = process.argv.includes("--validate");

async function main(): Promise<void> {
  assertDbTarget("retrofit-nutrition");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL yok");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    const mode = VALIDATE ? "validate" : DRY_RUN ? "dry-run" : FORCE ? "force" : "apply";
    console.log(`\n🥗 retrofit-nutrition (${mode}) → ${host}\n`);

    const recipes = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        servingCount: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
        ingredients: {
          select: { name: true, amount: true, unit: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { slug: "asc" },
    });

    let updated = 0;
    let skipped = 0;
    let noEstimate = 0;
    let validated = 0;
    let goodEstimates = 0;
    let poorEstimates = 0;

    // Validation mode: compare estimates vs existing values
    if (VALIDATE) {
      console.log("═══ VALIDATION: Comparing estimates vs existing values ═══\n");
      const withValues = recipes.filter((r) => r.averageCalories !== null);

      for (const r of withValues) {
        const est = estimateNutrition(r.ingredients, r.servingCount);
        if (!est) {
          console.log(`  ${r.slug.padEnd(30)}, estimation failed (low match rate)`);
          continue;
        }

        const actual = r.averageCalories!;
        const diff = Math.abs(est.averageCalories - actual);
        const pct = actual > 0 ? ((diff / actual) * 100).toFixed(0) : "∞";
        const flag = Number(pct) > 30 ? "⚠" : "✅";

        if (Number(pct) <= 30) goodEstimates++;
        else poorEstimates++;

        if (Number(pct) > 30) {
          console.log(
            `  ${flag} ${r.slug.padEnd(30)} actual=${actual} est=${est.averageCalories} (${pct}% off) [${est.matchedIngredients}/${est.totalIngredients} matched]`,
          );
        }
        validated++;
      }

      console.log(`\nValidated: ${validated} | Good (≤30%): ${goodEstimates} | Poor (>30%): ${poorEstimates}`);
      console.log(`Accuracy: ${((goodEstimates / validated) * 100).toFixed(1)}%\n`);
      await prisma.$disconnect();
      return;
    }

    // Apply mode
    for (const r of recipes) {
      const hasExisting = r.averageCalories !== null;
      if (hasExisting && !FORCE) {
        skipped++;
        continue;
      }

      const est = estimateNutrition(r.ingredients, r.servingCount);
      if (!est) {
        noEstimate++;
        continue;
      }

      // Sanity bounds
      if (est.averageCalories < 10 || est.averageCalories > 2000) {
        console.log(
          `  ⚠ ${r.slug.padEnd(30)}, estimate out of bounds (${est.averageCalories} kcal), skipping`,
        );
        noEstimate++;
        continue;
      }

      const arrow = hasExisting ? "(forced)" : "";
      console.log(
        `  ${r.slug.padEnd(30)} ${arrow} → ${est.averageCalories} kcal, P${est.protein} C${est.carbs} F${est.fat} [${est.matchedIngredients}/${est.totalIngredients}]`,
      );

      if (!DRY_RUN) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: {
            averageCalories: est.averageCalories,
            protein: est.protein,
            carbs: est.carbs,
            fat: est.fat,
          },
        });
      }
      updated++;
    }

    const verb = DRY_RUN ? "Would update" : "Updated";
    console.log(
      `\n${verb}: ${updated} | Skipped (has values): ${skipped} | No estimate: ${noEstimate} | Total: ${recipes.length}`,
    );
    if (DRY_RUN) console.log("(dry run, DB'ye dokunulmadı)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
