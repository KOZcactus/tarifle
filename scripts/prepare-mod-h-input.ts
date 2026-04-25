/**
 * Mod H batch input zenginleştirme scripti.
 *
 * docs/mod-h-ingredient-list.txt'den N ingredient alır, her biri için
 * sample tarif slug'larını DB'den teyit eder + tipik tarif tipi dağılımı
 * (YEMEK / TATLI / KAHVALTI / vb.) çıkarır + benzer ingredient için
 * NutritionData kayıtlı mı kontrol eder. Codex'e zenginleştirilmiş JSON
 * üretir.
 *
 * Codex bu JSON'u alır + brief §18 disiplini ile her ingredient için
 * whyUsed (8-40 kelime, tarif tipi referanslı) + substitutes (2-4
 * alternatif) + opsiyonel notes yazar. Tarif tipi dağılımı whyUsed'a
 * doğru context vermek için kritik.
 *
 * Usage:
 *   npx tsx scripts/prepare-mod-h-input.ts --batch 1 --size 50
 *   # docs/mod-h-batch-1-input.json üretir
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

interface IngredientRow {
  rank: number;
  freq: number;
  name: string;
  sampleSlugs: string[];
}

interface EnrichedIngredient {
  rank: number;
  freq: number;
  name: string;
  sampleRecipes: { slug: string; title: string; type: string }[];
  typeDistribution: Record<string, number>;
  hasNutritionData: boolean;
}

function parseArgs(): { batch: number; size: number; offset: number } {
  const args = process.argv.slice(2);
  const get = (k: string, def: string): string => {
    const eq = args.find((a) => a.startsWith(`${k}=`));
    if (eq) return eq.slice(k.length + 1);
    const idx = args.indexOf(k);
    if (idx >= 0 && args[idx + 1]) return args[idx + 1];
    return def;
  };
  return {
    batch: Number(get("--batch", "1")),
    size: Number(get("--size", "50")),
    offset: Number(get("--offset", "0")),
  };
}

function readIngredientFile(): IngredientRow[] {
  const file = path.resolve(process.cwd(), "docs/mod-h-ingredient-list.txt");
  const lines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.startsWith("#"));
  return lines.map((line) => {
    const [rank, freq, name, sampleSlugsCsv] = line.split("\t");
    return {
      rank: Number(rank),
      freq: Number(freq),
      name: name?.trim() ?? "",
      sampleSlugs: (sampleSlugsCsv ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  });
}

async function main(): Promise<void> {
  const { batch, size, offset } = parseArgs();
  const allRows = readIngredientFile();
  const slice = allRows.slice(offset, offset + size);
  console.log(
    `📄 ${allRows.length} ingredient satırı okundu, ${slice.length} ingredient işlenecek.`,
  );

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const enriched: EnrichedIngredient[] = [];

  for (const row of slice) {
    const sampleRecipes = await prisma.recipe.findMany({
      where: { slug: { in: row.sampleSlugs } },
      select: { slug: true, title: true, type: true },
    });

    const ingredientRows = await prisma.recipeIngredient.findMany({
      where: { name: { contains: row.name, mode: "insensitive" } },
      select: { recipe: { select: { type: true } } },
      take: 80,
    });
    const typeDistribution: Record<string, number> = {};
    for (const ir of ingredientRows) {
      const t = ir.recipe.type;
      typeDistribution[t] = (typeDistribution[t] ?? 0) + 1;
    }

    const nutrition = await prisma.nutritionData.findFirst({
      where: { name: { equals: row.name, mode: "insensitive" } },
      select: { id: true },
    });

    enriched.push({
      rank: row.rank,
      freq: row.freq,
      name: row.name,
      sampleRecipes,
      typeDistribution,
      hasNutritionData: !!nutrition,
    });
  }

  const outFile = path.resolve(
    process.cwd(),
    `docs/mod-h-batch-${batch}-input.json`,
  );
  fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2) + "\n");

  console.log(`\n✅ ${outFile} yazıldı.`);
  console.log(`   ${enriched.length} ingredient zenginleştirildi.`);
  const withNutrition = enriched.filter((e) => e.hasNutritionData).length;
  console.log(`   NutritionData eşleşen: ${withNutrition} / ${enriched.length}`);

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
