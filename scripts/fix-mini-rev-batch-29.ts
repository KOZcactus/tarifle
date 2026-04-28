/**
 * Tek-seferlik manuel mini-rev batch 29 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-28 ile
 * aynı audit, top 1-7 araliği, 51 kalan kuyrugundan ilk 7). Klasik
 * kanonik kanitli tarifler; jenerik step 2/5/6 boilerplate temizle +
 * eksik klasik baharat/aromatik tamamla.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tatli-eksi-tavuk (Kanton 咕嚕肉 sweet-and-sour klasik): yumurta+
 *      un+nişasta triple kaplama + kapya biber + ananas + ketçap+sirke+
 *      şeker+soya sos. DB'de yumurta + soğan + sarımsak + zencefil +
 *      tuz EKSİK. Step 2+5+6 jenerik. 5 ingredient_add, 6 step replace.
 *
 *   2. tavuk-kapama-edirne-usulu (Edirne Saray klasik): tavuk haşlama
 *      + Trakya pilavı (kuş üzümü + iç badem + tarçın + defne) +
 *      tepside fırın. DB'de saray imzası kuş üzümü + iç badem + defne
 *      + tarçın EKSİK. Step 2+5+6 jenerik. 4 ingredient_add, 6 step
 *      replace.
 *
 *   3. sumakli-tavuk-pilav-kasesi-levant-usulu (Levant musakhan-bowl):
 *      sumaklı tavuk + pirinç + kavrulmuş soğan + yoğurt sos + maydanoz
 *      garnitür. DB'de soğan (Levant essential!) + sarımsak + tuz +
 *      karabiber + maydanoz EKSİK. Step 2+5+6 jenerik. 5 ingredient_add,
 *      6 step replace.
 *
 *   4. tavuklu-kalle-kirklareli-usulu (Kırklareli klasik): lahana
 *      turşusu + tavuk + bulgur + soğan + salça + tereyağı/sıvı yağ.
 *      Mevcut formul OK ama tuz + pul biber + sarımsak + dereotu
 *      garnitür EKSİK. Step 2+5+6 jenerik. 4 ingredient_add, 6 step
 *      replace.
 *
 *   5. tacu-tacu-sebzeli-peru-usulu (Peru tacu-tacu klasik): pirinç +
 *      fasulye + sofrito (soğan + sarımsak + ají amarillo + kimyon) +
 *      tavada hilal mühür. DB'de tuz + karabiber + kimyon + kişniş
 *      EKSİK. Step 2+5+6 jenerik. 4 ingredient_add, 6 step replace.
 *
 *   6. tahin-pekmezli-pankek (klasik pankek): un + yumurta + süt +
 *      kabartma tozu + tereyağı + tuz tutamı + opsiyonel toz şeker.
 *      DB'de tuz + tereyağı + toz şeker EKSİK. Step 1+2+6 jenerik
 *      ve özellikle step 6 BOILERPLATE LEAK 'peynirli doku sertleşir'
 *      pankek tatlısında peynir yok. 3 ingredient_add, 6 step replace.
 *
 *   7. sumakli-tavuklu-bulgur-pilavi-adana-usulu (Adana sumaklı pilav):
 *      tavuk + bulgur + soğan + salça (Adana imzası) + tereyağı + sumak
 *      + maydanoz. DB'de soğan + salça + tereyağı + karabiber + maydanoz
 *      EKSİK. Step 2+5+6 jenerik. 5 ingredient_add, 6 step replace.
 *
 * Toplam: 30 ingredient_add + 42 step replace + 1 BOILERPLATE LEAK FIX
 * (paketi 29 #6 tahin pekmezli pankek 'peynirli doku' yanlış cümle).
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description hash kontrol).
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
  // ─── 1: tatli-eksi-tavuk (Kanton sweet-and-sour klasik) ───────────
  {
    type: "rewrite",
    slug: "tatli-eksi-tavuk",
    reason:
      "REWRITE jenerik scaffold + Kanton tatlı ekşi tavuk klasik kaplama ve sofrito. Klasik Cantonese 咕嚕肉 (gu lou yuk) tavuk varyantı: tavuk küp + un+nişasta+yumurta triple kaplama + kızartma; sos ananas suyu+sirke+ketçap+şeker+soya, soğan+kapya biber+sarımsak+zencefil+ananas dilimi. DB'de yumurta (kaplama essential) + soğan + sarımsak + zencefil + tuz EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'cn' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Sweet_and_sour",
      "https://thewoksoflife.com/sweet-sour-chicken/",
    ],
    description:
      "Kanton lokantalarının parlak soslu klasiği; un, yumurta ve nişastayla üç kat kaplanan tavuk küpleri kızgın yağda çıtırlaşır, ardından ananas, kapya biber ve ketçap-sirke-şeker sosuyla buluşur.",
    ingredientsAdd: [
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Zencefil", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tavuğu çift turlu kızartın: ilk tur 160°C'de pişir, ikinci tur 190°C'de çıtırlaştır; bu kaplama nemini içeride tutar. Sosa nişastayı son anda ekleyin; aksi takdirde dipte topaklanır.",
    servingSuggestion:
      "Buharda pirinç pilavı veya jasmine pirincinin üstüne dökün; üzerine ince doğranmış taze soğan ve kavrulmuş susam serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuğu 2.5 cm küp doğrayın; tuz ve karabiberle ovup yumurtaya bulayın, ardından un ve nişasta karışımına geçirip fazlasını silkeleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Soğan ve kapya biberi 2 cm kare doğrayın; sarımsak ile zencefili rendeleyin; ananası 1.5 cm parçalayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada veya wokta sıvı yağı 175°C'ye ısıtın; tavukları parti parti 5 dakika altın renge gelene kadar kızartıp süzgece alın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Aynı tavadan fazla yağı dökün; soğan, sarımsak ve zencefili 1 dakika çevirin, kapya biberi ekleyip 2 dakika daha soteleyin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Ketçap, soya sosu, pirinç sirkesi, toz şeker ve ananası ekleyin; 3 dakika kaynatıp 1 yemek kaşığı nişastayı 3 yemek kaşığı suyla ezerek sosa katın ve koyulaştırın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Çıtır tavukları sosa ekleyip orta ateşte 1 dakika karıştırarak kaplayın; ocaktan alıp pirinç pilavıyla sıcak servis edin.", timerSeconds: 60 },
    ],
  },

  // ─── 2: tavuk-kapama-edirne-usulu (Edirne Saray klasik) ───────────
  {
    type: "rewrite",
    slug: "tavuk-kapama-edirne-usulu",
    reason:
      "REWRITE jenerik scaffold + Edirne Saray tavuk kapama klasik tatlandırıcılar. Klasik kapama: tavuk haşlama + Trakya pilavı (pirinç + kuş üzümü + iç badem + tarçın + tereyağı + defne) + didiklenmiş tavuk + 180°C tepside fırın. DB'de saray imzası kuş üzümü + iç badem + defne yaprağı + tarçın EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/tavuk-tarifleri/edirne-tavuk-kapama",
      "https://www.kulturportali.gov.tr/turkiye/edirne/neyenir/tavuk-kapama",
    ],
    description:
      "Edirne saray sofralarından gelen tavuk kapama; haşlanan tavuğun tepside pirinç pilavıyla buluşması, kuş üzümü, iç badem ve tarçınla aldığı tatlı-ferah imza ve fırında olgunlaşmasıyla bilinir.",
    ingredientsAdd: [
      { name: "Kuş üzümü", amount: "2", unit: "yemek kaşığı" },
      { name: "İç badem", amount: "2", unit: "yemek kaşığı" },
      { name: "Defne yaprağı", amount: "1", unit: "adet" },
      { name: "Tarçın", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Kuş üzümünü 10 dakika ılık suda bekletin; pilavda eşit dağılır. İç bademi tepsiye katmadan önce 2 dakika tereyağında çevirirseniz aroma derinleşir.",
    servingSuggestion:
      "Tepsiyi sofraya getirip kapama tabağına dilim dilim alın; üstüne hafifçe karabiber ve isteğe göre kıyılmış maydanoz serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk butlarını 2 litre soğuk suya alın; defne yaprağı ve birkaç tane karabiberle yavaş kaynatıp 35 dakika haşlayın, köpüğünü alın.", timerSeconds: 2100 },
      { stepNumber: 2, instruction: "Tavuğu suyundan çıkarıp ılındıktan sonra etini iri parçalar halinde didikleyin; haşlama suyunu süzüp kenara alın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Pirinci yıkayıp süzün; kuş üzümünü ılık suda 10 dakika bekletin. Tepside tereyağını eritip soğanı 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Pirinci tereyağına ekleyip 1 dakika çevirin; süzülmüş kuş üzümü, iç badem ve tarçını katın, üzerine 3 su bardağı sıcak tavuk suyu, tuz ve karabiberi ilave edip 1 taşım kaynatın.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Didiklenmiş tavuğu pirincin üstüne yayıp tepsinin kapağını kapatın; 180°C ısıtılmış fırında 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Fırından çıkan tepsiyi 5 dakika dinlendirin; kapama tabağına alıp dilimleyerek sıcak servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 3: sumakli-tavuk-pilav-kasesi-levant-usulu (musakhan-bowl) ────
  {
    type: "rewrite",
    slug: "sumakli-tavuk-pilav-kasesi-levant-usulu",
    reason:
      "REWRITE jenerik scaffold + Levant musakhan-bowl klasik essential. Filistin/Lübnan musakhan-bowl: bol sumak + kavrulmuş soğan (Levant essential!) + maydanoz garnitür + sarımsaklı yoğurt sos + zeytinyağı. DB'de soğan + sarımsak + tuz + karabiber + maydanoz EKSİK (5 essential). Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'me' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Musakhan",
      "https://www.maureenabood.com/musakhan-roll-ups-with-sumac/",
    ],
    description:
      "Filistin musakhanından esinlenen kase formu; bol sumakla yoğrulan tavuk parçaları yağda kavrulmuş soğan, pirinç ve sarımsaklı yoğurt sosla buluşunca Levant sofrasının kase versiyonunu kurar.",
    ingredientsAdd: [
      { name: "Soğan", amount: "2", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Soğanları yarım ay kesip orta ateşte uzun uzadıya 10-12 dakika pembeleştirin; musakhan imzası bu derin karamelizasyondur. Sumakı iki aşamada katın: yarısını ete yoğurun, yarısını servis öncesi serpin.",
    servingSuggestion:
      "Üzerine bol maydanoz, ekstra sumak ve istenirse kavrulmuş çam fıstığı serpip yoğurt sosla servis edin; yanına lavaş veya sıcak ekmek alın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp 30 dakika ılık suda bekletin; soğanı yarım ay doğrayın, sarımsağı ezin, maydanozu ince kıyın.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Tavuğu zeytinyağının yarısı, sumakın yarısı, tuz ve karabiberle yoğurup 10 dakika dinlendirin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Geniş tavada kalan zeytinyağını ısıtıp soğanları 10 dakika derin pembeleştirin; sarımsağı 30 saniye çevirip yarısını kenara ayırın.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Tavuğu tavaya ekleyip her yüzünü 8 dakika mühürleyin; süzülmüş pirinci 1 dakika çevirip 3 su bardağı sıcak su katın, kapakla kısık ateşte 18 dakika pişirin.", timerSeconds: 1080 },
      { stepNumber: 5, instruction: "Yoğurdu kalan ezilmiş sarımsak ve tuzla çırparak yoğurt sosu hazırlayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Pilavı ve tavuğu kaselere paylaştırıp üzerine kavrulmuş soğan, kalan sumak ve maydanoz serpin; yan tarafa yoğurt sosla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: tavuklu-kalle-kirklareli-usulu (Kırklareli klasik) ────────
  {
    type: "rewrite",
    slug: "tavuklu-kalle-kirklareli-usulu",
    reason:
      "REWRITE jenerik scaffold + Kırklareli kalle klasik baharat ve garnitür. Trakya kalle: lahana turşusu + tavuk + bulgur + soğan + salça + tereyağı + sıvı yağ var. DB'de tuz + pul biber + sarımsak + dereotu garnitür EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kirklareli/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kirklareli-kallesi",
    ],
    description:
      "Kırklareli kalle, lahana turşusu, tavuk ve bulguru aynı tencerede buluşturarak Trakya mutfağının ekşi-doyurucu kış sofralarına imza atan tek kap yemeğidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Dereotu", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Lahana turşusunu çok ekşiyse 5 dakika soğuk suda yıkayın; aksi halde bulgur diri tane vermeden ekşilik bastırır. Salçayı yağda 2 dakika kavurmadan suyu eklemeyin.",
    servingSuggestion:
      "Sıcak kaseyi taze dereotu ve istenirse bir kaşık ev yoğurduyla servis edin; yanında turşu suyu için soğuk bir bardak ayran iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin; tavuğu kuşbaşı kesin; lahana turşusunu süzüp ince doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağı ve sıvı yağı ısıtıp soğanı 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin, tavuğu ekleyip 6 dakika her yüzüyle mühürleyin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Salçayı katıp 2 dakika kavurun; tuz, karabiber ve pul biberi ekleyip 30 saniye karıştırın.", timerSeconds: 150 },
      { stepNumber: 4, instruction: "Lahana turşusu ve bulguru ilave edip 1 dakika çevirin; 2.5 su bardağı sıcak su katıp kapakla kısık ateşte 25 dakika bulgur diri tane verene kadar pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Ocaktan alıp kapağı bezle kapatarak 8 dakika demlendirin; karıştırıp kıvamı kontrol edin.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Servis kasesine paylaştırıp ince doğranmış dereotuyla taçlandırarak sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: tacu-tacu-sebzeli-peru-usulu (Peru klasik) ────────────────
  {
    type: "rewrite",
    slug: "tacu-tacu-sebzeli-peru-usulu",
    reason:
      "REWRITE jenerik scaffold + Peru tacu-tacu klasik sofrito. Lima sokak klasiği: pirinç + Canario fasulye + sofrito (soğan + sarımsak + ají amarillo + kimyon, Peru kreolize imzası) + tavada hilal mühür. DB'de tuz + karabiber + kimyon (Peru sofrito imzası) + kişniş garnitür EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'pe' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tacu_tacu",
      "https://www.peru.travel/en/gastronomy/peruvian-cuisine/tacu-tacu",
    ],
    description:
      "Lima'nın akşam tavalarında pişen tacu-tacu; pirinci ve fasulyeyi soğan, sarımsak ve ají amarilloyla kavrulmuş kreolize sofritoya bastırarak hilal forma sokar, dışı çıtır içi yumuşak Peru kasesi kurar.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kişniş", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Pirinç ve fasulyeyi tavaya almadan önce 1 saat dinlendirin; nem kaybedip tavada hilal forma daha iyi otururlar. Ají amarilloyu sofritoda kavurmadan ekleyin; yanma riski yüksektir.",
    servingSuggestion:
      "Üzerine sahanda yumurta, kızarmış muz dilimleri (plátano frito) veya salsa criolla ile Peru tarzı servis edin; yanında limon dilimi koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı çok ince doğrayın, sarımsağı ezin; kişnişin yapraklarını koparıp ayırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp soğanı 5 dakika şeffaflaşana kadar çevirin; sarımsak, ají amarillo ezmesi ve kimyonu ekleyip 1 dakika daha kavurarak sofritoyu açın.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Haşlanmış pirinç ve fasulyeyi tavaya ekleyin; tuz ve karabiber katıp tahta spatulayla bastırarak sıkıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Karışımı tavada hilal forma yayıp orta-yüksek ateşte 6 dakika dış yüzü kabuk tutana kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "İri spatulayla dikkatlice çevirip diğer yüzünü 4 dakika daha mühürleyin.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Tabağa alıp üzerine taze kişniş yaprakları serpin; istenirse sahanda yumurta veya kızarmış muzla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tahin-pekmezli-pankek (klasik pankek + BOILERPLATE LEAK) ──
  {
    type: "rewrite",
    slug: "tahin-pekmezli-pankek",
    reason:
      "REWRITE jenerik scaffold + BOILERPLATE LEAK FIX + klasik pankek hamur. Klasik pankek: un + yumurta + süt + kabartma tozu + tereyağı + tuz tutamı + opsiyonel toz şeker. DB'de tuz + tereyağı + toz şeker EKSİK + step 1 ve 2 jenerik scaffold + step 6 BOILERPLATE LEAK 'fazla beklerse peynirli doku sertleşir' (pankek tatlısında peynir yok!). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/easy-pancakes",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/pankek-tarifi",
    ],
    description:
      "Pankek hamurunu un, yumurta, süt ve eritilmiş tereyağıyla yoğurup tavada kabartınca yumuşak gözenekli bir kahvaltı tabağı çıkar; üstüne dökülen tahin ve pekmez tanıdık ev tatlarını dengeli buluşturur.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Tereyağı (eritilmiş)", amount: "2", unit: "yemek kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamuru çırptıktan sonra 5-10 dakika dinlendirin; un nemi tutar, pankekler daha kabarık çıkar. Tavayı çok yağlamayın; yapışmaz tavaya hafif bir bez yağı yeterli.",
    servingSuggestion:
      "Sıcak pankeklerin üzerine tahini gezdirip pekmezi dökün; isteğe bağlı ceviz, muz dilimleri veya çilekle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Bir kapta un, kabartma tozu, toz şeker ve bir tutam tuzu çırpıcıyla karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Diğer kapta yumurtayı, sütü ve eritilmiş tereyağını çırpın; kuru karışıma azar azar ekleyip pürüzsüz hamur elde edin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru 5 dakika dinlendirin; bu sırada tahin ve pekmezi ayrı kaselere alın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp ince yağlayın; her pankek için 1 büyük kepçe hamur dökün.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üst yüzde küçük baloncuklar açılınca (yaklaşık 2 dakika) çevirin; diğer yüzü 1.5 dakika pişirip tabağa alın.", timerSeconds: 210 },
      { stepNumber: 6, instruction: "Pankekleri sıcak servis edin; üzerine tahini gezdirip pekmezi dökün, dilerseniz ceviz veya muz dilimleriyle taçlandırın.", timerSeconds: null },
    ],
  },

  // ─── 7: sumakli-tavuklu-bulgur-pilavi-adana-usulu (Adana klasik) ──
  {
    type: "rewrite",
    slug: "sumakli-tavuklu-bulgur-pilavi-adana-usulu",
    reason:
      "REWRITE jenerik scaffold + Adana sumaklı bulgur pilavı klasik baharat. Adana imzası: tavuk + bulgur + soğan + salça (Adana imzası, kırmızı renk + tatlı/acı kombo) + tereyağı + sumak (bol) + maydanoz garnitür. DB'de soğan + salça + tereyağı + karabiber + maydanoz EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/adana/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-tarifleri/sumakli-bulgur-pilavi",
    ],
    description:
      "Adana mutfağının canlı sumaklı bulgur pilavı; tavuk parçalarını soğan, salça ve tereyağıyla buluşturup iri bulgura çekerek tek tencerede sulu, ekşimsi-doyurucu bir ana yemek kurar.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Sumakı iki aşamada katın: yarısını pilav suyuyla, yarısını servis öncesi taze serpin; uçucu aroma korunur. Bulgur diri tane versin diye dinlendirme süresini atlamayın.",
    servingSuggestion:
      "Bol kıyılmış maydanoz ve dilim limonla servis edin; yanında soğan-sumak salatası ve cacık iyi dengeler.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın; tavuğu kuşbaşı kesin; bulguru ayıklayıp süzgeçten geçirin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede zeytinyağı ile tereyağını ısıtıp soğanı 4 dakika pembeleştirin; tavuğu ekleyip her yüzüyle 6 dakika mühürleyin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Salçayı katıp 2 dakika kavurun; tuz, karabiber ve sumakın yarısını ekleyin.", timerSeconds: 150 },
      { stepNumber: 4, instruction: "Bulguru ilave edip 1 dakika yağda çevirin; 3 su bardağı kaynar su katıp kapakla kısık ateşte 15 dakika pişirin.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Ocaktan alıp kalan sumakı serpin; kapağı bezle kapatarak 8 dakika demlendirin.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Kaseye paylaştırıp ince doğranmış maydanozla taçlandırarak sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-29");
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
              paket: "oturum-31-mini-rev-batch-29",
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
