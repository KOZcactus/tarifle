/**
 * Sync nutrition data from seed-recipes.ts source to production DB.
 *
 * Seed script is idempotent INSERT (slug skip) — when Codex adds
 * averageCalories/protein/carbs/fat to existing recipes in source,
 * the DB doesn't get updated automatically. This script bridges the gap
 * by reading the source and UPDATEing recipes where the DB has NULL but
 * source has values.
 *
 * Usage:
 *   npx tsx scripts/sync-nutrition.ts              # apply
 *   npx tsx scripts/sync-nutrition.ts --dry-run    # preview
 *   npx tsx scripts/sync-nutrition.ts --force      # overwrite existing DB values
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { recipes } from "./seed-recipes";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

async function main(): Promise<void> {
  assertDbTarget("sync-nutrition");
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
    console.log(
      `\n🥗 sync-nutrition ${isDryRun ? "(dry-run)" : isForce ? "(force)" : "(apply)"} → ${host}\n`,
    );

    // Build source nutrition map: slug → { averageCalories, protein, carbs, fat }
    const sourceMap = new Map<
      string,
      { averageCalories: number; protein: number; carbs: number; fat: number }
    >();
    for (const r of recipes) {
      const rec = r as {
        slug?: string;
        averageCalories?: number | null;
        protein?: number | null;
        carbs?: number | null;
        fat?: number | null;
      };
      if (
        rec.slug &&
        rec.averageCalories != null &&
        rec.protein != null &&
        rec.carbs != null &&
        rec.fat != null
      ) {
        sourceMap.set(rec.slug, {
          averageCalories: rec.averageCalories,
          protein: rec.protein,
          carbs: rec.carbs,
          fat: rec.fat,
        });
      }
    }

    if (sourceMap.size === 0) {
      console.log("⚠ Source'ta nutrition'lı tarif yok. Çıkılıyor.");
      return;
    }

    // Fetch DB recipes
    const slugs = Array.from(sourceMap.keys());
    const dbRows = await prisma.recipe.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        title: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
      },
    });

    const dbBySlug = new Map(dbRows.map((r) => [r.slug, r]));

    const willUpdate: {
      slug: string;
      title: string;
      from: string;
      to: string;
    }[] = [];
    const noChange: string[] = [];
    const notInDb: string[] = [];

    for (const [slug, src] of sourceMap) {
      const db = dbBySlug.get(slug);
      if (!db) {
        notInDb.push(slug);
        continue;
      }

      const dbHasValues = db.averageCalories !== null;

      if (dbHasValues && !isForce) {
        // DB already has nutrition — check if same
        if (
          Number(db.averageCalories) === src.averageCalories &&
          Number(db.protein) === src.protein &&
          Number(db.carbs) === src.carbs &&
          Number(db.fat) === src.fat
        ) {
          noChange.push(slug);
        }
        // Different but not forced — skip
        continue;
      }

      if (
        dbHasValues &&
        Number(db.averageCalories) === src.averageCalories &&
        Number(db.protein) === src.protein
      ) {
        noChange.push(slug);
        continue;
      }

      const fromLabel = dbHasValues
        ? `${db.averageCalories}kcal`
        : "null";
      const toLabel = `${src.averageCalories}kcal P${src.protein} C${src.carbs} F${src.fat}`;

      willUpdate.push({ slug, title: db.title, from: fromLabel, to: toLabel });
    }

    console.log(`Source'ta nutrition'lı: ${sourceMap.size}`);
    console.log(`DB'de bulunan: ${dbRows.length}`);
    console.log(`No change: ${noChange.length}`);
    console.log(`Update edilecek: ${willUpdate.length}`);
    if (notInDb.length > 0) {
      console.log(`Source'ta var, DB'de yok: ${notInDb.length}`);
    }

    if (willUpdate.length === 0) {
      console.log("\n✅ Tüm nutrition değerleri senkron, yapacak iş yok.");
      return;
    }

    console.log("\nUpdate listesi (ilk 20):");
    for (const u of willUpdate.slice(0, 20)) {
      console.log(`  ${u.title.padEnd(35)} ${u.from} → ${u.to}`);
    }
    if (willUpdate.length > 20) {
      console.log(`  ... ${willUpdate.length - 20} tarif daha`);
    }

    if (isDryRun) {
      console.log("\nℹ Dry-run — DB'ye dokunulmadı.");
      return;
    }

    // Apply
    let updated = 0;
    await prisma.$transaction(
      async (tx) => {
        for (const u of willUpdate) {
          const src = sourceMap.get(u.slug)!;
          await tx.recipe.update({
            where: { slug: u.slug },
            data: {
              averageCalories: src.averageCalories,
              protein: src.protein,
              carbs: src.carbs,
              fat: src.fat,
            },
          });
          updated++;
        }
      },
      { timeout: 60000, maxWait: 5000 },
    );
    console.log(`\n✅ ${updated} tarifin nutrition değeri güncellendi.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
