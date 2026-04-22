/**
 * Mod E apply: Codex'in `docs/step-revisions-batch-N.json` teslimini
 * Recipe.steps tablosuna atomic update olarak uygular.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §14. JSON semasi:
 *   [{ slug: string, steps: [{ stepNumber, instruction, timerSeconds? }] }]
 *
 * **Davranis:**
 *   - Atomic transaction: eski RecipeStep rows silinir, yenileri create
 *   - Ingredient listesi DOKUNULMAZ (Mod E sadece steps)
 *   - tipNote + servingSuggestion DOKUNULMAZ (Mod D alani)
 *   - translations.en/de.steps varsa ESKI KALIR (Codex re-translate Mod B
 *     pass'inde, bu kapsam disi). Kullanici "Tam ceviri" badge'i TR-based.
 *   - Cache invalidate: otomatik updateTag("recipes") + revalidatePath
 *     (mumkunse script-tan degil, apply sonrasi admin revalidate endpoint)
 *
 * **Guard:**
 *   - Slug DB'de yoksa skip + warning (dev/prod drift)
 *   - Step count <1 veya >15 CRITICAL (apply iptal, --force ile bypass)
 *   - Em-dash/en-dash CRITICAL
 *   - Kelime sayisi 5-25 arasi (step biraz daha esnek tipNote'tan)
 *   - stepNumber 1'den ardisik olmali
 *
 * Usage:
 *   # Dry-run (default, write yok)
 *   npx tsx scripts/apply-step-revisions.ts --batch 1
 *
 *   # Dev apply
 *   npx tsx scripts/apply-step-revisions.ts --batch 1 --apply
 *
 *   # Prod apply
 *   DATABASE_URL=<prod> ... --apply --confirm-prod
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

// MIN_STEP_WORDS 3: son servis step'i sik sik 3-4 kelime ("Corbayi
// sicak servis edin", 4 kelime). Ana pisirme adimlarinda 5-25 ideal
// ama hard minimum 3 (tamamen yasadisi <3). Codex Brief §14.3'te bu
// aciklandi.
const MIN_STEP_WORDS = 3;
const MAX_STEP_WORDS = 25;
const MIN_STEP_COUNT = 1;
const MAX_STEP_COUNT = 15;

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
  return path.resolve(process.cwd(), `docs/step-revisions-batch-${batch}.json`);
}

const stepItemSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1),
  timerSeconds: z.number().int().nonnegative().optional(),
});

const ingredientItemSchema = z.object({
  sortOrder: z.number().int().positive(),
  name: z.string().min(1).max(200),
  amount: z.string().min(1).max(50),
  unit: z.string().max(50).optional(),
});

const itemSchema = z.object({
  slug: z.string().min(1).max(200),
  steps: z.array(stepItemSchema).min(MIN_STEP_COUNT).max(MAX_STEP_COUNT),
  // Opsiyonel ingredient revizyonu (Mod E v2, Kerem direktifi). Codex
  // arastirma sirasinda tarifte hata bulursa (eksik malzeme/yanlis oran)
  // ingredients de revize edilir. Tam REPLACEMENT: eski silinir, yeniler
  // yazilir. JSON'da yoksa ingredient dokunulmaz.
  ingredients: z
    .array(ingredientItemSchema)
    .min(1)
    .max(40)
    .optional(),
});

const fileSchema = z.array(itemSchema);

type Item = z.infer<typeof itemSchema>;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function validateItem(item: Item, idx: number): string[] {
  const errors: string[] = [];
  // stepNumber ardisiklik
  for (let i = 0; i < item.steps.length; i++) {
    if (item.steps[i]!.stepNumber !== i + 1) {
      errors.push(`#${idx} [${item.slug}] step sirasi bozuk (#${i} stepNumber=${item.steps[i]!.stepNumber}, beklenen ${i + 1})`);
    }
  }
  for (const s of item.steps) {
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
  }
  return errors;
}

async function main() {
  const target = assertDbTarget("apply-step-revisions");
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
  items.forEach((it, idx) => validationErrors.push(...validateItem(it, idx)));
  if (validationErrors.length > 0) {
    console.error(`\n❌ ${validationErrors.length} CRITICAL bulundu:`);
    validationErrors.slice(0, 20).forEach((e) => console.error(`  ${e}`));
    if (!FORCE) {
      console.error("\nBypass icin --force ekle.");
      process.exit(1);
    }
    console.warn("\n⚠️  --force ile devam, hatalar gormezden geliniyor.");
  }
  console.log(`✅ Sema + format validation: ${items.length} item temiz`);

  // DB lookup
  const existing = await prisma.recipe.findMany({
    where: { slug: { in: items.map((i) => i.slug) } },
    select: { id: true, slug: true },
  });
  const existingMap = new Map(existing.map((e) => [e.slug, e.id]));

  const missing = items.filter((i) => !existingMap.has(i.slug));
  if (missing.length > 0) {
    console.warn(`\n⚠️  ${missing.length} slug DB'de yok (skip):`);
    missing.slice(0, 10).forEach((m) => console.warn(`  - ${m.slug}`));
  }

  let updated = 0;
  let totalStepsWritten = 0;
  let ingredientsRevised = 0;
  let totalIngredientsWritten = 0;

  for (const item of items) {
    const recipeId = existingMap.get(item.slug);
    if (!recipeId) continue;

    if (APPLY) {
      // Step revisyonu (zorunlu): atomic delete + create.
      const stepOps = [
        prisma.recipeStep.deleteMany({ where: { recipeId } }),
        prisma.recipeStep.createMany({
          data: item.steps.map((s) => ({
            recipeId,
            stepNumber: s.stepNumber,
            instruction: s.instruction,
            timerSeconds: s.timerSeconds ?? null,
          })),
        }),
      ];

      // Ingredient revisyonu (opsiyonel, Mod E v2): sadece JSON'da varsa.
      // Atomic delete + create, tam REPLACEMENT.
      const ingredientOps = item.ingredients
        ? [
            prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
            prisma.recipeIngredient.createMany({
              data: item.ingredients.map((i) => ({
                recipeId,
                sortOrder: i.sortOrder,
                name: i.name,
                amount: i.amount,
                unit: i.unit ?? null,
              })),
            }),
          ]
        : [];

      await prisma.$transaction([...stepOps, ...ingredientOps]);
    }
    updated += 1;
    totalStepsWritten += item.steps.length;
    if (item.ingredients) {
      ingredientsRevised += 1;
      totalIngredientsWritten += item.ingredients.length;
    }
  }

  console.log(`\n📊 Sonuc:`);
  console.log(`  Toplam item:                 ${items.length}`);
  console.log(`  DB'de bulunan:               ${items.length - missing.length}`);
  console.log(`  Skip (slug yok):             ${missing.length}`);
  console.log(`  ${APPLY ? "Update edilen tarif:" : "Update edilecek tarif:"}         ${updated}`);
  console.log(`  Toplam step ${APPLY ? "yazilan" : "yazilacak"}:        ${totalStepsWritten}`);
  console.log(`  Ingredient revize ${APPLY ? "edilen tarif" : "edilecek tarif"}: ${ingredientsRevised}`);
  console.log(`  Toplam ingredient ${APPLY ? "yazilan" : "yazilacak"}:  ${totalIngredientsWritten}`);

  if (!APPLY) {
    console.log(`\n💡 Apply icin --apply ekle.`);
  } else {
    console.log(`\n✅ Apply tamamlandi.`);
    console.log(`   NOT: Cache invalidate icin admin revalidate endpoint cagir`);
    console.log(`        (veya deploy bekle, unstable_cache TTL 30 dk).`);
  }
}

main()
  .catch((err) => {
    console.error("HATA:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
