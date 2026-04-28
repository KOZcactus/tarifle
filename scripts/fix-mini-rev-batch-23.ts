/**
 * Tek-seferlik manuel mini-rev batch 23 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 18+ kaynak (Türk Patent CI sicili
 * Aydin Inciri 119/Bursa Siyah Inciri 268/Diyarbakir Inciri 232 +
 * Klasik Turk komposto pattern + Egesakizi/Cesme klasik + Ardahan
 * yöresel hingel/cağ kebabı/peynir suyu çorbası + Klasik kısır pattern
 * + Batman yoresel kibe/peliçe + Firik Hatay/Antep/Antakya klasiği +
 * Hürriyet Lezizz Firik Pilavı + Antep usulü firik + Tavuklu Ankara
 * pilavı NYT (yöresel tescil yok pan-Anadolu) + Yozgat Tarım Orman
 * Bakanlığı resmi yöresel yemek listesi + Yozgat klasiği yarma+yesil
 * mercimek BULGUR bazlı, pirincli kanit YOK + Anadolu mücadara
 * pattern Doğu Akdeniz).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (7 'tr' korunur). 7 title
 * degisimi.
 *
 * 1 KRITIK DATA CORRUPTION FIX:
 *  - #4 Batman firik: servingSuggestion 'kuzu pembesi tabaka halinde
 *    dilimleyip' YANLIS METADATA (tavuk tarifinde kuzu cumlesi,
 *    paketi 17 musakhan benzeri scaffold leak) - SIL
 *
 * 4 KRITIK TUTARSIZLIK FIX:
 *  - #3 Ardahan TRIPLE: step 2 domates+yeşillik + step 3 limon suyu +
 *    step 5 sogan LISTEDE YOK (3 ayrı tutarsızlık tek tarifte)
 *  - #6 Ankara: step 3 'tuz, baharat ve eksi malzeme' LISTEDE YOK
 *  - #7 Yozgat: step 3 'tuz, baharat' LISTEDE YOK + Yozgat klasigi
 *    BULGUR bazli (pirincli kanit yok)
 *
 *   1. sakizli-incir-kompostosu-mugla-usulu (yumusat + step kısa fix):
 *      Aydin Inciri CI 119 (28.05.2010) + Bursa Siyah Inciri CI 268
 *      (13.08.2018) + Diyarbakir Inciri CI 232 (31.07.2017); Mugla
 *      ozel incir CI yok. Sakizli incir kompostosu modern Ege fusion.
 *      Title 'Ege Esintili Sakizli Incir Kompostosu' yumusat. 3
 *      ingredient_add (limon kabugu + tarcin cubugu + karanfil), 5
 *      step replace temiz akış, total 22→30 dk.
 *
 *   2. sakizli-lor-tatlisi-izmir-usulu (yumusat + ingredient): Klasik
 *      Turk peynirli tatlilar (höşmerim Susurluk + peynir tatlisi
 *      Afyon + kazandibi); Izmir sakizli lor tatlisi modern Ege
 *      fusion. Title 'Ege Esintili Sakizli Lor Tatlisi' yumusat.
 *      3 ingredient_add (vanilya esansi + Antep fistigi opsiyonel
 *      topping + opsiyonel kakule), 5 step replace.
 *
 *   3. sumakli-havuclu-bulgur-salatasi-ardahan-usulu (TRIPLE
 *      TUTARSIZLIK + Ardahan dusur): Ardahan klasik (Hingel mantisi +
 *      Cağ kebabi komsu Erzurum CI + kete + peynir suyu corbasi +
 *      telli/cecil peynir CI); sumakli havuclu bulgur salatasi
 *      kanitsiz. DB step 2 'domates+yeşillik' YOK + step 3 'limon
 *      suyu' YOK + step 5 'sogan' YOK = TRIPLE TUTARSIZLIK. Klasik
 *      kisir pattern (Turk genel: bulgur + sogan + maydanoz + domates
 *      + sumak + limon + nar eksisi). Title 'Sumakli Havuclu Bulgur
 *      Salatasi' (Ardahan tamamen dusur). 7 ingredient_add (kuru
 *      sogan + domates + maydanoz + limon suyu + tuz + opsiyonel nar
 *      eksisi + opsiyonel biber salcasi), 6 step replace, total
 *      20→35 dk dinlendirme dahil.
 *
 *   4. tavuklu-firik-patlican-batman-usulu (DATA CORRUPTION FIX +
 *      Batman dusur): Batman klasik (kibe + pelice + kelaha + klorik
 *      + mırra + sıkma); tavuklu firik+patlican kombo Batman kanitsiz.
 *      Firik Antakya/Antep klasigi. DB servingSuggestion 'kuzu pembesi
 *      tabaka halinde dilimleyip uzerine pisme suyundan iki kasik
 *      dökün' = scaffold leak (tavuk tarifinde kuzu cumle, musakhan
 *      paketi 17 benzeri data corruption). KRITIK SIL. Title
 *      'Guneydogu Esintili Tavuklu Firikli Patlican Tencere'. 7
 *      ingredient_add (kuru sogan + sarimsak + salca + zeytinyagi +
 *      tuz + karabiber + kuru nane), 6 step replace, total 40→55 dk.
 *
 *   5. tavuklu-limonlu-firik-pilavi-mersin-usulu (Mersin yumusat +
 *      6 eksik bilesen): Firik Antep/Antakya klasigi (Hurriyet
 *      Lezizz + NYT Tavuklu Firik Pilavi Antep). Mersin firik kanit
 *      orta, narenciye atfi limon eklenti. Title 'Mersin Esintili
 *      Tavuklu Limonlu Firik Pilavi' yumusat. 6 ingredient_add (kuru
 *      sogan + sarimsak + domates salcasi + tereyagi + tuz +
 *      karabiber), 1 amount change (su 3→4 sb firik 1:2 oran), 6
 *      step replace, total 32→50 dk.
 *
 *   6. tavuklu-nohutlu-arpa-pilavi-ankara-usulu (TUTARSIZLIK +
 *      Ankara dusur): Ankara klasik (Ankara tava + Beypazari kuru +
 *      döne corbasi + done döner); tavuklu nohutlu arpa pilavi
 *      Ankara'ya ozgun kanit yok pan-Anadolu. DB step 3 'tuz +
 *      baharat ve eksi malzeme' LISTEDE YOK = TUTARSIZLIK. Title
 *      'Tavuklu Nohutlu Arpa Sehriye Pilavi' (Ankara dusur). 6
 *      ingredient_add, 1 amount change (su 3→2.5 sb klasik 1:1.7
 *      oran), 6 step replace, total 32→35 dk.
 *
 *   7. tavuklu-yesil-mercimek-pilavi-yozgat-usulu (TUTARSIZLIK +
 *      KESIF + Yozgat dusur): Yozgat klasigi MERCIMEKLI BULGUR
 *      (yarma+yesil mercimek+tereyagi); pirincli mercimek pilavi
 *      Yozgat KANITSIZ (Yozgat Tarim Orman Bakanligi resmi yemek
 *      envanterinde YOK). DB step 3 'tuz + baharat' LISTEDE YOK =
 *      TUTARSIZLIK. Klasik mucadara pattern (Dogu Akdeniz: pirinc +
 *      mercimek + sogan + tereyagi). Title 'Tavuklu Yesil Mercimekli
 *      Pirinc Pilavi' (Yozgat tamamen dusur). 6 ingredient_add (kuru
 *      sogan + sarimsak + tereyagi + zeytinyagi + tuz + karabiber +
 *      opsiyonel kimyon), 6 step replace, total 32→55 dk.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-23.ts
 *   npx tsx scripts/fix-mini-rev-batch-23.ts --env prod --confirm-prod
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
  // ─── 1: ege-sakizli-incir-kompostosu (Mugla yumusat + aromatik) ───
  {
    type: "rewrite",
    slug: "sakizli-incir-kompostosu-mugla-usulu",
    reason:
      "REWRITE Mugla yumusat + 3 klasik aromatik ekle. Aydin Inciri CI 119 (28.05.2010) + Bursa Siyah Inciri CI 268 + Diyarbakir Inciri CI 232; Mugla ozel incir CI yok. Klasik komposto pattern (NefisYemekTarifleri + Yemek.com): kuru incir + su + seker + tarcin + karanfil + limon kabugu. Title 'Ege Esintili Sakizli Incir Kompostosu'. 3 ingredient_add (limon kabugu rendesi + tarcin cubugu + karanfil), 5 step replace temiz akış (yikama+yarma + su+seker + aromatikler + 15 dk + sakiz son ekle), total 22→30 dk.",
    sources: [
      "https://yemek.com/tarif/incir-kompostosu/",
      "https://en.wikipedia.org/wiki/Mastic_(plant_resin)",
    ],
    newTitle: "Ege Esintili Sakızlı İncir Kompostosu",
    description:
      "Ege'nin kuru incir bolluğu ile damla sakızının çam aromasını buluşturan, akşam sonrası hafif tatlı bir kompostodur. Tarçın, karanfil ve limon kabuğu klasik komposto omurgasını kurar; damla sakızı son anda eklenir, aroması uçmasın diye.",
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    ingredientsAdd: [
      { name: "Limon kabuğu rendesi", amount: "1", unit: "çay kaşığı" },
      { name: "Tarçın çubuğu", amount: "1", unit: "adet" },
      { name: "Karanfil", amount: "3", unit: "tane" },
    ],
    tipNote:
      "Damla sakızı toz şekerle havanda dövülürse ocakta topaklanmaz, kompostoya pürüzsüz dağılır. Bir gece buzdolabında dinlenen komposto ertesi gün daha aromalı içilir.",
    servingSuggestion:
      "Soğuk servis edip üzerine bir tutam tarçın serpin, yanında sade lokum veya kuru kayısı ile sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru incirleri ılık suda 5 dakika yıkayıp süzün; ikiye bölün.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Tencereye 1.5 lt suyu, toz şekeri ve incirleri alın; orta ateşte kaynama noktasına getirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Kaynayınca tarçın çubuğu ve karanfili ekleyip kısık ateşte 15 dakika pişirin; meyveler şişip suyunu bıraksın.", timerSeconds: 900 },
      { stepNumber: 4, instruction: "Ocağı kapatın; toz şekerle havanda ezilmiş damla sakızını ve limon kabuğu rendesini ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Buzdolabında en az 1 saat soğutup soğuk servis edin; tarçın çubuğu ve karanfilleri tabağa alırken çıkarabilirsiniz.", timerSeconds: 3600 },
    ],
  },

  // ─── 2: ege-sakizli-lor-tatlisi (Izmir yumusat + 3 ingredient) ────
  {
    type: "rewrite",
    slug: "sakizli-lor-tatlisi-izmir-usulu",
    reason:
      "REWRITE Izmir yumusat + 3 ingredient eksik. Klasik Turk peynirli tatlilar (höşmerim Susurluk-Balikesir + peynir tatlisi Afyon + kazandibi peynirli); Izmir sakizli lor tatlisi modern Ege fusion. Damla sakizi Cesme/Karaburun klasik. Title 'Ege Esintili Sakizli Lor Tatlisi'. 3 ingredient_add (vanilya esansi + opsiyonel Antep fistigi topping + opsiyonel kakule), 5 step replace, total 25→35 dk.",
    sources: [
      "https://yemek.com/tarif/lor-tatlisi/",
      "https://en.wikipedia.org/wiki/Mastic_(plant_resin)",
    ],
    newTitle: "Ege Esintili Sakızlı Lor Tatlısı",
    description:
      "Lor peynirinin hafifliği ile damla sakızının Ege aromasını buluşturan sütlü kıvamlı tatlıdır. Limon kabuğu ve vanilya tabakaya tazelik verir; Antep fıstığı topping son anda serpilir, kıvamı çıtırlatır.",
    prepMinutes: 15,
    cookMinutes: 20,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Vanilya esansı", amount: "1", unit: "çay kaşığı" },
      { name: "Antep fıstığı (kıyılmış, opsiyonel topping)", amount: "2", unit: "yemek kaşığı" },
      { name: "Kakule (opsiyonel)", amount: "1", unit: "tutam" },
    ],
    tipNote:
      "Lor süzgeçten geçirilirse tatlı pürüzsüz olur, topak kalmaz. Damla sakızı bir miktar şekerle havanda ezilirse sütte hızlı dağılır.",
    servingSuggestion:
      "Küçük kâselerde soğuk servis edin, üzerine kıyılmış Antep fıstığı serpin, yanında bir fincan Türk kahvesi ikram edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sütü ve toz şekeri tencereye alın; orta ateşte 4 dakika ısıtarak şekeri eritin.", timerSeconds: 240 },
      { stepNumber: 2, instruction: "Toz şekerle dövülmüş damla sakızını, vanilya esansını ve opsiyonel kakuleyi ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Süzme lor peynirini ekleyip çatalla ezerek karışıma yedirin; kısık ateşte 8 dakika sürekli karıştırarak pişirin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Limon kabuğu rendesini ekleyip karıştırın; kâselere paylaştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Buzdolabında en az 1 saat soğutun; servis öncesi üzerine kıyılmış Antep fıstığı serpip soğuk servis edin.", timerSeconds: 3600 },
    ],
  },

  // ─── 3: sumakli-havuclu-bulgur-salatasi (TRIPLE TUTARSIZLIK FIX) ──
  {
    type: "rewrite",
    slug: "sumakli-havuclu-bulgur-salatasi-ardahan-usulu",
    reason:
      "REWRITE TRIPLE TUTARSIZLIK FIX + Ardahan tamamen dusur. Ardahan klasik (Hingel mantisi + Cağ kebabi + kete + peynir suyu corbasi + telli/cecil peynir CI); sumakli havuclu bulgur salatasi kanitsiz modern. DB TRIPLE TUTARSIZLIK: step 2 'domates+yeşillik' YOK + step 3 'limon suyu' YOK + step 5 'sogan' YOK. Klasik kisir pattern (Turk genel: bulgur + sogan + maydanoz + domates + sumak + limon + nar eksisi). Title 'Sumakli Havuclu Bulgur Salatasi' (Ardahan dusur). 7 ingredient_add (kuru sogan + domates + maydanoz + limon suyu + tuz + opsiyonel nar eksisi + opsiyonel biber salcasi), 6 step replace, total 20→35 dk.",
    sources: [
      "https://yemek.com/tarif/kisir/",
      "https://yemek.com/tarif/sumakli-bulgur-salatasi/",
    ],
    newTitle: "Sumaklı Havuçlu Bulgur Salatası",
    description:
      "İnce bulgurun sumakla buluştuğu, havuç rendesi ile renk kazanan hafif salatadır. Kuru soğan tuzla ovularak keskinliği alınır; domates ve maydanoz tazeliği taşır, biber salçası ve nar ekşisi opsiyonel olarak derinlik katar.",
    prepMinutes: 20,
    cookMinutes: 0,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Domates", amount: "1", unit: "adet" },
      { name: "Taze maydanoz", amount: "0.5", unit: "demet" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Nar ekşisi (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
      { name: "Biber salçası (opsiyonel)", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "İnce bulguru kaynamış suyla değil, oda sıcaklığı suyla 10 dakika ıslatın; hamurlaşmaz, taneli kalır. Soğanı dilimleyip tuzla ovup yıkamak salataya keskin koku bırakmaz.",
    servingSuggestion:
      "Marul yaprakları üzerinde servis edin, yanında ayran veya közlenmiş biber turşusu ile sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulguru oda sıcaklığında suyla 10 dakika ıslatın; suyunu süzün.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Havucu ince rendeleyin; kuru soğanı yarım ay doğrayıp tuzla 2 dakika ovup soğuk suda yıkayıp süzün.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Domatesi küp doğrayın; maydanozu ince kıyın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş kâsede bulgur, havuç, soğan, domates ve maydanozu birleştirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine sumak, zeytinyağı, limon suyu, tuz ve opsiyonel nar ekşisi/biber salçasını ekleyip ezmeden harmanlayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "15 dakika oda sıcaklığında dinlendirip aroma otursun, ardından servis edin.", timerSeconds: 900 },
    ],
  },

  // ─── 4: guneydogu-tavuklu-firik-patlican (DATA CORRUPTION FIX) ────
  {
    type: "rewrite",
    slug: "tavuklu-firik-patlican-batman-usulu",
    reason:
      "REWRITE KRITIK DATA CORRUPTION FIX + Batman dusur. DB servingSuggestion 'Tabakta kuzu pembesi tabaka halinde dilimleyip uzerine pisme suyundan iki kasik dökün' = scaffold leak (tavuk tarifinde kuzu cumle, paketi 17 musakhan benzeri data corruption). KRITIK SIL. Batman klasik (kibe + pelice + kelaha + klorik); tavuklu firik+patlican Batman kanitsiz. Firik Antakya/Antep klasigi. Title 'Guneydogu Esintili Tavuklu Firikli Patlican Tencere'. 7 ingredient_add (kuru sogan + sarimsak + domates salcasi + zeytinyagi + tuz + karabiber + kuru nane), 6 step replace, total 40→55 dk.",
    sources: [
      "https://yemek.com/tarif/tavuklu-firik-pilavi/",
      "https://www.nefisyemektarifleri.com/tavuklu-firik-pilavi-antep/",
    ],
    newTitle: "Güneydoğu Esintili Tavuklu Firikli Patlıcan Tencere",
    description:
      "Tavuk göğsünün firik buğdayının kavrulmuş aromasıyla buluştuğu, patlıcan ve domatesin tencerede yumuşadığı Güneydoğu esintili tek tencere yemeğidir. Domates salçası ve sarımsak omurgayı kurar; kuru nane son anda serpilir, aroması uçmasın diye.",
    prepMinutes: 15,
    cookMinutes: 40,
    totalMinutes: 55,
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Firik pişmeden önce ayrı bir kapta yıkanırsa tencerede bulanıklık yapmaz. Patlıcan tuzla bekletilip suyu sıkılırsa yağ daha az çeker, tencere yağlanmaz.",
    servingSuggestion:
      "Sıcak servis edin, yanında cacık ve közlenmiş yeşil biber ile sunun, üzerine taze maydanoz serpebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patlıcanları küp doğrayıp tuzlayın, 15 dakika bekletin; suyunu sıkıp süzün.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tencerede zeytinyağını ısıtın; tavuğu yüksek ateşte 5 dakika tüm yüzeyleri kapanana kadar mühürleyin, kenara alın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Aynı tencerede ince doğranmış soğanı 4 dakika pembeleştirin; ezilmiş sarımsak ve salçayı katıp 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Süzülmüş patlıcanı, doğranmış domatesi, mühürlenmiş tavuğu, yıkanmış firiği ve 2.5 su bardağı sıcak suyu ekleyin; kapağı kapalı kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Ocaktan alın, kuru naneyi serpin; 5 dakika dinlendirip sıcak servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 5: mersin-tavuklu-limonlu-firik (yumusat + 6 eksik) ─────────
  {
    type: "rewrite",
    slug: "tavuklu-limonlu-firik-pilavi-mersin-usulu",
    reason:
      "REWRITE Mersin yumusat + 6 eksik klasik bilesen. Firik Antep/Antakya klasigi (Hurriyet Lezizz: 'genellikle Hatay ve Antep usulu pisirilen firik pilavi' + NYT Tavuklu Firik Pilavi Antep). Mersin firik kanit orta, narenciye atfi limon eklenti. Title 'Mersin Esintili Tavuklu Limonlu Firik Pilavi' yumusat. 6 ingredient_add (kuru sogan + sarimsak + domates salcasi + tereyagi + tuz + karabiber), 1 amount change (su 3→4 sb firik 1:2 oran klasik), 6 step replace, total 32→50 dk.",
    sources: [
      "https://www.hurriyet.com.tr/lezizz/firik-pilavi-tarifi-41925465",
      "https://www.nefisyemektarifleri.com/tavuklu-firik-pilavi-antep/",
    ],
    newTitle: "Mersin Esintili Tavuklu Limonlu Firik Pilavı",
    description:
      "Firik, yeşil buğday başaklarının közlenip ufalanmasıyla elde edilen Güneydoğu Anadolu'nun klasik tahılıdır; Antep ve Antakya sofralarının vazgeçilmezi. Bu tarif klasik akışı tavuk göğsü ve taze limon suyuyla yorumluyor, Mersin'in narenciye kuşağından esin alıyor. Hafif isli aroması ve diri dokusuyla doyurucu, tek başına yetecek bir pilav.",
    prepMinutes: 15,
    cookMinutes: 35,
    totalMinutes: 50,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "4", newUnit: "su bardağı" },
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
      "Firiği yıkadıktan sonra 10 dakika ılık suda bekletip süzmek hem tozunu alır hem pişme süresini dengeler. Limon suyunu pişirmenin başında, kabuk rendesini ise demlenme sonrası ekleyin; aroma kaybı azalır.",
    servingSuggestion:
      "Yanında kâse yoğurt, közlenmiş biber ve taze maydanoz salatasıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Firiği yıkayıp 10 dakika ılık suda bekletip süzün.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tencerede tereyağını eritin; ince doğranmış soğanı orta ateşte 4 dakika pembeleştirin, sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayıp tencereye alın; yüksek ateşte 5 dakika dış yüzü beyazlasın diye sotelendirin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Domates salçasını, tuzu ve karabiberi ekleyip 1 dakika kavurun.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Süzülmüş firiği ekleyip 2 dakika daha çevirin; 4 su bardağı sıcak suyu ve limon suyunu ilave edin, kaynayınca kapağı kapalı kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Ocaktan alın, 10 dakika kapalı şekilde demlendirin; karıştırıp servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 6: tavuklu-nohutlu-arpa-pilavi (TUTARSIZLIK + Ankara dusur) ──
  {
    type: "rewrite",
    slug: "tavuklu-nohutlu-arpa-pilavi-ankara-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Ankara dusur. Ankara klasik (Ankara tava + Beypazari kuru + döne corbasi); tavuklu nohutlu arpa pilavi pan-Anadolu ev yemegi, Ankara ozgun kanit yok. DB step 3 'tuz, baharat ve eksi malzemeyi ayri kapta birlestirin' diyor LISTEDE TUZ + BAHARAT YOK = TUTARSIZLIK + jenerik şablon. Step 7 boilerplate. Title 'Tavuklu Nohutlu Arpa Sehriye Pilavi' (Ankara dusur). 6 ingredient_add (kuru sogan + sarimsak + domates salcasi + zeytinyagi + tuz + karabiber), 1 amount change (su 3→2.5 sb klasik 1:1.7 oran), 6 step replace.",
    sources: [
      "https://www.nefisyemektarifleri.com/tavuklu-ankara-pilavi-arpa-sehriyeli/",
      "https://yemek.com/tarif/arpa-sehriyeli-pilav/",
    ],
    newTitle: "Tavuklu Nohutlu Arpa Şehriye Pilavı",
    description:
      "Arpa şehriyenin tereyağında kavrulup tavuk suyu ve nohutla buluşması, Anadolu ev mutfağının klasik tek tencere pilavıdır. Doyurucu, ekonomik ve hızlı; akşam telaşında bile kolayca yetişir. Üzerine biraz tereyağı gezdirilen sıcak yoğurtla bambaşka tat verir.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "2.5", newUnit: "su bardağı" },
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
      "Şehriyeyi tereyağında rengi koyu altın olana kadar sabırla kavurmak pilavın aromasını belirler; aceleci kavurma sönük tat bırakır. Nohut haşlamasını dün akşamdan yapıp suyunu da pilav suyuna katarsanız lezzet katmanlanır.",
    servingSuggestion:
      "Yanında sarımsaklı yoğurt ve közlenmiş yeşil biber turşusuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağı ve zeytinyağını ısıtın; tavuğu yüksek ateşte 6 dakika sotelendirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "İnce doğranmış soğanı ekleyip 4 dakika pembeleştirin; ezilmiş sarımsak ve salçayı katıp 1 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Arpa şehriyeyi ekleyip 2 dakika çevirerek altın rengi alana kadar kavurun.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Haşlanmış nohut ve 2.5 su bardağı sıcak suyu ekleyin; kapağı kapalı kısık ateşte 12-15 dakika pişirin.", timerSeconds: 780 },
      { stepNumber: 6, instruction: "Ocaktan alın, üzerine temiz havlu örtüp 10 dakika dinlendirin; çatalla havalandırıp servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 7: tavuklu-yesil-mercimekli-pirinc (TUTARSIZLIK + Yozgat KESIF) ─
  {
    type: "rewrite",
    slug: "tavuklu-yesil-mercimek-pilavi-yozgat-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + Yozgat KRITIK KESIF dusur. Yozgat klasigi MERCIMEKLI BULGUR (yarma+yesil mercimek+tereyagi); pirincli mercimek pilavi Yozgat KANITSIZ (Yozgat Tarim Orman Bakanligi resmi yemek envanterinde YOK + Yemek.com Yozgat yemekleri listesinde de YOK). DB step 3 'tuz, baharat ve eksi malzemeyi ayri kapta birlestirin' LISTEDE TUZ + BAHARAT YOK = TUTARSIZLIK + jenerik şablon. Step 7 boilerplate. Klasik mucadara pattern (Dogu Akdeniz: pirinc + mercimek + sogan + tereyagi). Title 'Tavuklu Yesil Mercimekli Pirinc Pilavi' (Yozgat tamamen dusur). 6 ingredient_add (kuru sogan + sarimsak + tereyagi + zeytinyagi + tuz + karabiber + opsiyonel kimyon), 6 step replace, total 32→55 dk.",
    sources: [
      "https://yozgat.tarimorman.gov.tr/Menu/61/Yemekler",
      "https://yemek.com/yozgat-yemekleri/",
      "https://yemek.com/tarif/mercimekli-pilav/",
    ],
    newTitle: "Tavuklu Yeşil Mercimekli Pirinç Pilavı",
    description:
      "Yeşil mercimek ve pirincin birlikte pişirildiği bu tek tencere pilav, Doğu Akdeniz'den Anadolu'ya uzanan mücadara geleneğinin sade bir yorumu. Tavuk göğsü ekleyince doyurucu bir ana yemek oluyor. Tereyağı ve sotelenmiş soğan, bütün lezzeti bir araya bağlıyor.",
    prepMinutes: 25,
    cookMinutes: 30,
    totalMinutes: 55,
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kimyon (opsiyonel)", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Yeşil mercimeği önceden haşlayıp suyunu süzün; çiğ eklerseniz pirinç fazla pişer, mercimek hâlâ sert kalabilir. Pirinci ılık tuzlu suda bekletmek tanelerin diri kalmasını sağlar.",
    servingSuggestion:
      "Yanında soğuk yoğurt ve domates-salatalık-maydanoz salatasıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Pirinci ılık tuzlu suda 20 dakika bekletip süzüp durulayın.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Tavuk göğsünü 2 cm küpler halinde doğrayın; tuz ve karabiberle baharatlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tencerede tereyağı ve zeytinyağını ısıtın; ince doğranmış soğanı 4 dakika pembeleştirin, ezilmiş sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Tavuğu ekleyip yüksek ateşte 5 dakika dış yüzü beyazlayana kadar sotelendirin; opsiyonel kimyonu serpin.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Süzülmüş pirinci ekleyip 2 dakika çevirin, taneler şeffaflaşsın; haşlanmış yeşil mercimek ve 2.5 su bardağı sıcak suyu katın.", timerSeconds: 120 },
      { stepNumber: 6, instruction: "Kaynayınca kapağı kapalı kısık ateşte 15-18 dakika su çekilene kadar pişirin; ocaktan alıp 10 dakika dinlendirip servis edin.", timerSeconds: 1080 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-23");
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
              paket: "oturum-29-mini-rev-batch-23",
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
