/**
 * Tek-seferlik manuel mini-rev batch 41 (oturum 31 ek): 7 KRITIK fix.
 *
 * Paketi 40 sonrası kuyruğun yeni top 1-7. Klasik kanonik tamamlama
 * + jenerik scaffold temizleme + 1 DUPLICATE STEP FIX (paketi 41 #6
 * tulumlu-lor-kavurmasi step 4 + step 5 aynı 'Karabiber serpip/ekleyip
 * sıcak servis edin' duplicate, biri silinir).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. yuksek-protein-mercimek-waffle: kırmızı mercimek + yumurta +
 *      yoğurt + kabartma tozu VAR. DB'de tuz + kimyon (klasik mercimek
 *      destek) + zeytinyağı (waffle press) EKSİK. 3 ingredient_add,
 *      5 step replace.
 *
 *   2. zeytinli-yaglama-ayvalik-usulu (Ayvalık/Ege): köy ekmeği +
 *      siyah zeytin ezmesi + domates + zeytinyağı + nane VAR. DB'de
 *      karabiber + kekik (Ege imzası) EKSİK. 2 ingredient_add, 5 step
 *      replace.
 *
 *   3. yumurtali-ekmek-kapadokya-usulu (Kapadokya): bayat ekmek +
 *      yumurta + süt + tereyağı + tuz + kekik VAR. DB'de karabiber +
 *      maydanoz garnitür EKSİK. 2 ingredient_add, 6 step replace.
 *
 *   4. sweetcorn-fritter-stack-avustralya-usulu (Avustralya): mısır +
 *      un + yumurta + süt + taze soğan + zeytinyağı VAR. DB'de tuz +
 *      karabiber + kabartma tozu (fritter essential!) EKSİK. 3
 *      ingredient_add, 6 step replace.
 *
 *   5. tursu-kavurmali-yumurta-rize-usulu (Rize): fasulye turşusu +
 *      soğan + yumurta + tereyağı VAR. DB'de pul biber + karabiber +
 *      maydanoz EKSİK. Step 7 BOILERPLATE LEAK 'fazla beklerse
 *      peynirli doku sertleşir' (turşu yumurtada peynir yok!) FIX.
 *      3 ingredient_add, 7 step replace.
 *
 *   6. tulumlu-lor-kavurmasi-erzurum-usulu (Erzurum): lor + tulum +
 *      tereyağı + karabiber VAR. DB'de pul biber (Erzurum imzası) +
 *      taze soğan + yumurta opsiyonel EKSİK. **STEP 4+5 DUPLICATE FIX**
 *      ('Karabiber serpip sıcak servis edin' + 'Karabiber ekleyip
 *      sıcak servis edin' aynı step iki defa, biri silinir). Step
 *      6+7 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace
 *      (7→5).
 *
 *   7. unlu-tava-coregi-ankara-usulu (Ankara): un + yoğurt + yumurta
 *      + tereyağı + tuz VAR. DB'de kabartma tozu (mayasız çörek
 *      essential!) + karabiber EKSİK. Step 6 BOILERPLATE LEAK
 *      'peynirli doku sertleşir' (çörekte peynir yok!) FIX. 2
 *      ingredient_add, 6 step replace.
 *
 * Toplam: 18 ingredient_add + 40 step replace + 13 BOILERPLATE LEAK
 * FIX + 1 DUPLICATE STEP FIX (#6).
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
    slug: "yuksek-protein-mercimek-waffle",
    reason: "REWRITE yüksek protein mercimek waffle klasik. DB'de tuz + kimyon (klasik mercimek destek) + zeytinyağı (waffle press) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/lentil-waffles",
      "https://minimalistbaker.com/lentil-waffles/",
    ],
    description: "Yüksek protein mercimek waffle; un yerine ıslatılmış kırmızı mercimek bazına dayalı, yumurta ve yoğurtla pürüzsüzleştirilen waffle hamuru kabartma tozu ve kimyonla aromalandırılır, doyurucu ve gluten-free brunch tabağına dönüşür.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Zeytinyağı", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote: "Mercimeği 20-30 dakika sıcak suda bekletin; blender'da pürüzsüz hamur olur. Hamur kalın ise 1-2 yemek kaşığı su ekleyebilirsiniz; çok ince waffle dağılır.",
    servingSuggestion: "Sıcak waffle'ları tabağa alıp üzerine yoğurt yatırın; isteğe bağlı avokado, sahanda yumurta veya zeytinyağıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kırmızı mercimeği yıkayıp 25 dakika sıcak suda bekletin; süzgeçten geçirin.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Mercimek, yumurta, yoğurt, kabartma tozu, tuz ve kimyonu blender'a alıp pürüzsüz hamur olana kadar 1 dakika çekin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Waffle makinesini ısıtıp yüzeyini zeytinyağıyla yağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hamuru kepçeyle waffle çukurlarına paylaştırıp kapağı kapatın; 8 dakika altın renge gelene kadar pişirin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Sıcak waffle'ları tabağa alıp yoğurt veya sahanda yumurtayla servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "zeytinli-yaglama-ayvalik-usulu",
    reason: "REWRITE Ayvalık zeytinli yağlama klasik. DB'de karabiber + kekik (Ege imzası) EKSİK. Step 6 BOILERPLATE LEAK FIX. 2 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/balikesir/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/zeytinli-yaglama",
    ],
    description: "Ayvalık usulü zeytinli yağlama; köy ekmeği dilimlerinin tavada hafifçe kızartılıp üzerine siyah zeytin ezmesi, dilim domates, kekik ve nane yatırılarak zeytinyağı gezdirilen, Ege kahvaltılarının hızlı ama karakterli açık tostudur.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Zeytin ezmesini ekmek hâlâ sıcakken sürün; tatlı tuzlu denge oturur. Domateslerin suyunu süzdürmeyin; zeytinyağıyla buluşunca dilim ekmeği yumuşatır, Ege imzası bu.",
    servingSuggestion: "Tabağa alıp üstüne ekstra zeytinyağı ve kekik gezdirin; yanına dilim salatalık ve demli çayla Ege kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Domatesleri 5 mm halkalar halinde dilimleyin; nane yapraklarını ayıklayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yapışmaz tavayı orta ateşte 2 dakika ısıtıp ekmek dilimlerini iki yüzü hafifçe kuru kızartın (3 dakika), yüzeyleri zeytin ezmesini taşıyacak kadar sertleşsin.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Kızarmış ekmeklere zeytin ezmesini yayıp dilim domatesleri yerleştirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üzerlerine kekik, karabiber ve zeytinyağını gezdirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Nane yapraklarıyla taçlandırarak ılık servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "yumurtali-ekmek-kapadokya-usulu",
    reason: "REWRITE Kapadokya yumurtalı ekmek klasik. DB'de karabiber + maydanoz garnitür EKSİK. Step 1+2 BOILERPLATE LEAK FIX. 2 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/nevsehir/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/kapadokya-yumurtali-ekmek",
    ],
    description: "Kapadokya usulü yumurtalı ekmek; bayat köy ekmeği dilimlerinin sütlü yumurta ve kekikle hazırlanan karışıma emdirilip tereyağında kızartıldığı, üstüne maydanoz serpilerek servis edilen ev tipi sabah klasiğidir.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote: "Bayat ekmeği 2 cm dilim olsun; çok ince doğramayın, karışıma batırınca dağılır. Tereyağını orta-kısık ateşte eritin; yüksek ısıda yanar, yumurta-süt karışımı kızarmadan sertleşir.",
    servingSuggestion: "Sıcak yumurtalı ekmeği tabağa alıp üzerine maydanoz serpin; yanına dilim domates, beyaz peynir ve demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, süt, tuz, kekik ve karabiberi derin kâsede çırpın; karışım pürüzsüzleşene kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmek dilimlerini karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş tavada tereyağını orta-kısık ateşte eritin; köpük çekildiğinde ekmek dilimlerini yatırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Ekmekleri 4 dakika ilk yüzü altın renge gelene kadar pişirin; çevirip diğer yüzünü 4 dakika daha kızartın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: null },
      { stepNumber: 6, instruction: "Tabağa alıp üstüne ince doğranmış maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "sweetcorn-fritter-stack-avustralya-usulu",
    reason: "REWRITE Avustralya sweetcorn fritter stack klasik. DB'de tuz + karabiber + kabartma tozu (fritter essential!) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/sweetcorn-fritters",
      "https://www.taste.com.au/recipes/corn-fritters",
    ],
    description: "Avustralya sweetcorn fritter stack; mısır taneleri, un, yumurta, süt ve kabartma tozundan oluşan koyu hamurun taze soğanla aromalandırılıp tavada altın renge gelene kadar kızartılan fritter'lar üst üste yığılarak brunch sofrasında dilim avokado veya sahanda yumurta ile servis edilen tabaktır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kabartma tozu", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote: "Mısır tanelerini taze veya donmuş kullanabilirsiniz; konserve mısır kullanırsanız iyi süzdürün. Hamuru çok ince yapmayın; fritter'lar dağılır, koyu kıvam tutsun.",
    servingSuggestion: "Fritter'ları üst üste yığarak tabağa alın; üzerine sahanda yumurta yatırın, dilim avokado, çeri domates ve dilim limon ile Avustralya brunch tabağını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Taze soğanı ince halka kesin; mısır tanelerini süzdürün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kapta un, kabartma tozu, tuz ve karabiberi karıştırın; yumurta ve sütü ekleyip pürüzsüz hamur elde edin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Mısır taneleri ve taze soğanı hamura katıp koyu fritter karışımı oluşturun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp her fritter için 2 yemek kaşığı hamur dökün; tavayı kalabalık doldurmayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Fritter'ları 4 dakika ilk yüzü altın renge gelene kadar pişirin; çevirip diğer yüzünü 4 dakika daha kızartın.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Fritter'ları tabağa üst üste yığarak servis edin; üstüne sahanda yumurta yatırın, avokado ve dilim limon ile tamamlayın.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tursu-kavurmali-yumurta-rize-usulu",
    reason: "REWRITE Rize turşu kavurmalı yumurta klasik. DB'de pul biber + karabiber + maydanoz EKSİK. Step 7 BOILERPLATE LEAK 'fazla beklerse peynirli doku sertleşir' (turşu yumurtada peynir yok!) FIX. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/rize/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/tursu-kavurmasi",
    ],
    description: "Rize usulü turşu kavurmalı yumurta; fasulye turşusunun ince doğranıp soğanla tereyağında kavrulduktan sonra yumurta kırılarak yarı katı sahanda pişirildiği, Karadeniz kahvaltısının ekşi-tuzlu klasik tabağıdır.",
    ingredientsAdd: [
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote: "Fasulye turşusu çok tuzluysa 5 dakika soğuk suda yıkayın; aksi halde tabak fazla tuzlu olur. Turşuyu çok pişirmeyin; diri dokusu kalmalı, hamurlaşmamalı.",
    servingSuggestion: "Sahanı doğrudan sofraya alıp üstüne maydanoz ve pul biber serpin; yanına sıcak mısır ekmeği veya köy ekmeği ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Fasulye turşusunu iri doğrayın, fazla tuzluysa sudan geçirip suyunu sıkın; soğanı ince doğrayın, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahan veya küçük tavada tereyağını orta ateşte eritip soğanı 4 dakika yumuşayana kadar kavurun.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Turşuyu tavaya ekleyip diri dokusu kalacak şekilde 3 dakika çevirin; pul biber ve karabiberi serpin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Turşuyu sahanın çevresine yayıp ortasında çukurlar açın; yumurtaları kırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı kapatıp orta-kısık ateşte 4 dakika beyazlar tutana kadar pişirin; sarısı akışkan kalsın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Sahanı ocaktan alıp üstüne ince doğranmış maydanoz serpin.", timerSeconds: null },
      { stepNumber: 7, instruction: "Sıcak servis edin; yanına mısır ekmeği veya köy ekmeği yatırın.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tulumlu-lor-kavurmasi-erzurum-usulu",
    reason: "REWRITE Erzurum tulumlu lor kavurması klasik + DUPLICATE STEP FIX. Klasik formul (lor + tulum + tereyağı + karabiber) DB'de VAR. DB'de pul biber (Erzurum imzası) + taze soğan + yumurta opsiyonel EKSİK. STEP 4+5 DUPLICATE step ('Karabiber serpip sıcak servis edin' + 'Karabiber ekleyip sıcak servis edin' aynı, biri silinir). Step 6+7 BOILERPLATE LEAK FIX. 7 step → 5 step. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/erzurum/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/tulumlu-lor-kavurmasi",
    ],
    description: "Erzurum tulumlu lor kavurması; lor ve tulum peynirinin tereyağında karamelize taze soğanla buluşturulup karabiber ve pul biberle aromatlandığı, üzerine kırılan yumurtalarla yarı katı kıvama getirilen Doğu Anadolu kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
      { name: "Yumurta", amount: "2", unit: "adet" },
    ],
    tipNote: "Tulum peyniri çok tuzluysa lor oranını artırın; aksi halde tabak fazla tuzlu olur. Tereyağını köpüğü yanmadan eritin; aksi halde peynirler yağ ayrışır, doku bozulur.",
    servingSuggestion: "Sahanı doğrudan sofraya alıp üstüne pul biber serpin; yanına sıcak tandır ekmeği veya yufka ekmeği ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor ve tulum peynirini ufalayın; taze soğanı halka kesin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahan veya küçük tavada tereyağını orta ateşte köpüğü yanmadan eritin; taze soğanı 2 dakika çevirin.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Peynirleri tavaya ekleyip orta ateşte 4 dakika yumuşayana kadar çevirin; karabiber ve pul biberi serpin.", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Peynir karışımını sahanın çevresine yayıp ortasında çukurlar açın; yumurtaları kırın, kapağı kapatıp 4 dakika beyazlar tutana kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Sahanı ocaktan alıp doğrudan sıcak servis edin; yanına sıcak ekmek koyun.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "unlu-tava-coregi-ankara-usulu",
    reason: "REWRITE Ankara unlu tava çöreği klasik. DB'de kabartma tozu (mayasız çörek essential!) + karabiber EKSİK. Step 6 BOILERPLATE LEAK 'peynirli doku sertleşir' (çörekte peynir yok!) FIX. 2 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/ankara/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/unlu-tava-coregi",
    ],
    description: "Ankara unlu tava çöreği; un, yoğurt, yumurta, kabartma tozu ve tuzla yoğrulan mayasız hamurun ince yufka açılıp tereyağında kızartıldığı, bozkır kahvaltısının hızla hazırlanan ince çöreğidir.",
    ingredientsAdd: [
      { name: "Kabartma tozu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
    ],
    tipNote: "Kabartma tozu mayasız çörekte essential; aksi halde çörek hamur kıvamlı kalır, kabarmaz. Hamuru fazla yoğurmayın; gluten gelişmesi çörek dokusunu sertleştirir.",
    servingSuggestion: "Sıcak çörekleri dilimleyip tabağa alın; yanına ev peyniri, dilim domates, zeytin ve demli çayla Ankara kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, yoğurt, yumurta, tuz, kabartma tozu ve karabiberi yoğurma kabında birleştirip yumuşak hamur olana kadar 5 dakika çalışın; üzerini örtüp 10 dakika dinlendirin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Hamuru dört bezeye ayırıp her birini ince yufka inceliğinde açın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp tereyağını eritin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çörekleri tavaya alıp 3 dakika ilk yüzü altın renge gelene kadar pişirin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Çevirip diğer yüzünü 3 dakika daha kızartın.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Tabağa alıp 1 dakika dinlendirip sıcak servis edin; yanına ev peyniri ve dilim domates yatırın.", timerSeconds: 60 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-41");
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
              paket: "oturum-31-mini-rev-batch-41",
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
