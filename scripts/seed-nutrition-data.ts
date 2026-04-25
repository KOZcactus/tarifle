/**
 * NutritionData seed (oturum 20, DIET_SCORE_PLAN B* hibrit Faz 2).
 *
 * data/nutrition-usda-seed.json'dan top-frequency ingredient'lerin USDA
 * FoodData Central degerlerini NutritionData tablosuna yazar. Idempotent:
 * mevcut isim varsa update, yoksa create (upsert by unique name).
 *
 * Faz 2'nin temeli: bu tablodaki sugar/fiber/sodium/satFat/GI degerleri
 * recipe-level aggregate compute (per-porsiyon) icin kullanilir, dusuk-
 * seker preset proxy'den real'e gecer.
 *
 * Kullanim:
 *   npx tsx scripts/seed-nutrition-data.ts             # dry-run
 *   npx tsx scripts/seed-nutrition-data.ts --apply     # dev
 *   npx tsx scripts/seed-nutrition-data.ts --apply --confirm-prod
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const APPLY = process.argv.includes("--apply");

interface SeedItem {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  sodiumPer100g: number | null;
  satFatPer100g: number | null;
  glycemicIndex: number | null;
  defaultUnit: string | null;
  gramsPerUnit: number | null;
  source: string;
}

interface SeedFile {
  _meta: Record<string, unknown>;
  items: SeedItem[];
}

async function main() {
  assertDbTarget("seed-nutrition-data");

  // Tum seed dosyalarini yukle (batch1, batch2, ...). data/ klasorunde
  // nutrition-usda-seed*.json glob pattern; idempotent upsert sayesinde
  // ayni name iki dosyadaysa son okunan kazanir, kaynak alani guncellenir.
  const dataDir = path.resolve(process.cwd(), "data");
  const seedFiles = fs
    .readdirSync(dataDir)
    .filter((f) => /^nutrition-usda-seed.*\.json$/.test(f))
    .sort();
  const seed: SeedFile = { _meta: {}, items: [] };
  for (const file of seedFiles) {
    const part: SeedFile = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
    seed.items.push(...part.items);
    console.log("📂 " + file + " (" + part.items.length + " items)");
  }
  if (seed.items.length === 0) {
    console.error("❌ Hiç seed dosyası bulunamadı");
    process.exit(1);
  }

  console.log("📄 Source: " + seed._meta.source);
  console.log("📊 Item count: " + seed.items.length);
  console.log("⚙️  Mode: " + (APPLY ? "APPLY" : "DRY-RUN") + "\n");

  if (!APPLY) {
    console.log("Items (first 10):");
    seed.items.slice(0, 10).forEach((it, i) => {
      console.log(
        "  " +
          (i + 1) +
          ". " +
          it.name.padEnd(20) +
          " kcal=" +
          it.caloriesPer100g +
          " sugar=" +
          it.sugarPer100g +
          " fiber=" +
          it.fiberPer100g,
      );
    });
    console.log("\n💡 Apply icin --apply ekle.");
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let updated = 0;
  for (const it of seed.items) {
    const existing = await prisma.nutritionData.findUnique({
      where: { name: it.name },
    });

    const data = {
      caloriesPer100g: new Prisma.Decimal(it.caloriesPer100g),
      proteinPer100g: new Prisma.Decimal(it.proteinPer100g),
      carbsPer100g: new Prisma.Decimal(it.carbsPer100g),
      fatPer100g: new Prisma.Decimal(it.fatPer100g),
      sugarPer100g: it.sugarPer100g === null ? null : new Prisma.Decimal(it.sugarPer100g),
      fiberPer100g: it.fiberPer100g === null ? null : new Prisma.Decimal(it.fiberPer100g),
      sodiumPer100g: it.sodiumPer100g === null ? null : new Prisma.Decimal(it.sodiumPer100g),
      satFatPer100g: it.satFatPer100g === null ? null : new Prisma.Decimal(it.satFatPer100g),
      glycemicIndex: it.glycemicIndex,
      defaultUnit: it.defaultUnit,
      gramsPerUnit: it.gramsPerUnit === null ? null : new Prisma.Decimal(it.gramsPerUnit),
      source: it.source,
    };

    if (existing) {
      await prisma.nutritionData.update({ where: { name: it.name }, data });
      updated++;
    } else {
      await prisma.nutritionData.create({ data: { name: it.name, ...data } });
      created++;
    }
  }

  console.log("\n✅ Seed tamamlandi");
  console.log("  Created: " + created);
  console.log("  Updated: " + updated);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
