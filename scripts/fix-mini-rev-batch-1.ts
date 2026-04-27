/**
 * Tek-seferlik manuel mini-rev batch 1 (oturum 27): 4 Mod K v2
 * MAJOR_ISSUE tarif. Web research 2 paralel agent ile yapildi
 * (Wikipedia, eatingthaifood, Hot Thai Kitchen, Sadia, Receitas
 * Nestle, Kultur Portali, Ordu.net.tr, Gurmex). Verdict + uygulama:
 *
 *   1. REWRITE feijao-tropeiro-brezilya-usulu (klasik etli, bacon +
 *      linguica calabresa + couve eklendi)
 *   2. REWRITE feslegenli-tavuklu-pirinc-tayland-usulu (Pad Kra Pao
 *      Gai stir-fry, sarimsak + Thai biber + balik sosu + soya x2 +
 *      istiridye sosu + holy basil eklendi, sade fesleğen + su
 *      cikarildi)
 *   3. DELETE erzsebet-sour-macar-usulu (Codex halusinasyonu, klasik
 *      Macar kokteyl yok)
 *   4. DELETE findikli-keskek-toplari-ordu-usulu (Codex halusinasyonu
 *      + scaffold steps + asurelik bugday 25dk teknik calismaz)
 *
 * AuditLog action:
 *   - MOD_K_MANUAL_REV (rewrite)
 *   - MOD_K_REJECT_DELETE (delete, kullanici onayi alindi)
 *
 * Idempotent: zaten yeni description ise REWRITE SKIP, zaten
 * silinmis ise DELETE SKIP.
 *
 * Kullanici onayi (oturum 27): 2 silme operasyonu icin AskUserQuestion
 * ile explicit "Sil (Onerilen)" cevabi alindi (destructive operation
 * disiplini, memory feedback_autonomous_commands).
 *
 * Tags handling: bu script'te atlandi (RecipeTag join table karmasik,
 * sonradan elle eklenebilir veya apply-mod-k-batch pattern'i ile).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-1.ts
 *   npx tsx scripts/fix-mini-rev-batch-1.ts --env prod --confirm-prod
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
  group?: string | null;
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
  // ─── REWRITE 1: feijao-tropeiro ─────────────────────────────
  {
    type: "rewrite",
    slug: "feijao-tropeiro-brezilya-usulu",
    reason:
      "Klasik Brezilya feijao tropeiro etlidir (bacon + linguica calabresa + couve), mevcut tarif basit fasulye-yumurta. Identity rewrite: bacon, linguica, sarimsak, karalahana, maydanoz, karabiber eklendi; sivi yag cikarildi (bacon yagi cikar). Macro yukari (P 12->21, F 13->24).",
    sources: [
      "https://en.wikipedia.org/wiki/Feij%C3%A3o_tropeiro",
      "https://www.sadia.com.br/receitas/feijao-tropeiro-com-linguica-e-bacon-sadia/",
      "https://www.receitasnestle.com.br/receitas/feijao-tropeiro",
    ],
    description:
      "Feijão tropeiro, pişmiş fasulyeyi bacon ve linguiça ile kavurup üstüne manyok unu (farinha de mandioca), karalahana ve yumurta ekleyerek hazırlanan Minas Gerais yemeğidir. Kuru dokulu, baharatlı, doyurucu bir tabaktır.",
    prepMinutes: 15,
    cookMinutes: 20,
    totalMinutes: 35,
    averageCalories: 430,
    protein: 21,
    carbs: 32,
    fat: 24,
    ingredientsAdd: [
      { name: "Bacon", amount: "100", unit: "gr" },
      { name: "Linguiça calabresa (yoksa sucuk)", amount: "150", unit: "gr" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karalahana, ince kıyılmış", amount: "1", unit: "su bardağı" },
      { name: "Maydanoz, kıyılmış", amount: "2", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Sıvı yağ"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Bacon ve linguiçayı küp doğrayın, geniş tavada orta ateşte 5 dakika kavurun, yağı tavada bırakın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Aynı yağda soğan ve sarımsağı 3 dakika çevirin.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Yumurtayı tavanın bir kenarında kırıp 2 dakika karıştırarak pişirin, sonra fasulye ile birleştirin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Karalahanayı ekleyip 2 dakika çevirin, karabiberi serpin.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Manyok ununu azar azar serpip 3 dakika kavurun, karışım nemli ama dağılır kalsın. Maydanozla servis edin.", timerSeconds: 180 },
    ],
  },

  // ─── REWRITE 2: feslegenli (Pad Kra Pao Gai) ────────────────
  {
    type: "rewrite",
    slug: "feslegenli-tavuklu-pirinc-tayland-usulu",
    reason:
      "Klasik Tay fesleğenli tavuk Pad Kra Pao Gai stir-fry'dir, pilav ayri piser. Mevcut tarif tek tencere pilav (kategorik yanlis), sarimsak + Thai biber + balik sosu + soya x2 + istiridye sosu + seker + holy basil eksik. Identity rewrite + SOYA + YUMURTA + DENIZ_URUNLERI allergen.",
    sources: [
      "https://en.wikipedia.org/wiki/Phat_kaphrao",
      "https://www.eatingthaifood.com/thai-basil-chicken-recipe-pad-kra-pao-gai/",
      "https://hot-thai-kitchen.com/holy-basil-stir-fry/",
    ],
    description:
      "Pad kra pao gai, Tayland'ın günlük sokak yemeği. Tavuk wokta yüksek ısıda hızla soteleniyor, balık sosu ve soyayla derinleşiyor; son saniye eklenen kutsal fesleğen kokuyu ayağa kaldırıyor. Yanında pilav ve sahanda yumurta servis edilir.",
    prepMinutes: 15,
    cookMinutes: 10,
    totalMinutes: 25,
    averageCalories: 478,
    protein: 32,
    carbs: 48,
    fat: 17,
    allergensAdd: [Allergen.SOYA, Allergen.YUMURTA, Allergen.DENIZ_URUNLERI],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "5", unit: "diş" },
      { name: "Thai bird's eye biber", amount: "3", unit: "adet" },
      { name: "Balık sosu", amount: "1", unit: "yemek kaşığı" },
      { name: "Açık soya sosu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Koyu soya sosu", amount: "1", unit: "tatlı kaşığı" },
      { name: "İstiridye sosu", amount: "1", unit: "yemek kaşığı" },
      { name: "Esmer şeker", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı" },
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Kutsal fesleğen (holy basil) veya Tay fesleğeni", amount: "1", unit: "demet" },
    ],
    ingredientsRemove: ["Fesleğen", "Su"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp 1.5 ölçü pirince 2 ölçü suyla ayrı tencerede pişirin, demlenmeye bırakın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Tavuğu iri kıyım doğrayın, sarımsak ve biberleri havanda kabaca dövün, sos malzemelerini küçük kasede karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Ayrı tavada 1 yemek kaşığı yağ kızdırıp yumurtaları sahanda pişirin, kenarları çıtırlasın, kenara alın.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Wok veya geniş tavayı yüksek ısıda 1 yemek kaşığı yağla kızdırın, sarımsak ve biberi 20 saniye soteleyin.", timerSeconds: 20 },
      { stepNumber: 5, instruction: "Tavuğu ekleyip sürekli karıştırarak 3 dakika pişirin, dışı kapansın, sular çekilsin.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Soslu karışımı dökün, 30 saniye karıştırın, ocaktan almadan fesleğenleri bütün halde ekleyip 5 saniye savurun.", timerSeconds: 35 },
      { stepNumber: 7, instruction: "Tabağa pilavı koyun, üzerine pad kra pao'yu alın, yanına sahanda yumurtayı yerleştirip servis edin.", timerSeconds: null },
    ],
  },

  // ─── DELETE 1: erzsebet-sour-macar-usulu ────────────────────
  {
    type: "delete",
    slug: "erzsebet-sour-macar-usulu",
    reason:
      "Codex halusinasyonu. 'Erzsebet Sour' diye klasik Macar kokteyl yok (Wikipedia opensearch + WebSearch teyitsiz). Mevcut tarif seker surubu + yumurta beyazi eksik basit whiskey sour'a benziyor. Tarif sil, kullanici onayi alindi (oturum 27 mini-rev paketi, AskUserQuestion 'Sil Onerilen').",
    sources: [
      "https://en.wikipedia.org/w/api.php?action=opensearch&search=Erzsebet+sour (no results)",
      "https://en.wikipedia.org/wiki/Whiskey_sour",
      "https://onthesauceagain.com/2016/12/24/drink-like-a-hungarian/",
    ],
  },

  // ─── DELETE 2: findikli-keskek-toplari-ordu-usulu ───────────
  {
    type: "delete",
    slug: "findikli-keskek-toplari-ordu-usulu",
    reason:
      "Codex halusinasyonu + scaffold steps. 'Ordu fındıklı keşkek topu' yöresel yemek yok (ordu.net.tr Gendeme keşkek var ama lapa kıvamı, top değil; coğrafi işaretli alternatif Ordu Fındıklı Burma Tatlısı). Aşurelik buğday 25dk'da pişmez. Tarif sil, kullanıcı onayı alındı.",
    sources: [
      "https://ordu.net.tr/yazi/80/keskek-gendeme/",
      "https://www.kulturportali.gov.tr/turkiye/ordu/neyenir/findikli-burma-tatlisi",
      "https://www.gurmex.com/ordu-mutfagi-yoresel-ordu-yemekleri-tatlilar-ve-lezzetler/",
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-1");
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

    // ─── DELETE op ─────────────────────────────────────────
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
                paket: "oturum-27-mini-rev-batch-1",
              },
            },
          });
        },
        { maxWait: 10_000, timeout: 60_000 },
      );
      console.log(`🗑️  ${op.slug}: silindi (cascade ile RecipeStep + RecipeIngredient + Bookmark + Variation + ...)`);
      deleteApplied += 1;
      continue;
    }

    // ─── REWRITE op ────────────────────────────────────────
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

        // Ingredient remove (case-insensitive name match)
        if (op.ingredientsRemove && op.ingredientsRemove.length > 0) {
          const removeNorm = new Set(op.ingredientsRemove.map(normalize));
          for (const ing of recipe.ingredients) {
            if (removeNorm.has(normalize(ing.name))) {
              await tx.recipeIngredient.delete({ where: { id: ing.id } });
            }
          }
        }

        // Ingredient add (sortOrder = mevcut max + 1, 2, ...)
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
                group: ing.group ?? null,
              },
            });
            added += 1;
          }
        }

        // Steps replace: tum mevcut step'leri sil + yeni listeyi ekle
        // (apply-mod-k pattern stepNumber match ile UPDATE only;
        // burada step sayisi degisebildigi icin tam replace daha temiz)
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
              paket: "oturum-27-mini-rev-batch-1",
              changes: {
                description_revised: !!op.description,
                prep: op.prepMinutes ?? null,
                cook: op.cookMinutes ?? null,
                total: op.totalMinutes ?? null,
                macro: {
                  cal: op.averageCalories ?? null,
                  P: op.protein ?? null,
                  C: op.carbs ?? null,
                  F: op.fat ?? null,
                },
                allergens_added: op.allergensAdd ?? [],
                allergens_removed: op.allergensRemove ?? [],
                ingredients_added: op.ingredientsAdd?.length ?? 0,
                ingredients_removed: op.ingredientsRemove?.length ?? 0,
                steps_replaced: op.stepsReplace?.length ?? 0,
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
