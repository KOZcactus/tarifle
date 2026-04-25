/**
 * Diyet skoru pre-compute pipeline (oturum 20, DIET_SCORE_PLAN.md).
 *
 * Tüm published tarif × 6 preset = ~20700 satır RecipeDietScore tablosuna
 * upsert eder. İdempotent: aynı script tekrar koşturulursa eski satırları
 * günceller, eklemez.
 *
 * Kullanım:
 *   npx tsx scripts/compute-diet-scores.ts                # dev dry-run
 *   npx tsx scripts/compute-diet-scores.ts --apply         # dev apply
 *   npx tsx scripts/compute-diet-scores.ts --apply --confirm-prod  # prod
 *   npx tsx scripts/compute-diet-scores.ts --recipe SLUG --apply   # tek tarif
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";
import {
  DIET_PROFILES,
  validateProfilesIntegrity,
} from "../src/lib/diet-scoring/profiles";
import { scoreRecipe } from "../src/lib/diet-scoring/scorer";
import type { RecipeForScoring } from "../src/lib/diet-scoring/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const RECIPE_SLUG = (() => {
  const idx = process.argv.indexOf("--recipe");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
})();

async function main() {
  assertDbTarget("compute-diet-scores");

  const integrity = validateProfilesIntegrity();
  if (!integrity.ok) {
    console.error("❌ Profile integrity hatasi:");
    integrity.errors.forEach((e) => console.error("  - " + e));
    process.exit(1);
  }
  console.log("✅ Profile integrity OK (" + DIET_PROFILES.length + " preset)");

  const where = RECIPE_SLUG
    ? { slug: RECIPE_SLUG, status: "PUBLISHED" as const }
    : { status: "PUBLISHED" as const };

  const recipes = await prisma.recipe.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      hungerBar: true,
      allergens: true,
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  console.log("📊 " + recipes.length + " tarif iceri ahindi");
  console.log("⚙️  Mode: " + (APPLY ? "APPLY" : "DRY-RUN"));
  console.log("");

  // Score distribution istatistik (dry-run + apply ikisinde de)
  const distByDiet: Record<string, { sum: number; count: number; ratings: Record<string, number> }> = {};
  for (const p of DIET_PROFILES) {
    distByDiet[p.slug] = { sum: 0, count: 0, ratings: {} };
  }

  let totalRows = 0;
  const upsertBatch: Array<{
    recipeId: string;
    dietSlug: string;
    score: number;
    breakdown: unknown;
  }> = [];

  for (const r of recipes) {
    const recipeForScoring: RecipeForScoring = {
      averageCalories: r.averageCalories,
      protein: r.protein === null ? null : Number(r.protein),
      carbs: r.carbs === null ? null : Number(r.carbs),
      fat: r.fat === null ? null : Number(r.fat),
      hungerBar: r.hungerBar,
      tagSlugs: r.tags.map((t) => t.tag.slug),
      allergens: r.allergens,
    };

    for (const profile of DIET_PROFILES) {
      const result = scoreRecipe(recipeForScoring, profile.slug);
      if (!result) continue;

      // Score distribution
      const d = distByDiet[profile.slug]!;
      d.sum += result.score;
      d.count += 1;
      d.ratings[result.rating] = (d.ratings[result.rating] ?? 0) + 1;

      totalRows += 1;

      if (APPLY) {
        upsertBatch.push({
          recipeId: r.id,
          dietSlug: profile.slug,
          score: result.score,
          breakdown: {
            isBeta: result.isBeta,
            rating: result.rating,
            criteria: result.criteria,
            approximationFlag: result.approximationFlag,
          },
        });
      }
    }
  }

  // Apply: batch insert via createMany + delete previous (idempotent reset)
  if (APPLY && upsertBatch.length > 0) {
    console.log("💾 Eski skorlari siliyor...");
    if (RECIPE_SLUG) {
      const recIds = recipes.map((r) => r.id);
      await prisma.recipeDietScore.deleteMany({ where: { recipeId: { in: recIds } } });
    } else {
      await prisma.recipeDietScore.deleteMany({});
    }

    console.log("💾 Yeni skorlari yaziliyor (" + upsertBatch.length + " row)...");
    // Batch chunked insert (Postgres 65k param limit)
    const CHUNK = 500;
    for (let i = 0; i < upsertBatch.length; i += CHUNK) {
      const slice = upsertBatch.slice(i, i + CHUNK);
      await prisma.recipeDietScore.createMany({
        data: slice.map((row) => ({
          recipeId: row.recipeId,
          dietSlug: row.dietSlug,
          score: row.score,
          breakdown: row.breakdown as never,
        })),
      });
      process.stdout.write(".");
    }
    console.log("\n✅ Yazildi");
  }

  // Distribution rapor
  console.log("\n📈 Skor dagilimi (preset bazinda):");
  const fmt = (n: number) => n.toString().padStart(5, " ");
  console.log("  Preset                  Avg | Mukem.| Iyi  | Orta | Zayif| Uyumsuz");
  console.log("  ───────────────────────────────────────────────────────────────────");
  for (const profile of DIET_PROFILES) {
    const d = distByDiet[profile.slug]!;
    const avg = d.count > 0 ? (d.sum / d.count).toFixed(1) : "0.0";
    const r = d.ratings;
    console.log(
      "  " +
        profile.slug.padEnd(22) +
        " " +
        avg.padStart(5) +
        " |" +
        fmt(r.excellent ?? 0) +
        " |" +
        fmt(r.good ?? 0) +
        " |" +
        fmt(r.fair ?? 0) +
        " |" +
        fmt(r.weak ?? 0) +
        " |" +
        fmt(r.poor ?? 0),
    );
  }
  console.log("");
  console.log("📊 Toplam islenen (recipe x diet):  " + totalRows);

  if (!APPLY) {
    console.log("\n💡 Apply icin --apply ekle.");
  } else {
    console.log("\n🎉 Compute tamamlandi.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
