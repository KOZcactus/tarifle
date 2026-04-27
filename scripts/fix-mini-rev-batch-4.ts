/**
 * Tek-seferlik manuel mini-rev batch 4 (oturum 27): 7 Mod K v2
 * MAJOR_ISSUE Türk yöresel tarif. Web research 2 paralel agent +
 * 18+ kaynak teyit (Vikipedi + sinop.ktb.gov.tr + zonguldak.ktb.gov.tr +
 * trabzon.gov.tr resmi + ardaninmutfagi + cahidesultan + lezzetler +
 * lezzet.com.tr + yemek.com + nefisyemektarifleri + kolaylezzet +
 * rumma + karar + kerebiccioguz + yoremantakya + visitzonguldak +
 * biletbayi + hatayyoresel).
 *
 * Verdict: 4 REWRITE + 3 REJECT (kullanici onayi alindi destructive
 * operasyon icin).
 *
 *   1. kerebic-kup-mersin-usulu (REWRITE): Mersin kerebiç cografi
 *      isaretli (TPMK 2003), klasik içli kurabiye + cöven köpügü.
 *      Mevcut muhallebi+krema yapisi yanlis. Tereyagi + Yumurta
 *      sarisi + Cöven otu + Pudra sekeri + Tarçın eklendi, Süt +
 *      Krema cikarildi. YUMURTA allergen.
 *   2. kibe-mumbar (REWRITE): KRITIK data corruption fix - "Kibe"
 *      ingredient olarak yazilmis, dogrusu kuzu iskembesi. Diyarbakir
 *      cografi isaretli (TPMK 28.06.2022). 10 ingredient_add (iskembe
 *      + mumbar + kuzu kusbasi + kuyruk yagi + Karacadag pirinci +
 *      sogan + salça + 4 baharat) + 2 remove (Kibe + Kıyma). Cook
 *      100 -> 180 dk (klasik 2.5 saat).
 *   3. kilis-oruk (REWRITE): Sis kebap formu klasik (kolaylezzet +
 *      rumma kaynaklari), icli köfte degil. Ceviz + Tereyagi cikar,
 *      sogan + sarimsak + 4 baharat ekle. KUSUYEMIS + SUT allergen
 *      kaldir.
 *   4. katikli-ekmek-kilis-usulu (REWRITE description + ingredient):
 *      Hatay/Antakya kanonik (yoremantakya + nefisyemektarifleri),
 *      Kilis atfi kaynaksiz. Description revize, Zahter + Susam +
 *      Cörek otu eklendi, Kekik cikarildi (zahter ile yer degistirme).
 *
 *   5. keskekli-istavrit-tava-sinop-liman-usulu (DELETE): Sinop ktb.
 *      gov.tr resmi listede yok, "liman usulu" uydurma, keskek+balik
 *      kanonik degil. Buday 5dk yumusatma teknik calismaz. Kullanici
 *      onayi alindi.
 *   6. kestaneli-hamsi-pilavi-zonguldak-usulu (DELETE): Zonguldak
 *      ktb.gov.tr resmi listede yok, kestane+hamsi modern fuzyon,
 *      klasik tabaka teknigi uygulanmamis. Kullanici onayi alindi.
 *   7. kayisava-trabzon-usulu (DELETE): "Kayisava" ismi Google'da
 *      sifir sonuc, Trabzon valiligi listesinde yok, icerik aslinda
 *      pekmezli un helvasi (Karadeniz klasigi). Yaniltici. Kullanici
 *      onayi alindi.
 *
 * AuditLog action:
 *   - MOD_K_MANUAL_REV (rewrite)
 *   - MOD_K_REJECT_DELETE (delete)
 * Idempotent: zaten yeni description ise REWRITE SKIP, zaten silinmis
 * ise DELETE SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-4.ts
 *   npx tsx scripts/fix-mini-rev-batch-4.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen, RecipeType } from "@prisma/client";
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
  recipeType?: RecipeType;
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
  // ─── REWRITE 1: kerebic-kup-mersin-usulu ────────────────────
  {
    type: "rewrite",
    slug: "kerebic-kup-mersin-usulu",
    reason:
      "Mersin kerebiç cografi isaretli tatlı (TPMK 2003 tescili). Klasik içli kurabiye kabugu (irmik + tereyagi + yumurta) + Antep fistigi/ceviz iç + cöven köpük (cöven otu + pudra sekeri 30-40 dk çırpma). Mevcut tarif muhallebi+krema yapisi (sut + irmik + krema), kerebiç değil. Hamur + iç dolgu + cöven köpük tekniği eklendi. YUMURTA allergen.",
    sources: [
      "https://tr.wikipedia.org/wiki/Kerebi%C3%A7",
      "https://www.karar.com/yemek-tarifleri/kerebic-tatlisi-nedir-kopugu-nasil-yapilir-hangi-yorenin-kerebic-tarifi-1646507",
      "https://kerebiccioguz.com.tr/blog/kerebic-kopugu-yapmanin-sirlari--adim-adim-rehber-",
    ],
    description:
      "Mersin'in coğrafi işaretli tatlısı kerebiç, irmikli içli kurabiye kabuğunun fıstık dolgusuyla pişip üzerine çöven kökünden çırpılan beyaz köpükle servis edildiği ramazan klasiğidir.",
    prepMinutes: 25,
    cookMinutes: 20,
    totalMinutes: 45,
    averageCalories: 268,
    protein: 5,
    carbs: 28,
    fat: 14,
    allergensAdd: [Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Tereyağı", amount: "100", unit: "gr" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
      { name: "Çöven otu", amount: "20", unit: "gr" },
      { name: "Pudra şekeri", amount: "3", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Süt", "Krema"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Çöven otunu 1 su bardağı suyla bir gece önceden ıslatıp bekletin.", timerSeconds: null },
      { stepNumber: 2, instruction: "İrmik, eritilmiş tereyağı, yumurta sarısı ve 2 yemek kaşığı şekeri yoğurup 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 3, instruction: "Toz Antep fıstığını kalan şeker ve tarçınla karıştırıp iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hamurdan ceviz büyüklüğünde parça alıp avuçta açın, iç harcı koyup kapatarak yuvarlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "180°C fırında 18 dakika hafif pembeleşene kadar pişirin.", timerSeconds: 1080 },
      { stepNumber: 6, instruction: "Çöven suyunu kısık ateşte 10 dakika kaynatıp süzün, pudra şekerini ekleyip beyazlayana kadar çırpın, kerebiçlerin üzerine sürerek servis yapın.", timerSeconds: 600 },
    ],
  },

  // ─── REWRITE 2: kibe-mumbar (KRITIK DATA CORRUPTION FIX) ────
  {
    type: "rewrite",
    slug: "kibe-mumbar",
    reason:
      "KRITIK DATA CORRUPTION: 'Kibe' ingredient olarak yazilmis, dogrusu 'Kuzu iskembesi' (kibe = iskembe Mardin/Diyarbakir lehcesi). Diyarbakir kibe mumbar cografi isaretli (TPMK 28.06.2022). Klasik tarif: kuzu iskembesi + kuzu mumbar + kuzu kusbasi + kuyruk yagi + Karacadag pirinci + sogan + biber salça + baharat. 10 ingredient_add + 2 remove (Kibe + Kiyma). Cook 100 -> 180 dk (klasik 2.5 saat).",
    sources: [
      "https://tr.wikipedia.org/wiki/Mumbar_dolmas%C4%B1",
    ],
    description:
      "Diyarbakır kibe mumbar, kuzu işkembesi ve mumbarın Karacadağ pirinci, kuyruk yağı ve baharatlı kıyma harcıyla doldurulup ağır ateşte saatlerce piştiği coğrafi işaretli bir sakatat yemeğidir.",
    prepMinutes: 90,
    cookMinutes: 180,
    totalMinutes: 270,
    averageCalories: 425,
    protein: 22,
    carbs: 24,
    fat: 26,
    ingredientsAdd: [
      { name: "Kuzu işkembesi", amount: "800", unit: "gr" },
      { name: "Kuzu mumbarı", amount: "800", unit: "gr" },
      { name: "Kuzu kuşbaşı", amount: "300", unit: "gr" },
      { name: "Kuyruk yağı", amount: "80", unit: "gr" },
      { name: "Karacadağ pirinci", amount: "1.5", unit: "su bardağı" },
      { name: "Kuru soğan", amount: "2", unit: "adet" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "1", unit: "çay kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Kibe", "Kıyma"],
    stepsReplace: [
      { stepNumber: 1, instruction: "İşkembe ve mumbarı tuz, un ve sirkeyle iyice ovup soğuk suda 1 saat bekletin, durulayın.", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Pirinci yıkayıp ılık tuzlu suda 20 dakika bekletin, süzün.", timerSeconds: 1200 },
      { stepNumber: 3, instruction: "Kuyruk yağını kavurun, kıyılmış soğanı ekleyip yumuşatın, kuşbaşı eti tutturun, salça, baharat ve pirinci karıştırın.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "İşkembe parçalarını harçla doldurup ağzını iğne iplikle dikin, mumbarı 2 parmak boşluk bırakacak şekilde doldurun.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tencereye dolmaları yerleştirin, üzerini geçecek kadar sıcak su ekleyip 2.5 saat kısık ateşte pişirin.", timerSeconds: 9000 },
      { stepNumber: 6, instruction: "Ateşten alıp kapağı kapalı 10 dakika dinlendirip dilimleyerek servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── REWRITE 3: kilis-oruk ──────────────────────────────────
  {
    type: "rewrite",
    slug: "kilis-oruk",
    reason:
      "Kilis oruk klasigi sis/izgara kebap formu (kolaylezzet + rumma 2 kaynak), icli köfte değil. Ince bulgur + kıyma + sogan + sarimsak + baharat sise dizilir, kömürde közlenir. Ceviz+tereyagi cikar, sogan+sarimsak+4 baharat (kimyon, karabiber, pul biber, tuz) eklendi. KUSUYEMIS+SUT allergen kaldir.",
    sources: [
      "https://www.kolaylezzet.com/kolay-yemek-tarifleri/et-yemekleri/438-oruk-kebabi-bulgurlu-kebap-kilis-simit-kebabi-gaziantep",
      "https://www.rumma.org/yemekler/ana-yemekler/oruk-tarifi-kilis-usulu-oruk-nasil-yapilir.html/",
    ],
    description:
      "Kilis oruk kebabı, ince bulgur ve dana kıymanın sarımsak ve baharatla yoğrulup şişe dizilerek ızgarada közlendiği yağsız bir Güneydoğu kebabıdır.",
    prepMinutes: 35,
    cookMinutes: 15,
    totalMinutes: 50,
    averageCalories: 380,
    protein: 26,
    carbs: 28,
    fat: 16,
    allergensRemove: [Allergen.KUSUYEMIS, Allergen.SUT],
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "1", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Ceviz", "Tereyağı"],
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulguru yarım su bardağı sıcak suyla ıslatıp 15 dakika bekletin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğan ve sarımsağı rendeleyip suyunu sıkın, bulgura ekleyin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Kıyma, baharatlar ve tuzu ekleyip 10 dakika ele yapışmaz hale gelene kadar yoğurun.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Harçtan parmak kalınlığında parçalar koparıp şişlere veya elde uzun köfte şeklinde dizin.", timerSeconds: null },
      { stepNumber: 5, instruction: "İyi yanmış közde her yüzü 4 dakika olacak şekilde 12 dakika çevire çevire pişirin.", timerSeconds: 720 },
      { stepNumber: 6, instruction: "5 dakika dinlendirip yanına soğan piyazı ve közlenmiş biberle servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── REWRITE 4: katikli-ekmek-kilis-usulu ───────────────────
  {
    type: "rewrite",
    slug: "katikli-ekmek-kilis-usulu",
    reason:
      "Katikli ekmek Hatay/Antakya kanonik (yoremantakya.com + nefisyemektarifleri Antakya usulu kaynaklari), Kilis usulu iddiasi kaynaksiz. Klasik: ince hamur + cökelek + biber salça + zeytinyagi + zahter (Hatay yabani kekik) + susam + cörek otu. Description Hatay/Antakya'ya çevrildi, zahter+susam+çörek otu eklendi, Kekik (jenerik) cikarildi (zahter spesifik olur).",
    sources: [
      "https://www.yoremantakya.com/blog/icerik/hatay-usulu-katikli-ekmek-tarifi",
      "https://www.nefisyemektarifleri.com/cokelekli-biberli-katikli-ekmek-antakya-usulu/",
    ],
    description:
      "Hatay Antakya katıklı ekmek, ince hamurun çökelek, biber salçası, zeytinyağı ve zahterli üst harçla buluştuğu, kahvaltıdan ikindiye uzanan klasik bir fırın işidir.",
    prepMinutes: 25,
    cookMinutes: 12,
    totalMinutes: 37,
    averageCalories: 244,
    protein: 8,
    carbs: 31,
    fat: 9,
    ingredientsAdd: [
      { name: "Zahter (yabani kekik)", amount: "1", unit: "çay kaşığı" },
      { name: "Susam", amount: "1", unit: "yemek kaşığı" },
      { name: "Çörek otu", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Kekik"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, ılık su, maya ve bir tutam tuzu yoğurup pürüzsüz bir hamur elde edin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Hamurun üzerini örtüp 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 3, instruction: "Çökelek, biber salçası, zeytinyağı, zahter, çörek otu ve susamı ezerek karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hamuru oklavayla ince açıp tepsiye yayın, harcı kenarlardan 1 cm boşluk bırakarak sürün.", timerSeconds: null },
      { stepNumber: 5, instruction: "220°C önısıtılmış fırında 12 dakika kenarları kızarana kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 6, instruction: "3 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 180 },
    ],
  },

  // ─── DELETE 1: keskekli-istavrit-tava-sinop-liman-usulu ─────
  {
    type: "delete",
    slug: "keskekli-istavrit-tava-sinop-liman-usulu",
    reason:
      "Sinop ktb.gov.tr resmi yoresel listesinde yok (Sinop Halk Mutfagi: nokul, pilaki, mamalika, mısır pastası, içli tava hamsi, kabak millesi vs). 'Liman usulu' uydurma teknik. Keskek+balik kanonik kombinasyon değil. Buday 5dk yumusatma teknik calismaz (klasik keskek 4-6 saat). Kullanici onayi alindi (oturum 27 mini-rev paketi 4).",
    sources: [
      "https://sinop.ktb.gov.tr/TR-74845/halk-mutfagi.html",
      "https://lezzetler.com/keskek-sinop-tarif-110876",
    ],
  },

  // ─── DELETE 2: kestaneli-hamsi-pilavi-zonguldak-usulu ───────
  {
    type: "delete",
    slug: "kestaneli-hamsi-pilavi-zonguldak-usulu",
    reason:
      "Zonguldak ktb.gov.tr resmi listede yok (Zonguldak yoresel: ugmaç corbasi, cevizli dolma, malay, tirit, keskek, cevizli komec). Kestane+hamsi kanonik degil; klasik Karadeniz hamsili pilav (Rize/Trabzon) tabaka teknigiyle hamsi alta-uste dizilir, fırında piser, kestane yok. Mevcut tarif teknik olarak yanlis (hamsi pirincle birlikte tencerede pisiyor). Kullanici onayi alindi.",
    sources: [
      "https://zonguldak.ktb.gov.tr/TR-92609/zonguldak-mutfak-kulturu.html",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-ve-makarna-tarifleri/pilav-tarifleri/karadeniz-usulu-hamsili-pilav-tarifi",
    ],
  },

  // ─── DELETE 3: kayisava-trabzon-usulu ───────────────────────
  {
    type: "delete",
    slug: "kayisava-trabzon-usulu",
    reason:
      "'Kayisava' ismi Google'da 0 sonuç, herhangi bir yoresel kaynakta yok. Trabzon valiligi yoresel tatlilar listesi: hurmali tart, kabak tatlisi, Hamsikoy sutlaci, Laz boregi (kayisava yok). Icerik aslinda pekmezli un helvasi (Karadeniz/Ordu klasigi: un + tereyagi + pekmez + ceviz). Adda 'kayisi' geçtigi halde kayisi yok = kullaniciyi yaniltir. Kullanici onayi alindi.",
    sources: [
      "https://www.trabzon.gov.tr/yoresel-yemeklerimiz",
      "https://yemek.com/tarif/pekmezli-un-helvasi/",
      "https://cahidesultan.com/2011/02/25/pekmezli-un-helvasi/",
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-4");
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
        type: true,
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
                paket: "oturum-27-mini-rev-batch-4",
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
    if (op.recipeType !== undefined) updateData.type = op.recipeType;
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
                group: ing.group ?? null,
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
              paket: "oturum-27-mini-rev-batch-4",
              changes: {
                description_revised: !!op.description,
                type_changed: op.recipeType ? `${recipe.type} -> ${op.recipeType}` : null,
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
