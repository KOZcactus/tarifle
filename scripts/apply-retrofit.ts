/**
 * Mod F Retrofit apply: Codex'in `docs/retrofit-step-count-NN.json`
 * teslimini Recipe.steps tablosuna atomic update olarak uygular.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §15. JSON semasi:
 *   [{
 *     slug: string,
 *     type: "YEMEK"|"CORBA"|...,
 *     originalStepCount: number,
 *     newSteps: [{ stepNumber, instruction, timerSeconds? }],
 *     notes?: string
 *   }]
 *
 * **Davranis:**
 *   - Atomic transaction: eski RecipeStep rows silinir, yenileri create
 *   - Ingredient DOKUNULMAZ (Mod F sadece steps)
 *   - Type-bazli min/max step kontrolu (brief §15.5)
 *   - Em-dash/en-dash yasak
 *   - Slug DB'de yoksa skip + warning
 *
 * Usage:
 *   npx tsx scripts/apply-retrofit.ts --batch 1           # dry-run
 *   npx tsx scripts/apply-retrofit.ts --batch 1 --apply   # dev
 *   npx tsx scripts/apply-retrofit.ts --batch 1 --apply --confirm-prod   # prod
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

// Brief §15.5 (type bazli min/max)
const MIN_BY_TYPE: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  APERATIF: 4,
  ATISTIRMALIK: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  SOS: 3,
};
const MAX_BY_TYPE: Record<string, number> = {
  YEMEK: 10,
  CORBA: 10,
  SALATA: 8,
  TATLI: 10,
  KAHVALTI: 8,
  APERATIF: 8,
  ATISTIRMALIK: 8,
  KOKTEYL: 6,
  ICECEK: 6,
  SOS: 6,
};

const MIN_STEP_WORDS = 3;
const MAX_STEP_WORDS = 40; // Mod F step'leri daha detayli, §15.7 5-40 kelime

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
  const nn = batch.padStart(2, "0");
  return path.resolve(process.cwd(), `docs/retrofit-step-count-${nn}.json`);
}

const stepItemSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1),
  timerSeconds: z.number().int().nonnegative().nullable().optional(),
});

const recipeTypeSchema = z.enum([
  "YEMEK",
  "CORBA",
  "SALATA",
  "TATLI",
  "KAHVALTI",
  "APERATIF",
  "ATISTIRMALIK",
  "KOKTEYL",
  "ICECEK",
  "SOS",
]);

const itemSchema = z.object({
  slug: z.string().min(1).max(200),
  type: recipeTypeSchema,
  originalStepCount: z.number().int().positive(),
  newSteps: z.array(stepItemSchema).min(3).max(10),
  notes: z.string().optional(),
});

const fileSchema = z.array(itemSchema);

type Item = z.infer<typeof itemSchema>;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function validateItem(item: Item, idx: number): string[] {
  const errors: string[] = [];
  const min = MIN_BY_TYPE[item.type] ?? 5;
  const max = MAX_BY_TYPE[item.type] ?? 10;
  const n = item.newSteps.length;
  if (n < min) {
    errors.push(`#${idx} [${item.slug}] UNDER ${item.type}: ${n} < min ${min}`);
  }
  if (n > max) {
    errors.push(`#${idx} [${item.slug}] OVER ${item.type}: ${n} > max ${max}`);
  }
  for (let i = 0; i < item.newSteps.length; i++) {
    const s = item.newSteps[i]!;
    if (s.stepNumber !== i + 1) {
      errors.push(`#${idx} [${item.slug}] stepNumber sirasi bozuk (#${i} stepNumber=${s.stepNumber}, beklenen ${i + 1})`);
    }
    if (s.instruction.includes("\u2014")) {
      errors.push(`#${idx} [${item.slug}] step ${s.stepNumber}: em-dash yasak`);
    }
    if (s.instruction.includes("\u2013")) {
      errors.push(`#${idx} [${item.slug}] step ${s.stepNumber}: en-dash yasak`);
    }
    const wc = wordCount(s.instruction);
    if (wc < MIN_STEP_WORDS || wc > MAX_STEP_WORDS) {
      errors.push(`#${idx} [${item.slug}] step ${s.stepNumber}: kelime ${wc} (${MIN_STEP_WORDS}-${MAX_STEP_WORDS} arasi)`);
    }
    // Zayif step pattern
    const trimmed = s.instruction.trim().toLowerCase().replace(/\.$/, "");
    if (["pişirin", "hazırlayın", "karıştırın", "servis edin"].includes(trimmed)) {
      errors.push(`#${idx} [${item.slug}] step ${s.stepNumber}: zayif step "${s.instruction}" (detay ekle)`);
    }
  }
  return errors;
}

async function main(): Promise<void> {
  const target = assertDbTarget("apply-retrofit");
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
    console.error("HATA: JSON sema uyumsuz:");
    console.error(parsed.error.issues.slice(0, 15).map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
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
  items.forEach((it, idx) => validationErrors.push(...validateItem(it, idx)));
  if (validationErrors.length > 0) {
    console.error(`\n❌ ${validationErrors.length} CRITICAL bulundu:`);
    validationErrors.slice(0, 25).forEach((e) => console.error(`  ${e}`));
    if (!FORCE) {
      console.error("\nBypass icin --force ekle.");
      process.exit(1);
    }
    console.warn("\n⚠️  --force ile devam, hatalar gormezden geliniyor.");
  }
  console.log(`✅ Sema + format validation: ${items.length} item temiz`);

  // DB lookup: slug + type cross-check
  const existing = await prisma.recipe.findMany({
    where: { slug: { in: items.map((i) => i.slug) } },
    select: { id: true, slug: true, type: true, steps: { select: { id: true } } },
  });
  const existingMap = new Map(existing.map((e) => [e.slug, e]));

  const missing = items.filter((i) => !existingMap.has(i.slug));
  if (missing.length > 0) {
    console.warn(`\n⚠️  ${missing.length} slug DB'de yok (skip):`);
    missing.slice(0, 10).forEach((m) => console.warn(`  - ${m.slug}`));
  }

  const typeMismatch = items.filter((i) => {
    const db = existingMap.get(i.slug);
    return db && db.type !== i.type;
  });
  if (typeMismatch.length > 0) {
    console.error(`\n❌ ${typeMismatch.length} type mismatch (JSON vs DB):`);
    typeMismatch.slice(0, 10).forEach((t) => {
      const db = existingMap.get(t.slug)!;
      console.error(`  - ${t.slug}: JSON=${t.type} DB=${db.type}`);
    });
    if (!FORCE) {
      console.error("\nBypass icin --force ekle.");
      process.exit(1);
    }
  }

  let updated = 0;
  let totalStepsWritten = 0;
  const typeDist: Record<string, number> = {};

  for (const item of items) {
    const db = existingMap.get(item.slug);
    if (!db) continue;

    if (APPLY) {
      await prisma.$transaction([
        prisma.recipeStep.deleteMany({ where: { recipeId: db.id } }),
        prisma.recipeStep.createMany({
          data: item.newSteps.map((s) => ({
            recipeId: db.id,
            stepNumber: s.stepNumber,
            instruction: s.instruction,
            timerSeconds: s.timerSeconds ?? null,
          })),
        }),
      ]);
    }
    updated += 1;
    totalStepsWritten += item.newSteps.length;
    typeDist[item.type] = (typeDist[item.type] ?? 0) + 1;
  }

  console.log(`\n📊 Sonuc:`);
  console.log(`  Toplam item:                      ${items.length}`);
  console.log(`  DB'de bulunan:                    ${items.length - missing.length}`);
  console.log(`  Skip (slug yok):                  ${missing.length}`);
  console.log(`  Type mismatch:                    ${typeMismatch.length}`);
  console.log(`  ${APPLY ? "Update edilen tarif:" : "Update edilecek tarif:"}              ${updated}`);
  console.log(`  Toplam step ${APPLY ? "yazilan" : "yazilacak"}:             ${totalStepsWritten}`);
  console.log(`  Ortalama step / tarif:            ${(totalStepsWritten / Math.max(updated, 1)).toFixed(1)}`);
  console.log(`  Type dagilim:                     ${JSON.stringify(typeDist)}`);

  if (!APPLY) {
    console.log(`\n💡 Apply icin --apply ekle.`);
  } else {
    console.log(`\n✅ Apply tamamlandi.`);
    console.log(`   NOT: Cache invalidate icin admin revalidate endpoint cagir`);
    console.log(`        (veya deploy bekle, unstable_cache TTL 30 dk).`);
  }
}

main()
  .catch((err: unknown) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
