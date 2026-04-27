/**
 * Tek-seferlik manuel mini-rev batch 9 (oturum 28): 7 Mod K v2
 * MAJOR_ISSUE KRITIK fix. Web research 2 paralel agent + 21+ kaynak
 * (Wikipedia / Happy Kitchen / georgianrecipes.net / Çemen Vikipedi /
 * Tokat Çemeni blog.yorenizden + kelkitgazetesi + enyenimodeller /
 * Tonkatsu + Chicken katsu Wikipedia + Just One Cookbook + Tasting
 * Table / Peru Delights + Eat Peru + Pilar's Chilean Food /
 * 196 Flavors + Goya Foods + iCuban / Wikipedia Al pastor + Rick
 * Bayless + Villa Cocina + Muy Delish / Cumhuriyet + Refika +
 * Kolay Lezzet).
 *
 * Verdict: 7 REWRITE (1 KRITIK cuisine fix + 1 KIBE-MUMBAR data
 * corruption + 5 disambiguate/content tamamlama). Paket ge cuisine
 * code (Gurcu) eklenmesini de kapsar (src/lib/cuisines.ts 9 location,
 * oturum 28 cl pattern; CUISINE_CODES 38 → 39).
 *
 *   1. tkemali (REWRITE + KRITIK CUISINE FIX ru→ge): Tkemali Gurcu
 *      klasik eksi erik sosu (Wikipedia + Happy Kitchen + georgian
 *      recipes 3 kaynak). DB cuisine 'ru' (Rus mutfagi!) yanlis.
 *      Tarifle CUISINE_CODES'a ge (Gurcu) eklendi. 4 ingredient_add
 *      (dereotu + nane + tuz + kisnis tohumu), step revize (klasik
 *      yarpuz/ombalo yerine nane ikamesi).
 *
 *   2. tokat-cemeni (REWRITE, KIBE-MUMBAR pattern): Klasik Tokat
 *      cemeni meze formu = domates+biber salcasi + sarimsak + ceviz
 *      + kimyon + zeytinyagi (Vikipedi + blog.yorenizden + kelkit
 *      gazetesi 3 kaynak). DB tarif biber salcasi YOK + boilerplate
 *      step var. 3 ingredient_add (biber salcasi + pul biber +
 *      karabiber), 6→4 step (boilerplate temizligi).
 *
 *   3. tokyo-tonkatsu-pirinc-kasesi (REWRITE light, jeyuk-bokkeum/
 *      spaghetti-carbonara pattern): Tonkatsu domuz eti ile ozdes
 *      (Wikipedia ton=domuz, katsu=cutlet). Mevcut DB tavuk katsu /
 *      torikatsu profilinde. Title disambiguate ("Tokyo Tavuk Katsu
 *      Pirinc Kasesi"), description Turk uyarlama notu. Slug korunur.
 *
 *   4. suspiro-limeno-peru-lima-usulu (REWRITE buyuk): Lima somurge
 *      donemi klasik tatlisi (Peru Delights + Eat Peru + Pilar's
 *      Chilean Food 3 kaynak). DB'de yumurta sarisi + porto sarabi
 *      yok (klasik manjar blanco yumurta sarisi + condensed milk;
 *      Italian meringue port wine ile yapilir). 3 ingredient_add
 *      (yumurta sarisi + porto sarabi + tarcin), 4→6 step, pisirme
 *      720s → 1800s (klasik 30 dk).
 *
 *   5. tamal-en-cazuela (REWRITE buyuk): Kuba klasigi mısır lapası
 *      (196 Flavors + Goya Foods + iCuban + A Sassy Spoon 4 kaynak).
 *      DB'de sofrito (sogan+sarimsak+biber kavurmasi) + kimyon +
 *      kekik + limon (acı turunç ikamesi) + misir unu (cornmeal,
 *      polenta kıvamı için zorunlu) + zeytinyağı + tuz YOK. 8
 *      ingredient_add, 6 step revize (45 dk pisirme klasik). Dana
 *      uyarlama disambiguate (klasik domuz/lechón).
 *
 *   6. tacos-al-pastor (REWRITE buyuk): Meksika sokak yemegi klasigi
 *      (Wikipedia + Rick Bayless + Villa Cocina + Muy Delish 4 kaynak).
 *      Klasik marinasyon: guajillo + ancho biber + achiote + sirke +
 *      ananas + sarimsak + kimyon + tarcin (1920'lerde Lubnanli
 *      gocmenlerin shawarma'sindan adapte). DB'de jenerik "aci biber
 *      puresi", marinasyon 30 dk yetersiz. 11 ingredient_add (achiote
 *      + guajillo + ancho + sirke + sarimsak + kimyon + kekik +
 *      tarcin + tuz + kisnis + lime), aci biber puresi remove,
 *      marinasyon 4 saat (14400s).
 *
 *   7. tepsi-kebabi-adana-ev-usulu (REWRITE + title degisimi): Tepsi
 *      kebabi Antakya/Hatay klasigi (Cumhuriyet + Refika + Kolay
 *      Lezzet 3 kaynak), Sanliurfa cografi isaret tescil 217. Adana
 *      atfi yanlis (Adana klasik kebabi durum/sis/ciger). Slug
 *      korunur (URL break onleme), title "Tepsi Kebabi (Antakya
 *      Ev Usulu)". 8 ingredient_add (sogan + maydanoz + isot +
 *      karabiber + kimyon + 2 salca + zeytinyagi), 7→6 step.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description check).
 * Slug korunur (URL break onleme; pina-colada/pupusa pattern).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-9.ts
 *   npx tsx scripts/fix-mini-rev-batch-9.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen, Difficulty } from "@prisma/client";
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
  // ─── REWRITE 1: tkemali (KRITIK CUISINE FIX ru→ge) ───────────
  {
    type: "rewrite",
    slug: "tkemali",
    reason:
      "KRITIK CUISINE FIX: ru (Rus mutfagi!) → ge (Gurcu). Tkemali klasik Gurcu eksi erik sosu (Wikipedia + Happy Kitchen + georgianrecipes.net 3 kaynak). Tarifle CUISINE_CODES'a ge (Gurcu) eklendi (oturum 28 cl pattern). Klasik bilesenler: eksi erik + sarimsak + kisnis + ombalo (yarpuz, Mentha pulegium) + dereotu + aci biber. Mevcut DB'de dereotu + nane (yarpuz ikamesi) + tuz + kisnis tohumu eksik. Step revize edildi.",
    sources: [
      "https://en.wikipedia.org/wiki/Tkemali",
      "https://happykitchen.rocks/tkemali-georgian-plum-sauce-khmeli-suneli-seasoning-recipe/",
      "https://georgianrecipes.net/2013/06/22/green-tkemali-sour-plum-sauce/",
    ],
    cuisine: "ge",
    description:
      "Tkemali, ekşi erik, sarımsak, kişniş ve yarpuz/nane ile pişirilen klasik Gürcü sosudur. Izgara et (mtsvadi), patates ve sebzelerin yanına soğuk verilir; Kafkas mutfağının asit dengesini taşır.",
    ingredientsAdd: [
      { name: "Dereotu", amount: "1", unit: "demet" },
      { name: "Nane", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Kişniş tohumu (öğütülmüş)", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Erikleri kabukları çatlayana kadar pişirin; çekirdekler kolay ayrılır. Klasik tarifte yarpuz (ombalo) kullanılır, bulunmazsa taze nane güvenli ikamesidir.",
    servingSuggestion:
      "Izgara et (mtsvadi), kızarmış patates veya sebze yanında soğuk servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ekşi erikleri yıkayıp az suyla 12-15 dakika kabukları çatlayana kadar haşlayın.", timerSeconds: 810 },
      { stepNumber: 2, instruction: "Erikleri süzgeçten geçirip püre yapın, çekirdekleri ayırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Püreyi tencereye alın, ezilmiş sarımsak, kıyılmış kişniş, dereotu ve naneyi ekleyip 5 dakika kısık ateşte pişirin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Pul biber, kişniş tohumu ve tuzu ekleyin, 1-2 dakika daha karıştırıp ateşten alın.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "Sosu tamamen soğutun, cam kavanoza alıp buzdolabında dinlendirin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 2: tokat-cemeni (KIBE-MUMBAR pattern) ───────────
  {
    type: "rewrite",
    slug: "tokat-cemeni",
    reason:
      "KIBE-MUMBAR pattern. Klasik Tokat cemeni meze formu = domates+biber salcasi + sarimsak + ceviz + kimyon + zeytinyagi (Cemen Vikipedi + blog.yorenizden + kelkit gazetesi 3 kaynak). DB'de biber salcasi YOK (modern Tokat cemeni meze formunun en karakteristik bileseni), boilerplate steps ('malzemeleri olcup ayri kaplara alin' pattern). 3 ingredient_add (biber salcasi + pul biber + karabiber), 6→4 step (boilerplate temizligi).",
    sources: [
      "https://tr.wikipedia.org/wiki/%C3%87emen",
      "https://blog.yorenizden.com/tokat-cemeni-nasil-yapilir/",
      "https://www.kelkitgazetesi.com/tokatin-gizli-hazinesi-ev-yapimi-cemen-tarifi",
    ],
    description:
      "Tokat çemeni, domates ve biber salçası, sarımsak, kimyon ve cevizle yoğrularak hazırlanan baharatlı bir Tokat mezesidir. Ekmeğe sürülerek kahvaltıda veya zeytinyağlıların yanında soğuk meze olarak sunulur.",
    ingredientsAdd: [
      { name: "Biber salçası", amount: "2", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Cevizi fazla çekmeyin, iri tane çemenin ekmek üstündeki dokusunu canlı tutar. Salçanın acılığı tercihe bağlı, sofranıza göre tatlı veya acı biber salçası seçin.",
    servingSuggestion:
      "Kızarmış köy ekmeği ve taze yeşil zeytinle kahvaltıda veya zeytinyağlı yemeklerin yanında soğuk meze olarak sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizi rondoda iri taneli kalacak şekilde çekin, geniş kaseye alın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Domates salçası, biber salçası, ezilmiş sarımsak, kimyon, karabiber, pul biber ve zeytinyağını cevizle iyice yoğurun.", timerSeconds: null },
      { stepNumber: 3, instruction: "Çemeni kapalı kapta buzdolabında en az 1 saat dinlendirin, baharatlar otursun.", timerSeconds: 3600 },
      { stepNumber: 4, instruction: "Kızarmış köy ekmeği dilimleriyle, üzerine birkaç damla zeytinyağı gezdirip serin servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 3: tokyo-tonkatsu-pirinc-kasesi (jeyuk-bokkeum pattern) ─
  {
    type: "rewrite",
    slug: "tokyo-tonkatsu-pirinc-kasesi",
    reason:
      "Jeyuk-bokkeum/spaghetti-carbonara pattern (oturum 27): klasik Japon tonkatsu domuz eti (豚 ton = domuz, カツ katsu = cutlet) ile yapilir (Wikipedia + Tasting Table). Mevcut DB tavuk pirzola = chicken katsu / torikatsu (Just One Cookbook). Title disambiguate gerekli (Turk pazar uyarlamasi acik gostergesi). Slug korunur. Ingredient set ve steps zaten dogru, sadece title + description revize.",
    sources: [
      "https://en.wikipedia.org/wiki/Tonkatsu",
      "https://en.wikipedia.org/wiki/Chicken_katsu",
      "https://www.tastingtable.com/1729669/tonkatsu-vs-tonkotsu-torikatsu-difference/",
    ],
    newTitle: "Tokyo Tavuk Katsu Pirinç Kasesi",
    description:
      "Klasik tonkatsu Japonya'da panko kaplı domuz pirzoladır; bu tarif Türk sofrası için tavuk pirzola ile uyarlanmış chicken katsu (torikatsu) versiyonudur. Çıtır panko, ince lahana, sıcak pirinç ve koyu tonkatsu sosla Tokyo donburi tabağı havasını taşır.",
    tipNote:
      "Panko kaplamayı kızartmadan önce 5 dakika bekletmek dökülmesini azaltır. Klasik tonkatsu domuz pirzola ister; tavuk versiyonu Japonya'da torikatsu adıyla bilinir.",
  },

  // ─── REWRITE 4: suspiro-limeno-peru-lima (klasik bilesen ekle) ──
  {
    type: "rewrite",
    slug: "suspiro-limeno-peru-lima-usulu",
    reason:
      "Lima somurge donemi klasik tatlisi (Peru Delights + Eat Peru + Pilar's Chilean Food 3 kaynak). DB'de yumurta sarisi YOK (klasik manjar blanco yumurta sarisi + condensed milk + sutle pisen yogun krema), porto sarabi YOK (klasik beze italian meringue port wine ile yapilir; Lima imzasi). 3 ingredient_add (yumurta sarisi + porto sarabi + tarcin), vanilya korunur, 4→6 step, pisirme 720s → 1800s (klasik 25-30 dk).",
    sources: [
      "https://perudelights.com/suspiro-a-la-limena-a-poetic-dessert/",
      "https://www.eatperu.com/suspiro-limeno-recipe/",
      "https://www.chileanfoodandgarden.com/suspiro-de-limena-peruvian-dessert/",
    ],
    description:
      "Suspiro a la Limeña, Lima sömürge döneminden günümüze gelen klasik Peru tatlısıdır. Yoğunlaştırılmış sütle pişen yumurta sarısı kreması (manjar blanco) tabanı, üstüne porto şarabıyla sıkılan İtalyan beze ve tarçın serpilerek hazırlanır.",
    ingredientsAdd: [
      { name: "Yumurta sarısı", amount: "4", unit: "adet" },
      { name: "Porto şarabı", amount: "0.25", unit: "su bardağı" },
      { name: "Tarçın", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Manjar blanco'yu tahta kaşıkla sürekli karıştırın, dipte yapışırsa acılaşır. Porto şarabı bezenin Lima imzasıdır; alkolsüz isteyen üzüm pekmezi ve su karışımıyla ikame edebilir.",
    servingSuggestion:
      "Soğuk olarak küçük cam kuplarda sunun, üst beze katmanı bozulmadan kaşıkla yiyin. Üstüne biraz daha tarçın serpebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yoğunlaştırılmış süt, süt ve yarım bardak şekeri tencerede tahta kaşıkla karıştırarak 25-30 dakika koyu karamel rengine ulaşana kadar pişirin (manjar blanco).", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Ateşi kapatın, hafif soğutun. Yumurta sarılarını ayrı kasede çırpıp az miktar sıcak karışımla temperleyin, sonra ana karışıma yedirip 2-3 dakika daha düşük ateşte karıştırın.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Manjar blanco'yu küçük servis kuplarına paylaştırın, üzerini streçle kapatıp tamamen soğutun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kalan yarım bardak şekeri porto şarabıyla küçük tencerede 5 dakika koyulaşana kadar kaynatın (şurup).", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Yumurta aklarını çırpıcıyla katı kıvama getirin, sıcak şurubu ince akıtarak 4 dakika çırpmaya devam edin (italian meringue).", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Bezeyi sıkma torbasına alıp manjar blanco'nun üstüne sıkın, üzerine tarçın serpip soğuk servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 5: tamal-en-cazuela (Kuba klasigi tamamla) ──────
  {
    type: "rewrite",
    slug: "tamal-en-cazuela",
    reason:
      "Kuba klasigi mısır lapası (196 Flavors + Goya Foods + iCuban + A Sassy Spoon 4 kaynak). Klasik bilesenler: domuz omuz (lechon) + sofrito (sogan + sarimsak + biber kavurmasi) + kimyon + kekik + aci turunc + misir unu (cornmeal, polenta kıvamı için zorunlu). DB'de sofrito + kimyon + kekik + limon + misir unu + zeytinyagi + tuz YOK. 8 ingredient_add, step revize (45 dk pisirme klasik). Dana uyarlama disambiguate.",
    sources: [
      "https://www.196flavors.com/tamal-en-cazuela/",
      "https://www.goya.com/en/recipes/tamal-en-cazuela/",
      "https://icuban.com/food/tamal_cazuela.html",
    ],
    newTitle: "Tamal en Cazuela (Küba Mısır Lapası)",
    description:
      "Tamal en Cazuela, Küba'nın klasik mısır lapasıdır (polenta kıvamı). Orijinali domuz eti (lechón) ile yapılır; bu tarif dana kıyma uyarlamasıdır. Mısır püresi, sofrito (soğan, sarımsak, biber) ve domatesle 1 saat pişer; acı turunç yerine limonla, kimyon ve kekikle Küba imzası kurulur.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Kimyon", amount: "1", unit: "çay kaşığı" },
      { name: "Kekik (kuru)", amount: "1", unit: "çay kaşığı" },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Mısır unu", amount: "3", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Klasik tarifte domuz omuz (lechón) kullanılır; dana kıyma Türk pazarı için uyarlamadır. Acı turunç bulunursa limon yerine 1 yemek kaşığı kullanın, Küba imzası belirginleşir.",
    servingSuggestion:
      "Derin kasede, üzerine taze maydanoz; yanına lime dilimi ve hafif soğan turşusu yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Dana kıymayı limon suyu, sarımsak rendesi, kimyon, kekik ve tuz ile 15 dakika marine edin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğanı yemeklik doğrayın, biberi küp doğrayın, domatesi rendeleyin. Taze mısırı rendeleyip kenara alın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tencerede zeytinyağında soğan ve biberi 5 dakika kavurun, sarımsak ekleyip 1 dakika daha çevirin (sofrito tabanı).", timerSeconds: 360 },
      { stepNumber: 4, instruction: "Marine kıymayı ekleyip 8 dakika orta ateşte rengi dönene kadar pişirin. Domatesi katın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Rendelenmiş mısırı ve mısır ununu ilave edin, 1 su bardağı sıcak su ekleyin. 45 dakika kısık ateşte sürekli karıştırın; polenta kıvamı tutsun.", timerSeconds: 2700 },
      { stepNumber: 6, instruction: "Tuz ve baharat dengesini son ayarlayın, 5 dakika dinlendirin, derin kaseye alıp servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── REWRITE 6: tacos-al-pastor (klasik marinasyon ekle) ─────
  {
    type: "rewrite",
    slug: "tacos-al-pastor",
    reason:
      "Meksika sokak yemegi klasigi (Wikipedia + Rick Bayless + Villa Cocina + Muy Delish 4 kaynak). Klasik marinasyon: guajillo + ancho biber + achiote (annatto) + sirke + ananas + sarimsak + kimyon + kekik + tarcin. 1920'lerde Lubnanli gocmenlerin shawarma'sindan Puebla'da uyarlandi. DB'de jenerik 'aci biber puresi', marinasyon 30 dk yetersiz (klasik 4+ saat). 11 ingredient_add (achiote + guajillo + ancho + sirek + sarimsak + 3 baharat + tuz + kisnis + lime), aci biber puresi remove, marinasyon 4 saat (14400s). Dana uyarlama disambiguate (klasik domuz/cerdo).",
    sources: [
      "https://en.wikipedia.org/wiki/Al_pastor",
      "https://www.rickbayless.com/recipe/pastor-style-tacos/",
      "https://villacocina.com/tacos-al-pastor/",
    ],
    description:
      "Tacos al pastor, Meksika sokak yemeği klasiğidir. 1920'lerde Lübnanlı göçmenlerin shawarma'sından Puebla'da uyarlandı; orijinali domuz eti (cerdo) trompo denen dikey ızgarada pişer, biz dana versiyonunu veriyoruz. İmza: guajillo ve ancho biber, achiote (annatto), ananas, sirke ve baharat marinasyonu.",
    ingredientsAdd: [
      { name: "Achiote (annatto) ezmesi", amount: "1", unit: "yemek kaşığı" },
      { name: "Guajillo biber (kuru)", amount: "2", unit: "adet" },
      { name: "Ancho biber (kuru)", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Beyaz sirke", amount: "2", unit: "yemek kaşığı" },
      { name: "Kimyon", amount: "1", unit: "çay kaşığı" },
      { name: "Kekik (kuru)", amount: "1", unit: "çay kaşığı" },
      { name: "Tarçın", amount: "0.25", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Taze kişniş", amount: "0.5", unit: "demet" },
      { name: "Lime", amount: "1", unit: "adet" },
    ],
    ingredientsRemove: ["Acı biber püresi"],
    tipNote:
      "Klasik tarif domuz eti (cerdo, omuz) ister; biz dana uyarlamasını veriyoruz. Achiote (annatto) Türkiye'de baharatçılarda bulunur; renk ve aroma için anahtar bileşen, atlayınca al pastor olmaz, normal taco olur.",
    servingSuggestion:
      "Mısır tortilla, ince doğranmış kırmızı soğan, taze kişniş, küp ananas ve lime; isteğe göre yeşil veya kırmızı salsa.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Guajillo ve ancho biberlerin saplarını ve çekirdeklerini ayıklayın. 10 dakika sıcak suda yumuşatın, sonra süzün.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Yumuşamış biberleri ananas suyu, achiote, sarımsak, sirke, kimyon, kekik, tarçın ve tuz ile blenderda püre yapın. Marinasyon hazır.", timerSeconds: null },
      { stepNumber: 3, instruction: "Dana eti taneye dik 3-4 mm dilimleyin. Marinasyonu üzerine dökün, en az 4 saat (ideali bir gece) buzdolabında bekletin.", timerSeconds: 14400 },
      { stepNumber: 4, instruction: "Çok kızgın tava veya ızgarada eti partiler hâlinde 3-4 dakika çevirerek kenarları gevrekleyene kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Ananası küp doğrayın, son 2 dakikada tavaya ekleyip kıvama getirin. Soğanı ince doğrayın, kişnişi kıyın.", timerSeconds: 120 },
      { stepNumber: 6, instruction: "Mısır tortillaları kuru tavada 30 saniye ısıtın, üzerine et, ananas, soğan ve kişniş koyun. Lime sıkıp servis edin.", timerSeconds: 30 },
    ],
  },

  // ─── REWRITE 7: tepsi-kebabi-adana (yore + harc tamamla) ─────
  {
    type: "rewrite",
    slug: "tepsi-kebabi-adana-ev-usulu",
    reason:
      "Tepsi kebabi Antakya/Hatay klasigi (Cumhuriyet + Refika + Kolay Lezzet 3 kaynak). Sanliurfa cografi isaret tescil 217 (kuzu + Birecik patlicani). Adana atfi yanlis (Adana klasik kebabi durum/sis/ciger). Slug korunur, title 'Tepsi Kebabi (Antakya Ev Usulu)'. Mevcut DB'de sogan + maydanoz + isot + karabiber + kimyon + 2 salca + zeytinyagi YOK (klasik tepsi kebabi harc imzasi). 8 ingredient_add, 7→6 step (boilerplate temizligi).",
    sources: [
      "https://www.cumhuriyet.com.tr/gurme/sekil-verme-derdi-yok-lezzeti-cok-antakya-nin-meshur-tepsi-kebabi-tarifi-2482419",
      "https://www.refikaninmutfagi.com/antakya-tepsi-kebabi-1657",
      "https://www.kolaylezzet.com/kolay-yemek-tarifleri/et-yemekleri/688-tepsi-kebabi-sini-kebabi-hatay-antakya",
    ],
    newTitle: "Tepsi Kebabı (Antakya Ev Usulü)",
    description:
      "Tepsi kebabı (lahm-ı sini, sini kebabı) Hatay-Antakya başta olmak üzere Güneydoğu Anadolu klasiğidir. Şanlıurfa varyantı coğrafi işaret 217 numarayla tescillidir (kuzu eti, Birecik patlıcanı). Bu ev usulü tarif Antakya stiline yakın: kıyma, ince doğranmış soğan, sarımsak, biber, maydanoz ve isotla yoğrulan harç tepsiye yayılır, üzerine domates ve biber dilimleri.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "büyük" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "İsot biberi", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "1", unit: "çay kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Tepsi kebabının tescilli yöresi Şanlıurfa (coğrafi işaret 217). En meşhur ev versiyonu Antakya/Hatay stilidir; isot ve sarımsak imza, patlıcan Antakya'da kullanılmaz, Şanlıurfa stilinde patlıcan dilimleri arasında pişer. Soğanın suyunu sıkmak harcın dağılmasını engeller.",
    servingSuggestion:
      "Sıcak lavaş üzerinde, yanında ayran, közlenmiş biber ve sumaklı soğan piyazıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı çok ince doğrayın, suyunu sıkın. Sarımsağı ezin, maydanozu kıyın, kapya biberlerin yarısını küp doğrayın (yarısı süs için kalsın).", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kapta kıyma, sıkılmış soğan, sarımsak, doğranmış biber, maydanoz, isot, karabiber, kimyon ve tuzu 5 dakika yoğurun; harç hamur kıvamı tutsun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Yağlı tepsiye harcı 1 cm kalınlıkta eşit yayın. Bıçakla 8 üçgen dilim olacak şekilde çizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üzerine domates ve kalan kapya biber halkalarını dizin. Salçaları yarım su bardağı sıcak su ve zeytinyağı ile çırpıp tepsiye gezdirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Önceden ısıtılmış 200°C fırında 35-40 dakika, üzeri kızarana ve sebzeler yumuşayana kadar pişirin.", timerSeconds: 2100 },
      { stepNumber: 6, instruction: "5 dakika dinlendirin; çizilen yerlerden dilimleyip lavaş üzerinde servis edin.", timerSeconds: 300 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-9");
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
              paket: "oturum-28-mini-rev-batch-9",
              changes: {
                title_changed: op.newTitle ? `${recipe.title} -> ${op.newTitle}` : null,
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
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
    const titleNote = op.newTitle ? ` (title değişti)` : "";
    console.log(`✅ ${op.slug}: REWRITE applied${cuisineNote}${titleNote}`);
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
