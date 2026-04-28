/**
 * Tek-seferlik manuel mini-rev batch 43 (oturum 31, FINAL): 6 KRITIK fix.
 *
 * Yeni 21-pattern audit kuyruğunun KAPANIŞI 🏁. Paketi 42 sonrası
 * 6 kalan slug. Bu paket ile yeni audit metodoloji (oturum 31'de
 * keşfedilen 8 ek pattern + paketi 25-36'dan 13 mevcut = toplam 21
 * pattern) ile başlayan kuyruk %100 KAPANIR.
 *
 * Verdict: 6 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tahinli-yufka-coregi-ankara-usulu (Ankara): yufka + tahin +
 *      tereyağı + şeker VAR. DB'de ceviz (Ankara klasik tahin çörek
 *      destek) + tarçın + yumurta sarısı (üst sürme) EKSİK. 3
 *      ingredient_add, 6 step replace.
 *
 *   2. welsh-rarebit-bake-ingiliz-usulu (İngiliz, fırın varyantı):
 *      köy ekmeği + cheddar + hardal + süt VAR. DB'de Worcestershire
 *      sosu (rarebit essential!) + un (roux) + kayenne biber + tuz
 *      EKSİK. (Paketi 33 #3 welsh-rarebit-toast farklı slug, bu bake
 *      varyantı.) 4 ingredient_add, 5 step replace.
 *
 *   3. tulumlu-patates-gozleme-van-usulu (Van): un + patates + tulum
 *      peyniri + su + tuz + sıvı yağ VAR. DB'de maydanoz + karabiber
 *      + pul biber EKSİK. 3 ingredient_add, 7 step replace.
 *
 *   4. surk-peynirli-biberli-durum-hatay-usulu (Hatay): lavaş + sürk
 *      + köz biber + zeytinyağı VAR. DB'de pul biber + kekik (Antakya
 *      imzası) + maydanoz EKSİK. 3 ingredient_add, 6 step replace.
 *
 *   5. zahterli-lor-tost-hatay-usulu (Hatay): köy ekmeği + lor +
 *      zahter + domates + zeytinyağı VAR. DB'de tuz + karabiber +
 *      sumak (Hatay imzası) EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   6. tahinli-pekmezli-krep-sakarya-usulu (Sakarya): un + süt +
 *      yumurta + tahin + pekmez VAR. DB'de tuz tutamı + tereyağı
 *      (yağlama) + ceviz (Sakarya tahin pekmez destek) EKSİK. 3
 *      ingredient_add, 6 step replace.
 *
 * Toplam: 19 ingredient_add + 35 step replace + 12 BOILERPLATE LEAK
 * FIX.
 *
 * Bu paket ile:
 * - **Yeni audit pattern kuyruğu %100 KAPANIŞ** (paketi 37-43, 7
 *   ardışık paket, 47 tarif kapatıldı: 7+7+7+7+7+7+6=48 (math: 41
 *   slug + paketi 37 7 slug = 41 → 41+7=48; paketi 37 daha önceki 41
 *   içinden 7 yıkım = 41-7=34, sonra 34+yeni audit eklenen detection
 *   ile 41'den paketi 38-43 ile kademe kademe kapanış. Toplam 47
 *   tarif (paketi 37 7 + 38-43 ile 7+7+7+7+7+6 = 41 + 7 = **48**)).
 * - Mini-rev kümülatif **282** (oturum 31 toplam +92).
 * - Verify-untracked kuyruk: 27 (paketi 39 sonrası) + paketi 37 keşif
 *   ile 41 = 41 toplam yeni; paketi 38-43 ile 41-48 = -7 (1 fazla
 *   detection paketi 37'de eklendi). Sonuç **0** kalan 🏁.
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
  {
    type: "rewrite",
    slug: "tahinli-yufka-coregi-ankara-usulu",
    reason: "REWRITE Ankara tahinli yufka çöreği klasik. DB'de ceviz (Ankara klasik tahin çörek destek) + tarçın + yumurta sarısı (üst sürme) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/ankara/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/tahinli-yufka-coregi",
    ],
    description: "Ankara tahinli yufka çöreği; üç katlı yufkanın eritilmiş tereyağı, tahin ve şekerle yağlanıp dövülmüş ceviz ve tarçın serpilerek rulo sarıldığı, üzerine yumurta sarısı sürülerek 190°C fırında 22 dakika gevrek pişirildiği klasik çay sofrası çöreğidir.",
    ingredientsAdd: [
      { name: "Ceviz", amount: "0.5", unit: "su bardağı" },
      { name: "Tarçın", amount: "1", unit: "tatlı kaşığı" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
    ],
    tipNote: "Tahini eritilmiş tereyağıyla pürüzsüzleştirin; aksi halde yufkaya eşit yayılmaz. Cevizi kabaca dövün; toz haline getirmeyin, çöreğin dokulu lokması için.",
    servingSuggestion: "Ilık çörekleri dilimleyip tabağa alın; üzerine pudra şekeri serpip yanına demli çay ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizleri kabaca dövün; tahin, eritilmiş tereyağı ve şekeri kasede pürüzsüz harç olana kadar karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yufkaları tezgâha açıp her birinin üzerine tahinli harç yayıp ceviz ve tarçın serpin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yufkaları rulo sarıp ek yerleri alta gelecek şekilde yağlanmış tepsiye dizin; üst yüzlerine çırpılmış yumurta sarısı sürün.", timerSeconds: null },
      { stepNumber: 4, instruction: "190°C ısıtılmış fırında 22 dakika üst yüzleri altın renge gelene kadar pişirin.", timerSeconds: 1320 },
      { stepNumber: 5, instruction: "Fırından çıkan çörekleri 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Dilimleyip tabağa alın; üzerine pudra şekeri serpip ılık servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "welsh-rarebit-bake-ingiliz-usulu",
    reason: "REWRITE İngiliz Welsh rarebit bake klasik (fırın varyantı). DB'de Worcestershire sosu (rarebit essential!) + un (roux) + kayenne biber + tuz EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Welsh_rarebit",
      "https://www.bbcgoodfood.com/recipes/welsh-rarebit",
    ],
    description: "İngiliz pub klasiği Welsh rarebit bake; tereyağı ve unla roux yapılıp süt eklenerek pürüzsüzleşen sosa cheddar, hardal, Worcestershire sosu ve kayenne biber katılır, kızarmış ekmek üstüne yayılıp 180°C fırında üst yüzü altın kabarana kadar pişirilir.",
    ingredientsAdd: [
      { name: "Worcestershire sosu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Un", amount: "1", unit: "yemek kaşığı" },
      { name: "Kayenne biber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Cheddarı son anda ekleyin; uzun kaynama yağ ayrılmasına yol açar. Worcestershire sosunu eksik bırakmayın; rarebit'in karakter veren imzasıdır, hardal tek başına bu derinliği vermez.",
    servingSuggestion: "Sıcak rarebit bake'i tabağa alıp üzerine ekstra kayenne biber serpin; yanına dilim turşu, salata yeşillikleri ve Britanya çayı ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cheddarı rendeleyin; ekmekleri kuru tavada veya tostta 2 dakika hafifçe kızartın.", timerSeconds: 120 },
      { stepNumber: 2, instruction: "Küçük tencerede 1 yemek kaşığı tereyağı eritip unu ekleyin, çırpıcıyla 1 dakika roux yapın; sütü ince akıtarak topaklanmadan pürüzsüzleştirin.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Sosa hardal, Worcestershire, kayenne biber ve tuzu ekleyip 1 dakika çevirin; ocaktan alıp cheddar peynirini katarak pürüzsüz krema kıvamı oluşana kadar karıştırın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Kızarmış ekmek dilimlerinin üzerine rarebit sosu kalın yayın; fırın tepsisine dizip 180°C ısıtılmış fırında 12 dakika üst yüzü altın renge gelene kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 5, instruction: "Fırından çıkan dilimleri tabağa alıp üzerine ekstra kayenne biber serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tulumlu-patates-gozleme-van-usulu",
    reason: "REWRITE Van tulumlu patates gözleme klasik. DB'de maydanoz + karabiber + pul biber EKSİK. Step 2+6+7 BOILERPLATE LEAK FIX. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/van/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/tulumlu-gozleme",
    ],
    description: "Van usulü tulumlu patates gözleme; mayasız ince hamurun haşlanmış ezilmiş patates, ufalanmış tulum peyniri, maydanoz, karabiber ve pul biberden oluşan harçla doldurulup tavada iki yüzü altın renge gelene kadar pişirildiği Doğu Anadolu kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Patatesleri haşladıktan sonra iyi süzdürün; aksi halde harç sulanır, hamur dağılır. Tulum peyniri çok tuzluysa lor karıştırın veya patates oranını artırın; aksi halde gözleme fazla tuzlu olur.",
    servingSuggestion: "Sıcak gözlemeyi üçgen dilimleyip tabağa alın; yanına ev yoğurdu, dilim domates ve demli çayla Van kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, su ve tuzu yoğurma kabında birleştirip pürüzsüz hamur olana kadar 6 dakika yoğurun; üzerini örtüp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Patatesleri kabuklu haşlayıp soyduktan sonra çatalla ezin; tulum peynirini ufalayıp ezilmiş patates, maydanoz, karabiber ve pul biberle harmanlayarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru bezelere bölüp her birini yufka inceliğinde açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yufkanın yarısına iç harcı yayıp diğer yarısını üstüne kapatarak kenarlarını bastırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp az sıvı yağla yağlayın; gözlemeleri 6 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 6, instruction: "Gözlemeleri tabağa alıp üzerlerini eritilmiş tereyağıyla fırçalayın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Üçgen dilimleyip sıcak servis edin; yanına yoğurt iyi gider.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "surk-peynirli-biberli-durum-hatay-usulu",
    reason: "REWRITE Hatay sürk peynirli biberli dürüm klasik. DB'de pul biber + kekik (Antakya imzası) + maydanoz EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/surk-durum",
    ],
    description: "Hatay usulü sürk peynirli biberli dürüm; lavaşa Antakya'nın baharatlı sürk peyniri, közlenmiş biber, kekik, pul biber ve maydanozdan oluşan harç sürülerek dürüm formunda sarılan, baharatlı ve hızlı kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote: "Sürk peyniri kendi başına yoğun ve baharatlı; ek tuz katmayın. Köz biberi taze yoksa kavanoz közlenmiş biber kullanılabilir; suyunu sıkıp doğrayın.",
    servingSuggestion: "Dürümü ortadan dilimleyip tabağa alın; yanına ev yoğurdu, dilim salatalık ve demli çayla Antakya kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sürk peynirini çatalla ufalayın; köz biberini ince doğrayın, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sürk, köz biber, maydanoz, kekik, pul biber ve zeytinyağını kâsede karıştırarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp lavaşları 30 saniye iki yüzü hafifçe ısıtarak esnetin.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Lavaşları tezgâha açıp iç harcı eşit yayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Lavaşları sıkıca dürüm formunda sarın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Dürümleri ortadan dilimleyip tabağa alın; sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "zahterli-lor-tost-hatay-usulu",
    reason: "REWRITE Hatay zahterli lor tost klasik. DB'de tuz + karabiber + sumak (Hatay imzası, zahter destek) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/zahterli-lor-tost",
    ],
    description: "Hatay usulü zahterli lor tost; köy ekmeği dilimlerinin arasına lor peyniri, zahter, sumak ve dilim domatesten oluşan harç yerleştirilerek tavada altın renge gelene kadar pişirildiği, Antakya kahvaltısının çıtır kokulu sabah tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Lor peynirinin nemini tülbentle 5 dakika süzdürün; aksi halde tost sulanır. Zahteri zeytinyağıyla 3 dakika önce buluşturun; aroma derinleşir.",
    servingSuggestion: "Sıcak tostları çapraz dilimleyip tabağa alın; üzerlerine ekstra sumak serpin, yanına dilim salatalık ve demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini tülbentle 5 dakika süzdürüp çatalla ezin; zahter, sumak, tuz, karabiber ve zeytinyağıyla harmanlayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Domatesi 3 mm halkalar halinde dilimleyin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Bir ekmek diliminin üzerine lor harcını yayıp dilim domatesleri yerleştirin; üzerine ikinci ekmeği kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavada orta ateşte 6 dakika tostları iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Tostları çapraz dilimleyip tabağa alın; üstüne ekstra sumak serpip sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tahinli-pekmezli-krep-sakarya-usulu",
    reason: "REWRITE Sakarya tahinli pekmezli krep klasik. DB'de tuz tutamı + tereyağı (yağlama) + ceviz (Sakarya tahin pekmez destek) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/sakarya/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tahinli-krep",
    ],
    description: "Sakarya usulü tahinli pekmezli krep; un, süt, yumurta ve tuz tutamından oluşan ince hamur tereyağında ince katmanlar halinde pişirilir, üzerine tahin sürülüp üzüm pekmezi gezdirilerek dövülmüş cevizle taçlanır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Ceviz", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote: "Krep hamurunu çırptıktan sonra 5-10 dakika dinlendirin; gluten gevşer, krepler daha esnek olur. Tahini pekmez ile karıştırmayın; ayrı sürmek tatlı tuzlu denge için anahtar.",
    servingSuggestion: "Krepleri katlayıp tabağa alın; üstlerine ekstra pekmez gezdirip dövülmüş ceviz serpin, yanına demli çayla Sakarya kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizleri kabaca dövün; tuz tutamı, un, süt ve yumurtayı derin kâsede pürüzsüz akışkan hamur olana kadar çırpın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Hamuru üzeri örtülü 5 dakika dinlendirin; gluten gevşesin.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta ateşte ısıtıp tereyağıyla yağlayın; her krep için 1 küçük kepçe hamur dökün, tavayı eğerek ince yayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Krepin üst yüzü mat olunca (yaklaşık 1 dakika) çevirip diğer yüzünü 30 saniye pişirin; tabağa alın ve diğer kreplerle aynı şekilde devam edin.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "Her krepin yarısına tahini sürüp üzerine pekmezi gezdirin; dövülmüş cevizi serpin, yarım katlayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Krepleri tabağa alıp üzerine ekstra pekmez damlatıp ekstra ceviz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-43");
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
              paket: "oturum-31-mini-rev-batch-43-FINAL",
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
