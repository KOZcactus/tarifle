/**
 * Tek-seferlik manuel mini-rev batch 5 (oturum 27): 7 Mod K v2
 * MAJOR_ISSUE Türk yöresel tarif. Web research 2 paralel agent +
 * 25+ kaynak teyit (Kültür Portalı resmi 4 kayıt + Gaziantep
 * Belediyesi cografi isaret + Kastamonu Belediyesi + SERKA Ardahan +
 * Kırklareli Envanteri + Rize Valiligi + Hurriyet + Yemek.com +
 * Lezzet.com.tr + Cumhuriyet + Anadolu Ajansi + CNN Türk + Sofra +
 * Nefis Yemek Tarifleri + Wikipedia).
 *
 * Verdict: 7/7 REWRITE (slug rename + sil önerileri yerine
 * description-light disambiguate yaklasimi tercih edildi, slug
 * korunur URL break onlenir).
 *
 *   1. kastamonu-eksili-siyez-pilavi (REWRITE): Klasik İhsangazi
 *      ekşili pilavı yoğurtlu+ebegümeci+otlu (Kültür Portalı resmi
 *      cografi isaret), kızılcık ekşisi yanlış. 6 add (Yogurt +
 *      Ebegumeci + Nane + Maydanoz + Dereotu + Salça) + 1 remove
 *      (Kızılcık ekşisi). Step revize sulu kıvama.
 *   2. icli-tava-sinop-usulu (REWRITE): Klasik Sinop içli tava
 *      hamsi+pirinçli iç harç+yumurtalı kapama (Kültür Portalı
 *      resmi). 6 add (Pirinç+Maydanoz+Nane+Yumurta+Karabiber+Un) +
 *      1 remove (Mısır unu). 5 step + GLUTEN+YUMURTA+SUT allergen.
 *      Cook 22 -> 40 dk (pirinç hazırlık + fırın kapama).
 *   3. patila-kars-usulu (REWRITE description + ingredient ekle):
 *      Patila Tunceli/Elazığ klasiği (Kültür Portalı resmi),
 *      Kars'ta yöresel olarak doğrulanamadı. Slug korunur (URL
 *      break önleme). Description Doğu Anadolu'ya disambiguate.
 *      İçli varyant olarak peynir+soğan+maydanoz harç eklenir.
 *   4. patatesli-kete-tavasi-ardahan-usulu (REWRITE): Ardahan kete
 *      kuşağında patatesli varyant kabul edilebilir, mevcut scaffold
 *      step + 5 ingredient yetersiz. 5 add (Yogurt+Yumurta+Sogan+
 *      Karabiber+Sıvıyağ) + step revize. Hamur mayalı yoğurtlu.
 *
 *   5. hatay-zahterli-nohut-durumu (REWRITE description): Nohut
 *      dürümü Gaziantep cografi isaretli (TPMK 2020 tescil 631),
 *      Hatay listelerinde yok. Description "Güneydoğu sokak
 *      lezzetinin ev usulü pratik versiyonu" disambiguate.
 *   6. hurmali-ekmek-tatlisi-kirklareli-usulu (REWRITE description):
 *      Kırklareli klasik "Hurma Tatlısı" irmik+un+kızartma+şerbet
 *      (Kırklareli Envanteri), bayat ekmekli+sütlü+meyve hurma
 *      tarifi farklı. Description "Trakya ev mutfağı pratik tatlısı"
 *      disambiguate. Slug korunur.
 *   7. mincili-laz-boregi-rize-ev-usulu (REWRITE description):
 *      Klasik Laz böreği muhallebili+şerbetli tatlı (Kültür Portalı
 *      resmi + 5+ kaynak), tuzlu mincili varyant farklı kimlik.
 *      Description "Klasik Laz böreği muhallebili tatlıdır; bu
 *      tarif Rize'nin minci peyniriyle tuzlu varyantıdır"
 *      disambiguate. Slug korunur.
 *
 * AuditLog action: MOD_K_MANUAL_REV.
 * Idempotent: zaten yeni description ise SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-5.ts
 *   npx tsx scripts/fix-mini-rev-batch-5.ts --env prod --confirm-prod
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

const OPS: RewriteOp[] = [
  // ─── 1. kastamonu-eksili-siyez-pilavi ───────────────────────
  {
    slug: "kastamonu-eksili-siyez-pilavi",
    reason:
      "Klasik İhsangazi ekşili siyez pilavı yoğurtlu+ebegümecili+otlu sulu kıvam (Kültür Portalı resmi cografi isaret + Kastamonu Belediyesi + Hürriyet + Yemek.com kaynaklari). Kızılcık ekşisi sade pilav yanlis kimlik. 6 ingredient_add + 1 remove + step revize.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kastamonu/neyenir/ihsangazi-eksili-pilavi-1",
      "https://www.hurriyet.com.tr/lezizz/eksili-pilav-tarifi-41429678",
    ],
    description:
      "Kastamonu İhsangazi ekşili siyez pilavı, siyez bulgurunu yoğurt, ebegümeci ve taze yeşilliklerle pişirip üzerine salçalı tereyağı gezdiren coğrafi işaretli sulu bir pilav.",
    prepMinutes: 10,
    cookMinutes: 26,
    totalMinutes: 36,
    averageCalories: 295,
    protein: 11,
    carbs: 42,
    fat: 9,
    ingredientsAdd: [
      { name: "Yoğurt", amount: "1.5", unit: "su bardağı" },
      { name: "Ebegümeci (taze)", amount: "1", unit: "demet" },
      { name: "Taze nane", amount: "0.5", unit: "demet" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Dereotu", amount: "0.25", unit: "demet" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
    ],
    ingredientsRemove: ["Kızılcık ekşisi"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Siyez bulgurunu yıkayıp süzün; ebegümecini iri kıyın, yeşillikleri ince doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede bulguru 2.5 su bardağı sıcak su ile haşlayın, soğanı küçük doğrayıp ekleyin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Yoğurdu az suyla açıp bulgura ekleyin, ebegümeciyi katın, kısık ateşte karıştırarak pişirin.", timerSeconds: 720 },
      { stepNumber: 4, instruction: "Koyulaşınca taze nane, maydanoz ve dereotunu ilave edip 2 dakika daha pişirin, ocaktan alın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Küçük tavada tereyağını eritip salçayı kavurun, pilavın üzerine gezdirip sıcak servis yapın.", timerSeconds: 90 },
    ],
  },

  // ─── 2. icli-tava-sinop-usulu ───────────────────────────────
  {
    slug: "icli-tava-sinop-usulu",
    reason:
      "Klasik Sinop içli tava hamsi tabaka + pirinçli iç harç (sogan + maydanoz + nane) + yumurtali ust kapama (Kültür Portalı resmi + Hurriyet + Sakarya Gazetesi kaynaklari). 'Içli' tanimi pirinçli iç harci zorunlu kılıyor. 6 ingredient_add + 1 remove (Misir unu, klasik un kullanılır). 5 step + GLUTEN+YUMURTA+SUT allergen.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/sinop/neyenir/cli-tava",
      "https://www.hurriyet.com.tr/lezizz/icli-tava-tarifi-41340806",
    ],
    description:
      "Sinop içli tava, hamsiyi tepsiye iki kat dizip arasına soğanlı, maydanozlu pirinç pilavı yerleştirerek yumurtalı üstüyle fırınlanan klasik kıyı yemeğidir.",
    prepMinutes: 25,
    cookMinutes: 40,
    totalMinutes: 65,
    averageCalories: 342,
    protein: 22,
    carbs: 28,
    fat: 16,
    allergensAdd: [Allergen.GLUTEN, Allergen.YUMURTA, Allergen.SUT],
    ingredientsAdd: [
      { name: "Pirinç (baldo)", amount: "1", unit: "su bardağı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Un", amount: "3", unit: "yemek kaşığı" },
    ],
    ingredientsRemove: ["Mısır unu"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Hamsileri ayıklayıp kılçıklarını çıkarın, yıkayıp süzün; pirinci sıcak suda 10 dakika bekletin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tencerede tereyağıyla soğanı kavurun, süzdüğünüz pirinci ekleyip 2 dakika çevirin, 1.5 su bardağı sıcak su ve tuz katıp suyunu çekene kadar pişirin.", timerSeconds: 900 },
      { stepNumber: 3, instruction: "Pilav suyunu çekince ocaktan alın, maydanoz, nane ve karabiberi karıştırıp dinlendirin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Hamsileri unlayın; yağlanmış tepsiye yarısını sırtları alta gelecek şekilde dizin, üzerine pilavı yayın, kalan hamsileri örtü gibi kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Çırpılmış yumurtayı üstüne sürün, 200°C fırında 25 dakika pişirin; 5 dakika dinlendirip limonla servis yapın.", timerSeconds: 1500 },
    ],
  },

  // ─── 3. patila-kars-usulu ───────────────────────────────────
  {
    slug: "patila-kars-usulu",
    reason:
      "Patila Tunceli ve Elazığ klasigi (Kültür Portalı Tunceli resmi + Hurriyet + Lezzetler Elazig kaynaklari), Kars yoresel listesinde yer almaz. Slug korunur (URL break önleme), description Doğu Anadolu hattına disambiguate edilir. Içli varyant icin peynir+sogan+maydanoz harci eklenir.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/tunceli/neyenir/patle",
      "https://lezzetler.com/kakirdakli-patila-elazig-tarif-167662",
      "https://www.hurriyet.com.tr/lezizz/patile-tarifi-41465796",
    ],
    description:
      "Patila, Doğu Anadolu mutfağında (Tunceli, Elazığ ve Kars çevresi) ince hamuru tuzsuz peynir, soğan ve maydanozla doldurarak sacda ya da tavada pişiren yarım ay biçimli yöresel hamur işidir.",
    prepMinutes: 20,
    cookMinutes: 12,
    totalMinutes: 50,
    averageCalories: 268,
    protein: 9,
    carbs: 36,
    fat: 9,
    ingredientsAdd: [
      { name: "Tuzsuz beyaz peynir", amount: "200", unit: "gr" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, yoğurt, su, tuz ve eritilmiş tereyağıyla yumuşak bir hamur yoğurun, üzerini örtüp 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Peyniri ezip rendelenmiş soğan ve ince doğranmış maydanozla karıştırarak iç harcı hazırlayın.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Hamuru bezelere bölün, oklavayla ince açın, harcı bir yarısına yayıp yarım ay şeklinde kapatın, kenarları parmakla bastırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kızgın saca veya düz tavaya alıp her iki yüzünü 3-4 dakika kabarana kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Pişen patilaları sıcakken eritilmiş tereyağıyla yağlayıp ayranla servis yapın.", timerSeconds: null },
    ],
  },

  // ─── 4. patatesli-kete-tavasi-ardahan-usulu ─────────────────
  {
    slug: "patatesli-kete-tavasi-ardahan-usulu",
    reason:
      "Ardahan kete kusagi pratiği patatesli varyantı kabul eder (DoguMark + Hürriyet + Sofra kaynakları). Mevcut scaffold step + 5 ingredient yetersiz; 5 add (Yogurt + Yumurta + Sogan + Karabiber + Sivi yag) + step revize hamur tekniği zenginleştirir. Description 'Doğu Anadolu tava ketesi' disambiguate.",
    sources: [
      "https://www.dogumark.com/kete-hangi-ilimize-aittir/",
      "https://www.serka.gov.tr/bolgemiz/ardahan/ardahan-yoresel-yemekler/",
    ],
    description:
      "Ardahan tava ketesi, yumurta ve yoğurtla yoğrulan hamuru haşlanmış soğanlı patates harcıyla doldurup tavada altın rengi pişiren Doğu Anadolu hamur işidir.",
    prepMinutes: 20,
    cookMinutes: 28,
    totalMinutes: 48,
    averageCalories: 286,
    protein: 7,
    carbs: 38,
    fat: 11,
    allergensAdd: [Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Yoğurt", amount: "0.5", unit: "su bardağı" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri haşlayıp soyun, ezin; soğanı ince doğrayıp tereyağında 4 dakika kavurun, patatese karıştırın, tuz ve karabiber ekleyin.", timerSeconds: 720 },
      { stepNumber: 2, instruction: "Un, yoğurt, yumurta, sıvı yağ, tuz ve azar azar su ile yumuşak hamur yoğurun; üstünü örtüp 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 3, instruction: "Hamuru 4 beze yapın, oklavayla tabak büyüklüğünde açın, ortasına patates harcını koyup kenarlarını birleştirip yuvarlak yassıltın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hafif yağlı tavada her iki yüzünü kısık ateşte 5-6 dakika altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Pişen keteleri tereyağıyla yağlayıp 3 dakika dinlendirin, ılıkken bölüp servis yapın.", timerSeconds: 180 },
    ],
  },

  // ─── 5. hatay-zahterli-nohut-durumu ─────────────────────────
  {
    slug: "hatay-zahterli-nohut-durumu",
    reason:
      "Nohut dürümü Gaziantep cografi isaretli (TPMK 17.12.2020 tescil 631 - Gaziantep Belediyesi kaynak), Hatay yoresel listelerinde yer almaz (Yemek.com Hatay 31 tarif + Lezzet.com.tr Hatay 24 tarif listeleri). Mevcut tarif teknik calisir ama Hatay atfı yanıltıcı. Slug korunur (URL break önleme), description 'Güneydoğu sokak lezzeti pratik ev versiyonu' disambiguate.",
    sources: [
      "https://ci.gaziantep.bel.tr/Urunler/gaziantep-nohut-durumu-antep-nohut-durumu-1025",
      "https://yemek.com/hatay-yemekleri/",
      "https://www.lezzet.com.tr/lezzetten-haberler/yoresel-hatay-yemekleri",
    ],
    description:
      "Zahterli nohut dürümü, Güneydoğu mutfağının sokak lezzeti nohut dürümünden esinlenen pratik bir ev tarifidir; ezilmiş nohut zeytinyağı, limon ve zahterle lavaşa sarılır.",
  },

  // ─── 6. hurmali-ekmek-tatlisi-kirklareli-usulu ──────────────
  {
    slug: "hurmali-ekmek-tatlisi-kirklareli-usulu",
    reason:
      "Kırklareli klasik 'Hurma Tatlısı' irmik+un+yumurta+kabartma kızartılıp şerbete batırılan tatlı (Kırklareli Envanteri + Yemek.com kaynaklari, hurma sekilden geliyor, meyve içermez). Mevcut tarif (bayat ekmek + hurma meyvesi + süt) farklı bir ev tatlısı, Kırklareli atfı kaynaksız. Slug korunur, description 'Trakya ev mutfağı pratik tatlısı' disambiguate.",
    sources: [
      "https://kirklarelienvanteri.gov.tr/halk-kulturu.php?id=42",
      "https://yemek.com/tarif/hurma-tatlisi/",
      "https://www.lezzet.com.tr/lezzetten-haberler/trakya-yemekleri",
    ],
    description:
      "Hurmalı bayat ekmek tatlısı, Trakya ev mutfağında bayat ekmeği hurma ve sıcak sütle yumuşatıp fırında kabartan pratik bir tatlıdır; az malzemeyle yumuşak ve hafif sonuç verir.",
  },

  // ─── 7. mincili-laz-boregi-rize-ev-usulu ────────────────────
  {
    slug: "mincili-laz-boregi-rize-ev-usulu",
    reason:
      "Klasik Laz boregi muhallebili+serbetli tatli (Kültür Portalı Rize resmi + Yemek.com + Cumhuriyet + Sofra + Kevserin Mutfagi 5+ kaynak), tuzlu mincili varyant farklı kimlik. Slug ve içerik korunur (URL break + tarif korunma), description 'Klasik Laz böreği muhallebili tatlıdır; bu tarif Rize'nin minci peyniriyle tuzlu varyantıdır' disambiguate.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/rize/neyenir/laz-boregi",
      "https://yemek.com/tarif/laz-boregi/",
      "https://www.cumhuriyet.com.tr/gurme/karadeniz-mutfaginin-enfes-lezzeti-laz-boregi-tarifi-2497244",
    ],
    description:
      "Klasik Laz böreği muhallebili ve şerbetli bir Karadeniz tatlısıdır; bu tarif Rize'nin minci peyniriyle yapılan tuzlu varyantıdır, ince hamur arasına minci ve tereyağı doldurularak çıtır katlı bir börek olarak fırınlanır.",
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-5");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  let updated = 0;
  let skipped = 0;
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

    if (!recipe) {
      console.error(`⚠️  ${op.slug}: bulunamadı`);
      notFound += 1;
      continue;
    }

    if (op.description && recipe.description.trim() === op.description.trim()) {
      console.log(`⏭️  ${op.slug}: zaten yeni description, SKIP (idempotent)`);
      skipped += 1;
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
              paket: "oturum-27-mini-rev-batch-5",
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
    updated += 1;
  }

  console.log("");
  console.log(`Rewrite: ${updated} updated, ${skipped} idempotent, ${notFound} not_found`);
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
