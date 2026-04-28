/**
 * Tek-seferlik manuel mini-rev batch 19 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 18+ kaynak (The Wanderlust Kitchen
 * vegan bun chay + Cheap and Cheerful Cooking + Dr Vegan Blog + Yemek.
 * com Ayran Asi + Acibadem Hayat + Arda Mutfagi Ayran Asi + Lezzet
 * Yufkali Tandir Boregi + Nefis Yemek Tandir + Yemek.com Kars Boregi +
 * TURKPATENT Mersin Tantunisi CI 211 + Lezzet Mersin Tantunisi +
 * Yemek.com Tantuni + Yemek.com Mardin yemekleri + Lezzet Mardin
 * Firkiye + Biletbayi Mardin yoresel + Lezzet Goce Koftesi + Koftesi
 * Afyon Goce + Etstur Nevsehir yemekleri + Endemigo Usak Tarhanasi CI
 * 209 + Kultur Portali Usak Tarhanasi + Tatil Budur Usak yemekleri).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (1 'vn' korunur, 6 'tr' korunur).
 * 5 title degisimi (2 title KORUNUR: Sanliurfa isotlu + Usak tarhanali
 * CI atfı).
 *
 * 2 KRITIK CI KESIF:
 *  - #4 Mersin Tantunisi CI 211 (21 Mart 2017 mahrec)
 *  - #7 Usak Tarhanasi CI 209 (Mense Adi, 21 gun fermente)
 *
 * 2 KRITIK TUTARSIZLIK FIX:
 *  - #1 vietnam-eriste: step 3 zeytinyagi+tuz listede YOK
 *  - #6 nevsehir-goce: step 3 un+baharat listede YOK
 *
 *   1. salatalikli-naneli-pirinc-eristesi-salata-vietnam-usulu
 *      (TUTARSIZLIK + Vietnam disambiguate): Cuisine 'vn' KORUNUR
 *      (esin atfı). DB step 3 zeytinyagi+tuz listede YOK = TUTARSIZLIK.
 *      Klasik bun chay vegan bilesenleri (The Wanderlust Kitchen +
 *      Cheap and Cheerful 2 kaynak). Title 'Vietnam Esinli Salatalikli
 *      Naneli Pirinc Eristesi Salatasi'. 6 ingredient_add (zeytinyagi
 *      + tuz + soya sosu + havuc + sarimsak + opsiyonel kisnis), 5
 *      step replace.
 *
 *   2. sanliurfa-isotlu-ayran-asi (CI atfi + ingredient ekle): Sanliurfa
 *      Isotu CI 109 (2009 tescil) + ayran asi Dogu/Guneydogu klasik
 *      (Yemek.com + Acibadem + Arda Mutfagi 3 kaynak). Title KORUNUR
 *      (Sanliurfa isotu CI bilesen atfı). 3 ingredient_add (tuz +
 *      sarimsak + tereyagi), 6 step replace klasik akış (yogurt +
 *      ilit + bugday/nohut + nane + tereyagda isot kavur servis).
 *
 *   3. tandir-boregi-kars-usulu (Kars yumusat + boilerplate temizle):
 *      Kars ozel tandir boregi kanit zayif; klasik yufkali tandir
 *      boregi Dogu Anadolu (Lezzet + Nefis Yemek 2 kaynak). DB step
 *      2 jenerik + step 6 boilerplate leak. Title 'Dogu Anadolu
 *      Esintili Tandir Boregi'. 3 ingredient_add (tuz + maydanoz +
 *      karabiber), 6 step replace.
 *
 *   4. tantunili-nohut-salatasi-mersin-usulu (KRITIK CI KESIF +
 *      TUTARSIZLIK FIX): Mersin Tantunisi TURKPATENT CI 211 (21 Mart
 *      2017 mahrec); klasik formul: dana antrikot/kaburga + pamuk
 *      yagi + tuz + kimyon + pul biber + sarimsak + sumak + maydanoz
 *      + sogan + lavas + limon. DB step 3 zeytinyagi+limon suyu+tuz
 *      listede YOK = KRITIK TUTARSIZLIK. Title 'Mersin Esinli Tantuni
 *      Tarzi Nohut Salatasi' disambiguate (uyarlama vurgu). 7
 *      ingredient_add (zeytinyagi + sivi yag + limon suyu + tuz +
 *      sarimsak + pul biber + sumak), 6 step replace su sokla teknigi.
 *
 *   5. tarcinli-etli-erik-tavasi-mardin-usulu (yumusat + 5 ingredient):
 *      Mardin alluciye/firkiye tatli-eksili kuzu klasigi (Yemek.com +
 *      Lezzet + Biletbayi 3 kaynak). DB eksik klasik bilesen: zeytinyagi
 *      + tereyagi + tuz + karabiber + sarimsak. Step jenerik+boilerplate.
 *      Title 'Mardin Esintili Tarcinli Etli Erik Tavasi'. 5 ingredient_
 *      add, 1 amount change (su 1→1.5 sb), 6 step replace, difficulty
 *      EASY→MEDIUM, total 48→60 dk.
 *
 *   6. sebzeli-goce-kofte-nevsehir-usulu (KRITIK TUTARSIZLIK + yumusat):
 *      Goce kofte Afyon kanonu (Lezzet + Koftesi.net 2 kaynak); Nevsehir
 *      atfı zayıf. DB step 3 un+baharat listede YOK = KRITIK TUTARSIZLIK.
 *      Title 'Ic Anadolu Esintili Sebzeli Goce Koftesi'. 6 ingredient_
 *      add (un + tuz + karabiber + kimyon + kuru nane + biber salcasi),
 *      6 step replace, total 30→40 dk.
 *
 *   7. tarhanali-kofte-tava-usak-usulu (Usak Tarhanasi CI 209 KORUNUR +
 *      ingredient ekle): Usak Tarhanasi TURKPATENT CI 209 (Mense Adi,
 *      21 gun fermente, biber+domates+yogurt) (Endemigo + Kultur Portali
 *      + Tatil Budur 3 kaynak). DB jenerik scaffold step + eksik klasik
 *      harc/sos bilesenleri. Title KORUNUR (Usak Tarhanasi CI atfı).
 *      8 ingredient_add (ince bulgur + tuz + karabiber + kimyon +
 *      sarimsak + salca + sivi yag + opsiyonel kuru nane), 6 step
 *      replace, difficulty EASY→MEDIUM, total 34→50 dk.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-19.ts
 *   npx tsx scripts/fix-mini-rev-batch-19.ts --env prod --confirm-prod
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
  // ─── 1: vietnam-eriste-salata (TUTARSIZLIK + disambiguate) ────────
  {
    type: "rewrite",
    slug: "salatalikli-naneli-pirinc-eristesi-salata-vietnam-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Vietnam disambiguate. Cuisine 'vn' KORUNUR (esin atfı). DB step 3 'zeytinyagini limon suyu ve tuzla cirpin' diyor LISTEDE ZEYTINYAGI ve TUZ YOK = KRITIK TUTARSIZLIK. Klasik vegan bun chay bilesenleri: pirinc eristesi + salatalik + havuc julyen + nane + kisnis + sarimsak + soya/lime + biber (The Wanderlust Kitchen + Cheap and Cheerful 2 kaynak). Title 'Vietnam Esinli Salatalikli Naneli Pirinc Eristesi Salatasi' disambiguate. 6 ingredient_add (zeytinyagi + tuz + soya sosu + havuc + sarimsak + opsiyonel kisnis), 5 step replace.",
    sources: [
      "https://thewanderlustkitchen.com/vegan-bun-chay-vietnamese-noodle-salad/",
      "https://cheapandcheerfulcooking.com/bun-chay-vietnamese-rice-noodle-salad/",
    ],
    newTitle: "Vietnam Esinli Salatalıklı Naneli Pirinç Eriştesi Salatası",
    description:
      "Vietnam mutfağının bún chay (vegan erişte salatası) sokak lezzetinden esinlenen, Türk damak tadına uyarlanmış hafif bir yaz salatası. Pirinç eriştesi, salatalık ve nanenin tazeliği; soya, sarımsak ve limonun derinliğiyle buluşuyor. Etsiz, doyurucu bir öğün.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Soya sosu", amount: "1", unit: "yemek kaşığı" },
      { name: "Havuç", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "1", unit: "diş" },
      { name: "Taze kişniş (opsiyonel)", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Eriştenin yapışmaması için haşladıktan sonra mutlaka soğuk suda durulayın. Acı sevenler bir tutam pul biber veya ince Tay biberi ekleyebilir.",
    servingSuggestion:
      "Üzerine kavrulmuş yer fıstığı serpiştirip oda sıcaklığında servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Pirinç eriştesini paket talimatına göre haşlayın (genelde 6 dakika), süzüp soğuk suda durulayıp fazla suyu süzdürün.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "Salatalığı uzun julyen, havucu ince rendeleyin; nane ve opsiyonel kişnişi kıyın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Sosu hazırlayın: zeytinyağı, soya sosu, limon suyu, rendelenmiş sarımsak ve tuzu çırpıcıyla pürüzsüz karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş kâseye erişte, salatalık, havuç, nane ve kişnişi alın; sosu üzerine gezdirip ezmemeye özen göstererek harmanlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "10 dakika oda sıcaklığında dinlendirin; aroma otursun. Servis öncesi son kez tadını kontrol edin.", timerSeconds: 600 },
    ],
  },

  // ─── 2: sanliurfa-isotlu-ayran-asi (CI atif + ingredient) ────────
  {
    type: "rewrite",
    slug: "sanliurfa-isotlu-ayran-asi",
    reason:
      "REWRITE CI atif + eksik klasik bilesen. Sanliurfa Isotu Turk Patent CI 109 (2009 tescil); ayran asi Dogu/Guneydogu Anadolu klasik corba (Yemek.com + Acibadem Hayat + Arda Mutfagi 3 kaynak). Title 'Sanliurfa Isotlu Ayran Asi' KORUNUR (isot CI bilesen atfı). DB'de tuz + sarimsak + tereyagi (klasik servis tereyagi) YOK = eksik klasik bilesen. 3 ingredient_add (tuz + sarimsak + tereyagi), 6 step replace klasik akış (yogurt cirp + ilit + bugday/nohut + nane + tereyagda isot servis).",
    sources: [
      "https://yemek.com/tarif/ayran-corbasi/",
      "https://www.acibadem.com.tr/hayat/ayran-asi-corbasi/",
      "https://www.ardaninmutfagi.com/yemek-tarifleri/corbalar/ayran-asi-corbasi-2",
    ],
    description:
      "Doğu ve Güneydoğu Anadolu'nun en eski çorbalarından, Şanlıurfa'nın 2009'da Türk Patent coğrafi işaret tescili almış isotuyla bütünleşen klasik bir lezzet. Haşlanmış buğday ve nohudun dolgun dokusu, yoğurdun serinliği; tereyağında kavrulmuş Şanlıurfa isotunun derin aromasıyla taçlanır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Yoğurt kesilmesin diye ısıtırken sürekli aynı yönde karıştırın, kaynama noktasına yaklaşmayın. Sıcak veya ılık servis edilebilir, yaz aylarında soğutarak da tüketilir.",
    servingSuggestion:
      "Yanında taze tandır ekmeği veya bazlama ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yoğurdu derin tencerede çırpıcıyla pürüzsüz olana kadar çırpın; ezilmiş sarımsak ve tuzu ekleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Haşlanmış buğday ve nohudu yoğurda katın, üzerine 2 su bardağı ılık su ekleyin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Orta-kısık ateşte sürekli aynı yönde karıştırarak ısıtın, kaynamasın; yoğurt kesilmesin.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Kuru naneyi ekleyip 1-2 dakika daha karıştırın; çorba sıcaklığa ulaşınca ocaktan alın.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "Küçük tavada tereyağını eritin, Şanlıurfa isotunu kısa süre (30 saniye) kavurun; yanmasın.", timerSeconds: 30 },
      { stepNumber: 6, instruction: "Çorbayı kâselere paylaştırın, isotlu tereyağını üzerine gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tandir-boregi-kars (yumusat + boilerplate temizle) ───────
  {
    type: "rewrite",
    slug: "tandir-boregi-kars-usulu",
    reason:
      "REWRITE Kars yore yumusat + jenerik step + boilerplate leak temizle. Kars spesifik tandir boregi kanit zayif (Yemek.com Kars boregi gravyer/lor varyanti farkli); klasik yufkali tandir boregi Dogu Anadolu pattern (Lezzet + Nefis Yemek 2 kaynak). DB step 2 'kalan malzemeleri olcun' jenerik scaffold; step 6 'tabakta su salip dokusu kaymasin' BOILERPLATE LEAK. Title 'Dogu Anadolu Esintili Tandir Boregi'. 3 ingredient_add (tuz + opsiyonel maydanoz + karabiber), 6 step replace temiz akış.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/hamurisi-tarifleri/borek-tarifleri/yufkali-tandir-boregi",
      "https://www.nefisyemektarifleri.com/tandir-boregi-yoresel/",
      "https://yemek.com/tarif/kars-boregi/",
    ],
    newTitle: "Doğu Anadolu Esintili Tandır Böreği",
    description:
      "Doğu Anadolu'nun tandırda pişen geleneksel böreklerinden esinlenen, ev fırınına uyarlanmış sütlü, yağlı yufka böreği. Çıtır kat kat yufka ve peynirin yumuşaklığı, sütlü sosun derinliğiyle buluşuyor. Sabah kahvaltısı veya çay saati için doyurucu.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz (opsiyonel)", amount: "0.25", unit: "demet" },
      { name: "Karabiber (opsiyonel)", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Yufkaları sererken hafif kırışık bırakırsanız börek pişerken daha katlı ve havalı görünür. Beyaz peynir tuzluysa harca ek tuz koymayın.",
    servingSuggestion:
      "Sıcak çay veya soğuk ayranla, isteğe göre üzerine susam veya çörek otu serpilerek servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Fırını 200°C'de ısıtın, tepsiyi tereyağıyla yağlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Süt, eritilmiş tereyağı ve yumurtayı çırpıcıyla pürüzsüz karıştırarak sosu hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Beyaz peyniri çatalla ezin; opsiyonel kıyılmış maydanoz, tuz ve karabiberi katıp iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "İlk yufkayı tepsiye serin, üzerine sosun bir kısmını gezdirin; ikinci yufkayı da aynı şekilde yerleştirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "İç harcı eşit yayın; kalan iki yufkayı sosla aralayarak üzerine kapatın, en üste bolca sos gezdirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "200°C fırında 22-25 dakika üstü altın renge dönene kadar pişirin; 5 dakika dinlendirip dilimleyerek servis edin.", timerSeconds: 1380 },
    ],
  },

  // ─── 4: tantunili-nohut-salatasi-mersin (CI 211 + TUTARSIZLIK) ───
  {
    type: "rewrite",
    slug: "tantunili-nohut-salatasi-mersin-usulu",
    reason:
      "REWRITE KRITIK CI KESIF + KRITIK TUTARSIZLIK FIX. Mersin Tantunisi Turk Patent CI 211 (21 Mart 2017 mahrec); klasik formul: dana antrikot/kaburga + pamuk yagi + tuz + kimyon + pul biber + sarimsak + sumak + maydanoz + sogan + lavas + limon (TURKPATENT + Lezzet + Yemek.com 3 kaynak). DB step 3 'zeytinyagini limon suyu ve tuzla cirpin' diyor LISTEDE ZEYTINYAGI + LIMON SUYU + TUZ YOK = KRITIK TUTARSIZLIK. Title 'Mersin Esinli Tantuni Tarzi Nohut Salatasi' disambiguate. 7 ingredient_add (zeytinyagi + sivi yag + limon suyu + tuz + sarimsak + pul biber + sumak), 6 step replace tantuni teknigi (ince ince doğra + isot/kimyon/sarimsak/yagda kavur + su sokla + nohut/sogan/maydanoz harmanla + sumak + lavasla servis).",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38131",
      "https://www.lezzet.com.tr/yemek-tarifleri/et-yemekleri/kirmizi-et-tarifleri/mersin-usulu-tantuni",
      "https://yemek.com/tarif/tantuni/",
    ],
    newTitle: "Mersin Esinli Tantuni Tarzı Nohut Salatası",
    description:
      "Mersin Tantunisi (Türk Patent coğrafi işaret tescili 211, 21 Mart 2017) tekniğinden esinlenen ev tarzı bir nohut salatası uyarlaması. İnce doğranmış dana etinin pul biber, kimyon ve sarımsakla kavrulduğu klasik tantuni harcı; nohut, soğan, maydanoz ve sumakla buluşarak doyurucu bir tabağa dönüşüyor.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Sıvı yağ (eti kavurmak için)", amount: "1", unit: "yemek kaşığı" },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Eti mümkün olduğunca ince doğramak tantuni karakterinin anahtarıdır; bıçağı keskin tutun. Su şoklama adımını atlamayın, etin yumuşaklığı ve sosun yoğunluğu buradan gelir.",
    servingSuggestion:
      "Yanında lavaş ve ayranla, üzerine ekstra sumak serperek ılık servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Dana etini tantuni tekniğiyle çok ince doğrayın (zar inceliğinde, 1-2 mm).", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavaya sıvı yağı alın, eti yüksek ateşte renklenene kadar 4-5 dakika kavurun; tuz, kimyon, pul biber ve ezilmiş sarımsağı ekleyin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Et kurumaya başlarsa azar azar ılık su serpiştirin (klasik tantuni şoklama tekniği), sosu kıvamlanana kadar 2-3 dakika daha kavurun.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Geniş servis kâsesine haşlanmış nohudu, ince kıyılmış kırmızı soğanı ve kıyılmış maydanozu alın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine sıcak tantuni harcını ekleyin; zeytinyağı, limon suyu ve sumakla harmanlayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Tadına bakıp gerekirse tuz ekleyin; 5 dakika ılıklaşmaya bırakıp servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 5: tarcinli-etli-erik-tavasi-mardin (yumusat + ingredient) ──
  {
    type: "rewrite",
    slug: "tarcinli-etli-erik-tavasi-mardin-usulu",
    reason:
      "REWRITE Mardin yumusat + 5 eksik klasik bilesen. Mardin alluciye/firkiye tatli-eksili kuzu klasigi (Yemek.com + Lezzet + Biletbayi 3 kaynak); 'erik tava' modern uyarlama ama tatli-tuzlu et Mezopotamya/Mardin ekoluyle uyumlu. DB eksik klasik: zeytinyagi + tereyagi + tuz + karabiber + sarimsak. Step 2 jenerik scaffold + step 5/6 boilerplate. Title 'Mardin Esintili Tarcinli Etli Erik Tavasi'. 5 ingredient_add, 1 amount change (su 1→1.5 sb eti pisirmeye yetersiz), 6 step replace, difficulty MEDIUM korunur, total 48→60 dk.",
    sources: [
      "https://yemek.com/mardin-yemekleri/",
      "https://www.lezzet.com.tr/lezzetten-haberler/mardin-usulu-firkiye-nasil-yapilir",
      "https://blog.biletbayi.com/mardin-yoresel-yemekler.html/",
    ],
    newTitle: "Mardin Esintili Tarçınlı Etli Erik Tavası",
    description:
      "Mardin mutfağında alluciye ve firkiye gibi tatlı-tuzlu et yemekleri köklüdür; bu tava, kuzu kuşbaşı ile kuru eriği tarçının sıcak notası altında buluşturur. Etin mührü ile başlayan akış, erikleri son aşamada katarak meyvenin dokusunu korur. Yöresel ekolün ev mutfağına uyarlanmış sade hâli.",
    prepMinutes: 15,
    cookMinutes: 45,
    totalMinutes: 60,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "1.5", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
    ],
    tipNote:
      "Eriklerin çok erken eklenmesi dağılmasına yol açar; son 8 dakikada tencereye girmesi yeterli. Tarçını iki aşamada (pişirme ortası + bitiş) eklemek aroma derinliği verir.",
    servingSuggestion:
      "Sade pirinç pilavı veya bulgur pilavıyla, yanında soğuk yoğurtla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tencerede zeytinyağı ve tereyağını ısıtın; kuzu kuşbaşıyı yüksek ateşte 6-7 dakika tüm yüzeyleri kapanana kadar mühürleyin.", timerSeconds: 420 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ekleyin, orta ateşte 4 dakika pembeleştirin; ezilmiş sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Tuz, karabiber ve tarçının yarısını ekleyip 1 dakika kavurun; aroma açılsın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "1.5 su bardağı sıcak suyu ekleyin, kapağı kapatın; kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Kuru erikleri ilave edin; kalan tarçını serpip kapaklı 8 dakika daha pişirin.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Ocaktan alın, 5 dakika dinlendirip sıcak servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 6: sebzeli-goce-kofte-nevsehir (TUTARSIZLIK + yumusat) ──────
  {
    type: "rewrite",
    slug: "sebzeli-goce-kofte-nevsehir-usulu",
    reason:
      "REWRITE KRITIK TUTARSIZLIK FIX + Nevsehir yumusat. Goce kofte Afyon kanonu (Lezzet + Koftesi.net 2 kaynak); Nevsehir atfı zayıf. DB step 3 'goce, sebze, un ve baharatı 5 dakika yogurun' diyor LISTEDE UN ve BAHARAT YOK = KRITIK TUTARSIZLIK. Title 'Ic Anadolu Esintili Sebzeli Goce Koftesi'. 6 ingredient_add (un + tuz + karabiber + kimyon + kuru nane + biber salcasi), 6 step replace, total 30→40 dk.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/turkiye-turu/ic-anadolu-yemekleri/goce-koftesi",
      "https://koftesi.net/goce-koftesi-afyonun-geleneksel-gozdesi/",
      "https://www.etstur.com/letsgo/nevsehirde-ne-yenir-kapadokyanin-meshur-yemekleri/",
    ],
    newTitle: "İç Anadolu Esintili Sebzeli Göce Köftesi",
    description:
      "Göce, aşurelik buğday olarak da bilinen kabuğu çıkarılmış kırılmış buğdaydır ve İç Anadolu'nun tahıl mutfağında yaygın yer tutar. Bu köfte, sebzelerin nemiyle göceyi bağlayıp tavada altın rengine getirir. Etsiz, doyurucu bir ev köftesi.",
    prepMinutes: 25,
    cookMinutes: 15,
    totalMinutes: 40,
    ingredientsAdd: [
      { name: "Un", amount: "3", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Rendelenen kabak ve havucun suyunu iyice sıkmak köftenin dağılmamasının anahtarıdır. Karışım gevşek kalırsa 1 yemek kaşığı un daha ekleyin.",
    servingSuggestion:
      "Sarımsaklı yoğurt ve tereyağında pul biber sosuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Göceyi 1 su bardağı sıcak suda 15 dakika bekletip süzün.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Havuç ve kabağı rendeleyin, soğanı çok ince doğrayın; rende suyunu iyice sıkın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş kâsede göce, sebzeler, un, biber salçası, tuz, karabiber, kimyon ve kuru naneyi 5 dakika sıkıca yoğurun.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Karışımı 10 dakika dinlendirin; göce sebze suyunu çekip karışım toparlansın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Ceviz büyüklüğünde köfteler şekillendirip avuç içinde hafifçe yassılaştırın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Geniş tavada zeytinyağını ısıtın, köfteleri orta ateşte her yüzü 4-5 dakika altın renge dönene kadar pişirin; sıcak servis edin.", timerSeconds: 540 },
    ],
  },

  // ─── 7: tarhanali-kofte-tava-usak (Usak Tarhanasi CI 209) ────────
  {
    type: "rewrite",
    slug: "tarhanali-kofte-tava-usak-usulu",
    reason:
      "REWRITE Usak Tarhanasi CI atfi KORUNUR + 8 eksik klasik bilesen. Usak Tarhanasi Turk Patent CI 209 (Mense Adi, 21 gun fermente, biber+domates+yogurt) (Endemigo + Kultur Portali + Tatil Budur 3 kaynak). Title KORUNUR (Usak tarhanasi CI atfı meşru). DB jenerik scaffold step + eksik klasik harc/sos: ince bulgur + tuz + karabiber + kimyon + sarimsak + salca + sivi yag + opsiyonel kuru nane. 8 ingredient_add, 6 step replace, difficulty MEDIUM korunur, total 34→50 dk.",
    sources: [
      "https://endemigo.com/p/usak-oushak-tarhana-soup-pdo",
      "https://www.kulturportali.gov.tr/portal/usak-tarhanasi",
      "https://www.tatilbudur.com/blog/usakin-meshur-yemekleri/",
    ],
    description:
      "Uşak Tarhanası, 21 günlük fermantasyonu ve Türk Patent coğrafi işaret tescili (Tescil No 209, Menşe Adı) ile diğer tarhanalardan ayrılır; yoğurt, biber ve domatesin yaz boyunca olgunlaştığı bir mayalanma ürünüdür. Bu tava, klasik kıyma köftesini Uşak tarhanasının ekşi, baharatlı sosuyla buluşturur. Yöre tarhanasını çorba dışında değerlendiren modern bir uyarlama.",
    prepMinutes: 25,
    cookMinutes: 25,
    totalMinutes: 50,
    ingredientsAdd: [
      { name: "İnce bulgur", amount: "0.25", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı" },
      { name: "Kuru nane (opsiyonel servis)", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Tarhanayı kaynar suya değil ılık suya açın; kaynar su tarhananın aromasını kırar. Sos kıvamı tahin yoğunluğundan biraz akışkan olmalı.",
    servingSuggestion:
      "Sıcak lavaş ve yanında soğuk cacıkla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulguru 3 yemek kaşığı sıcak suyla 10 dakika ıslatıp şişirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Geniş kâsede dana kıyma, ıslatılmış bulgur, rendelenmiş soğan, ezilmiş sarımsak, tuz, karabiber ve kimyonu 5 dakika sıkıca yoğurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Karışımdan küçük yassı köfteler şekillendirin; tavada sıvı yağı ısıtıp her yüzünü 3-4 dakika kızartın.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Ayrı tavada 1 yemek kaşığı sıvı yağda salçayı 1 dakika kavurun; Uşak tarhanasını 2 su bardağı ılık suyla açıp salçaya ekleyin.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Köfteleri tarhana sosuna alın, kısık ateşte kapaklı 10 dakika pişirin; aroma yoğunlaşsın.", timerSeconds: 600 },
      { stepNumber: 6, instruction: "Üzerine opsiyonel kuru nane serpip sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-19");
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
              paket: "oturum-29-mini-rev-batch-19",
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
