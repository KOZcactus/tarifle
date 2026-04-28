/**
 * Tek-seferlik manuel mini-rev batch 30 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-29 ile
 * aynı audit, top 1-7 araliği, paketi 29 sonrası 44 kalan kuyrugundan
 * ilk 7). Klasik kanonik kanitli tarifler; jenerik step 2/5/6
 * boilerplate temizle + eksik klasik baharat/aromatik tamamla.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tavuklu-kisnisli-pirinc-tava-peru-usulu (Peru arroz con pollo):
 *      tavuk + pirinç + bezelye + havuç + kapya biber + sarımsak +
 *      kişniş + sofrito (soğan + kimyon). DB'de soğan (Peru sofrito
 *      essential!) + kimyon + tuz + karabiber + zeytinyağı EKSİK.
 *      Step 2+5+6 jenerik scaffold. 5 ingredient_add, 6 step replace.
 *
 *   2. sumakli-yogurtlu-kofte-kilis-usulu (Kilis klasik): ince bulgur +
 *      un + yoğurt + sumak + nane + tereyağı + sarımsak. DB'de Kilis
 *      imzası nane + tereyağı + sarımsak + karabiber EKSİK. Step 2+5+6
 *      jenerik scaffold. 4 ingredient_add, 6 step replace.
 *
 *   3. sumakli-tavuk-sote-kilis-usulu (Kilis klasik): tavuk + biber +
 *      soğan + sumak + sarımsak + maydanoz garnitür. DB'de sarımsak +
 *      tuz + karabiber + maydanoz EKSİK. Step 2+5+6 jenerik scaffold.
 *      4 ingredient_add, 6 step replace.
 *
 *   4. tahinli-kabak-basti-antalya-usulu (klasik tahinli kabak): kabak
 *      + tahin + sarımsak + limon + zeytinyağı + tuz var. DB'de
 *      karabiber + pul biber + maydanoz garnitür EKSİK. Step 2+5+6
 *      jenerik scaffold. 3 ingredient_add, 6 step replace.
 *
 *   5. susamli-salatalik-noodle-cin-usulu (Sichuan soğuk noodle): noodle
 *      + salatalık + susam ezmesi + soya + pirinç sirkesi + sarımsak +
 *      susam yağı + toz şeker + taze soğan + chili yağı opsiyonel. DB'de
 *      sarımsak + susam yağı + toz şeker + taze soğan EKSİK. Step 2+5+6
 *      jenerik scaffold. 4 ingredient_add, 6 step replace.
 *
 *   6. sumakli-nohutlu-tavuk-tava-kahramanmaras-usulu (K.Maraş klasik):
 *      tavuk + nohut + soğan + biber + sumak + Maraş biberi (yöre
 *      imzası!) + sarımsak + maydanoz. DB'de Maraş biberi (yöre essential)
 *      + sarımsak + karabiber + maydanoz EKSİK. Step 2+5+6 jenerik.
 *      4 ingredient_add, 6 step replace.
 *
 *   7. tortilla-espanola (İspanya klasik tortilla con cebolla): patates +
 *      soğan + yumurta + zeytinyağı (confit). DB'de karabiber + sarımsak
 *      + maydanoz EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri
 *      ayırın' (omlette böyle ayrım yok!) + step 2 jenerik. 7 step var
 *      (paketi 28 #4 ile karıştırılma!). 3 ingredient_add, 7 step replace.
 *
 * Toplam: 27 ingredient_add + 43 step replace + 1 BOILERPLATE LEAK FIX
 * (paketi 30 #7 tortilla-espanola 'kuru ve yaş malzemeleri ayırın'
 * yanlış cümle).
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
  // ─── 1: tavuklu-kisnisli-pirinc-tava-peru-usulu (arroz con pollo) ──
  {
    type: "rewrite",
    slug: "tavuklu-kisnisli-pirinc-tava-peru-usulu",
    reason:
      "REWRITE jenerik scaffold + Peru arroz con pollo klasik sofrito. Klasik Lima ev yemeği: tavuk + pirinç + bezelye + havuç + kapya biber + sarımsak + bol kişniş + sofrito (soğan + kimyon). DB'de soğan (Peru sofrito essential!) + kimyon (Peru imzası) + tuz + karabiber + zeytinyağı EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'pe' KORUNUR. 5 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Arroz_con_pollo",
      "https://www.peru.travel/en/gastronomy/peruvian-cuisine/arroz-con-pollo",
    ],
    description:
      "Peru'nun arroz con pollosu; tavuk parçalarının soğan, sarımsak ve kimyondan oluşan kreolize sofritoyla mühürlenip pirincin bol kişniş suyu içinde yeşilimsi ve aromatik çekildiği klasik ev yemeğidir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Kimyon", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Kişnişin yarısını blender'dan suyla geçirip pirincin pişme suyuna katın; yeşilimsi renk ve derin aroma bu adımdan gelir. Pirinci tavada 1 dakika çevirip sıcak suyu eklemeden tuz ve baharatı sofritoya işletin.",
    servingSuggestion:
      "Kalan kişnişin yapraklarını üstüne serpin; yanında salsa criolla (soğan-limon-kişniş) ve istenirse haşlanmış yumurtayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı çok ince doğrayın, sarımsağı ezin; kişnişin yarısını blender'da yarım su bardağı suyla pürüzsüzleştirip kenara alın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tavuğu kuşbaşı kesin, tuz ve karabiberle ovun; havuç, kapya biber ve bezelyeyi 1 cm kareler halinde doğrayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağını ısıtıp tavuğu 5 dakika her yüzüyle mühürleyin; kâğıda alın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Aynı tavada soğanı 4 dakika pembeleştirin, sarımsak ve kimyonu 30 saniye çevirin; havuç ve kapya biberi ekleyip 3 dakika soteleyin.", timerSeconds: 450 },
      { stepNumber: 5, instruction: "Pirinci tavaya katıp 1 dakika çevirin; tavuğu, bezelyeyi, kişniş suyunu ve kalan suyu ekleyip kapakla kısık ateşte 18 dakika pirinç suyunu çekene kadar pişirin.", timerSeconds: 1080 },
      { stepNumber: 6, instruction: "Ocaktan alıp kapağı kapalı 5 dakika demlendirin; kalan kişniş yapraklarını serpip sıcak servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 2: sumakli-yogurtlu-kofte-kilis-usulu (Kilis klasik) ─────────
  {
    type: "rewrite",
    slug: "sumakli-yogurtlu-kofte-kilis-usulu",
    reason:
      "REWRITE jenerik scaffold + Kilis sumaklı yoğurtlu köfte klasik baharat ve sos. Kilis klasiği: ince bulgur + un + yoğurt + sumak + nane (Kilis imzası!) + tereyağında pul biber sosu + sarımsak. DB'de nane + tereyağı (sos için) + sarımsak + karabiber EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kilis-sumakli-yogurtlu-koftesi",
    ],
    description:
      "Kilis sofralarının sumaklı yoğurtlu köftesi; ince bulgurla yoğrulan minik köfteler haşlanıp sıcak yoğurt sosuyla buluşturulur, üstüne tereyağında pul biberli nane gezdirilerek ekşili-aromatik bir tabak kurulur.",
    ingredientsAdd: [
      { name: "Kuru nane", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Bulguru un ve ılık suyla yoğurmadan önce 10 dakika ıslatın; köfteler dağılmaz. Yoğurdu sıcak suya direkt ekleme, önce kepçeyle ılıt; aksi takdirde kesilir.",
    servingSuggestion:
      "Tabağa paylaştırıp üstüne tereyağında nane-pul biber sosu gezdirin; yanına haşlanmış nohut veya soğan piyazıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulguru 0.75 su bardağı ılık su ve tuzla 10 dakika dinlendirin; un, ezilmiş sarımsak ve karabiberle yoğurup fındık iriliğinde köfteler şekillendirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Geniş tencerede 4 su bardağı suyu kaynatıp köfteleri suya bırakın; üste çıkana kadar 10 dakika haşlayın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Yoğurdu derin kapta çırpıp sıcak haşlama suyundan birkaç kepçe alıp yavaşça ılıtın; köfte tenceresine geri döküp kısık ateşte sürekli karıştırarak ısıtın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Sumakı tencereye ekleyip 2 dakika daha karıştırarak kıvamı oturmasını bekleyin.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Küçük tavada tereyağını eritip kuru naneyi 30 saniye çevirin; sosu hazırlayın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Köfteyi servis tabağına paylaştırıp üzerine tereyağında nane sosunu gezdirerek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: sumakli-tavuk-sote-kilis-usulu (Kilis klasik tava) ────────
  {
    type: "rewrite",
    slug: "sumakli-tavuk-sote-kilis-usulu",
    reason:
      "REWRITE jenerik scaffold + Kilis sumaklı tavuk sote klasik baharat. Klasik tavuk sote + Güneydoğu sumak imzası: tavuk + biber + soğan + sumak + sarımsak + maydanoz garnitür + tuz + karabiber. DB'de sarımsak + tuz + karabiber + maydanoz EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/tavuk-tarifleri/sumakli-tavuk-sote",
    ],
    description:
      "Kilis usulü sumaklı tavuk sote; tavuk parçalarının kapya biber, soğan ve sarımsakla mühürlenip son anda eklenen sumakla parlak ve ekşimsi bir tava yemeğine dönüşmesidir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Sumakı pişmenin son 1 dakikasında ekleyin; uzun süre ısıyla kalırsa kekremsi olur. Tavuğu küçük parçalara bölün; mühürleme süresi kısa olunca su salmaz, sote dokusu korunur.",
    servingSuggestion:
      "Tabağa alıp üzerine bol kıyılmış maydanoz serpin; yanında bulgur pilavı veya cızbızla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuğu kuşbaşı kesin, tuz ve karabiberle ovun; soğanı yarım ay, kapya biberleri 1.5 cm kare doğrayın, sarımsağı ezin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta-yüksek ateşte ısıtıp tavuğu 6 dakika her yüzü altın renge gelene kadar mühürleyin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Soğanı ekleyip 3 dakika pembeleştirin; sarımsağı 30 saniye çevirin, kapya biberi katıp 4 dakika soteleyin.", timerSeconds: 450 },
      { stepNumber: 4, instruction: "Sumakı serpip 1 dakika daha karıştırarak ocaktan alın.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Servis tabağına paylaştırıp üstüne ince doğranmış maydanoz serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak servis edin; istenirse limon dilimi veya bir kaşık yoğurtla denkleştirin.", timerSeconds: null },
    ],
  },

  // ─── 4: tahinli-kabak-basti-antalya-usulu (klasik tahinli kabak) ──
  {
    type: "rewrite",
    slug: "tahinli-kabak-basti-antalya-usulu",
    reason:
      "REWRITE jenerik scaffold + klasik tahinli kabak ek baharat. Klasik tahinli kabak (zeytinyağlı): kabak + tahin + sarımsak + limon + zeytinyağı + tuz var. DB'de karabiber + pul biber + maydanoz garnitür EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/sebze-yemekleri/tahinli-kabak-bastisi",
      "https://www.kulturportali.gov.tr/turkiye/antalya/neyenir",
    ],
    description:
      "Tahinli kabak bastı; kabakların zeytinyağı ve sarımsakla yumuşatılıp limonlu tahin sosuyla buluşturulduğu hafif, ekşimsi-yağlı bir Akdeniz mutfağı tabağıdır.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Tahin sosunu sıcak yemeğe direkt eklemeyin; önce 2 yemek kaşığı pişirme suyuyla pürüzsüzleştirin, aksi halde topaklanır. Kabağı çok inceltmeyin; 1.5 cm dilim formunu korur.",
    servingSuggestion:
      "Servis tabağına alıp üstüne bol maydanoz, ekstra zeytinyağı ve birkaç pul biber serpin; ekmekle veya pilavla ılık-soğuk arası servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabakları yıkayıp 1.5 cm halkalar halinde dilimleyin; sarımsağı ezin, maydanozu ince kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tencerede zeytinyağını ısıtıp sarımsağı 30 saniye çevirin; kabakları ekleyip 4 dakika her yüzünü mühürleyin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Tuz, karabiber ve pul biberi serpip 1 su bardağı suyu ilave edin; kapakla kısık ateşte 12 dakika kabaklar yumuşayana kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 4, instruction: "Tahini limon suyu ve 2 yemek kaşığı pişirme suyuyla pürüzsüz çırpın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tahin sosunu kabakların üzerine gezdirip 1 dakika daha kısık ateşte ısıtın, kaynatmayın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Servis tabağına alıp üstüne bol maydanoz serperek ılık veya oda sıcaklığında servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: susamli-salatalik-noodle-cin-usulu (Sichuan klasik) ───────
  {
    type: "rewrite",
    slug: "susamli-salatalik-noodle-cin-usulu",
    reason:
      "REWRITE jenerik scaffold + Sichuan susamlı soğuk noodle klasik. Klasik 凉拌面 + pai huang gua hibridi: noodle + salatalık + susam ezmesi + soya + pirinç sirkesi + sarımsak + susam yağı + toz şeker (denge!) + taze soğan. DB'de sarımsak + susam yağı + toz şeker (Sichuan denge imzası) + taze soğan EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'cn' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Liangmian",
      "https://thewoksoflife.com/sesame-noodles-with-cucumber/",
    ],
    description:
      "Çin'in soğuk susamlı noodle'ı; haşlanan eriştenin susam ezmesi, soya, sirke ve sarımsakla yoğrulup salatalık şeritleriyle ferahlatılarak yaz tabağına dönüşmesidir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Susam yağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "tatlı kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
    ],
    tipNote:
      "Susam ezmesini kullanmadan önce 2 yemek kaşığı sıcak suyla seyreltin; aksi halde noodle'a yapışmaz. Salatalığı dövüp kabaca koparmak (pai huang gua tekniği) sosu daha iyi tutar.",
    servingSuggestion:
      "Tabağa paylaştırıp üstüne kavrulmuş susam ve taze soğan halkaları serpin; istenirse 1 çay kaşığı chili yağı gezdirerek Sichuan dengesi kurun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş tencerede tuzlu suyu kaynatıp noodle'ı paket talimatına göre 5-6 dakika haşlayın; soğuk sudan geçirip süzün, 1 yemek kaşığı susam yağıyla karıştırın.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "Salatalıkları merdaneyle hafifçe ezip 5 cm uzunlukta kabaca parçalayın (pai huang gua tekniği); sarımsağı ezin, taze soğanı halka doğrayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Susam ezmesini 2 yemek kaşığı sıcak suyla pürüzsüzleştirin; soya sosu, pirinç sirkesi, toz şeker ve ezilmiş sarımsağı ekleyip çırpın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Soğuyan noodle'ı geniş kâseye alıp sosu üzerine dökün, salatalıkları ekleyip iyice harmanlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Servis tabağına paylaştırıp üstüne kavrulmuş susam ve taze soğan serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Soğuk veya oda sıcaklığında servis edin; isteğe bağlı 1 çay kaşığı chili yağıyla baharat dengesini ayarlayın.", timerSeconds: null },
    ],
  },

  // ─── 6: sumakli-nohutlu-tavuk-tava-kahramanmaras-usulu (K.Maraş) ──
  {
    type: "rewrite",
    slug: "sumakli-nohutlu-tavuk-tava-kahramanmaras-usulu",
    reason:
      "REWRITE jenerik scaffold + Kahramanmaraş sumaklı nohutlu tavuk tava klasik baharat. K.Maraş imzası: tavuk + nohut + soğan + biber + sumak + Maraş biberi (yöre essential!) + sarımsak + maydanoz garnitür. DB'de Maraş biberi (Kahramanmaraş yöre imzası) + sarımsak + karabiber + maydanoz EKSİK. Step 2+5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kahramanmaras/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/maras-tavasi",
    ],
    description:
      "Kahramanmaraş usulü sumaklı nohutlu tavuk tava; tavuk parçalarını haşlanmış nohut, kapya biber ve soğanla buluşturup Maraş biberi ve sumakla baharatlandığı sulu, parlak bir akşam tabağıdır.",
    ingredientsAdd: [
      { name: "Maraş biberi", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Maraş biberi tatlı varyantını seçerseniz aroma ön planda kalır; acı sevenler tatlı-acı kombinli kullanabilir. Nohudu suyunu süzmeden ekleyin; bir miktar nişastalı su sosu bağlar.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üstüne bol maydanoz ve ekstra sumak serpin; yanında bulgur pilavı veya tandır ekmeğiyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuğu kuşbaşı kesin, tuz ve karabiberle ovun; soğanı yarım ay, kapya biberi 2 cm kare doğrayın, sarımsağı ezin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta-yüksek ateşte ısıtıp tavuğu 7 dakika her yüzü mühürleyin.", timerSeconds: 420 },
      { stepNumber: 3, instruction: "Soğanı ekleyip 4 dakika pembeleştirin, sarımsak ve Maraş biberini 30 saniye çevirip kapya biberi katın, 3 dakika soteleyin.", timerSeconds: 450 },
      { stepNumber: 4, instruction: "Haşlanmış nohudu suyuyla birlikte ekleyin, kapakla kısık ateşte 6 dakika sosun çekmesini bekleyin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Sumakın yarısını yemeğin üstüne serpip 1 dakika daha karıştırarak ocaktan alın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Servis tabağına paylaştırıp kalan sumak ve ince doğranmış maydanozla taçlandırarak sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: tortilla-espanola (İspanya con cebolla, BOILERPLATE LEAK) ──
  {
    type: "rewrite",
    slug: "tortilla-espanola",
    reason:
      "REWRITE jenerik scaffold + BOILERPLATE LEAK FIX + İspanya tortilla con cebolla klasik. Klasik tortilla española: patates + soğan + yumurta + zeytinyağı (confit, 60-65°C) + tuz var. DB'de karabiber + sarımsak + maydanoz garnitür EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (omlette böyle ayrım yok!) + step 2 jenerik scaffold. 7 step var. Title KORUNUR. cuisine 'es' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Spanish_omelette",
      "https://www.bbcgoodfood.com/recipes/spanish-tortilla",
    ],
    description:
      "İspanya'nın bar klasiği tortilla española; patates ve soğanın bol zeytinyağında 60-65°C'de yumuşak yumuşak çekildiği, ardından çırpılmış yumurtayla birleştirilip iki yüzü mühürlenerek dilim dilim servise giden kalın omlettir.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Patatesi konfitlemek tortillanın imzasıdır; yağ kızgın değil, sadece sıcak (60-65°C) olmalı. Çevirmek için ya geniş tabak yardımıyla ya da iki tavalı pişirme tekniğini kullanın; orta ıslak (jugosa) merkez İspanyol klasiğidir.",
    servingSuggestion:
      "Ilık veya oda sıcaklığında dilimleyip üstüne ince maydanoz serperek servis edin; yanında ekmek ve domates salatası iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri soyup 2-3 mm dilimleyin; soğanı yarım ay doğrayın, sarımsağı ezin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavaya zeytinyağını dökün, patates ve soğanı içine yatırıp orta-kısık ateşte yağ kabarcıkları çıkana kadar (60-65°C) 18 dakika konfitleyin; sarımsağı son 2 dakikada ekleyin.", timerSeconds: 1080 },
      { stepNumber: 3, instruction: "Patates ve soğanı süzgece alıp fazla yağı süzdürün; tuz ve karabiberle hafifçe karıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yumurtaları derin kapta çırpıp süzülmüş patates karışımını ekleyin, 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Tavada 2 yemek kaşığı yağ bırakıp ısıtın; karışımı dökün, kenarlardan toplayarak orta ateşte 5 dakika alt yüzü tutturun.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Geniş bir tabakla tortillayı çevirip diğer yüzünü 4 dakika daha pişirin; merkezi hafif ıslak (jugosa) kalsın.", timerSeconds: 240 },
      { stepNumber: 7, instruction: "Tabağa alıp 5 dakika dinlendirin, üstüne ince maydanoz serpin; ılık veya oda sıcaklığında dilimleyerek servis edin.", timerSeconds: 300 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-30");
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
              paket: "oturum-31-mini-rev-batch-30",
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
