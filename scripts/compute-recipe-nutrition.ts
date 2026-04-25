/**
 * Recipe-level nutrition aggregate compute (oturum 20, DIET_SCORE_PLAN
 * B* Faz 2).
 *
 * Tum tarifleri tarayip RecipeIngredient × NutritionData JOIN + amount
 * parse ile per-porsiyon sugar / fiber / sodium / satFat hesabi yap,
 * RecipeNutrition tablosuna upsert.
 *
 * Idempotent: ayni recipe icin tekrar koşturursa eski satiri update.
 *
 * Kullanim:
 *   npx tsx scripts/compute-recipe-nutrition.ts                 # dry-run
 *   npx tsx scripts/compute-recipe-nutrition.ts --apply          # dev
 *   npx tsx scripts/compute-recipe-nutrition.ts --apply --confirm-prod
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";
import {
  aggregateNutrition,
  type NutritionLookup,
} from "../src/lib/nutrition/aggregate";
import { asciiFold } from "../src/lib/nutrition/unit-convert";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const APPLY = process.argv.includes("--apply");

async function main() {
  assertDbTarget("compute-recipe-nutrition");

  // 1. NutritionData lookup map (name lowercased)
  const nutritionRows = await prisma.nutritionData.findMany({
    select: {
      name: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      carbsPer100g: true,
      fatPer100g: true,
      sugarPer100g: true,
      fiberPer100g: true,
      sodiumPer100g: true,
      satFatPer100g: true,
      defaultUnit: true,
      gramsPerUnit: true,
    },
  });
  const lookup = new Map<string, NutritionLookup>();
  for (const r of nutritionRows) {
    const key = asciiFold(r.name.toLowerCase().trim());
    lookup.set(key, {
      caloriesPer100g: Number(r.caloriesPer100g),
      proteinPer100g: Number(r.proteinPer100g),
      carbsPer100g: Number(r.carbsPer100g),
      fatPer100g: Number(r.fatPer100g),
      sugarPer100g: r.sugarPer100g === null ? null : Number(r.sugarPer100g),
      fiberPer100g: r.fiberPer100g === null ? null : Number(r.fiberPer100g),
      sodiumPer100g: r.sodiumPer100g === null ? null : Number(r.sodiumPer100g),
      satFatPer100g: r.satFatPer100g === null ? null : Number(r.satFatPer100g),
      defaultUnit: r.defaultUnit,
      gramsPerUnit: r.gramsPerUnit === null ? null : Number(r.gramsPerUnit),
    });
  }
  console.log("📚 NutritionData lookup: " + lookup.size + " ingredient");

  // 2. Tum recipes (published) + ingredients fetch
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      servingCount: true,
      ingredients: {
        select: { name: true, amount: true, unit: true, isOptional: true },
      },
    },
  });
  console.log("📊 " + recipes.length + " published recipe");
  console.log("⚙️  Mode: " + (APPLY ? "APPLY" : "DRY-RUN") + "\n");

  // 3. Aggregate her recipe icin
  const distribution = {
    sugar: { samples: 0, sum: 0 },
    fiber: { samples: 0, sum: 0 },
    sodium: { samples: 0, sum: 0 },
    satFat: { samples: 0, sum: 0 },
  };
  let highMatchCount = 0; // matchedRatio >= 0.5
  let zeroMatchCount = 0;
  const upserts: {
    recipeId: string;
    sugarPerServing: number | null;
    fiberPerServing: number | null;
    sodiumPerServing: number | null;
    satFatPerServing: number | null;
    matchedRatio: number;
  }[] = [];

  for (const r of recipes) {
    const agg = aggregateNutrition(r.ingredients, lookup, r.servingCount);

    if (agg.matchedRatio >= 0.5) highMatchCount++;
    if (agg.matchedCount === 0) zeroMatchCount++;

    if (agg.sugarPerServing !== null) {
      distribution.sugar.samples++;
      distribution.sugar.sum += agg.sugarPerServing;
    }
    if (agg.fiberPerServing !== null) {
      distribution.fiber.samples++;
      distribution.fiber.sum += agg.fiberPerServing;
    }
    if (agg.sodiumPerServing !== null) {
      distribution.sodium.samples++;
      distribution.sodium.sum += agg.sodiumPerServing;
    }
    if (agg.satFatPerServing !== null) {
      distribution.satFat.samples++;
      distribution.satFat.sum += agg.satFatPerServing;
    }

    upserts.push({
      recipeId: r.id,
      sugarPerServing: agg.sugarPerServing,
      fiberPerServing: agg.fiberPerServing,
      sodiumPerServing: agg.sodiumPerServing,
      satFatPerServing: agg.satFatPerServing,
      matchedRatio: agg.matchedRatio,
    });
  }

  console.log("📈 Aggregate dagilimi:");
  console.log(
    "  Tarif sayisi (matchedRatio>=0.5): " +
      highMatchCount +
      " (%" +
      ((highMatchCount / recipes.length) * 100).toFixed(0) +
      ")",
  );
  console.log("  Tarif sayisi (0 match):           " + zeroMatchCount);
  console.log("");
  for (const [key, d] of Object.entries(distribution)) {
    if (d.samples === 0) {
      console.log("  " + key.padEnd(8) + " : (no samples)");
    } else {
      console.log(
        "  " +
          key.padEnd(8) +
          " avg/porsiyon: " +
          (d.sum / d.samples).toFixed(1) +
          " | samples: " +
          d.samples,
      );
    }
  }
  console.log("");

  if (APPLY) {
    console.log("💾 RecipeNutrition yaziliyor...");
    const CHUNK = 200;
    for (let i = 0; i < upserts.length; i += CHUNK) {
      const slice = upserts.slice(i, i + CHUNK);
      // deleteMany + createMany pattern
      await prisma.recipeNutrition.deleteMany({
        where: { recipeId: { in: slice.map((u) => u.recipeId) } },
      });
      await prisma.recipeNutrition.createMany({
        data: slice.map((u) => ({
          recipeId: u.recipeId,
          sugarPerServing:
            u.sugarPerServing === null ? null : new Prisma.Decimal(u.sugarPerServing),
          fiberPerServing:
            u.fiberPerServing === null ? null : new Prisma.Decimal(u.fiberPerServing),
          sodiumPerServing:
            u.sodiumPerServing === null ? null : new Prisma.Decimal(u.sodiumPerServing),
          satFatPerServing:
            u.satFatPerServing === null ? null : new Prisma.Decimal(u.satFatPerServing),
          matchedRatio: new Prisma.Decimal(u.matchedRatio),
        })),
      });
      process.stdout.write(".");
    }
    console.log("\n✅ Yazildi (" + upserts.length + " row)");
  } else {
    console.log("💡 Apply icin --apply ekle.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
