/**
 * Hunger bar retrofit, tüm tariflere skor hesapla + upsert.
 *
 * İdempotent: seed'de explicit `hungerBar` verilmişse override etmez
 * (yalnızca null veya `--force` flag'i varsa yeniden hesaplar).
 *
 * Usage:
 *   npx tsx scripts/retrofit-hunger-bar.ts              # dry-run (sadece özet)
 *   npx tsx scripts/retrofit-hunger-bar.ts --apply      # dev'e yaz
 *   npx tsx scripts/retrofit-hunger-bar.ts --apply --force  # mevcutları da yeniden hesapla
 *   DATABASE_URL=<prod> npx tsx scripts/retrofit-hunger-bar.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { calcHungerBar } from "../src/lib/hunger-bar";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("retrofit-hunger-bar");

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      hungerBar: true,
      category: { select: { slug: true } },
      type: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      ingredients: { select: { name: true } },
    },
  });

  console.log(`📊 ${recipes.length} tarif işleniyor (apply=${APPLY}, force=${FORCE})\n`);

  let toUpdate = 0;
  let skipped = 0;
  const distribution: Record<number, number> = {};

  const updates: { id: string; slug: string; hungerBar: number }[] = [];

  for (const r of recipes) {
    const score = calcHungerBar({
      categorySlug: r.category.slug,
      type: r.type,
      averageCalories: r.averageCalories,
      protein: r.protein ? Number(r.protein) : null,
      carbs: r.carbs ? Number(r.carbs) : null,
      fat: r.fat ? Number(r.fat) : null,
      ingredientNames: r.ingredients.map((i) => i.name),
    });

    distribution[score] = (distribution[score] ?? 0) + 1;

    const shouldUpdate = FORCE || r.hungerBar !== score;
    if (!shouldUpdate) {
      skipped++;
      continue;
    }
    updates.push({ id: r.id, slug: r.slug, hungerBar: score });
    toUpdate++;
  }

  console.log(`✅ distribution (score → count):`);
  for (let i = 1; i <= 10; i++) {
    const count = distribution[i] ?? 0;
    const bar = "█".repeat(Math.round(count / 50));
    console.log(`  ${String(i).padStart(2)}: ${String(count).padStart(4)} ${bar}`);
  }
  console.log(`\n  to update: ${toUpdate}, skipped (already correct): ${skipped}`);

  if (!APPLY) {
    console.log("\n(dry-run, --apply ile yazılır)");
    return;
  }

  // Chunked batch update
  const CHUNK = 50;
  let written = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((u) =>
        prisma.recipe.update({
          where: { id: u.id },
          data: { hungerBar: u.hungerBar },
        }),
      ),
    );
    written += chunk.length;
    console.log(`  ✅ ${written}/${updates.length}`);
  }

  console.log(`\n🎉 retrofit done, ${written} rows updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
