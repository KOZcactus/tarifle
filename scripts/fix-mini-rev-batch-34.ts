/**
 * Tek-seferlik manuel mini-rev batch 34 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-33 ile
 * aynı audit, paketi 33 sonrası 16 kalan kuyruğun yeni top 1-7).
 * Klasik kanonik kanitli tarifler; jenerik step boilerplate temizle +
 * eksik klasik baharat/aromatik tamamla + 1 DATA ANOMALI fix
 * (Su | 0 su bardağı) + 2 SLUG LEAK fix.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tereyagli-tavuklu-pilav-ardahan-usulu (Ardahan klasik): tavuk
 *      but + pirinç + tereyağı + su + tuz VAR. DB'de soğan + sarımsak
 *      + karabiber + maydanoz garnitür EKSİK. 7 step. Step 6+7 jenerik
 *      scaffold. 4 ingredient_add, 7 step replace.
 *
 *   2. zahterli-yumurta-ekmegi-hatay-usulu (Hatay): bayat ekmek +
 *      yumurta + zahter + zeytinyağı + domates VAR. DB'de tuz +
 *      karabiber + sumak (Hatay imzası) EKSİK. Step 1+2+6 BOILERPLATE
 *      LEAK FIX + step 4 SLUG LEAK FIX 'zahterli-yumurta-ekmegi-hatay-
 *      usulu akışı için' (slug DB'ye yazılmış cümle, kötü!). 3
 *      ingredient_add, 6 step replace.
 *
 *   3. tereyagli-bulgurlu-kaz-sote-ardahan-usulu (Ardahan): pişmiş
 *      kaz + bulgur + tereyağı + kaz suyu + tuz VAR. DB'de DATA
 *      ANOMALİ 'Su | 0 su bardağı' REMOVE (anlamsız 0 amount). DB'de
 *      soğan + karabiber + maydanoz EKSİK. 7 step. Step 6+7 jenerik
 *      scaffold. 1 ingredient_remove + 3 ingredient_add, 7 step replace.
 *
 *   4. tereyagli-etli-bulgur-pilavi-ardahan-usulu (Ardahan): bulgur +
 *      dana eti + tereyağı + su + tuz + karabiber VAR. DB'de soğan +
 *      sarımsak + maydanoz EKSİK. 7 step. Step 6+7 jenerik scaffold.
 *      3 ingredient_add, 7 step replace.
 *
 *   5. syrniki-yaban-mersin-soslu-rus-usulu (Rus klasik): lor +
 *      yumurta + un + yaban mersini + toz şeker + sıvı yağ VAR. DB'de
 *      tuz tutamı + vanilya + ekşi krema (Rus klasik servis) EKSİK.
 *      Step 1 BOILERPLATE LEAK + step 2 jenerik + step 6 BOILERPLATE
 *      LEAK 'soğursa gevrek kenarlar yumuşar' (syrniki yumuşak peynirli
 *      disk!). 3 ingredient_add, 6 step replace.
 *
 *   6. tahinli-incirli-krep-denizli-usulu (Denizli): un + yumurta +
 *      su + tahin + kuru incir VAR. DB'de süt (klasik krep!) + tuz +
 *      tereyağı + pekmez (tahin denge) EKSİK. Step 1+2+6 BOILERPLATE
 *      LEAK FIX + step 4 SLUG LEAK FIX 'tahinli-incirli-krep-denizli-
 *      usulu akışı için' (slug DB'ye yazılmış!). 4 ingredient_add, 6
 *      step replace.
 *
 *   7. tahinli-muzlu-gozleme-alanya-usulu (Alanya): yufka + tahin +
 *      muz + zeytinyağı VAR. DB'de pekmez (tahin denge) + tarçın +
 *      ceviz EKSİK. Step 1+2 BOILERPLATE LEAK. 3 ingredient_add, 6
 *      step replace.
 *
 * Toplam: 23 ingredient_add + 1 ingredient_remove + 45 step replace
 * + 8 BOILERPLATE LEAK FIX + 2 SLUG LEAK FIX (#2, #6) + 1 DATA ANOMALI
 * FIX (#3 Su 0 amount).
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
  // ─── 1: tereyagli-tavuklu-pilav-ardahan-usulu (Ardahan) ───────────
  {
    type: "rewrite",
    slug: "tereyagli-tavuklu-pilav-ardahan-usulu",
    reason:
      "REWRITE jenerik scaffold + Ardahan tereyağlı tavuklu pilav tamamlama. Klasik formul: tavuk but + pirinç + tereyağı + su + tuz VAR. DB'de soğan + sarımsak + karabiber + maydanoz garnitür EKSİK. 7 step. Step 6+7 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/ardahan/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/tavuk-tarifleri/tavuklu-pilav",
    ],
    description:
      "Ardahan usulü tereyağlı tavuklu pilav; tavuk but parçalarının tereyağında soğan ve sarımsakla mühürlenip pirincin tavuk suyu çekmesiyle oturan, sade ama doyurucu bir Doğu Anadolu tek tencere yemeğidir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Pirinci 30 dakika ılık tuzlu suda bekletip yıkayın; nişasta gider, taneler ayrı durur. Tavuk butlarını derili-kemikli kullanın; pilavın aroması derinleşir.",
    servingSuggestion:
      "Servis tabağına alıp üzerine ince doğranmış maydanoz serpin; yanında cacık veya çoban salatasıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin, maydanozu ince kıyın; pirinci yıkayıp süzün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağının yarısını orta ateşte eritip soğanı 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin, tavuk but parçalarını ekleyip 6 dakika her yüzünü mühürleyin.", timerSeconds: 630 },
      { stepNumber: 3, instruction: "Süzülmüş pirinci tencereye katıp 2 dakika tavukla çevirin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "3 su bardağı sıcak suyu, tuzu ve karabiberi ekleyip kapağı kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Pilavı kısık ateşte 14 dakika suyunu çekene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 6, instruction: "Kalan tereyağını ekleyip kapağı bezle kapatarak 5 dakika demlendirin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Servis tabağına paylaştırıp üstüne maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: zahterli-yumurta-ekmegi-hatay-usulu (Hatay, SLUG LEAK) ────
  {
    type: "rewrite",
    slug: "zahterli-yumurta-ekmegi-hatay-usulu",
    reason:
      "REWRITE jenerik scaffold + SLUG LEAK FIX + Hatay zahterli yumurta ekmeği tamamlama. Klasik Hatay tabağı: bayat ekmek + yumurta + zahter + zeytinyağı + domates VAR. DB'de tuz + karabiber + sumak (Hatay imzası, zahter destek) EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' + step 2 BOILERPLATE LEAK jenerik 'tava 2 dk' + step 4 SLUG LEAK 'zahterli-yumurta-ekmegi-hatay-usulu akışı için' (slug DB'ye yazılmış cümle!) + step 6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/zahterli-yumurta",
    ],
    description:
      "Hatay sofralarının zahterli yumurta ekmeği; bayat dilimlerin zahter, sumak ve yumurta karışımına emdirilip zeytinyağında kızartıldığı, dilim domateslerle servis edilen kokulu ve doyurucu bir Antakya kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Zahteri yumurtalı karışıma katmadan önce zeytinyağıyla 2-3 dakika ovuşturun; baharatın aroması açılır. Domatesleri pişirmeyin; soğuk dilimler sıcak ekmeği dengeleyen tatlı tuzlu kontrast verir.",
    servingSuggestion:
      "Sıcak dilimleri tabağa alıp üstüne ekstra sumak serpin; yanına dilim domates, taze maydanoz ve demli çayla Hatay kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurtaları derin kâseye kırıp zahter, sumak, tuz ve karabiberi ekleyin; çırpıcıyla 1 dakika çırpın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmek dilimlerini karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp ekmek dilimlerini yatırın; 3 dakika ilk yüzü altın renge gelene kadar pişirin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Ekmekleri çevirip diğer yüzünü 3 dakika daha kızartın; kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Domatesi 1 cm halkalar halinde dilimleyip dilimlerin yanına yerleştirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak dilimleri tabağa alıp üstüne ekstra sumak serperek servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tereyagli-bulgurlu-kaz-sote-ardahan-usulu (DATA ANOMALI) ──
  {
    type: "rewrite",
    slug: "tereyagli-bulgurlu-kaz-sote-ardahan-usulu",
    reason:
      "REWRITE jenerik scaffold + DATA ANOMALİ FIX + Ardahan kaz sote tamamlama. Klasik formul: pişmiş kaz + bulgur + tereyağı + kaz suyu + tuz VAR. DB'de DATA ANOMALİ 'Su | 0 su bardağı' (anlamsız 0 amount, kaz suyu zaten ayrı) REMOVE. DB'de soğan + karabiber + maydanoz garnitür EKSİK. 7 step. Step 6+7 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 1 ingredient_remove + 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/ardahan/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kaz-sote",
    ],
    description:
      "Ardahan usulü tereyağlı bulgurlu kaz sote; geleneksel olarak kavrulmuş veya haşlanmış kaz etinin pilavlık bulgur ve kaz suyuyla buluşturulduğu, tereyağı ve maydanozla taçlanan kışlık ana yemektir.",
    ingredientsRemove: ["Su"],
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Pişmiş kaz etini didiklerken iri parçalar bırakın; spatulayla bulgura katarken et yapısı dağılmaz. Kaz suyu yoksa tavuk suyu kullanılabilir; tuzu mutlaka azaltın, kaz suyu doğal olarak tuzludur.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üzerine ince doğranmış maydanoz serpin; yanına soğuk yoğurt veya turşuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, maydanozu ince kıyın; bulguru ayıklayıp süzgeçten geçirin, pişmiş kaz etini iri didikleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağının yarısını orta ateşte eritip soğanı 4 dakika pembeleştirin; bulguru ekleyip 2 dakika çevirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Kaz suyunu, tuzu ve karabiberi ekleyip kapağı kapalı kısık ateşte 14 dakika bulgur diri tane verene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 4, instruction: "Ayrı tavada kalan tereyağını eritip kaz etini 5 dakika ısıtın; spatulayla parçaları korumaya çalışın.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Pişen bulgurun üzerine kaz parçalarını yatırıp tencereyi kapalı 8 dakika demlendirin.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Pilavı ezmeden hafifçe karıştırın, kaz parçaları üstte kalsın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Servis tabağına paylaştırıp maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: tereyagli-etli-bulgur-pilavi-ardahan-usulu (Ardahan) ──────
  {
    type: "rewrite",
    slug: "tereyagli-etli-bulgur-pilavi-ardahan-usulu",
    reason:
      "REWRITE jenerik scaffold + Ardahan tereyağlı etli bulgur pilavı tamamlama. Klasik formul: bulgur + dana eti + tereyağı + su + tuz + karabiber VAR. DB'de soğan + sarımsak + maydanoz EKSİK. 7 step. Step 6+7 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/ardahan/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-tarifleri/etli-bulgur-pilavi",
    ],
    description:
      "Ardahan usulü tereyağlı etli bulgur pilavı; kuşbaşı dana etinin tereyağında soğan ve sarımsakla mühürlenip pilavlık bulgurla aynı tencerede çekilen, kış sofralarına imza atan tek kap yemeğidir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Etin yumuşaması için 1 su bardağı sıcak suyla 25 dakika kapağı kapalı pişirme şart; aksi halde bulgurla pişme süresi tutmaz. Bulguru yıkamayın; nişasta tabağı bağlar.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üzerine ince doğranmış maydanoz serpin; yanına soğuk yoğurt veya cacıkla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin, maydanozu ince kıyın; eti kuşbaşı kontrol edip büyük parçaları küçültün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağının yarısını orta ateşte eritip eti 6 dakika her yüzünü mühürleyin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Soğanı ekleyip 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin, 1 su bardağı sıcak su ekleyip kapakla kısık ateşte 25 dakika eti yumuşatın.", timerSeconds: 1770 },
      { stepNumber: 4, instruction: "Pilavlık bulgur, kalan 1.5 su bardağı sıcak su, tuz ve karabiberi tencereye katın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapakla kısık ateşte 14 dakika bulgur suyunu çekene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 6, instruction: "Ocaktan alıp kalan tereyağını ekleyin; kapağı bezle kapatarak 5 dakika demlendirin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Pilavı hafifçe karıştırıp servis tabağına alın; üstüne maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: syrniki-yaban-mersin-soslu-rus-usulu (Rus klasik) ─────────
  {
    type: "rewrite",
    slug: "syrniki-yaban-mersin-soslu-rus-usulu",
    reason:
      "REWRITE jenerik scaffold + Rus syrniki yaban mersinli klasik. Klasik Rus tabağı: lor + yumurta + un + yaban mersini + toz şeker + sıvı yağ VAR. DB'de tuz tutamı + vanilya + ekşi krema (Rus klasik servis imzası, smetana) EKSİK. Step 1 BOILERPLATE LEAK 'akışında kullanılacak tava' + step 2 BOILERPLATE LEAK jenerik + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (syrniki yumuşak peynirli disk!). Title KORUNUR. cuisine 'ru' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Syrniki",
      "https://www.bbcgoodfood.com/recipes/russian-cottage-cheese-pancakes-syrniki",
    ],
    description:
      "Yaban mersin soslu syrniki; Rus mutfağının lor (tvorog) hamurundan yapılan küçük peynirli disklerinin tereyağında kızartılıp yaban mersini sosu ve smetana (ekşi krema) ile servis edilen klasik kahvaltı tatlısıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Ekşi krema", amount: "4", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Lor peynirinin nemini iki kat tülbentle 10 dakika süzdürün; aksi halde diskler dağılır. Yaban mersini sosunu hazırlarken 1-2 dakika kaynatmak yeter; meyveler bütünlüğünü korusun.",
    servingSuggestion:
      "Sıcak diskleri tabağa alıp üzerlerine yaban mersini sosu gezdirin; yanına bir kaşık ekşi krema veya smetana yatırıp pudra şekeriyle taçlandırın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini iki kat tülbentle 10 dakika süzdürüp pürüzsüzleştirmek için çatalla ezin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Süzülen lora yumurtayı, toz şekeri, tuzu ve vanilyayı ekleyip karıştırın; un ekleyerek ele yapışmayan yumuşak hamur elde edin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Avucunuzu unlayıp hamuru 8 küçük disk halinde şekillendirin; her birini 1.5 cm kalınlıkta tutun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada sıvı yağı orta-kısık ateşte ısıtıp diskleri 4 dakika ilk yüzü altın renge gelene kadar pişirin; çevirip diğer yüzünü 4 dakika daha kızartın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Yaban mersinini 1 yemek kaşığı toz şeker ve 2 yemek kaşığı suyla küçük tencerede 2 dakika kaynatıp meyve sosunu hazırlayın.", timerSeconds: 120 },
      { stepNumber: 6, instruction: "Diskleri tabağa alıp üstlerine yaban mersini sosunu gezdirin; yanına ekşi krema yatırarak sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tahinli-incirli-krep-denizli-usulu (Denizli, SLUG LEAK) ───
  {
    type: "rewrite",
    slug: "tahinli-incirli-krep-denizli-usulu",
    reason:
      "REWRITE jenerik scaffold + SLUG LEAK FIX + Denizli tahinli incirli krep tamamlama. Klasik krep: un + yumurta + su + tahin + kuru incir VAR. DB'de süt (klasik krep hamur essential!) + tuz tutamı + tereyağı (yağlama) + pekmez (tahin denge) EKSİK. Step 1 BOILERPLATE LEAK 'akışında kullanılacak tava' + step 2 BOILERPLATE LEAK + step 4 SLUG LEAK 'tahinli-incirli-krep-denizli-usulu akışı için' (slug DB'ye yazılmış!) + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar' (krepte değil!). Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/denizli/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tahinli-incirli-krep",
    ],
    description:
      "Denizli usulü tahinli incirli krep; ince hamurun süt ve yumurtayla pürüzsüzleştirilip tavada açılması, tahin ve doğranmış kuru incirle doldurulması, üzerine pekmez gezdirilerek sabaha meyvemsi ve susam kokulu bir tabak hazırlanmasıdır.",
    ingredientsAdd: [
      { name: "Süt", amount: "0.5", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Pekmez", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Krep hamurunu çırptıktan sonra 10 dakika dinlendirin; gluten gevşer, kepek tutmaz. Tahini incir doldurmadan ekmeyin; lezzet dinerek dengeye gelir.",
    servingSuggestion:
      "Sıcak krepleri ortadan dilimleyip tabağa alın; üstüne pekmez gezdirip ince doğranmış incir veya ceviz serperek servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, yumurta, su, süt ve tuzu derin kâsede çırpıp pürüzsüz hamur elde edin; üzerini örtüp 10 dakika dinlendirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Kuru incirleri ince doğrayın; tahini ayrı kâseye alıp 1 yemek kaşığı pekmezle pürüzsüzleştirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta ateşte ısıtıp tereyağıyla yağlayın; her krep için 1 küçük kepçe hamur dökün, tavayı eğerek ince yayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Krepin üst yüzü mat olunca (yaklaşık 1 dakika) çevirip diğer yüzünü 30 saniye pişirin; tabağa alın ve diğer kreplerle aynı şekilde devam edin.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "Her krepin yarısına tahini sürüp doğranmış incirleri yerleştirin; üzerine kalan pekmezi gezdirip yarım katlayın, tekrar dörde katlayarak üçgen forma getirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Üçgen kreplerin üstüne ekstra pekmez damlatıp sıcak servis edin; istenirse pudra şekeri veya ceviz serpin.", timerSeconds: null },
    ],
  },

  // ─── 7: tahinli-muzlu-gozleme-alanya-usulu (Alanya) ───────────────
  {
    type: "rewrite",
    slug: "tahinli-muzlu-gozleme-alanya-usulu",
    reason:
      "REWRITE jenerik scaffold + Alanya tahinli muzlu gözleme tamamlama. Klasik tatlı gözleme: yufka + tahin + muz + zeytinyağı VAR. DB'de pekmez (tahin denge!) + tarçın + ceviz EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (yufka gözlemesinde absürt) + step 2 BOILERPLATE LEAK jenerik. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/antalya/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tahinli-gozleme",
    ],
    description:
      "Alanya usulü tahinli muzlu gözleme; ince yufkaya tahin ve doğranmış muz yerleştirilip tarçın ve ceviz serpilerek katlanan, tavada hafifçe ısıtılan ve pekmez gezdirilerek servis edilen sahil kahvaltı tatlısıdır.",
    ingredientsAdd: [
      { name: "Pekmez", amount: "2", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Ceviz", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Muz olgun olsun; ham muz tahinin susam aromasını dengeleyemez. Tavayı çok ısıtmayın; yufka çabuk yanar, muz tam ısınmadan kabuk tutar.",
    servingSuggestion:
      "Üçgen dilimleyip tabağa alın; üstüne ekstra pekmez ve dövülmüş ceviz serpin, yanına demli çay veya soğuk süt iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Muzları halkalar halinde dilimleyin; cevizleri kabaca dövün; tahini ayrı kâseye alın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yufkaları tezgâha açın; her yufkanın bir yarısına tahin sürüp muz dilimleri ve dövülmüş cevizi eşit yayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Üzerlerine tarçın ve 1 yemek kaşığı pekmez gezdirin; yufkaların boş yarısını üstüne kapatarak gözleme formunu oluşturun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp gözlemeleri zeytinyağıyla yağlanmış yüzeye yatırın; 3 dakika ilk yüzünü altın renge gelene kadar pişirin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Çevirip diğer yüzünü 3 dakika daha kızartın; muz ısınsın ama yufka yanmasın.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Üçgen dilimleyip tabağa alın; üstüne kalan pekmezi gezdirip ekstra ceviz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-34");
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
              paket: "oturum-31-mini-rev-batch-34",
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
