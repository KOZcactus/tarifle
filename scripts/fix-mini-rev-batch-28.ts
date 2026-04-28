/**
 * Tek-seferlik manuel mini-rev batch 28 (oturum 30): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-27 ile
 * aynı audit, top 22-28 araliği). 7 klasik kanonik kanitli tarif
 * (Levant/Fas shakshuka + Japon katsu + Mersin tantunisi CI 211 +
 * İspanya tortilla + Fas tagine + Macar hortobagyi + Modern karnabahar
 * kase).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi. Pattern: jenerik
 * scaffold temizle + eksik klasik baharat/aromatik tamamla.
 *
 *   1. white-bean-shakshuka (Levant/Fas klasik): domates + biber +
 *      soğan + sarımsak + kimyon + paprika + yumurta + zeytinyağı
 *      kanonik. DB'de soğan, sarımsak, kimyon, paprika EKSİK + boilerplate
 *      'soğursa gevrek kenar' leak. 5 ingredient_add, 6 step replace.
 *
 *   2. tavuk-katsu (Japon klasik): un+yumurta+panko triple breading +
 *      tonkatsu sosu. DB klasik OK ama eksik tuz + karabiber. 2
 *      ingredient_add, 5 step replace.
 *
 *   3. tantuni (Mersin Tantunisi CI 211, 21.03.2017 mahreç): klasik
 *      dana + pamuk yağı + tuz + kimyon + pul biber + sarımsak + sumak
 *      + maydanoz + soğan + lavaş. DB'de kimyon, pul biber, sarımsak
 *      EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   4. tortilla-kahvalti-sandvici-ispanya-usulu (İspanya tortilla
 *      española klasik): patates + yumurta + soğan + zeytinyağı
 *      (confit). DB soğan EKSİK + tuz + karabiber. Step 6 BOILERPLATE
 *      LEAK 'peynirli doku sertleşir'. 3 ingredient_add, 5 step replace.
 *
 *   5. tavuk-tagine (Fas klasik): zerdeçal + zencefil + tarçın + safran
 *      + kimyon + tuz + karabiber + zeytinyağı + ras el hanout opsiyonel.
 *      DB sadece zerdeçal var. 5 ingredient_add (zeytinyağı + tuz +
 *      karabiber + zencefil + tarçın), 6 step replace.
 *
 *   6. tavuklu-hortobagyi-palacsinta (Macar klasik): krep doldurma +
 *      paprika sos + ekşi krema. Mevcut formul OK ama jenerik step +
 *      eksik tuz + karabiber + tereyağı (klasik krep) + opsiyonel
 *      domates salçası. 4 ingredient_add, 5 step replace.
 *
 *   7. tavuklu-karnabahar-pilavi-kasesi (modern düşük karb): jenerik
 *      step + eksik tuz + karabiber + sarımsak + opsiyonel limon +
 *      opsiyonel kişniş garnitür. 5 ingredient_add, 5 step replace.
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
  // ─── 1: white-bean-shakshuka (Levant/Fas klasik) ──────────────────
  {
    type: "rewrite",
    slug: "white-bean-shakshuka",
    reason:
      "REWRITE jenerik scaffold + boilerplate leak + Levant shakshuka klasik baharat. Klasik shakshuka (Tunisia/Fas/Levant): domates + biber + sogan + sarimsak + kimyon + paprika + yumurta + zeytinyagi. DB'de sogan + sarimsak + kimyon + paprika EKSİK. Step 1+2+7 jenerik scaffold + step 7 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (kase yemeğinde kenar yok). Title KORUNUR. cuisine 'ma' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Shakshouka",
      "https://www.bbcgoodfood.com/recipes/shakshuka",
    ],
    description:
      "Domatesli sosun içine beyaz fasulye ve yumurta eklenince shakshuka daha tok, kaşıklanabilir bir kahvaltıya döner. Kimyon ve paprika Levant ve Kuzey Afrika imzasını verir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Kimyon", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tatlı toz biber (paprika)", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Sosu yumurtayı eklemeden 3 dakika koyulaştırın; fasulye dibi sulandırabilir. Kimyon ve paprikayı soğanla birlikte yağda kavurarak aroma derinleşir.",
    servingSuggestion:
      "Üstüne taze maydanoz veya kişniş serpip sıcak pide veya köy ekmeğiyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı ince doğrayın, sarımsağı ezin, kapya biberi küp doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtın; soğanı 4 dakika pembeleştirin, sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Kapya biberi ekleyip 3 dakika soteleyin; kimyon ve paprikayı katıp 30 saniye kavurarak aroma açın.", timerSeconds: 210 },
      { stepNumber: 4, instruction: "Domates püresini ve tuzu ekleyip orta ateşte 5 dakika koyulaştırın; haşlanmış beyaz fasulyeyi katıp 5 dakika daha pişirin.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Sosa kaşıkla çukurlar açıp yumurtaları kırın; kapağı kapalı kısık ateşte 5 dakika beyazlar tutana kadar pişirin (sarısı akışkan kalsın).", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Ocaktan alıp 2 dakika dinlendirin; üzerine taze yeşillik serperek tavadan sıcak servis edin.", timerSeconds: 120 },
    ],
  },

  // ─── 2: tavuk-katsu (Japon klasik) ────────────────────────────────
  {
    type: "rewrite",
    slug: "tavuk-katsu",
    reason:
      "REWRITE jenerik scaffold + Japon katsu klasik baharat. Tavuk katsu klasik (un+yumurta+panko triple breading + tonkatsu sosu). DB klasik OK ama eksik tuz + karabiber + sıvı yağ (kızartma için). Title KORUNUR. cuisine 'jp' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tonkatsu",
      "https://www.justonecookbook.com/chicken-katsu/",
    ],
    description:
      "Japon ev mutfağının çıtır panko kaplamalı tavuk katsu; un, yumurta ve panko ekmek kırıntısıyla üç katmanlı kaplanıp kızgın yağda altın renge gelene kadar kızartılır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sıvı yağ (kızartma için)", amount: "2", unit: "su bardağı" },
    ],
    tipNote:
      "Tavuğu döverek aynı kalınlığa (1.5-2 cm) getirin; panko yanmadan içi pişer. Yağı 175°C'ye getirin; çubukla denerken çevresine küçük kabarcıklar gelmeli.",
    servingSuggestion:
      "İnce doğranmış lahana salatası, hazır tonkatsu sosu, soya sosu ve buharda pirinç pilavıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğüslerini iki katlı strecin arasında etbalyozuyla aynı kalınlığa (1.5-2 cm) inceltin; tuz ve karabiberle iki yüzünü ovun.", timerSeconds: null },
      { stepNumber: 2, instruction: "Üç ayrı kâseye sırayla un, çırpılmış yumurta ve pankoyu hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Her tavuğu sırasıyla una, yumurtaya ve pankoya batırın; pankoyu hafifçe bastırarak yapışmasını sağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada yağı 175°C'ye ısıtın; tavukları her yüzü altın renge gelene kadar 4-5 dakika kızartın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Kâğıt havluya alıp fazla yağı süzdürün, 2 cm kalınlığında dilimleyin ve sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tantuni (Mersin Tantunisi CI 211 klasik) ──────────────────
  {
    type: "rewrite",
    slug: "tantuni",
    reason:
      "REWRITE jenerik scaffold + Mersin Tantunisi CI 211 klasik baharat. Mersin Tantunisi Türk Patent CI 211 (21.03.2017 mahreç): klasik formül dana + pamuk yagi + tuz + kimyon + pul biber + sarimsak + sumak + maydanoz + sogan + lavas. DB'de kimyon + pul biber + sarimsak EKSİK. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38131",
      "https://www.lezzet.com.tr/yemek-tarifleri/et-yemekleri/kirmizi-et-tarifleri/mersin-usulu-tantuni",
    ],
    description:
      "Mersin Tantunisi (Türk Patent coğrafi işaret tescili 211, 21 Mart 2017); ince doğranmış dana etinin pamuk yağında pul biber, kimyon ve sarımsakla sacda kavrulup ince lavaşa sumaklı soğan ve domatesle sarıldığı klasik sokak dürümü.",
    ingredientsAdd: [
      { name: "Kimyon", amount: "1", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
    ],
    tipNote:
      "Eti küçük, mümkünse zar inceliğinde doğrayın; sacda kısa sürede yumuşak ve sulu kalır. Su şoklama tekniği klasik tantuni imzası: et kurumaya başlarsa azar azar ılık su gezdirin.",
    servingSuggestion:
      "Limon dilimleri, sumaklı soğan piyazı, acı biber turşusu ve ayranla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Dana etini zar inceliğinde küçük parçalara doğrayın; tuzlu suda 20 dakika hafifçe haşlayıp süzün (klasik tantuni teknik).", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Geniş sacda veya tavada pamuk yağı yüksek ateşte ısıtın; süzülmüş eti yayıp tuz, kimyon, pul biber ve ezilmiş sarımsağı serpin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Eti 8 dakika sürekli çevirerek kavurun; et kurumaya başlarsa azar azar ılık su gezdirerek (su şoklama) sosu kıvamlanana dek pişirmeye devam edin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Lavaşları sacın boş köşesine alıp 10 saniye et yağına değdirin; doğranmış domates, sumakla harmanlanmış soğan ve maydanozu üzerine yayın.", timerSeconds: 10 },
      { stepNumber: 5, instruction: "Sıcak eti lavaşa paylaştırıp dürüm sarın, çapraz keserek limon ve acı biber turşusuyla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: tortilla-kahvalti-sandvici-ispanya (BOILERPLATE LEAK) ────
  {
    type: "rewrite",
    slug: "tortilla-kahvalti-sandvici-ispanya-usulu",
    reason:
      "REWRITE jenerik scaffold + BOILERPLATE LEAK + İspanya tortilla klasik. Klasik tortilla española: patates + yumurta + sogan + zeytinyagi confit + tuz. DB'de sogan EKSİK + tuz + karabiber. Step 1+2 jenerik scaffold + step 6 BOILERPLATE LEAK 'peynirli doku sertleşir' (sandviç tarif değil çörek pattern leak). Title KORUNUR. cuisine 'es' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Spanish_omelette",
      "https://www.bbcgoodfood.com/recipes/spanish-omelette-tortilla",
    ],
    description:
      "İspanya'nın klasik tortilla española'sından ilham alan kahvaltı sandviçi; patatesli omleti köy ekmeği ve kaşar peyniriyle buluşturan, sabah koşuşturmasına yetişen pratik bir öğün.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "küçük adet" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Patatesi ince doğramak omletin ortasında hamluk kalmasını önler. Soğan ve patatesi zeytinyağında düşük ateşte birlikte konfit etmek klasik İspanya tekniğidir.",
    servingSuggestion:
      "Tahta tepsiye yerleştirip bir sürahi taze portakal suyu ve karmaşık tane ekmek dilimleriyle sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesi ince halka, soğanı yarım ay doğrayın; geniş tavada zeytinyağında düşük ateşte 10 dakika konfit edin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Yumurtaları tuz ve karabiberle çırpın; kaşar peynirinin yarısını rendeleyip yumurtaya katın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Süzülmüş patates ve soğanı yumurta karışımına alın; aynı tavayı bir kaşık zeytinyağıyla tekrar ısıtıp karışımı dökün, 4 dakika alt yüzü tutana kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Bir tabağın yardımıyla omleti çevirin, diğer yüzünü 2 dakika daha pişirin; ocaktan alın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Köy ekmeğini ızgara veya tostta hafif kızartın; arasına omleti dilimleyip yerleştirin, kalan kaşar peyniri ekleyip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: tavuk-tagine (Fas klasik baharat) ─────────────────────────
  {
    type: "rewrite",
    slug: "tavuk-tagine",
    reason:
      "REWRITE jenerik scaffold + Fas tagine klasik baharat. Fas tagine klasik (limon turşusu + zeytin + zerdeçal + zencefil + tarçın + safran + kimyon + tuz + karabiber + zeytinyağı + ras el hanout opsiyonel). DB sadece zerdeçal var, ana baharat seti EKSİK. Title KORUNUR. cuisine 'ma' KORUNUR. 5 ingredient_add (zeytinyağı + tuz + karabiber + zencefil + tarçın), 6 step replace klasik tagine akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Tajine",
      "https://www.bbcgoodfood.com/recipes/moroccan-chicken-tagine-preserved-lemons-olives",
    ],
    description:
      "Fas evlerinde limon turşusu ve yeşil zeytinle kokan klasik tavuk tagine; zerdeçal, zencefil ve tarçınla yumuşatılan tavuk butları yavaş ateşte sosunu çekene dek pişer.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Toz zencefil", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Limon turşusunun içini çıkarıp kabuğunu ince doğrayın; acılık kontrollü kalır. Tagine kapaklı yapılırsa buhar yoğunlaşıp damlayarak tavuk sulu kalır; klasik dökme demir tencerede de yapılabilir.",
    servingSuggestion:
      "Couscous, taze kişniş ve kabukları çıtır kalmış sıcak ekmekle sosunu toplayarak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk butlarını tuz, karabiber, zerdeçal, zencefil ve tarçınla ovun; 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Geniş tencerede zeytinyağını ısıtın; tavukları yüksek ateşte 8 dakika tüm yüzeyleri kapanana kadar mühürleyin, kenara alın.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Aynı tencerede ince doğranmış soğanı 4 dakika pembeleştirin; ezilmiş sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Tavukları tencereye geri alın, 300 ml sıcak su ekleyin; kapağı kapalı kısık ateşte 45 dakika pişirin.", timerSeconds: 2700 },
      { stepNumber: 5, instruction: "Doğranmış limon turşusu ve yeşil zeytini ekleyip 7 dakika daha pişirin; sos koyulaşana ve aroma birleşene dek bekleyin.", timerSeconds: 420 },
      { stepNumber: 6, instruction: "Ocaktan alıp üzerine kıyılmış taze kişniş serpin; sıcak ekmekle sosunu toplayarak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tavuklu-hortobagyi-palacsinta (Macar klasik) ──────────────
  {
    type: "rewrite",
    slug: "tavuklu-hortobagyi-palacsinta",
    reason:
      "REWRITE jenerik scaffold + Macar Hortobagyi klasik. Macar Hortobagyi palacsinta klasik (krep doldurma + paprika sos + ekşi krema). Mevcut formul iyi (un + yumurta + tavuk + ekşi krema + paprika + soğan + tavuk suyu) ama jenerik step + eksik tuz + karabiber + tereyağı (klasik krep) + opsiyonel domates salçası. Title KORUNUR. cuisine 'hu' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Hortob%C3%A1gyi_palacsinta",
      "https://www.daringgourmet.com/hortobagyi-palacsinta-hungarian-meat-stuffed-crepes/",
    ],
    description:
      "Macar mutfağının lezzetli klasiği Hortobagyi palacsinta; ince krepler tavuklu paprika harçla doldurulup ekşi krema soslu paprika sosla fırınlanır, ulusal bayram sofralarının vazgeçilmezi.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Domates salçası (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Krepleri bir gün önceden hazırlarsanız doldururken yırtılma riski azalır. Paprika sosu kaynama noktasına yaklaştırın ama kaynatmayın; ekşi krema kesilebilir.",
    servingSuggestion:
      "Üstüne ekstra paprika sos ve bir kaşık ekşi krema gezdirip taze maydanozla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Krep hamurunu hazırlayın: un + yumurta + 1 su bardağı süt + 1 tutam tuz + 1 yemek kaşığı eritilmiş tereyağı; çırpıp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "İnce krepleri sıcak yağlanmış tavada her iki yüzü hafif altın olana kadar pişirin (her krep ~1 dakika).", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Tavada tereyağında doğranmış soğanı 4 dakika pembeleştirin; toz kırmızı biber, opsiyonel domates salçası, tuz ve karabiberi ekleyip 1 dakika kavurun, didiklenmiş tavuk ve yarım ölçü ekşi kremayı katıp 5 dakika pişirin.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Krepleri açıp ortalarına 2 yemek kaşığı tavuklu harç koyun, kenarları kapatarak rulo yapın; yağlanmış fırın kabına dizin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kalan ekşi kremayı tavuk suyuyla pürüzsüzleştirip krepleri üzerine dökün; 180°C fırında 15 dakika üst kızarana kadar pişirip servis edin.", timerSeconds: 900 },
    ],
  },

  // ─── 7: tavuklu-karnabahar-pilavi-kasesi (modern düşük karb) ──────
  {
    type: "rewrite",
    slug: "tavuklu-karnabahar-pilavi-kasesi",
    reason:
      "REWRITE jenerik scaffold + modern düşük karb kase. Modern karnabahar pilavı (cauliflower rice) low-carb pattern: karnabahar rondoda + tavuk + sarımsak + tuz + karabiber + opsiyonel taze yeşillik. DB hiç aromatik (sarımsak/tuz/karabiber) yok = jenerik scaffold. Title KORUNUR. cuisine 'us' KORUNUR. 5 ingredient_add (sarımsak + tuz + karabiber + limon suyu + taze maydanoz/kişniş), 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Cauliflower_rice",
      "https://www.bbcgoodfood.com/recipes/cauliflower-rice",
    ],
    description:
      "Düşük karbonhidrat hedefiyle pirinç yerine rondoda küçültülmüş karnabahar tabanı kullanan, baharatlı tavuk ve avokado dilimleriyle zenginleşen pratik tek kase öğün.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Taze maydanoz veya kişniş", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Karnabaharı tavada kısa tutmak (4-5 dakika) tane hissini korur; uzun pişirilirse yumuşar ve püre kıvamına yaklaşır. Limon suyunu son anda ekleyerek yeşillik ve avokado tabağa tazelik katın.",
    servingSuggestion:
      "Yanına dilimlenmiş avokado ve domates, üzerine taze yeşillik serperek ılık servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Karnabaharı küçük parçalara ayırıp rondoda darbeleyerek pirinç tanesi boyuna getirin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavuk göğsünü 2 cm küp doğrayıp tuz ve karabiberle baharatlayın; tavada zeytinyağında yüksek ateşte 6-7 dakika tüm yüzeyleri kapanana ve hafif kızarana kadar pişirin.", timerSeconds: 420 },
      { stepNumber: 3, instruction: "Ezilmiş sarımsağı ekleyip 30 saniye çevirin; aroma açılsın.", timerSeconds: 30 },
      { stepNumber: 4, instruction: "Karnabahar pirincini tavaya alın, 4-5 dakika çevirerek pişirin; tane hissi korunsun.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Limon suyunu gezdirin, ocaktan alıp servis kâselerine paylaştırın; üzerine dilimlenmiş avokado ve taze yeşillik koyup ılık servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-28");
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
              paket: "oturum-30-mini-rev-batch-28",
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
