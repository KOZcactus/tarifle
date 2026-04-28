/**
 * Tek-seferlik manuel mini-rev batch 21 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 18+ kaynak (Tatil Budur Batman/Mardin
 * yoresel + Guneydogu yarma corbasi pattern + Ozkok Sahrap Soysal Ege
 * meze + Ayvalik/Urla zeytinyagli meze + Sivas KTB Gurun/Sarkisla
 * kusburnusu + Turk Patent CI 269 Gurun + CI 282 Sarkisla + Turk
 * Patent CI 53 Adana Salgam Suyu 24.02.2003 + Tugce Erol modern
 * barmen literaturu + Turk Patent CI 65 Beypazari Kurusu 21.05.2007 +
 * CI 230 Beypazari Tarhanasi 31.07.2017 + Beypazari yoresel mancılık
 * tava coregi + Ege/Cesme damla sakizi + Izmir BB gastronomi rehberi).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (7 'tr' korunur). 6 title degisimi
 * (1 KORUNUR: Beypazari Tava Coregi, CI cevresi yöresel klasik kanitli).
 *
 * 3 KRITIK FIX:
 *  - #5 TUTARSIZLIK: sivas-kusburnulu step 3 'sicak su' listede YOK
 *    + tuz/karabiber listede YOK
 *  - #6 BOILERPLATE LEAK FULL: izmir-zeytin-yaprak-sarma step 4
 *    'firinda disi kizarana kadar pissin' YANLIS (sarma soguk meze,
 *    pisirmiyor)
 *  - #4 yore KORUNUR + step jenerik+boilerplate temizle
 *
 * 3 KRITIK CI ATIF:
 *  - Beypazari Kurusu CI 65 (21.05.2007) + Beypazari Tarhanasi CI 230
 *    (31.07.2017) - title KORUNUR yoresel klasik kanit
 *  - Sivas Gurun Kusburnusu CI 269 + Sarkisla Kusburnusu CI 282 - cuisine
 *    'tr' korunur, title yumusatma 'Sivas Esintili'
 *  - Adana Salgam Suyu CI 53 (24.02.2003 mahrec, Adana BB) - cuisine
 *    'tr' korunur, modern kokteyl disambiguate
 *
 *   1. salcali-yarma-corbasi-batman-usulu (yumusat + ingredient): Batman
 *      ozel kanit yok (Tatil Budur Batman: kibe, peliçe, kelaha,
 *      klorik); klasik Guneydogu yarma+salça pattern. Title 'Guneydogu
 *      Esintili Salçali Yarma Çorbasi'. 4 ingredient_add (zeytinyagi
 *      + tereyagi + tuz + sarimsak), 6 step replace (yarma islatma +
 *      sogan/salca kavurma + yarma+su 25 dk + tereyagda nane servis).
 *
 *   2. sumakli-nohut-corbasi-mardin-usulu (yumusat + ingredient):
 *      Mardin klasik (alluciye + firkiye + kibe + sembusek); sumakli
 *      nohut corbasi Mardin imza degil. Title 'Guneydogu Esintili
 *      Sumakli Nohut Çorbasi'. 4 ingredient_add (zeytinyagi + tuz +
 *      tereyagi + sarimsak), 6 step replace.
 *
 *   3. sakizli-lorlu-gozleme-izmir-usulu (yumusat + yufka gozlemesi
 *      disambiguate): Damla sakizi Ege/Cesme imzasi (sakizli
 *      dondurma/muhallebi/lokum kanonik); tuzlu lor harca sakiz
 *      modern. DB yufka kullaniyor (gercek gozleme acma hamur). Title
 *      'Ege Esintili Sakizli Lorlu Yufka Gözlemesi'. 3 ingredient_add
 *      (tuz + tereyagi tava sürme + opsiyonel taze nane), 5 step
 *      replace.
 *
 *   4. tava-coregi-beypazari-usulu (CI cevresi KORUNUR + jenerik fix):
 *      Beypazari Kurusu CI 65 (21.05.2007) + Beypazari Tarhanasi CI
 *      230 (31.07.2017); Beypazari yoresel mutfak kaniti guclu (kuru,
 *      güveç, tava coregi mancılık). Title 'Beypazari Tava Coregi'
 *      KORUNUR. DB step 2 jenerik 'kalan malzemeleri olcun' + step 6
 *      boilerplate 'tabakta su salip dokusu kaymasin' temizlenir. 2
 *      ingredient_add (yumurta sarisi opsiyonel + opsiyonel cörek
 *      otu/susam), 6 step replace temiz akış (mayalandirma 1 saat +
 *      kapakli tava 12-15 dk her yüz).
 *
 *   5. sivas-kusburnulu-bulgur-pilavi (TUTARSIZLIK FIX + Sivas
 *      kusburnusu CI atfı): DB step 3 'sicak suyu ekleyin' LISTEDE SU
 *      YOK = TUTARSIZLIK. Sivas Gurun Kusburnusu CI 269 (13.08.2018) +
 *      Sarkisla Kusburnusu CI 282 (29.10.2018). Title 'Sivas Esintili
 *      Kusburnulu Bulgur Pilavi' yumusatma (kombo modern). 3
 *      ingredient_add (sicak su 2.5 sb + tuz + karabiber), 6 step
 *      replace, total 32→35 dk.
 *
 *   6. zeytin-yaprakli-lor-sarma-izmir-usulu (BOILERPLATE LEAK FULL):
 *      DB step 1-5 TAMAMEN JENERIK SCAFFOLD ve YANLIS. Step 4 'firinda
 *      disi kizarana kadar pissin' YANLIS (sarma SOGUK meze, pisirmez).
 *      Klasik Ege zeytin yapragi sarmasi (Sahrap Soysal + Ayvalik/Urla
 *      meze geleni): yaprak yumusat + lor harç (dereotu + sarimsak +
 *      limon + tuz + zeytinyagi) + sar + 30 dk dinlendir + soguk
 *      servis. Title 'Izmir Esintili Zeytin Yaprakli Lor Sarma (Soguk
 *      Meze)' disambiguate. 4 ingredient_add (limon suyu + sarimsak +
 *      tuz + karabiber + opsiyonel maydanoz), 6 step replace SOGUK
 *      MEZE akış, total 20→55 dk dinlendirme dahil.
 *
 *   7. salgamli-narenciye-smash-adana-usulu (CI atif + modern
 *      disambiguate): Adana Salgam Suyu CI 53 (24.02.2003 mahrec, Adana
 *      BB resmi); klasik kullanim kebap yani icecek. Salgam+votka
 *      kokteyli modern fusion (2015+ Istanbul/Adana bar sahnesi). DB
 *      step OK ama eksik tuz kenari + acı biber. Title 'Adana
 *      Salgamli Narenciye Smash (Modern Kokteyl)' disambiguate. 3
 *      ingredient_add (acı kırmızı biber + tuz + limon dilimi), 5 step
 *      replace klasik kokteyl akış.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-21.ts
 *   npx tsx scripts/fix-mini-rev-batch-21.ts --env prod --confirm-prod
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
  // ─── 1: salcali-yarma-corbasi-batman (Guneydogu yumusat) ─────────
  {
    type: "rewrite",
    slug: "salcali-yarma-corbasi-batman-usulu",
    reason:
      "REWRITE Batman yore yumusat + 4 eksik klasik bilesen. Tatil Budur Batman yoresel: kibe + peliçe + kelaha + klorik; salçali yarma corbasi Batman imza DEGIL, klasik Guneydogu pattern (Sanliurfa + Diyarbakir + Mardin yarma corba ortak). Eksik klasik: zeytinyagi + tereyagi + tuz + sarimsak. Title 'Guneydogu Esintili Salçali Yarma Çorbasi'. 6 step replace klasik akış (yarma islat 1 saat + sogan kavur + sarimsak/salca kavur + yarma/su 25-30 dk + tereyagi/nane kavur servis), total 36→50 dk.",
    sources: [
      "https://www.tatilbudur.com/blog/batman-yemekleri-batmanin-meshur-yemekleri-listesi/",
      "https://yemek.com/tarif/salcali-yarma-corbasi/",
    ],
    newTitle: "Güneydoğu Esintili Salçalı Yarma Çorbası",
    description:
      "Güneydoğu mutfağının sade, doyurucu kış çorbalarından biri. Yarmanın diş diş dokusu, salçanın derin tadı ve son anda gezdirilen naneli tereyağı ile sıcak sofraya yakışıyor. Sıkı bir akşam başlangıcı.",
    prepMinutes: 15,
    cookMinutes: 35,
    totalMinutes: 50,
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
    ],
    tipNote:
      "Yarmayı en az 1 saat ılık suda ıslatmak pişme süresini kısaltır; aceleniz varsa düdüklü tencerede 15 dakika yeterli.",
    servingSuggestion:
      "Limon dilimi ve sıcak köy ekmeği ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yarmayı yıkayın, 1 saat ılık suda bekletip süzün; soğanı yemeklik doğrayın.", timerSeconds: 3600 },
      { stepNumber: 2, instruction: "Tencerede zeytinyağını ısıtın; soğanı orta ateşte 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Ezilmiş sarımsağı ve domates salçasını ekleyip 2 dakika kavurun, salça kokusu açılsın.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Süzülmüş yarmayı ekleyip 1 dakika çevirin; 5 su bardağı sıcak su ve tuzu ilave edin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kaynayınca kısık ateşte 25-30 dakika yarma yumuşayana kadar pişirin; ara ara karıştırın.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Servis öncesi ayrı tavada tereyağını eritip kuru naneyi 10 saniye kavurun; çorbanın üzerine gezdirip sıcak servis edin.", timerSeconds: 30 },
    ],
  },

  // ─── 2: sumakli-nohut-corbasi-mardin (Guneydogu yumusat) ─────────
  {
    type: "rewrite",
    slug: "sumakli-nohut-corbasi-mardin-usulu",
    reason:
      "REWRITE Mardin yumusat + 4 eksik klasik bilesen. Mardin klasik (alluciye + firkiye + kibe + sembusek + harire); sumakli nohut corbasi Mardin imza DEGIL. Sumakli corbalar Levant/Aleppo (musakhan + cağırtlak) genel pattern. Eksik klasik: zeytinyagi + tuz + tereyagi + sarimsak. Title 'Guneydogu Esintili Sumakli Nohut Çorbasi'. 6 step replace, total 30→35 dk.",
    sources: [
      "https://blog.biletbayi.com/mardin-yoresel-yemekler.html/",
      "https://yemek.com/tarif/sumakli-corba/",
    ],
    newTitle: "Güneydoğu Esintili Sumaklı Nohut Çorbası",
    description:
      "Sumakla ekşitilen sade nohut çorbası, Güneydoğu sofralarının hafif ama doyurucu seçeneği. Tereyağında kavrulmuş pul biber gezdirildiğinde sıcak ekmekle eşsiz ikili. Levant ve Aleppo mutfağının sumak ekşilik geleneğinden esinlenir.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
    ],
    tipNote:
      "Sumak suyunu pişirmenin sonuna ekleyin; uzun kaynatma ekşilik aromasını uçurur.",
    servingSuggestion:
      "Yanına bulgur pilavı ve közlenmiş yeşil biber yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Haşlanmış nohutları süzün; soğanı yemeklik doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede zeytinyağını ısıtın; soğanı orta ateşte 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Ezilmiş sarımsağı ekleyip 1 dakika çevirin, kokusu açılsın.", timerSeconds: 60 },
      { stepNumber: 4, instruction: "Nohut ve 4 su bardağı sıcak suyu ekleyin, tuzu katın; kaynayınca kısık ateşte 15 dakika kaynatın.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Sumak suyunu ilave edip 5 dakika daha pişirin (uzun kaynatmayın); tuzu son ayarlayın.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Ayrı tavada tereyağını eritip pul biber serpin; çorbanın üzerine gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: sakizli-lorlu-gozleme-izmir (Ege yumusat + yufka) ────────
  {
    type: "rewrite",
    slug: "sakizli-lorlu-gozleme-izmir-usulu",
    reason:
      "REWRITE Izmir yore yumusat + jenerik scaffold temizle + yufka gozlemesi disambiguate. Damla sakizi Ege/Cesme imzasi (sakizli dondurma/muhallebi/lokum kanonik); tuzlu lor harca sakiz dokunusu modern. DB yufka kullaniyor (gercek gozleme acma hamur ister); 'yufka gozlemesi' formuna daha yakin. Step 1-3 jenerik scaffold ('kuru ve yas malzemeleri ayirin', 'lorlu ic catalla ezin'). Title 'Ege Esintili Sakizli Lorlu Yufka Gözlemesi'. 3 ingredient_add (tuz + tereyagi tava sürme + opsiyonel taze nane), 5 step replace, total 28→30 dk.",
    sources: [
      "https://en.wikipedia.org/wiki/Mastic_(plant_resin)",
      "https://yemek.com/tarif/lorlu-gozleme/",
    ],
    newTitle: "Ege Esintili Sakızlı Lorlu Yufka Gözlemesi",
    description:
      "Ege'nin lor ve maydanozdan oluşan sade iç harcına Çeşme'nin imzası damla sakızı dokunuşu ekleniyor. Yufkanın çıtırlığı ile lorun yumuşaklığı dengede; kahvaltıya da öğle atıştırmasına da yakışıyor.",
    prepMinutes: 15,
    cookMinutes: 15,
    totalMinutes: 30,
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Tereyağı (tava sürme)", amount: "30", unit: "gr" },
      { name: "Taze nane (opsiyonel)", amount: "5", unit: "yaprak" },
    ],
    tipNote:
      "Damla sakızını şeker veya tuzla havanda çok ince dövün; iri tane kalırsa ağızda hoş olmayan reçineli his bırakır.",
    servingSuggestion:
      "Yanına demli çay ve dilimlenmiş domates ile sade Ege kahvaltısı kurulabilir.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Loru kâseye alın, ince kıyılmış maydanoz, opsiyonel taze nane, tuz ve dövülmüş damla sakızını ekleyip çatalla harmanlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yufkayı dörde bölün, üçgen şeklinde açın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş ucuna 2 yemek kaşığı harç koyun, üçgen şeklinde sarın; kenarları bastırarak kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavayı orta ateşte ısıtıp tereyağını eritin; gözlemeleri iki yüzü altın renge dönene kadar 3-4 dakika her yüzünü pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Üzerine zeytinyağını gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: tava-coregi-beypazari (CI cevresi KORUNUR) ────────────────
  {
    type: "rewrite",
    slug: "tava-coregi-beypazari-usulu",
    reason:
      "REWRITE Beypazari title KORUNUR + jenerik step + boilerplate temizle. Beypazari Türk Patent CI tescilleri: Beypazari Kurusu CI 65 (21.05.2007) + Beypazari Tarhanasi CI 230 (31.07.2017). Beypazari yöresel klasik kanit guclu (kuru + güveç + tava coregi 'mancılık'). Title KORUNUR. DB step 2 jenerik 'kalan malzemeleri olcun' + step 6 boilerplate 'tabakta su salip dokusu kaymasin' temizlenir. 2 ingredient_add (yumurta sarisi opsiyonel ust sürme + opsiyonel cörek otu/susam), 6 step replace, mayalandirma 25→60 dk klasik, total 50→110 dk.",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/65",
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/230",
      "https://www.kulturportali.gov.tr/portal/beypazari",
    ],
    description:
      "Beypazarı'nın klasik kapaklı tava pişirmesiyle hazırlanan, peynir ve zeytin iç harçlı mayalı çörek. Fırın gerektirmeden ev tavasında altın kabukla pişer. Beypazarı Kurusu (Türk Patent CI 65, 2007) ve Beypazarı Tarhanası (CI 230, 2017) tescilli yöre ürünlerinin yanı sıra mancılık adıyla bilinen tava çöreği de Beypazarı'nın klasik repertuvarındadır.",
    prepMinutes: 80,
    cookMinutes: 30,
    totalMinutes: 110,
    ingredientsAdd: [
      { name: "Yumurta sarısı (opsiyonel üzerine sürme)", amount: "1", unit: "adet" },
      { name: "Çörek otu veya susam (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamurun iyi mayalanması için ılık ortamda en az 1 saat dinlendirin; mayalanma zayıf kalırsa tava içinde yeterince kabarmaz.",
    servingSuggestion:
      "Sıcak demli çay ve domates dilimi yanında kahvaltı sofrasına yakışır.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ilık sütü, instant mayayı ve tuzu derin bir kapta birleştirin; 5 dakika köpürene kadar bekleyin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Üzerine elenmiş un ve ayçiçek yağını ekleyip pürüzsüz, ele yapışmayan yumuşak hamur olana kadar 8-10 dakika yoğurun.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Hamurun üzerini örtüp ılık ortamda 60 dakika mayalandırın; iki katına çıksın.", timerSeconds: 3600 },
      { stepNumber: 4, instruction: "Hamuru havasını alıp tava boyutunda açın; ortasına ufalanmış beyaz peynir ve doğranmış siyah zeytini yayın, kenarları kapatarak şekil verin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine opsiyonel yumurta sarısı sürün, çörek otu veya susam serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Yağlanmış kalın tabanlı tavayı kısık ateşte ısıtın, hamuru yerleştirin; kapağı kapalı her iki yüzünü 12-15 dakika altın kahve renk alana kadar pişirin.", timerSeconds: 1500 },
    ],
  },

  // ─── 5: sivas-kusburnulu-bulgur (TUTARSIZLIK + Sivas kusburnusu CI) ─
  {
    type: "rewrite",
    slug: "sivas-kusburnulu-bulgur-pilavi",
    reason:
      "REWRITE KRITIK TUTARSIZLIK FIX + Sivas kusburnusu CI atfı. Sivas Gurun Kusburnusu Türk Patent CI 269 (13.08.2018) + Sarkisla Kusburnusu CI 282 (29.10.2018); Sivas kusburnusu yöresel ürün kanitli. Klasik kullanim cay/marmelat/pekmez (bulgur pilavi kombo modern). DB step 3 'sicak suyu ekleyin' diyor LISTEDE SU YOK + step 4 'pisir' tuz/karabiber bahsi YOK = TUTARSIZLIK. Title 'Sivas Esintili Kusburnulu Bulgur Pilavi' yumusatma (kombo modern, kusburnusu CI atfı korunur). 3 ingredient_add (sicak su 2.5 sb + tuz + karabiber), 6 step replace.",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/269",
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/282",
      "https://sivas.ktb.gov.tr/TR-149107/yore-mutfagi.html",
    ],
    newTitle: "Sivas Esintili Kuşburnulu Bulgur Pilavı",
    description:
      "Sivas Gürün ve Şarkışla kuşburnusu Türk Patent coğrafi işaret tescilli yöresel ürünlerdir; klasik kullanımı çay, marmelat ve pekmezdir. Bu tarif kuşburnu marmeladını bulgur pilavıyla buluşturan modern bir Sivas esintili yorum sunar. Ekşi-tatlı dengesi nane ve karabiberle yuvarlatılır.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    ingredientsAdd: [
      { name: "Sıcak su", amount: "2.5", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Marmelat çok tatlıysa 1 yemek kaşığını kuşburnu pekmezi veya nar ekşisiyle değiştirin, ekşi-tatlı denge oturur. Kuşburnu çekirdekli marmelatı tercih ediyorsanız piştikten sonra ince süzgeçten geçirip pilavın üstüne gezdirin.",
    servingSuggestion:
      "Yanına sade yoğurt veya cacık ile sıcak servis edin, üzerine taze nane serpebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı zeytinyağında orta ateşte 5 dakika yumuşayana kadar kavurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Bulguru ekleyip 2 dakika çevirerek kavurun, taneler parlasın.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Kuşburnu marmeladını ve kuru naneyi ekleyip 30 saniye karıştırın; aroma birleşsin.", timerSeconds: 30 },
      { stepNumber: 4, instruction: "2.5 su bardağı sıcak suyu, tuzu ve karabiberi ekleyin; kaynamasını bekleyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı kapalı kısık ateşte 15-18 dakika pişirin; bulgur suyu çeksin.", timerSeconds: 1080 },
      { stepNumber: 6, instruction: "Ocaktan alın, 10 dakika kapalı şekilde demlendirin; servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 6: zeytin-yaprakli-lor-sarma-izmir (BOILERPLATE LEAK FULL) ──
  {
    type: "rewrite",
    slug: "zeytin-yaprakli-lor-sarma-izmir-usulu",
    reason:
      "REWRITE BOILERPLATE LEAK FULL FIX + soguk meze akışına yeniden yaz. DB step 1-5 TAMAMEN JENERIK SCAFFOLD ve YANLIS; step 4 'firinda disi kizarana kadar pissin' YANLIS (sarma SOGUK meze, asla pisirmiyor!). Klasik Ege zeytin yapragi sarmasi (Sahrap Soysal + Ayvalik/Urla zeytinyagli meze + Izmir BB gastronomi 3 kaynak): yaprak yumusat + lor harç (dereotu + sarimsak + limon + tuz + zeytinyagi) + sar + 30 dk dinlendir + soguk servis. Title 'Izmir Esintili Zeytin Yaprakli Lor Sarma (Soguk Meze)' disambiguate. 5 ingredient_add (limon suyu + sarimsak + tuz + karabiber + opsiyonel maydanoz), 6 step replace SOGUK MEZE akış, total 20→55 dk dinlendirme dahil.",
    sources: [
      "https://www.kulturportali.gov.tr/portal/izmir-mutfagi",
      "https://yemek.com/tarif/zeytin-yapragi-sarmasi/",
      "https://en.wikipedia.org/wiki/Dolma",
    ],
    newTitle: "İzmir Esintili Zeytin Yapraklı Lor Sarma (Soğuk Meze)",
    description:
      "Ege kıyısında yaz mezesi olarak yaygın olan zeytin yapraklı lor sarması, fırına ya da tencereye girmeyen soğuk bir meze geleneğidir. Salamura yaprak yumuşatılır, lor dereotu sarımsak ve limonla harmanlanıp sarılır, buzdolabında dinlendirilerek servis edilir. Klasik Ayvalık ve Urla meze sofralarının nazik bir lokması.",
    prepMinutes: 25,
    cookMinutes: 0,
    totalMinutes: 55,
    ingredientsAdd: [
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "1", unit: "diş" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "çay kaşığı" },
      { name: "Taze maydanoz (opsiyonel)", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Salamura yaprak çok tuzluysa sıcak suda 4 dakika bekletip bir kez daha durulayın, harç dengesi bozulmasın. Lor sulu geldiyse temiz tülbentle 10 dakika süzün; sarma açılmaz.",
    servingSuggestion:
      "Üstüne limon dilimi ve birkaç damla zeytinyağı gezdirip soğuk meze tabağında, rakı veya soğuk beyaz şarap yanında ikram edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Salamura zeytin yapraklarını sıcak suda 2-3 dakika yumuşatıp süzün; sap kısımlarını kesin.", timerSeconds: 180 },
      { stepNumber: 2, instruction: "Loru kâseye alın; ince kıyılmış dereotu, opsiyonel maydanoz, rendelenmiş sarımsak, limon suyu, zeytinyağı, tuz ve karabiberi ekleyip çatalla harmanlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yaprağı pürüzsüz yüzü aşağıda olacak şekilde tezgâha açın; geniş ucuna 1 tatlı kaşığı harç koyun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Alttan harcın üzerine kıvırın, yanları toplayıp sıkı bir rulo şeklinde sarın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sarmaları kâseye sıkışık dizin; üzerine 1 yemek kaşığı zeytinyağı ve birkaç damla limon suyu gezdirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Kâseyi streçle kapatıp buzdolabında en az 30 dakika dinlendirin; aroma otursun, soğuk servis edin.", timerSeconds: 1800 },
    ],
  },

  // ─── 7: salgamli-narenciye-smash-adana (CI atif + modern disambiguate) ─
  {
    type: "rewrite",
    slug: "salgamli-narenciye-smash-adana-usulu",
    reason:
      "REWRITE Adana Salgam Suyu CI atif + modern kokteyl disambiguate. Adana Salgam Suyu Türk Patent CI 53 (24.02.2003 mahrec, Adana BB resmi); klasik kullanim kebap yani icecek. Salgam+votka kokteyli modern fusion (2015+ Istanbul/Adana bar sahnesi, Tatil Budur Adana yoresel listesinde KOKTEYL YOK). Title 'Adana Salgamli Narenciye Smash (Modern Kokteyl)' disambiguate (Adana salgam CI atfı + kokteyl modern). 3 ingredient_add (acı kırmızı biber + tuz + limon dilimi), 5 step replace klasik kokteyl akış.",
    sources: [
      "https://ci.turkpatent.gov.tr/cografi-isaretler/detay/53",
      "https://www.adana.bel.tr/icerik/adana-mutfagi",
    ],
    newTitle: "Adana Şalgamlı Narenciye Smash (Modern Kokteyl)",
    description:
      "Adana Şalgam Suyu Türk Patent coğrafi işaret tescilli (CI 53, 2003 mahreç) bir Adana ürünüdür ve klasik kullanımı kebap yanı içecektir. Bu tarif şalgam suyunu portakal ve votkayla buluşturan modern bir bar yorumudur, Adana mutfak kanonunda yer alan geleneksel bir içecek değildir. Tuzlu ekşi denge cesur bir aperatif sunar.",
    prepMinutes: 10,
    cookMinutes: 0,
    totalMinutes: 10,
    ingredientsAdd: [
      { name: "Acı kırmızı biber dilimi (opsiyonel)", amount: "1", unit: "adet" },
      { name: "Tuz (bardak kenarı, opsiyonel)", amount: "0.5", unit: "çay kaşığı" },
      { name: "Limon dilimi", amount: "1", unit: "adet" },
    ],
    tipNote:
      "Acılı şalgam kullanıyorsanız biber dilimini atlayın, sertlik dengesi zaten yerinde. Alkolsüz versiyon için votkayı 80 ml gazozla değiştirin, smash'in ferahlığı korunur.",
    servingSuggestion:
      "Adana kebabı veya çiğ köfte yanında, soğuk meze tabağıyla highball bardakta ikram edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Servis bardağını buzdolabında 10 dakika soğutun.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Opsiyonel: bardak kenarını limon dilimiyle nemlendirip tabaktaki tuza bandırın (margarita pattern).", timerSeconds: null },
      { stepNumber: 3, instruction: "Shaker'a şalgam suyu, portakal suyu, votka ve buzu koyup 10 saniye sertçe çalkalayın.", timerSeconds: 10 },
      { stepNumber: 4, instruction: "Karışımı süzerek soğutulmuş bardağa boşaltın; üstüne 2-3 küp taze buz ekleyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Acı biber dilimi ve portakal kabuğuyla süsleyip hemen servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-21");
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
              paket: "oturum-29-mini-rev-batch-21",
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
