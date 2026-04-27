/**
 * Tek-seferlik teşhis script: prod nutrition recompute sırasında
 * matchedRatio=0 (NutritionData ingredient'lerin hiçbiriyle eşleşmemiş)
 * tarifleri bul. Oturum 28 paketi 11 sonu compute "Tarif sayısı (0
 * match): 1" raporladı, sebep teşhisi.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(".env.local") });
neonConfig.webSocketConstructor = ws;

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  console.log(`DB: ${new URL(process.env.DATABASE_URL!).host}`);

  const zeroMatch = await prisma.$queryRaw<
    Array<{ id: string; slug: string; title: string; cuisine: string | null; ratio: number | null }>
  >`
    SELECT r.id, r.slug, r.title, r.cuisine, n."matchedRatio"::float as ratio
    FROM "recipe_nutrition" n
    JOIN "recipes" r ON r.id = n."recipeId"
    WHERE n."matchedRatio" = 0 OR n."matchedRatio" IS NULL
    ORDER BY r.slug
  `;

  console.log(`\nmatchedRatio=0 veya NULL: ${zeroMatch.length} tarif`);
  for (const r of zeroMatch) {
    console.log(`\n  Slug: ${r.slug}`);
    console.log(`  Title: ${r.title}`);
    console.log(`  Cuisine: ${r.cuisine}`);
    console.log(`  Ratio: ${r.ratio}`);

    const ings = await prisma.recipeIngredient.findMany({
      where: { recipeId: r.id },
      orderBy: { sortOrder: "asc" },
      select: { name: true, amount: true, unit: true },
    });
    console.log(`  Ingredients (${ings.length}):`);
    for (const ing of ings) {
      console.log(`    - "${ing.name}" | ${ing.amount} ${ing.unit ?? ""}`);
    }
  }

  // Düşük matchedRatio top 5 (kontrol için)
  const low = await prisma.$queryRaw<
    Array<{ slug: string; title: string; ratio: number }>
  >`
    SELECT r.slug, r.title, n."matchedRatio"::float as ratio
    FROM "recipe_nutrition" n
    JOIN "recipes" r ON r.id = n."recipeId"
    WHERE n."matchedRatio" > 0 AND n."matchedRatio" < 0.5
    ORDER BY n."matchedRatio" ASC
    LIMIT 5
  `;
  console.log(`\n--- En düşük matchedRatio top 5 (>0, <0.5) ---`);
  for (const l of low) {
    console.log(`  ${l.ratio.toFixed(3)} | ${l.slug} | ${l.title}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
