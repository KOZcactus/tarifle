/**
 * Tek-seferlik manuel mini-rev batch 3 (oturum 27): 6 Mod K v2
 * MAJOR_ISSUE yabanci klasik + Türk yoresel tarif. Web research 2
 * paralel agent + 14+ kaynak teyit (Korean Bapsang, Maangchi, Silk
 * Road Recipes, My Hungarian Kitchen, Budapest Cooking Class,
 * Offbeat Budapest, Hungarian Cuisine in a Nutshell, Lezzetler,
 * Nefis Yemek Tarifleri, Yemek.com, Cumhuriyet Antakya, Tokat
 * Yoresel Lezzetler, Milliyet).
 *
 * Verdict: 5 REWRITE + 1 DESC_ONLY (hicbiri silmeye gitmedi).
 *
 *   1. jeyuk-bokkeum (REWRITE): Klasik DOMUZ etiyle, TR pazari icin
 *      dana uyarlamasi description'da belirtildi. Marinasyon doğru
 *      bilesenlerle (sarimsak + zencefil + armut + gochugaru + seker
 *      + sogan). GLUTEN allergen.
 *   2. jokai-bableves (REWRITE): Klasik fume domuz + kolbasz + eksi
 *      krema + csipetke. TR uyarlamasi: sucuk + eksi krema + csipetke
 *      + rântâs. GLUTEN + SUT + YUMURTA allergen.
 *   3. kayisili-irmik-pilavi-macaristan-usulu (REWRITE + type degisim):
 *      Macar tejbegriz sutlu irmik tatlisi. Type YEMEK -> TATLI, su ->
 *      sut, seker + vanilya, kayisi kompotu topping.
 *   4. kabak-bastisi-gaziantep-usulu (REWRITE + type degisim): Klasik
 *      etli + nohut + nar eksili tencere yemegi. Type TATLI -> YEMEK,
 *      irmik+seker+ceviz cikar, etli ekle. KUSUYEMIS+GLUTEN allergen
 *      kaldir.
 *   5. helle-tatlisi-tokat-usulu (REWRITE + type degisim): Tokat helle
 *      CORBA (un corbasi), pirincli. Type TATLI -> CORBA, seker+tarcin
 *      cikar, pirinc+pul biber+karabiber+tuz ekle.
 *   6. hatay-zahterli-tepsi-koftesi (DESC_ONLY + minor ingredient):
 *      Hatay tepsi kofte/Antakya kofte uyumlu. Type YEMEK kalir.
 *      Sarimsak+maydanoz+baharat ekle, zahter yan salataya tasi
 *      (description'da belirtildi). SUSAM allergen kaldir.
 *
 * AuditLog action: MOD_K_MANUAL_REV.
 * Idempotent: zaten yeni description ise SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-3.ts
 *   npx tsx scripts/fix-mini-rev-batch-3.ts --env prod --confirm-prod
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
  type?: RecipeType;
  allergensAdd?: Allergen[];
  allergensRemove?: Allergen[];
  ingredientsAdd?: IngredientAdd[];
  ingredientsRemove?: string[];
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── 1. jeyuk-bokkeum ───────────────────────────────────────
  {
    slug: "jeyuk-bokkeum",
    reason:
      "Klasik Kore jeyuk bokkeum DOMUZ etiyle yapilir (Korean Bapsang + Maangchi + Silk Road Recipes); 'jeyuk' kelimesi domuz demek. TR pazari icin dana uyarlamasi korunur, description'a 'klasik domuz iledir' notu eklenir. Dogru marinasyon bilesenleri eklendi (sarimsak + zencefil + armut + gochugaru + seker + sogan).",
    sources: [
      "https://www.koreanbapsang.com/dweji-bulgogi-korean-spicy-pork-bbq/",
      "https://www.maangchi.com/recipe/dwaejigogi-bokkeum",
      "https://silkroadrecipes.com/jeyuk-bokkeum/",
    ],
    description:
      "Kore usulü acılı soteleme: gochujang ve sarımsaklı marinasyonda dinlenen et, soğanla yüksek ateşte hızlıca pişirilir. Klasik tarif domuz iledir, bu uyarlama dana ile hazırlanır.",
    prepMinutes: 15,
    cookMinutes: 15,
    totalMinutes: 65,
    averageCalories: 430,
    protein: 32,
    carbs: 18,
    fat: 26,
    allergensAdd: [Allergen.GLUTEN],
    ingredientsAdd: [
      { name: "Sarımsak (rendelenmiş)", amount: "4", unit: "diş" },
      { name: "Zencefil (rendelenmiş)", amount: "1", unit: "yemek kaşığı" },
      { name: "Armut (rendelenmiş)", amount: "0.5", unit: "adet" },
      { name: "Toz acı kırmızı biber (gochugaru)", amount: "1", unit: "yemek kaşığı" },
      { name: "Şeker", amount: "1", unit: "yemek kaşığı" },
      { name: "Soğan", amount: "1", unit: "adet" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Eti 3-4 mm kalınlığında ince dilimleyin. Geniş bir kapta gochujang, soya sosu, gochugaru, rendelenmiş sarımsak, zencefil, armut, şeker ve susam yağını karıştırarak marinasyon hazırlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Et dilimlerini marinasyona ekleyip elinizle iyice yedirin. Buzdolabında 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 3, instruction: "Soğanı yarım ay dilimleyin. Geniş bir tavayı yüksek ateşte iyice ısıtın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Marine et ve soğanı tavaya yayın. Sosun et üzerine yapışıp hafifçe karamelize olması için 6-8 dakika ara ara karıştırarak pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Suyunu büyük ölçüde çekene kadar 3-4 dakika daha sotelemeye devam edin.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Ocaktan alın, susam ve doğranmış taze soğanla servis edin. Marul yaprağına sararak yenebilir.", timerSeconds: null },
    ],
  },

  // ─── 2. jokai-bableves ──────────────────────────────────────
  {
    slug: "jokai-bableves",
    reason:
      "Klasik Macar Jokai bableves (Mor Jokai'den isim) fume domuz dizi/incik + kolbasz + pinto fasulye + kok sebze + paprika + un rântâs + eksi krema (tejfol) + csipetke. TR pazari uyarlamasi: domuz yerine sucuk + dana et. Klasik formul %80 korunur (paprika + rântâs + eksi krema + csipetke).",
    sources: [
      "https://myhungariankitchen.com/jokai-bableves-hungarian-bean-soup/",
      "https://budapestcookingclass.com/hungarian-bean-soup-jokai-style-jokai-bableves/",
      "https://www.offbeatbudapest.com/hungarian-food-recipes/jokai-bean-soup-jokai-bableves/",
    ],
    description:
      "Mór Jókai'den adını alan Macar fasulye çorbası, pinto fasulye, paprikalı sebze tabanı ve sucukla pişer; ekşi krema ile finlenir, csipetke (yumurtalı küçük hamur parçaları) garnitürdür. Klasik tarif füme domuz iledir, bu uyarlamada sucuk kullanılır.",
    prepMinutes: 20,
    cookMinutes: 50,
    totalMinutes: 70,
    averageCalories: 340,
    protein: 17,
    carbs: 32,
    fat: 15,
    allergensAdd: [Allergen.GLUTEN, Allergen.SUT, Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Sucuk (dilimlenmiş)", amount: "150", unit: "gr" },
      { name: "Maydanoz kökü", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Defne yaprağı", amount: "1", unit: "adet" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Un", amount: "1", unit: "yemek kaşığı" },
      { name: "Ekşi krema", amount: "3", unit: "yemek kaşığı" },
      { name: "Yumurta (csipetke için)", amount: "1", unit: "adet" },
      { name: "Un (csipetke için)", amount: "0.5", unit: "su bardağı" },
      { name: "Maydanoz", amount: "1", unit: "tutam" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı, sarımsağı ince doğrayın. Havuç, maydanoz kökü ve patatesi küp doğrayın. Sucuğu dilimleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede sıvı yağı ısıtın. Soğanı 4 dakika çevirin, sarımsak ve sucuğu ekleyip 2 dakika daha pişirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Ocağı kısın. Tatlı kırmızı toz biberi (paprika) ekleyip 20 saniye karıştırın; yanmaması için hemen domates salçası ve havucu ekleyin.", timerSeconds: 20 },
      { stepNumber: 4, instruction: "Patates, defne yaprağı, fasulye ve 1.5 litre sıcak suyu ekleyin. Kaynayınca kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Csipetke için yumurta, un ve bir tutam tuzu yoğurun. Sert hamurdan tırnak ucu büyüklüğünde parçalar koparıp çorbaya atın, 5 dakika pişirin.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Küçük kapta unu ekşi kremayla pürüzsüz olana dek karıştırın. Bir kepçe sıcak çorbayla temperleyip tencereye ekleyin, 2 dakika kaynatın.", timerSeconds: 120 },
      { stepNumber: 7, instruction: "Tuzu kontrol edin, maydanozla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3. kayisili-irmik-pilavi-macaristan-usulu ──────────────
  {
    slug: "kayisili-irmik-pilavi-macaristan-usulu",
    reason:
      "Macar mutfaginda 'kayisili irmik pilavi' yok; klasik tejbegriz sutlu irmik tatlisi (Budapest Cooking Class + Hungarian Cuisine in a Nutshell + Offbeat Budapest 3 kaynak). Type YEMEK -> TATLI degisimi sart, su -> sut, seker + vanilya eklendi, kayisi kompotu topping. Klasik tatli puding kivami.",
    sources: [
      "https://budapestcookingclass.com/semolina-milk-pudding/",
      "https://www.hungariancuisineinanutshell.com/2025/09/hungarian-semolina-porridge-tejbegriz.html",
      "https://www.offbeatbudapest.com/hungarian-food-recipes/semolina-porridge-tejbegriz/",
    ],
    description:
      "Tejbegríz, Macaristan'ın klasik sütlü irmik pudingidir; irmik vanilyalı sütte yavaşça koyulaşır, üzerine sıcak kayısı kompotu dökülür. Çocukluk lezzeti, kahvaltı ile tatlı arasında konumlanır.",
    prepMinutes: 5,
    cookMinutes: 15,
    totalMinutes: 20,
    averageCalories: 245,
    protein: 7,
    carbs: 38,
    fat: 7,
    type: RecipeType.TATLI,
    ingredientsAdd: [
      { name: "Süt (tam yağlı)", amount: "500", unit: "ml" },
      { name: "Şeker", amount: "2", unit: "yemek kaşığı" },
      { name: "Vanilya özütü", amount: "1", unit: "çay kaşığı" },
      { name: "Tarçın (servis için)", amount: "1", unit: "tutam" },
    ],
    ingredientsRemove: ["Su"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru kayısıyı küçük doğrayın. Küçük bir tencereye 100 ml su ile koyup kısık ateşte 8 dakika pişirip yumuşak bir kompot hazırlayın, ocaktan alın.", timerSeconds: 480 },
      { stepNumber: 2, instruction: "Geniş bir tencerede sütü, şekeri ve bir tutam tuzu kaynama noktasına yaklaştırın; süt taşmadan ocağı kısın.", timerSeconds: null },
      { stepNumber: 3, instruction: "İrmiği sürekli çırparak ince ince ekleyin; topaklanmayı önlemek için hiç durmadan karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kısık ateşte 5-7 dakika sürekli karıştırarak pişirin; karışım kaşığın arkasını kaplayan kıvama gelmeli.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Ocaktan alın, vanilya özütünü ekleyip karıştırın. Tereyağını üzerine koyup eritin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kaselere alın, üzerine sıcak kayısı kompotu ve birer tutam tarçın serpip servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4. kabak-bastisi-gaziantep-usulu ───────────────────────
  {
    slug: "kabak-bastisi-gaziantep-usulu",
    reason:
      "Gaziantep 'kabak bastisi/bastirmasi' yoresel kaynaklarda istisnasiz etli + ekşili tencere yemegi (Lezzetler.com + Nefis Yemek Tarifleri kaynaklari). Tatli versiyon hicbir resmi kaynakta yok. Type TATLI -> YEMEK degisimi, irmik + seker + tarcin + ceviz cikarildi, dana eti + nohut + nar eksisi + nane + soganli salça eklendi. Allergen GLUTEN + KUSUYEMIS kaldirildi.",
    sources: [
      "https://lezzetler.com/kabak-bastirmasi-gaziantep-tarif-30958",
      "https://www.nefisyemektarifleri.com/kabaklama-gaziantep-mutfagi/",
    ],
    description:
      "Gaziantep usulü kabak bastısı, küp doğranmış kış kabağını dana eti, nohut ve nar ekşisiyle pişiren ekşili bir tencere yemeğidir. Üzerine kızdırılmış nane yağı gezdirilerek pilavla servis edilir.",
    prepMinutes: 20,
    cookMinutes: 70,
    totalMinutes: 90,
    averageCalories: 310,
    protein: 22,
    carbs: 24,
    fat: 14,
    type: RecipeType.YEMEK,
    allergensRemove: [Allergen.GLUTEN, Allergen.KUSUYEMIS],
    ingredientsAdd: [
      { name: "Dana kuşbaşı", amount: "300", unit: "gr" },
      { name: "Haşlanmış nohut", amount: "1", unit: "su bardağı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Nar ekşisi", amount: "2", unit: "yemek kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
    ],
    ingredientsRemove: ["İrmik", "Toz şeker", "Tarçın", "Ceviz"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuşbaşı eti tencerede kendi suyunu çekene kadar kavurun, sonra sıcak su ekleyip yumuşayana kadar pişirin (yaklaşık 35-40 dakika).", timerSeconds: 2400 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ayrı tavada zeytinyağında kavurun, domates ve biber salçasını ekleyip 1-2 dakika daha çevirin.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Kabağı 2-3 cm küpler halinde doğrayıp pişen etin üzerine ekleyin, ardından soğan-salça karışımını ve haşlanmış nohutu katın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Doğranmış sarımsağı ve nar ekşisini ilave edip kapağı kapatın, kabaklar dağılmadan yumuşayana kadar 20-25 dakika kısık ateşte pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Tereyağında kuru naneyi 10 saniye yakmadan kavurup yemeğin üzerine gezdirin ve sıcak servis edin.", timerSeconds: 10 },
    ],
  },

  // ─── 5. helle-tatlisi-tokat-usulu ───────────────────────────
  {
    slug: "helle-tatlisi-tokat-usulu",
    reason:
      "'Helle tatlisi' yoresel kaynaklarda yok. Tokat helle = un corbasi (Nefis Yemek Tarifleri + Tokat Yoresel Lezzetler + Milliyet 5+ kaynak). Type TATLI -> CORBA degisimi, seker + tarcin cikarildi, pirinc + pul biber + karabiber + tuz + sivi yag eklendi. Title TATLI eki yaniltici ama slug korunur (URL break onleme).",
    sources: [
      "https://www.nefisyemektarifleri.com/helle-corbasi-un-corbasi/",
      "https://tokattanyoresellezzetler.wordpress.com/helle-corbasi/",
      "https://www.milliyet.com.tr/yemek/tarif/helle-corbasi-tarifi-2791343",
    ],
    description:
      "Tokat usulü helle çorbası, kavrulmuş unun haşlanmış pirinçle birleştiği, üzerine pul biberli tereyağı sosu gezdirilen sade ve doyurucu bir kış çorbasıdır.",
    prepMinutes: 5,
    cookMinutes: 40,
    totalMinutes: 45,
    averageCalories: 165,
    protein: 4,
    carbs: 24,
    fat: 6,
    type: RecipeType.CORBA,
    ingredientsAdd: [
      { name: "Pirinç", amount: "0.5", unit: "su bardağı" },
      { name: "Su", amount: "5", unit: "su bardağı" },
      { name: "Sıvı yağ", amount: "1", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Toz şeker", "Tarçın"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp tencereye 4 su bardağı soğuk suyla koyun, kısık ateşte yumuşayana kadar 20 dakika haşlayın.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Ayrı bir tavada unu sürekli karıştırarak pembeleşip kokusu çıkana kadar yağsız kavurun, sonra soğumaya bırakın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Soğuyan una 1 su bardağı soğuk su ekleyip topak kalmayana kadar çırpın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Un karışımını kaynayan pirincin içine yavaş yavaş karıştırarak ekleyin, tuzu atıp kısık ateşte 15 dakika daha pişirin.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Küçük tavada tereyağı ve sıvı yağı eritip pul biber ile karabiberi katın, çorbanın üzerine gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6. hatay-zahterli-tepsi-koftesi (DESC_ONLY + minor) ────
  {
    slug: "hatay-zahterli-tepsi-koftesi",
    reason:
      "Hatay tepsi koftesi/Antakya kofte yoresel klasige uyumlu (Yemek.com Tepsi Kebabi + Cumhuriyet Antakya Kofte). Yapi temelde dogru, sadece sarimsak + maydanoz + baharat (kimyon, karabiber, pul biber) eksik. Zahter klasik servisinde yan zahter salatasi olarak gelir (kekik + zeytinyagi + nar eksisi), description'da disambiguate. SUSAM allergen kaldirildi (zahter yan salatada opsiyonel, core ingredient degil).",
    sources: [
      "https://yemek.com/tarif/tepsi-kebabi-2/",
      "https://yemek.com/tarif/tepsi-orugu/",
      "https://www.cumhuriyet.com.tr/gurme/hatay-mutfaginin-lezzetli-saheseri-antakya-kofte-tarifi-2302875",
    ],
    description:
      "Hatay tepsi köftesi, dana kıyma ve ince bulgurun sarımsak ve baharatlarla yoğrulup tepside fırınlandığı geleneksel bir Antakya yemeğidir. Üzerine domates dilimleri dizilir, yanında zeytinyağı ve nar ekşili zahter salatasıyla servis edilir.",
    prepMinutes: 25,
    cookMinutes: 32,
    totalMinutes: 57,
    averageCalories: 430,
    protein: 28,
    carbs: 27,
    fat: 24,
    allergensRemove: [Allergen.SUSAM],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Kimyon", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulgurun üzerine yarım su bardağı sıcak su gezdirip 10 dakika kapağı kapalı şişmesini bekleyin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Kıymayı şişen bulgur, rendelenmiş soğan, ezilmiş sarımsak, biber salçası, doğranmış maydanoz, kimyon, karabiber ve pul biberle 5 dakika iyice yoğurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Harcı yağlı tepsiye 1.5 cm kalınlığında yayıp bıçakla 8 eşit parçaya bölün, üzerine erimiş tereyağını gezdirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Domates dilimlerini köftelerin üzerine dizin, isteğe bağlı yeşil biber dilimleri ekleyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Önceden 190°C'ye ısıtılmış fırında üzeri kızarana kadar 28-32 dakika pişirin, zahter salatası eşliğinde sıcak servis edin.", timerSeconds: 1800 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-3");
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
        type: true,
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
    if (op.type !== undefined) updateData.type = op.type;
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
              paket: "oturum-27-mini-rev-batch-3",
              changes: {
                description_revised: !!op.description,
                type_changed: op.type ? `${recipe.type} -> ${op.type}` : null,
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

    console.log(`✅ ${op.slug}: REWRITE applied${op.type ? ` (type ${recipe.type} -> ${op.type})` : ""}`);
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
