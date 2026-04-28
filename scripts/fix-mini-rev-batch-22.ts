/**
 * Tek-seferlik manuel mini-rev batch 22 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 15+ kaynak (Cesme yoresel + Sakiz
 * Adasi PDO + Bingol Casir Festival + Ferula spp. botanical + Tatil
 * Budur Bingol + Yozgat KTB testi kebabi + Anadolu klasik arpa
 * sehriye pilavi + Turk mutfagi tarator definition + Mersin KTB
 * cezerye/tantuni + Klasik Turk fasulye ezmesi + Tatil Budur Bingol
 * lol/mastuva + Kirklareli/Trakya papaz tatlisi + Hayrabolu tatlisi +
 * Batman yoresel kibe/peliçe + Guneydogu kuru kapya tandir biberi
 * pattern).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (7 'tr' korunur). 6 title degisimi
 * (1 KORUNUR: Bingol Casir Salatasi, casir gercek Bingol yore urunu).
 *
 * 3 KRITIK TUTARSIZLIK FIX:
 *  - #1 cesme-sakizli-kavun: servingSuggestion'da 'Antep fistigi serpin'
 *    LISTEDE FISTIK YOK
 *  - #2 bingol-casir: step 3 'limon suyu ile sumagi acin' LISTEDE
 *    LIMON SUYU YOK
 *  - #4 mersin-taratorlu-kabak: tipNote+step 1+step 4 'tarator icin
 *    tahin' LISTEDE TAHIN YOK (KRITIK definition fix, tarator klasigi
 *    tahin gerektirir)
 *  - #7 batman-tandir-biber: title 'tandir biberi' LISTEDE SADECE
 *    'yesil biber' (kuru kapya biber farkli urun)
 *
 * 1 KRITIK TYPE FIX:
 *  - #5 bingol-fasulye-ezmesi: type SOS YANLIS, APERATIF olmali (mezelik
 *    ezme)
 *
 *   1. sakizli-kavun-kasesi-cesme-usulu (TUTARSIZLIK + Cesme yumusat):
 *      Damla sakizi Cesme/Karaburun yoresel klasik (sakizli dondurma,
 *      muhallebi, lokum, sutlac); kavun+yogurt+bal+sakiz kombinasyonu
 *      modern Ege esintili kase. servingSuggestion 'Antep fistigi
 *      serpin' LISTEDE YOK = TUTARSIZLIK. Title 'Cesme Esintili Sakizli
 *      Kavun Kasesi' yumusat. 2 ingredient_add (Antep fistigi + opsiyonel
 *      taze nane), 5 step replace temiz akış.
 *
 *   2. sumakli-casir-salatasi-bingol-usulu (TUTARSIZLIK + KORUNUR):
 *      Casir (Ferula spp., 'heliz/helis/casir') Bingol/Tunceli/Erzincan
 *      yabani ot, ilkbahar (nisan-mayis) toplanir, Bingol pazarinda
 *      satilir + Bingol Casir Festivali. Title 'Bingol Casir Salatasi'
 *      KORUNABILIR (casir gercek Bingol yore). DB step 3 'limon suyu
 *      ile sumagi acin' LISTEDE LIMON SUYU YOK = TUTARSIZLIK. 2
 *      ingredient_add (limon suyu + tuz), 1 amount change (zeytinyagi
 *      1→2 yk), 5 step replace.
 *
 *   3. tavuklu-arpa-sehriyeli-pilav-yozgat-usulu (yumusat + 6 eksik):
 *      Yozgat klasik (testi kebabi + parmak corek + done corbasi);
 *      tavuklu arpa sehriyeli pilav Yozgat ozgu kanit yok, tum
 *      Anadolu yaygin ev yemegi. DB hicbir aromatik (sogan/sarimsak/
 *      salca/yag/tuz/karabiber) YOK = jenerik scaffold. Title 'Tavuklu
 *      Arpa Sehriyeli Pilav' (Yozgat dusur). 6 ingredient_add (kuru
 *      sogan + sarimsak + domates salcasi + zeytinyagi + tuz +
 *      karabiber), 2 amount change (su 3→2.5 sb klasik 1:1.7 oran +
 *      tereyagi 1→2 yk), 6 step replace klasik akış.
 *
 *   4. taratorlu-kabak-corbasi-mersin-usulu (KRITIK TUTARSIZLIK +
 *      yumusat): Klasik Turk tarator (tahin + sarimsak + limon + tuz +
 *      zeytinyagi); DB tipNote+step 1+step 4 'tarator icin tahin'
 *      diyor LISTEDE TAHIN YOK = KRITIK definition fix. Mersin
 *      klasik kanon (cezerye + tantuni + kerebic + batirik); Mersin
 *      taratorlu kabak corbasi kanit yok modern. Title 'Akdeniz
 *      Esintili Taratorlu Kabak Corbasi' yumusat. 4 ingredient_add
 *      (tahin + limon suyu + zeytinyagi + tuz), 2 amount change
 *      (ceviz 0.25 sb→2 yk + su 4 sb→3.5 sb), 6 step replace.
 *
 *   5. tandir-ekmekli-fasulye-ezmesi-bingol-usulu (TYPE FIX + yumusat):
 *      Bingol klasik (lol + mastuva + ayran corbasi + tutmac + keledos
 *      + sevzik + gulik + silki + sac kavurma + keskek); tandir ekmekli
 *      fasulye ezmesi listede YOK. Anadolu fasulye ezmesi (Turk humus
 *      pattern) yaygin. DB type SOS YANLIS, APERATIF olmali (mezelik).
 *      Title 'Dogu Anadolu Esintili Tandir Ekmekli Fasulye Ezmesi'
 *      yumusat. recipeType SOS→APERATIF. 4 ingredient_add (limon suyu
 *      + tuz + opsiyonel tahin + opsiyonel kimyon), 1 amount change
 *      (zeytinyagi 1→2 yk kivam), 5 step replace.
 *
 *   6. sutlu-hurmali-ekmek-kasigi-kirklareli-usulu (yumusat + step
 *      temizle): Kirklareli yoresel (Hayrabolu tatlisi + kirklareli
 *      hardalı CI 95). Sutlu hurmali ekmek tatlisi Kirklareli kanit
 *      yok modern. Klasik papaz tatlisi (Anadolu pattern bayat ekmek
 *      + sut + kuru meyve + tarçin) ile uyumlu ama hurma modern. DB
 *      step 4 'kuru parca kalmasin diye' yarim cumle. Title 'Sutlu
 *      Hurmali Ekmek Tatlisi' yumusat. 4 ingredient_add (tarcin + tuz
 *      + opsiyonel tereyagi + opsiyonel ceviz/Antep fistigi topping),
 *      1 amount change (seker 2→3 yk), total 20→25 dk, 6 step replace.
 *
 *   7. tandir-biberli-bulgur-kapama-batman-usulu (TUTARSIZLIK + yumusat):
 *      Batman klasik (kibe + pelice + kelaha + klorik + mumbar); tandir
 *      biberli bulgur kapama Batman ozgun listede YOK. Guneydogu kuru
 *      kapya/tandir biberi gelenegi (Diyarbakir + Sanliurfa + Mardin +
 *      Batman). DB title 'tandir biberi' LISTEDE SADECE 'yesil biber'
 *      (kuru kapya biber farkli urun) = TUTARSIZLIK. Title 'Guneydogu
 *      Esintili Kuru Biberli Bulgur Kapama' yumusat + netlestir. 7
 *      ingredient_add (kuru sogan + sarimsak + domates salcasi + biber
 *      salcasi + zeytinyagi + karabiber + kuru kapya/tandir biberi),
 *      2 amount change (yesil biber 4→2 adet + tuz 1çk→1.5 çk), 6
 *      step replace, total 45→60 dk.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-22.ts
 *   npx tsx scripts/fix-mini-rev-batch-22.ts --env prod --confirm-prod
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
  // ─── 1: cesme-sakizli-kavun (TUTARSIZLIK + Cesme yumusat) ─────────
  {
    type: "rewrite",
    slug: "sakizli-kavun-kasesi-cesme-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Cesme yore yumusat. Damla sakizi Cesme/Karaburun yoresel klasik (sakizli dondurma + muhallebi + lokum + sutlac); kavun+yogurt+bal+sakiz kombo modern Ege esintili. DB servingSuggestion 'kavun ve Antep fistigi serpin' LISTEDE FISTIK YOK = TUTARSIZLIK. Title 'Cesme Esintili Sakizli Kavun Kasesi' yumusat. 2 ingredient_add (Antep fistigi + opsiyonel taze nane), 5 step replace temiz akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Mastic_(plant_resin)",
      "https://www.kulturportali.gov.tr/portal/cesme",
    ],
    newTitle: "Çeşme Esintili Sakızlı Kavun Kâsesi",
    description:
      "Çeşme esintili sakızlı kavun kâsesi; soğuk yoğurt, ballı tatlılık ve damla sakızı aromasını tek tabakta buluşturur. Yaz öğleden sonraları için hafif, sade bir tatlı.",
    ingredientsAdd: [
      { name: "Antep fıstığı (kıyılmış)", amount: "1", unit: "yemek kaşığı" },
      { name: "Taze nane (opsiyonel)", amount: "5", unit: "yaprak" },
    ],
    tipNote:
      "Damla sakızını çimdikleyip toz şekerle havanda ezerseniz aroma yoğurda daha iyi geçer; kıyılmış Antep fıstığı son anda eklenir, yumuşamasın.",
    servingSuggestion:
      "Soğuk servis edin, üzerine kıyılmış Antep fıstığı ve isteğe bağlı taze nane serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kavunu küçük küpler halinde doğrayın, 10 dakika buzdolabında soğutun.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Damla sakızını çimdikleyip 1 tatlı kaşığı şeker veya tuzla havanda toz haline getirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yoğurda balı ve dövülmüş damla sakızını ekleyip çırpıcıyla 1 dakika çırpın; pürüzsüz, akıcı bir krema elde edin.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Servis kâselerine soğutulmuş kavun küplerini paylaştırın; üzerine sakızlı yoğurt karışımını dökün.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine kıyılmış Antep fıstığı ve opsiyonel taze nane yapraklarını serpip soğuk servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: bingol-casir-salatasi (TUTARSIZLIK + KORUNUR) ─────────────
  {
    type: "rewrite",
    slug: "sumakli-casir-salatasi-bingol-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Bingol title KORUNUR. Casir (Ferula spp., 'heliz/helis') Bingol/Tunceli/Erzincan/Bitlis/Mus yabani ot, ilkbahar (nisan-mayis) toplanir. Bingol pazarinda satilir + Bingol Casir Festivali duzenleniyor. Title 'Bingol Casir Salatasi' KORUNABILIR (casir gercek Bingol yore urunu). DB step 3 'sumagi limon suyu ile acin' diyor LISTEDE LIMON SUYU YOK = TUTARSIZLIK. 2 ingredient_add (limon suyu + tuz), 1 amount change (zeytinyagi 1→2 yk salata icin yeterli yag), 5 step replace.",
    sources: [
      "https://www.bingol.gov.tr/casir-festivali",
      "https://en.wikipedia.org/wiki/Ferula",
    ],
    newTitle: "Bingöl Çaşır Salatası",
    description:
      "Bingöl yöresinin ilkbahar otlarından çaşır, sumakla buluşunca taze, ekşimsi bir salata çıkarır. Ferula türü çaşır otu Doğu Anadolu'nun nisan ve mayıs aylarında pazarlarında bulunur. Yöresel ev mutfağında kavurma, turşu ve salata olarak değerlendirilir.",
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "2", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Çaşır acımsı olabilir; sapları kalın geliyorsa 2 dakika kaynar suda haşlayıp soğuk suya alın. Sumağı kuru ekleyince dağılmaz, önce limon suyuyla açın.",
    servingSuggestion:
      "Sıcak ekmek arası veya bulgur pilavı yanında servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Çaşırı yıkayın, sapları kalınsa 2 dakika kaynar suda haşlayıp süzün; lokmalık doğrayın.", timerSeconds: 120 },
      { stepNumber: 2, instruction: "Soğanı yarım ay ince doğrayıp tuzla ovup 5 dakika bekletin; soğuk suda yıkayıp süzün.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Ayrı kâsede sumağı limon suyu ve zeytinyağıyla çırparak sos hazırlayın; tuzu ekleyin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çaşır, soğan ve sosu büyük kâsede dikkatlice harmanlayın; ezmemeye özen gösterin.", timerSeconds: null },
      { stepNumber: 5, instruction: "10 dakika oda sıcaklığında dinlendirip servis edin; aroma otursun.", timerSeconds: 600 },
    ],
  },

  // ─── 3: yozgat-tavuklu-arpa-sehriye (yumusat + 6 eksik) ──────────
  {
    type: "rewrite",
    slug: "tavuklu-arpa-sehriyeli-pilav-yozgat-usulu",
    reason:
      "REWRITE Yozgat yumusat + 6 eksik klasik bilesen. Yozgat klasik (testi kebabi + parmak corek + done corbasi + catal asi); tavuklu arpa sehriyeli pilav Yozgat ozgun kanit YOK, tum Anadolu yaygin ev yemegi. DB hicbir aromatik (sogan/sarimsak/salca/yag/tuz/karabiber) YOK = jenerik scaffold. Title 'Tavuklu Arpa Sehriyeli Pilav' (Yozgat dusur). 6 ingredient_add (kuru sogan + sarimsak + domates salcasi + zeytinyagi + tuz + karabiber), 2 amount change (su 3→2.5 sb klasik 1:1.7 oran + tereyagi 1→2 yk), 6 step replace klasik pilav akış.",
    sources: [
      "https://yemek.com/tarif/arpa-sehriyeli-pilav/",
      "https://www.kulturportali.gov.tr/portal/yozgat",
    ],
    newTitle: "Tavuklu Arpa Şehriyeli Pilav",
    description:
      "Tavuklu arpa şehriyeli pilav, Anadolu ev sofralarının pratik klasiği. Soğan ve salçayla kavrulmuş arpa şehriye, didiklenmiş tavukla buluşunca doyurucu, hafif bir tabak çıkar.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "2.5", newUnit: "su bardağı" },
      { name: "Tereyağı", newAmount: "2", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Arpa şehriyeyi tereyağında altın rengi alana kadar kavurun; rengi kararırsa pilav acı olur. Su yerine tavuk haşlama suyu kullanırsanız aroma ikiye katlanır.",
    servingSuggestion:
      "Yanında cacık veya çoban salatasıyla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tencerede zeytinyağı ve tereyağını ısıtın; tavuğu yüksek ateşte 5 dakika tüm yüzeyleri kapanana kadar kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "İnce doğranmış soğanı ekleyip orta ateşte 4 dakika pembeleştirin; ezilmiş sarımsak ve salçayı katıp 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Arpa şehriyeyi ekleyip 2 dakika çevirerek altın rengi alana kadar kavurun.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "2.5 su bardağı sıcak suyu ekleyin; kaynayınca kapağı kapalı kısık ateşte 13 dakika pişirin, su çekilsin.", timerSeconds: 780 },
      { stepNumber: 6, instruction: "Ocaktan alın, üzerine temiz havlu örtüp 10 dakika dinlendirin; çatalla havalandırıp servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 4: mersin-taratorlu-kabak (KRITIK TUTARSIZLIK + yumusat) ────
  {
    type: "rewrite",
    slug: "taratorlu-kabak-corbasi-mersin-usulu",
    reason:
      "REWRITE KRITIK TUTARSIZLIK FIX + Mersin yumusat. Klasik Turk tarator: tahin + sarimsak + limon + tuz + zeytinyagi + opsiyonel ceviz/ekmek. DB tipNote+step 1 'tarator icin tahinli karisim'+step 4 'taratoru sicak corba suyuyla acin' diyor LISTEDE TAHIN YOK = KRITIK definition fix (tarator klasigi tahin gerektirir). Mersin klasik (cezerye + tantuni + kerebic + batirik); Mersin taratorlu kabak corbasi modern. Title 'Akdeniz Esintili Taratorlu Kabak Corbasi' yumusat. 4 ingredient_add (tahin + limon suyu + zeytinyagi + tuz), 2 amount change (ceviz 0.25 sb→2 yk garnitür + su 4 sb→3.5 sb), 6 step replace, total 26→35 dk.",
    sources: [
      "https://yemek.com/tarif/tarator/",
      "https://en.wikipedia.org/wiki/Tarator",
    ],
    newTitle: "Akdeniz Esintili Taratorlu Kabak Çorbası",
    description:
      "Akdeniz esintili taratorlu kabak çorbası, haşlanmış kabak püresine tahin, sarımsak, limon ve yoğurttan oluşan tarator harcı eklenerek hazırlanır. Kremamsı ve hafif ekşimsi bir kâse; üzerine kavrulmuş ceviz ve sızma zeytinyağı gezdirilir.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAmountChange: [
      { name: "Ceviz", newAmount: "2", newUnit: "yemek kaşığı" },
      { name: "Su", newAmount: "3.5", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Tahin", amount: "2", unit: "yemek kaşığı" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tarator harcını çorbaya doğrudan eklemeyin; önce bir kepçe sıcak çorba suyuyla temperleyin, böylece yoğurt ve tahin kesilmez.",
    servingSuggestion:
      "Üzerine kıyılmış ceviz, bir tutam sumak ve sızma zeytinyağı gezdirip ekmek arası servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabakları soyup küp doğrayın; 3.5 su bardağı suyla tencereye alın, kaynayınca kısık ateşte 12-15 dakika yumuşayana kadar haşlayın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "El blenderı ile kabakları pürelendirin; çorba kıvamı koyu kalsın, fazla sulandırmayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Ayrı kâsede tarator harcını hazırlayın: tahin + ezilmiş sarımsak + limon suyu + tuzu çırpıp pürüzsüz krema elde edin; yoğurdu ekleyip homojenleştirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tarator harcını bir kepçe sıcak çorba suyuyla temperleyin (yoğurt kesilmesin), ardından çorbaya yedirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Çorbayı tekrar ocağa alın, kısık ateşte 4 dakika kaynama noktasına yakın tutun (kaynatmayın).", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Servis kâselerine alın; üzerine kıyılmış ceviz ve zeytinyağı gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: bingol-tandir-fasulye-ezmesi (TYPE FIX + yumusat) ────────
  {
    type: "rewrite",
    slug: "tandir-ekmekli-fasulye-ezmesi-bingol-usulu",
    reason:
      "REWRITE TYPE FIX + Bingol yumusat. Bingol klasik (lol + mastuva + ayran corbasi + tutmac + keledos + sevzik + gulik + silki + sac kavurma); tandir ekmekli fasulye ezmesi listede YOK. Anadolu fasulye ezmesi (Turk humus pattern) yaygin. DB type SOS YANLIS - bu mezelik ezme APERATIF olmali. Title 'Dogu Anadolu Esintili Tandir Ekmekli Fasulye Ezmesi' yumusat. recipeType SOS→APERATIF. 4 ingredient_add (limon suyu + tuz + opsiyonel tahin + opsiyonel kimyon), 1 amount change (zeytinyagi 1→2 yk), 5 step replace.",
    sources: [
      "https://www.tatilbudur.com/blog/bingol-yemekleri-bingol-meshur-yemekleri-listesi/",
      "https://yemek.com/tarif/fasulye-ezmesi/",
    ],
    newTitle: "Doğu Anadolu Esintili Tandır Ekmekli Fasulye Ezmesi",
    description:
      "Doğu Anadolu'nun tandır ekmeği geleneğine yaslanan, haşlanmış kuru fasulyeden hazırlanan sade bir ezme. Sarımsak, limon ve zeytinyağı dengesiyle kahvaltıda veya mezelik olarak ılık tandır ekmeği eşliğinde sunulur. Tahin opsiyoneldir, ekleyince humusumsu bir doku verir.",
    recipeType: RecipeType.APERATIF,
    prepMinutes: 15,
    cookMinutes: 0,
    totalMinutes: 15,
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "2", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tahin (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
      { name: "Kimyon (opsiyonel)", amount: "1", unit: "tutam" },
    ],
    tipNote:
      "Robot yoksa fasulyeleri çatalla iyice ezip ardından havanda dövebilirsiniz; kıvam biraz daha rustik olur. Limon ve tuzu en sona bırakıp tadına göre ayarlamak ezmenin dengesini bozmaz.",
    servingSuggestion:
      "Sıcak tandır ekmeğini dilimleyip yanına maydanoz, taze soğan ve birkaç dilim kırmızı turp koyarak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Haşlanmış kuru fasulyeyi süzün, haşlama suyundan 3-4 yemek kaşığı ayrı kapta saklayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Mutfak robotuna fasulye, ezilmiş sarımsak, limon suyu, tuz ve opsiyonel tahini alıp pürüzsüz olana kadar çekin; çok koyuysa haşlama suyu ekleyin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Zeytinyağını ince ince akıtarak ezmeyi karıştırmaya devam edin; pürüzsüz, kremsi kıvama gelsin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Opsiyonel kimyonu serpin, tadına bakıp tuz veya limon ayarlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Servis tabağına alıp üzerine zeytinyağı gezdirin; tandır ekmeğini lokmalık koparıp yanında ılık servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: kirklareli-sutlu-hurmali-ekmek-tatlisi (yumusat) ─────────
  {
    type: "rewrite",
    slug: "sutlu-hurmali-ekmek-kasigi-kirklareli-usulu",
    reason:
      "REWRITE Kirklareli yumusat + step temizle. Kirklareli yoresel (Hayrabolu tatlisi + Kirklareli hardalı CI 95). Sutlu hurmali ekmek tatlisi Kirklareli kanit YOK modern. Klasik papaz tatlisi (Anadolu pattern bayat ekmek + sut + kuru meyve + tarçin) ile uyumlu. DB step 4 'kuru parca kalmasin diye' yarim cumle. Title 'Sutlu Hurmali Ekmek Tatlisi' yumusat. 4 ingredient_add (tarçin + tuz + opsiyonel tereyagi + opsiyonel ceviz topping), 1 amount change (seker 2→3 yk hurma sekeri yetmeyebilir), total 20→25 dk, 6 step replace.",
    sources: [
      "https://yemek.com/tarif/papaz-tatlisi/",
      "https://www.kulturportali.gov.tr/portal/kirklareli",
    ],
    newTitle: "Sütlü Hurmalı Ekmek Tatlısı",
    description:
      "Bayatlamaya yüz tutmuş ekmekleri değerlendirmenin sade ve şık yolu. Süt, şeker ve hurmanın doğal tatlılığıyla zenginleşen, tarçın notalı bir ev tatlısı. Tarçın ve opsiyonel ceviz, hafif aromatik bir bitiriş katar.",
    prepMinutes: 10,
    cookMinutes: 15,
    totalMinutes: 25,
    ingredientsAmountChange: [
      { name: "Şeker", newAmount: "3", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Tarçın", amount: "0.5", unit: "çay kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Tereyağı (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
      { name: "Ceviz veya Antep fıstığı (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Ekmek dilimlerini önceden hafif kurutmak süt emiciliğini artırır ve tatlının sulanmasını engeller. Hurmalar çok sertse 5 dakika sıcak süte yatırın, doğal tatlılıkları sosa geçer.",
    servingSuggestion:
      "Bir kase yanında soğuk bir bardak süt veya sade Türk kahvesiyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ekmek dilimlerini hafif kızarana kadar tavada veya 180°C fırında 5 dakika kurutun; sütü iyi çeksinler.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Sütü tencereye alın, şeker, tuz ve tarçını ekleyip kaynama noktasına getirin; karıştırarak şekeri eritin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hurmaların çekirdeğini çıkarıp ikiye bölün; sıcak süte atıp 2-3 dakika demlenmeye bırakın.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Ekmek dilimlerini servis kabına dizin; üzerine sıcak hurmalı sütü gezdirip her dilime kuru parça kalmayacak şekilde sosu emdirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "İsterseniz üzerine 1 yemek kaşığı eritilmiş tereyağını gezdirin; oda sıcaklığına gelince buzdolabında en az 1 saat dinlendirin.", timerSeconds: 3600 },
      { stepNumber: 6, instruction: "Servis öncesi opsiyonel ceviz veya Antep fıstığını serpip soğuk olarak sunun.", timerSeconds: null },
    ],
  },

  // ─── 7: batman-tandir-biber-bulgur (TUTARSIZLIK + yumusat) ───────
  {
    type: "rewrite",
    slug: "tandir-biberli-bulgur-kapama-batman-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Batman yumusat. Batman klasik (kibe + pelice + kelaha + klorik + mumbar); tandir biberli bulgur kapama Batman ozgun listede YOK. Guneydogu kuru kapya/tandir biberi gelenegi (Diyarbakir + Sanliurfa + Mardin + Batman). DB title 'tandir biberi' var ama LISTEDE SADECE 'yesil biber' (kuru kapya biber farkli urun) = TUTARSIZLIK. Title 'Guneydogu Esintili Kuru Biberli Bulgur Kapama' yumusat + netlestir. 7 ingredient_add (kuru sogan + sarimsak + domates salcasi + biber salcasi + zeytinyagi + karabiber + kuru kapya/tandir biberi), 2 amount change (yesil biber 4→2 adet + tuz 1→1.5 çk), 6 step replace, total 45→60 dk.",
    sources: [
      "https://www.tatilbudur.com/blog/batman-yemekleri-batmanin-meshur-yemekleri-listesi/",
      "https://yemek.com/tarif/etli-bulgur-pilavi/",
    ],
    newTitle: "Güneydoğu Esintili Kuru Biberli Bulgur Kapama",
    description:
      "Güneydoğu Anadolu'nun kurutulmuş kapya biberini öne çıkaran etli bulgur kapaması. Kuru biberin tandırdan gelen tütsülü tatlı aroması, salça ve kuşbaşı etle birleşince kışlık bir tencere yemeğine dönüşür. Klasik kapama tekniğiyle bulgur etin suyunu çekerek pişer.",
    prepMinutes: 15,
    cookMinutes: 45,
    totalMinutes: 60,
    ingredientsAmountChange: [
      { name: "Yeşil biber", newAmount: "2", newUnit: "adet" },
      { name: "Tuz", newAmount: "1.5", newUnit: "çay kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "büyük adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru kapya biber (tandır biberi)", amount: "2", unit: "adet" },
    ],
    tipNote:
      "Kuru kapya biberi ufalamadan önce 5 dakika sıcak suda yumuşatırsanız aroması daha rahat dağılır ve acılığı dengelenir. Bulguru ekledikten sonra karıştırmayın, sadece kapağı kapatıp demlenmesine izin verin.",
    servingSuggestion:
      "Yanında sarımsaklı yoğurt, közlenmiş yeşil biber ve taze maydanozla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tencerede zeytinyağını ısıtın; kuşbaşı eti yüksek ateşte 6 dakika tüm yüzeyleri kapanana ve hafif kızarana kadar mühürleyin.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ekleyip orta ateşte 4 dakika pembeleştirin; ezilmiş sarımsak ile domates ve biber salçasını katıp 2 dakika kavurun.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Yeşil biberleri ve sıcak suda 5 dakika yumuşatılıp ufalanmış kuru kapya biberi ekleyin, 2 dakika daha çevirin; domates rendesini ilave edin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Tuz ve karabiberi atın; 3 su bardağı sıcak suyu ekleyip kapağı kapalı kısık ateşte 25 dakika et yumuşayana kadar pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Yıkanıp süzülmüş bulguru ekleyip karıştırın; kapağı kapalı kısık ateşte 12 dakika suyunu çekene kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 6, instruction: "Ocaktan alıp temiz mutfak bezi örtün, kapağı kapatıp 10 dakika demlendirin; çatalla havalandırıp sıcak servis edin.", timerSeconds: 600 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-22");
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
              paket: "oturum-29-mini-rev-batch-22",
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
