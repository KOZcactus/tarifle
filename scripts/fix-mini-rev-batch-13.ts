/**
 * Tek-seferlik manuel mini-rev batch 13 (oturum 28): 7 KRITIK tarif fix.
 * Web research 2 paralel agent + 24+ kaynak (Wikipedia + Woks of Life
 * + Omnivore's Cookbook / Sanliurfa Belediyesi + SUTSO CI + Hurriyet
 * Lezizz / Wikipedia Carbonara + Pina Bresciani + Recipes from Italy /
 * Yemek.com Su Boregi + Hurriyet + Lezzet.com.tr / Eskisehir KTB +
 * Karaca Blog + Lezzet.com.tr Eskisehir / Swasthi's Recipes Chicken
 * Pulao + Piping Pot Curry / Kastamonu Yöresel Ürünleri + Academia
 * Kastamonu CI + Mudurnu Helva).
 *
 * Verdict: 7 REWRITE (4 klasik forma cek + 1 cuisine-region fix
 * Sichuan + 1 Türk pazar uyarlama disambiguate Carbonara + 1 yore
 * yumusatma). Slug korunur (URL break onleme). 5 tarifte title degisimi.
 *
 *   1. sanghay-susamli-dan-dan-noodle (REGION FIX): Dan Dan Noodle
 *      Sichuan-Chengdu kokenli (Wikipedia + Woks of Life + Omnivore's
 *      3 kaynak). Sanghay yore yanlis. Title 'Sichuan Dan Dan Noodle'.
 *      5 ingredient_add (sarimsak + Chinkiang sirke + Sichuan biberi
 *      + seker + ya cai), 2 amount change.
 *
 *   2. urfa-agzi-acik (KIBE-MUMBAR REWRITE FULL): Sanliurfa CI tescilli
 *      acik pide (Sanliurfa Belediyesi + SUTSO + Hurriyet 3 kaynak).
 *      DB tarif klasik bilesenler (isot, maydanoz, yumurta, sade yag,
 *      salca, karabiber, tuz) eksik + jenerik scaffold steps. 7
 *      ingredient_add, 1 amount change, 5 step replace, YUMURTA
 *      allergen ekle.
 *
 *   3. spaghetti-carbonara (DISAMBIGUATE Türk pazar uyarlama): Klasik
 *      Roma carbonara guanciale + yumurta sarisi + Pecorino Romano +
 *      karabiber, krema/sut YOK (Wikipedia + Pina Bresciani + Recipes
 *      from Italy). DB dana pastirma uyarlama, klasik kimligi degistirir.
 *      Title 'Spaghetti Carbonara (Türk Pazari Uyarlamasi)', description
 *      explicit guanciale notu + helal alternatif. Step 5 dinlendirme
 *      adimi SIL (carbonara hemen servis edilir).
 *
 *   4. su-boregi (KIBE-MUMBAR FORMA CEK): Klasik su boregi el acma
 *      yumurtali hamur + tuzlu suda haslama + tereyagi (Yemek.com +
 *      Hurriyet + Lezzet 3 kaynak). DB hazir borek yufkasi + sutlu sos
 *      = yalanci su boregi sablonu, klasik kimligi bozulmus. 5
 *      ingredient_add (un + yumurta hamur + tlk su + tuz + lor), 3
 *      ingredient_remove (Borek yufkasi + Sut + Sivi yag), 1 amount
 *      change (tereyagi 50→200gr), 5 step replace.
 *
 *   5. tatar-boregi-eskisehir-usulu (KIBE-MUMBAR REWRITE FULL): Klasik
 *      Eskisehir Tatar Boregi yumurtali sert hamur + cig kiymali ic +
 *      haslama + sarimsakli yogurt (Karaca Blog + KTB + Lezzet 3 kaynak;
 *      1860 Kirim Tatar gocu). DB sadece bos haslanmis hamur + yogurt,
 *      kıymasız = Tatar boregi degil. Title 'Eskisehir Tatar Boregi'.
 *      4 ingredient_add (yumurta + dana kiyma + sogan + karabiber), 3
 *      amount change, 6 step replace.
 *
 *   6. tereyagli-tavuklu-pirinc-tava-hindistan-usulu (CUISINE KORUMA
 *      + KIMLIK GUCLENDIR): Hint pulao klasik basmati + jeera +
 *      zerdecal + garam masala + kakule + ghee (Swasthi's + Piping Pot
 *      2 kaynak). DB sade Türk pilavi, Hint baharatlari yok. Cuisine
 *      'in' KORUNUR, baharat seti ile pulao kimligi kazandirilir.
 *      Title 'Hint Usulü Tavuklu Pulao'. 13 ingredient_add (sogan +
 *      sarimsak + zencefil + yogurt + kimyon + zerdecal + garam masala
 *      + kakule + karanfil + defne + tarcin + kisnis + tuz), 1 amount
 *      change (tereyagi 2→3 yk), 6 step replace.
 *
 *   7. siyezli-kes-durumu-kastamonu-usulu (YORE YUMUSATMA): Kastamonu
 *      siyez bugday + kes peyniri yoresel ama 'durum' kombo CI'da YOK
 *      (Kastamonu Yoresel + Academia CI 2 kaynak). Title 'Siyezli
 *      Bazlamada Tereyagli Kes', description 'Kastamonu esintili'
 *      yumusatma. 3 ingredient_add (yogurt + kabartma tozu + pul biber),
 *      1 amount change (tereyagi 25→30g), 5 step replace.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description check).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-13.ts
 *   npx tsx scripts/fix-mini-rev-batch-13.ts --env prod --confirm-prod
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
  // ─── 1: sanghay-susamli-dan-dan-noodle (REGION FIX) ─────────
  {
    type: "rewrite",
    slug: "sanghay-susamli-dan-dan-noodle",
    reason:
      "REGION FIX: Dan Dan Noodle Sichuan-Chengdu kokenli (1841 Chen Babao, omuz sirigi 'dan dan' adi). Sanghay yore yanlis. Title 'Sichuan Dan Dan Noodle' (slug korunur, URL break onleme). DB'de klasik dengeleyiciler (sirke, sarimsak, seker, Sichuan biberi) eksik; ya cai opsiyonel topping. Wikipedia + Woks of Life + Omnivore's 3 kaynak.",
    sources: [
      "https://en.wikipedia.org/wiki/Dandan_noodles",
      "https://thewoksoflife.com/dan-dan-noodles/",
      "https://omnivorescookbook.com/dan-dan-noodles/",
    ],
    newTitle: "Sichuan Dan Dan Noodle",
    description:
      "Sichuan'ın Chengdu sokaklarından doğan dan dan noodle, susam ezmesi, Chinkiang sirkesi, sarımsak ve chili oil'in dengeli emülsiyonuyla buğday eriştesini kaplayan klasik bir ma-la (uyuşturucu-baharatlı) kasesidir.",
    prepMinutes: 15,
    cookMinutes: 12,
    totalMinutes: 27,
    ingredientsAdd: [
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Chinkiang siyah sirkesi", amount: "1", unit: "yemek kaşığı" },
      { name: "Sichuan biberi (çekilmiş)", amount: "0.5", unit: "çay kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "çay kaşığı" },
      { name: "Ya cai veya zha cai (opsiyonel)", amount: "2", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Acı yağ", newAmount: "3", newUnit: "yemek kaşığı" },
      { name: "Yer fıstığı", newAmount: "0.33", newUnit: "su bardağı" },
    ],
    tipNote:
      "Susam ezmesini soya/sirke ile karıştırmadan önce 1-2 yemek kaşığı erişte suyu ekleyin; pürüzsüz emülsiyon böyle yakalanır, taneli kalmaz.",
    servingSuggestion:
      "Sıcak servis edin, masada her tabağı tabandan yukarı doğru karıştırın; chili oil ve susam katmanları erişteyi ancak böyle eşit kaplar.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Erişteyi tuzlu kaynar suda paketteki süreye göre haşlayın (4-5 dakika), süzmeden önce 1 kepçe haşlama suyunu ayırın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Tavada 1 yemek kaşığı tarafsız yağ ısıtın, kıymayı ya cai ile birlikte 5 dakika tane tane kavurun, az soya gezdirip ateşten alın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Servis kasesinin dibine ezilmiş sarımsak, susam ezmesi, soya sosu, Chinkiang sirkesi, çekilmiş Sichuan biberi, şeker ve chili oil koyup 2 yemek kaşığı erişte suyuyla pürüzsüz emülsiyona getirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Süzdüğünüz erişteyi sosun üstüne yerleştirin, kıymalı karışımı ortaya yığın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yer fıstığı ve taze soğanı serpip servis öncesi tabakta tabandaki sosu yukarı çevirin; ma-la dengesi her lokmada eşit dağılsın.", timerSeconds: null },
    ],
  },

  // ─── 2: urfa-agzi-acik (KIBE-MUMBAR REWRITE FULL) ───────────
  {
    type: "rewrite",
    slug: "urfa-agzi-acik",
    reason:
      "KIBE-MUMBAR pattern. Sanliurfa CI tescilli acik pide (Sanliurfa Belediyesi resmi + SUTSO arsivi + Hurriyet Lezizz 3 kaynak). DB tarifte klasik bilesenler (isot=Urfa biberi, maydanoz, yumurta, sade yag, salca, karabiber, tuz) eksik; jenerik scaffold steps ('ana malzemeleri olcup...'). 7 ingredient_add, 1 amount change, 5 step replace, YUMURTA allergen ekle.",
    sources: [
      "https://www.sanliurfa.bel.tr/icerik/108/61/agzi-acik",
      "https://www.hurriyet.com.tr/lezizz/agzi-acik-tarifi-urfa-yoresi-41956727",
      "https://yemek.com/tarif/agzi-acik/",
    ],
    description:
      "Şanlıurfa'nın coğrafi işaret tescilli açık pidesi. İsot (Urfa biberi), maydanoz ve soğanla yoğrulan kıymalı harç, küçük açılmış hamurun ortasına bastırılır; ortası açık kalacak şekilde sade yağda kızartılır veya fırında pişirilir.",
    prepMinutes: 40,
    cookMinutes: 20,
    totalMinutes: 60,
    allergensAdd: [Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "İsot (Şanlıurfa biberi)", amount: "1", unit: "yemek kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Sade yağ (kızartma için)", amount: "1", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Un", newAmount: "600", newUnit: "gr" },
    ],
    tipNote:
      "Soğanı yoğurmadan önce suyunu sıkmayı unutmayın; aksi halde harç sulanır ve yufka delinir. İsot Şanlıurfa coğrafi işaretinin temel aromatik unsuru, atlanmamalı.",
    servingSuggestion:
      "Sıcakken cacık, ayran veya közlenmiş biber-domates salatasıyla servis edin; yöresel sofrada bostananın yanına yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Hamur için unu, 1 yumurtayı, 2 yemek kaşığı sade yağı, 1 çay kaşığı tuzu ve azar azar ılık suyu yoğurun; kulak memesinden biraz sert, pürüzsüz bir hamur olsun. Üzerini örtüp 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Harç için soğanı çok ince rendeleyin, suyunu hafif sıkın. Kıymayı, soğanı, biber ve domates salçasını, isotu, ince kıyılmış maydanozu, 1 yumurtayı, tuzu ve karabiberi geniş bir kapta 3 dakika yoğurun.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Hamuru ceviz büyüklüğünde parçalara bölün, oklava ile her parçayı 8-10 cm çapında yuvarlak ince yufka açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Her yufkanın ortasına 1 yemek kaşığı harç koyup parmaklarınızla yayın; kenarları çirtikleyerek ortası 1-2 cm açık kalacak şekilde kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Geniş tavada sade yağı ısıtın, ağzı açıkları önce kıymalı tarafı altta olacak şekilde 2-3 dakika kızartın, çevirip 2 dakika daha pişirin. Alternatif: 200°C fırında 20 dakika pişirin.", timerSeconds: 300 },
    ],
  },

  // ─── 3: spaghetti-carbonara (Türk pazar uyarlama disambiguate) ──
  {
    type: "rewrite",
    slug: "spaghetti-carbonara",
    reason:
      "DISAMBIGUATE Türk pazar uyarlama (jeyuk-bokkeum/tonkatsu/xiao-long-bao pattern). Klasik Roma carbonara guanciale + yumurta sarisi + Pecorino Romano + karabiber, krema/sut YOK (Wikipedia + Pina Bresciani + Recipes from Italy 3 kaynak; Italian Academy of Cuisine onayli). DB dana pastirma uyarlama klasik kimligi degistirir. Title revize, description guanciale klasik notu + helal alternatif. Step 5 dinlendirme adimi SIL (carbonara hemen servis).",
    sources: [
      "https://en.wikipedia.org/wiki/Carbonara",
      "https://pinabresciani.com/authentic-carbonara/",
      "https://www.recipesfromitaly.com/spaghetti-carbonara-original-recipe/",
    ],
    newTitle: "Spaghetti Carbonara (Türk Pazarı Uyarlaması)",
    description:
      "Roma'nın klasik carbonarası guanciale (domuz yanağı), yumurta sarısı, Pecorino Romano ve karabiberle hazırlanır; krema veya süt kesinlikle yer almaz. Bu uyarlama Türk pazarına yönelik olarak guanciale yerine dana pastırması kullanır; klasik tat profili tam karşılanmaz, helal alternatif olarak sunulur.",
    prepMinutes: 5,
    cookMinutes: 12,
    totalMinutes: 17,
    ingredientsAmountChange: [
      { name: "Tuz", newAmount: "2", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Yumurta sosu kesinlikle kapalı ocakta eklenir; tavadaki kalan ısı yeterlidir. Karıştırırken yumurta granül oluyorsa 1 yemek kaşığı daha haşlama suyu ekleyin.",
    servingSuggestion:
      "Tabağa alır almaz servis edin; carbonara dinlendirilen değil, anında yenen bir yemektir. Yanına basit yeşil salata.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş tencerede 4 litre suyu kaynatın, bol tuz atın. Spaghettiyi al dente süresinin 1 dakika eksiğine kadar haşlayın; süzmeden önce 1 su bardağı haşlama suyunu ayırın.", timerSeconds: 540 },
      { stepNumber: 2, instruction: "Pastırmayı küçük küpler doğrayın, soğuk tavaya alın, kısık ateşte 5 dakika yağı çıkana ve kenarları kızarana kadar pişirin; ateşten alıp tavayı kenara koyun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Geniş bir kapta yumurta sarılarını rendelenmiş Pecorino ve taze çekilmiş karabiberle çırpın; pürüzsüz krema kıvamına gelene kadar.", timerSeconds: null },
      { stepNumber: 4, instruction: "Süzdüğünüz spaghettiyi pastırmalı tavaya alın, ocağı kapatın. Yumurta-peynir karışımını dökün, 2-3 yemek kaşığı haşlama suyu ekleyip hızla karıştırın; yumurta ipeksi sosa dönüşene kadar tavayı sallayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Servis tabaklarına hemen alın, üzerine ekstra Pecorino ve karabiber serpin; bekletmeyin, dinlendirme carbonara'yı bozar, sos hemen yenmeli.", timerSeconds: null },
    ],
  },

  // ─── 4: su-boregi (KIBE-MUMBAR FORMA CEK) ───────────────────
  {
    type: "rewrite",
    slug: "su-boregi",
    reason:
      "KIBE-MUMBAR pattern. Klasik su boregi el acma yumurtali hamur + tuzlu suda kisa haslama + bol tereyagi + lor/peynir ic harci (Yemek.com + Hurriyet + Lezzet 3 kaynak; Lezzet 'gercek vs yalanci' ayrimi explicit). DB hazir borek yufkasi + sutlu sos = yalanci su boregi sablonu, klasik kimligi bozmus. Türk piskirici 'su boregi' deyince klasik el acma haslama bekler; yalanci ayri slug'a layik (paket dışı). 5 ingredient_add (un + 2 yumurta hamur + ilik su + tuz + lor), 3 ingredient_remove (Borek yufkasi + Sut + Sivi yag), 1 amount change (tereyagi 50→200gr klasik bol yag), 5 step replace.",
    sources: [
      "https://yemek.com/tarif/su-boregi/",
      "https://www.hurriyet.com.tr/lezizz/masterchef-su-boregi-nasil-yapilir-el-acmasi-su-boregi-tarifi-malzemeleri-ve-tuyolari-42117288",
      "https://www.lezzet.com.tr/lezzetten-haberler/gercek-su-boregi-tarifi",
    ],
    description:
      "Klasik su böreği, elde açılan yumurtalı yufkaların tuzlu kaynar suda kısa süreli haşlanıp tereyağı ve peynirli iç harç ile katlanarak fırınlandığı geleneksel Türk böreği. Adını yufkaların suda haşlanmasından alır; eritilmiş tereyağı katmanları sayesinde hem yumuşacık hem üstü çıtır olur.",
    prepMinutes: 60,
    cookMinutes: 35,
    totalMinutes: 95,
    ingredientsRemove: ["Börek yufkası", "Süt", "Sıvı yağ"],
    ingredientsAdd: [
      { name: "Un (hamur için)", amount: "600", unit: "gr" },
      { name: "Yumurta (hamur için)", amount: "2", unit: "adet" },
      { name: "Su (hamur için, ılık)", amount: "1", unit: "su bardağı" },
      { name: "Tuz (hamur ve haşlama suyu için)", amount: "2", unit: "yemek kaşığı" },
      { name: "Lor peyniri", amount: "200", unit: "gr" },
    ],
    ingredientsAmountChange: [
      { name: "Tereyağı", newAmount: "200", newUnit: "gr" },
    ],
    tipNote:
      "Yufkaları tek tek haşlayın, üst üste haşlamayın yapışırlar. Haşlama suyu mutlaka tuzlu olmalı; tuz hamurun parlaklığını ve elastikiyetini korur. En alttaki ve en üstteki yufka kuru kalmalı; aksi halde börek dağılır.",
    servingSuggestion:
      "Sıcak servis edin, yanına demli çay ve isteğe göre yoğurt veya cevizli yeşillik salata. Bayram sofrası ve özel gün böreği olarak sunulur.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Hamur için unu, 2 yumurtayı, 1 çay kaşığı tuzu ve ılık suyu yoğurun; kulak memesinden biraz sert, pürüzsüz hamur olsun. Üzerini örtüp 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "İç harç için beyaz peyniri ve loru çatalla ufalayın, ince kıyılmış maydanozu ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Dinlendirilen hamuru 8 eşit beze ayırın. Her bezeyi unla oklava ile tepsi büyüklüğünde, çok ince yufka olacak şekilde açın; aralarına un serpip üst üste koyun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş bir tencerede bol suyu kaynatın, 1 yemek kaşığı tuz atın. Yanına soğuk su dolu büyük bir kap hazırlayın. Yufkaları teker teker kaynar suda 30-40 saniye haşlayın, hemen soğuk suya alın, sonra temiz beze yayın. En alt ve en üst yufkayı haşlamadan kuru kalın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tereyağını eritin. Tepsiyi yağlayın, kuru yufkayı serin, yağ gezdirin, sırayla haşlanmış yufkaları yerleştirip her arasına bol tereyağı sürün. Ortaya gelince iç harcı eşit yayın, üstüne haşlanmış yufkalarla devam edin, en üste kuru yufkayı koyun. Üzerine kalan eritilmiş yağı sürün, baklava dilimi kesin. Önceden ısıtılmış 200°C fırında 35-40 dakika üstü kızarana kadar pişirin.", timerSeconds: 2400 },
    ],
  },

  // ─── 5: tatar-boregi-eskisehir (KIBE-MUMBAR REWRITE FULL) ───
  {
    type: "rewrite",
    slug: "tatar-boregi-eskisehir-usulu",
    reason:
      "KIBE-MUMBAR pattern. Klasik Eskisehir Tatar Boregi yumurtali sert hamur + cig kiymali ic + haslama + sarimsakli yogurt + naneli tereyagi (Karaca Blog + Eskisehir KTB + Lezzet 3 kaynak; 1860 Kirim Tatar gocu). DB sadece bos haslanmis hamur + yogurt = Tatar boregi degil, mantı kabugu. Title 'Eskisehir Tatar Boregi'. 4 ingredient_add (yumurta + dana kiyma + sogan + karabiber), 3 amount change, 6 step replace.",
    sources: [
      "https://eskisehir.ktb.gov.tr/TR-156643/ciborek.html",
      "https://www.karaca.com/blog/mantidan-cok-daha-doyurucu-orijinal-tatar-boregi-tarifi",
      "https://www.lezzet.com.tr/lezzetten-haberler/eskisehirin-yoresel-yemekleri",
    ],
    newTitle: "Eskişehir Tatar Böreği",
    description:
      "Eskişehir Tatar Böreği, 1860 Kırım Tatar göçüyle şehre yerleşen mutfağın izini taşıyan haşlama bir hamur işidir. Yumurtalı sert hamurun içine çiğ kıymalı harç konur, kaynar suda haşlanır, üstüne sarımsaklı yoğurt ve naneli kızgın tereyağı gezdirilir.",
    ingredientsAdd: [
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Dana kıyma", amount: "250", unit: "gr" },
      { name: "Kuru soğan (rendelenmiş)", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Su", newAmount: "150", newUnit: "ml" },
      { name: "Tereyağı", newAmount: "50", newUnit: "gr" },
      { name: "Nane", newAmount: "1", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamuru mantı sertliğinde yoğurmak haşlama sırasında dağılmasını önler. Üçgen kapatırken kenarları parmakla iyice bastırın.",
    servingSuggestion:
      "Üzerinde sarımsaklı yoğurt ve naneli kızgın tereyağı sosuyla, yanında pul biber serpiştirip sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, yumurta, su ve tuzla mantı sertliğinde sert hamur yoğurun, üstünü örtüp 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Rendelenmiş soğan, kıyma, tuz ve karabiberi karıştırarak çiğ harç hazırlayın, fazla suyunu hafif sıkın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru ince açıp 5-6 cm karelere bölün, her karenin ortasına yarım fındık büyüklüğünde kıymalı harç koyup üçgen muska şeklinde kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tencerede tuzlu suyu kaynatın, börekleri parti parti atıp yüzeye çıktıktan sonra 8-10 dakika haşlayın.", timerSeconds: 540 },
      { stepNumber: 5, instruction: "Süzgeçle alıp servis tabağına dizin, üstüne sarımsaklı yoğurdu bolca dökün.", timerSeconds: null },
      { stepNumber: 6, instruction: "Tereyağını naneyle kızdırıp tatar böreğinin üstünde gezdirin, hemen sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tereyagli-tavuklu-pirinc-tava-hindistan (PULAO KIMLIK) ──
  {
    type: "rewrite",
    slug: "tereyagli-tavuklu-pirinc-tava-hindistan-usulu",
    reason:
      "Hint cuisine 'in' KORUNUR, baharat seti ile pulao kimligi kazandirilir (Swasthi's Recipes + Piping Pot Curry 2 kaynak; Hyderabadi tek tencere). DB sade Türk pilavi, Hint baharatlari (jeera + zerdecal + garam masala + kakule + karanfil + defne + tarcin) tamamen yok. Title 'Hint Usulü Tavuklu Pulao'. 13 ingredient_add, 1 amount change, 6 step replace.",
    sources: [
      "https://www.indianhealthyrecipes.com/chicken-pulao/",
      "https://pipingpotcurry.com/chicken-pulao/",
    ],
    newTitle: "Hint Usulü Tavuklu Pulao",
    description:
      "Hint mutfağının tek tencerede pişen klasik pilavı pulao, basmati pirincini tavuk, kimyon, zerdeçal, kakule ve defne ile buluşturur. Tereyağı yerine geleneksel olarak ghee kullanılır, yoğurtla marine edilen tavuk pilava nemli ve baharatlı bir aroma katar.",
    ingredientsAdd: [
      { name: "Soğan (yarım ay doğranmış)", amount: "1", unit: "adet" },
      { name: "Sarımsak (rendelenmiş)", amount: "3", unit: "diş" },
      { name: "Zencefil (rendelenmiş)", amount: "1", unit: "cm" },
      { name: "Yoğurt (marinasyon)", amount: "3", unit: "yemek kaşığı" },
      { name: "Kimyon (jeera, tane)", amount: "1", unit: "çay kaşığı" },
      { name: "Zerdeçal", amount: "0.5", unit: "çay kaşığı" },
      { name: "Garam masala", amount: "1", unit: "çay kaşığı" },
      { name: "Kakule", amount: "3", unit: "adet" },
      { name: "Karanfil", amount: "3", unit: "adet" },
      { name: "Defne yaprağı", amount: "2", unit: "adet" },
      { name: "Tarçın çubuğu", amount: "1", unit: "küçük parça" },
      { name: "Taze kişniş veya nane (servis)", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Tereyağı", newAmount: "3", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Basmati pirinci yıkayıp 20 dakika bekletmek tanelerin uzun ve ayrı kalmasını sağlar. Garam masala'yı son aşamada eklemek aromayı korur.",
    servingSuggestion:
      "Yanında salatalık ve yoğurttan hazırlanan raita veya kachumber (domates-soğan-salatalık) salatasıyla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Basmati pirinci 20 dakika ılık suda bekletip süzün. Tavuğu yoğurt, zerdeçal, sarımsak, zencefil ve tuzla 15 dakika marine edin.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Tencerede tereyağını eritip kimyon tanelerini, kakule, karanfil, tarçın ve defne yapraklarını 30 saniye kavurun.", timerSeconds: 30 },
      { stepNumber: 3, instruction: "Soğanı ekleyip hafif kızarana kadar 5-6 dakika kavurun, ardından marine tavuğu ilave edip rengi dönene kadar 4 dakika soteleyin.", timerSeconds: 360 },
      { stepNumber: 4, instruction: "Süzülmüş basmati pirinci ekleyip baharatlarla 1 dakika harmanlayın, garam masala ve tuzu serpin.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "3 su bardağı sıcak suyu ilave edin, kaynamaya başlayınca kısık ateşe alıp kapağı kapatın ve 15 dakika pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alıp 5 dakika demlendirin, taze kişniş veya naneyle süsleyip servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 7: siyezli-kes-durumu-kastamonu (YORE YUMUSATMA) ───────
  {
    type: "rewrite",
    slug: "siyezli-kes-durumu-kastamonu-usulu",
    reason:
      "Kastamonu siyez bugday + kes peyniri ayri ayri yoresel/CI tescilli (Kastamonu Yoresel + Academia.edu CI PDF), ama 'durum' kombo CI envanterinde YOK. Yore Kastamonu → 'Kastamonu esintili' yumusatma. Title 'Siyezli Bazlamada Tereyagli Kes' (durum→bazlama, dogru form). 3 ingredient_add (yogurt + kabartma tozu + pul biber), 1 amount change (tereyagi 25→30g), 5 step replace.",
    sources: [
      "https://kastamonuyoreselurunleri.com/urun/siyez-ekmegi/",
      "https://www.academia.edu/121931127/Kastamonunun_co%C4%9Frafi_i%C5%9Faretli_%C3%BCr%C3%BCnleri",
      "https://online.mudurnuhelva.com/kes-peyniri/",
    ],
    newTitle: "Siyezli Bazlamada Tereyağlı Keş",
    description:
      "Kastamonu'nun coğrafi işaretli siyez buğdayından yapılan ev tipi bazlama hamuru, yörenin yoğurt kurusu olan keş peyniri ve kızgın tereyağıyla buluşur. Geleneksel dürüm formu olmasa da siyez tahılı ve keşin lezzet uyumu Kastamonu mutfağının iki belirleyici ürününü tek bir tabakta toplar.",
    ingredientsAdd: [
      { name: "Yoğurt (hamur yumuşaklığı için)", amount: "2", unit: "yemek kaşığı" },
      { name: "Kabartma tozu (opsiyonel)", amount: "1", unit: "tutam" },
      { name: "Pul biber (servis)", amount: "0.5", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Tereyağı", newAmount: "30", newUnit: "gr" },
    ],
    tipNote:
      "Siyez unu daha az gluten içerdiği için hamuru fazla yoğurmayın, yumuşak kalsın. Keşi bazlama henüz sıcakken serpmek peynirin hafif yumuşamasını sağlar.",
    servingSuggestion:
      "Yanında demli siyah çay veya ayranla, üzerine isteğe göre kekik serpiştirerek ılık servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Siyez unu, yoğurt, su ve tuzu yoğurarak yumuşak bir bazlama hamuru hazırlayın, 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Hamurdan ceviz büyüklüğünde bezeler alıp ince yuvarlak açın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Kızgın tavada bazlamaları her yüzü 2-3 dakika çevirerek pişirin, kabartı oluşturup hafif beneklenmesini bekleyin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Sıcak bazlamanın bir yüzüne tereyağını sürün, üstüne ufalanmış keş peynirini bolca serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yarım ay şeklinde katlayıp veya rulo sarıp pul biberle hemen servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-13");
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
              paket: "oturum-28-mini-rev-batch-13",
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
