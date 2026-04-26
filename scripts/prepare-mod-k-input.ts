/**
 * Mod K (Tarif Kontrol) input prep script.
 * Codex web research yapacagi 50'li sub-batch icin tarif full content
 * ozetini (macro nutrition + amount + tags + allergens dahil) JSON
 * olarak diske yazar (docs/mod-k-batch-Nx-input.json, Nx="1a","1b"...).
 *
 * Sub-batch naming Mod A pattern paralel: her ana batch (1, 2, ...)
 * 50 + 50 = 100 tarif olarak iki yarımya bolunur. "1a" = ilk 50,
 * "1b" = sonraki 50. Toplam 36 ana batch × 2 = 71 sub-batch (son 1
 * yarım).
 *
 * Codex bu input'u okur, brief §20 kurallariyla web research yapar,
 * her tarif icin verdict (PASS / CORRECTION / MAJOR_ISSUE) ve
 * gerekirse correction onerisi yazar.
 *
 * Usage:
 *   npx tsx scripts/prepare-mod-k-input.ts --batch 1a               # ilk 50
 *   npx tsx scripts/prepare-mod-k-input.ts --batch 1b               # sonraki 50
 *   npx tsx scripts/prepare-mod-k-input.ts --batch 2a               # 101-150
 *   npx tsx scripts/prepare-mod-k-input.ts --info                   # toplam ozet
 *
 * SIZE sabit 50 (brief §20.2 dersi: 100 fazla, 50 odaklı kalır).
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
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isFeatured: boolean;
  tipNote: string | null;
  servingSuggestion: string | null;
  tags: string[];
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

const SIZE = 50; // brief §20.2 sabit (oturum 24 dersi)

// Sub-batch parser: "1a" -> { batch: 1, half: "a" }, "12b" -> { batch: 12, half: "b" }
function parseBatchArg(): { batch: number; half: "a" | "b" } | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  const raw = process.argv[idx + 1].toLowerCase().trim();
  const m = raw.match(/^(\d+)([ab])$/);
  if (!m) return null;
  return { batch: Number.parseInt(m[1], 10), half: m[2] as "a" | "b" };
}

async function fetchBatchEntries(
  prisma: PrismaClient,
  offset: number,
  size: number,
): Promise<ModKInputEntry[]> {
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
      protein: true,
      carbs: true,
      fat: true,
      isFeatured: true,
      tipNote: true,
      servingSuggestion: true,
      tags: { select: { tag: { select: { slug: true } } } },
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
    take: size,
  });

  return recipes.map((r) => ({
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
    protein: r.protein === null ? null : Number(r.protein),
    carbs: r.carbs === null ? null : Number(r.carbs),
    fat: r.fat === null ? null : Number(r.fat),
    isFeatured: r.isFeatured,
    tipNote: r.tipNote,
    servingSuggestion: r.servingSuggestion,
    tags: r.tags.map((t) => t.tag.slug),
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
  const ALL = process.argv.includes("--all");
  const SKIP_EXISTING = process.argv.includes("--skip-existing");
  const parsed = parseBatchArg();

  const total = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
  const totalSubBatch = Math.ceil(total / SIZE);
  const totalMainBatch = Math.ceil(totalSubBatch / 2);
  console.log(`Toplam PUBLISHED tarif: ${total}`);
  console.log(`Sub-batch boyutu: ${SIZE}`);
  console.log(`Toplam sub-batch: ${totalSubBatch} (1a-${totalMainBatch}b)`);
  console.log(`Ana batch sayisi: ${totalMainBatch}`);

  if (INFO) {
    await prisma.$disconnect();
    return;
  }

  if (ALL) {
    // Tum sub-batch'leri tek PrismaClient ile uret. Mevcut --skip-existing
    // ile zaten olan dosyalari atla (rerun maliyeti dusuk).
    console.log("");
    console.log(`--all modu: ${totalSubBatch} sub-batch icin input uretiliyor`);
    if (SKIP_EXISTING) console.log("--skip-existing: mevcut dosyalar atlanir");
    console.log("");
    let written = 0;
    let skipped = 0;
    for (let idx = 1; idx <= totalSubBatch; idx++) {
      const mainBatch = Math.ceil(idx / 2);
      const halfChar = idx % 2 === 1 ? "a" : "b";
      const batchKey = `${mainBatch}${halfChar}`;
      const outPath = path.resolve(
        process.cwd(),
        `docs/mod-k-batch-${batchKey}-input.json`,
      );
      if (SKIP_EXISTING && fs.existsSync(outPath)) {
        console.log(`SKIP ${batchKey} (zaten var)`);
        skipped++;
        continue;
      }
      const offset = (idx - 1) * SIZE;
      const entries = await fetchBatchEntries(prisma, offset, SIZE);
      fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), "utf-8");
      console.log(
        `OK ${batchKey} (${entries.length} entry: ${entries[0]?.slug} ... ${entries[entries.length - 1]?.slug})`,
      );
      written++;
    }
    console.log("");
    console.log(`Summary: ${written} written, ${skipped} skipped`);
    await prisma.$disconnect();
    return;
  }

  if (!parsed) {
    console.error("--batch Nx bayrağı zorunlu (örn: --batch 1a, --batch 2b)");
    console.error("Veya --info, --all ile toplu üretim");
    await prisma.$disconnect();
    process.exit(1);
  }

  const { batch, half } = parsed;
  // 1a -> sub-batch index 1, 1b -> 2, 2a -> 3, 2b -> 4
  const subBatchIndex = (batch - 1) * 2 + (half === "a" ? 1 : 2);
  if (subBatchIndex > totalSubBatch) {
    console.error(`Sub-batch ${batch}${half} > toplam ${totalSubBatch}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const offset = (subBatchIndex - 1) * SIZE;
  console.log(`Sub-batch ${batch}${half}: index ${subBatchIndex}, offset ${offset}, take ${SIZE}`);
  console.log("");

  const entries = await fetchBatchEntries(prisma, offset, SIZE);

  const batchKey = `${batch}${half}`;
  const outPath = path.resolve(
    process.cwd(),
    `docs/mod-k-batch-${batchKey}-input.json`,
  );
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), "utf-8");
  console.log(`Yazildi: ${outPath}`);
  console.log(`Entry sayisi: ${entries.length}`);
  console.log(`Slug aralik: ${entries[0]?.slug} ... ${entries[entries.length - 1]?.slug}`);
  console.log("");
  console.log("Codex tetik:");
  console.log(`  Mod K. Batch ${batchKey}.`);
  console.log("");
  console.log(
    `Codex teslim sonrasi: npx tsx scripts/verify-mod-k-batch.ts --batch ${batchKey}`,
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
