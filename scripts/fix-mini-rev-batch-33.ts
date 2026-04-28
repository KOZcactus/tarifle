/**
 * Tek-seferlik manuel mini-rev batch 33 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-32 ile
 * aynı audit, paketi 32 sonrası 23 kalan kuyruğun yeni top 1-7).
 * Klasik kanonik kanitli tarifler; jenerik step boilerplate temizle +
 * eksik klasik baharat/aromatik tamamla.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. yumurtali-ekmek (klasik French toast tipi): bayat ekmek +
 *      yumurta + süt + tuz + sıvı yağ VAR. DB'de tereyağı + toz şeker
 *      + tarçın (tatlı varyant garnitür) EKSİK. Step 1+2+6 BOILERPLATE
 *      LEAK FIX. 3 ingredient_add, 6 step replace.
 *
 *   2. susamli-kereviz-tava-manisa-usulu (Manisa yöre): kereviz +
 *      susam + limon + zeytinyağı + tuz VAR. DB'de sarımsak +
 *      karabiber + maydanoz + dereotu opsiyonel EKSİK. Step 5+6
 *      jenerik scaffold. 4 ingredient_add, 6 step replace.
 *
 *   3. welsh-rarebit-toast-ingiliz-usulu (İngiliz klasik): cheddar +
 *      süt + hardal + tereyağı + ekmek VAR. DB'de Worcestershire sosu
 *      (essential, klasik rarebit imzası!) + un (roux için) + kayenne
 *      biber + yumurta sarısı (kremsi doku) EKSİK. Step 1+2+6
 *      BOILERPLATE LEAK FIX. 4 ingredient_add, 6 step replace.
 *
 *   4. zahterli-peynir-durum-hatay-usulu (Hatay zahter dürüm): lavaş
 *      + taze peynir + zahter + zeytinyağı VAR. DB'de sumak (Hatay
 *      imzası) + taze nane (Antakya) + tuz EKSİK. Step 1+2+6
 *      BOILERPLATE LEAK FIX. 7 step. 3 ingredient_add, 7 step replace.
 *
 *   5. su-boregi-erzurum-usulu (Erzurum klasik su böreği): un +
 *      yumurta + beyaz peynir + maydanoz + tereyağı VAR. DB'de süt
 *      (haşlama+ tepsi sosu) + tuz + karabiber EKSİK. Step 4+5 jenerik
 *      scaffold. 5 step tümü REPLACE. 3 ingredient_add, 5 step replace.
 *
 *   6. zahterli-lorlu-katmer-kilis-usulu (Kilis klasik): un + lor +
 *      zahter + zeytinyağı + su VAR. DB'de tuz + susam + ezilmiş
 *      ceviz (Kilis imzası) EKSİK. Step 1+2 BOILERPLATE LEAK FIX.
 *      3 ingredient_add, 6 step replace.
 *
 *   7. yumurtali-ekmek-trakya-usulu (Trakya French toast tatlı): bayat
 *      ekmek + yumurta + süt + tereyağı VAR. DB'de tuz + toz şeker +
 *      tarçın (Trakya tatlı varyant imzası) EKSİK. Step 1+2 BOILERPLATE
 *      LEAK FIX. 3 ingredient_add, 6 step replace.
 *
 * Toplam: 23 ingredient_add + 42 step replace + 10 BOILERPLATE LEAK
 * FIX (paketi 33 #1x3, #3x3, #4x3, #6x2, #7x2 farklı cümleler).
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
  // ─── 1: yumurtali-ekmek (klasik French toast tipi) ────────────────
  {
    type: "rewrite",
    slug: "yumurtali-ekmek",
    reason:
      "REWRITE jenerik scaffold + klasik yumurtalı ekmek tatlı varyant tamamlama. Klasik French toast tipi tatlı varyant: bayat ekmek + yumurta + süt + tuz + sıvı yağ VAR. DB'de tereyağı (klasik kızartma yağı, yağ-tereyağı kombi) + toz şeker (tatlı varyant) + tarçın garnitür EKSİK. Step 1 BOILERPLATE LEAK 'malzemeleri ölçüp ayrı kaplara' jenerik + step 2 jenerik 'tava 2 dk ısıtın' + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar'. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/yumurtali-ekmek",
      "https://www.bbcgoodfood.com/recipes/eggy-bread",
    ],
    description:
      "Yumurtalı ekmek, bayat dilimlerin yumurta ve sütle hazırlanan karışıma batırılıp tereyağı ve sıvı yağ kombinasyonunda altın renge gelene kadar kızartıldığı pratik kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Toz şeker", amount: "1", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Sıvı yağ ve tereyağını birlikte kullanın; sadece tereyağı yanar, sadece sıvı yağ aroma vermez. Bayat ekmek 1.5-2 cm dilim olsun; çok ince doğramayın, karışıma batırınca dağılır.",
    servingSuggestion:
      "Sıcak dilimleri tabağa alıp üstüne tarçın-toz şeker karışımı serpin; isteğe bağlı pekmez, bal veya pudra şekeriyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, süt, tuz ve toz şekerin yarısını derin kâsede çırpın; karışım pürüzsüz olana kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmek dilimlerini karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş tavada sıvı yağı orta ateşte ısıtıp tereyağını içinde eritin; köpük çekildiğinde ekmek dilimlerini yatırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Ekmekleri orta ateşte 4 dakika ilk yüzü altın renge gelene kadar pişirin; çevirip diğer yüzünü 4 dakika daha kızartın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Kâğıt havluya alıp fazla yağı süzdürün; üzerlerine kalan toz şeker ile tarçını karıştırarak serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak servis edin; istenirse pekmez, bal veya pudra şekeriyle taçlandırın.", timerSeconds: null },
    ],
  },

  // ─── 2: susamli-kereviz-tava-manisa-usulu (Manisa yöre) ───────────
  {
    type: "rewrite",
    slug: "susamli-kereviz-tava-manisa-usulu",
    reason:
      "REWRITE jenerik scaffold + Manisa susamlı kereviz tava tamamlama. Klasik formul: kereviz + susam + limon + zeytinyağı + tuz VAR. DB'de sarımsak + karabiber + maydanoz garnitür + dereotu opsiyonel EKSİK. Step 5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/manisa/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/sebze-yemekleri/kereviz-sote",
    ],
    description:
      "Manisa usulü susamlı kereviz tava; kereviz halkalarının limon suyuyla kararmadan korunup sarımsak ve zeytinyağında soteleme sırasında kavrulmuş susam ve dereotuyla tatlı tuzlu dengeli bir Ege sebze tabağına dönüşmesidir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Dereotu", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Kerevizi doğrar doğramaz limonlu suya atın; oksidasyonla kararmadan korunur. Susamı ayrı kuru tavada 2 dakika kavurup ekleyin; aroma derinleşir, çıtırlık artar.",
    servingSuggestion:
      "Servis tabağına alıp üstüne maydanoz ve ince doğranmış dereotu serpin; yanına bulgur pilavı, yoğurt veya soğan piyazıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kerevizleri soyup 1 cm yarım ay doğrayın; limon suyunun yarısı ile 1 su bardağı suyu birleştirip kerevizleri içine koyup karartmadan bekletin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sarımsağı ezin, maydanoz ve dereotunu kıyın; susamı ayrı kuru tavada 2 dakika sallayarak kavurup kâseye alın.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp sarımsağı 30 saniye çevirin; süzülmüş kerevizleri ekleyip 8 dakika ara ara çevirerek soteleyin.", timerSeconds: 510 },
      { stepNumber: 4, instruction: "Tuz, karabiber ve kalan limon suyunu serpip 2 dakika daha çevirin; kavrulmuş susamı katıp ocaktan alın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Servis tabağına paylaştırıp üzerine maydanoz ve dereotu serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak servis edin; ek limon dilimi ya da yoğurtla denkleştirin.", timerSeconds: null },
    ],
  },

  // ─── 3: welsh-rarebit-toast-ingiliz-usulu (İngiliz klasik) ────────
  {
    type: "rewrite",
    slug: "welsh-rarebit-toast-ingiliz-usulu",
    reason:
      "REWRITE jenerik scaffold + İngiliz Welsh rarebit klasik essentials. Klasik rarebit (Galler/İngiliz pub klasiği): cheddar + süt + hardal + tereyağı + ekmek VAR. DB'de Worcestershire sosu (rarebit imzası, essential!) + un (roux için) + kayenne biber + yumurta sarısı (kremsi doku) EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (sosta ayrım yok!) + step 2 jenerik + step 6 jenerik scaffold. Title KORUNUR. cuisine 'gb' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Welsh_rarebit",
      "https://www.bbcgoodfood.com/recipes/welsh-rarebit",
    ],
    description:
      "İngiliz pub klasiği Welsh rarebit toast; tereyağı ve unla roux yapılıp süt eklenerek pürüzsüzleşen sosa cheddar peyniri, hardal, Worcestershire sosu ve kayenne biber katılır, kızarmış ekmeğe sürülüp ızgarada altın kabuk tutturularak servis edilir.",
    ingredientsAdd: [
      { name: "Worcestershire sosu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Un", amount: "1", unit: "yemek kaşığı" },
      { name: "Kayenne biber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
    ],
    tipNote:
      "Cheddarı son anda ekleyin; uzun kaynama yağ ayrılmasına yol açar. Worcestershire sosunu eksik bırakmayın; rarebit'in karakter veren imzasıdır, hardal tek başına bu derinliği vermez.",
    servingSuggestion:
      "Sıcak ızgaradan çıkardığınız toastı tabağa alıp üzerine ince doğranmış taze soğan veya birkaç damla extra Worcestershire serpin; yanında turşu veya domates dilimleriyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cheddarı rendeleyin; tereyağını küp doğrayın; ekmek dilimlerini hazır edin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Küçük tencerede tereyağını orta ateşte eritip unu ekleyin, çırpıcıyla 1 dakika roux yapın; sütü ince akıtarak topaklanmadan pürüzsüzleştirin.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Sosa hardal, Worcestershire ve kayenne biberi ekleyip 1 dakika daha çevirin; ocaktan alıp cheddar ve yumurta sarısını katarak pürüzsüz krema kıvamı oluşana kadar karıştırın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Ekmek dilimlerini geniş tavada veya tostta orta ateşte 2 dakika kuru kızartın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Kızarmış ekmeklerin üstüne rarebit sosu kalın yayın; fırın ızgarasına dizip 200°C üst ızgarada 3 dakika sosun üstü kabarana ve altın renge gelene kadar pişirin.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Sıcak servis edin; üzerine ekstra kayenne biber serpip turşu veya domatesle denkleştirin.", timerSeconds: null },
    ],
  },

  // ─── 4: zahterli-peynir-durum-hatay-usulu (Hatay zahter) ──────────
  {
    type: "rewrite",
    slug: "zahterli-peynir-durum-hatay-usulu",
    reason:
      "REWRITE jenerik scaffold + Hatay zahterli peynir dürüm tamamlama. Klasik Antakya zahter dürümü: lavaş + taze peynir + zahter + zeytinyağı VAR. DB'de sumak (Hatay imzası, zahter destek) + taze nane (Antakya) + tuz EKSİK. Step 1 BOILERPLATE LEAK 'malzemeleri ölçüp ayrı kaplara' + step 2 jenerik 'tava 2 dk' + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar' (dürümde kenar yok!). 7 step. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/zahterli-durum",
    ],
    description:
      "Hatay sofralarının zahterli peynir dürümü; ince lavaşa zeytinyağında açılan zahter, ezilmiş taze peynir, sumak ve taze naneyle hazırlanan harç sürülüp dürüm formunda sarılarak baharat kokulu hızlı bir sabah tabağına dönüştürülür.",
    ingredientsAdd: [
      { name: "Sumak", amount: "1", unit: "tatlı kaşığı" },
      { name: "Taze nane", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
    ],
    tipNote:
      "Zahteri zeytinyağıyla 5 dakika önce buluşturun; baharat yağa geçer ve aroma derinleşir. Lavaşı ısıtmadan sarmaya çalışmayın; soğukken kırılır, hafif ısıtınca esnek olur.",
    servingSuggestion:
      "Dürümü ortadan dilimleyerek tabağa alın; yanında demli çay, dilim domates ve zeytinle Hatay kahvaltı tabağını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Zahteri zeytinyağıyla küçük kâsede karıştırıp 5 dakika dinlendirin; baharat yağa işlesin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Taze peyniri çatalla ezip içine sumak, taze nane ve bir tutam tuz ekleyin; pürüzsüzleşene kadar harmanlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hazırlanan zahterli yağı peynir karışımına gezdirip kaşıkla katlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavayı kısık ateşte ısıtıp lavaşı 30 saniye iki yüzü gerip esnetin.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Lavaşları tezgâha açıp peynir harcını eşit yayın; uzun kenardan başlayarak sıkıca dürüm formunda sarın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Dürümleri tavada 4 dakika hafifçe çevirerek dış yüzünü ısıtıp altın renge getirin.", timerSeconds: 240 },
      { stepNumber: 7, instruction: "Tavadan alıp ortadan dilimleyerek sıcak servis edin; yanına çay veya zeytin tabağı koyun.", timerSeconds: null },
    ],
  },

  // ─── 5: su-boregi-erzurum-usulu (Erzurum klasik) ──────────────────
  {
    type: "rewrite",
    slug: "su-boregi-erzurum-usulu",
    reason:
      "REWRITE jenerik scaffold + Erzurum klasik su böreği tamamlama. Klasik su böreği: yufka + un + yumurta + beyaz peynir + maydanoz + tereyağı VAR. DB'de süt (haşlama tepsi sosu için essential!) + tuz + karabiber EKSİK. Step 4+5 jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). 5 step tümü REPLACE. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/erzurum/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/borek-tarifleri/su-boregi",
    ],
    description:
      "Erzurum mutfağının ev su böreği; ev usulü hamurla açılan yufkaların kaynar tuzlu suda kısa haşlanıp soğuk şoklanması, peynir-maydanoz harcıyla tepside katlanması ve tereyağı ile sıcak süt sosuyla 190°C fırında pişirilmesinden oluşur.",
    ingredientsAdd: [
      { name: "Süt", amount: "1", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Yufkaları kaynar suda 30 saniyeden fazla tutmayın; aksi halde dağılır. Soğuk su şoku şart; pişirme dokusunu durdurur ve katlar belirginleşir. Tereyağı-süt karışımını ılık dökün; yufkalar arasına işler.",
    servingSuggestion:
      "Pişen böreği 10 dakika dinlendirip dilimleyin; yanına ev yoğurdu veya cacıkla servis edin, ortasına maydanoz dalı yatırın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, 3 yumurta, 1 yemek kaşığı tuz ve azar azar ılık suyla sert bir hamur yoğurun; 8 bezeye bölüp üzerini örtüp 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Beyaz peyniri çatalla ezip ince kıyılmış maydanoz ve karabiberle harmanlayın; iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Bezeleri tepsi büyüklüğünde açıp geniş tencerede tuzlu kaynar suya tek tek 30 saniye atın, ardından soğuk suya alıp temiz beze yatırın; tereyağının yarısını eritip tepsiyi yağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Süzülen yufkaları tepsiye katmanlayarak dizin; her iki katın arasına eritilmiş tereyağı sürüp ortaya peynir harcını dağıtın, son üst kata kalan tereyağı ve sütü ılıtarak gezdirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine kalan yumurtayı çırpıp sürün; 190°C ısıtılmış fırında 35 dakika üstü altın renge gelene kadar pişirin, fırından alıp 10 dakika dinlendirip dilimleyerek servis edin.", timerSeconds: 2100 },
    ],
  },

  // ─── 6: zahterli-lorlu-katmer-kilis-usulu (Kilis klasik) ──────────
  {
    type: "rewrite",
    slug: "zahterli-lorlu-katmer-kilis-usulu",
    reason:
      "REWRITE jenerik scaffold + Kilis zahterli lorlu katmer tamamlama. Klasik Kilis katmeri: un + lor + zahter + zeytinyağı + su VAR. DB'de tuz + susam + ezilmiş ceviz (Kilis imzası, klasik tamamlayıcı) EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (hamur işinde absürt) + step 2 BOILERPLATE LEAK jenerik. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kilis-katmer",
    ],
    description:
      "Kilis sofralarının zahterli lorlu katmeri; ince açılan hamura zeytinyağında dinlenmiş zahter, ezilmiş lor ve ceviz katmanlarıyla doldurulup katlamalı formda tavada iki yüzü çıtırlaştırılarak hazırlanan baharat kokulu Güneydoğu hamur işidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Susam", amount: "1", unit: "yemek kaşığı" },
      { name: "Ezilmiş ceviz", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamuru en az 15 dakika dinlendirin; gluten gevşer, açma sırasında yırtılmaz. Zahterin yarısını lor harcına, yarısını yağa katarak iki katmanlı aroma oluşturun.",
    servingSuggestion:
      "Sıcak katmerleri üçgen dilimleyerek servis edin; yanına demli çay, beyaz peynir ve zeytin tabağıyla Kilis kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş kapta un, tuz ve suyu yoğurma kaşığıyla birleştirip 6 dakika çalışın; pürüzsüz hamuru üzeri örtülü 15 dakika dinlendirin.", timerSeconds: 1260 },
      { stepNumber: 2, instruction: "Lor peynirini çatalla ezip içine zahterin yarısını, ezilmiş cevizi ve 1 yemek kaşığı zeytinyağını ekleyip harmanlayın; iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru 4 bezeye bölüp her birini 25 cm çapında ince yufka açın; üzerini kalan zahter ve zeytinyağıyla yağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yufkanın bir tarafına lor harcını yayıp dörde katlayarak katmer formunu verin; üst yüzünü zeytinyağı ile yağlayıp susamı serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp katmerleri 14 dakika iki yüzü altın renge gelene kadar pişirin; ara ara hafifçe bastırarak katlar arasında ısıyı dağıtın.", timerSeconds: 840 },
      { stepNumber: 6, instruction: "Tavadan alıp 1 dakika dinlendirin; üçgen dilimleyerek sıcak servis edin.", timerSeconds: 60 },
    ],
  },

  // ─── 7: yumurtali-ekmek-trakya-usulu (Trakya tatlı) ───────────────
  {
    type: "rewrite",
    slug: "yumurtali-ekmek-trakya-usulu",
    reason:
      "REWRITE jenerik scaffold + Trakya yumurtalı ekmek tatlı varyant tamamlama. Klasik Trakya French toast tatlısı: bayat ekmek + yumurta + süt + tereyağı VAR. DB'de tuz + toz şeker + tarçın (Trakya tatlı varyant imzası) EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (yumurta-süt çırpmada ayrım yok!) + step 2 jenerik 'tava 2 dk'. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/edirne/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tatli-yumurtali-ekmek",
    ],
    description:
      "Trakya'nın eski usul tatlı yumurtalı ekmeği; bayat dilimlerin yumurta, süt, toz şeker ve tarçın karışımına emdirilip tereyağında kızartılarak çayla servis edilen pratik tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Toz şeker", amount: "2", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Karışıma katılan tarçın ve şeker emdirme süresinde ekmeğin içine geçer; en az 30 saniye batırın. Tereyağını çok yüksek ateşte yakmayın; orta-kısık ısıda altın kabuk tutturulur.",
    servingSuggestion:
      "Sıcak dilimleri tabağa alıp üstüne pudra şekeri, ekstra tarçın veya pekmez gezdirin; yanına demli çay iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, süt, toz şekerin yarısı, tarçının yarısı ve bir tutam tuzu derin kâsede çırpın; karışım pürüzsüz olana kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmek dilimlerini karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş tavada tereyağını orta-kısık ateşte eritin; köpük çekildiğinde ekmek dilimlerini yatırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Ekmekleri 4 dakika ilk yüzü altın renge gelene kadar pişirin; çevirip diğer yüzünü 4 dakika daha kızartın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak dilimleri tabağa alıp üzerlerine kalan toz şeker ile tarçın karışımını serpip servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-33");
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
              paket: "oturum-31-mini-rev-batch-33",
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
