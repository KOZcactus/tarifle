/**
 * Tek-seferlik manuel mini-rev batch 2 (oturum 27): 7 Mod K v2
 * MAJOR_ISSUE Dogu Anadolu yoresel tarif. Web research 2 paralel
 * agent + 13+ kaynak teyit (Vikipedi, Erzurum Portali, Kultur
 * Portali, Yemek.com, Lezzet, Malatya Cadde, Nefis Yemek Tarifleri,
 * Sofrahub cografi isaret, Cumhuriyet, Ilkhaber, Bitlis Biletbayi
 * Blog, Lezzetler.com, Malatya Time).
 *
 * Verdict: 7/7 REWRITE (hicbiri silmeye gitmedi, hepsi gercek
 * yoresel kimligi olan tarifler ama mevcut Tarifle versiyonlari
 * kimligi belirgin sekilde kacirmis).
 *
 *   1. helise-malatya-usulu: Helise Bitlis/Van menseli (Malatya
 *      Valiligi listesinde yok). Description revize, pul biber
 *      sosu eklendi. cookMinutes 40 -> 95 (dusuk ates uzun pisirme).
 *   2. kelecos-erzurum-usulu: Kurut + kavurma klasik omurga, mevcut
 *      sade yogurt yetersiz. Kurut + Kavurma + Pul biber + Tuz +
 *      Ilik su eklendi, Yogurt cikarildi.
 *   3. kelecos-van-usulu: Mercimekli lavas tamamen yanlis. Klasik
 *      bakliyat (nohut + bugday + mercimek) + et + yogurt + pazi.
 *      7 ingredient_add, 3 remove (Lavas, Sarimsak, Kuru nane).
 *   4. kiraz-yaprakli-kofte-malatya-usulu: Salçali vegan yanlis,
 *      klasik yogurt + yumurta sosu + tereyagli sogan. 6 add,
 *      1 remove (Salça).
 *   5. kiraz-yaprakli-sarma-malatya-usulu: Pirinçli degil bulgur +
 *      yarma + yogurtlu sos. 7 add, 3 remove (Pirinç, Zeytinyagi,
 *      Limon).
 *   6. kayseri-kursun-asi: Mevcut DB unlu hamur top YANLIS, klasik
 *      bulgur + kiyma kofte (Kultur Portali + Sofrahub cografi
 *      isaret). 7 add (Bulgur + Kiyma + Yumurta + Kuzu eti +
 *      Sogan + 2 baharat), 1 remove (Su).
 *   7. kayseri-yag-mantisi: Klasik mayali bohça kizartma, mevcut
 *      haslama + tepsi yanlis. 4 add (Yumurta, Sivi yag, Maya,
 *      Pul biber).
 *
 * Idempotent: zaten yeni description ise SKIP.
 * AuditLog action: MOD_K_MANUAL_REV.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-2.ts
 *   npx tsx scripts/fix-mini-rev-batch-2.ts --env prod --confirm-prod
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
  allergensAdd?: Allergen[];
  allergensRemove?: Allergen[];
  ingredientsAdd?: IngredientAdd[];
  ingredientsRemove?: string[];
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── 1. helise-malatya-usulu ────────────────────────────────
  {
    slug: "helise-malatya-usulu",
    reason:
      "Helise Bitlis/Van menseli yoresel yemek, Malatya Valiligi resmi yoresel listesinde yer almiyor. Description Anadolu jenerik + tereyagli pul biber sosu eklendi (klasik servis). cookMinutes 40 -> 95 (dusuk ates uzun pisirme).",
    sources: [
      "https://blog.biletbayi.com/bitlis-yoresel-yemekler.html/",
      "https://www.nefisyemektarifleri.com/helise-tarifi-van-yoresine-ait/",
      "https://www.cumhuriyet.com.tr/gurme/anadolu-nun-geleneksel-lezzeti-helise-tarifi-2435195",
      "https://www.malatya.gov.tr/yoresel-yemekler",
    ],
    description:
      "Helise, dövme buğday ile etin uzun pişirilip ezilmesinden çıkan, tereyağlı pul biber sosuyla servis edilen geleneksel bir Doğu Anadolu yemeğidir. Bitlis ve Van mutfağında düğün ve bayram klasiğidir.",
    prepMinutes: 12,
    cookMinutes: 95,
    totalMinutes: 107,
    averageCalories: 380,
    protein: 24,
    carbs: 42,
    fat: 12,
    ingredientsAdd: [
      { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Aşurelik buğdayı yıkayıp tencereye alın, suyu ekleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Buğdayı kısık ateşte 50 dakika yumuşayana kadar pişirin.", timerSeconds: 3000 },
      { stepNumber: 3, instruction: "Tavuk parçalarını tencereye ekleyin, tuzu atın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tavuk ve buğdayı 40 dakika daha pişirin, buğday açılsın.", timerSeconds: 2400 },
      { stepNumber: 5, instruction: "Tavuğu çıkarıp didikleyin, tencereye geri katıp tahta kaşıkla ezerek liflendirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Tereyağını pul biberle 2 dakika eritip helisenin üstüne gezdirin.", timerSeconds: 120 },
    ],
  },

  // ─── 2. kelecos-erzurum-usulu ────────────────────────────────
  {
    slug: "kelecos-erzurum-usulu",
    reason:
      "Erzurum kelecoş klasiği kurut + kavurma omurgali (Erzurum Portali + Lezzetler.com kaynaklari), mevcut sade yogurt + sogan modern subst yetersiz. Kurut + Kavurma + Pul biber + Tuz + Ilik su eklendi, Yogurt cikarildi (klasik formula geri donus). Allergen SUT korunur.",
    sources: [
      "https://erzurumportali.com/shf/3855/Kelecos-Nedir-Nasil-Yapilir",
      "https://lezzetler.com/tarif-67718",
      "https://www.lezzet.com.tr/lezzetten-haberler/erzurum-yemekleri",
    ],
    description:
      "Erzurum kelecoşu, bayat tandır ekmeğini kurut sosu ve kavurmalı soğanla buluşturan geleneksel bir kış yemeğidir. Kuruşçu Anadolu'nun yoğun lezzetlerinden biri.",
    prepMinutes: 12,
    cookMinutes: 18,
    totalMinutes: 35,
    averageCalories: 410,
    protein: 18,
    carbs: 36,
    fat: 22,
    allergensAdd: [Allergen.SUT],
    ingredientsAdd: [
      { name: "Kurut", amount: "2", unit: "adet" },
      { name: "Kavurma", amount: "100", unit: "gr" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Ilık su", amount: "1", unit: "su bardağı" },
    ],
    ingredientsRemove: ["Yoğurt"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kurutları ılık suda 5 dakika beklettikten sonra el ile pürüzsüz olana kadar ezin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Kurut karışımını ocakta sürekli karıştırarak ayran kıvamından biraz koyu olana kadar 6 dakika pişirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Soğanı yemeklik doğrayın, tereyağında 5 dakika pembeleştirin, kavurmayı ve pul biberi katın, yağı eriyene kadar 4 dakika çevirin.", timerSeconds: 540 },
      { stepNumber: 4, instruction: "Bayat ekmeği lokma boyunda doğrayıp tabağa dizin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sıcak kurut sosunu ekmek üstüne dökün, kavurmalı soğanı en üste gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3. kelecos-van-usulu (gercek adi keledos) ──────────────
  {
    slug: "kelecos-van-usulu",
    reason:
      "Van keledosu cografi isaretli yoresel yemek (Vikipedi + Yemek.com + Lezzet kaynaklari), klasik bakliyat (nohut + bugday + mercimek) + et + yogurt + pazi/cor in otu. Mevcut mercimekli lavas kurgusu tamamen uydurma identity. 7 ingredient_add + 3 remove (Lavas, Sarimsak, Kuru nane). Allergen SUT.",
    sources: [
      "https://yemek.com/tarif/keledos/",
      "https://tr.wikipedia.org/wiki/Keledo%C5%9F",
      "https://www.lezzet.com.tr/yemek-tarifleri/corbalar/corba-tarifleri/kelecos-092649",
    ],
    description:
      "Van keledoşu, dövme buğday, nohut ve mercimeği etle uzun pişirip yoğurt ve pazıyla bütünleştiren coğrafi işaretli bir bölge yemeğidir. Üst Murat-Van bölgesinin (Ağrı, Bitlis, Muş, Van) klasiği.",
    prepMinutes: 20,
    cookMinutes: 110,
    totalMinutes: 130,
    averageCalories: 460,
    protein: 28,
    carbs: 42,
    fat: 18,
    allergensAdd: [Allergen.SUT],
    ingredientsAdd: [
      { name: "Kuşbaşı dana eti", amount: "300", unit: "gr" },
      { name: "Aşurelik buğday", amount: "0.5", unit: "su bardağı" },
      { name: "Nohut", amount: "0.5", unit: "su bardağı" },
      { name: "Süzme yoğurt", amount: "1.5", unit: "su bardağı" },
      { name: "Pazı", amount: "1", unit: "demet" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsRemove: ["Lavaş", "Sarımsak", "Kuru nane"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Bir gece ıslatılmış nohut ve buğdayı tencereye alın, etin üstünü kapatacak kadar su ekleyip 60 dakika pişirin.", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Kuşbaşı eti tencereye katın, 25 dakika daha pişirin.", timerSeconds: 1500 },
      { stepNumber: 3, instruction: "Yeşil mercimeği ve doğranmış pazıyı ekleyip 15 dakika pişirin, baharatları katın.", timerSeconds: 900 },
      { stepNumber: 4, instruction: "Süzme yoğurdu bir kasede çırpıp tencereye yavaşça ekleyin, sürekli karıştırarak 5 dakika kaynatın.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Doğranmış soğanı tereyağında 5 dakika pembeleştirip pul biberle keledoşun üstüne gezdirin.", timerSeconds: 300 },
    ],
  },

  // ─── 4. kiraz-yaprakli-kofte-malatya-usulu ──────────────────
  {
    slug: "kiraz-yaprakli-kofte-malatya-usulu",
    reason:
      "Malatya kiraz yaprakli kofte cografi isaretli yoresel yemek (Malatya Cadde + Yemek.com + Ilkhaber kaynaklari), klasik yogurt + yumurta sosu + tereyagli sogan. Mevcut salçali vegan kurgu klasik kimligi kaciryor. 6 ingredient_add + 1 remove (Domates salça). Allergen GLUTEN korunur, SUT + YUMURTA eklendi.",
    sources: [
      "https://yemek.com/tarif/kiraz-yapraginda-kofte/",
      "https://www.malatyacadde.com/malatya-nin-yoresel-sofra-kulturu-kiraz-yapragi-sarmasi-ve-kofte-cesitleri/101155",
      "https://www.ilkhaber-gazetesi.com/yasam/malatya-nin-lezzeti-ayranli-kiraz-yapragi-koftesi-tarifi-243708",
    ],
    description:
      "Malatya kiraz yapraklı köfte, bulgurla yoğrulup taze kiraz yaprağına sarılan minik köfteleri yumurtalı yoğurt sosu ve tereyağlı soğanla bütünleyen bir bahar klasiğidir. Coğrafi işaretli, avrat köftesi adıyla da anılır.",
    prepMinutes: 25,
    cookMinutes: 30,
    totalMinutes: 55,
    averageCalories: 320,
    protein: 12,
    carbs: 44,
    fat: 11,
    allergensAdd: [Allergen.SUT, Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Yoğurt", amount: "1", unit: "su bardağı" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Nane", amount: "1", unit: "tatlı kaşığı" },
    ],
    ingredientsRemove: ["Domates salçası"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Bulguru kaynar suda 10 dakika beklettikten sonra unu, tuzu ekleyip yoğurun, küçük zeytin boyu köfteler şekillendirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Kiraz yapraklarını sıcak suda 5 dakika beklettikten sonra saplarını alıp her yaprağa bir köfte sarın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Sarmaları geniş tencereye dizin, üstünü kapatacak kadar su ekleyip 25 dakika kısık ateşte pişirin.", timerSeconds: 1500 },
      { stepNumber: 4, instruction: "Yoğurt, yumurta ve yarım su bardağı suyu pürüzsüz çırpın, sarmaların suyuna yavaşça ekleyip 5 dakika sürekli karıştırarak kaynatın.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Doğranmış soğanı tereyağında 5 dakika pembeleştirin, naneyi katıp 30 saniye çevirin.", timerSeconds: 330 },
      { stepNumber: 6, instruction: "Köfteyi tabağa alıp tereyağlı soğanı üstüne gezdirin, sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5. kiraz-yaprakli-sarma-malatya-usulu ──────────────────
  {
    slug: "kiraz-yaprakli-sarma-malatya-usulu",
    reason:
      "Malatya kiraz yaprakli sarma cografi isaretli (2020 Turk Patent), 'padisah yemegi' lakapli. Klasik bulgur + yarma harci + yogurtlu yumurtali sos + tereyagli sogan, mevcut pirinçli zeytinyagli Akdeniz sablonu yanlis. 7 add (Bulgur + Yarma + Un + Yogurt + Yumurta + Tereyagi + Tuz) + 3 remove (Pirinç + Zeytinyagi + Limon). Allergen GLUTEN + SUT + YUMURTA.",
    sources: [
      "https://www.nefisyemektarifleri.com/kiraz-yapragi-sarmasi-malatya/",
      "https://www.malatyatime.com/haber/tum-sarma-tariflerini-unutun-yoresel-dokunusla-sofralarda-cigir-acin-ozel-sosunda-malatya-usulu-kiraz-yapragi-sarmasi-89953",
    ],
    description:
      "Malatya kiraz yapraklı sarma, kiraz yaprağını bulgur ve yarma harcıyla ince ince sarıp yumurtalı yoğurt sosunda pişiren bir Doğu Anadolu klasiğidir. Üzerine kızgın tereyağlı soğan dökülerek servis edilir, padişah yemeği lakaplıdır.",
    prepMinutes: 35,
    cookMinutes: 30,
    totalMinutes: 80,
    averageCalories: 320,
    protein: 11,
    carbs: 38,
    fat: 14,
    allergensAdd: [Allergen.GLUTEN, Allergen.SUT, Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Köftelik bulgur", amount: "1", unit: "su bardağı" },
      { name: "Yarma (aşurelik buğday)", amount: "0.5", unit: "su bardağı" },
      { name: "Un", amount: "2", unit: "yemek kaşığı" },
      { name: "Süzme yoğurt", amount: "500", unit: "gr" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Tereyağı", amount: "60", unit: "gr" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    ingredientsRemove: ["Pirinç", "Zeytinyağı", "Limon"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kiraz yapraklarını kaynar suda 5 dakika haşlayıp süzün; salamura yaprak kullanıyorsanız ılık sudan geçirip tuzunu alın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Köftelik bulgur ve yarmayı bir kasede karıştırın, üzerine 1 su bardağı sıcak su gezdirip 15 dakika kapalı bekletin, sonra un ve tuzu ekleyip ele yapışmayan sakız kıvamı oluşana kadar yoğurun.", timerSeconds: 900 },
      { stepNumber: 3, instruction: "Bir yaprağın damarlı yüzü yukarı bakacak şekilde tezgaha yatırın, ortasına fındık büyüklüğünde harç koyup sigara inceliğinde sıkıca sarın; tüm yaprakları aynı şekilde hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş bir tencerede yoğurdu yumurta ve 1 yemek kaşığı unla iyice çırpın, kısık ateşte sürekli karıştırarak kaynama noktasına getirin; yoğurt kesilmemesi için karıştırmayı kesmeyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sarmaları yoğurtlu sosa dizin, üzerini örtmeyecek kadar sıcak su ekleyin, kısık ateşte 20 dakika pişirin.", timerSeconds: 1200 },
      { stepNumber: 6, instruction: "Servisten önce ayrı bir tavada tereyağında ince doğranmış soğanı pembeleşene kadar kavurup sarmaların üzerine gezdirin, 5 dakika dinlendirip servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 6. kayseri-kursun-asi ──────────────────────────────────
  {
    slug: "kayseri-kursun-asi",
    reason:
      "Kursun asi cografi isaretli (Sofrahub), Kultur Portali resmi tanim: bulgur + kiyma + un + yumurta + salça koftesi, kusbasi kuzu + nohut + yesil mercimek ile pisen Orta Anadolu corbasi. Adi 'kasenin kursun gibi agir olmasindan' gelir. Mevcut DB unlu hamur top YANLIS, klasik bulgur+kiyma kofte. 7 add (Bulgur + Kiyma + Yumurta + Kuzu eti + Sogan + 2 baharat), 1 remove (Su). Allergen GLUTEN + YUMURTA + SUT.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kayseri/neyenir/kursun-asi-1",
      "https://yemek.com/tarif/kursun-asi/",
      "https://www.sofrahub.com/kayseri-kursun-asi-corbasi-tarifi/",
    ],
    description:
      "Kayseri kurşun aşı, bulgurlu minik köfteleri kuşbaşı et, nohut ve yeşil mercimekle salçalı et suyunda pişiren yoğun bir Orta Anadolu çorbasıdır. Adını kâseyi ağırlaştıran doyurucu içeriğinden alır.",
    prepMinutes: 25,
    cookMinutes: 60,
    totalMinutes: 90,
    averageCalories: 290,
    protein: 18,
    carbs: 28,
    fat: 12,
    allergensAdd: [Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Köftelik ince bulgur", amount: "1", unit: "su bardağı" },
      { name: "Dana kıyma", amount: "150", unit: "gr" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Kuşbaşı kuzu eti", amount: "200", unit: "gr" },
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
    ],
    ingredientsRemove: ["Su"],
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuşbaşı eti küçük tencerede 1 litre suyla 40 dakika kısık ateşte haşlayın, köpüğünü alın; et yumuşayınca suyu kenarda bekletin.", timerSeconds: 2400 },
      { stepNumber: 2, instruction: "İnce bulguru bir kaseye alıp üzerine yarım su bardağı sıcak su gezdirin, 10 dakika dinlendirin; bulgur şişince kıyma, yumurta, 2 yemek kaşığı un, tuz, karabiber ve pul biberi ekleyip iyice yoğurun.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Hazırladığınız harçtan nohut büyüklüğünde minik köfteler şekillendirin, hafif unlanmış tepsiye dizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Et suyunu geniş tencereye alın, haşlanmış nohut ve yeşil mercimeği ekleyip kaynamaya bırakın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Köfteleri tek tek kaynayan çorbaya bırakın, kısık ateşte 15 dakika pişirin; köfteler yüzeye çıkınca pişmiş demektir.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ayrı bir tavada tereyağını eritip ince doğranmış soğanı pembeleştirin, salçayı ekleyip 1 dakika kavurun, çorbanın üzerine dökün.", timerSeconds: 60 },
      { stepNumber: 7, instruction: "Kuru naneyi ovup serpin, tuzunu ayarlayıp 5 dakika dinlendirip servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 7. kayseri-yag-mantisi ─────────────────────────────────
  {
    slug: "kayseri-yag-mantisi",
    reason:
      "Kayseri yag mantisi klasiği mayali bohça kizartma (Yemek.com + Lezzet.com.tr + Nefis Yemek Tarifleri 3 bagimsiz kaynak), 6-7 cm kareler bol yagda kizarir. Mevcut hasla + tepsi + 'kucuk manti' yanlis identity. 4 add (Yumurta + Sivi yag kizartma + Instant maya + Pul biber). Allergen YUMURTA eklendi (mevcut GLUTEN + SUT korunur).",
    sources: [
      "https://yemek.com/tarif/kayseri-yag-mantisi/",
      "https://www.lezzet.com.tr/yemek-tarifleri/hamurisi-tarifleri/manti-tarifleri/yag-mantisi",
      "https://www.nefisyemektarifleri.com/orijinal-kayseri-yag-mantisi-kayseriliden/",
    ],
    description:
      "Kayseri yağ mantısı, mayalı yumuşak hamuru kıymayla bohçalayıp kızgın yağda çıtır çıtır kızartan yöresel bir hamur işidir. Sarımsaklı yoğurt ve salçalı tereyağıyla servis edilir.",
    prepMinutes: 30,
    cookMinutes: 15,
    totalMinutes: 85,
    averageCalories: 480,
    protein: 18,
    carbs: 52,
    fat: 22,
    allergensAdd: [Allergen.YUMURTA],
    ingredientsAdd: [
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Sıvı yağ (kızartma için)", amount: "500", unit: "ml" },
      { name: "Instant maya", amount: "1", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Ilık suya mayayı ve bir tutam tuzu ekleyip 5 dakika bekletin; geniş kaseye unu alıp ortasını havuz yapın, mayalı suyu, yumurtayı ve 2 yemek kaşığı yoğurdu ekleyip ele yapışmayan yumuşak bir hamur yoğurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Hamurun üzerini nemli bezle örtüp ılık ortamda 40 dakika dinlendirin.", timerSeconds: 2400 },
      { stepNumber: 3, instruction: "Kıymayı rendelenmiş soğan, tuz, karabiber ve pul biberle iyice yoğurup iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Dinlenen hamuru unlanmış tezgahta yarım santim kalınlığında açın, 6-7 cm kareler kesin; her karenin ortasına bir tatlı kaşığı harç koyup karşılıklı uçlarını üstte birleştirip bohça gibi kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Geniş tavada sıvı yağı orta ateşte kızdırın; mantıları birbirine yapışmayacak şekilde dizin, her iki yüzü altın rengi olana kadar 6-7 dakika kızartın, kağıt havluya alıp yağını süzün.", timerSeconds: 420 },
      { stepNumber: 6, instruction: "Yoğurdu rendelenmiş sarımsak ve bir tutam tuzla çırpıp servis tabağına yayın, kızarmış mantıları üzerine yerleştirin.", timerSeconds: null },
      { stepNumber: 7, instruction: "Küçük tavada tereyağını eritip salçayı 1 dakika kavurun, mantıların üzerine gezdirip pul biberle servis edin.", timerSeconds: 60 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-2");
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

        // Ingredient remove
        if (op.ingredientsRemove && op.ingredientsRemove.length > 0) {
          const removeNorm = new Set(op.ingredientsRemove.map(normalize));
          for (const ing of recipe.ingredients) {
            if (removeNorm.has(normalize(ing.name))) {
              await tx.recipeIngredient.delete({ where: { id: ing.id } });
            }
          }
        }

        // Ingredient add (sortOrder = max + 1)
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

        // Steps replace (deleteMany + createMany)
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
              paket: "oturum-27-mini-rev-batch-2",
              changes: {
                description_revised: !!op.description,
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
