/**
 * Tek-seferlik manuel mini-rev batch 20 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 18+ kaynak (Sakiz Mastigi PDO + Ege/
 * Mugla zeytinyagli kabak cicegi + Sicilian/Provence papatya limon
 * Akdeniz + TDK Saglik Bitkileri papatya 8-10 dk + TDK Yemek Sozlugu
 * katmer + Antep Katmeri CI 22.09.2008 tescil 86 + Ayvalik
 * Zeytinyagi CI + Edremit Korfezi Zeytinyagi CI + Siirt KTB yoresel
 * mutfak + TDK Anadolu Mutfak Ansiklopedisi bulgur pilavi + Gaziantep/
 * Sanliurfa nohutlu bulgur + Sirnak yoresel + Dogu/Guneydogu otlu
 * gozleme + Kocaeli yoresel + Marmara fırın biber + Peru klasik tatli
 * envanteri + Latin Amerika ananas+tarcin).
 *
 * Verdict: 7 REWRITE. 1 cuisine 'pe' korunur (esin atfı), 6 'tr'
 * korunur. 6 title degisimi (1 title KORUNUR: Mugla sakizli kabak
 * cicegi dolmasi sakizli dokunus gercek).
 *
 * 1 KRITIK CI CATIŞMA (#5): Antep Katmeri CI 86 (22.09.2008 tescil);
 * Ayvalik zeytin ezmeli lorlu KATMER cati ihlal eder, 'katmer tarzi
 * gozleme' disambiguate.
 *
 * 1 KRITIK STEP EKSIK FIX (#7): Yalova papatyali limonata sadece 3
 * step + papatya demlenmiyor (klasik papatya cay 8-10 dk demleme +
 * sogutma kritik).
 *
 * 1 KRITIK BOILERPLATE LEAK (#3): Sirnak otlu gozleme step 6
 * 'peynirli doku sertlesir' (peynir tarifi degil).
 *
 * 1 KRITIK TUTARSIZLIK (#1): Mugla sakizli step 3 'dereotu ve baharat'
 * listede YOK.
 *
 *   1. sakizli-kabak-cicegi-dolmasi-mugla-usulu (TUTARSIZLIK + title
 *      KORUNUR): Damla sakizi Sakiz Adasi PDO; Ege/Mugla zeytinyagli
 *      kabak cicegi dolmasi klasik (Bodrum + Datca + Marmaris). DB
 *      step 3 dereotu+baharat listede YOK. Title 'Mugla Sakizli Kabak
 *      Cicegi Dolmasi' KORUNUR (sakizli dokunus Ege gerçek). 6
 *      ingredient_add (dereotu + nane + maydanoz + tuz + karabiber +
 *      limon suyu), 6 step replace zeytinyagli dolma klasik akış,
 *      total 50→60 dk.
 *
 *   2. susamli-biber-dizmesi-kocaeli-usulu (yumusat + jenerik fix):
 *      Kocaeli yoresel: pismaniye + Kandira yogurdu + ihlamur (susamli
 *      biber dizmesi yore kanit YOK). DB step 2-3 'sosunu/baglayici
 *      harci' + 'sekil verme' jenerik şablon (biber dizmesi sekil
 *      verilmez). Title 'Susamli Fırın Biber Dizmesi'. 4 ingredient_
 *      add (sarimsak + kuru kekik + tuz + opsiyonel pul biber), 1
 *      amount change (zeytinyagi 1→2 yk yetersiz), 5 step replace
 *      firin biber dizmesi klasik akış (yikamadan yarila + zeytinyagi
 *      sosu + sira tepside + susam topping + 200°C 18 dk firin +
 *      dinlendir).
 *
 *   3. tandir-otlu-gozleme-sirnak-usulu (BOILERPLATE LEAK + yumusat):
 *      Sirnak yoresel envanter: kutlik + serbidev + perdepilav + kipe
 *      (otlu gozleme yore tescil YOK). DB step 6 'peynirli doku
 *      sertlesir' BOILERPLATE LEAK (otlu gozleme tarif peynir cumle
 *      YANLIS). DB step 1-2 jenerik scaffold. Tandir pratikte ev
 *      mutfagi zor (sac kullanilir). Title 'Dogu Anadolu Esintili
 *      Otlu Gozleme'. 4 ingredient_add (tuz hamur icin + sogan +
 *      tereyagi + opsiyonel beyaz peynir/cokelek varyant), 6 step
 *      replace temiz akış, total 35→55 dk.
 *
 *   4. tarcinli-ananas-kup-peru-usulu (yumusat + cuisine korunur):
 *      Peru klasik tatli envanter: suspiro a la limena + arroz con
 *      leche + mazamorra morada + picarones (tarcinli ananas kup
 *      kanon DEGIL). Latin Amerika genel ananas+tarcin yaygin
 *      (Meksika agua de pina + Brezilya abacaxi). cuisine 'pe' KORUNUR
 *      esin atfı. Title 'Latin Amerika Esintili Tarçinli Ananas
 *      Yogurt Kupu'. 3 ingredient_add (vanilya esansi + limon kabugu +
 *      opsiyonel hindistan cevizi), 5 step replace (ananas balla
 *      kavurma + sogut + yogurt katmanla servis).
 *
 *   5. zeytin-ezmeli-lorlu-katmer-ayvalik-usulu (CI CATIŞMA fix):
 *      Antep Katmeri CI 86 (22.09.2008 tescil) klasik tatli formul:
 *      kaymak + Antep fistigi + irmik + un. Ayvalik zeytin ezmeli
 *      lorlu KATMER cati ihlal eder. Ayvalik Zeytinyagi + Edremit
 *      Korfezi Zeytinyagi CI tescilli (kanıtlı). Title 'Ayvalik
 *      Esintili Zeytin Ezmeli Lorlu Katmer Tarzi Gozleme' disambiguate
 *      (Antep CI catışmasından kacin). 3 ingredient_add (ilik su +
 *      tuz + opsiyonel maydanoz), 1 amount change (zeytin ezmesi
 *      3→2.5 yk tuz dengesi lor ile), 6 step replace, total 30→54 dk.
 *
 *   6. tavuklu-bulgurlu-nohut-pilavi-siirt-usulu (yumusat + 8 eksik):
 *      Siirt yoresel: buryan + perde pilavi + sembusek + kavut +
 *      pirincli icli kofte (tavuklu bulgurlu nohutlu pilav yore kayit
 *      YOK). DB hicbir aromatik (sogan/sarimsak/yag/tuz/karabiber)
 *      YOK = jenerik scaffold. Klasik bulgur pilavi formul: bulgur +
 *      sogan + salca + tereyagi/yag + tuz + karabiber. Title 'Tavuklu
 *      Bulgurlu Nohut Pilavi' (Siirt dusur). 8 ingredient_add (kuru
 *      sogan + sarimsak + domates salcasi + tereyagi + zeytinyagi +
 *      tuz + karabiber + opsiyonel kuru nane), 1 amount change (su
 *      2.5→3 sb bulgur+nohut emisi), 6 step replace, total 32→56 dk.
 *
 *   7. papatyali-soguk-limonata-yalova-usulu (KRITIK STEP EKSIK +
 *      yumusat): Yalova spesifik kanit YOK; Akdeniz/Provence/Sicilya
 *      papatya+limon yaz icecek pattern. DB sadece 3 step + papatya
 *      DEMLENMIYOR (step 1 limon+seker+aromatik karistirin papatya
 *      direkt suya atilmis = klasik papatya cay degil). TDK Saglik
 *      Bitkileri papatya 8-10 dk demleme optimal. Title 'Soguk
 *      Papatyali Limonata' (Yalova dusur). 2 ingredient_add (buz
 *      servis + opsiyonel taze nane), 2 amount change (papatya
 *      1tk→2tk demleme yogunlugu + seker 0.25sb→3yk dengeli
 *      tatlandirma), 6 step replace (suyu kaynat + papatya 8-10 dk
 *      demle + suz + seker eritil + 30 dk oda + 20 dk buzdolabi +
 *      buzlu servis + nane), total 12→50 dk soğutma kritik.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-20.ts
 *   npx tsx scripts/fix-mini-rev-batch-20.ts --env prod --confirm-prod
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
  // ─── 1: mugla-sakizli-kabak-cicegi-dolmasi (TUTARSIZLIK fix) ─────
  {
    type: "rewrite",
    slug: "sakizli-kabak-cicegi-dolmasi-mugla-usulu",
    reason:
      "REWRITE TUTARSIZLIK FIX + title KORUNUR. Damla sakizi Sakiz Adasi PDO; Ege/Mugla zeytinyagli kabak cicegi dolmasi klasik (Bodrum + Datca + Marmaris). DB step 3 'ezilmis damla sakizi, dereotu ve baharat' diyor LISTEDE DEREOTU YOK + BAHARAT YOK = TUTARSIZLIK. Title 'Mugla Sakizli Kabak Cicegi Dolmasi' KORUNUR (sakizli dokunus Ege gerçek). 6 ingredient_add (dereotu + taze nane + maydanoz + tuz + karabiber + limon suyu), 6 step replace zeytinyagli dolma klasik akış (cicek temizleme + soğan/pirinç kavurma + harç hazirla + cicek doldur + tencere ağir taş baski + 25 dk pisirme), total 50→60 dk.",
    sources: [
      "https://en.wikipedia.org/wiki/Mastic_(plant_resin)",
      "https://www.kulturportali.gov.tr/portal/mugla",
      "https://yemek.com/tarif/zeytinyagli-kabak-cicegi-dolmasi/",
    ],
    description:
      "Ege'nin nazik yaz lezzeti kabak çiçeği dolmasına Muğla mutfağındaki sakızlı dokunuş eşlik ediyor. Pirinçli iç harç, dereotu ve naneyle ferahlarken damla sakızı arka planda hafif reçineli bir aroma bırakıyor. Soğuk servis edilen klasik bir zeytinyağlı.",
    prepMinutes: 30,
    cookMinutes: 30,
    totalMinutes: 60,
    ingredientsAdd: [
      { name: "Taze dereotu", amount: "0.5", unit: "demet" },
      { name: "Taze nane", amount: "5", unit: "dal" },
      { name: "Taze maydanoz", amount: "0.5", unit: "demet" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Çiçekleri toplar toplamaz işlemek gerekir, beklerse kapanır. İçindeki dişicikleri çıkarmayı atlamayın, acılaştırır.",
    servingSuggestion:
      "Oda sıcaklığında, üzerine birkaç damla limon ve sade yoğurtla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabak çiçeklerini nazikçe açın, içlerindeki dişicikleri çıkarıp ters çevirerek bekletin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Pirinci yıkayıp süzün; ince doğranmış soğanı zeytinyağında orta ateşte 5 dakika pembeleştirin, pirinci ekleyip 3 dakika daha çevirin.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Ezilmiş damla sakızını, ince kıyılmış dereotu, nane, maydanoz, tuz ve karabiberi harca ekleyip 1 dakika çevirin; ocaktan alıp ılıtın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Çiçekleri yarıya kadar doldurun (pirinç şişince patlamasın); ucu hafif kıvırarak kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Dolmaları tencereye sıkıca dizin; üzerine 1 su bardağı sıcak su, limon suyu ve kalan zeytinyağını ekleyip ağır bir tabakla bastırın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kısık ateşte 25 dakika pişirin, ocaktan alıp 10 dakika dinlendirip soğuk servis edin.", timerSeconds: 1500 },
    ],
  },

  // ─── 2: susamli-biber-dizmesi-kocaeli (yumusat + jenerik fix) ────
  {
    type: "rewrite",
    slug: "susamli-biber-dizmesi-kocaeli-usulu",
    reason:
      "REWRITE Kocaeli yore yumusat + jenerik şablon fix. Kocaeli yoresel: pismaniye + Kandira yogurdu + ihlamur (susamli biber dizmesi yore kanit YOK). DB step 2-3 'sosunu/baglayici harci' + 'sekil verme' jenerik şablon (biber dizmesi sekil verilmez). Title 'Susamli Fırın Biber Dizmesi'. 4 ingredient_add (sarimsak + kuru kekik + tuz + opsiyonel pul biber), 1 amount change (zeytinyagi 1→2 yk yetersiz), 5 step replace firin biber dizmesi klasik akış.",
    sources: [
      "https://www.kocaeli.bel.tr/icerik/kocaeli-mutfagi",
      "https://yemek.com/tarif/firin-biber/",
    ],
    newTitle: "Susamlı Fırın Biber Dizmesi",
    description:
      "Tatlı kırmızı biberler zeytinyağı, sarımsak ve kekikle harmanlanıp fırında kavruluyor; üzerine serpilen susam hafif bir kuruyemiş notası bırakıyor. Mezelik ya da kahvaltıya yakışan sade bir tabak. Soğuk da sıcak da yenir.",
    prepMinutes: 10,
    cookMinutes: 18,
    totalMinutes: 28,
    ingredientsAmountChange: [
      { name: "Zeytinyağı", newAmount: "2", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Kuru kekik", amount: "1", unit: "çay kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Pul biber (opsiyonel)", amount: "0.25", unit: "çay kaşığı" },
    ],
    tipNote:
      "Etli, kalın çeperli kapya tipi biberler en iyisi; sulu sivri biberler tepside cıvır. Susamı son 5 dakikada eklerseniz yanmaz.",
    servingSuggestion:
      "Yanında taze ekmek ve bir kase süzme yoğurt.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Biberleri yıkayın, saplarını kısaltın, uzunlamasına yarıya bölüp çekirdeklerini çıkarın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kâsede zeytinyağı, ezilmiş sarımsak, kuru kekik, tuz ve opsiyonel pul biberi karıştırın; biberleri bu sosa bulayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Biberleri fırın tepsisine kesik yüzleri yukarı bakacak şekilde tek sıra dizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "200°C ön ısıtılmış fırında 13 dakika pişirin; çıkarıp üzerlerine susamı serpin, 5 dakika daha pişirin (kenarlar hafif kararsın).", timerSeconds: 1080 },
      { stepNumber: 5, instruction: "Fırından çıkarın, 5 dakika dinlendirip oda sıcaklığında veya ılık servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 3: tandir-otlu-gozleme-sirnak (BOILERPLATE LEAK + yumusat) ──
  {
    type: "rewrite",
    slug: "tandir-otlu-gozleme-sirnak-usulu",
    reason:
      "REWRITE BOILERPLATE LEAK FIX + yore yumusat. Sirnak yoresel envanter: kutlik + serbidev + perdepilav + kipe (otlu gozleme yore tescil YOK). DB step 6 'peynirli doku sertlesir' BOILERPLATE LEAK (otlu gozleme tarifi peynir cumle YANLIS). DB step 1-2 jenerik scaffold ('servis tabagini hazirlayin' + 'tavayi 2 dk isitin'). Tandir pratikte ev mutfagi zor (sac kullanilir). Title 'Dogu Anadolu Esintili Otlu Gozleme'. 4 ingredient_add (tuz hamur icin + sogan + tereyagi + opsiyonel beyaz peynir/cokelek varyant), 6 step replace temiz akış, total 35→55 dk.",
    sources: [
      "https://yemek.com/tarif/otlu-gozleme/",
      "https://www.lezzet.com.tr/yemek-tarifleri/hamurisi-tarifleri/gozleme-tarifleri",
      "https://blog.biletbayi.com/sirnakin-meshur-yemekleri.html/",
    ],
    newTitle: "Doğu Anadolu Esintili Otlu Gözleme",
    description:
      "İnce açılmış yufkanın arasına soğanla soldurulmuş yeşillikler yerleşiyor, sacın üzerinde iki yüzü de hafifçe kavruluyor. Doğu Anadolu kahvaltı sofralarına yakışan sade bir gözleme. Yanında ayran her şeyi tamamlar.",
    prepMinutes: 30,
    cookMinutes: 25,
    totalMinutes: 55,
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Beyaz peynir veya çökelek (opsiyonel)", amount: "100", unit: "gr" },
    ],
    tipNote:
      "Otların suyunu iyi süzün; hamur yapışır ve gözleme yumuşamaz. Sacın iyice ısınmış olması katmanların kabarması için şart.",
    servingSuggestion:
      "Sıcak servis edin, yanında soğuk ayran ve birkaç dilim domates.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Unu büyük kâseye alın, tuzu ekleyip karıştırın; suyu yavaş yavaş ekleyerek yumuşak hamur yoğurun. Üzerini örtüp 20 dakika dinlendirin.", timerSeconds: 1200 },
      { stepNumber: 2, instruction: "Otları yıkayıp iyice süzün; ince ince doğrayın, soğanı çok ince kıyın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Tavada tereyağını eritip soğanı 3 dakika kavurun; otları ekleyip 2 dakika soldurun, tuzla aroma verin. Opsiyonel peynir/çökelek harç ılıkken eklenir; harcı soğutun.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Hamuru cevizden büyük bezelere bölün; her bezeyi merdane veya oklavayla ince yuvarlak açın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Hamurun yarısına harcı yayıp üzerini katlayın, kenarları bastırarak kapatın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kızgın saca veya geniş tavaya alın, iki yüzünü 2-3 dakika altın renge dönene kadar pişirin; sıcakken üzerine tereyağı sürerek servis edin.", timerSeconds: 360 },
    ],
  },

  // ─── 4: tarcinli-ananas-kup-peru (yumusat + cuisine korunur) ─────
  {
    type: "rewrite",
    slug: "tarcinli-ananas-kup-peru-usulu",
    reason:
      "REWRITE yumusat + cuisine 'pe' KORUNUR (esin atfı). Peru klasik tatli envanter: suspiro a la limena + arroz con leche + mazamorra morada + picarones (tarcinli ananas kup kanon DEGIL). Latin Amerika genel ananas+tarcin yaygin (Meksika agua de pina con canela + Brezilya abacaxi com canela). cuisine 'pe' korunur; title disambiguate 'Latin Amerika Esintili Tarçinli Ananas Yogurt Kupu'. 3 ingredient_add (vanilya esansi + limon kabugu + opsiyonel hindistan cevizi), 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Peruvian_cuisine",
      "https://www.tasteatlas.com/peruvian-desserts",
      "https://en.wikipedia.org/wiki/Pineapple#Culinary_uses",
    ],
    newTitle: "Latin Amerika Esintili Tarçınlı Ananas Yoğurt Kupu",
    description:
      "Ananas balla hafifçe karamelize ediliyor, tarçınla lezzetlendirilmiş süzme yoğurdun arasına katmanlanıyor. Tropikal meyve ve baharat ikilisini sadeleştiren modern bir kase tatlısı; Peru ve Latin Amerika'da yaygın olan ananas, tarçın eşleşmesinden esinlenir. Yaz öğleden sonralarına ferah bir bitiş.",
    prepMinutes: 15,
    cookMinutes: 5,
    totalMinutes: 30,
    ingredientsAdd: [
      { name: "Vanilya esansı", amount: "0.5", unit: "çay kaşığı" },
      { name: "Limon kabuğu rendesi (opsiyonel)", amount: "1", unit: "çay kaşığı" },
      { name: "Rendelenmiş Hindistan cevizi (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Ananasın suyunu iyi süzün, yoksa yoğurt sulanır. Karamelize ananası yoğurdun üzerine eklemeden önce mutlaka soğutun, sıcak meyve yoğurdu keser.",
    servingSuggestion:
      "Soğuk şeffaf bardakta, üzerine birkaç nane yaprağı.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ananası 1 cm küpler halinde doğrayın, suyunu hafifçe süzün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavada ananası bal ve yarım çay kaşığı tarçınla orta ateşte 4 dakika sotelendirin; kenarlar karamelize olunca ocaktan alıp soğutun.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Süzme yoğurdu kâseye alın, kalan tarçın, vanilya esansı ve opsiyonel limon kabuğu rendesini katlayarak karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Servis bardaklarına bir kat yoğurt, bir kat soğuk karamelize ananas dizerek katmanlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine bir tutam tarçın ve istenirse rendelenmiş Hindistan cevizi serpin; soğukken servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: ayvalik-zeytin-ezmeli-lorlu-katmer (CI ÇATIŞMA fix) ──────
  {
    type: "rewrite",
    slug: "zeytin-ezmeli-lorlu-katmer-ayvalik-usulu",
    reason:
      "REWRITE CI ÇATIŞMA fix + ingredient ekle. Antep Katmeri Türk Patent CI 86 (22.09.2008 tescil) klasik tatli formul: kaymak + Antep fistigi + irmik + un. Ayvalik zeytin ezmeli lorlu KATMER cati ihlal eder. Ayvalik Zeytinyagi + Edremit Korfezi Zeytinyagi CI tescilli (kanıtlı). Title 'Ayvalik Esintili Zeytin Ezmeli Lorlu Katmer Tarzi Gozleme' disambiguate (Antep CI catışmasından kacin). 3 ingredient_add (ilik su + tuz + opsiyonel maydanoz), 1 amount change (zeytin ezmesi 3→2.5 yk tuz dengesi lor ile), 6 step replace, total 30→54 dk.",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/86",
      "https://www.kulturportali.gov.tr/portal/ayvalik-zeytinyagi",
      "https://www.lezzet.com.tr/yemek-tarifleri/hamurisi-tarifleri/gozleme-tarifleri",
    ],
    newTitle: "Ayvalık Esintili Zeytin Ezmeli Lorlu Katmer Tarzı Gözleme",
    description:
      "Ayvalık zeytinyağı ve zeytin ezmesinin kuvvetli aromasını yumuşak lor peyniriyle dengeleyen, ev tipi katmer tarzı bir gözleme. Hamur ince açıldığında dış yüzey çıtır, iç kısım yumuşak kalır. Sade bir kahvaltı veya hafif öğün için uygun.",
    prepMinutes: 35,
    cookMinutes: 14,
    totalMinutes: 54,
    ingredientsAmountChange: [
      { name: "Zeytin ezmesi", newAmount: "2.5", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Ilık su", amount: "0.75", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Taze maydanoz (opsiyonel)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamuru dinlendirmeden açmaya kalkışırsan geri çeker, 20 dakika örtülü beklemesi ince açılmasının anahtarı. Lor fazla sulu ise süzgeçte 10 dakika bekleterek suyunu alın.",
    servingSuggestion:
      "Yanında soğuk ayran veya demli çay, üzerine ince kıyılmış taze maydanoz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş kâsede unu, tuzu, ılık suyu ve 1 yemek kaşığı zeytinyağını birleştirip yumuşak hamur olana kadar 8 dakika yoğurun.", timerSeconds: 480 },
      { stepNumber: 2, instruction: "Hamurun üzerini örtüp 20 dakika dinlendirin; gluten gevşesin.", timerSeconds: 1200 },
      { stepNumber: 3, instruction: "Hamuru 4 bezeye bölün; her bezeyi merdaneyle olabildiğince ince yuvarlak açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Açtığınız hamura kalan zeytinyağını sürün; zeytin ezmesini ince yayın, lor peynirini ufalayıp eşit dağıtın, opsiyonel maydanozu serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Hamuru rulo şeklinde sıkıca sarın; rulonun iki ucunu birleştirip spiral yapın veya yarım ay şeklinde katlayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kızgın tavada yağsız olarak iki yüzünü 6-7 dakika altın renge dönene kadar pişirin; sıcakken servis edin.", timerSeconds: 840 },
    ],
  },

  // ─── 6: tavuklu-bulgurlu-nohut-pilavi-siirt (yumusat + 8 eksik) ──
  {
    type: "rewrite",
    slug: "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu",
    reason:
      "REWRITE Siirt yore yumusat + 8 eksik klasik bilesen. Siirt yoresel: buryan + perde pilavi + sembusek + kavut + pirincli icli kofte (tavuklu bulgurlu nohutlu pilav yore kayit YOK). DB hicbir aromatik (sogan/sarimsak/yag/tuz/karabiber) YOK = jenerik scaffold. Klasik bulgur pilavi formul: bulgur + sogan + salca + tereyagi/yag + tuz + karabiber. Title 'Tavuklu Bulgurlu Nohut Pilavi' (Siirt dusur). 8 ingredient_add (kuru sogan + sarimsak + domates salcasi + tereyagi + zeytinyagi + tuz + karabiber + opsiyonel kuru nane), 1 amount change (su 2.5→3 sb bulgur+nohut emisi), 6 step replace, total 32→56 dk.",
    sources: [
      "https://yemek.com/tarif/bulgur-pilavi/",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-tarifleri",
      "https://siirt.ktb.gov.tr/TR-149107/yore-mutfagi.html",
    ],
    newTitle: "Tavuklu Bulgurlu Nohut Pilavı",
    description:
      "Tavuk göğsünün yumuşaklığı, nohutun dolgunluğu ve bulgurun kavruk aromasını birleştiren tek tencere ev pilavı. Domates salçası ve kuru soğan klasik Anadolu pilav tabanını verir. Yanında salata veya yoğurt ile öğün tamamlanır.",
    prepMinutes: 18,
    cookMinutes: 38,
    totalMinutes: 56,
    ingredientsAmountChange: [
      { name: "Su", newAmount: "3", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Kuru soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kuru nane (opsiyonel)", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Bulguru salçayla 2 dakika kavurmadan su eklersen pilav lapa olur, kavurma adımı tane tane çıkmasının sırrı. Nohutu önceden haşlamadıysan konserve nohut süzüp son 5 dakikada ekleyin.",
    servingSuggestion:
      "Yanında sade yoğurt veya çoban salata, üstüne kuru nane.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küplere doğrayın; tuz ve karabiberle baharatlayın. Geniş tencerede tereyağı ile zeytinyağını ısıtıp tavuğu yüksek ateşte 6-7 dakika sotelendirin.", timerSeconds: 420 },
      { stepNumber: 2, instruction: "İnce doğranmış soğanı ekleyip orta ateşte 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Ezilmiş sarımsağı ve domates salçasını ekleyip 1 dakika kavurun, salça kokusu açılsın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Bulguru ekleyip 2 dakika çevirerek kavurun; taneler parlasın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Haşlanmış nohut, 3 su bardağı sıcak su ve tuzu ekleyin; tencere kapağı kapalı kısık ateşte 15 dakika pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alın, üzerine temiz havlu örtüp 10 dakika dinlendirin; kuru nane serpip servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 7: papatyali-soguk-limonata-yalova (KRITIK STEP EKSIK) ──────
  {
    type: "rewrite",
    slug: "papatyali-soguk-limonata-yalova-usulu",
    reason:
      "REWRITE KRITIK STEP EKSIK FIX + Yalova yumusat. Yalova spesifik kanit YOK; Akdeniz/Provence/Sicilya papatya+limon yaz icecek pattern. DB sadece 3 step + papatya DEMLENMIYOR (step 1 'limon, seker, aromatik karistirin' direkt suya = klasik papatya cay degil). TDK Saglik Bitkileri papatya 8-10 dk demleme optimal. Title 'Soguk Papatyali Limonata' (Yalova dusur). 2 ingredient_add (buz servis + opsiyonel taze nane), 2 amount change (papatya 1tk→2tk demleme yogunlugu + seker 0.25sb→3yk dengeli tatlandirma), 6 step replace (suyu kaynat + papatya 8-10 dk demle + suz + seker eritil + 30 dk oda + 20 dk buzdolabi + buzlu servis), total 12→50 dk.",
    sources: [
      "https://en.wikipedia.org/wiki/Matricaria_chamomilla",
      "https://yemek.com/tarif/papatyali-limonata/",
    ],
    newTitle: "Soğuk Papatyalı Limonata",
    description:
      "Papatyanın yumuşak çiçeksi aroması ile limonun keskin ferahlığını birleştiren soğuk yaz içeceği. Demleme ve soğutma adımları tadın yoğunluğu için kritik. Sıcak günlerde ikindi serinliği veya akşamüstü içeceği olarak uygun.",
    prepMinutes: 8,
    cookMinutes: 12,
    totalMinutes: 50,
    ingredientsAmountChange: [
      { name: "Papatya", newAmount: "2", newUnit: "tatlı kaşığı" },
      { name: "Şeker", newAmount: "3", newUnit: "yemek kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Buz", amount: "1", unit: "su bardağı" },
      { name: "Taze nane (opsiyonel)", amount: "5", unit: "yaprak" },
    ],
    tipNote:
      "Papatyayı 10 dakikadan fazla demlerseniz acılaşır, süreye dikkat. Limonu en sona ekleyin; sıcak demde limon kaynatılırsa C vitamini ve aroma kaybolur.",
    servingSuggestion:
      "Uzun bardakta bol buz, üzerine taze nane yaprağı ve ince limon dilimi.",
    stepsReplace: [
      { stepNumber: 1, instruction: "3 su bardağı suyu tencerede kaynama noktasına getirin, ocağı kapatın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Papatyayı sıcak suya ekleyip kapağını örtün; 8-10 dakika demleyin.", timerSeconds: 540 },
      { stepNumber: 3, instruction: "Demlenen suyu ince süzgeçten süzüp papatyayı ayırın; sıcak demin içine şekeri ekleyip eriyene kadar karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Demi 30 dakika oda sıcaklığında soğutun; ardından 20 dakika buzdolabında soğutun.", timerSeconds: 3000 },
      { stepNumber: 5, instruction: "Soğutulan deme limon suyunu ekleyip karıştırın; limonu sıcakken eklemeyin, aroma uçar.", timerSeconds: null },
      { stepNumber: 6, instruction: "Servis bardaklarına bol buz koyup üzerine soğuk papatyalı limonatayı dökün; opsiyonel nane yaprağı ve ince limon dilimi ile süsleyip servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-20");
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
              paket: "oturum-29-mini-rev-batch-20",
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
