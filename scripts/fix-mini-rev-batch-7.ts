/**
 * Tek-seferlik manuel mini-rev batch 7 (oturum 27): 7 Mod K v2
 * MAJOR_ISSUE Türk yöresel + yabancı klasik tarif. Web research 2
 * paralel agent + 18+ kaynak (Wikipedia + UNESCO + IBA-world +
 * perudelights + amigofoods + Hurriyet Lezizz + Lezzetler.com +
 * Diyarbakir Kent Portali + Samsun ktb.gov.tr + Lezzet + Yemek.com
 * + Bafra Pidecisi + Anadolu Gezi Rehberi).
 *
 * Verdict: 5 REWRITE + 2 REJECT (kullanici onayi alindi).
 *
 *   1. peynirli-kabak-mucver-tostu-bursa-usulu (REWRITE light):
 *      Bursa klasikleri Iskender/Cantik/pideli/Kemalpasa tatlisi,
 *      mucver tost atfi yok. Description Bursa kaldir, 'pratik ev
 *      formulu' jenerik. Tuz + Karabiber + Tereyagi ekle.
 *   2. pezik-mucveri-diyarbakir-usulu (REWRITE yore duzelt): Pezik
 *      (pazi sapi) mucveri Karadeniz/Giresun/Ordu klasigi (Hurriyet
 *      Lezizz + Lezzetler.com), Diyarbakir mutfagi et agirlikli +
 *      kabak meftunesi/kenger borani/kuru dolma cografi isaret. Title
 *      'Karadeniz Pezik Mucveri'. 6 ingredient_add (peynir + dereotu
 *      + maydanoz + misir unu + karabiber + sarimsak) + step revize.
 *      SUT allergen.
 *   3. picarones-kup-tatlisi-peru-usulu (REWRITE form/icerik):
 *      Picarones Lima somurge donemi tatli, klasik halka formu,
 *      tatli patates + bal kabagi 50/50 + maya + anason hamur,
 *      chancaca + tarcin + karanfil surup. 'Kup' formu kanonik
 *      degil. Title 'Picarones (Peru Usulu Halka Tatli)'. Tatli
 *      patates eklendi, surup detaylandirildi.
 *   4. pina-colada (REWRITE + KRITIK CUISINE FIX): cuisine **in**
 *      (Hint!) tamamen yanlis. Porto Riko ulusal kokteyli (1978
 *      resmi, 1954 Caribe Hilton Ramon Marrero, IBA klasik). En
 *      yakin Karayip temsil **cu** (Kuba). Lime IBA klasiginde yok
 *      (modern varyant), purist tarif icin cikarildi.
 *   5. pupusa (REWRITE + KRITIK CUISINE FIX): cuisine **cn** (Çin!)
 *      kabul edilemez. El Salvador ulusal yemegi, Pipil halki on-
 *      Kolomb mirasi, 2018 WTO denominacion de origen, 2022 UNESCO
 *      ICH. Mezoamerika misir flatbread. **mx** (Meksika) en yakin
 *      temsil. Curtido (lahana tursusu) yan servis eklendi.
 *
 *   6. peynirli-yesil-mercimek-borek-yozgat-usulu (DELETE): Yozgat
 *      boregi (ispanak+pastirma) klasik, mercimekli borek listede
 *      yok. Yore atfi temelsiz. Kullanici onayi alindi.
 *   7. pirasali-misir-unlu-pide-samsun-usulu (DELETE): Samsun Bafra
 *      pidesi bugday unu klasik (samsun.ktb.gov.tr resmi tescil),
 *      misir unu pide hamurunda anomali. Pirasali pide Of/Trabzon
 *      yaygin, Samsun yoresel atfi yok. Kullanici onayi alindi.
 *
 * AuditLog action: MOD_K_MANUAL_REV (rewrite) / MOD_K_REJECT_DELETE
 * (delete). Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-7.ts
 *   npx tsx scripts/fix-mini-rev-batch-7.ts --env prod --confirm-prod
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
  newTitle?: string;
  description?: string;
  cuisine?: string;
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
  // ─── REWRITE 1: peynirli-kabak-mucver-tostu-bursa ────────────
  {
    type: "rewrite",
    slug: "peynirli-kabak-mucver-tostu-bursa-usulu",
    reason:
      "Bursa klasikleri Iskender + Cantik + pideli kofte + Kemalpasa tatlisi (lezzet.com.tr resmi yoresel + Yemek.com 14 maddelik liste), kabak mucver tost atfi yok. Modern fuzyon ev kahvaltisi. Description Bursa atfi kaldir, jenerik 'pratik ev formulu'. 3 ingredient_add (Tuz + Karabiber + Tereyagi) + 5 step revize.",
    sources: [
      "https://www.lezzet.com.tr/lezzetten-haberler/bursanin-yoresel-yemekleri",
      "https://yemek.com/bursa-yemekleri/",
    ],
    description:
      "Peynirli kabak mücver tostu, mücver harcını ekmek arasında kaşarla buluşturarak dışı çıtır içi yumuşak bir kahvaltı tabağı verir. Pratik bir ev formülü, yöresel klasik değil.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "1", unit: "tutam" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabakları rendeleyip tuz serpin, 6 dakika bekletin ve elinizle suyunu sıkın.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "Suyunu sıktığınız kabağı yumurta, un, karabiber ve bir tutam tuzla 3 dakika karıştırarak harç hazırlayın.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Ekmek dilimlerinin içine harcı eşit yayın, üzerine kaşar peynirini paylaştırıp kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tereyağıyla yağlanmış tavada veya tost makinesinde her yüzünü 4 dakika altın renge gelene kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Tostları 2 dakika dinlendirip dilimleyin, peynir keserken akmasın.", timerSeconds: 120 },
    ],
  },

  // ─── REWRITE 2: pezik-mucveri-diyarbakir (yore duzelt) ───────
  {
    type: "rewrite",
    slug: "pezik-mucveri-diyarbakir-usulu",
    reason:
      "Pezik (pazi sapi) mucveri Karadeniz/Giresun/Ordu klasigi (Hurriyet Lezizz + Lezzetler.com 2 kaynak), Diyarbakir mutfagi et agirlikli + kabak meftunesi/kenger borani/kuru dolma cografi isaret (diyarbakir.org.tr). Sebze yemekleri Diyarbakir'da az. Description Karadeniz'e duzeltildi (slug korunur URL break onleme). 6 ingredient_add (peynir + dereotu + maydanoz + misir unu + karabiber + sarimsak) + step revize. SUT allergen.",
    sources: [
      "https://www.hurriyet.com.tr/lezizz/mucver-nasil-yapilir-pezik-pazi-mucveri-tarifi-41065613",
      "https://yoresel.lezzetler.com/pezik-pazi-kavurmasi-ordu-vt80941",
      "https://diyarbakir.org.tr/kesfet/gastronomi/",
    ],
    description:
      "Karadeniz pezik mücveri, pazı sapı ve yapraklarını otlu peynirli harçla birleştirip tavada altın renge gelene kadar kızartan, Giresun ve Ordu mutfağında sevilen sıcak bir ara öğündür.",
    averageCalories: 218,
    protein: 9,
    carbs: 18,
    fat: 12,
    allergensAdd: [Allergen.SUT],
    ingredientsAdd: [
      { name: "Beyaz peynir", amount: "100", unit: "gr" },
      { name: "Dereotu", amount: "0.5", unit: "demet" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Mısır unu", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "1", unit: "çay kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Pazının saplarını ve yapraklarını yıkayın, sapları ince doğrayıp 8 dakika haşlayıp süzün, yaprakları ince kıyın.", timerSeconds: 480 },
      { stepNumber: 2, instruction: "Otları, ezilmiş peyniri, rendelenmiş sarımsağı bir kasede karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yumurta, un, mısır unu, karabiber ve haşlanmış pazı saplarını ekleyip koyu bir harç oluşturun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Ayçiçek yağını orta ateşte ısıtıp harçtan kaşıkla küçük porsiyonlar bırakın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Mücverleri her yüzü altın renge gelene kadar toplam 7 dakika pişirin.", timerSeconds: 420 },
      { stepNumber: 6, instruction: "Kağıt havluya alıp yağını süzdürün, 3 dakika dinlendirip yoğurtla servis edin.", timerSeconds: 180 },
    ],
  },

  // ─── REWRITE 3: picarones-kup-tatlisi-peru ───────────────────
  {
    type: "rewrite",
    slug: "picarones-kup-tatlisi-peru-usulu",
    reason:
      "Picarones Lima somurge donemi klasik tatlisi (Wikipedia + perudelights + amigofoods 3 kaynak). Klasik hamur: tatli patates + bal kabagi 50/50 + un + maya + anason. Halka formunda kizartilir. Surup chancaca (Peru panela) + tarcin + karanfil. Mevcut tarif tatli patates yok + halka formu yerine 'kup' yanliştir. Description form duzelt + tatli patates puresi eklendi + maya + anason + karanfil eklendi. Kup formu icerikten cikti (hamur halka olur).",
    sources: [
      "https://en.wikipedia.org/wiki/Picarones",
      "https://perudelights.com/picarones-peruvian-doughnuts-bunuelos-or-beignets-are-one-of-a-kind/",
    ],
    description:
      "Picarones, bal kabağı ve tatlı patates püresinden hazırlanan mayalı hamurun halka formunda kızartılıp chancaca şurubuyla servis edildiği klasik bir Peru tatlısıdır. Lima sömürge mutfağında doğmuştur.",
    prepMinutes: 20,
    cookMinutes: 15,
    totalMinutes: 95,
    averageCalories: 280,
    protein: 4,
    carbs: 38,
    fat: 12,
    ingredientsAdd: [
      { name: "Tatlı patates püresi", amount: "0.5", unit: "su bardağı" },
      { name: "Kuru maya", amount: "1", unit: "çay kaşığı" },
      { name: "Anason tohumu", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karanfil", amount: "2", unit: "adet" },
      { name: "Tarçın çubuğu", amount: "1", unit: "adet" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Bal kabağı ve tatlı patates püresini ılık suda erittiğin mayayla karıştır, un ve anason tohumunu ekleyip pürüzsüz hamur yoğur, üstünü örtüp 60 dakika mayalandır.", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Eli yağla, hamurdan ceviz büyüklüğünde parça al, ortasına parmakla delik açıp halka şekillendir.", timerSeconds: null },
      { stepNumber: 3, instruction: "175°C derin yağda her tarafı altın renge gelene kadar 4-5 dakika kızart, kağıt havluya al.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Esmer şeker, tarçın çubuğu, karanfil ve yarım su bardağı suyu kısık ateşte 10 dakika pişirip koyu kıvama getir.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Sıcak picarones'i tabağa al, üzerine sıcak chancaca şurubu gezdirip hemen servis et.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 4: pina-colada (KRITIK CUISINE FIX in→cu) ──────
  {
    type: "rewrite",
    slug: "pina-colada",
    reason:
      "KRITIK CUISINE FIX: in (Hint!) -> cu (Karayip/Kuba). Pina Colada Porto Riko ulusal kokteyli (1978 resmi ilan, 1954 Caribe Hilton Ramon Marrero, IBA klasik resmi tarif). Tarifle CUISINE_CODES'ta Porto Riko yok, en yakin Karayip rom kokteyl ailesi cu (Kuba: daiquiri, mojito ailesi). Lime IBA klasik tarifte yok (modern varyant), purist icin cikarildi. Description Caribe Hilton 1954 tarihci.",
    sources: [
      "https://en.wikipedia.org/wiki/Pi%C3%B1a_colada",
      "https://iba-world.com/pina-colada/",
    ],
    cuisine: "cu",
    description:
      "Piña Colada, beyaz rom, taze ananas suyu ve hindistan cevizi kremasıyla hazırlanan Karayip klasiği kokteyldir. Porto Riko'nun 1978'den beri ulusal içkisi olarak kabul edilir, 1954'te Caribe Hilton bar şefi Ramón Marrero tarafından geliştirilmiştir.",
    ingredientsRemove: ["Lime suyu"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğutulmuş büyük kadehi servis için hazırlayın, ananas dilimi ve kokteyl kirazını süs için ayırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Beyaz rom, taze ananas suyu ve hindistan cevizi kremasını blender haznesine alın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Kırık buzu ekleyip 15 saniye yüksek devirde karıştırın, krema ayrışmasın.", timerSeconds: 15 },
      { stepNumber: 4, instruction: "Karışımı soğutulmuş kadehe boşaltın, kremsi doku bozulmasın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Ananas dilimi ve kokteyl kirazıyla süsleyip pipetle servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 5: pupusa (KRITIK CUISINE FIX cn→mx) ───────────
  {
    type: "rewrite",
    slug: "pupusa",
    reason:
      "KRITIK CUISINE FIX: cn (Çin!) -> mx (Meksika/Mezoamerika). Pupusa El Salvador ulusal yemegi, Pipil halki on-Kolomb mirasi, Nawat dilinden 'yumusak/sismik' anlami. 2018 WTO denominacion de origen El Salvador'a tescil. 2022 UNESCO Somut Olmayan Kulturel Miras (kasim 2. pazari Ulusal Pupusa Gunu). Tarifle CUISINE_CODES'ta El Salvador kodu yok, en yakin temsil mx (Mezoamerika misir flatbread ailesi: tortilla, sope, gordita). Klasik dolgu queso + frijoles + chicharron, klasik yan servis curtido (lahana tursusu) + salsa roja. Curtido eklendi.",
    sources: [
      "https://en.wikipedia.org/wiki/Pupusa",
      "https://ich.unesco.org/en/state/el-salvador-SV",
    ],
    cuisine: "mx",
    description:
      "Pupusa, mısır hamurunun içine peynir, fasulye veya kıyma doldurularak tavada pişirilen kalın bir flatbread'dir. El Salvador'un ulusal yemeğidir, Pipil halkından miras kalmıştır ve geleneksel olarak curtido lahana turşusu ile servis edilir.",
    ingredientsAdd: [
      { name: "Beyaz lahana turşusu (curtido)", amount: "1", unit: "su bardağı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Masa harina, tuz ve ılık suyu yoğurup yumuşak bir hamur hazırlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Hamuru 10 dakika dinlendirin, mısır unu suyu eşit çeksin ve kenarlar çatlamasın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Hamurdan parçalar alın, ortasına peynir ve fasulye koyun, kapatıp avuç içinde 1 cm kalınlıkta yassılaştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yağsız tavada orta ateşte her yüzünü 4 dakika kabarana kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Sıcak pupusaların üzerine curtido lahana turşusu yerleştirip hemen servis edin.", timerSeconds: null },
    ],
  },

  // ─── DELETE 1: peynirli-yesil-mercimek-borek-yozgat ──────────
  {
    type: "delete",
    slug: "peynirli-yesil-mercimek-borek-yozgat-usulu",
    reason:
      "Yozgat klasik mutfaginda 'peynirli yesil mercimek borek' yok (Yozgat boregi ispanak+pastirma klasik, altust boregi, mercimekli bulgur pilavi - Yemek.com 14 maddelik resmi liste). Yore atfi temelsiz + jenerik mercimekli borek de Yozgat'a ozgu degil. Kullanici onayi alindi.",
    sources: [
      "https://yemek.com/yozgat-yemekleri/",
    ],
  },

  // ─── DELETE 2: pirasali-misir-unlu-pide-samsun ──────────────
  {
    type: "delete",
    slug: "pirasali-misir-unlu-pide-samsun-usulu",
    reason:
      "Samsun klasik pidesi Bafra pidesi + Terme pidesi (samsun.ktb.gov.tr resmi tescil), bugday unu hamur. Misir unu pide hamurunda anomali (Karadeniz misir unu ekmek/kuymak/pisi'de kullanilir, pide degil). Pirasali pide Of/Trabzon yaygin, Samsun spesifik atfi yok. Kullanici onayi alindi.",
    sources: [
      "https://samsun.ktb.gov.tr/TR-273247/bafra-pidesi.html",
      "https://www.lezzet.com.tr/lezzetten-haberler/samsunun-yoresel-yemekleri",
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-7");
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
        cuisine: true,
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
                paket: "oturum-27-mini-rev-batch-7",
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
    if (op.cuisine !== undefined) updateData.cuisine = op.cuisine;
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
              paket: "oturum-27-mini-rev-batch-7",
              changes: {
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
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

    console.log(`✅ ${op.slug}: REWRITE applied${op.cuisine ? ` (cuisine ${recipe.cuisine} -> ${op.cuisine})` : ""}`);
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
