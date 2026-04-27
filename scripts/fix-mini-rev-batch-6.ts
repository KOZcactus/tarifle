/**
 * Tek-seferlik manuel mini-rev batch 6 (oturum 27): 7 Mod K v2
 * MAJOR_ISSUE Türk yöresel + Brezilya tarif. Web research 2 paralel
 * agent + 20+ kaynak teyit (Kültür Portalı resmi 4 + Düzce Kalkınma
 * Vakfı + Wikipedia + Sadia + King Arthur Baking + lezzet.com.tr +
 * yemek.com + nefisyemektarifleri + duzcekalkinmavakfi).
 *
 * Verdict: 5 REWRITE + 2 REJECT (kullanici onayi alindi).
 *
 *   1. peynirli-biberiyeli-bazlama-isparta-usulu (REWRITE light):
 *      Isparta resmi yoresel listesinde bazlama+biberiye yok (Isparta
 *      gul+gul sirkesi+hamursuz+banak ekseni). Slug korunur,
 *      description Isparta atfi kaldirildi, jenerik "Akdeniz esintili
 *      pratik atistirma".
 *   2. peynirli-findikli-pide-duzce-usulu (REWRITE light): Duzce
 *      Kalkinma Vakfi yoresel listesinde mancarli pide var ama
 *      findikli pide yok. Findik+pide modern fuzyon. Description
 *      Duzce atfi kaldir, "Karadeniz esintili" jenerik.
 *   3. peynirli-soganli-sikma-konya-usulu (REWRITE medium): Sikma
 *      Adana/Mersin/Hatay (Çukurova) klasigi (yemek.com + nefis +
 *      lezzet 3 kaynak), Konya degil. Description Çukurova/Adana,
 *      Domates salça eklendi, step revize (sogan+salca kavur,
 *      tereyagi sürme adimi netlestir).
 *   4. peynirli-incir-kupu-canakkale-usulu (REWRITE light): Çanakkale
 *      incir+Ezine peyniri klasik birligi var ama "kup" formu modern
 *      restoran sunumu. Description Çanakkale atfi kaldir, "Ege
 *      esintili" jenerik.
 *   5. peynirli-kabak-cicegi-boregi-balikesir-usulu (REWRITE light):
 *      Kabak cicegi Ege+Marmara yaygın, Balikesir spesifik atfi
 *      yok. Description "Ege ve Marmara mutfagi" jenerik.
 *
 *   6. peynirli-biberli-firikli-gozleme-kahramanmaras-usulu (DELETE):
 *      Maras yoresel listede yok, firikli gozleme kanonik kombinasyon
 *      degil (firik Antep/Mardin pilav+corba). Yore atfi + konsept
 *      ikisi de uydurma. Kullanici onayi alindi.
 *   7. peynirli-manyok-kase-brezilya-usulu (DELETE): Brezilya
 *      peynir+manyok kanonigi pao de queijo (manyok nisastasi +
 *      yumurta + sut + yag + peynir, top firin). Mevcut basit
 *      haslanmis manyok+kasar Brezilya degil, hatta pao de queijo
 *      akrabasi bile degil. Kullanici onayi alindi.
 *
 * AuditLog action:
 *   - MOD_K_MANUAL_REV (rewrite)
 *   - MOD_K_REJECT_DELETE (delete)
 * Idempotent: zaten yeni description ise REWRITE SKIP, zaten silinmis
 * ise DELETE SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-6.ts
 *   npx tsx scripts/fix-mini-rev-batch-6.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
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
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

interface IngredientAdd {
  name: string;
  amount: string;
  unit: string;
}

interface StepReplacement {
  stepNumber: number;
  instruction: string;
  timerSeconds?: number | null;
}

interface RewriteOp {
  type: "rewrite";
  slug: string;
  reason: string;
  sources: string[];
  description?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  averageCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergensAdd?: Allergen[];
  allergensRemove?: Allergen[];
  ingredientsAdd?: IngredientAdd[];
  ingredientsRemove?: string[];
  stepsReplace?: StepReplacement[];
}

interface DeleteOp {
  type: "delete";
  slug: string;
  reason: string;
  sources: string[];
}

type Op = RewriteOp | DeleteOp;

const OPS: Op[] = [
  // ─── REWRITE 1: peynirli-biberiyeli-bazlama-isparta ──────────
  {
    type: "rewrite",
    slug: "peynirli-biberiyeli-bazlama-isparta-usulu",
    reason:
      "Isparta resmi yoresel listede bazlama+biberiye yok (Isparta gul+gul sirkesi+hamursuz+banak+kabune pilavi+firin kebabi ekseni). Description Isparta atfi kaldirildi, slug korunur (URL break onleme).",
    sources: [
      "https://isparta.ktb.gov.tr/TR-264959/isparta-yemekleri.html",
      "https://www.lezzet.com.tr/lezzetten-haberler/isparta-yemekleri",
    ],
    description:
      "Sıcak bazlamanın içine beyaz peynir ve biberiye sürülen pratik bir atıştırmalık. Akdeniz esintili, yumuşak ve kokulu, kahvaltıda veya çay yanında doyurucu bir tabak.",
  },

  // ─── REWRITE 2: peynirli-findikli-pide-duzce ─────────────────
  {
    type: "rewrite",
    slug: "peynirli-findikli-pide-duzce-usulu",
    reason:
      "Duzce Kalkinma Vakfi yoresel listede mancarli pide var (paziydi/ispanak), findikli pide yok. Findik Duzce kalkinma urunu (cografi isaret) ama findikli pide modern fuzyon. Description Duzce atfi kaldir, 'Karadeniz esintili' jenerik.",
    sources: [
      "https://duzcekalkinmavakfi.com/detay/1158-yore-mutfagi",
      "https://duzce.ktb.gov.tr/TR-249197/cografi-isaretli-urunler.html",
    ],
    description:
      "Karadeniz esintili, kırık fındık ve beyaz peynirle hazırlanan tuzlu pide. Çıtır kenarlı, kokulu ve karakterli bir hamur işidir.",
  },

  // ─── REWRITE 3: peynirli-soganli-sikma-konya ─────────────────
  {
    type: "rewrite",
    slug: "peynirli-soganli-sikma-konya-usulu",
    reason:
      "Sikma Çukurova (Adana/Mersin/Hatay) klasigi (yemek.com + nefisyemektarifleri + lezzet 3 kaynak), Konya degil (Konya yoresel listede yok: etli ekmek + firin kebabi + tirit + çebiç ekseni). Description Çukurova'ya cevrildi, salça eklendi (klasik harç salçali), step revize (sogan+salca kavur, tereyagi sürme adimi netlestir).",
    sources: [
      "https://yemek.com/tarif/peynirli-sikma-2/",
      "https://www.nefisyemektarifleri.com/sikma-tarifi-yoresel/",
      "https://www.lezzet.com.tr/lezzetten-haberler/konyanin-yoresel-yemekleri",
    ],
    description:
      "Adana, Mersin ve Hatay kahvaltısının vazgeçilmezi sıkma; ince açılan hamur tavada pişer, salçalı soğan ve peynirle sarılır. Tereyağıyla parlatılır, sıcak servis edilir.",
    ingredientsAdd: [
      { name: "Domates salçası", amount: "1", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, ılık su ve tuzla yumuşak hamur yoğurun, üstünü örtüp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğanı küçük doğrayıp tereyağında 4 dakika yumuşatın, salçayı ekleyip 1 dakika daha kavurun, ocaktan alın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Beyaz peyniri ezerek soğanlı salçaya katın, pul biberi ekleyip karışımı dinlendirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hamuru bezelere bölün, oklavayla ince açın, kızgın sacda her yüzünü 1 dakika pişirin.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Pişen yufkanın üstünü tereyağıyla yağlayıp harcı yayın, sıkıca rulo sarın ve sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 4: peynirli-incir-kupu-canakkale ────────────────
  {
    type: "rewrite",
    slug: "peynirli-incir-kupu-canakkale-usulu",
    reason:
      "Çanakkale incir+Ezine peyniri klasik birligi var (Bayramic, Ezine, Lapseki incir bolgeleri) ama mevcut tarif labne+bal+biskuvi taban+ceviz 'kup' formu modern restoran sunumu, geleneksel halk mutfagi kanonu degil. Description Çanakkale atfi kaldir, 'Ege esintili' jenerik.",
    sources: [
      "https://www.lezzet.com.tr/lezzetten-haberler/canakkale-yemekleri",
    ],
    description:
      "Taze incir, labne ve balın bisküvi tabanlı kupta buluştuğu hafif bir Ege esintili tatlı. Soğuk servis için pratik bir son tat.",
  },

  // ─── REWRITE 5: peynirli-kabak-cicegi-boregi-balikesir ──────
  {
    type: "rewrite",
    slug: "peynirli-kabak-cicegi-boregi-balikesir-usulu",
    reason:
      "Kabak cicegi yemekleri Ege+Marmara guney sahili klasigi (Izmir, Aydin, Mugla); zeytinyaglı kabak cicegi dolmasi en bilinen form. Balikesir spesifik 'peynirli kabak cicegi boregi' resmi kaynaklarda yok (Balikesir hosmerim+tirit+Susurluk tostu+peynir tatlisi ekseni). Description 'Ege ve Marmara mutfagi' jenerik.",
    sources: [
      "https://www.lezzet.com.tr/lezzetten-haberler/ege-yemekleri",
      "https://yemek.com/kabak-cicegi-tarifleri/",
    ],
    description:
      "Kabak çiçeklerini lor ve dereotu ile doldurup ince yufkaya sararak fırınlanan, Ege ve Marmara mutfağına özgü narin bir böreğidir.",
  },

  // ─── DELETE 1: peynirli-biberli-firikli-gozleme-kahramanmaras ─
  {
    type: "delete",
    slug: "peynirli-biberli-firikli-gozleme-kahramanmaras-usulu",
    reason:
      "Kahramanmaras yoresel klasiklerinde 'firikli gozleme' yok (Maras corek, çoş borek, yogurtlu dovme corbasi ekseni). Firik Antep/Mardin/Diyarbakir pilav+corba klasigi, gozleme degil. 'Maras usulu firikli gozleme' tum kaynaklarda (lezzet, nefis, ktb.gov.tr Maras, milligazete) yok. Yore atfi + konsept ikisi de uydurma. Kullanici onayi alindi.",
    sources: [
      "https://www.lezzet.com.tr/lezzetten-haberler/kahramanmaras-yoresel-yemekleri",
      "https://www.nefisyemektarifleri.com/liste/maras-yemekleri/",
    ],
  },

  // ─── DELETE 2: peynirli-manyok-kase-brezilya ─────────────────
  {
    type: "delete",
    slug: "peynirli-manyok-kase-brezilya-usulu",
    reason:
      "Brezilya peynir+manyok klasigi pao de queijo (Minas Gerais 1700'ler, manyok nisastasi + yumurta + sut + yag + peynir, top firin). Mevcut basit haslanmis manyok+kasar 'kase' formu Brezilya kanonik tabaginda yok, hatta pao de queijo akrabasi bile degil (Wikipedia + Sadia + King Arthur Baking 3 kaynak). Yore atfi tamamen yanlis. Kullanici onayi alindi.",
    sources: [
      "https://en.wikipedia.org/wiki/P%C3%A3o_de_queijo",
      "https://www.sadia.com.br/receitas/pao-de-queijo/",
      "https://www.kingarthurbaking.com/recipes/pao-de-queijo-brazilian-cheese-bread-recipe",
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-6");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  let rewriteUpdated = 0;
  let rewriteSkipped = 0;
  let deleteApplied = 0;
  let deleteSkipped = 0;
  let notFound = 0;

  for (const op of OPS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: op.slug },
      select: {
        id: true,
        description: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
        allergens: true,
        ingredients: { select: { id: true, name: true, sortOrder: true } },
      },
    });

    if (op.type === "delete") {
      if (!recipe) {
        console.log(`⏭️  ${op.slug}: zaten silinmiş, SKIP`);
        deleteSkipped += 1;
        continue;
      }
      await prisma.$transaction(
        async (tx) => {
          await tx.recipe.delete({ where: { id: recipe.id } });
          await tx.auditLog.create({
            data: {
              action: "MOD_K_REJECT_DELETE",
              userId: null,
              targetType: "recipe",
              targetId: recipe.id,
              metadata: {
                slug: op.slug,
                reason: op.reason,
                sources: op.sources,
                paket: "oturum-27-mini-rev-batch-6",
              },
            },
          });
        },
        { maxWait: 10_000, timeout: 60_000 },
      );
      console.log(`🗑️  ${op.slug}: silindi (cascade)`);
      deleteApplied += 1;
      continue;
    }

    if (!recipe) {
      console.error(`⚠️  ${op.slug}: bulunamadı`);
      notFound += 1;
      continue;
    }

    if (op.description && recipe.description.trim() === op.description.trim()) {
      console.log(`⏭️  ${op.slug}: zaten yeni description, SKIP (idempotent)`);
      rewriteSkipped += 1;
      continue;
    }

    const updateData: Record<string, unknown> = {};
    if (op.description) updateData.description = op.description;
    if (op.prepMinutes !== undefined) updateData.prepMinutes = op.prepMinutes;
    if (op.cookMinutes !== undefined) updateData.cookMinutes = op.cookMinutes;
    if (op.totalMinutes !== undefined) updateData.totalMinutes = op.totalMinutes;
    if (op.averageCalories !== undefined) updateData.averageCalories = op.averageCalories;
    if (op.protein !== undefined) updateData.protein = op.protein;
    if (op.carbs !== undefined) updateData.carbs = op.carbs;
    if (op.fat !== undefined) updateData.fat = op.fat;
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

        if (op.ingredientsAdd && op.ingredientsAdd.length > 0) {
          const maxSort = recipe.ingredients.reduce(
            (m, i) => Math.max(m, i.sortOrder),
            0,
          );
          const existingNorm = new Set(recipe.ingredients.map((i) => normalize(i.name)));
          let added = 0;
          for (const ing of op.ingredientsAdd) {
            if (existingNorm.has(normalize(ing.name))) continue;
            await tx.recipeIngredient.create({
              data: {
                recipeId: recipe.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                sortOrder: maxSort + 1 + added,
              },
            });
            added += 1;
          }
        }

        if (op.stepsReplace && op.stepsReplace.length > 0) {
          await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
          for (const step of op.stepsReplace) {
            await tx.recipeStep.create({
              data: {
                recipeId: recipe.id,
                stepNumber: step.stepNumber,
                instruction: step.instruction,
                timerSeconds: step.timerSeconds ?? null,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            action: "MOD_K_MANUAL_REV",
            userId: null,
            targetType: "recipe",
            targetId: recipe.id,
            metadata: {
              slug: op.slug,
              reason: op.reason,
              sources: op.sources,
              paket: "oturum-27-mini-rev-batch-6",
              changes: {
                description_revised: !!op.description,
                ingredients_added: op.ingredientsAdd?.length ?? 0,
                ingredients_removed: op.ingredientsRemove?.length ?? 0,
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

    console.log(`✅ ${op.slug}: REWRITE applied`);
    rewriteUpdated += 1;
  }

  console.log("");
  console.log(`Rewrite: ${rewriteUpdated} updated, ${rewriteSkipped} idempotent, ${notFound} not_found`);
  console.log(`Delete:  ${deleteApplied} applied, ${deleteSkipped} idempotent`);
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
