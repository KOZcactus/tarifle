/**
 * Tek-seferlik manuel mini-rev batch 11 (oturum 28): 7 KRITIK + 1
 * BONUS cuisine fix. Web research 2 paralel agent + 22+ kaynak
 * (Wikipedia Kaiserschmarrn + stadt-wien.at + ichkoche.at +
 * BMLUK / Wikipedia Xiaolongbao + Just One Cookbook / Wikipedia
 * Kotlet schabowy + Polish Foodies / Turk Patent Cografi Isaretler
 * Portali + Yemek.com Kayseri Yaglamasi + aspor.com.tr +
 * gazetebirlik.com / Kultur Portali Diyarbakir Zingil + Wikipedia
 * Zingil + Hurriyet Lezizz / Simply Lebanese Labneh + 196 flavors
 * Labneh + MoroccanZest / Love and Lemons Banh Mi + Feasting at
 * Home + Vicky Pham Vietnam Pickle).
 *
 * Verdict: 7 KRITIK + 1 cuisine fix bonus. Plus at (Avusturya)
 * cuisine code eklenmesi (CUISINE_CODES 39 → 40, oturum 28 cl/ge
 * pattern; west-europe region, Kaiserschmarrn + Wiener Schnitzel
 * national icon).
 *
 *   1. viyana-hashasli-erikli-kaiserschmarrn (CUISINE FIX hu→at):
 *      Kaiserschmarrn Kayser Franz Joseph I doneminden klasik Wiener
 *      tatlisi (Wikipedia + wien.info + Sacher 3 kaynak). DB cuisine
 *      'hu' (Macar!) yanlis. at (Avusturya) cuisine code eklendi.
 *      Description Habsburg + Wien vurgusu, tipNote yumurta beyazi
 *      kar kopugu kabarma teknigi.
 *
 *   2. viena-tavuk-schnitzel (CUISINE FIX de→at, BONUS):
 *      Wiener Schnitzel klasik dana pirzola Avusturya icon. Mevcut
 *      cuisine 'de' yumusatma (Almanya yakini), ama asıl 'at'.
 *      Tek migration ile iki tarif onarilir (paket 11 KRITIK).
 *
 *   3. yaglama-corbasi-kayseri-usulu (KIBE-MUMBAR pattern, REWRITE
 *      FULL + TYPE FIX): Kayseri yaglamasi Turk Patent 2021 cografi
 *      isaret tescil; klasik kat kat yufka + kiymali ic + sarimsakli
 *      yogurt + tereyaginda pul biber. DB type 'CORBA' YANLIS, yemek
 *      olarak corbalik su + bayat ekmek serili (data corruption).
 *      Title "Kayseri Yaglama Corbasi" → "Kayseri Yaglamasi". 16
 *      ingredient replace, 7 step replace, type CORBA→YEMEK.
 *
 *   4. xiao-long-bao (DISAMBIGUATE, jeyuk-bokkeum pattern): Klasik
 *      Sanghay-Nanxiang aspikli manti, domuz dolgulu (Wikipedia +
 *      Just One Cookbook 2 kaynak). DB dana versiyonu, disambiguate
 *      gerekli. Title "Xiao Long Bao" → "Dana Xiao Long Bao (Turk
 *      Pazari Uyarlamasi)". 5 ingredient_add (zencefil + scallion +
 *      Shaoxing sarabi + susam yagi + beyaz biber), SUSAM allergen
 *      ekle.
 *
 *   5. warsaw-kotlet-schabowy (DISAMBIGUATE): "Schab" Lehce domuz
 *      sirti, klasik Polonya Wiener schnitzel benzeri (Wikipedia
 *      etymology). DB dana versiyonu, disambiguate gerekli. Title
 *      "Varsova Dana Kotlet Schabowy (Turk Pazari Uyarlamasi)".
 *      Description rewrite (1860 Polonya yemek kitabi referansi).
 *
 *   6. zeytinli-labneli-kahvalti-ekmegi-fas-usulu (CUISINE FIX
 *      ma→me): Labneh klasik Levant/Lubnan/Suriye/Ürdun (Simply
 *      Lebanese + 196 flavors 2 kaynak). Fas mutfaginda jben baskin,
 *      labneh klasik degil. Cuisine ma → me (Orta Dogu). Title
 *      "Zeytinli Labneli Kahvalti Ekmegi Levant Usulu". 4 ingredient_
 *      add (Kalamata zeytin + nane + zaatar + salatalik).
 *
 *   7. zingil-tatlisi-siirt-usulu (REWRITE, KULTUR PORTALI fix):
 *      Zingil tatlisi Kultur Portali (gov.tr) DIYARBAKIR kayitli,
 *      Siirt YANLIS (Wikipedia da Diyarbakir/Mardin/Sanliurfa
 *      serbetli). Slug korunur (URL break onleme), title revize
 *      "Zingil Tatlisi Diyarbakir Usulu". DB'de pekmez yanlis
 *      (klasik seker serbeti). 1 ingredient_remove (Pekmez), 9
 *      ingredient_add (kabartma tozu + yumurta + tuz + 2 sivi yag
 *      icin + 3 serbet + sivi yag fazla doza), 6 step replace.
 *
 *   8. yesil-soganli-omlet-banh-mi-tost-vietnam-usulu (DEFINITION
 *      FIX): Banh mi tanimi geregi turshulu sebze + cilantro +
 *      jalapeño + mayo + Maggi sosu sart (Love and Lemons +
 *      Feasting at Home + Vicky Pham 3 kaynak). DB sade omlet
 *      baget = banh mi degil. 9 ingredient_add (havuc + daikon +
 *      sirke + seker + tuz + salatalik + cilantro + jalapeño +
 *      mayo + Maggi).
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description check).
 * Slug korunur (URL break onleme; siirt slug aynen kalir).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-11.ts
 *   npx tsx scripts/fix-mini-rev-batch-11.ts --env prod --confirm-prod
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
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── 1: viyana-kaiserschmarrn (CUISINE FIX hu→at) ────────────
  {
    type: "rewrite",
    slug: "viyana-hashasli-erikli-kaiserschmarrn",
    reason:
      "KRITIK CUISINE FIX hu→at. Kaiserschmarrn Kayser Franz Joseph I doneminden klasik Wiener tatlisi (Wikipedia + wien.info + Sacher referans). DB cuisine 'hu' (Macar!) yanlis - Habsburg sonrasi Macaristan'a yayildi ama mense Wien. Tarifle CUISINE_CODES'a at (Avusturya) eklendi. Description Habsburg + Wien vurgusu, tipNote klasik kar kopugu kabarma teknigi.",
    sources: [
      "https://en.wikipedia.org/wiki/Kaiserschmarrn",
      "https://www.stadt-wien.at/lifestyle/essen-trinken/rezepte/wiener-kaiserschmarrn.html",
      "https://www.ichkoche.at/kaiserschmarren-a-la-sacher-rezept-1839",
    ],
    cuisine: "at",
    description:
      "Kaiserschmarrn, Kayser Franz Joseph I döneminden adını alan klasik Viyana tatlısıdır; çatalla parçalanan kabarık pankek, haşhaş ve erikle Avusturya sofrasının imzasını taşır. Hotel Sacher tarifi referans kabul edilir.",
    tipNote:
      "Yumurta beyazını ayrı çırpıp kar köpüğü hâline getirip katlamak parçaların kabarmasını sağlar; klasik Wiener tekniğin imzasıdır.",
    servingSuggestion:
      "Pudra şekeri ve Zwetschgenröster (erik kompostosu) ile sıcak servis edin.",
  },

  // ─── 2: viena-tavuk-schnitzel (CUISINE FIX de→at, BONUS) ────
  {
    type: "rewrite",
    slug: "viena-tavuk-schnitzel",
    reason:
      "BONUS CUISINE FIX de→at. Wiener Schnitzel klasik dana pirzola Avusturya icon (Wien menseli, Habsburg sarayi mirasi). Mevcut cuisine 'de' yumusatma (Almanya yakini), asil 'at'. Paket 11 ile birlikte at cuisine eklendigi icin migration tek paketle yapilir.",
    sources: [
      "https://en.wikipedia.org/wiki/Wiener_schnitzel",
      "https://www.wien.info/en/dining-drinking/viennese-cuisine",
    ],
    cuisine: "at",
    description:
      "Tavuk Schnitzel, Avusturya'nın klasik Wiener Schnitzel'inin (geleneksel olarak dana pirzola) Türk pazarına uyarlanmış tavuk versiyonudur. Panko-galeta kaplı çıtır kaplama ve limon dilimleri imzasıdır.",
  },

  // ─── 3: yaglama-corbasi-kayseri (KIBE-MUMBAR REWRITE FULL) ──
  {
    type: "rewrite",
    slug: "yaglama-corbasi-kayseri-usulu",
    reason:
      "KIBE-MUMBAR pattern data corruption fix. Kayseri yaglamasi Turk Patent 2021 cografi isaret tescilli kat kat yufka + kiymali ic + sarimsakli yogurt + tereyaginda pul biber TEPSI YEMEGI (Yemek.com + aspor.com.tr + gazetebirlik.com 3 kaynak). DB type 'CORBA' YANLIS (slug 'yaglama-corbasi' arketip secimi yanlis); steps su ekleyip pisirme + bayat ekmek = corba sablonu, klasik yaglama ile hicbir uyum yok. Title 'Kayseri Yaglama Corbasi' → 'Kayseri Yaglamasi', type CORBA → YEMEK.",
    sources: [
      "https://ci.turkpatent.gov.tr/",
      "https://yemek.com/tarif/kayseri-yaglamasi/",
      "https://www.aspor.com.tr/haberler/2023/07/31/kayseri-yaglamasi-nasil-yapilir-yaglama-tarifi-malzemeleri-yapilisi-ve-puf-noktalari-nedir",
    ],
    newTitle: "Kayseri Yağlaması",
    description:
      "Kayseri yağlaması, ince yufkaların kat kat dizilip kıymalı iç ve sarımsaklı yoğurtla bütünleştiği geleneksel bir tepsi yemeğidir; 2021'de Türk Patent coğrafi işaret tescili almıştır.",
    recipeType: RecipeType.YEMEK,
    prepMinutes: 60,
    cookMinutes: 25,
    totalMinutes: 85,
    averageCalories: 480,
    allergensAdd: [Allergen.GLUTEN, Allergen.SUT],
    ingredientsRemove: ["Bayat ekmek", "Su"],
    ingredientsAdd: [
      { name: "Un (hamur için)", amount: "3", unit: "su bardağı" },
      { name: "Süt (ılık, hamur için)", amount: "0.5", unit: "su bardağı" },
      { name: "Yaş maya", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sivri biber", amount: "2", unit: "adet" },
      { name: "Domates", amount: "1", unit: "adet" },
      { name: "Süzme yoğurt", amount: "2", unit: "su bardağı" },
      { name: "Sarımsak (yoğurt için)", amount: "2", unit: "diş" },
      { name: "Tereyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Yufkayı çok kurutmadan tavadan alın; esnekliği kat kat dizilince bütünlüğü sağlar. Sıcak servis edin, beklerken yufka yoğurdu çekip yumuşar.",
    servingSuggestion:
      "Üzerine sarımsaklı yoğurt yayıp tereyağında kızdırılmış pul biber gezdirin; sıcakken hemen sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Hamur malzemelerini (un, süt, su, maya, tuz, sıvı yağ) yoğurup mayalanması için 1 saat dinlendirin.", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Soğan ve biberi ince doğrayıp kıymayla 8 dakika kavurun, doğranmış domatesi ekleyip suyu çekene kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Hamuru 8 bezeye bölüp her birini ince yufka şeklinde açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tavayı kuru ısıtıp her yufkayı 30 saniye iki yüzlü pişirin (kurumadan, esnek kalsın).", timerSeconds: null },
      { stepNumber: 5, instruction: "Servis tabağına bir yufka koyup üstüne kıymalı içten yayın, üzerine ikinci yufka, tekrar harç, son yufka kapağa kadar kat kat dizin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Yoğurdu ezilmiş sarımsak ve tuzla karıştırıp üstüne dökün.", timerSeconds: null },
      { stepNumber: 7, instruction: "Tereyağını eritip pul biberi ekleyip kızdırın, sosu yağlamanın üzerine gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: xiao-long-bao (DISAMBIGUATE) ─────────────────────────
  {
    type: "rewrite",
    slug: "xiao-long-bao",
    reason:
      "DISAMBIGUATE (jeyuk-bokkeum/spaghetti-carbonara/tonkatsu pattern). Xiao long bao klasik Sanghay-Nanxiang aspikli manti, domuz dolgulu (Wikipedia + Just One Cookbook 2 kaynak). DB dana versiyonu Türk pazar uyarlamasi, disambiguate edilmemis. Title revize 'Dana Xiao Long Bao (Türk Pazari Uyarlamasi)', description Sanghay vurgusu. 5 ingredient_add (taze zencefil + scallion + Shaoxing sarabi + susam yagi + beyaz biber), SUSAM allergen ekle.",
    sources: [
      "https://en.wikipedia.org/wiki/Xiaolongbao",
      "https://www.justonecookbook.com/xiao-long-bao-soup-dumplings/",
    ],
    newTitle: "Dana Xiao Long Bao (Türk Pazarı Uyarlaması)",
    description:
      "Şanghay-Nanxiang menşeli klasik Xiao Long Bao normalde domuz kıyma ile yapılır; bu Türk pazarına uyarlanmış dana versiyondur. İnce hamur içine sarılmış kıyma ve jelatinli et suyu, buharda erirken çorbalı içi oluşturur.",
    allergensAdd: [Allergen.SUSAM],
    ingredientsAdd: [
      { name: "Taze zencefil (rendelenmiş)", amount: "1", unit: "yemek kaşığı" },
      { name: "Taze soğan (scallion)", amount: "2", unit: "dal" },
      { name: "Shaoxing pirinç şarabı veya kuru beyaz şarap", amount: "1", unit: "yemek kaşığı" },
      { name: "Susam yağı", amount: "1", unit: "çay kaşığı" },
      { name: "Beyaz biber", amount: "0.25", unit: "çay kaşığı" },
    ],
    tipNote:
      "Aspikli et suyunu soğuk koymadan iç harcı dinlendirmeyin; jelatinli yapı buharda erirken klasik soslu içi oluşturur. Beyaz biber ve Shaoxing şarabı Şanghay imzasıdır.",
    servingSuggestion:
      "Chinkiang siyah sirke ve julyen kesilmiş zencefil ile servis edin.",
  },

  // ─── 5: warsaw-kotlet-schabowy (DISAMBIGUATE) ───────────────
  {
    type: "rewrite",
    slug: "warsaw-kotlet-schabowy",
    reason:
      "DISAMBIGUATE. 'Schab' Lehce domuz sirti, klasik kotlet schabowy domuz pirzola (Wikipedia 1860 Polonya yemek kitabi referans). DB dana versiyonu Türk pazar uyarlamasi. Title revize 'Varsova Dana Kotlet Schabowy (Türk Pazari Uyarlamasi)', description Polonya 19. yuzyil tarihce + Wiener schnitzel kuzeni vurgusu. tipNote klasik dovum teknigi.",
    sources: [
      "https://en.wikipedia.org/wiki/Kotlet_schabowy",
    ],
    newTitle: "Varşova Dana Kotlet Schabowy (Türk Pazarı Uyarlaması)",
    description:
      "Kotlet schabowy, Polonya'nın 19. yüzyıldan beri sofralarında olan klasik panelenmiş pirzolasıdır; 'schab' Lehçe domuz sırtı anlamına gelir ve klasik tarif domuz fileto kullanır. Bu sürüm Türk pazarına uyarlanmış dana versiyondur.",
    tipNote:
      "Eti şeffaf streç film arasında dövmek lif kopmasını önler ve kotletin eşit incelikte kalmasını sağlar.",
    servingSuggestion:
      "Patates püresi, salatalık turşusu (mizeria) ve limon dilimleriyle sıcak servis edin.",
  },

  // ─── 6: zeytinli-labneli-kahvalti-ekmegi (CUISINE FIX ma→me) ─
  {
    type: "rewrite",
    slug: "zeytinli-labneli-kahvalti-ekmegi-fas-usulu",
    reason:
      "KRITIK CUISINE FIX ma→me. Labneh klasik Levant/Lubnan/Suriye/Ürdün sabah sofrasi (Simply Lebanese + 196 flavors 2 kaynak). Fas mutfaginda jben (taze peynir) baskin, labneh klasik degil (MoroccanZest teyit). Cuisine ma → me (Orta Dogu, Tarifle CUISINE_CODES'ta zaten var). Title 'Zeytinli Labneli Kahvalti Ekmegi Levant Usulu'. 4 ingredient_add (Kalamata zeytin + taze nane + zaatar + salatalik), step revize.",
    sources: [
      "https://www.simplyleb.com/recipe/labneh/",
      "https://www.196flavors.com/labneh/",
      "https://moroccanzest.com/moroccan-breakfast/",
    ],
    cuisine: "me",
    newTitle: "Zeytinli Labneli Kahvaltı Ekmeği Levant Usulü",
    description:
      "Levant usulü zeytinli labneli kahvaltı ekmeği, kalın süzme yoğurttan labneyi taze ekmek üstünde zeytinyağı ve siyah zeytinle buluşturan, Lübnan ve Suriye sabah sofralarının sade klasiğidir.",
    ingredientsAdd: [
      { name: "Kalamata zeytin (siyah)", amount: "40", unit: "gr" },
      { name: "Taze nane", amount: "5", unit: "yaprak" },
      { name: "Zaatar baharatı (opsiyonel)", amount: "1", unit: "tatlı kaşığı" },
      { name: "Salatalık dilimi (eşlik)", amount: "4", unit: "dilim" },
    ],
    tipNote:
      "Labneyi kaşıkla yayarken ortasına bir kuyu açın, zeytinyağı bu kuyuda toplansın; her lokmada labne ve yağ dengesi kalır. Zaatar Levant kahvaltı imzasıdır.",
    servingSuggestion:
      "Mint çayı veya taze sıkılmış nar suyu eşliğinde, küçük tabakta zeytinyağı + zaatar batırma yanında servis edin.",
  },

  // ─── 7: zingil-tatlisi (KULTUR PORTALI fix Diyarbakir) ──────
  {
    type: "rewrite",
    slug: "zingil-tatlisi-siirt-usulu",
    reason:
      "Kultur Portali (gov.tr) zingil DIYARBAKIR kayitli, slug'da 'siirt' YANLIS (Wikipedia da Diyarbakir/Mardin/Sanliurfa serbetli klasiği). Slug korunur (URL break onleme), title revize 'Zingil Tatlisi Diyarbakir Usulu'. DB'de pekmez yanlis (klasik seker serbeti, Hurriyet Lezizz teyit). 1 ingredient_remove (Pekmez), 8 ingredient_add (klasik hamur + serbet + maya yerine kabartma tozu), 6 step replace, prep+cook revize, allergens GLUTEN+YUMURTA+SUT.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/diyarbakir/neyenir/zngl",
      "https://tr.wikipedia.org/wiki/Z%C4%B1ng%C4%B1l_tatl%C4%B1s%C4%B1",
      "https://www.hurriyet.com.tr/lezizz/zingil-tarifi-41382809",
    ],
    newTitle: "Zingil Tatlısı Diyarbakır Usulü",
    description:
      "Diyarbakır zingil tatlısı, yumurtalı yoğurtlu hamuru kızgın yağda kızartıp soğuk şeker şerbetine alarak dışı çıtır içi yumuşak, Güneydoğu sofralarının klasik şerbetli hamur tatlısıdır (Mardin ve Şanlıurfa'da da yapılır).",
    prepMinutes: 35,
    cookMinutes: 25,
    totalMinutes: 60,
    averageCalories: 320,
    allergensAdd: [Allergen.GLUTEN, Allergen.YUMURTA, Allergen.SUT],
    ingredientsRemove: ["Pekmez"],
    ingredientsAdd: [
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Yoğurt", amount: "1", unit: "çay bardağı" },
      { name: "Toz şeker (hamur için)", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Kabartma tozu", amount: "10", unit: "gr" },
      { name: "Toz şeker (şerbet için)", amount: "3.5", unit: "su bardağı" },
      { name: "Su (şerbet için)", amount: "3", unit: "su bardağı" },
      { name: "Limon suyu (şerbet için)", amount: "5", unit: "damla" },
    ],
    tipNote:
      "Şerbet mutlaka soğuk, hamur sıcak olmalı; sıcak şerbet hamurun şerbeti çekmesini engeller, dış kabuk yumuşar. Bu Güneydoğu şerbetli tatlılarının (lokma, tulumba) ortak kuralıdır.",
    servingSuggestion:
      "Üzerine ince dövülmüş ceviz veya susam serpin, yanında sade Türk kahvesi ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Şerbeti önceden hazırlayın: şeker ve suyu kaynatıp 15 dakika koyu kıvama gelene kadar pişirin, limonu ekleyip 2 dakika kaynatın, tamamen soğutun.", timerSeconds: 1020 },
      { stepNumber: 2, instruction: "Un, kabartma tozu, tuz, şeker, yumurta, yoğurt ve suyu yumuşak bir hamur olana kadar yoğurun.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru üstü örtülü 30 dakika dinlendirin (gluten gevşesin).", timerSeconds: 1800 },
      { stepNumber: 4, instruction: "Sıvı yağı 170°C'ye ısıtın; ıslak elle ceviz büyüklüğünde parçalar koparıp yağa atın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Altın renge kadar 6-8 dakika kızartıp süzgeçle alın.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Sıcak zingilleri soğuk şuruba 2-3 dakika daldırın; süzüp servis tabağına alın.", timerSeconds: 150 },
    ],
  },

  // ─── 8: yesil-soganli-omlet-banh-mi (DEFINITION FIX) ────────
  {
    type: "rewrite",
    slug: "yesil-soganli-omlet-banh-mi-tost-vietnam-usulu",
    reason:
      "DEFINITION FIX (mahluta/cilbir pattern). Banh mi tanimi geregi turshulu sebze (do chua: havuc + daikon) + salatalik + cilantro + jalapeño + mayo + Maggi sosu sart (Love and Lemons + Feasting at Home + Vicky Pham 3 kaynak). DB sade omlet baget = banh mi degil. 9 ingredient_add (havuc + daikon + sirke + seker + tuz + salatalik + cilantro + jalapeño + mayo + Maggi), 6 step replace (do chua + omlet + bagete yerlestir).",
    sources: [
      "https://www.loveandlemons.com/banh-mi/",
      "https://www.feastingathome.com/authentic-banh-mi-sandwich-recipe/",
      "https://vickypham.com/blog/pickled-daikon-carrot-for-banh-mi/",
    ],
    description:
      "Vietnam usulü yeşil soğanlı omlet banh mi, çıtır bagetin içine yumuşak omlet, şeker-sirke turşusu havuç ve daikon (đồ chua), salatalık, taze cilantro ve jalapeño ile mayo ve Maggi sosunu birleştiren, Vietnam sokak yemeğinin yumurtalı klasiğidir.",
    averageCalories: 320,
    ingredientsAdd: [
      { name: "Havuç (ince çubuk)", amount: "1", unit: "küçük" },
      { name: "Daikon turp veya beyaz turp (ince çubuk)", amount: "50", unit: "gr" },
      { name: "Pirinç sirkesi (turşu için)", amount: "1", unit: "yemek kaşığı" },
      { name: "Toz şeker (turşu için)", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tuz (turşu için)", amount: "1", unit: "tutam" },
      { name: "Salatalık (uzun dilim)", amount: "4", unit: "dilim" },
      { name: "Taze kişniş (cilantro)", amount: "3", unit: "dal" },
      { name: "Jalapeño veya yeşil acı biber", amount: "4", unit: "dilim" },
      { name: "Mayonez", amount: "1", unit: "tatlı kaşığı" },
      { name: "Maggi sosu veya soya sosu", amount: "3", unit: "damla" },
    ],
    tipNote:
      "Đồ chua (havuç-daikon turşusu) banh mi'nin imzasıdır; en az 15 dakika bekletmek havucun çıtırlığını koruyup ekşi-tatlı dengesi verir. Mayonez ve Maggi sosu protein katmanını umami yönde kapatır.",
    servingSuggestion:
      "Vietnam kahvesi (cà phê sữa đá) veya soğuk yeşil çay eşliğinde, yan tarafa fazla cilantro ve birkaç dilim jalapeño koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Đồ chua: havuç ve daikon çubuklarını sirke, şeker ve tuz karışımına bandırıp en az 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Yumurtaları çırpın, doğranmış taze soğanı ekleyin; tereyağında orta ateşte 3 dakika yumuşak omlet pişirin.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Bageti uzunlamasına yarın, iç yüzeyleri kuru tavada veya fırında 2 dakika hafif kızartın.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "İç yüzeylere mayonezi ince sürün; bir tarafa Maggi sosundan birkaç damla damlatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Omleti yerleştirin, üzerine süzülmüş đồ chua, salatalık dilimleri, jalapeño ve cilantro koyun.", timerSeconds: null },
      { stepNumber: 6, instruction: "Bageti kapatıp ortadan ikiye kesin, ılık servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-11");
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
              paket: "oturum-28-mini-rev-batch-11",
              changes: {
                title_changed: op.newTitle ? `${recipe.title} -> ${op.newTitle}` : null,
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
                type_changed: op.recipeType ? `${recipe.type} -> ${op.recipeType}` : null,
                difficulty_changed: op.difficulty ? `${recipe.difficulty} -> ${op.difficulty}` : null,
                ingredients_added: op.ingredientsAdd?.length ?? 0,
                ingredients_removed: op.ingredientsRemove?.length ?? 0,
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

    const cuisineNote = op.cuisine ? ` (cuisine ${recipe.cuisine} -> ${op.cuisine})` : "";
    const typeNote = op.recipeType ? ` (type ${recipe.type} -> ${op.recipeType})` : "";
    const titleNote = op.newTitle ? ` (title değişti)` : "";
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
