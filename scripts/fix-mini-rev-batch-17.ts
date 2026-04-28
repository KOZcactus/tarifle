/**
 * Tek-seferlik manuel mini-rev batch 17 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 22+ kaynak (Wikipedia Musakhan +
 * FalasteeniFoodie + Saveur + Karaca Blog yumurta cesitleri + Nefis
 * Yemek Tereyagli Kapama + Kultur Portali Kilis Mikla + Lezzet
 * Eskisehir 12 yemek + Biletbayi Eskisehir kahvalti + Ye-mek.net
 * sucuklu mantar + Wikipedia Keskek + Sofra Dovme + Yemek.com
 * Geleneksel Keskek + Adiyaman KTB mutfagi + Sanliurfa Isotu CI
 * 25.08.2000 + Kevserin Mutfagi Babagannus + Biletbayi Erzincan 25
 * yemek + Akpinar Erzincan Dut Kurusu + Lezzet Tutmac + Gaziantep
 * Belediyesi Simit Kebabi CI 19.04.2021 + Vikipedi Simit Kebabi +
 * Unal Et Lokantasi klasik harc).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (1 'me' korunur, 6 'tr' korunur).
 * 6 title degisimi (1 cuisine korundu sadece description yumusatma).
 *
 * KRITIK KESIF #7: Simit kebabi CI Gaziantep'e tescilli (19.04.2021),
 * Adiyaman degil! Mevcut tarifin Adiyaman atfi yanlis. Disambiguate
 * + description'a Gaziantep CI atfi.
 *
 *   1. sumakli-soganli-tavuk-tepsi-orta-dogu-usulu (KIBE-MUMBAR FULL +
 *      DATA CORRUPTION FIX): Klasik Filistin Musakhan (Wikipedia +
 *      FalasteeniFoodie + Saveur 3 kaynak). DB'de servingSuggestion'da
 *      'kuzu pembesi tabaka halinde dilimleyip' = scaffold metadata
 *      LEAK (tavuk tarifinde kuzu cumle). Step jenerik scaffold. 4
 *      ingredient_add (lavash + cam fistigi + bahar 7 + limon suyu),
 *      2 amount change (sumak 1tk→2yk + zeytinyagi 2yk→4yk + sogan
 *      2→4 adet eklemeli), 6 step replace klasik musakhan akisi.
 *      Cuisine 'me' KORUNUR.
 *
 *   2. sumakli-yumurta-kapama-kilis-usulu (definition fix + Kilis
 *      yumusatma): Klasik 'yumurta kapama' = haslanmis yumurta veya
 *      yagda kirik yumurta + tereyagi + biber + nane (Karaca + Nefis
 *      Yemek). Kilis spesifik 'yumurta kapama' kanitsiz (Kultur
 *      Portali Kilis 'mikla' var ama farkli yemek). Title 'Guneydogu
 *      Esintili Sumakli Yumurta Kapama'. 3 ingredient_add (tereyagi +
 *      pul biber + kuru nane), 1 amount change (zeytinyagi 1tk→1yk),
 *      5 step replace kapak kapali kapama teknigi.
 *
 *   3. sucuklu-mantarli-yumurta-eskisehir-usulu (yore yumusat + step
 *      rewrite): Eskisehir 12 yemek listesinde sucuklu mantarli yumurta
 *      YOK (cibörek + balaban kebabi + tatar boregi + arabasi). Modern
 *      kahvalti klasigi. Title 'Sucuklu Mantarli Kahvalti Yumurtasi'.
 *      3 ingredient_add (tuz + karabiber + maydanoz), 1 amount change
 *      (tereyagi 1tk→1yk), 5 step replace.
 *
 *   4. zeytinli-keskek-aydin-bahce-usulu (SURE FIX KRITIK + yore
 *      yumusat + KIBE-MUMBAR): Klasik keskek 2.5-4 saat (Wikipedia
 *      UNESCO 2011 + Sofra Dovme + Yemek.com 3 kaynak); duduklu 45-50
 *      dk. DB total 50 dk YETERSIZ (duduklu modunda bile aktif degil).
 *      Aydin 'Bahce' iddia kanitsiz. Title 'Ege Esintili Vegan Zeytinli
 *      Keskek Uyarlamasi'. 5 ingredient_add (nohut + sogan + sarimsak
 *      + pul biber + kekik), total 50→540 dk (8 saat islatma + 60 dk
 *      duduklu pisirme), difficulty MEDIUM korunur, 6 step replace.
 *
 *   5. tahinli-isotlu-kabak-dip-adiyaman-usulu (yore yumusat + step
 *      sablon fix): Adiyaman tescil YOK (Sanliurfa isotu CI 25.08.2000;
 *      Adiyaman uretim var ama tescil yok). Adiyaman KTB mezeleri
 *      listesinde tahinli kabak dip yok. Levant babaganus pattern.
 *      DB'de step 2 'sarimsak, yogurt' soyluyor ama listede YOK =
 *      sablon hata. Title 'Adiyaman Esintili Isotlu Tahinli Kabak Dipi'.
 *      4 ingredient_add (sarimsak + zeytinyagi + tuz + maydanoz), 2
 *      amount change (tahin 2→3 yk + limon 1→1.5 yk), 5 step replace
 *      kozleme + ezme + tahin sosu klasik akisi. Difficulty EASY.
 *
 *   6. tutlu-yarma-corbasi-erzincan-usulu (yore yumusat + tereyagi
 *      tutarsizlik fix): Erzincan 25 yoresel listede dutlu yarma
 *      corbasi YOK (Biletbayi). Erzincan dut kurusu yöresel urun
 *      (Akpinar). Yarma + yogurt corba pattern Dogu Anadolu. DB step
 *      4 'tereyagi' diyor LISTEDE YOK = tutarsizlik. Title 'Dogu
 *      Anadolu Esintili Dutlu Yarma Corbasi'. 4 ingredient_add
 *      (tereyagi 30gr + suzme yogurt opsiyonel + kuru nane + karabiber),
 *      1 amount change (su 1.25→1.5 lt), 5 step replace.
 *
 *   7. tepsi-simit-kebabi-adiyaman-usulu (KRITIK KESIF + disambiguate):
 *      Simit kebabi CI Gaziantep'e tescilli (19.04.2021 Gaziantep
 *      Belediyesi resmi); Adiyaman atfi YANLIS. Klasik harc soğan +
 *      sarimsak + biber + maydanoz + isot/karabiber + kimyon + zeytinyagi
 *      (Vikipedi + Unal Et Lokantasi). Title 'Tepside Simit Kebabi
 *      (Guneydogu Esintili)' + description Gaziantep CI atif. 7
 *      ingredient_add (kuru sogan + sarimsak + maydanoz + isot +
 *      karabiber + kimyon + zeytinyagi), 1 amount change (ince bulgur
 *      0.5→1 sb klasik oran), 6 step replace.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-17.ts
 *   npx tsx scripts/fix-mini-rev-batch-17.ts --env prod --confirm-prod
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
  // ─── 1: musakhan FULL REWRITE + DATA CORRUPTION FIX ──────────────
  {
    type: "rewrite",
    slug: "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu",
    reason:
      "KIBE-MUMBAR FULL REWRITE + DATA CORRUPTION FIX. Klasik Filistin Musakhan: tavuk + bol kirmizi sogan + sumak (cömertçe) + zeytinyagi + lavash/taboon + cam fistigi (Wikipedia + FalasteeniFoodie + Saveur 3 kaynak). DB'de servingSuggestion'da 'kuzu pembesi tabaka halinde dilimleyip' = scaffold METADATA LEAK (tavuk tarifinde kuzu cumlesi YANLIS, SIL). Step tamamen jenerik scaffold ('malzemeleri tepsiye alin', 'baharatlayin', '24 dakika orta ateste'). Title 'Filistin Usulu Musakhan, Sumakli Tavuk ve Sogan Tepsi'. Cuisine 'me' KORUNUR. 4 ingredient_add (lavash + cam fistigi + bahar 7 + limon suyu), 2 amount change (sumak 1tk→2yk + zeytinyagi 2yk→4yk), eklemeli sogan zaten 2 var, 6 step replace musakhan klasik akisi (marine + sote sogan + lavash dizi + 200°C 40 dk + cam fistigi kavurma).",
    sources: [
      "https://en.wikipedia.org/wiki/Musakhan",
      "https://falasteenifoodie.com/traditional-palestinian-musakhan-recipe/",
      "https://www.saveur.com/palestinian-roast-chicken-with-sumac-and-red-onions-recipe/",
    ],
    newTitle: "Filistin Usulü Musakhan, Sumaklı Tavuk ve Soğan Tepsi",
    description:
      "Filistin mutfağının en sevilen tepsi yemeği musakhan, sumakla bolca harlanmış tavuk butlarını yumuşatılmış kırmızı soğan ve lavash üzerinde buluşturuyor. Çam fıstığı ve cömert zeytinyağı, tek bir tabakta Levant'ın klasik aroma dengesini kuruyor. Misafir sofrası için ideal, tek tepside bütün öğün.",
    prepMinutes: 15,
    cookMinutes: 40,
    totalMinutes: 55,
    ingredientsAdd: [
      { name: "Lavash", amount: "4", unit: "adet" },
      { name: "Çam fıstığı", amount: "2", unit: "yemek kaşığı" },
      { name: "Bahar 7'si veya yenibahar", amount: "0.5", unit: "çay kaşığı" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Sumak", newAmount: "2", newUnit: "yemek kaşığı" },
      { name: "Zeytinyağı", newAmount: "4", newUnit: "yemek kaşığı" },
      { name: "Soğan", newAmount: "4", newUnit: "adet" },
    ],
    tipNote:
      "Sumakı cömert kullanın, musakhan'ın imzası bu. Mümkünse Filistin zeytinyağı veya iyi bir Ege erken hasat seçin; soğanlar zeytinyağına yumuşadıkça lavasha tat sızdırır.",
    servingSuggestion:
      "Yanında sade yoğurt, tahinli salata veya soğuk ayranla servis edin; tavuğu lavashla sararak elle yenmesi geleneksel.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk butlarını sumak (1 yk), zeytinyağı (1 yk), bahar 7'si, tuz ve karabiberle marine edin; 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğanları yarım ay ince doğrayın; geniş tavada zeytinyağında (2 yk) yumuşayana kadar 10-12 dakika sotelendirin, kalan sumakı (1 yk) ekleyip 1 dakika çevirin.", timerSeconds: 720 },
      { stepNumber: 3, instruction: "Lavashları fırın tepsisine serin; üzerine soteli soğanların yarısını eşit yayın, marine tavuk butlarını dizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kalan soğan-zeytinyağı karışımını tavuğun üzerine gezdirin, üzerine son zeytinyağı (1 yk) ve limon suyunu serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "200°C ön ısıtılmış fırında 35-40 dakika pişirin; üzeri kızarınca son 5 dakika üst ızgaraya alabilirsiniz.", timerSeconds: 2400 },
      { stepNumber: 6, instruction: "Çam fıstığını kuru tavada altın renge dönene kadar 2 dakika kavurup fırından çıkan tepsiye serpin; lavashla sararak servis edin.", timerSeconds: 120 },
    ],
  },

  // ─── 2: sumakli-yumurta-kapama-kilis (definition fix + yumusat) ──
  {
    type: "rewrite",
    slug: "sumakli-yumurta-kapama-kilis-usulu",
    reason:
      "REWRITE definition fix + Kilis yumusatma. Klasik 'yumurta kapama' = yagda yumurta + kapagi kapatma + tereyagi + biber + nane (Karaca + Nefis Yemek 2 kaynak). Kilis spesifik 'yumurta kapama' kanitsiz (Kultur Portali Kilis 'mikla' var ama yogurtlu farkli yemek). DB step 4 'yumurtalari kirip 3 dakika pisirin' = menemen/mihlama tarzi, klasik kapama teknigi degil. Title 'Guneydogu Esintili Sumakli Yumurta Kapama'. 3 ingredient_add (tereyagi + pul biber + kuru nane klasik kapama bilesenleri), 1 amount change (zeytinyagi 1tk→1yk yetersiz miktar), 5 step replace kapak kapali kapama teknigi.",
    sources: [
      "https://www.karaca.com/blog/her-sabah-farkli-bir-lezzet-yumurta-pisirme-cesitleri",
      "https://www.nefisyemektarifleri.com/tereyagli-yumurta-kapama/",
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir/mikla-1",
    ],
    newTitle: "Güneydoğu Esintili Sumaklı Yumurta Kapama",
    description:
      "Yumurta kapama, klasik Türk kahvaltı tekniği; yumurtanın yağda kapalı tencerede yumuşacık pişip üzerine sumak, pul biber, nane serpilmesi. Güneydoğu mutfağında sumak öne çıkar, sade malzemelerden derin bir lezzet kurar. Beş dakikada hazır, sıcak ekmekle harika gider.",
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "1", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Kapağı erken açmayın, üst kısım buharla pişer. Sumak son anda eklenir; ısıyla acılaşmasın.",
    servingSuggestion:
      "Sıcak tandır veya kabuklu somun ekmeğiyle, yanında zeytin ve taze yeşillikle kahvaltıda servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavada tereyağı ve zeytinyağını birlikte eritin; doğranmış soğanı orta ateşte 3-4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 2, instruction: "Yumurtaları soğanın üstüne tek tek kırın; sarısı dağılmasın diye dikkatli olun.", timerSeconds: null },
      { stepNumber: 3, instruction: "Üzerine 1 yemek kaşığı su serpip kapağı kapatın; kısık ateşte 4-5 dakika beyazlar tutana kadar pişirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Kapağı açın, üzerine sumak, pul biber, kuru nane ve tuzu serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı tekrar kapatıp ocaktan alarak 1 dakika dinlendirin; sıcak ekmekle hemen servis edin.", timerSeconds: 60 },
    ],
  },

  // ─── 3: sucuklu-mantarli-yumurta-eskisehir (yumusat + rewrite) ───
  {
    type: "rewrite",
    slug: "sucuklu-mantarli-yumurta-eskisehir-usulu",
    reason:
      "REWRITE yore yumusat + step rewrite. Eskisehir 12 yoresel yemek listesinde sucuklu mantarli yumurta YOK (Lezzet: cibörek + balaban kebabi + tatar boregi + hashasli dolama + arabasi). Modern Turk kahvalti klasigi. Step jenerik scaffold ('malzemeleri olcup ayri kaplara alin', 'son dokusunu kontrol edip tabaklayin'). Title 'Sucuklu Mantarli Kahvalti Yumurtasi'. 3 ingredient_add (tuz + karabiber + maydanoz garnish), 1 amount change (tereyagi 1tk→1yk yetersiz), 5 step replace temiz akis (mantar once tek basina + sucuk + yumurta).",
    sources: [
      "https://www.lezzet.com.tr/lezzetten-haberler/eskisehirin-yoresel-yemekleri",
      "https://blog.biletbayi.com/eskisehir-kahvalti-mekanlari.html/",
      "https://ye-mek.net/tarif/kahvaltilik-sucuklu-mantarli-yumurta",
    ],
    newTitle: "Sucuklu Mantarlı Kahvaltı Yumurtası",
    description:
      "Sahanda sucuklu yumurta klasiğinin mantarla zenginleşmiş hali; Eskişehir kahvaltı sofralarında sıkça karşımıza çıkan, mantarın yöre sebzeleri arasında öne çıktığı bir kombinasyon. Tek tavada hızlı kahvaltı, sucuk yağı mantara aroma verir.",
    prepMinutes: 5,
    cookMinutes: 12,
    totalMinutes: 17,
    ingredientsAmountChange: [
      { name: "Tereyağı", newAmount: "1", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Tuz", amount: "0.25", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Taze maydanoz (servis)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Mantarı önce tek başına kavurun; suyu çekmeden sucuk eklerseniz haşlanır. Sucuk yağı yeterli olabilir, tereyağı miktarını mantarın doygunluğuna göre ayarlayın.",
    servingSuggestion:
      "Sıcak ekmek, kaşar peyniri ve domates dilimleriyle, yanında demli çayla kahvaltıda sahanda servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Mantarları dilimleyin; geniş tavada tereyağını eritip orta ateşte 6-7 dakika suyu salıp çekene kadar soteleyin.", timerSeconds: 420 },
      { stepNumber: 2, instruction: "Sucuk dilimlerini ekleyin, kendi yağı çıkana ve hafif kıvrılmaya başlayana kadar 2 dakika daha kavurun.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Tavada düz bir alan açın, yumurtaları doğrudan üzerine kırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tuz ve karabiberi serpin; sarısı akışkan kalsın isterseniz 3 dakika, daha pişmiş için 5 dakika kapağı açık pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Maydanozla süsleyip sıcakken sahanda servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: zeytinli-keskek-aydin-bahce (SURE FIX KRITIK) ─────────────
  {
    type: "rewrite",
    slug: "zeytinli-keskek-aydin-bahce-usulu",
    reason:
      "REWRITE SURE FIX KRITIK + yore yumusat. Klasik keskek 2.5-4 saat (Wikipedia UNESCO 2011 + Sofra Dovme + Yemek.com 3 kaynak); duduklu 45-50 dk. DB total 50 dk YETERSIZ (duduklu modunda bile islatma yok). Aydin 'Bahce' iddia kanitsiz, vegan zeytinli modern uyarlama. Title 'Ege Esintili Vegan Zeytinli Keskek Uyarlamasi'. 5 ingredient_add (nohut 0.5sb islatilmis klasik keskek bileseni + sogan + sarimsak + pul biber + kekik), total 50→540 dk (8 saat islatma + 60 dk duduklu pisirme + 30 dk hazir/dinlenme), difficulty MEDIUM korunur, 6 step replace duduklu pattern.",
    sources: [
      "https://en.wikipedia.org/wiki/Keskek",
      "https://www.sofra.com.tr/tarif/aksam-yemegi-ve-ana-yemekler/dovme-keskek",
      "https://yemek.com/tarif/geleneksel-keskek/",
    ],
    newTitle: "Ege Esintili Vegan Zeytinli Keşkek Uyarlaması",
    description:
      "Klasik keşkeğin etsiz, Ege esintili modern uyarlaması; dövme buğdayın yumuşacık lapasına nohut, yeşil zeytin ve zeytinyağı eşlik ediyor. UNESCO'nun 2011'de tescil ettiği geleneksel keşkek tören yemeğidir, bu vegan versiyon ise sade bir akşam tabağı için tasarlandı. Sabırlı bir pişirmeyle ödüllendiren tarif.",
    prepMinutes: 480,
    cookMinutes: 60,
    totalMinutes: 540,
    ingredientsAdd: [
      { name: "Nohut (1 gece ıslatılmış)", amount: "0.5", unit: "su bardağı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru kekik", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Dövme buğdayı atlamayın, ıslatmadan pişirirseniz lapa kıvamına saatler süre alır. Düdüklü yoksa klasik tencerede 90-120 dakika hesaplayın; ara ara karıştırın, dipte tutmasın.",
    servingSuggestion:
      "Sıcak servis edin, yanında közlenmiş biber salatası veya cacık iyi eşlik eder.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Dövme buğday ve nohutu ayrı kaplarda en az 8 saat (1 gece) suda ıslatın; sabah süzün.", timerSeconds: 28800 },
      { stepNumber: 2, instruction: "Süzülmüş buğday ve nohutu düdüklü tencereye alın; doğranmış soğan, ezilmiş sarımsak ve tuzla birlikte 4 su bardağı sıcak suya batırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Düdüklü tencereyi yüksek ateşte fokurdamaya getirin, ardından kısık ateşte 45-50 dakika pişirin.", timerSeconds: 2700 },
      { stepNumber: 4, instruction: "Düdükten buharı çıkarıp kapağı açın, ahşap kaşıkla buğdayları ezerek lapa kıvamı verin; gerekirse sıcak su ekleyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Doğranmış yeşil zeytin ve zeytinyağını ekleyip 5 dakika daha kaynatın, kekiği karıştırın.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Tabaklara alın, üzerine sıcak zeytinyağı ve pul biber gezdirip servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: tahinli-isotlu-kabak-dip-adiyaman (yumusat + sablon fix) ─
  {
    type: "rewrite",
    slug: "tahinli-isotlu-kabak-dip-adiyaman-usulu",
    reason:
      "REWRITE yore yumusat + step sablon hata fix. Adiyaman tescil YOK (Sanliurfa isotu CI 25.08.2000; Adiyaman uretim var ama tescil yok); Adiyaman KTB resmi mezeleri listesinde tahinli kabak dip yok. Levant babaganus pattern. DB step 2 'sarimsak, yogurt, tahin veya zeytinyagi pürüzsüz karistirin' diyor LISTEDE sarimsak ve yogurt YOK = sablon hata. Title 'Adiyaman Esintili Isotlu Tahinli Kabak Dipi'. 4 ingredient_add (sarimsak + zeytinyagi + tuz + maydanoz), 2 amount change (tahin 2→3 yk + limon 1→1.5 yk), 5 step replace kozleme + ezme + tahin sosu klasik akisi.",
    sources: [
      "https://adiyaman.ktb.gov.tr/TR-61353/adiyaman-mutfagi.html",
      "https://www.sanliurfaolay.com/sanliurfa/sanliurfa-isotu-kac-yil-once-tescil-aldi/16863",
      "https://www.kevserinmutfagi.com/babagannus.html",
    ],
    newTitle: "Adıyaman Esintili İsotlu Tahinli Kabak Dipi",
    description:
      "Közlenmiş kabağın yumuşacık dokusunu tahin, sarımsak ve limonun ferahlığıyla buluşturan hafif bir meze. Üzerine serpilen Adıyaman bölgesinin keskin isotu, dipe tatlı, yakıcı bir derinlik veriyor; klasik kahvaltı, mangal yanı veya akşam mezesi olarak servis edilebilir.",
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 70,
    ingredientsAmountChange: [
      { name: "Tahin", newAmount: "3", newUnit: "yemek kaşığı" },
      { name: "Limon suyu", newAmount: "1.5", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Sızma zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Taze maydanoz (servis)", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Kabağı közleyebilirsen dumanlı aroma çok daha belirgin olur; fırını kullanıyorsan tepsiye az su koy, kabuk altında buharlanarak yumuşasın. Tahin ekledikten sonra 30 dakika dinlendir, lezzetler oturuncaya kadar isot tatlanır.",
    servingSuggestion:
      "Sıcak lavaş, közlenmiş ekmek veya çiğ sebze çubuklarıyla (havuç, kereviz sapı, kırmızı biber) mezelik tabakta servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabakları közleyin veya 200°C fırında 25 dakika yumuşatın (alternatif: küp doğrayıp kaynar suda 10 dakika haşlayın).", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Soğuyunca kabukları soyun, çekirdek suyunu süzün; çatal veya blender ile kabaca ezin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Sarımsağı tuzla ezerek krema kıvamına getirin; tahin, limon suyu ve isotu ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kabak ezmesini sarımsak-tahin karışımına yedirin, tuzu ayarlayın; en az 30 dakika buzdolabında dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 5, instruction: "Servis tabağında zeytinyağını gezdirin, üzerine biraz isot serpin, maydanozla süsleyip servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tutlu-yarma-corbasi-erzincan (yumusat + tereyagi fix) ────
  {
    type: "rewrite",
    slug: "tutlu-yarma-corbasi-erzincan-usulu",
    reason:
      "REWRITE yore yumusat + tereyagi tutarsizlik fix + yogurt opsiyonel ekle. Erzincan 25 yoresel yemek listesinde dutlu yarma corbasi YOK (Biletbayi). Erzincan dut kurusu yöresel urun (Akpinar). Yarma + yogurt corba pattern Dogu Anadolu. DB step 4 '1 yemek kasigi tereyagini' diyor LISTEDE YOK = tutarsizlik. Title 'Dogu Anadolu Esintili Dutlu Yarma Corbasi'. 4 ingredient_add (tereyagi 30gr step ile tutarli + suzme yogurt opsiyonel + kuru nane + karabiber), 1 amount change (su 1.25→1.5 lt yarma siseme), 5 step replace.",
    sources: [
      "https://blog.biletbayi.com/erzincanin-yoresel-yemekleri.html/",
      "https://www.akpinartulumpeyniri.com/urun/erzincan-dut-kurusu/",
      "https://www.lezzet.com.tr/yemek-tarifleri/corbalar/corba-tarifleri/tutmac-corbasi-tarifi",
    ],
    newTitle: "Doğu Anadolu Esintili Dutlu Yarma Çorbası",
    description:
      "Doğu Anadolu'nun iki yöresel ürününü buluşturan kış çorbası: sabırla pişen yarmanın doyuruculuğu, Erzincan kuru dutunun tatlı, ekşi notasıyla yumuşuyor. Sade tereyağı ve kuru nane ile bitirilen, hem hafif hem kıvamlı bir lezzet.",
    prepMinutes: 70,
    cookMinutes: 60,
    totalMinutes: 130,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "1.5", newUnit: "lt" },
    ],
    ingredientsAdd: [
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Süzme yoğurt (opsiyonel)", amount: "1", unit: "su bardağı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
    ],
    tipNote:
      "Yarmayı önceden ılık suda beklettiğinde pişme süresi yarıya iner, çorba daha kıvamlı olur. Kuru dut çok şekerlidir; ayrı yumuşatıp suyunu süzmek tatlılığı dengeli tutar.",
    servingSuggestion:
      "Yanına ince dilim taze köy ekmeği veya kuru lavaş, isteğe göre bir kase soğuk süzme yoğurt eşliğinde sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yarmayı yıkayın, 1 saat ılık suda bekletip süzün (pişme süresi kısalır).", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Yarmayı 1.5 lt suya alın; kaynayınca kısık ateşte 40-50 dakika yumuşayana dek pişirin.", timerSeconds: 2700 },
      { stepNumber: 3, instruction: "Kuru dutları ayrı küçük tencerede 1 su bardağı sıcak suda 10 dakika yumuşatın, sapını ayıklayın.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Yumuşayan dutları yarma çorbasına ekleyin, tuzu ayarlayın; 5-10 dakika birlikte kaynatın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Servis öncesi tereyağında kuru naneyi 30 saniye kavurun, çorbanın üzerine gezdirip karabiberle servis edin; isterseniz yanında soğuk süzme yoğurt sunun.", timerSeconds: 30 },
    ],
  },

  // ─── 7: tepsi-simit-kebabi-adiyaman (KRITIK KESIF + disambiguate) ─
  {
    type: "rewrite",
    slug: "tepsi-simit-kebabi-adiyaman-usulu",
    reason:
      "REWRITE KRITIK KESIF + disambiguate. Simit kebabi CI Gaziantep'e tescilli (19.04.2021 Gaziantep Belediyesi resmi); Adiyaman atfi YANLIS (Vikipedi + Unal Et Lokantasi 2 kaynak). Klasik harc soğan + sarimsak + biber + maydanoz + isot + karabiber + kimyon + zeytinyagi (DB'de hicbiri YOK, eksik klasik harc). Title 'Tepside Simit Kebabi (Guneydogu Esintili)' + description'a Gaziantep CI atif. 7 ingredient_add (kuru sogan + sarimsak + maydanoz + isot + karabiber + kimyon + zeytinyagi), 1 amount change (ince bulgur 0.5→1 sb klasik oran), difficulty MEDIUM korunur, 6 step replace klasik simit kebabi tepside akisi.",
    sources: [
      "https://ci.gaziantep.bel.tr/Urunler/gaziantep-simit-kebabi-antep-simit-kebabi-1032",
      "https://tr.wikipedia.org/wiki/Simit_kebab%C4%B1",
      "https://www.unaletlokantasi.com/gaziantep-usul%C3%BC-simit-kebab%C4%B1-nas%C4%B1l-yap%C4%B1l%C4%B1r",
    ],
    newTitle: "Tepside Simit Kebabı (Güneydoğu Esintili)",
    description:
      "Güneydoğu mutfağının karakteristik simit kebabını şişe takmak yerine tepside fırınlayan pratik versiyon. İnce bulgur (yörede 'simit' denir) ve zırh kıyma harcı, soğan, sarımsak ve isotla yoğrulup baklava dilimi izleriyle pişer. Orijinal şişte simit kebabı 19 Nisan 2021'de Gaziantep adına coğrafi işaret tescili almıştır; bu tarif ev mutfağı için tepsi uyarlamasıdır.",
    prepMinutes: 25,
    cookMinutes: 30,
    totalMinutes: 70,
    ingredientsAmountChange: [
      { name: "İnce bulgur", newAmount: "1", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Kuru soğan (rendelenmiş)", amount: "1", unit: "büyük adet" },
      { name: "Sarımsak (ezilmiş)", amount: "3", unit: "diş" },
      { name: "Taze maydanoz (ince doğranmış)", amount: "0.5", unit: "demet" },
      { name: "İsot veya pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Sızma zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Bulguru ılık suda iyice şişir, harcı en az 10 dakika yoğur; bulgur ve kıyma birbirini tuttukça pişerken dağılmaz. Tepsiye yaymadan önce baklava dilimi izleri çiz, hem pişme dengeli olur hem servis dilimi temiz çıkar.",
    servingSuggestion:
      "Yanında soğan, maydanoz, sumak salatası, közlenmiş yeşil biber ve domates, ayran veya şalgam suyuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulguru ılık suda 15 dakika bekletin; rendelenmiş soğanı ezerek suyunu hafif boşaltın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Geniş bir kapta kıymayı, şişmiş bulguru, soğanı, ezilmiş sarımsağı, ince doğranmış kapya biber ve maydanozu birleştirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tuz, isot, karabiber, kimyon ve zeytinyağını ekleyip harcı en az 8-10 dakika yoğurun; bulgur kıymayla bütünleşene dek hamur kıvamı tutsun.", timerSeconds: 540 },
      { stepNumber: 4, instruction: "Yağlı kâğıt serili tepsiye harcı 1.5-2 cm kalınlığında düzgün yayın; üzerine bıçak ucuyla baklava dilimi izleri çizin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine ince halka domates ve sivri biber yerleştirin, biraz zeytinyağı gezdirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "200°C ön ısıtılmış fırında 25-30 dakika üzeri kızarana dek pişirin; alıp 5 dakika dinlendirip sıcak servis edin.", timerSeconds: 1800 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-17");
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
              paket: "oturum-29-mini-rev-batch-17",
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
