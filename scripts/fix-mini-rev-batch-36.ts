/**
 * Tek-seferlik manuel mini-rev batch 36 (oturum 31, FINAL): 2 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern KAPANIŞ (paketi 25-35 ile
 * aynı audit). Paketi 35 sonrası 2 kalan slug'ı kapatır ve verify-
 * untracked kuyruğunu **%100 KAPATIR** 🏁.
 *
 * Verdict: 2 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. reyhanli-lorlu-yumurta-ekmegi-hatay-usulu (Hatay): bayat ekmek
 *      + yumurta + lor + taze reyhan + süt VAR. DB'de zeytinyağı
 *      (kızartma essential!) + tuz + karabiber + sumak (Hatay imzası)
 *      EKSİK. 5 step. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri
 *      ayırın' (yumurta-süt çırpmada absürt) + step 5 BOILERPLATE LEAK
 *      'soğursa gevrek kenarlar yumuşar'. 4 ingredient_add, 5 step
 *      replace.
 *
 *   2. tereyagli-pazi-diblesi-trabzon-usulu (Trabzon): pazı + pirinç
 *      + soğan + tereyağı + su + tuz VAR. DB'de sarımsak + karabiber
 *      + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold ('son
 *      tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). 3 ingredient_add,
 *      7 step replace.
 *
 * Toplam: 7 ingredient_add + 12 step replace + 2 BOILERPLATE LEAK FIX.
 *
 * Bu paket ile **verify-untracked jenerik scaffold kuyruğu paketi 25-
 * 36 boyunca 79 → 0 (%100 KAPANIŞ)**. 12 ardışık paket, 78 + 4 =
 * toplam 80+ tarif (paketi 36 = 2 final). Mini-rev kümülatif **241**.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 */
import { PrismaClient, Allergen, Difficulty, RecipeType } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface IngredientAdd { name: string; amount: string; unit: string; }
interface IngredientAmountChange { name: string; newAmount: string; newUnit?: string; }
interface StepReplacement { stepNumber: number; instruction: string; timerSeconds?: number | null; }
interface RewriteOp {
  type: "rewrite";
  slug: string; reason: string; sources: string[];
  newTitle?: string; description?: string; cuisine?: string;
  recipeType?: RecipeType; difficulty?: Difficulty;
  prepMinutes?: number; cookMinutes?: number; totalMinutes?: number;
  averageCalories?: number; protein?: number; carbs?: number; fat?: number;
  tipNote?: string; servingSuggestion?: string;
  allergensAdd?: Allergen[]; allergensRemove?: Allergen[];
  ingredientsAdd?: IngredientAdd[]; ingredientsRemove?: string[];
  ingredientsAmountChange?: IngredientAmountChange[];
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── 1: reyhanli-lorlu-yumurta-ekmegi-hatay-usulu (Hatay) ─────────
  {
    type: "rewrite",
    slug: "reyhanli-lorlu-yumurta-ekmegi-hatay-usulu",
    reason:
      "REWRITE jenerik scaffold + Hatay reyhanlı lorlu yumurta ekmeği tamamlama. Klasik formul: bayat ekmek + yumurta + lor + taze reyhan + süt VAR. DB'de zeytinyağı (kızartma yağı essential!) + tuz + karabiber + sumak (Hatay imzası, lor harç destek) EKSİK. 5 step. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' + step 5 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar'. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/lorlu-yumurta-ekmegi",
    ],
    description:
      "Hatay sofralarının reyhanlı lorlu yumurta ekmeği; bayat ekmek dilimlerinin yumurta-süt karışımına emdirilip zeytinyağında kızartılması, üzerine taze reyhan ve sumakla tatlandırılan lor harcının kaşıklanmasıyla hazırlanan otlu sabah tabağıdır.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Lor peynirinin nemini tülbentle 5 dakika süzdürün; aksi halde harç sulanır. Reyhanı son anda kıyın; uçucu aroması korunur ve harç renkli kalır.",
    servingSuggestion:
      "Sıcak ekmeğin üstüne reyhanlı lor harcını kaşıkla yatırın; üzerine ekstra sumak serpip dilim domatesle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini tülbentle 5 dakika süzdürüp çatalla ezin; ince kıyılmış reyhan, sumak ve bir tutam tuzu katarak harmanlayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Yumurta, süt, kalan tuz ve karabiberi derin kâsede çırpın; karışım pürüzsüzleşene kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Bayat ekmekleri yumurtalı karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp ekmek dilimlerini 6 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Sıcak ekmekleri tabağa alıp üzerlerine reyhanlı lor harcını kaşıklayarak servis edin; ekstra sumak serpin.", timerSeconds: null },
    ],
  },

  // ─── 2: tereyagli-pazi-diblesi-trabzon-usulu (Trabzon) ────────────
  {
    type: "rewrite",
    slug: "tereyagli-pazi-diblesi-trabzon-usulu",
    reason:
      "REWRITE jenerik scaffold + Trabzon tereyağlı pazı diblesi tamamlama. Klasik Karadeniz dible: pazı + pirinç + soğan + tereyağı + su + tuz VAR. DB'de sarımsak + karabiber + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/trabzon/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/pazi-diblesi",
    ],
    description:
      "Trabzon usulü tereyağlı pazı diblesi; pazı yapraklarının soğan ve sarımsakla tereyağında soldurulup pirinçle aynı tencerede pişirildiği, Karadeniz mutfağının sade ama güçlü tek tencere yemeklerindendir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Pazıyı soğuk suda iyice yıkayın; sapın iç kısmı kum tutar. Pazıyı ekledikten sonra tencereyi kapamadan 3 dakika açıkta soluyana kadar bekleyin; aksi halde rengi kararır.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üzerine tereyağında pul biberli kıyma sosu gezdirilebilir; yanına ev yoğurdu veya cacıkla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Pazıyı yıkayıp süzün, sap ve yapraklarını ayrı ayrı kıyın; soğanı yemeklik doğrayın, sarımsağı ezin; pirinci yıkayıp süzün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağını orta ateşte eritip soğanı 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Pazı saplarını ekleyip 2 dakika soteleyin; yaprakları katıp 1 dakika daha çevirin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Pirinç, sıcak su, tuz, karabiber ve pul biberi tencereye katıp bir kez karıştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapakla kısık ateşte 12 dakika pirinç suyunu çekene kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 6, instruction: "Ocaktan alıp kapağı bezle kapatarak 5 dakika demlendirin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Servis tabağına paylaştırıp sıcak servis edin; istenirse üstüne ekstra pul biber serpin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-36");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log(`DB: ${new URL(url).host}`);

  let rewriteUpdated = 0;
  let rewriteSkipped = 0;
  let notFound = 0;

  for (const op of OPS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: op.slug },
      select: {
        id: true, title: true, description: true, cuisine: true, type: true,
        difficulty: true, prepMinutes: true, cookMinutes: true, totalMinutes: true,
        averageCalories: true, protein: true, carbs: true, fat: true,
        tipNote: true, servingSuggestion: true, allergens: true,
        ingredients: { select: { id: true, name: true, sortOrder: true } },
      },
    });

    if (!recipe) { console.error(`⚠️  ${op.slug}: bulunamadı`); notFound += 1; continue; }
    if (op.description && recipe.description.trim() === op.description.trim()) {
      console.log(`⏭️  ${op.slug}: zaten yeni description, SKIP (idempotent)`);
      rewriteSkipped += 1; continue;
    }

    const updateData: Record<string, unknown> = {};
    if (op.newTitle) updateData.title = op.newTitle;
    if (op.description) updateData.description = op.description;
    if (op.cuisine !== undefined) updateData.cuisine = op.cuisine;
    if (op.recipeType !== undefined) updateData.type = op.recipeType;
    if (op.difficulty !== undefined) updateData.difficulty = op.difficulty;
    if (op.prepMinutes !== undefined) updateData.prepMinutes = op.prepMinutes;
    if (op.cookMinutes !== undefined) updateData.cookMinutes = op.cookMinutes;
    if (op.totalMinutes !== undefined) updateData.totalMinutes = op.totalMinutes;
    if (op.averageCalories !== undefined) updateData.averageCalories = op.averageCalories;
    if (op.protein !== undefined) updateData.protein = op.protein;
    if (op.carbs !== undefined) updateData.carbs = op.carbs;
    if (op.fat !== undefined) updateData.fat = op.fat;
    if (op.tipNote !== undefined) updateData.tipNote = op.tipNote;
    if (op.servingSuggestion !== undefined) updateData.servingSuggestion = op.servingSuggestion;
    if (op.allergensAdd || op.allergensRemove) {
      const newAllergens = new Set<Allergen>(recipe.allergens);
      (op.allergensAdd ?? []).forEach((a) => newAllergens.add(a));
      (op.allergensRemove ?? []).forEach((a) => newAllergens.delete(a));
      updateData.allergens = Array.from(newAllergens);
    }

    await prisma.$transaction(
      async (tx) => {
        if (Object.keys(updateData).length > 0) {
          await tx.recipe.update({ where: { id: recipe.id }, data: updateData });
        }
        if (op.ingredientsRemove && op.ingredientsRemove.length > 0) {
          const removeNorm = new Set(op.ingredientsRemove.map(normalize));
          for (const ing of recipe.ingredients) {
            if (removeNorm.has(normalize(ing.name))) {
              await tx.recipeIngredient.delete({ where: { id: ing.id } });
            }
          }
        }
        if (op.ingredientsAmountChange && op.ingredientsAmountChange.length > 0) {
          for (const change of op.ingredientsAmountChange) {
            const target = recipe.ingredients.find((i) => normalize(i.name) === normalize(change.name));
            if (target) {
              const data: Record<string, unknown> = { amount: change.newAmount };
              if (change.newUnit !== undefined) data.unit = change.newUnit;
              await tx.recipeIngredient.update({ where: { id: target.id }, data });
            }
          }
        }
        if (op.ingredientsAdd && op.ingredientsAdd.length > 0) {
          const remainingIngredients = await tx.recipeIngredient.findMany({
            where: { recipeId: recipe.id }, select: { name: true, sortOrder: true },
          });
          const maxSort = remainingIngredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
          const existingNorm = new Set(remainingIngredients.map((i) => normalize(i.name)));
          let added = 0;
          for (const ing of op.ingredientsAdd) {
            if (existingNorm.has(normalize(ing.name))) continue;
            await tx.recipeIngredient.create({
              data: { recipeId: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit, sortOrder: maxSort + 1 + added },
            });
            added += 1;
          }
        }
        if (op.stepsReplace && op.stepsReplace.length > 0) {
          await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
          for (const step of op.stepsReplace) {
            await tx.recipeStep.create({
              data: { recipeId: recipe.id, stepNumber: step.stepNumber, instruction: step.instruction, timerSeconds: step.timerSeconds ?? null },
            });
          }
        }
        await tx.auditLog.create({
          data: {
            action: "MOD_K_MANUAL_REV", userId: null, targetType: "recipe", targetId: recipe.id,
            metadata: {
              slug: op.slug, reason: op.reason, sources: op.sources,
              paket: "oturum-31-mini-rev-batch-36-FINAL",
              changes: {
                title_changed: op.newTitle ? `${recipe.title} -> ${op.newTitle}` : null,
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
                type_changed: op.recipeType ? `${recipe.type} -> ${op.recipeType}` : null,
                difficulty_changed: op.difficulty ? `${recipe.difficulty} -> ${op.difficulty}` : null,
                ingredients_added: op.ingredientsAdd?.length ?? 0,
                ingredients_removed: op.ingredientsRemove?.length ?? 0,
                ingredients_amount_changed: op.ingredientsAmountChange?.length ?? 0,
                steps_replaced: op.stepsReplace?.length ?? 0,
                allergens_added: op.allergensAdd ?? [],
                allergens_removed: op.allergensRemove ?? [],
              },
            },
          },
        });
      },
      { maxWait: 10_000, timeout: 60_000 },
    );

    const titleNote = op.newTitle ? ` (title değişti)` : "";
    const cuisineNote = op.cuisine ? ` (cuisine ${recipe.cuisine} -> ${op.cuisine})` : "";
    const typeNote = op.recipeType ? ` (type ${recipe.type} -> ${op.recipeType})` : "";
    console.log(`✅ ${op.slug}: REWRITE applied${cuisineNote}${typeNote}${titleNote}`);
    rewriteUpdated += 1;
  }

  console.log("");
  console.log(`Rewrite: ${rewriteUpdated} updated, ${rewriteSkipped} idempotent, ${notFound} not_found`);
  await prisma.$disconnect();
}

const isEntrypoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) { main().catch((e) => { console.error(e); process.exit(1); }); }
