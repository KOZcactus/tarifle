/**
 * Tek-seferlik manuel mini-rev batch 24 (oturum 30): 6 KRITIK fix.
 *
 * Verify-tracked MAJOR kuyruk kapanış paketi (paketi 16-23 sonrası
 * kalan 6 verify-tracked MAJOR slug). Web research 2 paralel agent +
 * 15+ kaynak (Adıyaman/Şanlıurfa muhammara/acuka klasik + Şanlıurfa
 * İsotu CI 109 + Klasik biber ezmesi şablonu + Anadolu soğanlama
 * pattern + Karamelize soğan tekniği + Kayseri klasik mantı/yağlama/
 * nevzine + Mayalı hamur temel oranları + Tahinli çörek Trakya/
 * Gaziantep/İzmir + Manisa klasik mesir/Manisa kebabı/sübye/sinkonta +
 * Siirt klasik büryan/perde pilavı/sembusek/kavut + Klasik Anadolu
 * şehriye pilavı 1:1.7 oran + Yemek.com Üzüm Şırası Limonatası +
 * Fesleğenli Limonata + Yalova termal/Marmara mutfağı + Klasik kesme/
 * revani pattern + Tekirdağ Hayrabolu/hardal CI 95).
 *
 * Verdict: 6 REWRITE. 0 cuisine fix (6 'tr' korunur). 6 title degisimi.
 *
 * 2 KRITIK TUTARSIZLIK FIX:
 *  - #1 Adıyaman: step 2 'sosu için sarımsak, yoğurt' LİSTEDE YOK
 *  - #4 Siirt: step 3 'tuz, baharat ve ekşi malzeme' LİSTEDE YOK
 *
 * 1 KRITIK TYPO FIX:
 *  - #1 'Köplenmiş' YANLIS YAZIM, klasik 'Közlenmiş' (kapya biber köz)
 *
 * 1 KRITIK BOILERPLATE LEAK FIX:
 *  - #2 Kayseri: step 6 'soğursa gevrek kenarlar yumuşar' (çörek tarif
 *    cümlesi, soğanlama tarif değil)
 *
 * 1 KRITIK ŞERBET EKSIK FIX:
 *  - #6 Tekirdağ: kesme tatlısı klasik şerbetsiz (şeker yok hamurda +
 *    şerbet yok = revani pattern eksik)
 *
 *   1. tahinli-isotlu-koplenmis-biber-ezme-adiyaman-usulu (TUTARSIZLIK
 *      + TYPO + Adıyaman yumuşat): Şanlıurfa İsotu CI 109 (Adıyaman CI
 *      yok); muhammara/acuka klasik (köz biber + ceviz + nar ekşisi +
 *      sarımsak + zeytinyağı). DB step 2 'sarımsak, yoğurt' listede
 *      YOK = TUTARSIZLIK. Title 'Köplenmiş' YAZIM HATASI (description
 *      'köpüklenmiş' diyor, klasik 'Közlenmiş' olmalı). Title 'Adıyaman
 *      Esintili Tahinli İsotlu Közlenmiş Biber Ezmesi' (TYPO fix +
 *      esintili). 4 ingredient_add (sarımsak + limon suyu + tuz +
 *      opsiyonel maydanoz), 5 step replace temiz akış.
 *
 *   2. tahinli-soganlama-kayseri-usulu (BOILERPLATE LEAK + Kayseri
 *      yumuşat): Anadolu soğanlama pattern (karamelize soğan +
 *      tahin/pekmez/sumak); Kayseri klasik (mantı + yağlama + nevzine
 *      CI + sucuk + pastırma); tahinli soğanlama Kayseri özel kanıt
 *      zayıf modern. DB step 6 BOILERPLATE LEAK 'soğursa gevrek
 *      kenarlar yumuşar' (çörek tarif cümlesi). Title 'Tahinli
 *      Soğanlama Kahvaltılığı' (Kayseri düşür). 3 ingredient_add
 *      (tereyağı + opsiyonel pul biber + opsiyonel limon suyu +
 *      opsiyonel ceviz), 5 step replace, total 24→35 dk.
 *
 *   3. tahinli-susamli-corek-manisa-usulu (mayalı hamur eksik + Manisa
 *      yumuşat): Manisa klasik (mesir macunu CI + Manisa kebabı +
 *      sübye + sinkonta); tahinli susamlı çörek Manisa özel kanıt
 *      zayıf. Klasik mayalı çörek pattern (Trakya/Gaziantep/İzmir).
 *      DB eksik klasik mayalı çörek bileşenleri (kuru maya + tuz +
 *      şeker + yumurta sürme). Step 1-2 jenerik scaffold + tava+çörek
 *      uyumsuz. Title 'Tahinli Susamlı Çörek' (Manisa düşür). 4
 *      ingredient_add (kuru maya + tuz + şeker + yumurta sarısı), 6
 *      step replace mayalı hamur klasik akış (maya aktivasyon + yoğur
 *      + 60 dk mayalandırma + tahin/susam yay + rulo sar + 190°C 22
 *      dk fırın), prep 20→90 dk + total 38→112 dk.
 *
 *   4. tavuklu-nohutlu-sehriye-pilavi-siirt-usulu (TUTARSIZLIK +
 *      Siirt yumuşat): Siirt klasik (büryan + perde pilavı + sembusek
 *      + kavut + pirinçli içli köfte); tavuklu nohutlu şehriye Siirt
 *      özel kanıt yok modern. DB step 3 'tuz, baharat ve ekşi malzeme'
 *      LİSTEDE YOK = TUTARSIZLIK. Title 'Tavuklu Nohutlu Şehriye
 *      Pilavı' (Siirt düşür). 6 ingredient_add (kuru soğan + sarımsak
 *      + salça + tereyağı + tuz + karabiber), 1 amount change (su
 *      3→2.5 sb klasik 1:1.7 oran), 6 step replace, total 32→40 dk.
 *
 *   5. uzum-sirali-feslegen-icecegi-yalova-usulu (Yalova yumuşat + step
 *      jenerik fix): Yalova termal turizm + Marmara genel mutfak;
 *      üzüm şıralı fesleğen Yalova özel kanıt yok modern. Klasik
 *      üzüm şırası limonatası serinletici Türk yaz içeceği. DB sadece
 *      3 step jenerik scaffold ('tüm malzemeyi hazırlayın', 'sıvılarını
 *      aromatiklerini karıştırın', 'serin servis'). Title 'Üzüm Şıralı
 *      Fesleğen İçeceği' (Yalova düşür). 2 ingredient_add (limon suyu
 *      + opsiyonel bal), 5 step replace temiz akış (fesleğen ova +
 *      şıra+su+limon+bal karıştır + buzdolabında 30 dk + buzlu süz +
 *      servis), total 5→40 dk soğutma dahil.
 *
 *   6. visneli-cevizli-kesme-tatlisi-tekirdag-usulu (ŞERBET EKSIK +
 *      Tekirdağ yumuşat): Tekirdağ klasik (Hayrabolu tatlısı + hardal
 *      CI 95 + kabak tatlısı + höşmerim); vişneli cevizli kesme Tekirdağ
 *      özel kanıt yok modern. Klasik kesme tatlısı (revani pattern):
 *      hamur + içlik + 180°C fırın + ŞEKER ŞERBET (şeker + su + limon).
 *      DB ŞEKER YOK hamurda + ŞERBET YOK. Title 'Vişneli Cevizli Kesme
 *      Tatlısı' (Tekirdağ düşür). 7 ingredient_add (hamur: toz şeker +
 *      irmik opsiyonel + kabartma tozu + sıvıyağ; şerbet: ek toz şeker
 *      + ek su + limon suyu), 7 step replace klasik revani akış (şerbet
 *      kaynat + hamur yoğur + tepsi + vişne+ceviz serp + 180°C 25-30 dk
 *      + sıcak tatlıya ılık şerbet + 1 saat dinlendir + kare kes), total
 *      45→110 dk şerbet+dinlendirme dahil.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-24.ts
 *   npx tsx scripts/fix-mini-rev-batch-24.ts --env prod --confirm-prod
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
  // ─── 1: adiyaman-biber-ezme (TUTARSIZLIK + TYPO) ─────────────────
  {
    type: "rewrite",
    slug: "tahinli-isotlu-koplenmis-biber-ezme-adiyaman-usulu",
    reason:
      "REWRITE TUTARSIZLIK + TYPO + Adıyaman yumusat. Sanliurfa Isotu CI 109 (Adiyaman CI yok); muhammara/acuka klasik (koz biber + ceviz + nar eksisi + sarimsak + zeytinyagi). DB step 2 'sosu icin sarimsak, yogurt' LISTEDE YOK = TUTARSIZLIK. Title 'Köplenmiş' YAZIM HATASI (description 'köpüklenmiş', klasik 'Közlenmiş' olmali, kapya biber köz). Title 'Adiyaman Esintili Tahinli Isotlu Közlenmis Biber Ezmesi' (TYPO fix + esintili). 4 ingredient_add (sarimsak + limon suyu + tuz + opsiyonel maydanoz), 5 step replace temiz akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Muhammara",
      "https://yemek.com/tarif/koz-biber-ezmesi/",
    ],
    newTitle: "Adıyaman Esintili Tahinli İsotlu Közlenmiş Biber Ezmesi",
    description:
      "Adıyaman ve Şanlıurfa hattının köz biber, tahin, isot üçlüsünden esinlenen meze. Muhammara akrabası bir pattern; sarımsak, limon ve maydanoz tatları ortalar. Lavaş, ekmek arası ya da kahvaltı sofrasının yanında iyi gider.",
    prepMinutes: 20,
    cookMinutes: 25,
    totalMinutes: 45,
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Taze maydanoz (opsiyonel)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Köz biber sıcakken kapalı kapta dinlendirildiğinde kabuk kolayca kalkar; rondo yerine bıçakla kıyıldığında doku kaybolmaz, ezme kıvamı dolgun durur.",
    servingSuggestion:
      "Lavaş veya közlenmiş ekmek üzerinde, yanında dilimlenmiş soğan ve maydanoz dalları ile sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kapya biberleri közleyin (ocak alevinde 8 dakika veya 220°C fırında 25 dakika); sıcakken kapalı kapta 10 dakika dinlendirin.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Soğuyan biberlerin kabuklarını soyun, çekirdeklerini ayıklayın; bıçakla ince kıyın (rondo değil, doku korunur).", timerSeconds: null },
      { stepNumber: 3, instruction: "Sarımsağı rendeleyin; geniş kâsede köz biber, sarımsak, tahin, isot, limon suyu, tuz ve zeytinyağını birleştirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kıvam yoğunsa 1 yemek kaşığı soğuk su ile açın; çatalla harmanlayın, tuzu kontrol edin.", timerSeconds: null },
      { stepNumber: 5, instruction: "15 dakika buzdolabında dinlendirin; servis tabağına alıp üzerine kıyılmış maydanoz ve birkaç damla zeytinyağı gezdirin.", timerSeconds: 900 },
    ],
  },

  // ─── 2: tahinli-soganlama (BOILERPLATE LEAK + Kayseri yumuşat) ───
  {
    type: "rewrite",
    slug: "tahinli-soganlama-kayseri-usulu",
    reason:
      "REWRITE BOILERPLATE LEAK FIX + Kayseri yumusat. Anadolu soganlama pattern (karamelize sogan + tahin/pekmez/sumak); Kayseri klasik (manti + yaglama + nevzine CI + sucuk + pastirma); tahinli soganlama Kayseri ozel kanit zayif modern. DB step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (çörek tarif cumlesi, soganlama degil). Title 'Tahinli Soganlama Kahvaltiligi' (Kayseri dusur). 4 ingredient_add (tereyagi + opsiyonel pul biber + opsiyonel limon suyu + opsiyonel ceviz), 5 step replace, total 24→35 dk.",
    sources: [
      "https://yemek.com/tarif/karamelize-sogan/",
      "https://en.wikipedia.org/wiki/Tahini",
    ],
    newTitle: "Tahinli Soğanlama Kahvaltılığı",
    description:
      "Anadolu mutfağında karamelize soğan ve tahini buluşturan kahvaltılık. Soğanın doğal tatlılığı tahinin yoğunluğunu dengeler; pul biber ve limon dilerseniz keskinlik katar. Lavaş, simit yanı veya ekmek arası iyi durur.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Pul biber (opsiyonel)", amount: "0.5", unit: "çay kaşığı" },
      { name: "Limon suyu (opsiyonel)", amount: "1", unit: "çay kaşığı" },
      { name: "Ceviz iri çekilmiş (opsiyonel)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Soğanı tahinle birleştirmeden önce mutlaka ılıtın; sıcak yağ tahini acılaştırır. Karamelize için orta-düşük ateş ve sabırlı karıştırma anahtar; yüksek ateşte yanar, tatlı nota kaybolur.",
    servingSuggestion:
      "Sıcak lavaş üstüne sürün, yanında zeytin, taze maydanoz ve demli çay ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanları piyazlık ince yarım ay doğrayın, hafif tuz serpip 5 dakika bekletin (su salsın), kâğıt havluyla kurulayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Geniş tavada tereyağı ile zeytinyağını orta-düşük ateşte eritin; soğanları ekleyip ara ara karıştırarak 20-25 dakika pişirin (altın kahve, karamelize).", timerSeconds: 1500 },
      { stepNumber: 3, instruction: "Ocaktan alın, 3-4 dakika ılımaya bırakın (tahin sıcakta acılaşır).", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Kâsede ılımış soğanları, tahini, opsiyonel pul biber ve limon suyunu birleştirin; tuzu kontrol edip ayarlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Servis tabağına alın, üzerine opsiyonel ceviz serpip kahvaltıda lavaş veya ekmek arası sunun.", timerSeconds: null },
    ],
  },

  // ─── 3: tahinli-susamli-corek (mayali hamur eksik) ────────────────
  {
    type: "rewrite",
    slug: "tahinli-susamli-corek-manisa-usulu",
    reason:
      "REWRITE Manisa yumusat + mayali hamur eksik. Manisa klasik (mesir macunu CI + Manisa kebabi + sübye + sinkonta); tahinli susamli corek Manisa ozel kanit zayif. Klasik mayali corek pattern (Trakya/Gaziantep/Izmir). DB eksik klasik mayali corek (kuru maya + tuz + seker + yumurta sürme); step 1-2 jenerik scaffold + tava+corek uyumsuz. Title 'Tahinli Susamli Corek' (Manisa dusur). 4 ingredient_add (kuru maya + tuz + toz seker + yumurta sarisi), 6 step replace klasik mayali akış (maya aktive + yogur + 60 dk mayalanma + tahin/susam yay + rulo sar + 190°C 22 dk firin), prep 20→90 dk + total 38→112 dk.",
    sources: [
      "https://yemek.com/tarif/tahinli-corek/",
      "https://www.kevserinmutfagi.com/tahinli-corek-tarifi.html",
    ],
    newTitle: "Tahinli Susamlı Çörek",
    description:
      "Tahin ve susamın mayalı hamurda buluştuğu klasik Anadolu kahvaltılığı. Rulo sarma tekniğiyle her dilimde tahinli katmanlar açığa çıkar; üst yüzeydeki yumurta sarısı altın bir parlaklık verir. Sıcak veya ılık, çayın yanında iyi gider.",
    prepMinutes: 90,
    cookMinutes: 22,
    totalMinutes: 112,
    ingredientsAdd: [
      { name: "Kuru maya", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "yemek kaşığı" },
      { name: "Yumurta sarısı (üzerine sürme)", amount: "1", unit: "adet" },
    ],
    tipNote:
      "Maya aktivasyonu kritiktir; köpürmüyorsa maya eskimiştir, hamur kabarmaz. Tahini hamura yayarken kenarlardan 1 cm boşluk bırakın; rulo sırasında sızmayı engeller.",
    servingSuggestion:
      "Ilık çörekleri demli çay yanında, isteğe göre beyaz peynir veya pekmez eşliğinde sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ilık suya toz şekeri ve mayayı katıp 5 dakika bekletin; üzeri köpürene kadar aktive edin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Geniş kâsede unu ve tuzu eleyin; ortasını havuz yapıp aktive maya ve zeytinyağını ekleyin. 8-10 dakika yoğurun, ele yapışmayan elastik hamur elde edin.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Hamuru hafif yağlı kâsede üstünü kapatıp ılık ortamda 60 dakika, iki katına çıkana kadar mayalandırın.", timerSeconds: 3600 },
      { stepNumber: 4, instruction: "Hamuru hafif unlanmış tezgâha alın, oklava ile dikdörtgen açın (yaklaşık 40x30 cm). Üzerine tahini eşit yayın, susamın yarısını serpin (kenarlardan 1 cm boşluk bırakın).", timerSeconds: null },
      { stepNumber: 5, instruction: "Uzun kenardan sıkıca rulo sarın, 8 eşit parçaya bölün; yağlı kâğıtlı tepsiye dizin, üzerlerine yumurta sarısını sürüp kalan susamı serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Önceden 190°C'ye ısıtılmış fırında 18-22 dakika, üstü altın kahverengi olana kadar pişirin; tel ızgarada 10 dakika dinlendirip servis edin.", timerSeconds: 1320 },
    ],
  },

  // ─── 4: tavuklu-nohutlu-sehriye-pilavi (TUTARSIZLIK + Siirt) ─────
  {
    type: "rewrite",
    slug: "tavuklu-nohutlu-sehriye-pilavi-siirt-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Siirt yumusat. Siirt klasik (büryan + perde pilavi + sembusek + kavut + pirincli icli kofte); tavuklu nohutlu sehriye Siirt ozel kanit yok modern. DB step 3 'tuz, baharat ve eksi malzeme' LISTEDE YOK = TUTARSIZLIK (paketi 23 Ankara/Yozgat aynı pattern). Title 'Tavuklu Nohutlu Sehriye Pilavi' (Siirt dusur). 6 ingredient_add (kuru sogan + sarimsak + salca + tereyagi + tuz + karabiber), 1 amount change (su 3→2.5 sb klasik 1:1.7 oran), 6 step replace, total 32→40 dk.",
    sources: [
      "https://www.nefisyemektarifleri.com/tavuklu-sehriye-pilavi/",
      "https://yemek.com/tarif/sehriye-pilavi/",
    ],
    newTitle: "Tavuklu Nohutlu Şehriye Pilavı",
    description:
      "Tavuklu nohutlu şehriye pilavı, Anadolu sofrasında sevilen tek tencere yemeklerinden. Arpa şehriyenin tereyağında kavrulması, nohutun tokluğu ve tavuğun hafifliğiyle birleşiyor; akşam telaşına da hafta sonu masasına da uyum sağlıyor.",
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "2.5", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Şehriyeyi soğan kavrulurken yakmadan, sürekli karıştırarak altın renge getirin; aşırı kararırsa pilav buruk olur. Suyu mutlaka sıcak ekleyin, soğuk su pişme süresini uzatır.",
    servingSuggestion:
      "Yanında cacık ve yeşillikli mevsim salatasıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın. Soğanı ince kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağını eritin; soğanı orta ateşte 4 dakika pembeleştirin, ezilmiş sarımsak ve salçayı ekleyip 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Tavuk küplerini ekleyip rengi dönene kadar 5 dakika sotelendirin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Arpa şehriyeyi ekleyip 3-4 dakika çevirerek altın rengi alana kadar kavurun.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Haşlanmış nohut, 2.5 su bardağı sıcak su ve karabiberi ekleyin; kapağı kapalı kısık ateşte 15 dakika suyunu çekene kadar pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alın, üzerine temiz havlu örtüp 10 dakika dinlendirin; çatalla havalandırıp servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 5: uzum-sirali-feslegen (Yalova yumuşat + step jenerik) ─────
  {
    type: "rewrite",
    slug: "uzum-sirali-feslegen-icecegi-yalova-usulu",
    reason:
      "REWRITE Yalova yumusat + step jenerik fix. Yalova termal turizm + Marmara genel mutfak; üzüm sirali fesleğen Yalova ozel kanit yok modern. Klasik üzüm sirasi limonatasi serinletici Türk yaz icecegi. DB sadece 3 step jenerik scaffold ('tüm malzemeyi hazirlayin', 'sıvılarini aromatiklerini karistirin', 'serin servis'). Title 'Üzüm Sirali Fesleğen Içecegi' (Yalova dusur). 2 ingredient_add (limon suyu + opsiyonel bal), 5 step replace temiz akış, total 5→40 dk.",
    sources: [
      "https://yemek.com/tarif/uzum-sirasi-limonatasi/",
      "https://www.nefisyemektarifleri.com/feslegenli-limonata/",
    ],
    newTitle: "Üzüm Şıralı Fesleğen İçeceği",
    description:
      "Üzüm şıralı fesleğen içeceği, hasat zamanının tatlı şırasını taze fesleğen ve limonla buluşturan serinletici bir yaz içeceği. Üzümün doğal tatlılığı limonla dengelendiğinde ferahlatıcı, hafif bir lezzet ortaya çıkıyor.",
    prepMinutes: 10,
    cookMinutes: 0,
    totalMinutes: 40,
    ingredientsAdd: [
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Bal (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Fesleğeni asla bıçakla doğramayın; yapraklar kararır ve acılaşır. Avuçta hafifçe ovmak veya elle yırtmak doğru teknik. Üzüm şırası taze sıkılmış olmalı, pastörize hazır şıralarda tat farklı çıkar.",
    servingSuggestion:
      "Sıcak yaz öğleden sonralarında bol buzla, dilerseniz cam sürahide ince limon dilimleriyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Fesleğen yapraklarını yıkayıp avucunuzda hafifçe ovun; aroması açılsın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sürahide üzüm şırası, su ve limon suyunu karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tatlılığı kontrol edin; üzüm şırası az tatlıysa balı ekleyip eriyene kadar karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Fesleğen yapraklarını ekleyip buzdolabında en az 30 dakika dinlendirin; aromalar suya geçsin.", timerSeconds: 1800 },
      { stepNumber: 5, instruction: "Servis öncesi bardaklara buz koyup içeceği süzerek dökün, üzerine taze fesleğen yaprağı bırakın.", timerSeconds: null },
    ],
  },

  // ─── 6: visneli-cevizli-kesme (ŞERBET EKSIK + Tekirdağ yumuşat) ──
  {
    type: "rewrite",
    slug: "visneli-cevizli-kesme-tatlisi-tekirdag-usulu",
    reason:
      "REWRITE ŞERBET EKSIK FIX + Tekirdağ yumusat. Tekirdağ klasik (Hayrabolu tatlisi + Kirklareli hardal CI 95 + kabak tatlisi + höşmerim); visneli cevizli kesme Tekirdağ ozel kanit yok modern. Klasik kesme tatlisi (revani pattern): hamur + iclik + 180°C firin + ŞEKER ŞERBET (seker + su + limon). DB ŞEKER YOK hamurda + ŞERBET YOK = klasik revani eksik. Title 'Visneli Cevizli Kesme Tatlisi' (Tekirdağ dusur). 7 ingredient_add (hamur: toz seker + irmik opsiyonel + kabartma tozu + sivi yag; serbet: ek toz seker + ek su + limon suyu), 7 step replace klasik revani akış, total 45→110 dk.",
    sources: [
      "https://yemek.com/tarif/revani/",
      "https://www.nefisyemektarifleri.com/visneli-cevizli-revani/",
    ],
    newTitle: "Vişneli Cevizli Kesme Tatlısı",
    description:
      "Vişneli cevizli kesme tatlısı, klasik Türk şerbetli tatlı geleneğinin meyveli yorumu. Yumurtalı yoğurtlu hamurun üzerine serpilen vişne ve ceviz, fırında pişip ılık şerbetle buluşunca yumuşak, ferah bir tatlı veriyor.",
    prepMinutes: 20,
    cookMinutes: 30,
    totalMinutes: 110,
    ingredientsAdd: [
      { name: "Toz şeker (hamur için)", amount: "0.75", unit: "su bardağı" },
      { name: "İrmik (opsiyonel)", amount: "0.5", unit: "su bardağı" },
      { name: "Kabartma tozu", amount: "1", unit: "çay kaşığı" },
      { name: "Sıvı yağ", amount: "0.5", unit: "su bardağı" },
      { name: "Toz şeker (şerbet için)", amount: "1.5", unit: "su bardağı" },
      { name: "Su (şerbet için)", amount: "1.5", unit: "su bardağı" },
      { name: "Limon suyu (şerbet için)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Şerbet kuralı sabittir: sıcak tatlıya ılık şerbet, ılık tatlıya sıcak şerbet, soğuk tatlıya soğuk şerbet (asla aynı sıcaklıkta birleşmez). Vişneleri mutlaka iyi süzün, suyu hamuru ıslatır ve pişme bozulur.",
    servingSuggestion:
      "Üzerine bir top vanilyalı dondurma veya kaymakla, yanında sade Türk kahvesi eşliğinde servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Şerbet için 1.5 su bardağı şeker ve 1.5 su bardağı suyu tencereye alıp kaynayınca 8-10 dakika kısık ateşte kaynatın; ocağı kapatmadan limon suyunu ekleyin, ılımaya bırakın.", timerSeconds: 540 },
      { stepNumber: 2, instruction: "Geniş kâsede yumurtaları ve hamur şekerini çırpın, yoğurt ve sıvıyağı ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Un, irmik (kullanıyorsanız) ve kabartma tozunu eleyerek ekleyip akıcı bir hamur elde edin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yağlanmış fırın tepsisine hamuru dökün; üzerine süzülmüş vişne ve iri kıyılmış cevizleri serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Önceden 180°C'ye ısıtılmış fırında 25-30 dakika, üzeri altın renk olana kadar pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Tatlı sıcakken ılık şerbeti yavaş yavaş üzerine gezdirin; tepsiyi sallayarak şerbetin eşit dağılmasını sağlayın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Oda sıcaklığında en az 1 saat dinlendirip kare veya baklava dilimi şeklinde kesin.", timerSeconds: 3600 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-24");
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
        id: true, title: true, description: true, cuisine: true, type: true,
        difficulty: true, prepMinutes: true, cookMinutes: true, totalMinutes: true,
        averageCalories: true, protein: true, carbs: true, fat: true,
        tipNote: true, servingSuggestion: true, allergens: true,
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
              await tx.recipeIngredient.update({ where: { id: target.id }, data });
            }
          }
        }

        if (op.ingredientsAdd && op.ingredientsAdd.length > 0) {
          const remainingIngredients = await tx.recipeIngredient.findMany({
            where: { recipeId: recipe.id },
            select: { name: true, sortOrder: true },
          });
          const maxSort = remainingIngredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
          const existingNorm = new Set(remainingIngredients.map((i) => normalize(i.name)));
          let added = 0;
          for (const ing of op.ingredientsAdd) {
            if (existingNorm.has(normalize(ing.name))) continue;
            await tx.recipeIngredient.create({
              data: {
                recipeId: recipe.id, name: ing.name, amount: ing.amount, unit: ing.unit,
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
                recipeId: recipe.id, stepNumber: step.stepNumber,
                instruction: step.instruction, timerSeconds: step.timerSeconds ?? null,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            action: "MOD_K_MANUAL_REV", userId: null, targetType: "recipe", targetId: recipe.id,
            metadata: {
              slug: op.slug, reason: op.reason, sources: op.sources,
              paket: "oturum-30-mini-rev-batch-24",
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
  main().catch((e) => { console.error(e); process.exit(1); });
}
