/**
 * Batch fix: STEP_INGREDIENT_MISSING manuel review (8 hit, oturum 34).
 *
 * Her tarif bireysel inceleme sonrası kategorize edildi:
 *   B) Ingredient ekle (3): kibe-mumbar, kayisili-irmik-pilavi, mango-sticky-rice
 *   C) Step text rewrite (5): koper-soslu, lorlu-zahter, peynirli-milfoy,
 *      pupusa, sakizli-kavun
 *
 * Idempotent: zaten doğru state'te ise atlanır. AuditLog action
 * INGREDIENT_RETROFIT veya STEP_REWRITE.
 *
 * Usage:
 *   npx tsx scripts/fix-step-ingredient-batch.ts                     # dev DRY-RUN
 *   npx tsx scripts/fix-step-ingredient-batch.ts --apply             # dev apply
 *   npx tsx scripts/fix-step-ingredient-batch.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const APPLY = process.argv.includes("--apply");
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface IngredientAdd {
  recipeSlug: string;
  name: string;
  amount: string;
  unit: string;
  group?: string;
  reason: string;
}

interface StepRewrite {
  recipeSlug: string;
  stepNumber: number;
  before: string;
  after: string;
  reason: string;
}

// Kategori B: ingredient ekle (3)
const INGREDIENT_ADDS: IngredientAdd[] = [
  {
    recipeSlug: "kibe-mumbar",
    name: "Un",
    amount: "0.5",
    unit: "su bardağı",
    group: "Temizlik için",
    reason: "step 1 'tuz, un ve sirkeyle iyice ovup' işkembe temizlik için un",
  },
  {
    recipeSlug: "kibe-mumbar",
    name: "Sirke",
    amount: "0.25",
    unit: "su bardağı",
    group: "Temizlik için",
    reason: "step 1 işkembe temizlik için sirke",
  },
  {
    recipeSlug: "kayisili-irmik-pilavi-macaristan-usulu",
    name: "Tuz",
    amount: "1",
    unit: "çimdik",
    reason: "step 2 'bir tutam tuzu' süt karışımı dengesi için",
  },
  {
    recipeSlug: "mango-sticky-rice",
    name: "Tuz",
    amount: "1",
    unit: "çimdik",
    reason: "step 3 'şeker ve tuzu 4 dakika ısıtın' kokos sosu için",
  },
];

// Kategori C: step text rewrite (5)
const STEP_REWRITES: StepRewrite[] = [
  {
    recipeSlug: "koper-soslu-fasulye-polonya-usulu",
    stepNumber: 3,
    before: "Tereyağını küçük tencerede 2 dakika eritin, un kullanıyorsanız kokusu çıkana kadar çevirin.",
    after: "Tereyağını küçük tencerede 2 dakika eritin, hafifçe köpürene kadar çevirin.",
    reason: "opsiyonel un kalıntı sözü çıkarıldı, tarif un kullanmıyor",
  },
  {
    recipeSlug: "lorlu-zahterli-yumurta-pide-antalya-usulu",
    stepNumber: 1,
    // Önceki rewrite "hafif unlanmış" hala 'un' kelimesi içeriyordu, audit
    // yakalıyordu. Tamamen kaldır, açma tekniği basitle.
    before: "Pide hamurunu hafif unlanmış tezgahta ince oval açın ve kenarlarını hafifçe yükseltin.",
    after: "Pide hamurunu temiz tezgahta ince oval açın ve kenarlarını hafifçe yükseltin.",
    reason: "açma teknik açıklaması basitle, 'un' kelimesi yok (false positive engelle)",
  },
  {
    recipeSlug: "peynirli-milfoy",
    stepNumber: 1,
    // Aynı pattern: rewrite "az unlanmış" hala 'un' içeriyor, refine.
    // Prod drift'inde de bu rewrite uygulanmamıştı, before mismatch yapacak.
    before: "Milföy karelerini çözdürüp az unlanmış zemine alın.",
    after: "Milföy karelerini çözdürüp temiz zemine alın.",
    reason: "tezgah un teknik açıklaması basitle, 'un' kelimesi yok",
  },
  {
    recipeSlug: "pupusa",
    stepNumber: 2,
    before: "Hamuru 10 dakika dinlendirin, mısır unu suyu eşit çeksin ve kenarlar çatlamasın.",
    after: "Hamuru 10 dakika dinlendirin, masa harina suyu eşit çeksin ve kenarlar çatlamasın.",
    reason: "consistency: ingredient 'Masa harina', step 'mısır unu' aynı şey, tek isim kullanım",
  },
  {
    recipeSlug: "sakizli-kavun-kasesi-cesme-usulu",
    stepNumber: 2,
    before: "Damla sakızını çimdikleyip 1 tatlı kaşığı şeker veya tuzla havanda toz haline getirin.",
    after: "Damla sakızını çimdikleyip 1 tatlı kaşığı şekerle havanda toz haline getirin.",
    reason: "tuz alternatifi tatlı tarifte yanlış, sadece şeker doğru (klasik sakız ezme tekniği)",
  },
];

async function main(): Promise<void> {
  await assertDbTarget("fix-step-ingredient-batch");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  // === Kategori B: Ingredient ek ===
  console.log("=== INGREDIENT_ADDS ===");
  let ingApplied = 0;
  for (const add of INGREDIENT_ADDS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: add.recipeSlug },
      select: {
        id: true,
        ingredients: { select: { name: true, sortOrder: true } },
      },
    });
    if (!recipe) {
      console.log(`[skip] ${add.recipeSlug}: not found`);
      continue;
    }
    const exists = recipe.ingredients.some(
      (i) => i.name.toLocaleLowerCase("tr-TR") === add.name.toLocaleLowerCase("tr-TR"),
    );
    if (exists) {
      console.log(`[skip] ${add.recipeSlug}: ${add.name} zaten mevcut`);
      continue;
    }
    if (!APPLY) {
      console.log(`[plan] ${add.recipeSlug}: +${add.name} ${add.amount} ${add.unit}${add.group ? ` (${add.group})` : ""}`);
      continue;
    }
    const maxSort = recipe.ingredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
    const created = await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        name: add.name,
        amount: add.amount,
        unit: add.unit,
        sortOrder: maxSort + 1,
        ...(add.group ? { group: add.group } : {}),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "INGREDIENT_RETROFIT",
        targetType: "RecipeIngredient",
        targetId: created.id,
        metadata: {
          recipeSlug: add.recipeSlug,
          added: { name: add.name, amount: add.amount, unit: add.unit, group: add.group },
          reason: add.reason,
        },
      },
    });
    console.log(`[ok] ${add.recipeSlug}: +${add.name}`);
    ingApplied++;
  }

  // === Kategori C: Step rewrite ===
  console.log(`\n=== STEP_REWRITES ===`);
  let stepApplied = 0;
  for (const rw of STEP_REWRITES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: rw.recipeSlug },
      select: { id: true },
    });
    if (!recipe) {
      console.log(`[skip] ${rw.recipeSlug}: not found`);
      continue;
    }
    const step = await prisma.recipeStep.findFirst({
      where: { recipeId: recipe.id, stepNumber: rw.stepNumber },
      select: { id: true, instruction: true },
    });
    if (!step) {
      console.log(`[skip] ${rw.recipeSlug}: step ${rw.stepNumber} not found`);
      continue;
    }
    if (step.instruction === rw.after) {
      console.log(`[skip] ${rw.recipeSlug} step ${rw.stepNumber}: zaten rewrite`);
      continue;
    }
    if (step.instruction !== rw.before) {
      console.log(`[warn] ${rw.recipeSlug} step ${rw.stepNumber}: before mismatch (drift?)`);
      console.log(`       expected: ${rw.before.slice(0, 80)}...`);
      console.log(`       actual  : ${step.instruction.slice(0, 80)}...`);
      continue;
    }
    if (!APPLY) {
      console.log(`[plan] ${rw.recipeSlug} step ${rw.stepNumber}: rewrite (${rw.reason})`);
      continue;
    }
    await prisma.recipeStep.update({
      where: { id: step.id },
      data: { instruction: rw.after },
    });
    await prisma.auditLog.create({
      data: {
        action: "STEP_REWRITE",
        targetType: "RecipeStep",
        targetId: step.id,
        metadata: {
          recipeSlug: rw.recipeSlug,
          stepNumber: rw.stepNumber,
          before: rw.before,
          after: rw.after,
          reason: rw.reason,
        },
      },
    });
    console.log(`[ok] ${rw.recipeSlug} step ${rw.stepNumber}`);
    stepApplied++;
  }

  console.log(`\nSUMMARY: ${ingApplied} ingredient ek + ${stepApplied} step rewrite`);
  if (!APPLY) console.log("\nDry-run, kayıt yok. Apply için --apply.");
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
