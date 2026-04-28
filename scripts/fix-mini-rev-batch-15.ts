/**
 * Tek-seferlik manuel mini-rev batch 15 (oturum 28): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 22+ kaynak (Arla resmi + Tinis Kitchen
 * + True North Kitchen / Hikari Miso resmi + Just One Cookbook + Chef
 * JA Cooks / Polonist + Eat Healthy 365 / Kültür Portalı resmi + Visit
 * Manisa Valiliği + Hürriyet / Şırnak Valiliği + Şırnak KTB + Lezzet
 * Gaziantep / Kırşehir Valiliği + Biletbayi Kırşehir / Maangchi +
 * Beyond Kimchee + Wikipedia Sikhye).
 *
 * Verdict: 7 REWRITE. Hicbir cuisine fix yok (4/4 cuisine korundu;
 * Codex'in 'cuisine yanlis' suphesi 4 vakada da olumsuz cikti, klasik
 * referanslar cuisine'i destekledi). 5 title degisimi.
 *
 *   1. salatalikli-dereotlu-soguk-corba-isvec-usulu (REWRITE):
 *      Codex 'Isvec usulu kanitsiz' demis ama kall gurksoppa Arla
 *      resmi + ICA + Tasteline ile Isvec klasik (3 kaynak). Cuisine
 *      'se' KORUNUR. Tuz + limon + sarimsak + karabiber + nane eksik.
 *      Total 10 dk yetersiz, 30 dk dinlendirme dahil 45 dk olmali.
 *
 *   2. susamli-kabak-corbasi-japon-usulu (REWRITE + KIMLIK GUCLENDIR):
 *      Klasik kabocha miso shiru: kabocha + dashi + miso + susam
 *      (Hikari Miso resmi + Just One Cookbook). DB'de miso + dashi
 *      eksik, zencefil baskin (Cin/Tay esintisi, Japon klasiginde
 *      yok). Title 'Japon Usulu Susamli Kabocha Corbasi (Misolu)'.
 *      6 ingredient_add (miso + kombu + shiitake + soya + yesil
 *      sogan + tuz), zencefil REMOVE, 6 step replace, SOYA allergen.
 *
 *   3. sosisli-arpali-lahana-tava-polonya-usulu (REWRITE): Polonist
 *      kielbasa lahana skillet + kapuśniak arpali varyant sentezi
 *      (3 kaynak). DB'de sogan + sarimsak + defne + caraway + paprika
 *      + salca eksik. Title 'Polonya Usulu Kielbasali Arpali Lahana
 *      Tencere'. 11 ingredient_add, 2 amount change, 6 step replace.
 *
 *   4. sumakli-kabak-sinkonta-manisa-usulu (KIBE-MUMBAR REWRITE FULL):
 *      Manisa sinkonta klasik = balkabagi + sosu (salca + un + sirke
 *      + limon + sarimsak) + 200°C firin 60 dk (Kultur Portali resmi
 *      + Manisa Valiligi + Hurriyet 3 kaynak). DB'de balkabagi yerine
 *      'kabak', sumak (kanonsiz!), tencere 15 dk pisirme. Tarif
 *      sinkonta DEGIL, jenerik soganli kabak sote. Title 'Manisa
 *      Balkabagi Sinkonta' (sumak title'dan cikar). 8 ingredient_add
 *      (sarimsak + sirke + salca + un + limon + nane + pul biber +
 *      tuz), 1 ingredient_remove (sumak), 3 amount change (kabak →
 *      balkabagi 1kg, zeytinyagi 0.5sb), 6 step replace, difficulty
 *      EASY → MEDIUM, total 34→80 dk, recipeType YEMEK korunur.
 *
 *   5. sirnak-fistikli-kuzu-tava (REWRITE yore yumusatma): Sirnak
 *      yoresel envanterinde fistikli kuzu tava YOK (Sirnak Valiligi
 *      + KTB resmi 11 yemek listesi); Antep fistigi Gaziantep mutfagi
 *      ile ozdes. Title 'Guneydogu Usulu Fistikli Kuzu Tava' (slug
 *      korunur, B secenegi slug rename ertelendi). 1 amount change
 *      (kuyruk yagi 50→80gr porsiyon basi gerceklik), 1 amount change
 *      (antep fistigi 0.4→0.5 sb), step 5 instruction guncelle.
 *
 *   6. simsir-coregi-kirsehir-usulu (REWRITE title fix): 'Simsir'
 *      Turk mutfak sozlugunde KUCUK KASIK adi (Kayseri mantı icin
 *      'simsir kasigi'), corek adi DEGIL (Eksi sozluk + diger kaynak).
 *      Kirsehir envanterinde simsir coregi yok (Kirsehir Valiligi +
 *      Biletbayi 17 yemek). Hamur klasik mayali corek (Ic Anadolu).
 *      Title 'Kirsehir Mayali Coregi'. Step 1+2+5 slug kalintilarini
 *      sil, 3 step revize.
 *
 *   7. sikhye (REWRITE SURE KRITIK FIX): Klasik Kore sikhye pirinc
 *      + malt enzimasyonu 50-65°C 4-8 saat (Maangchi + Beyond Kimchee
 *      + Wikipedia 3 kaynak). DB total 45 dk (45 dk vs 4-8 saat,
 *      Codex hakli). 5 step replace (malt suyu cek + 30 dk dinlendir
 *      + 4 saat enzimleme rice cooker keep warm + kaynat 10-15 dk),
 *      total 45 → 275 dk (4 saat enzimleme dahil), pirinc 1→1.5 sb,
 *      malt 4→6 yk amount change.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-15.ts
 *   npx tsx scripts/fix-mini-rev-batch-15.ts --env prod --confirm-prod
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
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

interface IngredientAdd {
  name: string;
  amount: string;
  unit: string;
}

interface IngredientAmountChange {
  name: string;
  newAmount: string;
  newUnit?: string;
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
  recipeType?: RecipeType;
  difficulty?: Difficulty;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  averageCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  tipNote?: string;
  servingSuggestion?: string;
  allergensAdd?: Allergen[];
  allergensRemove?: Allergen[];
  ingredientsAdd?: IngredientAdd[];
  ingredientsRemove?: string[];
  ingredientsAmountChange?: IngredientAmountChange[];
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── 1: salatalikli-dereotlu-soguk-corba-isvec-usulu ────────
  {
    type: "rewrite",
    slug: "salatalikli-dereotlu-soguk-corba-isvec-usulu",
    reason:
      "REWRITE + cuisine 'se' KORUNUR. Kall gurksoppa Arla resmi + Tinis Kitchen + True North Kitchen 3 kaynak ile Isvec klasik yaz corbasi (Codex'in 'kanitsiz' suphesi yanlis). DB'de tuz + limon + sarimsak + karabiber + nane eksik. Total 10 dk yetersiz (30 dk dinlendirme dahil 45 dk olmali).",
    sources: [
      "https://www.arla.se/recept/kall-gurksoppa/",
      "https://www.tiniskitchen.com/kall-gurksoppa/",
      "https://true-north-kitchen.com/chilled-cucumber-soup/",
    ],
    description:
      "İsveç yaz mutfağının klasik soğuk çorbası kall gurksoppa'dan ilham alan bu tarif, salatalığı yoğurt, dereotu ve limonla buluşturur. Filmjölk geleneğinden esinlenir; yoğurtla yumuşak bir kıvam ve serin bir aroma yakalar.",
    prepMinutes: 15,
    cookMinutes: 0,
    totalMinutes: 45,
    ingredientsAdd: [
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "1", unit: "diş" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Taze nane (opsiyonel)", amount: "4", unit: "yaprak" },
    ],
    tipNote:
      "Salatalığı rendeleyip 5 dakika süzgeçte tuzla bekletmek fazla suyu çeker, çorba dağılmaz. Sarımsağı çok ince rende yapın, çiğ aroma baskınlaşmasın.",
    servingSuggestion:
      "Buz gibi soğuk servis edin; üstüne dereotu, ince salatalık küpleri ve birkaç damla zeytinyağı; yanına çıtır siyah ekmek.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Salatalıkları rendeleyip süzgece alın, 1 tutam tuz serpip 5 dakika süzdürün; suyunu hafif sıkın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Geniş kasede yoğurt, su, limon suyu ve rendelenmiş sarımsağı çırpıcıyla pürüzsüzleşene kadar karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Süzülmüş salatalığı sosa ekleyip karıştırın, ince kıyılmış dereotunu, tuz ve karabiberi ilave edin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çorbayı buzdolabında 30 dakika dinlendirin; aroma oturup soğuk yoğunluk kazansın.", timerSeconds: 1800 },
      { stepNumber: 5, instruction: "Soğuk kâseye alın, üstüne taze nane yaprakları, ince salatalık küpleri ve birkaç damla zeytinyağı gezdirip servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: susamli-kabak-corbasi-japon (KIMLIK GUCLENDIR) ──────
  {
    type: "rewrite",
    slug: "susamli-kabak-corbasi-japon-usulu",
    reason:
      "REWRITE + cuisine 'jp' KORUNUR + Japon kanonu eklenir. Klasik kabocha miso shiru: kabocha + dashi + miso + susam (Hikari Miso resmi + Just One Cookbook + Chef JA Cooks 3 kaynak). DB'de miso + dashi YOK, zencefil baskin (Cin/Tay esintisi, Japon klasiginde yok). Title 'Japon Usulu Susamli Kabocha Corbasi (Misolu)'. 6 ingredient_add (beyaz miso + kombu + shiitake + soya + yesil sogan + tuz), 1 ingredient_remove (taze zencefil), 2 amount change (susam 2→3 yk, su 4→3 sb), 6 step replace, SOYA allergen.",
    sources: [
      "https://hikarimiso.com/recipes/kabocha-miso-soup/",
      "https://www.justonecookbook.com/kabocha-miso-soup/",
      "https://chefjacooks.com/en/kabocha-squash-miso-soup/",
    ],
    newTitle: "Japon Usulü Susamlı Kabocha Çorbası (Misolu)",
    description:
      "Japon kabocha miso shiru'dan ilham alan bu tarif, tatlı kabocha kabağını dashi ve beyaz miso ile birleştirir. Kavrulmuş susamın umamisi tabağa Japon mutfağının sade dengesini taşır; miso ocağı kapattıktan sonra eklenerek aroması korunur.",
    prepMinutes: 10,
    cookMinutes: 15,
    totalMinutes: 25,
    allergensAdd: [Allergen.SOYA],
    ingredientsRemove: ["Taze zencefil"],
    ingredientsAdd: [
      { name: "Beyaz miso ezmesi", amount: "2", unit: "yemek kaşığı" },
      { name: "Kombu (kuru deniz yosunu)", amount: "1", unit: "5x5 cm" },
      { name: "Kuru shiitake", amount: "2", unit: "adet" },
      { name: "Soya sosu", amount: "1", unit: "çay kaşığı" },
      { name: "Yeşil soğan (servis için)", amount: "2", unit: "dal" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Susam", newAmount: "3", newUnit: "yemek kaşığı" },
      { name: "Su", newAmount: "3", newUnit: "su bardağı" },
    ],
    tipNote:
      "Misoyu mutlaka ocağı kapattıktan sonra ekleyin; kaynayınca aroma ve faydalı kültürler kaybolur. Susamı suribachi (havan) yoksa kahve değirmeniyle 2 saniye darbeleyip dahil edin.",
    servingSuggestion:
      "Sıcak kâseye alıp üstüne kavrulmuş bütün susam ve ince kıyılmış yeşil soğan serpin; yanına buharda pirinç.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kombu ve kuru shiitakeyi 3 su bardağı suyla 30 dakika ılık ortamda demleyin (dashi tabanı).", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Kabocha kabağını 2-3 cm parçalara doğrayın, kabuğu ince ise bırakabilirsiniz.", timerSeconds: null },
      { stepNumber: 3, instruction: "Demlenen dashiyi süzüp tencereye alın, kaynayınca kabocha parçalarını ekleyip orta ateşte 8-10 dakika yumuşayana kadar haşlayın.", timerSeconds: 540 },
      { stepNumber: 4, instruction: "Susamı kuru tavada orta ateşte 2 dakika kavurun, suribachi veya değirmen ile 2 saniye darbeleyip yarısını ezin.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Tencereyi ocaktan alın, beyaz miso ezmesini bir kepçe sıcak çorba suyunda eritip karışıma yedirin; soya sosu ve tuzu ilave edin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kâseye alın, üstüne ince kıyılmış yeşil soğan ve kavrulmuş bütün susam serpip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: sosisli-arpali-lahana-tava-polonya (kapusta+krupnik) ─
  {
    type: "rewrite",
    slug: "sosisli-arpali-lahana-tava-polonya-usulu",
    reason:
      "REWRITE + cuisine 'pl' KORUNUR. Polonist kielbasa lahana skillet + kapuśniak arpali varyant sentezi (Polonist + Eat Healthy 365 + kapuśniak arpali kanon, 3 kaynak). DB'de sogan + sarimsak + defne + caraway tohumu + paprika + tutsulu salca + mercankose eksik. Cuisine 'pl' KORUNUR (Codex itirazi yanlis: arpa Polonya'da krupnik/kapuśniak kombo kanonik). Title 'Polonya Usulu Kielbasali Arpali Lahana Tencere'. 11 ingredient_add, 2 amount change (su 2.5→3 sb, lahana 300→500 gr), 6 step replace.",
    sources: [
      "https://www.polonist.com/kielbasa-and-cabbage/",
      "https://www.polonist.com/kapusniak-polish-sauerkraut-soup/",
      "https://eathealthy365.com/the-best-authentic-polish-cabbage-soup-kapusniak/",
    ],
    newTitle: "Polonya Usulü Kielbasalı Arpalı Lahana Tencere",
    description:
      "Polonya mutfağının kapusta z kiełbasą skilleti ile arpalı krupnik geleneğinin sentezi. Tütsülü kielbasa, beyaz lahana ve incik arpa defne, yenibahar ve kimyon tohumuyla yavaş pişirilir; kırsal Polonya sofrasının tok ve baharatlı dengesini yakalar.",
    prepMinutes: 15,
    cookMinutes: 35,
    totalMinutes: 50,
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Sıvı yağ", amount: "1", unit: "yemek kaşığı" },
      { name: "Defne yaprağı", amount: "2", unit: "adet" },
      { name: "Yenibahar tanesi", amount: "4", unit: "adet" },
      { name: "Kimyon tohumu (caraway)", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tütsülü tatlı paprika", amount: "1", unit: "çay kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Mercanköşk (kuru)", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Su", newAmount: "3", newUnit: "su bardağı" },
      { name: "Lahana", newAmount: "500", newUnit: "gr" },
    ],
    tipNote:
      "Arpayı tencereye eklemeden 10 dk soğuk suda yıkamak fazla nişastayı atar, tane ayrı kalır. Kielbasayı önce kavurarak yağını çıkarmak hem aroma hem doğal sote yağı sağlar; caraway tohumunu defneyle eş zamanlı atın.",
    servingSuggestion:
      "Sıcak servis edin; yanına çavdar ekmeği ve kaşık yoğurt veya smetana (ekşi krema). Maydanoz serpebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Arpayı yıkayıp 10 dakika soğuk suda bekletin, süzün.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Sosisi yarım ay dilimleyin, geniş tencerede 1 yemek kaşığı yağda 4 dakika kavurun, yağını çıkarın, kevgirle alıp kenara koyun.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Aynı yağda tereyağını eritin, doğranmış soğanı 5 dakika pembeleştirin, sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 330 },
      { stepNumber: 4, instruction: "Defne yaprağı, yenibahar, caraway tohumu ve paprikayı 30 saniye baharat aroması çıkana kadar kavurun, ardından domates salçasını ekleyip 1 dakika daha karıştırın.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "Doğranmış lahanayı tencereye alıp 5 dakika yıkış oluncaya kadar pişirin, ardından arpa, su, tuz, karabiber ve mercanköşk ekleyip kaynatın; kapağı kapatıp kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Sosisi tekrar tencereye alıp 5 dakika daha birlikte pişirin, ateşten alıp 5 dakika dinlendirip servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 4: sumakli-kabak-sinkonta-manisa (KIBE-MUMBAR FULL) ────
  {
    type: "rewrite",
    slug: "sumakli-kabak-sinkonta-manisa-usulu",
    reason:
      "KIBE-MUMBAR FULL REWRITE. Manisa sinkonta klasik = balkabagi + sosu (salca + un + sirke + limon + sarimsak) + zeytinyagi + kuru nane + pul biber + 200°C firin 60 dk (Kultur Portali resmi + Manisa Valiligi + Hurriyet 3 kaynak). DB'de balkabagi yerine 'kabak', sumak (KANONSIZ!), tencere 15 dk = jenerik soganli kabak sote, sinkonta DEGIL. Title 'Manisa Balkabagi Sinkonta' (sumak title'dan cikar). 8 ingredient_add, 1 ingredient_remove (sumak), 2 amount change (zeytinyagi 3yk→0.5sb, kabak/balkabagi 4 ad→1 kg), 6 step replace, difficulty EASY→MEDIUM, total 34→80 dk.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/manisa/neyenir/snkonta",
      "https://visitmanisa.org/icerik/sinkonta",
      "https://www.hurriyet.com.tr/lezizz/sinkonta-tarifi-41720657",
    ],
    newTitle: "Manisa Balkabağı Sinkonta",
    description:
      "Manisa mutfağının kanonik fırın yemeği sinkonta, ince dilimlenmiş balkabağını yarım ay soğanla katlar; salça, un, sirke, limon, sarımsak ve zeytinyağıyla yapılan ekşi sosla 200°C fırında uzun pişirilir. Üzerine kuru nane ve pul biber serpilen yöre klasiğidir.",
    difficulty: Difficulty.MEDIUM,
    prepMinutes: 20,
    cookMinutes: 60,
    totalMinutes: 80,
    ingredientsRemove: ["Sumak"],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "6", unit: "diş" },
      { name: "Sirke", amount: "2", unit: "yemek kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Un", amount: "1", unit: "yemek kaşığı" },
      { name: "Limon (yarım)", amount: "1", unit: "adet" },
      { name: "Kuru nane", amount: "2", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "0.5", newUnit: "su bardağı" },
      { name: "Kabak", newAmount: "1", newUnit: "kg" },
    ],
    tipNote:
      "Sosu önce kâsede çırpıp sonra balkabaklara dökmek un topaklanmasını önler. Tepsiyi ilk 45 dakika folyoyla kapatmak balkabağının kendi suyunu salıp yumuşamasını sağlar; son 15 dakika açık üstü hafif karamellenir.",
    servingSuggestion:
      "Ilık veya soğuk servis edin; üstüne sarımsaklı yoğurt kaşığı ve kuru nane. Yanına bulgur pilavı veya pide.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Balkabağını parmak kalınlığında dilimleyin, fırın tepsisine düzgün dizin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Soğanı yarım ay ince dilimleyin, balkabaklarının üstüne yayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Ayrı kâsede salça, un, sirke, limon suyu, ezilmiş sarımsak, zeytinyağı, 1 su bardağı su ve tuzu çırpın; un eridiğinden emin olun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Sosu balkabaklarının üzerine eşit dökün, pul biber ve kuru naneyi serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tepsiyi folyoyla kapatın, 200°C ısıtılmış fırında 45 dakika pişirin (balkabağı kendi suyunu salsın).", timerSeconds: 2700 },
      { stepNumber: 6, instruction: "Folyoyu çıkarın, 15 dakika daha üstü hafif kızarana kadar pişirin; 5 dakika dinlendirip sarımsaklı yoğurtla servis edin.", timerSeconds: 900 },
    ],
  },

  // ─── 5: sirnak-fistikli-kuzu-tava (yore yumusatma) ──────────
  {
    type: "rewrite",
    slug: "sirnak-fistikli-kuzu-tava",
    reason:
      "REWRITE yore yumusatma. Sirnak yoresel envanterinde fistikli kuzu tava YOK (Sirnak Valiligi + KTB resmi 11 yemek listesi: Kutlık + Serbidev + Perdepilav + Kipe + diger; fistikli kuzu kombo yok). Antep fistigi Gaziantep mutfagi ozdes. Title 'Guneydogu Usulu Fistikli Kuzu Tava' (slug korunur). Kuyruk yagi 50→80 gr (650 gr et + 5 porsiyon icin gerceklik), antep fistigi 0.4→0.5 sb, step 5 instruction guncelle.",
    sources: [
      "https://www.sirnak.gov.tr/yemekler",
      "https://sirnak.ktb.gov.tr/TR-56457/yemekler.html",
      "https://www.lezzet.com.tr/lezzetten-haberler/gaziantep-yemekleri",
    ],
    newTitle: "Güneydoğu Usulü Fıstıklı Kuzu Tava",
    description:
      "Antep fıstığının kavrulmuş aromasıyla birleşen kuşbaşı kuzu tava, Güneydoğu Anadolu'nun et ve yeşil altın klasik eşleşmesini sade bir tavada toplar.",
    ingredientsAmountChange: [
      { name: "Kuyruk yağı", newAmount: "80", newUnit: "gr" },
      { name: "Antep fıstığı", newAmount: "0.5", newUnit: "su bardağı" },
    ],
    tipNote:
      "Antep fıstığını kabuksuz ve kıyılmış kullanın, son 2 dakikada serpip kavrulma kokusunu yakalayın. Kuyruk yağı klasik Güneydoğu kuzu tavasının imzasıdır.",
    servingSuggestion:
      "Sıcak servis edin; yanında bulgur pilavı, közlenmiş yeşil biber-domates ve sumaklı soğan piyazı.",
    stepsReplace: [
      { stepNumber: 5, instruction: "Kıyılmış antep fıstığını son 2 dakikada serpip kavrulma kokusu çıkana dek karıştırın, sıcak servis edin.", timerSeconds: 120 },
    ],
  },

  // ─── 6: simsir-coregi-kirsehir (title fix + step temizlik) ──
  {
    type: "rewrite",
    slug: "simsir-coregi-kirsehir-usulu",
    reason:
      "REWRITE title fix + step kalintı temizlik. 'Simsir' Turk mutfak sozlugunde KUCUK KASIK adi (Kayseri mantı icin 'simsir kasigi'), corek adi DEGIL. Kirsehir Valiligi + Biletbayi 17 yemek envanterinde simsir coregi YOK (kanitsiz). DB ingredient klasik Ic Anadolu mayalı corek (un + sut + yumurta + tereyagi + maya). Title 'Kirsehir Mayali Coregi'. Step 1+2+5 slug kalintisi sil, jenerik mayali corek akisi.",
    sources: [
      "https://www.kirsehir.gov.tr/kirsehir-yoresi-yemekleri-sehir-kartlari",
      "https://blog.biletbayi.com/kirsehir-yoresel-yemekler.html/",
    ],
    newTitle: "Kırşehir Mayalı Çöreği",
    description:
      "Kırşehir mayalı çöreği, sade mayalı hamuru tereyağı ve sütün yumuşaklığıyla birleştiren, İç Anadolu kahvaltısının klasik tok çöreklerinden biridir.",
    tipNote:
      "Hamuru ılık ortamda mayalandırmak gluten gevşemesini sağlar. Tereyağını eritip hamura katmak yumuşak iç doku verir.",
    servingSuggestion:
      "Sıcak servis edin; yanında demli çay ve kahvaltılık peynir, zeytin, reçel.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru malzemeleri (un + maya + tuz + şeker) bir kapta, yaş malzemeleri (ılık süt + yumurta + eritilmiş tereyağı) ayrı kapta karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yaş karışımı kuru malzemelere yedirip pürüzsüz yumuşak hamur olana kadar yoğurun, üzerini örtüp 20 dakika ılık ortamda mayalandırın.", timerSeconds: 1200 },
      { stepNumber: 3, instruction: "Hamurdan ceviz büyüklüğünde bezeler alıp avuç içinde yuvarlayın, yağlı tepsiye dizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üzerine yumurta sarısı sürün, susam veya çörek otu serpin; 185°C ısıtılmış fırında 25 dakika üstü altın renge dönene kadar pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Yüzeyi parlakken sıcak servis edin; soğursa gevrek kenarlar yumuşar, ılıkken yenmesi tercih edilir.", timerSeconds: null },
    ],
  },

  // ─── 7: sikhye (SURE KRITIK FIX) ─────────────────────────────
  {
    type: "rewrite",
    slug: "sikhye",
    reason:
      "SURE KRITIK FIX. Klasik Kore sikhye pirinc + malt enzimasyonu 50-65°C 4-8 saat (Maangchi + Beyond Kimchee + Wikipedia 3 kaynak; Andong sikhye birkac gun). DB total 45 dk yetersiz (Codex hakli). Pirinc 1→1.5 sb, malt tozu 4→6 yk amount change (Maangchi oran). 5 step replace (malt suyu cek + 30 dk dinlendir + 4 saat enzimleme rice cooker keep warm + kaynat 10-15 dk + cam fistik servis). Total 45 → 275 dk (4 saat enzimleme dahil). Cuisine 'kr' korunur.",
    sources: [
      "https://www.maangchi.com/recipe/sikhye",
      "https://www.beyondkimchee.com/korean-rice-punch-recipe-sikhye/",
      "https://en.wikipedia.org/wiki/Sikhye",
    ],
    description:
      "Kore'de yemek sonrası içilen sikhye, malt suyunun pirinç nişastasını enzimle parçalayıp doğal tatlılığa dönüştürdüğü serin bir içecektir; dinlenme süresi uzun olsa da aktif iş azdır.",
    prepMinutes: 20,
    cookMinutes: 255,
    totalMinutes: 275,
    ingredientsAmountChange: [
      { name: "Pişmiş pirinç", newAmount: "1.5", newUnit: "su bardağı" },
      { name: "Malt tozu", newAmount: "6", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Enzimleme 4-8 saat sürer; rice cooker keep warm modu veya kalın bir bez/yorgan altı en pratiğidir. Pirinç taneleri yüzeye çıkmaya başladığında enzimleme tamamdır.",
    servingSuggestion:
      "Buz gibi soğuk servis edin; üstüne çam fıstığı serpip kâseye alın. Ramazan benzeri uzun dinlenmeler veya yemek sonrası geleneksel içeceği olarak sunulur.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Malt tozunu 1.5 litre ılık (40°C) suya koyup elinizle 2-3 dakika ovalayın, malt suyunu salması için.", timerSeconds: 180 },
      { stepNumber: 2, instruction: "Karışımı 30 dakika dinlendirin, nişasta dibe çöksün; üst berrak sıvıyı dikkatle başka kaba aktarın, dipte kalan tortuyu atın.", timerSeconds: 1800 },
      { stepNumber: 3, instruction: "Pişmiş pirinci ısıya dayanıklı kapta malt suyuyla birleştirin, kapağı kapatıp 50-60°C ortamda 4-8 saat bekletin (rice cooker keep warm modu veya termos/yorgan altı ısı).", timerSeconds: 14400 },
      { stepNumber: 4, instruction: "Pirinç taneleri yüzeye çıkmaya başladığında enzimleme tamam; karışımı tencereye alın, şekeri ekleyip 10-15 dakika kaynatın, köpüğü alın.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Soğutup buzdolabında saklayın, çam fıstığı ile süsleyip soğuk servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-15");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  let rewriteUpdated = 0;
  let rewriteSkipped = 0;
  let notFound = 0;

  for (const op of OPS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: op.slug },
      select: {
        id: true,
        title: true,
        description: true,
        cuisine: true,
        type: true,
        difficulty: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
        tipNote: true,
        servingSuggestion: true,
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
      rewriteSkipped += 1;
      continue;
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
            const target = recipe.ingredients.find(
              (i) => normalize(i.name) === normalize(change.name),
            );
            if (target) {
              const data: Record<string, unknown> = { amount: change.newAmount };
              if (change.newUnit !== undefined) data.unit = change.newUnit;
              await tx.recipeIngredient.update({
                where: { id: target.id },
                data,
              });
            }
          }
        }

        if (op.ingredientsAdd && op.ingredientsAdd.length > 0) {
          const remainingIngredients = await tx.recipeIngredient.findMany({
            where: { recipeId: recipe.id },
            select: { name: true, sortOrder: true },
          });
          const maxSort = remainingIngredients.reduce(
            (m, i) => Math.max(m, i.sortOrder),
            0,
          );
          const existingNorm = new Set(remainingIngredients.map((i) => normalize(i.name)));
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
              paket: "oturum-28-mini-rev-batch-15",
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

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
