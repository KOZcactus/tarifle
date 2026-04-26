/**
 * Mod K (Tarif Kontrol) input prep script.
 * Codex web research yapacagi 100'lu batch icin tarif full content
 * ozetini JSON olarak diske yazar (docs/mod-k-batch-N-input.json).
 *
 * Codex bu input'u okur, brief §20 kurallariyla web research yapar,
 * her tarif icin verdict (PASS / CORRECTION / MAJOR_ISSUE) ve
 * gerekirse correction onerisi yazar.
 *
 * Batch siralamasi: alfabetik slug ASC (deterministik). 35 batch,
 * 3517 tarif. Quality dashboard low-score onceligi gelecek bir
 * iyilestirme (--priority quality flag eklenebilir).
 *
 * Usage:
 *   npx tsx scripts/prepare-mod-k-input.ts --batch 1                # default size 100
 *   npx tsx scripts/prepare-mod-k-input.ts --batch 1 --size 50
 *   npx tsx scripts/prepare-mod-k-input.ts --info                   # batch sayisi + ozet
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

interface ModKInputEntry {
  slug: string;
  title: string;
  cuisine: string | null;
  type: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  isFeatured: boolean;
  tipNote: string | null;
  servingSuggestion: string | null;
  allergens: string[];
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string | null;
    group: string | null;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    timerSeconds: number | null;
  }>;
}

function parseSizeArg(): number {
  const idx = process.argv.indexOf("--size");
  if (idx === -1 || !process.argv[idx + 1]) return 100;
  const n = Number.parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : 100;
}

function parseBatchArg(): number | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  const n = Number.parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  if (!url) {
    console.error("DATABASE_URL yok");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });

  const INFO = process.argv.includes("--info");
  const SIZE = parseSizeArg();
  const BATCH = parseBatchArg();

  const total = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
  const totalBatch = Math.ceil(total / SIZE);
  console.log(`Toplam PUBLISHED tarif: ${total}`);
  console.log(`Batch boyutu: ${SIZE}`);
  console.log(`Toplam batch: ${totalBatch}`);

  if (INFO) {
    await prisma.$disconnect();
    return;
  }
  if (!BATCH) {
    console.error("--batch N bayrağı zorunlu (veya --info ile özet al)");
    await prisma.$disconnect();
    process.exit(1);
  }
  if (BATCH > totalBatch) {
    console.error(`Batch ${BATCH} > toplam ${totalBatch}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const offset = (BATCH - 1) * SIZE;
  console.log(`Batch ${BATCH}: offset ${offset}, take ${SIZE}`);
  console.log("");

  // Alfabetik slug ASC, deterministik
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      description: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      isFeatured: true,
      tipNote: true,
      servingSuggestion: true,
      allergens: true,
      ingredients: {
        select: { name: true, amount: true, unit: true, group: true },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: { stepNumber: true, instruction: true, timerSeconds: true },
        orderBy: { stepNumber: "asc" },
      },
    },
    orderBy: { slug: "asc" },
    skip: offset,
    take: SIZE,
  });

  const entries: ModKInputEntry[] = recipes.map((r) => ({
    slug: r.slug,
    title: r.title,
    cuisine: r.cuisine,
    type: r.type as string,
    description: r.description,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    totalMinutes: r.totalMinutes,
    servingCount: r.servingCount,
    averageCalories: r.averageCalories,
    isFeatured: r.isFeatured,
    tipNote: r.tipNote,
    servingSuggestion: r.servingSuggestion,
    allergens: r.allergens as string[],
    ingredients: r.ingredients.map((i) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      group: i.group,
    })),
    steps: r.steps.map((s) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      timerSeconds: s.timerSeconds,
    })),
  }));

  const outPath = path.resolve(
    process.cwd(),
    `docs/mod-k-batch-${BATCH}-input.json`,
  );
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Yazildi: ${outPath}`);
  console.log(`Entry sayisi: ${entries.length}`);
  console.log("");
  console.log("Codex tetik:");
  console.log(`  Mod K. Batch ${BATCH}.`);
  console.log("");
  console.log(
    `Codex teslim sonrasi: npx tsx scripts/verify-mod-k-batch.ts --batch ${BATCH}`,
  );

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
