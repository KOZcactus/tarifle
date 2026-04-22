/**
 * Mod D apply: Codex'in `docs/editorial-revisions-batch-N.json` teslimini
 * Recipe.tipNote + Recipe.servingSuggestion kolonlarına idempotent partial
 * update olarak uygular.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §13. JSON şeması:
 *   [{ slug: string, tipNote?: string, servingSuggestion?: string }, ...]
 *
 * Item'da yalnızca degisiklik onerilen alan bulunur (undefined = dokunma).
 *
 * Behaviour:
 *   - --apply yoksa dry-run (yalnızca validate + rapor).
 *   - Slug DB'de yoksa SKIP + warning (CRITICAL değil; tarih farkı +
 *     duplicate merge sonrası slug yok olabilir).
 *   - Mevcut değer JSON ile aynıysa unchanged (no-op update yine atılır,
 *     ama not edilir).
 *   - Em-dash (—), kelime 8-20 disi içerikler CRITICAL → apply iptal
 *     (--force ile bypass).
 *
 * Usage:
 *   # Dry-run (default)
 *   npx tsx scripts/apply-editorial-revisions.ts --batch 1
 *
 *   # Dev apply
 *   npx tsx scripts/apply-editorial-revisions.ts --batch 1 --apply
 *
 *   # Prod apply (explicit)
 *   $env:DATABASE_URL=...  # prod URL
 *   npx tsx scripts/apply-editorial-revisions.ts --batch 1 --apply --confirm-prod
 *
 *   # Custom dosya
 *   npx tsx scripts/apply-editorial-revisions.ts --file docs/custom.json --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

const MIN_WORDS = 8;
const MAX_WORDS = 20;

function parseBatchArg(): string | null {
  const eq = process.argv.find((a) => a.startsWith("--batch="));
  if (eq) return eq.split("=")[1] ?? null;
  const idx = process.argv.indexOf("--batch");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return null;
}

function parseFileArg(): string | null {
  const eq = process.argv.find((a) => a.startsWith("--file="));
  if (eq) return eq.split("=")[1] ?? null;
  const idx = process.argv.indexOf("--file");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return null;
}

function resolveJsonPath(): string {
  const file = parseFileArg();
  if (file) return path.resolve(process.cwd(), file);
  const batch = parseBatchArg();
  if (!batch) {
    console.error("Missing --batch N veya --file <path>.");
    process.exit(1);
  }
  return path.resolve(process.cwd(), `docs/editorial-revisions-batch-${batch}.json`);
}

const itemSchema = z
  .object({
    slug: z.string().min(1).max(200),
    tipNote: z.string().min(1).optional(),
    servingSuggestion: z.string().min(1).optional(),
  })
  .refine((v) => v.tipNote !== undefined || v.servingSuggestion !== undefined, {
    message: "Item'da en az bir alan gerekli (tipNote veya servingSuggestion)",
  });

const fileSchema = z.array(itemSchema);

type Item = z.infer<typeof itemSchema>;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function validateItem(item: Item, idx: number): string[] {
  const errors: string[] = [];
  for (const field of ["tipNote", "servingSuggestion"] as const) {
    const value = item[field];
    if (value === undefined) continue;
    if (value.includes("\u2014")) {
      errors.push(`#${idx} [${item.slug}] ${field}: em-dash (\u2014) yasak`);
    }
    if (value.includes("\u2013")) {
      errors.push(`#${idx} [${item.slug}] ${field}: en-dash (\u2013) yasak`);
    }
    const wc = wordCount(value);
    if (wc < MIN_WORDS || wc > MAX_WORDS) {
      errors.push(
        `#${idx} [${item.slug}] ${field}: kelime ${wc} (beklenen ${MIN_WORDS}-${MAX_WORDS})`,
      );
    }
  }
  return errors;
}

async function main() {
  const target = assertDbTarget("apply-editorial-revisions");
  const jsonPath = resolveJsonPath();

  if (!fs.existsSync(jsonPath)) {
    console.error(`HATA: dosya yok: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`📄 Read: ${jsonPath}`);
  console.log(`🎯 Target: ${target.branch} (${target.host})`);
  console.log(`⚙️  Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("HATA: JSON şema uyumsuz:");
    console.error(parsed.error.issues.slice(0, 10).map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
    process.exit(1);
  }
  const items = parsed.data;

  // Slug uniqueness
  const slugSet = new Set<string>();
  for (const it of items) {
    if (slugSet.has(it.slug)) {
      console.error(`HATA: duplicate slug ${it.slug}`);
      process.exit(1);
    }
    slugSet.add(it.slug);
  }

  // Per-item validation
  const validationErrors: string[] = [];
  items.forEach((it, idx) => {
    validationErrors.push(...validateItem(it, idx));
  });
  if (validationErrors.length > 0) {
    console.error(`\n❌ ${validationErrors.length} CRITICAL bulundu:`);
    validationErrors.slice(0, 20).forEach((e) => console.error(`  ${e}`));
    if (!FORCE) {
      console.error("\nBypass için --force ekle.");
      process.exit(1);
    }
    console.warn("\n⚠️  --force ile devam, hatalar görmezden geliniyor.");
  }
  console.log(`✅ Şema + format validation: ${items.length} item temiz`);

  // DB lookup, mevcut değerleri çek
  const existing = await prisma.recipe.findMany({
    where: { slug: { in: items.map((i) => i.slug) } },
    select: { slug: true, tipNote: true, servingSuggestion: true },
  });
  const existingMap = new Map(existing.map((e) => [e.slug, e]));

  const missing = items.filter((i) => !existingMap.has(i.slug));
  if (missing.length > 0) {
    console.warn(`\n⚠️  ${missing.length} slug DB'de yok (skip, kaldırılmış olabilir):`);
    missing.slice(0, 10).forEach((m) => console.warn(`  - ${m.slug}`));
  }

  // Apply / report
  let updatedTip = 0;
  let updatedServ = 0;
  let unchangedTip = 0;
  let unchangedServ = 0;
  let updatedRecipes = 0;

  for (const item of items) {
    const current = existingMap.get(item.slug);
    if (!current) continue;

    const data: { tipNote?: string; servingSuggestion?: string } = {};

    if (item.tipNote !== undefined) {
      if (current.tipNote === item.tipNote) {
        unchangedTip += 1;
      } else {
        data.tipNote = item.tipNote;
      }
    }
    if (item.servingSuggestion !== undefined) {
      if (current.servingSuggestion === item.servingSuggestion) {
        unchangedServ += 1;
      } else {
        data.servingSuggestion = item.servingSuggestion;
      }
    }

    if (Object.keys(data).length === 0) continue;

    if (data.tipNote !== undefined) updatedTip += 1;
    if (data.servingSuggestion !== undefined) updatedServ += 1;
    updatedRecipes += 1;

    if (APPLY) {
      await prisma.recipe.update({
        where: { slug: item.slug },
        data,
      });
    }
  }

  console.log(`\n📊 Sonuç:`);
  console.log(`  Toplam item:           ${items.length}`);
  console.log(`  DB'de bulunan:         ${items.length - missing.length}`);
  console.log(`  Skip (slug yok):       ${missing.length}`);
  console.log(`  ${APPLY ? "Update edilen tarif:" : "Update edilecek tarif:"}   ${updatedRecipes}`);
  console.log(`    → tipNote ${APPLY ? "değişti" : "değişecek"}:    ${updatedTip}`);
  console.log(`    → servingSuggestion ${APPLY ? "değişti" : "değişecek"}: ${updatedServ}`);
  console.log(`  Aynı kalan tipNote:    ${unchangedTip}`);
  console.log(`  Aynı kalan serv:       ${unchangedServ}`);

  if (!APPLY) {
    console.log(`\n💡 Apply için --apply ekle.`);
  } else {
    console.log(`\n✅ Apply tamamlandı.`);
  }
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
