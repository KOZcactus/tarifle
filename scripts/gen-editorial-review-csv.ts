/**
 * Generate `docs/editorial-review-batch-<N>.csv` for Codex Mod D
 * (top viewCount tariflerin tipNote + servingSuggestion editoryal revize).
 *
 * Codex Mod D, mevcut tariflerin metin alanlarındaki drift/generic/bağlam-dışı
 * ifadeleri temizler. Yeni tarif eklemez. Bu script Codex'in okuyacağı CSV'yi
 * üretir; Codex JSON döner; Claude DB'ye uygular.
 *
 * Kaynak: PUBLISHED tarifler arasından viewCount desc top N (default 200),
 * 100'er batch'e bölünür. `--batch 1` ilk 100, `--batch 2` 101-200.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §13. CSV kolonları orada sabitlendi.
 *
 * Usage:
 *   npx tsx scripts/gen-editorial-review-csv.ts --batch 1
 *   npx tsx scripts/gen-editorial-review-csv.ts --batch 2 --top 200
 *   npx tsx scripts/gen-editorial-review-csv.ts --batch 1 --out docs/custom.csv
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BATCH_SIZE = 100;
const DEFAULT_TOP = 200;

function parseIntArg(flag: string, fallback: number | null = null): number {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || !process.argv[idx + 1]) {
    if (fallback !== null) return fallback;
    throw new Error(`${flag} N zorunlu`);
  }
  const n = Number(process.argv[idx + 1]);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`geçersiz ${flag}: ${process.argv[idx + 1]}`);
  }
  return n;
}

function parseStringArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]!;
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtIngredients(items: { name: string; amount: string; unit: string | null; sortOrder: number }[]): string {
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => `${i.name} ${i.amount} ${i.unit ?? ""}`.replace(/\s+/g, " ").trim())
    .join(" | ");
}

function fmtSteps(items: { stepNumber: number; instruction: string }[]): string {
  return items
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((s, idx) => `${idx + 1}. ${s.instruction}`)
    .join(" || ");
}

async function main() {
  const batch = parseIntArg("--batch");
  const top = parseIntArg("--top", DEFAULT_TOP);
  const outOverride = parseStringArg("--out");
  const outPath =
    outOverride ?? path.resolve(process.cwd(), `docs/editorial-review-batch-${batch}.csv`);

  const totalBatches = Math.ceil(top / BATCH_SIZE);
  if (batch > totalBatches) {
    throw new Error(`batch ${batch} > totalBatches ${totalBatches} (top=${top})`);
  }

  const skip = (batch - 1) * BATCH_SIZE;
  const take = BATCH_SIZE;

  console.log(`📥 batch ${batch}/${totalBatches}: top ${top} viewCount, slice ${skip}..${skip + take}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ viewCount: "desc" }, { slug: "asc" }],
    take,
    skip,
    select: {
      slug: true,
      title: true,
      type: true,
      cuisine: true,
      viewCount: true,
      tipNote: true,
      servingSuggestion: true,
      category: { select: { slug: true, name: true } },
      ingredients: {
        select: { name: true, amount: true, unit: true, sortOrder: true },
      },
      steps: {
        select: { stepNumber: true, instruction: true },
      },
    },
  });

  if (recipes.length === 0) {
    throw new Error(`batch ${batch} boş döndü (DB'de yeterli PUBLISHED tarif yok)`);
  }

  const header = [
    "slug",
    "title",
    "category",
    "type",
    "cuisine",
    "viewCount",
    "ingredients_tr",
    "steps_tr",
    "tipNote_current",
    "servingSuggestion_current",
  ];

  const lines: string[] = [header.join(",")];

  for (const r of recipes) {
    const row = [
      r.slug,
      r.title,
      r.category?.slug ?? "",
      r.type,
      r.cuisine ?? "",
      r.viewCount,
      fmtIngredients(r.ingredients),
      fmtSteps(r.steps),
      r.tipNote ?? "",
      r.servingSuggestion ?? "",
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`✅ wrote ${outPath} (${recipes.length} rows)`);
  console.log(`   Codex'e komut: "Mod D. Batch ${batch}."`);
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
