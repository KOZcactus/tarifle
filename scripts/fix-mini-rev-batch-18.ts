/**
 * Tek-seferlik manuel mini-rev batch 18 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 18+ kaynak (Wikipedia Za'atar +
 * Manakish + Hatay mutfagi + Baba Ghanoush + Hatay Province + Polish
 * cuisine + Kluski + PL Herbs + TR/EN Pide Wikipedia + Tekirdag +
 * Tatil Budur Igdir + Yemek.com Klasik Piyaz + Kevserin Fasulye
 * Piyazi + Refika Tavuklu Mantarli Makarna + GZT Lokma Tavuklu Mantar
 * + GZT Lokma Tahinli Uzumlu + Kevserin Tahinli Corek + Arda
 * Uzumlu Corek).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (1 'pl' korunur, 6 'tr' korunur).
 * 7 title degisimi.
 *
 * KRITIK TUTARSIZLIK FIX (2 tarif):
 *  - #5 igdir-piyaz: step 3 limon suyu listede YOK + step 2 tuz YOK
 *  - #7 ankara-tahinli-corek: 'mayali hamur' description ama maya
 *    listede YOK + boilerplate leak (peynirli doku + tava isitma)
 *
 * KRITIK BOILERPLATE LEAK FIX (#7): tipNote'ta 'peynirli doku
 * sertlesir' (corek tarifinde peynir cumlesi). Step 2 'tavayi orta
 * ateste 2 dk isitin' alakasiz (firin tarifi).
 *
 *   1. tahinli-zahterli-yumurta-durumu-antalya-usulu (yore yumusat +
 *      tortilla fix): Zahter Levant baharati (Suriye/Lubnan/Filistin/
 *      Urdun klasik, Wikipedia + Manakish). Antalya zahter klasigi
 *      kanitsiz; Hatay/Antakya zahter merkezi (Hatay mutfagi Wikipedia).
 *      tipNote'ta 'tortilla' YANLIS, listede lavas. Title 'Antakya
 *      Esintili Tahinli Zahterli Yumurta Durumu'. 4 ingredient_add
 *      (zeytinyagi + tuz + karabiber + taze maydanoz/nane), tipNote
 *      tortilla→lavas fix, 5 step replace.
 *
 *   2. tahinli-patlican-corbasi-hatay-usulu (yore yumusat + eksik
 *      bilesen): Levant kozlemis patlican + tahin pattern (baba
 *      ghanoush). Hatay 600+ yemek Levant esintili, Antakya mutfak
 *      Aleppo ekoluyle yakin (Wikipedia). Eksik klasik bilesen:
 *      zeytinyagi + sogan + tuz + kimyon + maydanoz. servingSuggestion'
 *      da 'haslanmis bir dilim yumurta' tuhaf. Title 'Antakya Esintili
 *      Tahinli Patlican Corbasi'. 5 ingredient_add (zeytinyagi +
 *      sogan + tuz + kimyon + maydanoz), 5 step replace temiz akis.
 *
 *   3. tavuklu-eristeli-tava-polonya-usulu (cuisine 'pl' KORUNUR +
 *      yumusat + eksik klasik bilesen): Polonya klasik kluski erişte
 *      ailesi (Wikipedia); kremsi tavuk modern Dogu Avrupa fusion.
 *      Dereotu+maydanoz+krema klasik PL garnish. Title 'Polonya
 *      Esintili Kremali Tavuklu Eriste Tava'. 6 ingredient_add (sogan
 *      + sarimsak + tereyagi + dereotu + tuz + karabiber), 7 step
 *      replace.
 *
 *   4. tahinli-peynirli-pide-tekirdag-usulu (yore yumusat + mayali
 *      hamur eksik bilesen + sure fix): Pide CI Sanliurfa/Malatya/
 *      Afyon (Wikipedia); Tekirdag tahinli-peynirli pide kanonik
 *      kayit YOK. Tekirdag kofte ile taninir, tahinli kek Edirne
 *      klasigi. Modern fusion. Klasik pide hamuru: un + maya + tuz
 *      + ilik su + zeytinyagi (60 dk fermantasyon). DB 20 dk
 *      mayalanma YETERSIZ. Title 'Trakya Esintili Tahinli Peynirli
 *      Pide'. 5 ingredient_add (tuz + toz seker + ilik su + sivi yag
 *      + maydanoz), prep 22→80 dk (60 dk mayalanma dahil), 7 step
 *      replace mayali hamur + 220°C 14 dk akisi.
 *
 *   5. sumakli-fasulye-piyazi-igdir-usulu (yore + tutarsizlik fix):
 *      Igdir kanonu (Tatil Budur): bozbas + tas kofte + omacasi +
 *      evelik. Sumakli fasulye piyazi yore kayit YOK; klasik Turk
 *      piyazi (Yemek.com + Kevserin Fasulye Piyazi). DB step 3 limon
 *      suyu LISTEDE YOK + step 2 tuz LISTEDE YOK = TUTARSIZLIK.
 *      Title 'Sumakli Fasulye Piyazi'. 4 ingredient_add (limon suyu
 *      + tuz + karabiber + opsiyonel pul biber), 6 step replace.
 *
 *   6. tavuklu-mantarli-kesme-makarna-zonguldak-usulu (yore yumusat +
 *      eksik klasik bilesen): Zonguldak kanonu komec corbasi + hamsi
 *      pilavi + tirit + kabak cicegi dolmasi. Tavuklu mantarli kesme
 *      makarna kanonik kayit YOK; klasik Turk ev mutfagi (Refika +
 *      GZT Lokma). DB hicbir aromatik (sogan/sarimsak/yag/tuz) YOK.
 *      Title 'Tavuklu Mantarli Kesme Makarna'. 7 ingredient_add
 *      (sogan + sarimsak + tereyagi + zeytinyagi + tuz + karabiber +
 *      maydanoz), 8 step replace.
 *
 *   7. tahinli-uzumlu-corek-ankara-usulu (definition fix +
 *      BOILERPLATE LEAK + sure fix): Klasik mayali rulo corek (GZT
 *      Lokma + Kevserin + Arda Mutfagi); 60 dk mayalanma + 22-25 dk
 *      firin standart. Ankara spesifik kayit YOK. DB description
 *      'mayali hamuru' MAYA LISTEDE YOK = TUTARSIZLIK. tipNote
 *      'peynirli doku sertlesir' BOILERPLATE LEAK. Step 2 'tavayi
 *      orta ateste 2 dk isitin' BOILERPLATE LEAK. Title 'Tahinli
 *      Uzumlu Rulo Corek'. 6 ingredient_add (kuru maya + toz seker +
 *      tuz + yumurta + tarcin + opsiyonel pekmez), 2 amount change
 *      (sut 0.75→1 sb + tereyagi 30→50 gr), total 40→145 dk (60 dk
 *      mayalanma + 22-25 dk firin), 11 step replace, tipNote/serving
 *      boilerplate leak temizle.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-18.ts
 *   npx tsx scripts/fix-mini-rev-batch-18.ts --env prod --confirm-prod
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
  // ─── 1: tahinli-zahterli-yumurta-durumu-antalya (Antakya yumusat) ─
  {
    type: "rewrite",
    slug: "tahinli-zahterli-yumurta-durumu-antalya-usulu",
    reason:
      "REWRITE yore yumusat + tortilla fix + eksik bilesen. Zahter Levant baharati (Suriye/Lubnan/Filistin/Urdun klasik, Wikipedia + Manakish). Antalya zahter klasigi kanitsiz; Hatay/Antakya zahter merkezi (Hatay mutfagi Wikipedia, Suriye sinir kulturel paylasim). DB tipNote'ta 'tortilla' YANLIS (listede lavas). Title 'Antakya Esintili Tahinli Zahterli Yumurta Durumu'. 4 ingredient_add (zeytinyagi + tuz + karabiber + taze maydanoz veya nane), 5 step replace, tipNote tortilla→lavas KRITIK fix.",
    sources: [
      "https://en.wikipedia.org/wiki/Za%27atar",
      "https://en.wikipedia.org/wiki/Manakish",
      "https://tr.wikipedia.org/wiki/Hatay_mutfa%C4%9F%C4%B1",
    ],
    newTitle: "Antakya Esintili Tahinli Zahterli Yumurta Dürümü",
    description:
      "Antakya esintili pratik bir kahvaltı dürümü. Tahin ve zahterin Levant mutfağındaki klasik eşleşmesi, sıcak lavaşa sarılmış yumurtayla buluşuyor; sade ve doyurucu bir başlangıç oluyor.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Taze maydanoz veya nane", amount: "4", unit: "dal" },
    ],
    tipNote:
      "Lavaşı tavada veya tost makinesinde kısa süre ısıtın; dürüm sarılırken çatlamaz. Zahter taze açılmışsa aroması belirgindir, kapağı sıkı kapalı saklayın.",
    servingSuggestion:
      "Yanına demli çay ve birkaç dilim domates, salatalık koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tahini bir kâseye alın, üzerine zahter ve 1 yemek kaşığı zeytinyağını ekleyip pürüzsüz akıcı sosa karıştırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavada kalan zeytinyağını orta ateşte ısıtın, yumurtaları kırın; tuz ve karabiber serpip kapağı kapatın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yumurtalar 3 dakika beyazlar tutana kadar kapaklı pişirin (sarısı akışkan kalsın).", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Lavaşları kuru tavada veya tost makinesinde 1 dakika ısıtın, sararken çatlamasın.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Lavaşa tahin-zahter sosunu sürün, üzerine yumurtayı yerleştirin, taze maydanoz veya nane serpip rulo sarın; ortadan kesip servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: tahinli-patlican-corbasi-hatay (Antakya + eksik) ──────────
  {
    type: "rewrite",
    slug: "tahinli-patlican-corbasi-hatay-usulu",
    reason:
      "REWRITE yore yumusat + eksik klasik bilesen + servis fix. Levant kozlemis patlican + tahin pattern (baba ghanoush). Hatay 600+ yemek Levant esintili, Antakya mutfak Aleppo ekoluyle yakin (Wikipedia Hatay mutfagi + Hatay Province). Eksik klasik bilesen: zeytinyagi + sogan + tuz + kimyon + maydanoz (yok). servingSuggestion'da 'haslanmis bir dilim yumurta' TUHAF (corba yapisina uymuyor). Title 'Antakya Esintili Tahinli Patlican Corbasi'. 5 ingredient_add, 5 step replace temiz akis (sogan zeytinyagda + kimyon + patlican + su + ocak kapali tahin/limon).",
    sources: [
      "https://tr.wikipedia.org/wiki/Hatay_mutfa%C4%9F%C4%B1",
      "https://en.wikipedia.org/wiki/Baba_ghanoush",
      "https://en.wikipedia.org/wiki/Hatay_Province",
    ],
    newTitle: "Antakya Esintili Tahinli Patlıcan Çorbası",
    description:
      "Antakya esintili tahinli patlıcan çorbası, közlenmiş patlıcanın dumanlı aromasını tahinin kremsi yapısıyla birleştiriyor. Sarımsak ve limon dengesi Levant mutfağının klasik üçlüsü; çorba haline gelmiş bir baba ganuş yorumu gibi düşünebilirsiniz.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Soğan", amount: "1", unit: "küçük adet" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Taze maydanoz", amount: "4", unit: "dal" },
    ],
    tipNote:
      "Tahini ocak kapatıldıktan sonra ekleyin; kaynayınca acılaşır ve pürüzlü kıvam alır. Patlıcanı közlerken kabuğunda küçük delikler açın, içerideki buhar dağılır.",
    servingSuggestion:
      "Üzerine bir tutam pul biber ve sızma zeytinyağı gezdirin, yanına sıcak lavaş verin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patlıcanları közleyin, soğuyunca kabuklarını soyup iri doğrayın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Tencerede zeytinyağını ısıtın, ince doğranmış soğanı orta ateşte 4 dakika pembeleştirin; sarımsağı ve kimyonu ekleyip 30 saniye kavurun.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Közlenmiş patlıcanı ekleyip 2 dakika çevirin, üzerine 4 su bardağı sıcak suyu ve tuzu ilave edin; kaynayınca kısık ateşte 10 dakika pişirin.", timerSeconds: 720 },
      { stepNumber: 4, instruction: "El blenderı ile çorbayı kısa pürelendirin (tamamen pürüzsüz olmasın, doku kalsın); ocağı kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tahini ayrı kapta sıcak çorba suyuyla açın, çorbaya yedirin; limon suyunu ekleyip karıştırın, maydanozla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tavuklu-eristeli-tava-polonya (cuisine pl korunur) ───────
  {
    type: "rewrite",
    slug: "tavuklu-eristeli-tava-polonya-usulu",
    reason:
      "REWRITE yumusat + eksik klasik bilesen. Cuisine 'pl' KORUNUR (Dogu Avrupa esintisi). Polonya klasik kluski eriste ailesi (Wikipedia Polish cuisine + Kluski); kremsi tavuklu varyant modern PL fusion. Dereotu (koperek) + krema (śmietana) klasik PL garnish (Wikipedia PL Herbs). Step jenerik scaffold; sogan/sarimsak/yag/aromatik YOK. Title 'Polonya Esintili Kremali Tavuklu Eriste Tava'. 6 ingredient_add (sogan + sarimsak + tereyagi + taze dereotu + tuz + karabiber), 7 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Polish_cuisine",
      "https://en.wikipedia.org/wiki/Kluski",
      "https://en.wikipedia.org/wiki/Polish_cuisine#Herbs",
    ],
    newTitle: "Polonya Esintili Kremalı Tavuklu Erişte Tava",
    description:
      "Polonya esintili kremalı tavuklu erişte tava, Doğu Avrupa ev mutfağının pratik bir yorumu. Tavuk, soğan ve sarımsak tereyağında kavruluyor; krema ve dereotu Polonya mutfağının klasik bitirici ikilisi olarak yemeğe kimliğini veriyor.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "orta adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Taze dereotu", amount: "4", unit: "dal" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Krema yüksek ateşte kesilebilir, ocağı kısın ve sürekli karıştırın. Dereotunu ocak kapandıktan sonra ekleyin, aroması uçmasın.",
    servingSuggestion:
      "Yanına salatalık-yoğurt salatası (mizeria) ve bir dilim çavdar ekmeği koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada tereyağını eritin, ince doğranmış soğanı orta ateşte 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Ezilmiş sarımsağı ekleyip 30 saniye çevirin; tavuk küplerini ilave edip yüksek ateşte 5 dakika tüm yüzeyleri kapanana kadar kavurun.", timerSeconds: 330 },
      { stepNumber: 4, instruction: "2 su bardağı sıcak suyu dökün, kısık ateşte kapağı kapalı 8 dakika pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Erişteyi ekleyip karıştırın, gerekirse yarım su bardağı sıcak su ilave edin; kapaklı 5 dakika daha pişirin.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Kremayı ilave edin, kısık ateşte sürekli karıştırarak 3 dakika koyulaştırın.", timerSeconds: 180 },
      { stepNumber: 7, instruction: "Ocağı kapatın, ince kıyılmış dereotunu serpin; 2 dakika dinlendirip sıcak servis edin.", timerSeconds: 120 },
    ],
  },

  // ─── 4: tahinli-peynirli-pide-tekirdag (mayali eksik + sure fix) ─
  {
    type: "rewrite",
    slug: "tahinli-peynirli-pide-tekirdag-usulu",
    reason:
      "REWRITE yore yumusat + mayali hamur eksik bilesen + sure fix. Pide CI Sanliurfa/Malatya/Afyon (Wikipedia); Tekirdag tahinli-peynirli pide kanonik kayit YOK. Tekirdag kofte ile taninir, tahinli kek Edirne klasigi. Modern fusion. Klasik pide hamuru: un + maya + tuz + ilik su + zeytinyagi (60 dk fermantasyon standart). DB 20 dk mayalanma YETERSIZ. Title 'Trakya Esintili Tahinli Peynirli Pide'. 5 ingredient_add (tuz + toz seker + ilik su + sivi yag + maydanoz), prep 22→80 dk (60 dk mayalanma dahil), 7 step replace.",
    sources: [
      "https://tr.wikipedia.org/wiki/Pide",
      "https://en.wikipedia.org/wiki/Pide",
      "https://tr.wikipedia.org/wiki/Tekirda%C4%9F",
    ],
    newTitle: "Trakya Esintili Tahinli Peynirli Pide",
    description:
      "Tahinli peynirli pide, mayalı hamurun üzerine yayılan tahin ve beyaz peynir harcının fırında buluştuğu pratik bir tuzlu pide yorumu. Tahinin bademimsi tonu peynirin tuzunu yumuşatıyor; klasik pide formuna yeni bir denge katıyor.",
    prepMinutes: 80,
    cookMinutes: 14,
    totalMinutes: 94,
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "çay kaşığı" },
      { name: "Ilık su", amount: "1", unit: "su bardağı" },
      { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı" },
      { name: "Taze maydanoz", amount: "4", unit: "dal" },
    ],
    tipNote:
      "Hamur en az 60 dakika mayalanmalı; kısa fermantasyon pidenin gözenekli yapısını bozar. Tahini peynirle karıştırırken yedirmeyin, harç mermerli görünsün.",
    servingSuggestion:
      "Sıcakken dilimleyin, yanına ayran ve birkaç dilim domates koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ilık suya kuru maya ve toz şekeri ekleyip 5 dakika köpürene kadar bekletin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Geniş kâseye unu, tuzu, sıvı yağı ve mayalı suyu alın; pürüzsüz yumuşak hamur olana kadar 8 dakika yoğurun.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Üzerini örtüp ılık ortamda 60 dakika mayalandırın; iki katına çıksın.", timerSeconds: 3600 },
      { stepNumber: 4, instruction: "Hamuru havasını alın, 2 eşit parçaya bölüp oval şekilde açın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Beyaz peyniri tahinle hafifçe karıştırın (tam yedirmeyin, mermerli kalsın); ince doğranmış maydanozu ekleyin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Harcı pidenin ortasına yayın, kenarları kıvırıp şekil verin; üzerine susam serpin.", timerSeconds: null },
      { stepNumber: 7, instruction: "220°C ön ısıtılmış fırında 14 dakika kızarana kadar pişirin; sıcak servis edin.", timerSeconds: 840 },
    ],
  },

  // ─── 5: sumakli-fasulye-piyazi-igdir (TUTARSIZLIK FIX + yumusat) ─
  {
    type: "rewrite",
    slug: "sumakli-fasulye-piyazi-igdir-usulu",
    reason:
      "REWRITE yore yumusat + TUTARSIZLIK FIX. Igdir kanonu (Tatil Budur): bozbas + tas kofte + omacasi + evelik. Sumakli fasulye piyazi yore kayit YOK; klasik Turk piyazi (Yemek.com + Kevserin). DB step 3 'limon suyu ile sumagi acin' diyor LISTEDE LIMON SUYU YOK; step 2 'tuzlayin' diyor LISTEDE TUZ YOK = KRITIK TUTARSIZLIK. Title 'Sumakli Fasulye Piyazi'. 4 ingredient_add (limon suyu + tuz + karabiber + opsiyonel pul biber), 6 step replace.",
    sources: [
      "https://www.tatilbudur.com/blog/igdir-yemekleri-igdirin-meshur-yemekleri-listesi/",
      "https://yemek.com/tarif/piyaz/",
      "https://www.kevserinmutfagi.com/fasulye-piyazi-tarifi.html",
    ],
    newTitle: "Sumaklı Fasulye Piyazı",
    description:
      "Sumakla mayhoşlanan kuru fasulye piyazı, ızgara yanına ya da meze tabağına çok yakışır. Soğanı önce tuzlayıp yıkamak keskinliği alır; sosu ayrı çırpıp en sonda eklemek piyazı sulandırmaz.",
    prepMinutes: 15,
    cookMinutes: 0,
    totalMinutes: 25,
    ingredientsAdd: [
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Pul biber (opsiyonel)", amount: "0.25", unit: "çay kaşığı" },
    ],
    tipNote:
      "Fasulye sıcakken sosla karıştırırsanız piyaz sulu olur, oda sıcaklığında birleştirin. Soğanı tuzla ovup yıkamak acılığı alır.",
    servingSuggestion:
      "Yanına haşlanmış yumurta dilimleri ve ızgara köfte koyabilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yarım ay ince doğrayın, tuzla ovun, soğuk suda yıkayıp süzün; acılığı alınır.", timerSeconds: null },
      { stepNumber: 2, instruction: "Haşlanmış kuru fasulyeyi süzün, oda sıcaklığına getirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Ayrı kâsede sumak, limon suyu, zeytinyağı, tuz ve karabiberi çırparak sos hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Fasulye, soğan ve sosu büyük kâsede dikkatlice harmanlayın, fasulyeleri ezmemeye özen gösterin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerini örtüp 10 dakika oda sıcaklığında dinlendirin; sumak fasulyeye otursun.", timerSeconds: 600 },
      { stepNumber: 6, instruction: "Servis tabağına alın, ince kıyılmış maydanoz ve opsiyonel pul biber serpip sunun.", timerSeconds: null },
    ],
  },

  // ─── 6: tavuklu-mantarli-kesme-makarna-zonguldak (eksik bilesen) ─
  {
    type: "rewrite",
    slug: "tavuklu-mantarli-kesme-makarna-zonguldak-usulu",
    reason:
      "REWRITE yore yumusat + eksik klasik bilesen. Zonguldak kanonu komec corbasi + hamsi pilavi + tirit + kabak cicegi dolmasi. Tavuklu mantarli kesme makarna kanonik kayit YOK; klasik Turk ev mutfagi (Refika + GZT Lokma). DB hicbir aromatik (sogan/sarimsak/yag/tuz/karabiber/maydanoz) YOK = jenerik scaffold. Title 'Tavuklu Mantarli Kesme Makarna'. 7 ingredient_add (kuru sogan + sarimsak + tereyagi + zeytinyagi + tuz + karabiber + maydanoz), 8 step replace.",
    sources: [
      "https://www.refikaninmutfagi.com/tavuklu-mantarli-makarna-1653",
      "https://yemektarifleri.gzt.com/lokma/mantarli-tavuklu-makarna-38406",
    ],
    newTitle: "Tavuklu Mantarlı Kesme Makarna",
    description:
      "Kesme makarnanın hamur dokusu, tereyağında kavrulan tavuk ve mantarla buluşunca tek tencere doyurucu yemeğe dönüşür. Karadeniz mutfağında kesme makarna geleneği güçlüdür; tavuklu yorumu ev sofrasının modern halidir.",
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Zeytinyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Taze maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Mantarı önce yüksek ateşte suyunu çekene kadar kavurursanız sulanmaz, ardından tavuğa ekleyin. Kesme makarnayı çok karıştırmayın, hamur kıvamı bozulur.",
    servingSuggestion:
      "Yanına cacık ya da yoğurt çok yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuğu 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tencerede tereyağı ve zeytinyağını ısıtın; tavuğu yüksek ateşte 5 dakika tüm yüzeyleri kapanana kadar kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Ince doğranmış soğanı ekleyip orta ateşte 4 dakika pembeleştirin; ezilmiş sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Dilimlenmiş mantarı ekleyin, suyunu çekene kadar 5 dakika yüksek ateşte kavurun.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "3 su bardağı sıcak suyu ekleyin, kaynamasını bekleyin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kesme makarnayı ekleyin, ara ara hafif karıştırarak 10-12 dakika al dente kıvamına gelene kadar pişirin.", timerSeconds: 660 },
      { stepNumber: 7, instruction: "Ocaktan alın, 5 dakika kapağı kapalı dinlendirin; makarna suyunu çeksin.", timerSeconds: 300 },
      { stepNumber: 8, instruction: "Kıyılmış maydanozla süsleyip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: tahinli-uzumlu-corek-ankara (BOILERPLATE LEAK + sure fix) ─
  {
    type: "rewrite",
    slug: "tahinli-uzumlu-corek-ankara-usulu",
    reason:
      "REWRITE definition fix + BOILERPLATE LEAK temizle + sure fix + yore yumusat. Klasik mayali rulo corek (GZT Lokma + Kevserin + Arda Mutfagi); 60 dk mayalanma + 22-25 dk firin standart. Ankara spesifik kayit YOK. DB description 'mayali hamuru' MAYA LISTEDE YOK = KRITIK TUTARSIZLIK. tipNote 'peynirli doku sertlesir' BOILERPLATE LEAK (corek tarifinde peynir cumlesi). Step 2 'tavayi orta ateste 2 dk isitin' BOILERPLATE LEAK (firin tarifi tava degil). Title 'Tahinli Uzumlu Rulo Corek'. 6 ingredient_add (kuru maya + toz seker + tuz + yumurta + tarcin + opsiyonel pekmez), 2 amount change (sut 0.75→1 sb + tereyagi 30→50 gr), total 40→145 dk (60 dk mayalanma + 22 dk firin), 11 step replace temiz akis. tipNote/serving boilerplate leak temizle.",
    sources: [
      "https://www.gzt.com/lokma/tahinli-uzumlu-corek-28168",
      "https://www.kevserinmutfagi.com/tahinli-corek-tarifi.html",
      "https://www.ardaninmutfagi.com/yemek-tarifleri/tatlilar/uzumlu-corek",
    ],
    newTitle: "Tahinli Üzümlü Rulo Çörek",
    description:
      "Klasik mayalı rulo çöreğin tahin ve kuru üzümle buluşan en sevilen yorumu. Tahinin hafif buruk lezzeti üzümün doğal tatlılığıyla dengelenir; mayalanmış hamur fırından çıkınca yumuşak ve katmanlıdır.",
    difficulty: Difficulty.MEDIUM,
    prepMinutes: 95,
    cookMinutes: 25,
    totalMinutes: 120,
    ingredientsAmountChange: [
      { name: "Süt", newAmount: "1", newUnit: "su bardağı" },
      { name: "Tereyağı", newAmount: "50", newUnit: "gr" },
    ],
    ingredientsAdd: [
      { name: "Kuru maya", amount: "10", unit: "gr" },
      { name: "Toz şeker", amount: "5", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Tarçın", amount: "1", unit: "çay kaşığı" },
      { name: "Üzüm pekmezi (opsiyonel iç harç)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Mayanın etkin olması için süt ılık olmalı; sıcak süt mayayı öldürür. Hamur iki katına çıkana kadar bekleyin, aceleci mayalanma çörekleri sıkı yapar.",
    servingSuggestion:
      "Sabah kahvaltısında demli çay veya akşamüstü Türk kahvesi yanına çok yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sütü vücut sıcaklığına ısıtın; kuru maya ve 1 yemek kaşığı şekeri ekleyip 5-10 dakika köpürene kadar bekleyin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Mayalı süte yumurtayı, eritilmiş tereyağını, kalan şekeri ve tuzu ekleyip çırpıcıyla karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Unu yavaş yavaş ekleyerek ele yapışmayan yumuşak hamur olana kadar 8-10 dakika yoğurun.", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Hamurun üzerini örtüp ılık ortamda 60 dakika mayalandırın; iki katına çıkmalı.", timerSeconds: 3600 },
      { stepNumber: 5, instruction: "İç harç için tahini, tarçını ve opsiyonel pekmezi karıştırın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Hamurun havasını alın, dikdörtgen şeklinde ince açın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Tahin harcını hamura ince yayın, kuru üzümleri eşit dağıtın.", timerSeconds: null },
      { stepNumber: 8, instruction: "Hamuru sıkı bir şekilde rulo halinde sarın.", timerSeconds: null },
      { stepNumber: 9, instruction: "Ruloyu dilimleyin, yağlı kâğıt serili tepsiye dizin; üzerini örtüp 15 dakika daha dinlendirin.", timerSeconds: 900 },
      { stepNumber: 10, instruction: "Üzerine yumurta sarısı sürün, susam serpin.", timerSeconds: null },
      { stepNumber: 11, instruction: "180°C ön ısıtılmış fırında 22-25 dakika altın renge dönene kadar pişirin; ılık servis edin.", timerSeconds: 1380 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-18");
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
              paket: "oturum-29-mini-rev-batch-18",
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
