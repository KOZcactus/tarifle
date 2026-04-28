/**
 * Tek-seferlik manuel mini-rev batch 27 (oturum 30): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-26 ile
 * aynı audit, top 15-21 araliği). 7 klasik kanonik kanitli tarif (Hint
 * biryani + Türk şiş kebap + Meksikan fajita + Türk tencere yemegi +
 * Japon tantanmen + Türk milföy böreği + Şırnak sumaklı kuru patlıcan).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi (7 klasik kimlik
 * korunur). Pattern: jenerik step 2+5+6 boilerplate temizle + eksik
 * klasik baharat/aromatik tamamla.
 *
 *   1. tavuklu-biryani (Hint klasik): garam masala + safranlı su +
 *      yoğurt zaten var, eksik tuz + sıvı yağ/ghee + opsiyonel tarçın/
 *      karanfil/kakule (whole spices klasik) + opsiyonel kuru kayısı/
 *      badem garnitür. 5 ingredient_add, 6 step replace klasik dum
 *      pukht akış (marine + half-cook pirinç + kat dizilim + 30 dk
 *      kısık ateş demle).
 *
 *   2. tavuk-sis (Türk klasik): marinade complete (yoğurt + zeytinyağı
 *      + pul biber + kekik + tuz + karabiber + limon). Step 2+5+6
 *      jenerik. Eksik: opsiyonel sumak (servis), opsiyonel sarımsak
 *      marinade. 2 ingredient_add (sarımsak + sumak), 5 step replace.
 *
 *   3. tavuklu-fajita (Meksikan klasik): klasik fajita baharat (kimyon
 *      + paprika + oregano + kişniş + sarımsak + tuz). DB'de sadece
 *      kimyon + toz biber. Eksik: sarımsak + tuz + karabiber + opsiyonel
 *      kuru oregano + opsiyonel kişniş. 4 ingredient_add, 5 step
 *      replace.
 *
 *   4. tavuklu-bezelye (Türk tencere klasik): eksik sarımsak + tuz +
 *      karabiber + opsiyonel kuru nane. 4 ingredient_add, 5 step
 *      replace.
 *
 *   5. tantanmen (Japon ramen klasik): klasik komplo OK ama eksik
 *      şeker (sweet-savory denge) + sirke (klasik) + opsiyonel pak
 *      choi/yeşil sebze + opsiyonel taze soğan + tuz. 5 ingredient_add,
 *      6 step replace.
 *
 *   6. talas-boregi (Türk milföy klasik): klasik formul iyi ama eksik
 *      soğan (klasik harç) + opsiyonel kekik + opsiyonel kişniş/
 *      maydanoz garnitür. 3 ingredient_add, 5 step replace.
 *
 *   7. sumakli-kuru-patlican-dolgusu-sirnak-usulu (Şırnak yöre): klasik
 *      dolma harç eksik. Eksik: tuz, karabiber, opsiyonel maydanoz +
 *      kuru nane + limon suyu (sumakla denge). 5 ingredient_add, 6
 *      step replace klasik dolma akış.
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
  // ─── 1: tavuklu-biryani (Hint klasik dum pukht) ──────────────────
  {
    type: "rewrite",
    slug: "tavuklu-biryani",
    reason:
      "REWRITE jenerik scaffold + klasik biryani baharat tamamlama. Hint biryani klasik (Lucknow/Hyderabad/Sindhi varyantları) marinade + half-cook pirinç + kat dizilim + dum pukht (kısık ateşte demle). DB garam masala+safran+yoğurt zaten var, eksik tuz + sıvı yağ/ghee + opsiyonel whole spices (tarçın/karanfil/kakule) + opsiyonel kuru kayısı/badem topping. Title KORUNUR. cuisine 'in' KORUNUR. 5 ingredient_add, 6 step replace klasik dum pukht akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Biryani",
      "https://www.bbcgoodfood.com/recipes/chicken-biryani",
    ],
    description:
      "Hint mutfağının uzun pişen klasiği biryani; baharat dolu yoğurtlu marineli tavuk yarı pişmiş basmati pirinçle kat kat dizilip kısık ateşte demlenerek dum pukht tekniğiyle pişer.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1.5", unit: "tatlı kaşığı" },
      { name: "Sıvı yağ veya ghee", amount: "3", unit: "yemek kaşığı" },
      { name: "Tarçın çubuğu (opsiyonel whole spice)", amount: "1", unit: "adet" },
      { name: "Karanfil (opsiyonel whole spice)", amount: "4", unit: "tane" },
      { name: "Kakule (opsiyonel whole spice)", amount: "3", unit: "kapsül" },
    ],
    tipNote:
      "Pirinci tam pişirmeden, %70 tutmunda süzün; tavukla demlenirken kıvamını tamamlar. Tavuğu en az 1 saat marine edin, gece dinlendirirseniz aroma çok daha derinleşir.",
    servingSuggestion:
      "Yoğurtlu salatası (raita), kıyılmış kişniş ve kavrulmuş badem yongasıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk butlarını 3-4 cm parçalara doğrayın; yoğurt, ezilmiş zencefil, garam masala, tuz ve 1 yemek kaşığı sıvı yağla harmanlayıp en az 1 saat marine edin (mümkünse gece).", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Soğanları yarım ay ince doğrayın; kalan sıvı yağda altın kahve renge dönene kadar 8-10 dakika kavurun (klasik 'birista'); yarısını topping için ayırın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Marine tavuğu kavrulmuş soğanların yarısı üzerine ekleyip orta ateşte 10 dakika tüm yüzeyleri kapanana kadar pişirin.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Basmati pirinci 30 dakika ılık suda bekletip süzün; kaynar tuzlu suya whole spices (tarçın+karanfil+kakule) ekleyip pirinci %70 (al dente) 6-7 dakika haşlayıp süzün.", timerSeconds: 420 },
      { stepNumber: 5, instruction: "Geniş tencerenin altına tavuk-soğan karışımını yayın; üzerine yarı pişmiş pirinci kat halinde dökün, ayrılan birista ve safranlı suyu serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kapağı sıkıca kapatın (gerekirse hamurla mühürleyin), kısık ateşte 30 dakika dum pukht tekniğiyle demleyin; ocaktan alıp kapağı 5 dakika kapalı bekletin, çatalla kabartıp servis edin.", timerSeconds: 1800 },
    ],
  },

  // ─── 2: tavuk-sis (Türk şiş klasik) ──────────────────────────────
  {
    type: "rewrite",
    slug: "tavuk-sis",
    reason:
      "REWRITE jenerik scaffold + klasik tavuk şiş tamamlama. Türk klasik şiş (yoğurtlu marinade + ızgara). Marinade DB'de complete (yoğurt + zeytinyağı + pul biber + kekik + tuz + karabiber + limon). Step 2+5+6 jenerik. Eksik: sarımsak (klasik marinade) + sumak (klasik servis). Title KORUNUR. cuisine 'tr' KORUNUR. 2 ingredient_add, 5 step replace.",
    sources: [
      "https://yemek.com/tarif/tavuk-sis/",
      "https://www.kevserinmutfagi.com/tavuk-sis-tarifi.html",
    ],
    description:
      "Yoğurt, baharat ve limonlu marineyle yumuşatılmış tavuk göğsü parçalarının şişe dizilip ızgarada veya fırında kömürleşmiş yüzeyle pişirildiği klasik Türk şiş kebabı.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Sumak (servis için)", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Marine süresini en az 2 saat tutun, gece bırakırsanız çok daha lezzetli olur. Tavuğu kapalı kapta 2 saat bekletin; gece bekletecekseniz limon miktarını yarıya azaltın (asit yumuşatmayı abartmasın).",
    servingSuggestion:
      "Yanına bulgur veya pirinç pilavı, közlenmiş yeşil biber ve sumaklı soğan piyazıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 3 cm küpler halinde doğrayın; yoğurt, zeytinyağı, ezilmiş sarımsak, pul biber, kekik, tuz, karabiber ve limon suyuyla geniş kâsede karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Streçle örtüp buzdolabında en az 2 saat (mümkünse gece) marine edin.", timerSeconds: 7200 },
      { stepNumber: 3, instruction: "Marine tavukları metal şişlere sıkışık dizin, parçalar arasında çok boşluk bırakmayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Önceden ısıtılmış ızgarada veya 220°C fırında her yüzü kömürleşmeye başlayana kadar 15-20 dakika çevirerek pişirin.", timerSeconds: 1200 },
      { stepNumber: 5, instruction: "Şişlerden sıyırıp servis tabağına alın; üzerine sumak serpip pilav ve ezme ile sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tavuklu-fajita (Meksikan klasik) ──────────────────────────
  {
    type: "rewrite",
    slug: "tavuklu-fajita",
    reason:
      "REWRITE jenerik scaffold + klasik fajita baharat. Meksikan fajita klasik baharat (kimyon + paprika + oregano + kişniş + sarımsak + tuz). DB'de sadece kimyon + toz kırmızı biber + lime suyu. Eksik: sarımsak + tuz + karabiber + opsiyonel kuru oregano + opsiyonel kişniş. Title KORUNUR. cuisine 'mx' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Fajita",
      "https://www.simplyrecipes.com/recipes/chicken_fajitas/",
    ],
    description:
      "Meksika kökenli fajita; baharatlı tavuk şeritleri renkli biber ve soğanla yüksek ateşte tavada kavrulup, sıcak tortillalarla salsa, guacamole ve ekşi krema arasında dürülerek servis edilir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kuru kekik veya oregano", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tavuğu yüksek ateşte pişirin; sebzeler yumuşarken tavuk kurumaz. Lime suyunu yarısı marinade, yarısı pişme sonrası tabakta gezdirin; aroması net çıkar.",
    servingSuggestion:
      "Sıcak tortillalar, salsa verde, guacamole, doğranmış taze kişniş ve sarımsaklı yoğurt veya ekşi kremayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü ince şeritler halinde doğrayın; ezilmiş sarımsak, kimyon, toz kırmızı biber, oregano, tuz, karabiber, lime suyunun yarısı ve 1 yemek kaşığı zeytinyağıyla harmanlayıp 15 dakika marine edin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Biber ve soğanı uzun şerit doğrayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada kalan zeytinyağını yüksek ateşte ısıtın; tavukları 7-8 dakika tüm yüzeyleri kapanana ve hafif kızarana kadar kavurun.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Biber ve soğanı tavaya ekleyip 6-7 dakika daha yüksek ateşte sebzeler diri kalacak şekilde sotelendirin; kalan lime suyunu gezdirin.", timerSeconds: 420 },
      { stepNumber: 5, instruction: "Sıcak tortillalar, salsa, guacamole ve doğranmış kişnişle birlikte tabakta servis edin; herkes kendi tortillasını sarsın.", timerSeconds: null },
    ],
  },

  // ─── 4: tavuklu-bezelye (Türk tencere klasik) ─────────────────────
  {
    type: "rewrite",
    slug: "tavuklu-bezelye",
    reason:
      "REWRITE jenerik scaffold + klasik tencere baharat. Türk tencere yemegi klasik (tavuk + sebze + salça + soğan + tereyağı/zeytinyağı + tuz + karabiber + opsiyonel nane). DB tavuk+bezelye+patates+havuç+soğan+salça+zeytinyağı+su zaten var. Eksik: sarımsak + tuz + karabiber + opsiyonel kuru nane. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://yemek.com/tarif/tavuklu-bezelye/",
      "https://www.refikaninmutfagi.com/tavuklu-bezelye",
    ],
    description:
      "Tavuk parçaları, bezelye, havuç ve patatesle hazırlanan pratik Türk tencere yemeği; salça ve sarımsakla aromalanan, akşam telaşına yetişen ev klasiği.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kuru nane (opsiyonel)", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tavukları önce mühürleyin; sebzeler eklenince parçalanmadan pişer. Patatesleri sebzelerle aynı boyda doğramak (1.5-2 cm) eşit pişme sağlar.",
    servingSuggestion:
      "Bulgur pilavı veya pirinç pilavı, turşu ve cacıkla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavukları 2 cm küp doğrayıp tuz ve karabiberle baharatlayın; tencerede zeytinyağında yüksek ateşte 6 dakika mühürleyin.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ekleyip 4 dakika pembeleştirin; ezilmiş sarımsak ve domates salçasını katıp 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Doğranmış havuç, patates ve bezelyeyi ekleyip 2 dakika çevirin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Sıcak suyu ekleyin, kapağı kapalı kısık ateşte 25-30 dakika sebzeler yumuşayana kadar pişirin.", timerSeconds: 1800 },
      { stepNumber: 5, instruction: "Ocaktan almadan önce opsiyonel kuru naneyi serpin; 5 dakika dinlendirip servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 5: tantanmen (Japon ramen klasik) ────────────────────────────
  {
    type: "rewrite",
    slug: "tantanmen",
    reason:
      "REWRITE jenerik scaffold + Japon ramen klasik denge. Tantanmen Çin tan tan noodles'tan Japon ramen'e uyarlanmış klasik (tahin + soya + tavuk suyu + sarımsak + zencefil + chili yağı + kıyma topping). Eksik şeker (sweet-savory denge) + sirke (klasik tantanmen) + opsiyonel pak choi/yeşil sebze + opsiyonel taze soğan + tuz. Title KORUNUR. cuisine 'jp' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tantanmen",
      "https://www.justonecookbook.com/tantanmen-ramen/",
    ],
    description:
      "Tantanmen, Çin Sichuan dan dan noodles'ından Japon ramen'e uyarlanmış sıcak ve cesur bir kase; tahinli umami çorba, baharatlı kıyma topping ve diri ramen noodle ile katmanlanır.",
    ingredientsAdd: [
      { name: "Esmer şeker", amount: "1", unit: "tatlı kaşığı" },
      { name: "Pirinç sirkesi veya beyaz sirke", amount: "1", unit: "yemek kaşığı" },
      { name: "Pak choi veya ıspanak", amount: "2", unit: "su bardağı" },
      { name: "Taze soğan (servis)", amount: "2", unit: "dal" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tahinli suyu kaynatmadan ısıtın; fazla kaynama susam aromasını acılaştırır. Şeker ve sirkenin küçük miktarları umami dengesini kurar; klasik tantanmen sweet-savory-spicy üçlüsünde dengeli durur.",
    servingSuggestion:
      "Üzerine ince doğranmış taze soğan, ekstra chili yağı ve haşlanmış yumurta ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş tavada kıymayı yüksek ateşte 5 dakika dağıtmadan kavurun; ezilmiş sarımsak ve rendelenmiş zencefili ekleyip 30 saniye çevirin.", timerSeconds: 330 },
      { stepNumber: 2, instruction: "Soya sosunun yarısını, esmer şekeri ve sirkeyi katıp 2 dakika daha kavurarak suyunu çekene kadar pişirin; kıyma topping olarak kenara alın.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Çorba için tahini büyük bir kaseye alıp soya sosunun kalan yarısı, tuz ve kıyma yağıyla pürüzsüz kıvama gelene kadar çırpın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tavuk suyunu ayrı tencerede kaynama noktasına yakın ısıtın (kaynatmayın); tahinli karışıma yedirerek pürüzsüz çorba elde edin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Ramen noodle'ı paket süresine göre haşlayıp süzün; pak choi veya ıspanağı kaynar suda 30 saniye haşlayın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Servis kâselerine tahinli çorbayı paylaştırın; üzerine noodle, kıyma topping, haşlanmış yeşillik, taze soğan halkaları ve chili yağı ekleyip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: talas-boregi (Türk milföy klasik) ─────────────────────────
  {
    type: "rewrite",
    slug: "talas-boregi",
    reason:
      "REWRITE jenerik scaffold + klasik milföy harç tamamlama. Talaş Böreği Türk klasik (tavuklu sebze harç + milföy hamur + kare paket + 190°C fırın). DB klasik formul iyi (tavuk+bezelye+havuç+mantar+yumurta+zeytinyağı+tuz+karabiber). Eksik: soğan (klasik harç) + opsiyonel kekik + opsiyonel maydanoz garnitür. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://yemek.com/tarif/talas-boregi/",
      "https://www.kevserinmutfagi.com/talas-boregi.html",
    ],
    description:
      "Tavuk göğsü ve mevsim sebzelerinden hazırlanan iç harcın milföy hamuruna kare paketler halinde sarılıp fırında çıtır altın renge gelene kadar pişirildiği klasik Türk böreği.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Kuru kekik (opsiyonel)", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze maydanoz (servis)", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Harcı tamamen soğutun; sıcak harç milföy katlarını eritir, fırında düzgün kabarmaz. Milföyü buzdolabından yeni çıkarınca işleyin; oda sıcaklığına gelirse yumuşar.",
    servingSuggestion:
      "Ayran ve mevsim salatasıyla, üzerine kıyılmış maydanoz serperek sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü küçük küpler halinde doğrayıp tuz ve karabiberle baharatlayın; tavada zeytinyağında 5 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ekleyip 4 dakika pembeleştirin; doğranmış mantar, havuç ve bezelyeyi ekleyip 6 dakika daha sebzeler diri kalacak şekilde soteleyin, opsiyonel kekiği serpin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Harcı geniş tabağa yayıp tamamen soğumasını bekleyin (en az 30 dakika).", timerSeconds: 1800 },
      { stepNumber: 4, instruction: "Milföyleri açıp ortalarına 2 yemek kaşığı harç koyun; kenarları üst üste getirip kare paket yapın, kapanan tarafı tepsiye ters yerleştirin, üzerlerine yumurta sarısı sürün.", timerSeconds: null },
      { stepNumber: 5, instruction: "190°C ön ısıtılmış fırında 25-30 dakika altın rengi olana kadar pişirin; üzerine maydanoz serpip sıcak servis edin.", timerSeconds: 1800 },
    ],
  },

  // ─── 7: sumakli-kuru-patlican-dolgusu-sirnak (yöre klasik) ───────
  {
    type: "rewrite",
    slug: "sumakli-kuru-patlican-dolgusu-sirnak-usulu",
    reason:
      "REWRITE jenerik scaffold + dolma harç tamamlama. Şırnak/Güneydoğu kuru patlıcan dolması (zeytinyağlı, sumaklı). Step 3 'iç harcı hazırlayın' jenerik. DB ana bileşen iyi (kuru patlıcan + ince bulgur + sumak + soğan + salça + zeytinyağı). Eksik: tuz + karabiber + opsiyonel maydanoz + opsiyonel kuru nane + opsiyonel limon suyu (sumakla denge). Title KORUNUR. cuisine 'tr' KORUNUR. 5 ingredient_add, 6 step replace klasik dolma akış.",
    sources: [
      "https://yemek.com/tarif/kuru-patlican-dolmasi/",
      "https://blog.biletbayi.com/sirnak-yoresel-yemekler.html/",
    ],
    description:
      "Şırnak ve Güneydoğu hattının yaz kış ezvağı kuru patlıcanı, sumaklı bulgur iç harcıyla doldurulup zeytinyağlı tencerede yumuşatılan; ekşi-aromatik bir vejetaryen dolma.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze maydanoz", amount: "0.25", unit: "demet" },
      { name: "Kuru nane", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Kuru patlıcanı 6 dakika kaynar suda yumuşatmak iç harcı doldururken yırtılmadan esnek yapı sağlar. Bulgur harcını kuru patlıcana doldurmadan önce 10 dakika dinlendirin, baharatlar otursun.",
    servingSuggestion:
      "Üzerine ince taze soğan, taze maydanoz ve zeytinyağı gezdirip ılık servis edin; yanına yoğurt iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru patlıcanları kaynar suda 6 dakika yumuşatıp süzün; soğutmaya bırakın.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı zeytinyağında orta ateşte 4 dakika pembeleştirin; domates salçasını ekleyip 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Yıkanıp süzülmüş ince bulguru ekleyip 2 dakika çevirin; sumak, tuz, karabiber, kuru nane, doğranmış maydanoz ve limon suyunu katıp ocaktan alın.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "İç harcı 10 dakika dinlendirin (bulgur baharat ve sumakı çeksin).", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Yumuşamış kuru patlıcanları içlerine kaşıkla harcı doldurun; ucu açık kalsın, sıkıştırmayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Tencereye sıkışık dizip üzerine 1 su bardağı sıcak su ve 1 yemek kaşığı zeytinyağı gezdirin; kapağı kapalı kısık ateşte 18 dakika pişirip 5 dakika dinlendirin.", timerSeconds: 1080 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-27");
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
              paket: "oturum-30-mini-rev-batch-27",
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
