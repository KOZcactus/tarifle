/**
 * Mod B backfill CSV generator, batch 0-11 ilk dönem tarifleri için
 * ingredients + steps + tipNote + servingSuggestion EN/DE çevirisi üretmek
 * üzere Codex'e gidecek CSV serisi hazırlar.
 *
 * Neden ayrı script (gen-translation-csv.ts yerine):
 *   - gen-translation-csv batch marker'larına bağlı. Batch 0-11 dönemi
 *     marker'sız veya karışık (batch 0-1 marker'sız, batch 2-3 variable).
 *   - seed-recipes.ts source drift var (2286 vs prod 2320), source'tan
 *     okumak eksik satır bırakır.
 *   - Bu script DB'yi source-of-truth kabul eder. translations.en.ingredients
 *     boş olan TÜM tarifleri çeker, createdAt sıralar, 100'erlik parçalara
 *     böler.
 *
 * Format: gen-translation-csv.ts ile birebir aynı (31 kolon), böylece
 * `scripts/import-translations-b.ts` aynı pipeline ile okur.
 *
 * Çalıştırma (prod, read-only):
 *   export DATABASE_URL=$(grep '^DATABASE_URL' .env.production.local | cut -d '"' -f2)
 *   npx tsx scripts/gen-modb-backfill-csv.ts
 *
 * Dev'de:
 *   npx tsx scripts/gen-modb-backfill-csv.ts
 *
 * Çıktı: docs/translations-backfill-{01..12}.csv
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface TranslationsBlock {
  title?: string | null;
  description?: string | null;
  tipNote?: string | null;
  servingSuggestion?: string | null;
  ingredients?: unknown;
  steps?: unknown;
}

interface RecipeRow {
  slug: string;
  title: string;
  description: string;
  type: string;
  cuisine: string | null;
  difficulty: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  allergens: string[];
  tipNote: string | null;
  servingSuggestion: string | null;
  translations: { en?: TranslationsBlock; de?: TranslationsBlock } | null;
  ingredients: { name: string; amount: string; unit: string | null; sortOrder: number }[];
  steps: { stepNumber: number; instruction: string }[];
  tags: { tag: { slug: string } }[];
  createdAt: Date;
}

const BATCH_SIZE = 100;
const OUT_DIR = path.resolve(__d, "..", "docs");

function fmtIngredients(
  items: { name: string; amount: string; unit: string | null; sortOrder: number }[],
): string {
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

async function main(): Promise<void> {
  const target = process.env.DATABASE_URL ?? "";
  const host = (() => {
    try {
      return new URL(target).host;
    } catch {
      return "unknown";
    }
  })();
  console.log(`Backfill CSV generator, host: ${host}`);

  const allRecipes: RecipeRow[] = await prisma.recipe.findMany({
    select: {
      slug: true,
      title: true,
      description: true,
      type: true,
      cuisine: true,
      difficulty: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      servingCount: true,
      averageCalories: true,
      allergens: true,
      tipNote: true,
      servingSuggestion: true,
      translations: true,
      ingredients: {
        select: { name: true, amount: true, unit: true, sortOrder: true },
      },
      steps: {
        select: { stepNumber: true, instruction: true },
      },
      tags: { select: { tag: { select: { slug: true } } } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  }) as unknown as RecipeRow[];

  console.log(`Total recipes: ${allRecipes.length}`);

  // Filter: Mod B gap = translations.en.ingredients boş VEYA translations yok
  const gap = allRecipes.filter((r) => {
    const en = r.translations?.en;
    const de = r.translations?.de;
    // İkisinden biri en tam Mod B ise (ingredients+steps dolu), gap değil
    const enComplete =
      !!en?.ingredients &&
      Array.isArray(en.ingredients) &&
      en.ingredients.length > 0;
    const deComplete =
      !!de?.ingredients &&
      Array.isArray(de.ingredients) &&
      de.ingredients.length > 0;
    // Her iki lokalde de ingredients dolu ise gap yok. Tek tarafta eksik
    // olsa bile Mod B dolumu gerek.
    return !(enComplete && deComplete);
  });

  console.log(`Mod B gap count: ${gap.length}`);

  if (gap.length === 0) {
    console.log("Gap yok, hiçbir CSV üretilmedi.");
    return;
  }

  const totalChunks = Math.ceil(gap.length / BATCH_SIZE);
  // --start N flag: dosya numarasını N'den başlatır (default 1).
  // Örn. eski backfill-01 + 02 apply edildikten sonra yeni gap için
  // --start 3 verince chunkIdx 03, 04, 05 olarak yazılır, eski
  // backfill-01/02 dosyaları overwrite olmaz.
  const startIdxArg = process.argv.indexOf("--start");
  const startOffset = startIdxArg >= 0 ? parseInt(process.argv[startIdxArg + 1], 10) : 1;
  if (Number.isNaN(startOffset) || startOffset < 1) {
    console.error(`Invalid --start value: ${process.argv[startIdxArg + 1]}. Must be integer >= 1.`);
    process.exit(1);
  }
  console.log(`Will write ${totalChunks} CSV files (${BATCH_SIZE} per chunk, starting index ${String(startOffset).padStart(2, "0")}).\n`);

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

  for (let i = 0; i < totalChunks; i++) {
    const chunk = gap.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const chunkIdx = String(i + startOffset).padStart(2, "0");
    const outPath = path.join(OUT_DIR, `translations-backfill-${chunkIdx}.csv`);

    const lines: string[] = [header.join(",")];

    for (const r of chunk) {
      const en = r.translations?.en ?? {};
      const de = r.translations?.de ?? {};
      const tagsStr = r.tags.map((t) => t.tag.slug).join(",");
      const row = [
        r.slug,
        r.title,
        r.description,
        r.type,
        r.cuisine ?? "",
        r.difficulty,
        r.prepMinutes,
        r.cookMinutes,
        r.totalMinutes,
        r.servingCount,
        r.averageCalories ?? "",
        fmtIngredients(r.ingredients),
        r.ingredients.length,
        fmtSteps(r.steps),
        r.steps.length,
        r.allergens.join(","),
        tagsStr,
        r.tipNote ?? "",
        r.servingSuggestion ?? "",
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
    const firstSlug = chunk[0].slug;
    const lastSlug = chunk[chunk.length - 1].slug;
    const firstDate = chunk[0].createdAt.toISOString().slice(0, 10);
    const lastDate = chunk[chunk.length - 1].createdAt.toISOString().slice(0, 10);
    console.log(
      `✅ backfill-${chunkIdx}.csv (${chunk.length} rows) ${firstSlug} .. ${lastSlug}  [${firstDate} - ${lastDate}]`,
    );
  }

  // Özet + kullanıcı notu
  console.log(`\n📊 SUMMARY`);
  console.log(`  Total Mod B gap:    ${gap.length} recipes`);
  console.log(`  CSV files produced: ${totalChunks}`);
  console.log(`  Next step (Kerem):  Codex'e 'Mod B backfill-01' diyerek başlat.`);
  console.log(
    `  Codex format:       mevcut Mod B brief §6 (docs/CODEX_BATCH_BRIEF.md),`,
  );
  console.log(`                      ingredients_count + step_count array uzunluk kuralı.`);
  console.log(
    `  Import sonrası:     docs/translations-backfill-${"01"}.json gelince`,
  );
  console.log(
    `                      npx tsx scripts/import-translations-b.ts --file docs/translations-backfill-01.json`,
  );
  console.log(`                      (hem dev hem prod, --confirm-prod ile)`);
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
