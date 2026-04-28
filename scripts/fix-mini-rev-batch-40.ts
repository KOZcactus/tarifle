/**
 * Tek-seferlik manuel mini-rev batch 40 (oturum 31 ek): 7 KRITIK fix.
 *
 * Paketi 39 sonrası 27 kalan kuyruğun yeni top 1-7. Klasik kanonik
 * tamamlama + jenerik scaffold temizleme.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tahinli-cevizli-kahvalti-durumu: lavaş + tahin + ceviz + üzüm
 *      pekmezi VAR. DB'de tarçın + tuz tutamı + ekstra pekmez (servis)
 *      EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   2. misto-quente (Brezilya): sandviç ekmeği + kaşar + jambon +
 *      tereyağı VAR. DB'de oregano (Brezilya sandviç imzası) +
 *      karabiber EKSİK. 2 ingredient_add, 5 step replace.
 *
 *   3. otlu-kete-dilimi-kars-usulu (Kars): un + tereyağı + karışık ot
 *      + su VAR. DB'de tuz + yumurta sarısı (üst sürme) + lor peyniri
 *      (Kars peynirli ot harç) EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   4. van-murtuga (Van klasik): tereyağı + un + yumurta + tuz VAR
 *      (klasik formul tam). DB'de pul biber (Van sahan imzası) +
 *      karabiber EKSİK. 2 ingredient_add, 6 step replace.
 *
 *   5. tarsus-sikmasi (Mersin): un + su + tuz + beyaz peynir +
 *      maydanoz + tereyağı VAR. DB'de karabiber + pul biber + sumak
 *      EKSİK. 3 ingredient_add, 6 step replace.
 *
 *   6. kete-erzurum-tava-usulu (Erzurum): un + süt + yumurta +
 *      tereyağı VAR. DB'de tuz + kavrulmuş un (iç harç klasik) +
 *      yumurta sarısı (üst sürme) EKSİK. 3 ingredient_add, 5 step
 *      replace.
 *
 *   7. turos-batyu (Macar): milföy + lor + toz şeker + yumurta VAR.
 *      DB'de vanilya (essential!) + limon kabuğu (Macar túrós klasik
 *      imzası) + tuz tutamı EKSİK. 3 ingredient_add, 6 step replace.
 *
 * Toplam: 19 ingredient_add + 38 step replace + 12 BOILERPLATE LEAK
 * FIX.
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
  {
    type: "rewrite",
    slug: "tahinli-cevizli-kahvalti-durumu",
    reason: "REWRITE jenerik scaffold + tahinli cevizli dürüm tamamlama. DB'de tarçın + tuz tutamı + ekstra pekmez (servis) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tahin-pekmezli-durum",
      "https://www.bbcgoodfood.com/recipes/tahini-walnut-wrap",
    ],
    description: "Tahinli cevizli kahvaltı dürümü; ısıtılan lavaşa tahin sürülüp dövülmüş ceviz, üzüm pekmezi ve bir tutam tarçın gezdirilerek sarılan, Anadolu sabah lezzetlerini taşınabilir hale getiren pratik bir kahvaltılıktır.",
    ingredientsAdd: [
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Pekmez (servis için ekstra)", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote: "Tahini bir tutam tuzla pürüzsüzleştirin; aksi halde fazla yağlı durur, tatlı denge kurulamaz. Cevizleri kabaca dövün; toz haline getirmeyin, dürümün dokulu lokması korunur.",
    servingSuggestion: "Dürümü ortadan dilimleyip tabağa alın; üstüne ekstra pekmez gezdirip dilim muz veya elma ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizleri kabaca dövün; tahini bir tutam tuzla küçük kâsede pürüzsüzleştirin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp lavaşları 1 dakika iki yüzü hafifçe ısıtarak esnetin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Lavaşları tezgâha açıp her birine tahin sürün; üzerlerine ceviz yayıp pekmezi gezdirin, tarçın serpin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Lavaşları sıkıca dürüm formunda sarın; ortadan dilimleyip tabağa alın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üstüne ekstra pekmez gezdirip sıcak servis edin; yanına demli çay iyi gider.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "misto-quente",
    reason: "REWRITE Brezilya misto quente klasik. DB'de oregano (Brezilya sandviç imzası) + karabiber EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 2 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Misto_quente",
      "https://www.tudogostoso.com.br/receita/misto-quente",
    ],
    description: "Brezilya kafelerin klasik tost sandviçi misto quente; sandviç ekmeği arasına ince jambon ve eriyen kaşar peyniri yerleştirip oregano serpilerek tereyağında kızartılması ve hızlı kahvaltı veya akşamüstü atıştırmalığı olarak servis edilmesidir.",
    ingredientsAdd: [
      { name: "Oregano", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
    ],
    tipNote: "Tereyağını ekmeğin DIŞ yüzeyine sürün; iç yüze değil. Tost makinesinde dış yüz altın renge gelir. Kaşarı ince doğrayın; eridiğinde dengeli yayılır, taşmaz.",
    servingSuggestion: "Sıcak misto quente'yi çapraz dilimleyip tabağa alın; yanına portakal suyu veya kahveyle Brezilya kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sandviç ekmeklerini tezgâha alın; kaşar peynirini ince doğrayın veya rendeleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Ekmeklerin dış yüzlerine ince tereyağı sürün; iç yüzlere oregano ve karabiber serpin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Bir ekmek diliminin üzerine jambon yerleştirip kaşar peynirini katın; üzerine ikinci ekmek dilimi kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tost makinesi veya yapışmaz tavada orta ateşte 6 dakika iki yüzü altın renge gelene ve peynir tamamen erimesine kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Çapraz dilimleyip tabağa alıp sıcak servis edin; yanına portakal suyu yatırın.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "otlu-kete-dilimi-kars-usulu",
    reason: "REWRITE Kars otlu kete dilimi klasik. DB'de tuz + yumurta sarısı (üst sürme) + lor peyniri (Kars peynirli ot harç) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kars/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kars-ketesi",
    ],
    description: "Kars otlu kete dilimi; mayasız kat kat hamurun karışık ot ve lor peynirinden oluşan iç harçla doldurulup 190°C fırında 24 dakika pişirildiği, Doğu Anadolu kahvaltısının gevrek kenarlı klasik hamur işidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
      { name: "Lor peyniri", amount: "120", unit: "gr" },
    ],
    tipNote: "Hamuru çok yoğurmayın; gluten gelişmesi gevrek dokuyu bozar. Tereyağını eritmiş şekilde değil, oda sıcaklığında kullanın; katlama sırasında yağ erimemeli.",
    servingSuggestion: "Sıcak ketelerini dilimleyip tabağa alın; yanına ev yoğurdu, dilim domates ve demli çayla Kars kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, tuz ve suyu yoğurma kabında 4 dakika çalışıp pürüzsüz hamur elde edin; üzerini örtüp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Karışık otları ince kıyıp lor peynirini çatalla ezerek harmanlayın; iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru bezelere bölüp her birini ince yufka açın; üzerlerini oda sıcaklığında tereyağıyla yağlayıp katlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hamuru tekrar açıp iç harcı yayıp katlayın; tepsiye dizip üst yüzlerini çırpılmış yumurta sarısıyla fırçalayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "190°C ısıtılmış fırında 24 dakika üst yüzleri altın renge gelene kadar pişirin; 3 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 1620 },
    ],
  },
  {
    type: "rewrite",
    slug: "van-murtuga",
    reason: "REWRITE Van murtuğası klasik tamamlama. Klasik formul (tereyağı + un + yumurta + tuz) DB'de tam VAR; sadece pul biber (Van sahan imzası) + karabiber EKSİK. Step 6 BOILERPLATE LEAK FIX. 2 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/van/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/van-murtugasi",
    ],
    description: "Van murtuğası; tereyağında kavrulan unun çırpılmış yumurta ve tuzla buluşturulup yumuşak parçalar halinde pişirildiği, üzerine pul biber serpilerek sıcak ekmekle servis edilen Doğu Anadolu kahvaltı klasiğidir.",
    ingredientsAdd: [
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
    ],
    tipNote: "Unu tereyağında karamelize ederken sürekli karıştırın; aksi halde dipte yanar, murtuğanın imzası fındıksı aroma kaybolur. Yumurtayı çırpılmış olarak ekleyin; tane tane parça için anahtar.",
    servingSuggestion: "Sıcak murtuğayı sahandan doğrudan sofraya alıp üstüne pul biber serpin; yanına sıcak tandır ekmeği veya yufka ekmeğiyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tereyağını geniş tavada orta ateşte eritin; köpük çekildiğinde unu ekleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Unu tereyağında 5 dakika sürekli karıştırarak rengi hafif dönene kadar kavurun.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Yumurtaları tuz ve karabiberle çırpın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çırpılmış yumurtayı kavrulmuş una ekleyip orta ateşte 3 dakika yumuşak parçalar oluşturarak pişirin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Üzerine pul biber serpip 30 saniye karıştırarak ocaktan alın.", timerSeconds: 30 },
      { stepNumber: 6, instruction: "Sahanı doğrudan sofraya alıp sıcak ekmekle servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tarsus-sikmasi",
    reason: "REWRITE Tarsus sıkması klasik. DB'de karabiber + pul biber + sumak (Mersin/Tarsus imzası) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/mersin/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tarsus-sikmasi",
    ],
    description: "Tarsus sıkması; mayasız ince hamurun sacda iki yüzü pişirildikten sonra beyaz peynir, maydanoz ve sumakla doldurulup tereyağı sürülerek dürülen, Mersin sokak kahvaltısı klasiğidir.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Hamuru fazla ince açın; sacda hızlı pişer ve dürüm sırasında esnek kalır. Sumakı iç harca katın; uçucu aroma korunur, peynirin tuzunu dengeler.",
    servingSuggestion: "Sıkmaları ortadan dilimleyip tabağa alın; üstüne ekstra sumak ve pul biber serpin, yanına dilim domates ve demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, su ve tuzu yoğurma kabında birleştirip pürüzsüz hamur elde edin; üzerini örtüp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Beyaz peyniri çatalla ezip ince doğranmış maydanoz, sumak, karabiber ve pul biberle harmanlayarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru bezelere bölüp her birini yufka inceliğinde açın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavayı veya sacı orta ateşte ısıtıp yufkaları her yüzü 2 dakika pişirin; pişen yufkaları üst üste yığın.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Pişmiş yufkalara iç harcı yayıp sıkıca dürüm formunda sarın; üstlerini eritilmiş tereyağıyla fırçalayın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıkmaları ortadan dilimleyip tabağa alın; sıcak servis edin, üstüne ekstra sumak gezdirin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "kete-erzurum-tava-usulu",
    reason: "REWRITE Erzurum tava ketesi klasik. DB'de tuz + kavrulmuş un (iç harç klasik) + yumurta sarısı (üst sürme) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/erzurum/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/erzurum-tava-ketesi",
    ],
    description: "Erzurum tava ketesi; sütlü hamurun tereyağında kavrulmuş un harcıyla doldurulup kapaklı tavada iki yüzü altın renge gelene kadar pişirildiği, Doğu Anadolu kahvaltılarının güçlü klasik çöreğidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Kavrulmuş un (iç harç)", amount: "0.5", unit: "su bardağı" },
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
    ],
    tipNote: "Klasik Erzurum kete iç harcı tereyağında kavrulmuş un (kavurmaç). Beyaz un tereyağında orta-kısık ateşte sürekli karıştırarak fındıksı kokuya gelene kadar 8 dakika kavrulur. Mayalı hamur değil, sade hamur kullanılır.",
    servingSuggestion: "Sıcak keteleri dilimleyip tabağa alın; yanına ev peyniri, dilim domates ve demli çayla Erzurum kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, süt, yumurta (sarısı sürme için ayrılmış kalan), tuz ve eritilmiş tereyağının yarısını yoğurma kabında birleştirip 6 dakika çalışın; pürüzsüz hamuru üzeri örtülü 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Kalan tereyağını ayrı tavada orta-kısık ateşte eritip kavrulmuş unu fındıksı kokuya gelene kadar 5 dakika kavurun; iç harç hazır.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Hamuru bezelere bölüp her birini yufka inceliğinde açın; üzerine iç harcı yayıp katlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üst yüzlerini ayrılan yumurta sarısıyla fırçalayıp kapaklı tavada orta-kısık ateşte 14 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 5, instruction: "Tavadan alıp 3 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 180 },
    ],
  },
  {
    type: "rewrite",
    slug: "turos-batyu",
    reason: "REWRITE Macar túrós batyu klasik. Klasik formul: lor + yumurta + şeker + vanilya + limon kabuğu (Macar imzası, essential!) + tuz + milföy. DB'de vanilya (essential!) + limon kabuğu + tuz tutamı EKSİK. Step 6+7 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/T%C3%BAr%C3%B3s_b%C3%A9les",
      "https://www.tasteatlas.com/turos-batyu",
    ],
    description: "Túrós batyu, Macar fırın klasiği; milföy hamuru kareler halinde kesilip ortasına lor peyniri, toz şeker, yumurta, vanilya ve limon kabuğundan oluşan dolgu yatırılarak bohça formunda kapatıldıktan sonra 200°C fırında üst yüzü altın renge gelene kadar pişirilir.",
    ingredientsAdd: [
      { name: "Vanilya", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Limon kabuğu rendesi", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
    ],
    tipNote: "Lor peynirinin nemini tülbentle 5 dakika süzdürün; aksi halde dolgu sulanır, milföy hamurunu çözer. Limon kabuğu Macar túrós klasik imzası; vanilya ile birlikte eklenirse aroma derinleşir.",
    servingSuggestion: "Sıcak batyuları tabağa alıp üzerlerine pudra şekeri serpin; yanına bir kâse ekşi krema veya bal yatırarak Macar kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini tülbentle 5 dakika süzdürüp çatalla ezin; toz şeker, yumurta, vanilya, limon kabuğu ve bir tutam tuzla harmanlayarak dolguyu hazırlayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Milföy hamurlarını 12 cm kareler halinde kesin; her karenin ortasına 1 yemek kaşığı dolgu yatırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamurun dört köşesini ortada birleştirip bohça formunda sıkıştırın; ek yerleri alta gelecek şekilde yağlı kâğıtlı tepsiye dizin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üst yüzlerini çırpılmış yumurta beyazıyla fırçalayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "200°C ısıtılmış fırında 22 dakika üst yüzleri altın renge gelene ve hamur kabarana kadar pişirin.", timerSeconds: 1320 },
      { stepNumber: 6, instruction: "Fırından çıkan batyuları 3 dakika dinlendirip pudra şekeri serperek ılık servis edin.", timerSeconds: 180 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-40");
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
              paket: "oturum-31-mini-rev-batch-40",
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
