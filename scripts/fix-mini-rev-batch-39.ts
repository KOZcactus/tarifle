/**
 * Tek-seferlik manuel mini-rev batch 39 (oturum 31 ek): 7 KRITIK fix.
 *
 * Paketi 38 sonrası kuyruğun yeni top 1-7. Klasik kanonik tamamlama
 * + jenerik scaffold temizleme.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. kolot-peynirli-kavrulmus-domates-tostu-rize-usulu (Rize): köy
 *      ekmeği + kolot + domates + tereyağı VAR. DB'de tuz + karabiber
 *      + pul biber EKSİK. 3 ingredient_add, 6 step replace.
 *
 *   2. zahterli-yumurta-ekmegi-kilis-usulu (Kilis): bayat ekmek +
 *      yumurta + zahter + süt + tereyağı VAR. DB'de tuz + karabiber +
 *      sumak (Kilis imzası) EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   3. yag-somunu-konya-usulu (Konya): un + su + tuz + tereyağı +
 *      kaşar VAR. DB'de instant maya (mayalı somun essential!) +
 *      kekik + karabiber EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   4. tapioca-crepe (Brezilya): tapyoka nişastası + su + beyaz peynir
 *      + domates VAR. DB'de tuz + oregano (Brezilya tapioca queijo
 *      garnitür) EKSİK. 2 ingredient_add, 6 step replace.
 *
 *   5. trabzon-kayganasi (Trabzon): yumurta + un + süt + tereyağı VAR.
 *      DB'de tuz + mısır unu (Karadeniz imzası, klasik kayganana
 *      dokusu) + beyaz peynir (servis garnitür) EKSİK. 3 ingredient_add,
 *      7 step replace.
 *
 *   6. syrniki (Rus klasik, ana slug): lor + yumurta + un + şeker +
 *      sıvı yağ VAR. DB'de tuz tutamı + vanilya + ekşi krema (smetana
 *      servis essential!) EKSİK. 3 ingredient_add, 6 step replace.
 *
 *   7. van-kavut-kahvaltisi (Van): un + tereyağı + ceviz + pekmez VAR.
 *      DB'de tuz tutamı + kakule (Doğu Anadolu kavut imzası) + toz
 *      şeker EKSİK. 3 ingredient_add, 7 step replace.
 *
 * Toplam: 20 ingredient_add + 42 step replace + 14 BOILERPLATE LEAK
 * FIX (yeni 8 pattern dahil).
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
    slug: "kolot-peynirli-kavrulmus-domates-tostu-rize-usulu",
    reason: "REWRITE Rize kolot peynirli kavrulmuş domates tostu klasik. DB'de tuz + karabiber + pul biber EKSİK. Step 1+2 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/rize/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/kolot-tostu",
    ],
    description: "Rize usulü kolot peynirli kavrulmuş domates tostu; köy ekmeği dilimlerinin tereyağıyla kızartılıp üstüne kavrulmuş domates ve eriyen kolot peyniriyle taçlandığı, Karadeniz kahvaltılarının uzayan klasik tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Domatesleri tavada kavururken hafifçe tuzlayın; suyunu salar, koyu kıvama gelir. Kolot peynirini iri rendeleyin; eridiğinde dokulu kalır.",
    servingSuggestion: "Sıcak tostları tabağa alıp üstüne pul biber serpin; yanına dilim salatalık ve demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Domatesleri rendeleyin veya çok ince doğrayın; kolot peynirini iri rendeleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada tereyağının yarısını orta ateşte eritip domatesi 4 dakika çevirin; tuz, karabiber ve pul biberi serpin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Domates karışımını tavanın bir kenarına alın; ekmek dilimlerini tavanın diğer tarafına dizip 2 dakika kızartın.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Ekmeklerin üstüne kavrulan domatesi yayıp üzerine kolot peynirini serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tavanın kapağını kapatıp 4 dakika peynir tamamen erisin.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Tostları tabağa alıp üstüne ekstra pul biber serpip sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "zahterli-yumurta-ekmegi-kilis-usulu",
    reason: "REWRITE Kilis zahterli yumurta ekmeği klasik. DB'de tuz + karabiber + sumak (Kilis imzası, zahter destek) EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/zahterli-yumurta",
    ],
    description: "Kilis usulü zahterli yumurta ekmeği; bayat ekmek dilimlerinin zahter, sumak ve yumurta-süt karışımına emdirilip tereyağında kızartıldığı, Güneydoğu kahvaltı sofralarının kokulu sabah tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Zahteri yumurtalı karışıma katmadan önce 5 dakika dinlendirin; aroma yağa geçer. Sumakı pişirme aşamasında değil, servis öncesi serpin; uçucu aroması korunur.",
    servingSuggestion: "Sıcak dilimleri tabağa alıp üstüne ekstra sumak serpin; yanına dilim domates, zeytin ve demli çayla Kilis kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, süt, zahter, tuz ve karabiberi derin kâsede çırpın; karışım pürüzsüzleşene kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmekleri karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş tavada tereyağını orta ateşte eritip ekmek dilimlerini 6 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 4, instruction: "Tabağa alıp üstlerine sumak serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Sıcak servis edin; yanında çay ve dilim domates iyi gider.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "yag-somunu-konya-usulu",
    reason: "REWRITE Konya yağ somunu klasik. DB'de instant maya (mayalı somun essential!) + kekik + karabiber EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/konya/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/konya-yag-somunu",
    ],
    description: "Konya yağ somunu; mayalı hamurun ince açılıp tereyağı ve rendelenmiş kaşar peyniriyle kapatılarak 220°C fırında çıtırlaştırıldığı, taş fırın dokusunda klasik şehir somunudur.",
    ingredientsAdd: [
      { name: "Instant maya", amount: "1", unit: "tatlı kaşığı" },
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Hamuru en az 30 dakika mayalandırın; somunun içi kabarık, dışı çıtır olur. Tereyağını eritip hamura sürün; iç kat lamine doku verir.",
    servingSuggestion: "Sıcak yağ somununu dilimleyip tabağa alın; yanına dilim domates, zeytin ve çayla Konya kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, instant maya, tuz ve ılık suyu yoğurma kabında birleştirip 6 dakika çalışın; üzerini örtüp 30 dakika ılık ortamda mayalandırın.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Mayalanan hamuru bezelere bölüp her birini ince yufka açın; üzerine eritilmiş tereyağı sürüp katlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Üst yüzlere rendelenmiş kaşar peyniri, kekik ve karabiber serpin; yağlı kâğıtlı tepsiye alın.", timerSeconds: null },
      { stepNumber: 4, instruction: "220°C ısıtılmış fırında 12 dakika üst yüzleri altın renge gelene kadar pişirin.", timerSeconds: 720 },
      { stepNumber: 5, instruction: "Fırından çıkan somunları 3 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 180 },
    ],
  },
  {
    type: "rewrite",
    slug: "tapioca-crepe",
    reason: "REWRITE Brezilya tapioca crepe klasik. DB'de tuz + oregano (Brezilya tapioca queijo garnitür) EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 2 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tapioca_(food)",
      "https://www.tudogostoso.com.br/receita/tapioca-com-queijo",
    ],
    description: "Brezilya tapioca crepe; nemlendirilmiş tapyoka nişastasının tavada esnek bir krep gibi pişip içine beyaz peynir ve dilim domatesle doldurulduğu, oregano serpilerek servis edilen klasik kahvaltı veya atıştırmalıktır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Oregano", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Tapyoka nişastasını eklemeden önce 1 yemek kaşığı su ile nemlendirip elekten geçirin; tane tane olur, tavada düzgün birleşir. Tavayı yağlamayın; tapyoka kendi başına yapışır.",
    servingSuggestion: "Sıcak crepe'i ortadan dilimleyip tabağa alın; üstüne ekstra oregano ve fileto zeytinyağı gezdirip soğumadan servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tapyoka nişastasını derin kâseye alıp suyu üzerine gezdirin; çatalla karıştırarak nemlendirin, 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Nemli nişastayı ince elekten geçirip tane tane hale getirin; tuzu serpin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta ateşte 2 dakika ısıtın; tapyokayı tavaya ince eşit tabaka olarak serpin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "2 dakika pişirin; tapyoka birleşip cam gibi şeffaflaşınca dikkatlice çevirin.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Bir yarısına ezilmiş beyaz peynir, dilim domates ve oregano yatırın; sıcak yüzey peyniri eritsin diye 1 dakika daha pişirip katlayın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Üçgen formdan tabağa alıp ekstra oregano serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "trabzon-kayganasi",
    reason: "REWRITE Trabzon kayganası klasik. DB'de tuz + mısır unu (Karadeniz imzası, kayganana doku) + beyaz peynir (servis garnitür) EKSİK. Step 6+7 BOILERPLATE LEAK FIX. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/trabzon/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/trabzon-kayganasi",
    ],
    description: "Trabzon kayganası; yumurta, un ve mısır ununun sütle pürüzsüz hamur halinde çırpılıp tereyağında ince tabakalar halinde pişirildiği, krep ile omlet arasında duran Karadeniz kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Mısır unu", amount: "2", unit: "yemek kaşığı" },
      { name: "Beyaz peynir", amount: "100", unit: "gr" },
    ],
    tipNote: "Mısır ununu az miktarda kullanın; Karadeniz imzası verir ama fazlası dokuyu sertleştirir. Hamuru çırptıktan sonra 5 dakika dinlendirin; un nemlenir, kaygananın esnek dokusu oturur.",
    servingSuggestion: "Sıcak kayganana üzerine ezilmiş beyaz peynir yatırıp katlayın; tabağa alıp üstüne karadeniz tereyağı gezdirin, yanına demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, un, mısır unu, süt ve tuzu derin kâsede pürüzsüz akışkan hamur olana kadar çırpın; 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Yapışmaz tavayı orta ateşte ısıtıp tereyağıyla yağlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamurun yarısını ince tabaka halinde tavaya dökün; tavayı eğerek eşit yayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Bir yüzü 2 dakika beneklenince çevirip diğer yüzünü 1 dakika pişirin; tabağa alın.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Kalan hamurla aynı şekilde ikinci kayganayı pişirin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak kaygananın yarısına ezilmiş beyaz peyniri yatırıp katlayın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Tabağa alıp üstüne ekstra tereyağı gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "syrniki",
    reason: "REWRITE Rus syrniki ana slug klasik. DB'de tuz tutamı + vanilya + ekşi krema (smetana servis essential!) EKSİK. Step 1+2 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Syrniki",
      "https://www.bbcgoodfood.com/recipes/russian-cottage-cheese-pancakes-syrniki",
    ],
    description: "Rus klasik kahvaltı tatlısı syrniki; lor (tvorog) peynirinin yumurta, un, şeker ve vanilyayla yoğrulup küçük diskler halinde tavada kızartılması ve smetana (ekşi krema) ile servis edilmesidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Ekşi krema", amount: "4", unit: "yemek kaşığı" },
    ],
    tipNote: "Lor peynirinin nemini iki kat tülbentle 10 dakika süzdürün; aksi halde diskler dağılır. Disk şekillendirirken avucunuzu unlayın; daha düzgün form alır ve yapışmaz.",
    servingSuggestion: "Sıcak diskleri tabağa alıp üstüne smetana yatırın; pudra şekeri serpip yanında reçel veya bal ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini iki kat tülbentle 10 dakika süzdürüp pürüzsüzleştirmek için çatalla ezin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Süzülen lora yumurtayı, şekeri, tuzu ve vanilyayı ekleyip karıştırın; un ekleyerek ele yapışmayan yumuşak hamur elde edin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Avucunuzu unlayıp hamuru 8 küçük disk halinde şekillendirin; her birini 1.5 cm kalınlıkta tutun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada sıvı yağı orta-kısık ateşte ısıtıp diskleri 4 dakika ilk yüzü altın renge gelene kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Diskleri çevirip diğer yüzünü 4 dakika daha kızartın; kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Tabağa alıp üstüne ekşi krema yatırın; pudra şekeri serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "van-kavut-kahvaltisi",
    reason: "REWRITE Van kavut kahvaltısı klasik. DB'de tuz tutamı + kakule (Doğu Anadolu kavut imzası) + toz şeker EKSİK. Step 6+7 BOILERPLATE LEAK FIX. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/van/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kavut",
    ],
    description: "Van kahvaltı sofralarının kavutu; buğday ununun tereyağında kavrulup ceviz ve kakule eklenip pekmezle servis edildiği, Doğu Anadolu'nun kışlık enerjik sabah tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Kakule", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Toz şeker", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote: "Buğday ununu tereyağında orta-kısık ateşte sürekli karıştırarak kavurun; aksi halde dipte yanar, kavutun karakteristik fındıksı aroması kaybolur. Kakule kavutun Van imzasıdır; eksik bırakılmaz.",
    servingSuggestion: "Sıcak kavutu derin tabağa alıp pekmezi üstüne gezdirin; yanına demli çay ve dilim taze ekmekle Van kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizi kabaca dövün; kakuleyi ezin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tereyağını geniş tavada orta-kısık ateşte eritin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Buğday ununu ekleyip rengi hafif dönene kadar 8 dakika sürekli karıştırarak kavurun; tuz, kakule ve toz şekeri serpin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Cevizi ekleyip 1 dakika daha çevirin; kavurma kokusu çıksın.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Kavutu servis tabağına alın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Üzerine pekmezi gezdirip sıcakken servis edin.", timerSeconds: null },
      { stepNumber: 7, instruction: "Beklerse unlu karışım ağırlaşır; ılık 1 yemek kaşığı süt ile açabilirsiniz.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-39");
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
              paket: "oturum-31-mini-rev-batch-39",
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
