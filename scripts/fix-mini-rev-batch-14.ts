/**
 * Tek-seferlik manuel mini-rev batch 14 (oturum 28): 7 KRITIK fix +
 * ca (Kanada) cuisine code ekleme paketi (oturum 28 cl/ge/at pattern;
 * CUISINE_CODES 40→41).
 *
 * Web research 2 paralel agent + 23+ kaynak (Maple from Canada Quebec
 * resmi + Heritage Revived + Jody Robbins / Tokat Valiligi + Arda'nin
 * Mutfagi + Yemek.com / 196flavors Sweden + Nordic Kitchen Stories +
 * Chunky Chef / Easy Brazilian + Story Cooking + Brazilian Kitchen
 * Abroad + Daring Gourmet / Yemek.com Kayseri + Lezzet Kayseri + ISAM
 * Halk Kulturu / Yemek.com Sembusek + Turkiye Turizm Ansiklopedisi +
 * Hurriyet / Lezzet Sardalya + Gurme Rehberi + Chefoodrevolution).
 *
 * Verdict: 7 REWRITE + 1 cuisine code ekleme (ca Kanada).
 *
 *   1. toronto-akcaagacli-yulaf-bar (CUISINE FIX us→ca + content):
 *      Akcaagac surubu Quebec klasik (Quebec %71 dunya uretimi). DB
 *      cuisine 'us' Kanada Toronto sehri ile celiSiyor. Tarifle'de 1
 *      Kanada tarif var, ca eklenmesi cl/ge/at single-recipe pattern
 *      ile uyumlu. Yumurta + tereyagi baglayicisi + esmer seker +
 *      tuz + vanilya eksik (Maple from Canada resmi tarif uyumlu).
 *
 *   2. tokat-bati (KIBE-MUMBAR REWRITE FULL): Tokat klasik soguk
 *      meze 'cevizli bat' yesil mercimek + bulgur + ceviz + nar
 *      eksisi + taze otlar (Tokat Valiligi resmi + Arda'nin Mutfagi
 *      + Yemek.com 3 kaynak). DB'de YESIL MERCIMEK YOK (KRITIK eksik,
 *      Codex haklı), tarif sadece bulgur+sebze. Title 'Tokat Cevizli
 *      Batı'. 11 ingredient_add (yesil mercimek + biber salcasi +
 *      dereotu + nar eksisi + sumak + nane + pul biber + domates +
 *      sivri biber + tuz + zeytinyagi), 6 step replace.
 *
 *   3. somonlu-arpa-sehriye-tava-isvec-usulu (REWRITE + cuisine
 *      yumusatma): Isvec klasik somon = gravlax + laxpudding (orzo/
 *      sehriye Isvec'te yok). Modern arpa sehriye + somon kombo
 *      Iskandinav esintili olarak yumusatilir. 8 ingredient_add
 *      (tereyagi + sogan + sarimsak + limon kabugu + limon suyu +
 *      tuz + karabiber + et suyu), 5 step replace, cuisine 'se'
 *      KORUNUR.
 *
 *   4. siyah-fasulyeli-balkabagi-corbasi-brezilya-usulu (REWRITE
 *      sofrito + Brezilya kanonu): Feijao com abobora Brezilya
 *      kanonik (Story Cooking + Easy Brazilian Food). DB'de sofrito
 *      (sogan + sarimsak + zeytinyagi) + defne + smoked paprika +
 *      kisnis garnitur eksik. 9 ingredient_add, 1 amount change
 *      (kimyon 0.5→1 ck, su 5→4 sb), 6 step replace, cuisine 'br'
 *      KORUNUR.
 *
 *   5. sucuklu-mercimek-pilavi-kayseri-usulu (REWRITE yore yumusatma
 *      + ingredient/step doldurma): Sucuk Kayseri imaji dogru ama
 *      'sucuklu mercimek pilavi' kombo Kayseri envanterinde kanonik
 *      degil (Yemek.com 17 yemek + Lezzet 12 tarif). Title 'Kayseri
 *      Sucuklu Mercimek Pilavi'. 6 ingredient_add (tereyagi + sivi
 *      yag + salca + nane + karabiber + tuz), 6 step replace.
 *
 *   6. sembusek-tostu-mardin-usulu (KIBE-MUMBAR forma cek): Klasik
 *      Mardin sembusek YARIM AY kapali lahmacun (Yemek.com + Turkiye
 *      Turizm Ansiklopedisi + Hurriyet 3 kaynak). Tost formu kaynaksiz
 *      modern fusion. Title 'Mardin Sembusek (Kapali Lahmacun)'. 6
 *      ingredient_add (maydanoz + biber salcasi + isot + karabiber +
 *      tuz + sivi yag), 1 amount change (su 2→1 sb), 6 step replace.
 *
 *   7. sardalyali-ekmek-salatasi-canakkale-usulu (GIDA GUVENLIGI +
 *      yore yumusatma): KRITIK GIDA GUVENLIGI - cig sardalya parazit/
 *      bakteri riski (sushi-grade olmayan balik cig tuketilemez). DB
 *      tarif sardalya pisirme adimi YOK. Akdeniz panzanella + izgara
 *      sardalya kombo (Lezzet + Gurme Rehberi + Chefoodrevolution).
 *      Canakkale yore iddia kaynaksiz. Title 'Ege Esintili Sardalyali
 *      Ekmek Salatasi'. 5 ingredient_add (limon + tuz + karabiber +
 *      kirmizi sogan + sarimsak; tuz+limon zaten steps'te kullaniliyor
 *      ama ingredient listesinde yok = data inconsistency), 1 amount
 *      change, 5 step replace (sardalya pisirme zorunlu, ic sicaklik
 *      63°C).
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-14.ts
 *   npx tsx scripts/fix-mini-rev-batch-14.ts --env prod --confirm-prod
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
  // ─── 1: toronto-akcaagacli-yulaf-bar (CUISINE FIX us→ca) ────
  {
    type: "rewrite",
    slug: "toronto-akcaagacli-yulaf-bar",
    reason:
      "CUISINE FIX us→ca. Toronto Kanada sehri, akcaagac surubu Quebec klasik (Quebec %71 dunya uretim, Quebec Maple Syrup Producers tescil). DB cuisine 'us' Kanada ile celiSiyor. ca (Kanada) cuisine code eklendi (CUISINE_CODES 40→41, oturum 28 cl/ge/at single-recipe pattern). Plus DB'de yumurta + tereyagi baglayicisi + esmer seker + vanilya + tuz YOK (Maple from Canada resmi tarif uyumlu). 5 ingredient_add, 1 amount change (yulaf 2→2.5 sb).",
    sources: [
      "https://maplefromcanada.ca/recipes/granola-bars/",
      "https://heritagerevived.com/maple-syrup-granola-bars/",
      "https://www.jodyrobbins.com/traditional-canadian-food/",
    ],
    cuisine: "ca",
    description:
      "Kanada'nın akçaağaç hasadı geleneğinden ilham alan bu yulaf bar, Quebec maple syrup'unu yulaf, ceviz ve kuru üzüm ile birleştiren ev tipi bir kahvaltı veya atıştırmalık tatlısıdır. Bağlayıcı olarak yumurta ve eritilmiş tereyağı kullanılır; barlar fırında pişip soğuyunca kesilebilir hale gelir.",
    allergensAdd: [Allergen.YUMURTA, Allergen.SUT],
    ingredientsAdd: [
      { name: "Tereyağı (eritilmiş)", amount: "80", unit: "gr" },
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Esmer şeker", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Yulaf ezmesi", newAmount: "2.5", newUnit: "su bardağı" },
    ],
    tipNote:
      "Maple syrup'u eritilmiş tereyağıyla birleştirmek bağlayıcı kıvamı düzgün dağıtır. Barları fırından çıkardıktan sonra kalıbında 20 dakika tamamen soğutmak temiz kesim sağlar.",
    servingSuggestion:
      "Sabah kahvaltısında yoğurt ve taze meyveyle, atıştırmalık olarak süt veya kahveyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Fırını 180°C'ye ısıtın, dikdörtgen tepsiyi pişirme kağıdıyla kaplayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yulaf, ceviz, kuru üzüm, esmer şeker, tarçın ve tuzu büyük kasede karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Ayrı bir kasede yumurtaları çırpın, eritilmiş tereyağı, akçaağaç şurubu ve vanilyayı ekleyip homojenleştirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Sıvı karışımı kuru karışıma ekleyip spatulayla nemli kıvama gelene kadar harmanlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Karışımı tepsiye yayın, kaşıkla bastırarak yoğun bir tabaka oluşturun.", timerSeconds: null },
      { stepNumber: 6, instruction: "180°C'de 22-25 dakika üstü altın renge dönene kadar pişirin, çıkarıp kalıpta 20 dakika soğutun, ardından bar şeklinde kesin.", timerSeconds: 1500 },
    ],
  },

  // ─── 2: tokat-bati (KIBE-MUMBAR REWRITE FULL) ────────────────
  {
    type: "rewrite",
    slug: "tokat-bati",
    reason:
      "KIBE-MUMBAR pattern. Tokat klasik soguk meze 'cevizli bat' yesil mercimek + ince bulgur + ceviz + nar eksisi + taze otlar + asma yapragi (Tokat Valiligi resmi 'Cevizli Bat' + Arda'nin Mutfagi yoresel detay + Yemek.com 3 kaynak). DB'de YESIL MERCIMEK YOK (KRITIK eksik, Codex haklı: 'Yemek temel malzeme yoksa kullanici Tokat batı yerine farklı bir bulgur salatasi yapar'). Title 'Tokat Cevizli Batı' (slug korunur). 11 ingredient_add, 1 amount change, 6 step replace.",
    sources: [
      "https://www.tokat.gov.tr/yoresel-yemeklerimiz",
      "https://www.ardaninmutfagi.com/yemek-tarifleri/sebze-yemekleri/bat-tokat-yoresi",
      "https://yemek.com/tarif/bat-yemegi/",
    ],
    newTitle: "Tokat Cevizli Batı",
    description:
      "Tokat'ın klasik soğuk salata-meze yemeği bat, haşlanmış yeşil mercimek ve ince bulguru salça, ceviz, taze otlar ve nar ekşisiyle harmanlar. Yörede asma yaprağına sarılarak veya yapraklarla birlikte servis edilir.",
    prepMinutes: 25,
    cookMinutes: 25,
    totalMinutes: 50,
    ingredientsAdd: [
      { name: "Yeşil mercimek", amount: "1", unit: "su bardağı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Dereotu", amount: "0.5", unit: "demet" },
      { name: "Nar ekşisi", amount: "2", unit: "yemek kaşığı" },
      { name: "Sumak", amount: "1", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Domates (ince küp)", amount: "1", unit: "adet" },
      { name: "Sivri biber", amount: "2", unit: "adet" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Maydanoz", newAmount: "1", newUnit: "demet" },
    ],
    tipNote:
      "Yeşil mercimeği fazla pişirmeyin, hafif diri kalsın; aksi halde bat dağılır. Bulguru sıcak mercimek suyuyla şişirmek kıvamı yakalar.",
    servingSuggestion:
      "Haşlanmış asma yaprağıyla birlikte serin servis edin; isterseniz yaprağa sarın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yeşil mercimeği yıkayıp 25 dakika tuzlu suda haşlayın, hafif diri kalsın, suyunu süzün.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "İnce bulguru sıcak mercimekli suyla 1 su bardağı suya yedirip kapağını kapatıp 10 dakika dinlendirin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Soğan, biber, domates, taze soğanı çok ince doğrayın; maydanoz, dereotu, kuru naneyi ince kıyın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş kapta domates ve biber salçasını zeytinyağında parmakla ezin, nar ekşisi, limon suyu, sumak, pul biber, tuzu katın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Bulgurlu mercimeği, doğranmış sebzeleri, taze otları ve dövülmüş cevizi sosa ekleyip parçaları dağıtmadan çatalla harmanlayın, 30 dakika buzdolabında dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 6, instruction: "Haşlanmış asma yaprağıyla birlikte serin servis edin; isterseniz yaprağa sarın.", timerSeconds: null },
    ],
  },

  // ─── 3: somonlu-arpa-sehriye-tava-isvec (REWRITE yumusatma) ──
  {
    type: "rewrite",
    slug: "somonlu-arpa-sehriye-tava-isvec-usulu",
    reason:
      "REWRITE + cuisine 'se' yumusatma description'da. Isvec klasik somon = gravlax + laxpudding (orzo/sehriye Isvec'te yok; 196flavors + Nordic Kitchen Stories 2 kaynak). Modern arpa sehriye + somon kombo Iskandinav esintili olarak konumlandirilir. DB'de tuz, yag, sogan, sarimsak, limon HEPSI yok + steps tamamen scaffold. Cuisine 'se' KORUNUR (somon-dereotu Iskandinav cekirdek motif). Title 'Dereotlu Somonlu Arpa Sehriye Tava (Iskandinav Esintili)'. 8 ingredient_add, 5 step replace.",
    sources: [
      "https://www.196flavors.com/sweden-salmon-gravlax/",
      "https://www.nordickitchenstories.co.uk/2021/01/07/speedy-laxpudding-swedish-salmon-pudding-recipe/",
      "https://www.thechunkychef.com/seared-salmon-and-creamy-orzo-pasta/",
    ],
    newTitle: "Dereotlu Somonlu Arpa Şehriye Tava (İskandinav Esintili)",
    description:
      "Bu pratik tek tava yemeği, İskandinav mutfağının somon-dereotu uyumundan ilham alır. Klasik İsveç laxpudding'i patates ve ekmek kırıntısıyla yapılır; bu modern uyarlama arpa şehriyeyi taban alır, somonu son aşamada ekleyerek dağılmasını önler. İsveç yöre kanonu değil, çağdaş bir İskandinav esintili sunum.",
    ingredientsAdd: [
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Limon kabuğu rendesi", amount: "1", unit: "adet" },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tavuk veya sebze suyu", amount: "2", unit: "su bardağı" },
    ],
    ingredientsAmountChange: [
      { name: "Dereotu", newAmount: "0.5", newUnit: "demet" },
      { name: "Su", newAmount: "1", newUnit: "su bardağı" },
    ],
    tipNote:
      "Somonu son 7 dakikada şehriyenin üstüne yerleştirip buharla pişirmek dağılmasını önler. Limon kabuğu et suyuna eklenirse aroma daha derin olur.",
    servingSuggestion:
      "Üstüne taze dereotu ve limon dilimleri ile sıcak servis edin, yanına basit yeşil salata.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Somonu kemikten arınmış 3-4 cm parçalara bölüp tuz ve karabiberle baharatlayın, 10 dakika bekletin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Geniş tavada tereyağını eritip soğanı 4 dakika pembeleşene, sarımsağı 30 saniye kavurun.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Arpa şehriyeyi ekleyip 2 dakika çevirip kavurun.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Et suyunu, suyu ve limon kabuğunu ilave edip kaynamaya bırakın, kapağı kapayıp kısık ateşte 10 dakika pişirin.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Somon parçalarını şehriyenin üstüne nazikçe yerleştirin, kapağı kapatıp 7 dakika daha buharlayın; ateşten alıp dereotu ve limon suyunu ekleyip 2 dakika dinlendirin, hemen servis edin.", timerSeconds: 540 },
    ],
  },

  // ─── 4: siyah-fasulyeli-balkabagi-corbasi-brezilya (sofrito) ──
  {
    type: "rewrite",
    slug: "siyah-fasulyeli-balkabagi-corbasi-brezilya-usulu",
    reason:
      "REWRITE + cuisine 'br' KORUNUR. Feijao com abobora Brezilya kanonik bir varyant (Story Cooking + Easy Brazilian Food 2 kaynak; Brezilya gundelik fasulye sofrasi). Codex 'balkabagi kanonik degil' itirazi tam dogru degil. DB'de sofrito (sogan + sarimsak + zeytinyagi) + defne + smoked paprika (Brezilya kanonik tutsu notasi) + kisnis garnitur eksik. 9 ingredient_add, 2 amount change, 6 step replace.",
    sources: [
      "https://easybrazilianfood.com/feijao-brazilian-beans-creamy/",
      "https://storycooking.com/2012/01/19/brazilian-beans/",
      "https://braziliankitchenabroad.com/creamy-black-bean-soup/",
    ],
    description:
      "Brezilya'nın gündelik fasulye sofrasından (feijão com abóbora) esinlenen bu çorba, siyah fasulyeyi balkabağıyla birleştirir. Soğan-sarımsak-kimyon sofritosu ve defne yaprağıyla derinlik kazanır, taze kişniş ve limon damlasıyla bitirilir.",
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak (ezilmiş)", amount: "3", unit: "diş" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Defne yaprağı", amount: "2", unit: "adet" },
      { name: "Tane kimyon (kavurma için)", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tütsülü tatlı paprika", amount: "0.5", unit: "çay kaşığı" },
      { name: "Taze kişniş (servis)", amount: "0.25", unit: "demet" },
    ],
    ingredientsAmountChange: [
      { name: "Kimyon", newAmount: "1", newUnit: "çay kaşığı" },
      { name: "Su", newAmount: "4", newUnit: "su bardağı" },
    ],
    tipNote:
      "Smoked paprika (tütsülü paprika) Brezilya'nın hafif tütsü notası; standart paprika atlamayın. Bir kepçe ezilen karışım çorbaya kremamsı doku kazandırır.",
    servingSuggestion:
      "Kasede taze kişniş ve lime dilimiyle sıcak servis edin; yanında pirinç-fasulye veya farofa.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş tencerede zeytinyağını ısıtıp soğanı 5 dakika hafif kızarana kadar kavurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Sarımsak, kimyon, paprika ve defne yaprağını ekleyip 1 dakika daha çevirin, baharatlar tava kokusu salsın.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Küçük küp doğranmış balkabağını ekleyip 3 dakika sotelendirin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Suyu (veya sebze suyunu) ilave edip kaynayınca kısık ateşe alın, 15 dakika balkabağı yumuşayana kadar pişirin.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Haşlanmış siyah fasulyeyi suyuyla birlikte ekleyip 10 dakika daha kaynatın; tuz ve karabiberi şimdi katın. Bir kepçe karışımı blender ya da el blenderiyle ezip tencereye geri katın, kıvam yarı kremamsı yarı parçalı kalsın.", timerSeconds: 600 },
      { stepNumber: 6, instruction: "Defneyi çıkarıp kaseye alın, taze kişnişle süsleyip lime dilimiyle servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: sucuklu-mercimek-pilavi-kayseri (yore yumusatma) ────
  {
    type: "rewrite",
    slug: "sucuklu-mercimek-pilavi-kayseri-usulu",
    reason:
      "REWRITE yore yumusatma + ingredient/step doldurma. Sucuk Kayseri imaji dogru (ceviz sucugu CI tescilli) ama 'sucuklu mercimek pilavi' kombo Kayseri envanterinde kanonik degil (Yemek.com 17 yemek listesinde YOK + Lezzet 12 tarif + ISAM Halk Kulturu). Klasik mercimekli pilav genel Türk; 'Kayseri' vurgusu sucuk imajina yaslaniyor. Title 'Kayseri Sucuklu Mercimek Pilavi' (yore vurgusu sucuga kaydirilir, slug korunur). DB'de tereyagi + sivi yag + salca + kuru nane + karabiber + tuz YOK. 6 ingredient_add, 1 amount change, 6 step replace.",
    sources: [
      "https://yemek.com/kayseri-yemekleri/",
      "https://www.lezzet.com.tr/lezzetten-haberler/kayserinin-yoresel-yemekleri",
    ],
    newTitle: "Kayseri Sucuklu Mercimek Pilavı",
    description:
      "Klasik mercimekli pilavın Kayseri esintili sucuklu uyarlaması. Yeşil mercimek pirinçle birlikte pişirilir, kavrulan Kayseri sucuğunun yağı ve tereyağıyla harmanlanır; üstüne kuru nane serpilir.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Sıvı yağ", amount: "1", unit: "yemek kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Pirinç", newAmount: "1.5", newUnit: "su bardağı" },
    ],
    tipNote:
      "Sucuğun yağı dökülmesin, pilava tat verir; sucukları çıkardıktan sonra aynı yağda soğanı ve pirinci kavurun. Yeşil mercimeği fazla pişirmeyin, taneleri kalsın.",
    servingSuggestion:
      "Üzerine kuru nane serpip cacık veya yoğurt ile sıcak servis edin; turşu yanına yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yeşil mercimeği yıkayın, bol suda 15-20 dakika diri kalacak şekilde haşlayın, süzün. Pirinci tuzlu ılık suda 10 dakika bekletip durulayın.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Sucukları yarım ay dilimleyin. Tencerede sıvı yağı ısıtın, sucukları orta ateşte 3-4 dakika çevirip yağını çıkartın, kevgirle alıp kenara koyun.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Aynı yağa ince doğranmış soğanı ekleyin, 4 dakika pembeleşene kadar kavurun. Salçayı ilave edip 1 dakika daha karıştırın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Süzülmüş pirinci ekleyip taneler şeffaflaşana dek 2 dakika kavurun, ardından haşlanmış mercimeği, sucukları, tuzu ve karabiberi ilave edin.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "3 su bardağı sıcak suyu dökün, kaynamaya başlayınca kapağı kapatıp kısık ateşte 15 dakika suyunu çekene kadar pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alın, tereyağını üste ekleyip kuru naneyi serpin, kapağı kapalı 10 dakika demlendirip karıştırarak servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 6: sembusek-tostu-mardin (KIBE-MUMBAR forma cek) ───────
  {
    type: "rewrite",
    slug: "sembusek-tostu-mardin-usulu",
    reason:
      "KIBE-MUMBAR pattern. 'Sembusek tostu' formu kaynaklarda dogrulanamadi; klasik Mardin sembusek YARIM AY kapali lahmacun (Yemek.com + Türkiye Turizm Ansiklopedisi + Hurriyet 3 kaynak). Tost formu modern fusion. Title 'Mardin Sembusek (Kapali Lahmacun)' (slug korunur). DB'de tuz, karabiber, maydanoz, biber salcasi, isot, yag eksik; steps 'tostu kapali yuzu' jenerik. 6 ingredient_add, 1 amount change, 6 step replace.",
    sources: [
      "https://yemek.com/tarif/sembusek/",
      "https://turkiyeturizmansiklopedisi.com/mardin-sembusek",
      "https://www.hurriyet.com.tr/lezizz/sembusek-tarifi-41353263",
    ],
    newTitle: "Mardin Sembusek (Kapalı Lahmacun)",
    description:
      "Mardin mutfağının kapalı lahmacunu sembusek, ince açılan hamurun yarısına çiğ kıymalı baharatlı harç konup yarım ay biçiminde kapatılarak sac veya fırında pişirilen geleneksel hamur işidir. Arap ve Süryani mutfağı izleri taşır; isot ve maydanoz Mardin yorumunun ayırt edici aromalarıdır.",
    prepMinutes: 30,
    cookMinutes: 20,
    totalMinutes: 50,
    ingredientsAdd: [
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "İsot (Urfa biberi)", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Sıvı yağ (hamur için)", amount: "2", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Su", newAmount: "1", newUnit: "su bardağı" },
    ],
    tipNote:
      "İç harç çiğ kapatılır, fırında veya sacda pişerken kıyma kendi suyunu salar; soğanı önce sıkıp suyunu almak hamuru kuru tutar. İsot atlanmaz, Mardin aromasının taşıyıcısıdır.",
    servingSuggestion:
      "Sıcak servis edin, yanına ayran veya çay; üzerine taze maydanoz ve limon dilimi yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Hamur için unu, 1 yemek kaşığı sıvı yağı, yarım çay kaşığı tuzu ve ılık suyu yoğurun; kulak memesi yumuşaklığında pürüzsüz hamur olsun. Üzerini örtüp 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "İç harç için kıymayı, çok ince doğranmış soğanı (suyu sıkılmış), maydanozu, biber salçasını, isotu, karabiberi, kimyonu ve tuzu geniş bir kapta 3 dakika yoğurun.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Hamuru ceviz büyüklüğünde 8 beze ayırın, oklava ile her bezeyi 12-14 cm çapında ince yuvarlak yufka açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Her yufkanın yarısına ince tabaka halinde kıymalı harcı yayın, kenarda 1 cm boş bırakın; diğer yarıyı üstüne kapatıp kenarları parmakla iyice bastırarak yarım ay şekli verin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sac veya geniş tavayı kısık-orta ateşte ısıtın, yağsız tavaya sembusekleri dizin; her yüzünü 3-4 dakika beneklenip pişene kadar çevirerek pişirin. Alternatif: 200°C ısıtılmış fırında 18-20 dakika.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Pişen sembusekleri tabağa alın, üstüne taze maydanoz serpip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: sardalyali-ekmek-salatasi-canakkale (GIDA GUVENLIGI) ─
  {
    type: "rewrite",
    slug: "sardalyali-ekmek-salatasi-canakkale-usulu",
    reason:
      "GIDA GUVENLIGI KRITIK + yore yumusatma + ingredient tutarsizligi fix. DB tarifte sardalya fileto pisirilmeden salataya katiliyor; cig sardalya parazit/bakteri riski (sushi-grade olmayan balik cig tuketilemez). Canakkale yore iddia kanonik tarif olarak kanitlanamadi. Klasik form: Akdeniz panzanella + izgara sardalya kombosu (Lezzet + Gurme Rehberi + Chefoodrevolution 3 kaynak). Title 'Ege Esintili Sardalyali Ekmek Salatasi'. DB'de tuz ve limon EKSIK (steps 3'te kullaniliyor ama listede yok = data inconsistency). 5 ingredient_add, 1 amount change, 5 step replace, sardalya pisirme adimi eklenir (ic sicaklik 63°C).",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/et-yemekleri/balik-yemekleri/kizarmis-ekmek-diliminde-sardalya",
      "https://www.gurmerehberi.com/tarifler/yemek-tarifleri/ana-yemek-tarifleri/balik-ve-deniz-urunleri/firin-ve-izgaralar/izgara-sardalya/",
      "https://chefoodrevolution.com/en/bread-salad/",
    ],
    newTitle: "Ege Esintili Sardalyalı Ekmek Salatası",
    description:
      "İtalyan panzanella'sından esinlenen Ege uyarlaması: tavada veya ızgarada pişirilmiş sardalya, bayat ekmeğin kızarmış küpleri, domates, kırmızı soğan ve maydanozla zeytinyağı-limon sosunda buluşur.",
    prepMinutes: 12,
    cookMinutes: 8,
    totalMinutes: 20,
    ingredientsAdd: [
      { name: "Limon (suyu için)", amount: "1", unit: "adet" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Kırmızı soğan", amount: "0.5", unit: "adet" },
      { name: "Sarımsak", amount: "1", unit: "diş" },
    ],
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "3", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Sardalyayı çiğ kullanmayın; sushi-grade olmayan balık parazit ve bakteri riski taşır, mutlaka 6-8 dakika tava veya ızgarada pişirin (iç sıcaklık 63°C'yi geçmeli). Ekmeği salataya son anda katmak dışını çıtır içini sulu tutar.",
    servingSuggestion:
      "Limon dilimleriyle ılık servis edin; yanına soğuk beyaz şarap veya ayran yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sardalya filetolarını soğuk suyla durulayıp kağıt havluyla kurulayın, hafif tuzlayıp 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Tavada 1 yemek kaşığı zeytinyağını ısıtın, ezilmiş sarımsağı 30 saniye kavurun. Sardalyaları derili tarafı altta olacak şekilde dizin, orta ateşte 3 dakika pişirin, çevirip 2-3 dakika daha pişirin; iç sıcaklık 63°C'yi geçmeli, et matlaşıp pul pul ayrılmalı. Tavadan alın.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Bayat ekmek dilimlerini kuş başı küp doğrayın, tavada 1 yemek kaşığı zeytinyağıyla orta ateşte 4 dakika her tarafı çıtırlaşana kadar kızartın, kenara alın.", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Domatesleri iri küp, kırmızı soğanı yarım ay ince dilimleyin. Geniş kasede 1 yemek kaşığı zeytinyağı, limon suyu, tuz ve karabiberi çırpıp dressing hazırlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Domates, soğan ve maydanozu dressing ile harmanlayın. Servis tabağına alın, üstüne kızarmış ekmek küplerini ve pişmiş sardalyaları yerleştirin, hemen sofraya çıkarın.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-14");
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
              paket: "oturum-28-mini-rev-batch-14",
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
