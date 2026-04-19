/**
 * Generate `docs/translations-batch-<N>.csv` from seed source + DB.
 *
 * Codex Mod B tarafı bu CSV'yi okuyup JSON çevirisi üretir. Önceki
 * akışta (batch 12-20) Codex Mod A seed ile beraber CSV de düşürüyordu;
 * batch 21+ sadece seed düşüyor, CSV burada üretilir.
 *
 * Kaynak:
 *   - seed-recipes.ts `recipes` export'u → TR title/description/
 *     ingredients/steps/tipNote/servingSuggestion + meta.
 *   - DB (dev veya prod) → Recipe.translations JSONB'den mevcut EN/DE
 *     çevirilerini (Mod A'dan gelmiş title+description) çek.
 *
 * Batch numarası seed sonundan geriye hesaplanır:
 *   - batch N → recipes.slice(-100 * (LAST - N + 1), -100 * (LAST - N))
 *   - Marker'lardan LAST otomatik bulunur.
 *
 * Usage:
 *   npx tsx scripts/gen-translation-csv.ts --batch 21
 *   npx tsx scripts/gen-translation-csv.ts --batch 21 --out docs/custom.csv
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { recipes } from "./seed-recipes";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseBatchArg(): number {
  const idx = process.argv.indexOf("--batch");
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error("--batch N zorunlu");
  }
  const n = Number(process.argv[idx + 1]);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`geçersiz batch: ${process.argv[idx + 1]}`);
  }
  return n;
}

function parseOutArg(batch: number): string {
  const idx = process.argv.indexOf("--out");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return path.resolve(process.cwd(), `docs/translations-batch-${batch}.csv`);
}

function findBatchBoundsFromSource(batch: number): { start: number; end: number } {
  // seed-recipes.ts satırında "// ── BATCH N ──" markerlarını say,
  // belirtilen N'in öncesindeki marker'dan sonraki 100 tarif alınır.
  const sourcePath = path.resolve(__d, "seed-recipes.ts");
  const text = fs.readFileSync(sourcePath, "utf8");
  const markerRe = /\/\/ ── BATCH (\d+) ──/g;
  const markers: { batch: number; pos: number }[] = [];
  for (const m of text.matchAll(markerRe)) {
    markers.push({ batch: Number(m[1]), pos: m.index ?? 0 });
  }
  markers.sort((a, b) => a.batch - b.batch);

  // seed-recipes.ts'deki ilk batch (marker'sız olanlar = batch 0) + sonra
  // marker'lı batch'ler. recipes array tam akış sırasıdır:
  // indeks 0..(count of batch<=N)*100 aralığında N'inci batch.
  const lastMarker = markers[markers.length - 1]?.batch ?? 0;
  if (batch > lastMarker) {
    throw new Error(`batch ${batch} seed'de yok (son batch: ${lastMarker})`);
  }

  // Marker'lar batch 2'den başlıyor (batch 0 ve 1 marker'sız). Yani
  // marker sayısı = seed'de olduğu kadar. Son batch marker'ı ile
  // recipes length arası 100 olmalı (1 batch = 100).
  const fromEndBatches = lastMarker - batch; // 0 = son batch, 1 = sondan ikinci
  const end = recipes.length - fromEndBatches * 100;
  const start = end - 100;
  if (start < 0) {
    throw new Error(
      `hesap hata: start=${start} (recipes.length=${recipes.length}, fromEndBatches=${fromEndBatches})`,
    );
  }
  return { start, end };
}

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  sortOrder: number;
}
interface Step {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number | null;
}

type TranslationsBlock = {
  title?: string | null;
  description?: string | null;
  tipNote?: string | null;
  servingSuggestion?: string | null;
  ingredients?: unknown;
  steps?: unknown;
};

function fmtIngredients(items: Ingredient[]): string {
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => `${i.name} ${i.amount} ${i.unit}`.replace(/\s+/g, " ").trim())
    .join(" | ");
}

function fmtSteps(items: Step[]): string {
  return items
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((s, idx) => `${idx + 1}. ${s.instruction}`)
    .join(" || ");
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function presentFlag(raw: unknown): number {
  if (!raw) return 0;
  if (Array.isArray(raw)) return raw.length > 0 ? 1 : 0;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return Object.keys(obj).length > 0 ? 1 : 0;
  }
  return 0;
}

async function main() {
  const batch = parseBatchArg();
  const outPath = parseOutArg(batch);
  const { start, end } = findBatchBoundsFromSource(batch);
  const slice = recipes.slice(start, end);
  console.log(
    `📥 batch ${batch}: seed source slice ${start}..${end} (${slice.length} tarif)`,
  );

  const dbRows = await prisma.recipe.findMany({
    where: { slug: { in: slice.map((r) => r.slug) } },
    select: { slug: true, translations: true },
  });
  const dbMap = new Map(dbRows.map((r) => [r.slug, r.translations]));

  const header = [
    "slug",
    "title_tr",
    "description_tr",
    "type",
    "cuisine",
    "difficulty",
    "prep_minutes",
    "cook_minutes",
    "total_minutes",
    "serving_count",
    "average_calories",
    "ingredients_tr",
    "ingredient_count",
    "steps_tr",
    "step_count",
    "allergens",
    "tags",
    "tipNote_tr",
    "servingSuggestion_tr",
    "en_title_current",
    "en_description_current",
    "en_tipNote_current",
    "en_servingSuggestion_current",
    "en_ingredients_present",
    "en_steps_present",
    "de_title_current",
    "de_description_current",
    "de_tipNote_current",
    "de_servingSuggestion_current",
    "de_ingredients_present",
    "de_steps_present",
  ];

  const lines: string[] = [header.join(",")];

  for (const recipe of slice) {
    const translations = dbMap.get(recipe.slug) as
      | { en?: TranslationsBlock; de?: TranslationsBlock }
      | null
      | undefined;
    const en = translations?.en ?? {};
    const de = translations?.de ?? {};

    const row = [
      recipe.slug,
      recipe.title,
      recipe.description,
      recipe.type,
      recipe.cuisine ?? "",
      recipe.difficulty,
      recipe.prepMinutes,
      recipe.cookMinutes,
      recipe.totalMinutes,
      recipe.servingCount,
      recipe.averageCalories ?? "",
      fmtIngredients(recipe.ingredients as Ingredient[]),
      recipe.ingredients.length,
      fmtSteps(recipe.steps as Step[]),
      recipe.steps.length,
      (recipe.allergens ?? []).join(","),
      (recipe.tags ?? []).join(","),
      recipe.tipNote ?? "",
      recipe.servingSuggestion ?? "",
      en.title ?? "",
      en.description ?? "",
      en.tipNote ?? "",
      en.servingSuggestion ?? "",
      presentFlag(en.ingredients),
      presentFlag(en.steps),
      de.title ?? "",
      de.description ?? "",
      de.tipNote ?? "",
      de.servingSuggestion ?? "",
      presentFlag(de.ingredients),
      presentFlag(de.steps),
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.log(`✅ wrote ${outPath} (${slice.length} rows)`);
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
