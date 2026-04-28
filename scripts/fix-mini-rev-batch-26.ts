/**
 * Tek-seferlik manuel mini-rev batch 26 (oturum 30): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25 ile aynı
 * audit, top 7-14 araliği). 7 klasik kanonik kanitli tarif (Hatay tepsi
 * oruğu + Peru tallarines verdes + Hatay tepsi kebabı + Hint tarka
 * dal + Türk tavuk döner + Levant shawarma + UNESCO 2011 keşkek).
 * Hepsinde step 2+5+6+7 boilerplate scaffold + eksik klasik baharat/
 * aromatik.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (7 cuisine korunur). 0 title
 * degisimi (7 klasik kimlik kanitli korunur).
 *
 *   1. tepsi-orugu (Hatay tepsi oruk klasik): İçli köfte tepside
 *      (kibe akrabası, Hatay+Adıyaman+Şanlıurfa hattı). DB klasik
 *      formul (bulgur+kıyma+soğan+ceviz+tuz+limon) ama eksik klasik
 *      iç harç baharatları. 6 ingredient_add (irmik dış + biber salçası
 *      + isot + kimyon + karabiber + maydanoz + opsiyonel zeytinyağı),
 *      6 step replace klasik akış.
 *
 *   2. tallarin-verdes-peru-usulu (Peru klasik): yeşil sos ıspanak +
 *      fesleğen + süt + peynir + sarımsak + ceviz makarnaya (Peru
 *      Lima klasiği). Step 3+5+6 jenerik. Eksik: tuz, karabiber,
 *      opsiyonel parmesan rendesi, opsiyonel ají amarillo Peru imza.
 *      4 ingredient_add, 6 step replace klasik blender akış.
 *
 *   3. tepsi-kebabi (Hatay/Antakya klasik): kıyma+sebze+salça+yufka
 *      yağı+200°C fırın. Mevcut formul iyi ama step 2-3 jenerik +
 *      eksik isot/kimyon (Hatay imza). 3 ingredient_add (isot/pul
 *      biber + kimyon + zeytinyağı), 6 step replace.
 *
 *   4. tarka-dal (Hint klasik): sarı/kırmızı mercimek + tarka tempering
 *      (sarımsak + kimyon + zerdeçal + zencefil + soğan + tereyağı/
 *      ghee). Mevcut formul iyi ama step 2 jenerik + eksik domates
 *      (klasik), pul biber, kişniş garnitür. 3 ingredient_add (domates
 *      + opsiyonel kuru kırmızı biber + taze kişniş garnitür), 6 step
 *      replace.
 *
 *   5. tavuk-doner (Türk klasik): yoğurtlu marine + dondurma 2 saat
 *      dilim + tavada kızartma. Mevcut formul iyi ama step 2 jenerik
 *      + eksik klasik döner baharatları. 4 ingredient_add (pul biber/
 *      isot + sumak + kekik + karabiber), 1 amount change (dondurma
 *      süresi 2sa→2sa korunur, total 165 dk OK), 5 step replace.
 *
 *   6. tavuk-shawarma (Levant klasik): klasik shawarma baharat 7-9
 *      bileşen (kimyon + tarçın + karanfil + kakule + zerdeçal +
 *      paprika + karabiber + tuz + sumak). DB sadece kimyon. Eksik
 *      kapsamlı baharat seti + zeytinyağı + limon (klasik marinade) +
 *      sumak (klasik servis) + tarator/tahin sosu opsiyonel. 7
 *      ingredient_add (zeytinyağı + tarçın + paprika + karabiber +
 *      tuz + sumak + opsiyonel limon suyu), 5 step replace.
 *
 *   7. tavuklu-keskek (UNESCO 2011 tören yemeği): klasik buğday + et
 *      + uzun pişirme + ezme + tereyağı pul biber servis. DB temel
 *      formul iyi (buğday 2sb + tavuk 3 + tereyağı + su + tuz + toz
 *      biber). Eksik: opsiyonel soğan, karabiber. Step 2 jenerik. 2
 *      ingredient_add (karabiber + opsiyonel soğan), 5 step replace.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-26.ts
 *   npx tsx scripts/fix-mini-rev-batch-26.ts --env prod --confirm-prod
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
  // ─── 1: tepsi-orugu (Hatay içli köfte tepside klasik) ────────────
  {
    type: "rewrite",
    slug: "tepsi-orugu",
    reason:
      "REWRITE jenerik scaffold + içli köfte klasik baharat. Hatay/Adıyaman/Şanlıurfa tepsi oruğu klasik (kibe akrabası); dış harç ince bulgur + irmik + isot + tuz + zeytinyağı; iç harç kıyma + soğan + ceviz + biber salçası + isot + kimyon + karabiber + maydanoz. Title KORUNUR. 7 ingredient_add (irmik dış + biber salçası + isot + kimyon + karabiber + maydanoz + zeytinyağı), 6 step replace klasik akış.",
    sources: [
      "https://yemek.com/tarif/tepsi-orugu/",
      "https://www.adiyaman.gov.tr/yoresel-yemekler",
    ],
    description:
      "Hatay tepsi oruğu, ince bulgur ve irmikle yoğrulan dış harcı, isotlu cevizli kıymalı içiyle tepsiye yayan, içli köftenin Hatay-Adıyaman hattındaki fırın akrabasıdır.",
    ingredientsAdd: [
      { name: "İrmik", amount: "0.5", unit: "su bardağı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "İsot", amount: "1", unit: "yemek kaşığı" },
      { name: "Kimyon", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze maydanoz", amount: "0.5", unit: "demet" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Üst katı ıslak avuçla bastırın; yüzey çatlamadan düzgün kapanır. Dış harcı yoğururken bulgur ile irmiği önce ılık suyla 15 dakika ıslatın.",
    servingSuggestion:
      "Tepsi oruğunu kare dilimleyip ince bulgurlu yüzeyi dağılmadan limonla, sumaklı soğan piyazıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulgur ve irmiği ılık suyla 15 dakika ıslatıp şişirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğanı ince kıyıp tavada zeytinyağıyla pembeleşene kadar çevirin; kıymayı ekleyip suyu çekene kadar 8 dakika kavurun.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Biber salçası, isot, kimyon, karabiber ve cevizi katıp 2 dakika daha çevirin; ocaktan alıp maydanozu ekleyin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Şişen bulgur ve irmiği tuz, isot ve kalan zeytinyağıyla 6 dakika yoğurup yumuşak hamur kıvamına getirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Yağlanmış tepsiye dış harcın yarısını ıslak elle bastırarak yayın; iç harcı üstüne paylaştırıp kalan dış harçla kapatın ve baklava dilimi şeklinde kesin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Üzerine zeytinyağı sürüp 200°C fırında 30 dakika pişirin; üst yüz pembeleşince çıkarıp 5 dakika dinlendirip servis edin.", timerSeconds: 1800 },
    ],
  },

  // ─── 2: tallarin-verdes-peru (Peru yeşil makarna klasik) ─────────
  {
    type: "rewrite",
    slug: "tallarin-verdes-peru-usulu",
    reason:
      "REWRITE jenerik scaffold + Peru klasik baharat. Tallarines Verdes Peru Lima klasiği (ıspanak + fesleğen + süt + peynir + sarımsak + ceviz blender sosu). Step 2+5+6 jenerik. Eksik tuz + karabiber + opsiyonel parmesan + opsiyonel ají amarillo. Title KORUNUR. cuisine 'pe' KORUNUR. 4 ingredient_add, 6 step replace klasik blender akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Tallarines_verdes",
      "https://www.peruvianfood.org/recipes/tallarines-verdes",
    ],
    description:
      "Tallarines verdes, Peru Lima'nın klasik yeşil sos makarnasıdır; ıspanak ve fesleğen sütle blendırlanır, peynir ve cevizle yoğunlaşır, makarnaya kremamsı bir Akdeniz-Andes melezi sos olur.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Parmesan rendesi (servis)", amount: "2", unit: "yemek kaşığı" },
      { name: "Aji amarillo (opsiyonel Peru imza biber)", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Sosu makarnaya sıcakken eklemek topaklanmayı önler. Ispanağı blendırlamadan önce kaynar suda 30 saniye haşlamak yeşil rengi parlak tutar.",
    servingSuggestion:
      "Yanına sarımsaklı kıtır ekmek ve soğuk beyaz şarap eşliğinde akşam tabağı kurun; üzerine ekstra parmesan rendesi serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Spagettiyi tuzlu kaynar suda paket süresine göre al dente haşlayıp süzün; haşlama suyundan 0.5 su bardağı ayırın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Ispanağı kaynar suda 30 saniye haşlayıp soğuk suya alın, süzün; yeşil rengi korunur.", timerSeconds: 30 },
      { stepNumber: 3, instruction: "Blendırda haşlanmış ıspanak, fesleğen yaprakları, sarımsak, ceviz içi, süt, peynir, zeytinyağı, opsiyonel ají amarillo, tuz ve karabiberi pürüzsüz olana kadar çekin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Sosu geniş bir tavada orta ateşte 2 dakika ısıtın; çok koyuysa ayrılan haşlama suyundan ekleyip kıvam ayarlayın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Süzülmüş spagettiyi tavaya ekleyip sosla harmanlayın; 1 dakika daha çevirin.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Servis tabaklarına alıp üzerine parmesan rendesi serpip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tepsi-kebabi (Hatay/Antakya klasik) ──────────────────────
  {
    type: "rewrite",
    slug: "tepsi-kebabi",
    reason:
      "REWRITE jenerik scaffold + Hatay tepsi kebabı klasik baharat. Antakya/Hatay tepsi kebabı klasik (kıyma + soğan + biber + domates + salça + sarımsak + maydanoz + tuz + karabiber + isot/pul biber + kimyon + zeytinyağı + 200°C fırın 30-35 dk). Mevcut formul iyi ama step 2-3 jenerik + eksik isot/pul biber + kimyon + zeytinyağı (Hatay imza). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add (isot/pul biber + kimyon + zeytinyağı), 6 step replace.",
    sources: [
      "https://yemek.com/tarif/tepsi-kebabi/",
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir/antakya-tepsi-kebab",
    ],
    description:
      "Hatay/Antakya tepsi kebabı, ince yayılmış kıyma harcının domates ve biberle birlikte fırında pişirildiği paylaşmalık bir Güneydoğu sofrası klasiğidir.",
    ingredientsAdd: [
      { name: "İsot veya pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Kıymayı tepsiye aynı kalınlıkta yayın; kenarlar kurumadan orta kısmı pişer. İsotu yoğururken katmak baharatın ete eşit dağılmasını sağlar.",
    servingSuggestion:
      "Lavaş ve közlenmiş yeşil biber, sumaklı soğan piyazı, ayranla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yarım ay ince doğrayın, sarımsağı rendeleyin; biber ve maydanozu ince kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kâseye kıyma, doğranmış soğan, sarımsak, biber, maydanoz, biber salçası, tuz, karabiber, isot ve kimyonu alın; 8 dakika sıkıca yoğurun.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Yağlanmış fırın tepsisine harcı 1.5-2 cm kalınlığında ince yayın; bıçak ucuyla baklava dilimi izleri çizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üzerine ince halka domates dilimleri dizin, zeytinyağını gezdirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "200°C ön ısıtılmış fırında 30-35 dakika kıyma suyu çekilip üst yüzey kızarana kadar pişirin.", timerSeconds: 2100 },
      { stepNumber: 6, instruction: "Fırından alıp 5 dakika dinlendirin; ızları takip ederek dilimleyip sıcak servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 4: tarka-dal (Hint klasik) ──────────────────────────────────
  {
    type: "rewrite",
    slug: "tarka-dal",
    reason:
      "REWRITE jenerik scaffold + Hint klasik bilesen. Tarka Dal klasik Hint (kırmızı/sarı mercimek + tarka tempering: tereyağı/ghee + sarımsak + kimyon + zerdeçal + zencefil + soğan + opsiyonel domates + opsiyonel kuru kırmızı biber). Mevcut formul iyi ama step 2 jenerik + eksik domates (klasik) + kişniş garnitür + opsiyonel kuru biber. Title KORUNUR. cuisine 'in' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Dal",
      "https://www.bbcgoodfood.com/recipes/tarka-dhal",
    ],
    description:
      "Hint mutfağının sade ama güçlü ev klasiği tarka dal; sarı/kırmızı mercimek yumuşatılır, üzerine kızgın yağda kavrulmuş sarımsak, kimyon ve zerdeçal tarkası dökülür.",
    ingredientsAdd: [
      { name: "Domates", amount: "1", unit: "adet" },
      { name: "Kuru kırmızı biber (opsiyonel)", amount: "1", unit: "adet" },
      { name: "Taze kişniş veya maydanoz (servis)", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Kızgın yağı mercimeğe son anda dökün; kimyonun kokusu buharla yükselir. Domatesi mercimekle birlikte pişirmek doğal kıvam verir.",
    servingSuggestion:
      "Naan veya basmati pirinç pilavı yanında, üzerine taze kişniş serperek sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Mercimeği yıkayıp 4 su bardağı suya alın, doğranmış domates, zerdeçal ve tuzla orta ateşte 25 dakika yumuşayana kadar pişirin.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Mercimek yumuşayınca tahta kaşıkla hafifçe ezerek kıvam alıp ocağı kapatın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tarka için ayrı küçük tavada sıvı yağı yüksek ateşte ısıtın; kimyonu ekleyip 30 saniye köpürtün.", timerSeconds: 30 },
      { stepNumber: 4, instruction: "Doğranmış soğan, ezilmiş sarımsak ve rendelenmiş zencefili ekleyip 3 dakika pembeleştirin; opsiyonel kuru kırmızı biberi ekleyin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Kızgın tarka karışımını mercimeğin üzerine dökün; aroma yükselsin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Hafif karıştırıp servis kâselerine alın, üzerine taze kişniş veya maydanoz serpip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: tavuk-doner (Türk klasik baharat) ─────────────────────────
  {
    type: "rewrite",
    slug: "tavuk-doner",
    reason:
      "REWRITE jenerik scaffold + Türk döner klasik baharat. Tavuk döner klasik (yoğurtlu marine + dondurma 2 saat dilim + tava). Mevcut formul iyi ama step 2 jenerik + eksik klasik döner baharatları (pul biber/isot + sumak + kekik + karabiber). Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://yemek.com/tarif/tavuk-doner/",
      "https://www.kevserinmutfagi.com/tavuk-doner-tarifi.html",
    ],
    description:
      "Yoğurtlu marineli tavuk butlarının rulo halinde donduktan sonra ince dilimlenip tavada kızartıldığı ev usulü tavuk döner; lavaş arası klasik bir akşam yemeği.",
    ingredientsAdd: [
      { name: "Pul biber veya isot", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "1", unit: "tatlı kaşığı" },
      { name: "Kuru kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Marine edilmiş tavuğu rulo yapıp dondurucuda 2 saat bekletin; ince dilimlemek kolaylaşır. Marine sonrası rulo yapıp ayrıca 2 saat dondurun; bu süre dilimleme içindir, marine yerine geçmez.",
    servingSuggestion:
      "Lavaşa sumak serpilmiş soğan salatası, közlenmiş biber, taze maydanoz ve ayranla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yoğurt, zeytinyağı, salça, ezilmiş sarımsak, kimyon, pul biber, sumak, kekik, karabiber ve tuzu birleştirip marinade hazırlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavuk butlarını ince şerit doğrayın, marinade'a yedirin; kapağı kapalı buzdolabında en az 2 saat dinlendirin.", timerSeconds: 7200 },
      { stepNumber: 3, instruction: "Marinade emmiş tavukları sıkıca rulo yapıp streçle sarın; dondurucuda 2 saat dinlendirin (dilimleme için sertleşsin).", timerSeconds: 7200 },
      { stepNumber: 4, instruction: "Streci açıp ruloyu çok ince dilimleyin; sıcak büyük tavada kıvrılana ve kenarlar kızarana kadar 12-15 dakika kavurun.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Lavaşa sumak serpilmiş soğan salatası, közlenmiş biber ve dilimlenmiş tavukla sararak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tavuk-shawarma (Levant klasik baharat) ───────────────────
  {
    type: "rewrite",
    slug: "tavuk-shawarma",
    reason:
      "REWRITE jenerik scaffold + Levant shawarma klasik baharat. Klasik shawarma 7-9 baharat (kimyon + tarçın + karanfil + kakule + zerdeçal + paprika + karabiber + tuz + sumak) + zeytinyağı + limon (klasik marinade). DB sadece kimyon. Eksik kapsamlı baharat seti + zeytinyağı + sumak servis. Title KORUNUR. cuisine 'me' KORUNUR. 6 ingredient_add (zeytinyağı + tarçın + paprika + karabiber + tuz + sumak), 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Shawarma",
      "https://www.themediterraneandish.com/chicken-shawarma-recipe/",
    ],
    description:
      "Levant sokaklarının imzası tavuk shawarma; baharat dolu yoğurtlu marineyle yumuşatılan tavuk dilimleri tavada kızartılıp lavaşa sumak ve sarımsaklı yoğurtla sarılır.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tatlı toz biber (paprika)", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sumak (servis için)", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tavuğu ince şerit kesin; tavada yüksek ateşte kenarlar kızarır. Baharatı yoğurda iyice yedirin; 30 dakika bekleme ince tavuk dilimlerinde yeterli olur, daha derin aroma için 2-4 saat dinlendirin.",
    servingSuggestion:
      "Turşu, domates, taze maydanoz ve sarımsaklı yoğurt veya tahin sosuyla, üzerine sumak serperek servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yoğurt, zeytinyağı, ezilmiş sarımsak, kimyon, tarçın, paprika, karabiber ve tuzu birleştirip marinade hazırlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavuk butlarını ince şerit doğrayın, marinade'a yedirin; kapağı kapalı buzdolabında en az 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 3, instruction: "Geniş tavayı yüksek ateşte ısıtın; tavukları yapışmayan tek katmanda 12-15 dakika ara ara çevirerek kızartın.", timerSeconds: 900 },
      { stepNumber: 4, instruction: "Lavaşları kuru tavada 20 saniye ısıtın; ortalarına tavuk, doğranmış domates, turşu, taze maydanoz ve sarımsaklı yoğurt veya tahin sosu paylaştırın.", timerSeconds: 20 },
      { stepNumber: 5, instruction: "Üzerine sumak serpip sıkı sarın; çapraz kesip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: tavuklu-keskek (UNESCO 2011 tören klasik) ────────────────
  {
    type: "rewrite",
    slug: "tavuklu-keskek",
    reason:
      "REWRITE jenerik scaffold + keşkek klasik bilesen. UNESCO 2011 tescilli tören yemeği (Türkiye Somut Olmayan Kültürel Miras). Klasik formul: aşurelik buğday + tavuk/kuzu + tereyağı + tuz + uzun pişirme + ezme + tereyağında pul biber servis. Mevcut formul iyi ama step 2 jenerik + eksik karabiber + opsiyonel soğan. Title KORUNUR. cuisine 'tr' KORUNUR. 2 ingredient_add (karabiber + opsiyonel soğan), 5 step replace.",
    sources: [
      "https://ich.unesco.org/en/RL/keskek-tradition-00388",
      "https://yemek.com/tarif/keskek/",
    ],
    description:
      "Aşurelik buğday ve tavuk butlarının uzun süre birlikte pişirilip tahta kaşıkla ezilmesiyle hazırlanan, UNESCO Somut Olmayan Kültürel Miras Listesi'ne (2011) giren geleneksel Anadolu tören yemeği.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Soğan (opsiyonel)", amount: "1", unit: "adet" },
    ],
    tipNote:
      "Buğdayı bir gece (en az 8 saat) ıslatın; pişerken daha kısa sürede açılır ve kremamsı olur. Tavuk butlarını kemikli pişirmek aroma derinliğini artırır.",
    servingSuggestion:
      "Üzerine eritilmiş tereyağında kavrulmuş toz kırmızı biber gezdirip, yanında turşu ile sıcak servis tabağında sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Aşurelik buğdayı bir gece (en az 8 saat) suda bekletip süzün.", timerSeconds: 28800 },
      { stepNumber: 2, instruction: "Buğday, tavuk butları, opsiyonel doğranmış soğan, tuz ve karabiberi 8 su bardağı suyla geniş tencereye alın; orta ateşte 100-110 dakika yumuşayana kadar pişirin.", timerSeconds: 6600 },
      { stepNumber: 3, instruction: "Tavukları çıkarıp didikleyin; kemikleri ayıklayıp didiklenmiş eti tencereye geri alın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Karışımı tahta kaşıkla 10 dakika ezerek kremamsı kıvama getirin; gerekirse sıcak su ekleyerek inceltin.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Servis tabağına alın; ayrı küçük tavada eritilmiş tereyağında toz kırmızı biberi 30 saniye kavurup üzerine gezdirin, sıcak servis edin.", timerSeconds: 30 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-26");
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
              paket: "oturum-30-mini-rev-batch-26",
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
