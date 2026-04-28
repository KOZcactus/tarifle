/**
 * Tek-seferlik manuel mini-rev batch 38 (oturum 31 ek): 7 KRITIK fix.
 *
 * Paketi 37 sonrası 41 kalan kuyruğun yeni top 1-7 (yeni 8 pattern
 * dahil). Klasik kanonik tamamlama + jenerik scaffold temizleme.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. zaatarli-labneh-gozleme-levant-usulu (Levant, 3 pattern):
 *      hamur + labneh + zahter + zeytinyağı + su VAR. DB'de tuz +
 *      susam (zahter destek) + sumak (Levant imzası) EKSİK.
 *      3 ingredient_add, 5 step replace.
 *
 *   2. yulaf-lapasi (klasik, 3 pattern): 6 malzeme dolu. DB'de tuz
 *      tutamı + vanilya EKSİK. Step 1+2+6+7 BOILERPLATE LEAK x4.
 *      2 ingredient_add, 7 step replace.
 *
 *   3. yaglisi-giresun-usulu (Giresun, 3 pattern): un + ılık su +
 *      kolot + tereyağı + maya + yumurta VAR. DB'de tuz (hamur
 *      essential!) + karabiber + mısır unu (Karadeniz opsiyonel)
 *      EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   4. tamago-sando-japon-kafe-usulu (Japon, 3 pattern): yumurta +
 *      süt ekmeği + mayonez + tuz VAR. DB'de karabiber + hardal
 *      (Japon kewpie tarz tatlandırma) + toz şeker (Kewpie tatlı
 *      imza) EKSİK. 3 ingredient_add, 6 step replace.
 *
 *   5. yulafli-cheddar-griddle-cake-ingiltere-usulu (İngiltere, 3
 *      pattern): yulaf unu + un + cheddar + tereyağı + süt VAR. DB'de
 *      tuz + kabartma tozu (griddle cake essential!) + karabiber
 *      EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   6. yumurtali-ispanak-kavurmasi-karadeniz-usulu (Karadeniz, 3
 *      pattern): ıspanak + soğan + yumurta + tereyağı + tuz VAR.
 *      DB'de karabiber + sarımsak + mısır unu (Karadeniz dible imzası
 *      opsiyonel bağlayıcı) EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   7. susamli-corek-eskisehir-usulu (Eskişehir, 3 pattern): un + süt
 *      + maya + susam + tereyağı VAR. DB'de tuz + toz şeker (maya
 *      aktivasyon) + yumurta (üst sürme) EKSİK. SLUG LEAK FIX step 5
 *      'susamli-corek-eskisehir-usulu akışı için' (slug DB'ye yazılmış!).
 *      3 ingredient_add, 6 step replace.
 *
 * Toplam: 20 ingredient_add + 39 step replace + 12 BOILERPLATE LEAK
 * FIX + 1 SLUG LEAK FIX (#7).
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
    slug: "zaatarli-labneh-gozleme-levant-usulu",
    reason: "REWRITE Levant zahter+labneh gözleme klasik tamamlama. DB'de tuz + susam (zahter destek) + sumak (Levant imzası) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.maureenabood.com/zaatar-manakish/",
      "https://en.wikipedia.org/wiki/Manakish",
    ],
    description: "Levant sofralarının zahterli labneh gözlemesi; ince hamurun zeytinyağında dinlenmiş zahter, ezilmiş labneh ve sumakla doldurulup tavada iki yüzü çıtırlaştığı kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Susam", amount: "1", unit: "yemek kaşığı" },
      { name: "Sumak", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote: "Zahteri zeytinyağıyla 5 dakika önceden buluşturun; aroma derinleşir. Labnehi tülbentle 5 dakika süzdürün; gözleme nemlenmesini önler.",
    servingSuggestion: "Üçgen dilimleyip tabağa alın; üstüne taze nane, dilim domates ve zeytinle Levant kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, tuz ve suyu yoğurma kabında 6 dakika çalışıp pürüzsüz hamur elde edin; üzerini örtüp 10 dakika dinlendirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Labnehi çatalla ezip içine zahter, sumak ve 1 yemek kaşığı zeytinyağını katarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru 4 bezeye bölüp her birini ince yufka açın; üst yüzüne susam serpin, içine harcı yayıp katlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavada gözlemeleri orta-kısık ateşte 8 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Tabağa alıp üçgen dilimleyerek sıcak servis edin; üstüne ekstra zeytinyağı ve sumak gezdirin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "yulaf-lapasi",
    reason: "REWRITE klasik yulaf lapası tamamlama. DB'de tuz tutamı + vanilya EKSİK. Step 1+2+6+7 BOILERPLATE LEAK x4. 2 ingredient_add, 7 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/perfect-porridge",
      "https://www.delish.com/cooking/recipe-ideas/recipes/a58293/best-oatmeal-recipe/",
    ],
    description: "Yulaf lapası, yulaf ezmesinin sütle yavaş ısıda pişirilip vanilya ve tuz tutamıyla dengelendikten sonra muz, bal, ceviz ve tarçınla servis edildiği sıcak ve doyurucu bir kahvaltı kasesidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Yulaf-süt oranını 1:2 koruyun; daha az süt katı, daha çok süt akışkan lapa verir. Tuz tutamı şart; tatlandırıcı dengesi için anahtar.",
    servingSuggestion: "Servis kâsesine alıp dilim muz, bal gezdirin; üstüne ceviz ve tarçın serpin, isteğe bağlı bir tutam tuz ekleyebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yulaf ezmesini ölçüp kâseye alın; muzu dilimleyin, cevizi kabaca dövün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Küçük tencereye süt, yulaf, tuz ve vanilyayı ekleyip orta ateşe alın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Karışım kaynamaya başlayınca ateşi kısın, sürekli karıştırarak 7-8 dakika lapa kıvamına gelene kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Ocaktan alıp 2 dakika dinlendirin; lapa biraz daha koyulaşır.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Servis kâsesine paylaştırıp üstüne dilim muz, bal, ceviz ve tarçın serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "İsteğe bağlı sıcak süt veya yoğurtla tamamlayın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Sıcak servis edin; uzun bekletme dokuyu yoğunlaştırır, gerekirse 1-2 yemek kaşığı ılık süt ile açın.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "yaglisi-giresun-usulu",
    reason: "REWRITE Giresun yağlısı tamamlama. DB'de tuz (hamur essential!) + karabiber + mısır unu (Karadeniz opsiyonel) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/giresun/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/giresun-yaglisi",
    ],
    description: "Giresun yağlısı; mayalı hamurun açılıp ortasına kolot peyniri ve tereyağı yatırılmasıyla katlanıp 220°C fırında üst yüzü altın renge gelene kadar pişirilen, Karadeniz kahvaltılarının sıcak fırın işidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Mısır unu", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote: "Hamuru yoğurduktan sonra 30 dakika mayalanmaya bırakın; yağlının kabarık dokusunun anahtarı. Kolot peynirini iri parçalar halinde dağıtın; eridiğinde havuzlar oluşturur.",
    servingSuggestion: "Sıcak yağlıyı dilimleyip tabağa alın; yanına ev yoğurdu veya karadeniz cacığıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, tuz, mısır unu ve mayayı karıştırıp ılık suyla yumuşak hamur yoğurun; üzerini örtüp 30 dakika mayalandırın.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Hamuru tezgâha alıp yuvarlak açın; ortasına ezilmiş kolot peynirini, küp doğranmış tereyağını ve karabiberi yerleştirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamurun kenarlarını ortada birleştirip kapatın; tepsiye alıp üzerini çırpılmış yumurtayla fırçalayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "220°C ısıtılmış fırında 14 dakika üst yüzü altın renge gelene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 5, instruction: "Fırından çıkan yağlıyı 5 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 300 },
    ],
  },
  {
    type: "rewrite",
    slug: "tamago-sando-japon-kafe-usulu",
    reason: "REWRITE Japon tamago sando klasik tamamlama. DB'de karabiber + hardal (Japon kewpie tarz) + toz şeker (Kewpie tatlı imza) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tamagoyaki",
      "https://www.justonecookbook.com/japanese-egg-sandwich-tamago-sando/",
    ],
    description: "Tamago sando; Japon kafelerin klasik sandviçi olan haşlanmış yumurtanın Kewpie tarzı tatlı mayonez, hardal ve toz şekerle yumuşak dolguya dönüştürülüp süt ekmeği arasında servis edilmesidir.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Hardal", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Toz şeker", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Yumurtaları soyduktan sonra çatalla iri çatlatın; tek seferde ezmeyin, tane tane doku Japon imzasıdır. Süt ekmeğinin kabuklarını kesin; yumuşak köşeli kare estetik.",
    servingSuggestion: "Sandviçleri çapraz dilimleyip kabuklarını kesin; yumurta dolgusunun kesik yüzeyi görünür şekilde tabakta servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurtaları kaynar suya bırakıp 9 dakika haşlayın; soğuk sudan geçirip kabuklarını soyun.", timerSeconds: 540 },
      { stepNumber: 2, instruction: "Yumurtaları çatalla iri çatlatıp mayonez, hardal, toz şeker, tuz ve karabiberle karıştırarak yumurta dolgusunu hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Süt ekmeği dilimlerinin kabuklarını kesin; iki dilime hafif tereyağı sürün.", timerSeconds: null },
      { stepNumber: 4, instruction: "Bir dilime yumurta dolgusunu kalın yatırın; üst yüzü pürüzsüzleştirip diğer dilimle kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sandviçi 5 dakika streçle sarıp buzdolabında dinlendirin; kesimde dolgu dağılmaz.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Çapraz ortadan kesip tabağa alın; soğuk veya oda sıcaklığında servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "yulafli-cheddar-griddle-cake-ingiltere-usulu",
    reason: "REWRITE İngiltere yulaflı cheddar griddle cake klasik. DB'de tuz + kabartma tozu (griddle cake essential!) + karabiber EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/cheese-oatcakes",
      "https://en.wikipedia.org/wiki/Oatcake",
    ],
    description: "İngiltere kahvaltı sofralarının yulaflı cheddar griddle cake'i; yulaf unu, normal un, kabartma tozu, cheddar ve sütle yumuşak hamur halinde yoğrulup tavada altın renge gelene kadar pişirilen tuzlu kahvaltı kekidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kabartma tozu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Cheddarı kalın rendeleyin; eridiğinde dokulu kalır. Hamuru fazla yoğurmayın; yulaf nemini koruyup yumuşak iç verir.",
    servingSuggestion: "Sıcak griddle cake'leri tabağa alıp üzerine ek tereyağı, dilim domates ve haşlanmış yumurtayla İngiliz brunch tabağını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yulaf ununu, normal unu, kabartma tozunu, tuzu ve karabiberi geniş kapta karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Rendelenmiş cheddarı, eritilmiş tereyağını ve sütü kuru karışıma ekleyip yumuşak hamur elde edin; 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Hamuru 8 küçük yuvarlak şekillendirin; her birini 1.5 cm kalınlıkta tutun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp griddle cake'leri 8 dakika iki yüzü altın renge gelene kadar pişirin; cheddar erisin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Tabağa alıp 1 dakika dinlendirip sıcak servis edin; üstüne tereyağı yatırın.", timerSeconds: 60 },
    ],
  },
  {
    type: "rewrite",
    slug: "yumurtali-ispanak-kavurmasi-karadeniz-usulu",
    reason: "REWRITE Karadeniz yumurtalı ıspanak kavurması klasik. DB'de karabiber + sarımsak + mısır unu (Karadeniz dible imzası, opsiyonel bağlayıcı) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/trabzon/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/sebze-yemekleri/ispanak-kavurmasi",
    ],
    description: "Karadeniz usulü yumurtalı ıspanak kavurması; ıspanağın soğan, sarımsak ve tereyağında soldurulup mısır unuyla bağlandıktan sonra yumurtalarla kapatıldığı, sahanda hızlı bir bölge kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Mısır unu", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote: "Ispanağı yıkadıktan sonra iyi süzdürün; aksi halde tavada buhar yapar, yumurta dokusu bozulur. Mısır unu opsiyonel ama Karadeniz dible imzası, ıspanağı bağlar.",
    servingSuggestion: "Sahanı doğrudan sofraya alıp sıcak mısır ekmeği veya karadeniz piliç pidesiyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin; ıspanağı yıkayıp süzün ve iri doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahan veya küçük tavada tereyağını orta ateşte eritip soğanı 3 dakika çevirin; sarımsağı 30 saniye ekleyin.", timerSeconds: 210 },
      { stepNumber: 3, instruction: "Ispanağı katıp tuz ve karabiberi serpin; hacmi düşene kadar 4 dakika çevirin, mısır ununu üstüne serpip 30 saniye karıştırın.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Ispanağı sahanın çevresine yayıp ortasında çukurlar açın; yumurtaları kırın, kapağı kapatıp 4 dakika beyazlar tutana kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Sahanı ocaktan alıp doğrudan sıcak servis edin; yanında ekmek ve çayla denkleştirin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "susamli-corek-eskisehir-usulu",
    reason: "REWRITE Eskişehir susamlı çörek + SLUG LEAK FIX 'susamli-corek-eskisehir-usulu akışı için' (slug DB'ye yazılmış!). DB'de tuz + toz şeker (maya aktivasyon) + yumurta (üst sürme) EKSİK. Step 1+5 BOILERPLATE LEAK + step 5 SLUG LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/eskisehir/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/cörek-tarifleri/susamli-corek",
    ],
    description: "Eskişehir susamlı çörek; mayalı hamurun bol susamla kaplanıp 190°C fırında pişirildiği, sabah kahvaltısı ve çay saati arasında rahatça dolaşan klasik bir şehir çöreğidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "tatlı kaşığı" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
    ],
    tipNote: "Mayayı toz şekerle ılık sütte 5 dakika köpürtün; aktif olduğunu doğrularsınız. Çörekleri tepsiye dizdikten sonra üst yüze yumurta sarısı sürün; pişerken parlak kabuk oluşur.",
    servingSuggestion: "Sıcak çörekleri tabağa alıp dilim domates, beyaz peynir ve zeytinle Eskişehir kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Mayayı ılık sütte toz şekerle çırpıp 5 dakika köpürtün; un, tuz ve eritilmiş tereyağıyla birleştirip yumuşak hamur yoğurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Hamurun üzerini örtüp 30 dakika ılık ortamda mayalandırın; iki katına çıkmasını bekleyin.", timerSeconds: 1800 },
      { stepNumber: 3, instruction: "Mayalanan hamuru bezelere bölüp her birini şekillendirin; üzerlerini su ile nemlendirip susama bulayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çörekleri yağlı kâğıtlı tepsiye dizip 10 dakika dinlendirin; üst yüzlerini çırpılmış yumurta sarısıyla fırçalayın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "190°C ısıtılmış fırında 20 dakika üst yüzleri altın renge gelene kadar pişirin.", timerSeconds: 1200 },
      { stepNumber: 6, instruction: "Fırından çıkan çörekleri 5 dakika dinlendirip ılık servis edin; yanına çay iyi gider.", timerSeconds: 300 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-38");
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
              paket: "oturum-31-mini-rev-batch-38",
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
