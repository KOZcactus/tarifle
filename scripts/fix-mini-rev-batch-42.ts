/**
 * Tek-seferlik manuel mini-rev batch 42 (oturum 31 ek): 7 KRITIK fix.
 *
 * Paketi 41 sonrası 13 kalan kuyruğun yeni top 1-7. Klasik kanonik
 * tamamlama + jenerik scaffold temizleme.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. peynirli-misir-ekmegi-balikesir-usulu (Balıkesir): mısır unu +
 *      beyaz peynir + yoğurt + yumurta + tereyağı VAR. DB'de tuz +
 *      kabartma tozu (mısır ekmeği essential!) + dereotu (Ege imzası)
 *      EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   2. tvorozhnaya-zapekanka-rus-usulu (Rus): tvorog + irmik + yumurta
 *      + şeker + kuru üzüm VAR. DB'de tuz + vanilya (essential!) +
 *      tereyağı (kalıp) + ekşi krema (smetana servis) EKSİK. 4
 *      ingredient_add, 7 step replace.
 *
 *   3. zeytin-ezmeli-kasarli-simit-tostu-bursa-usulu (Bursa): simit +
 *      zeytin ezmesi + kaşar + tereyağı VAR. DB'de kekik + karabiber
 *      + maydanoz garnitür EKSİK. 3 ingredient_add, 5 step replace.
 *
 *   4. tahin-pekmez-bazlama-tostu-konya-usulu (Konya): bazlama + tahin
 *      + pekmez VAR (3 malzeme!). DB'de tereyağı (yağlama) + ceviz
 *      (Konya tahin pekmez destek) + tarçın EKSİK. 3 ingredient_add,
 *      6 step replace.
 *
 *   5. tortillali-ispanak-tava-ispanya-usulu (İspanya): yumurta +
 *      ıspanak + patates + zeytinyağı VAR. DB'de tuz + karabiber +
 *      soğan (klasik tortilla con cebolla!) + sarımsak EKSİK. 4
 *      ingredient_add, 6 step replace.
 *
 *   6. twaroglu-patates-pancake-polonya-usulu (Polonya): patates +
 *      twarog + yumurta + un + ayçiçek yağı VAR. DB'de tuz + soğan
 *      (Polonya placki essential!) + karabiber + ekşi krema (Polonya
 *      servis) EKSİK. Step 7 BOILERPLATE LEAK 'peynirli doku sertleşir'
 *      (pancake'te peynir denmez!) FIX. 4 ingredient_add, 7 step
 *      replace.
 *
 *   7. zahterli-susamli-yumurta-ekmegi-kilis-usulu (Kilis): ekmek +
 *      yumurta + zahter + susam + zeytinyağı VAR. DB'de süt
 *      (essential!) + tuz + karabiber + tereyağı EKSİK. 4
 *      ingredient_add, 5 step replace.
 *
 * Toplam: 25 ingredient_add + 41 step replace + 13 BOILERPLATE LEAK
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
    slug: "peynirli-misir-ekmegi-balikesir-usulu",
    reason: "REWRITE Balıkesir peynirli mısır ekmeği klasik. DB'de tuz + kabartma tozu (mısır ekmeği essential!) + dereotu (Ege imzası) EKSİK. Step 1+2+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/balikesir/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/ekmek-tarifleri/peynirli-misir-ekmegi",
    ],
    description: "Balıkesir usulü peynirli mısır ekmeği; mısır ununun yoğurt, yumurta, beyaz peynir ve dereotuyla yumuşak hamura getirilip kabartma toziyla 190°C fırında 22 dakika pişirildiği, üst kabuğu kızarmış içi nemli Ege kahvaltı ekmeğidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kabartma tozu", amount: "1", unit: "tatlı kaşığı" },
      { name: "Dereotu", amount: "0.5", unit: "demet" },
    ],
    tipNote: "Kabartma tozu mısır ekmeği için essential; aksi halde hamur ağır kalır, içi pişmez. Mısır ununu yoğurma kabında uzun yoğurmayın; gluten yok, sadece pürüzsüzleşene kadar karıştırmak yeter.",
    servingSuggestion: "Sıcak ekmeği dilimleyip tabağa alın; yanına ev yağı, dilim domates, beyaz peynir ve demli çayla Ege kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Beyaz peyniri çatalla ezin; dereotunu ince kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kapta mısır unu, kabartma tozu ve tuzu karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yoğurt, yumurta ve eritilmiş tereyağını ekleyip pürüzsüzleşene kadar karıştırın; ezilmiş peynir ve dereotunu katın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Karışımı yağlanmış kalıba dökün, üst yüzünü spatulayla düzeltin; 190°C ısıtılmış fırında 22 dakika üst kabuk kızarana kadar pişirin.", timerSeconds: 1320 },
      { stepNumber: 5, instruction: "Fırından çıkan ekmeği 5 dakika dinlendirip dilimleyerek sıcak servis edin.", timerSeconds: 300 },
    ],
  },
  {
    type: "rewrite",
    slug: "tvorozhnaya-zapekanka-rus-usulu",
    reason: "REWRITE Rus tvorozhnaya zapekanka klasik. DB'de tuz + vanilya (essential!) + tereyağı (kalıp) + ekşi krema (smetana servis) EKSİK. Step 6+7 BOILERPLATE LEAK FIX. 4 ingredient_add, 7 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tvorog",
      "https://www.bbcgoodfood.com/recipes/cottage-cheese-bake",
    ],
    description: "Tvorozhnaya zapekanka, Rus mutfağının fırında lor pastası; tvorog (taze peynir), irmik, yumurta, şeker, kuru üzüm ve vanilyadan oluşan harcın yağlanmış kalıba yatırılıp 180°C fırında üstü hafif kızarana kadar pişirildiği klasik kahvaltı tatlısıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Ekşi krema", amount: "4", unit: "yemek kaşığı" },
    ],
    tipNote: "Tvorog (taze peynir) yerine süzme yoğurt veya lor kullanılabilir; tülbentten 10 dakika süzdürün, fazla nem zapekanka'yı çözer. Vanilya Rus zapekanka klasik imzasıdır; eksik bırakılmaz.",
    servingSuggestion: "Sıcak zapekanka'yı dilimleyip tabağa alın; üstüne ekşi krema (smetana) yatırıp pudra şekeri serpin, yanında reçel veya bal ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru üzümü ılık suda 10 dakika bekletin; süzgeçten geçirip suyunu alın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tvorog'u tülbentle 10 dakika süzdürüp çatalla ezin; geniş kapta yumurta, şeker, vanilya ve bir tutam tuzla harmanlayın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "İrmiği tvorog karışımına ekleyip kuru üzümle birlikte 1 dakika çırpın; üzeri örtülü 10 dakika dinlendirin (irmik nem çekecek).", timerSeconds: 600 },
      { stepNumber: 4, instruction: "Kalıbı tereyağıyla yağlayıp karışımı dökün, üst yüzünü spatulayla düzeltin.", timerSeconds: null },
      { stepNumber: 5, instruction: "180°C ısıtılmış fırında 35 dakika üst yüzü hafif kızarana ve içi tutana kadar pişirin.", timerSeconds: 2100 },
      { stepNumber: 6, instruction: "Fırından çıkan zapekanka'yı 10 dakika dinlendirip dilimleyin.", timerSeconds: 600 },
      { stepNumber: 7, instruction: "Tabağa alıp üstüne ekşi krema yatırıp pudra şekeri serperek ılık servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "zeytin-ezmeli-kasarli-simit-tostu-bursa-usulu",
    reason: "REWRITE Bursa zeytin ezmeli kaşarlı simit tostu klasik. DB'de kekik + karabiber + maydanoz garnitür EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/bursa/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/simit-tostu",
    ],
    description: "Bursa usulü zeytin ezmeli kaşarlı simit tostu; tahinli simidin ortadan açılıp içine zeytin ezmesi ve eriyen kaşar peyniri yatırılarak kekikle aromatlandırılması ve yapışmaz tavada çıtırlaştırılmasıdır.",
    ingredientsAdd: [
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.25", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote: "Simidi ortadan açarken bıçağı bastırmayın; susamlı dış kabuk koparmadan iç ayrılır. Kaşarı küçük küp doğrayın; eridiğinde dengeli yayılır, taşmaz.",
    servingSuggestion: "Sıcak tostları ortadan dilimleyip tabağa alın; üstüne maydanoz serpin, yanına dilim domates ve demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Simitleri ortadan açın; kaşar peynirini küçük küp doğrayın, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Açılan simidin alt yarısına zeytin ezmesini yayıp üzerine kaşar peynirini serpin; kekik ve karabiberi serpin, üst yarıyı kapatın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp tereyağıyla yağlayın; tostları yatırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kapakla 6 dakika iki yüzü altın renge gelene ve kaşar erimesine kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Tostları tabağa alıp ortadan dilimleyerek üzerine maydanoz serpip sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tahin-pekmez-bazlama-tostu-konya-usulu",
    reason: "REWRITE Konya tahin pekmez bazlama tostu klasik. DB'de sadece 3 malzeme (bazlama+tahin+pekmez), tereyağı (yağlama) + ceviz (Konya tahin pekmez destek) + tarçın EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/konya/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/tahin-pekmez-bazlama",
    ],
    description: "Konya usulü tahin pekmez bazlama tostu; sıcak bazlamanın ortadan açılıp içine tahin sürülerek üzerine üzüm pekmezi gezdirilen, kabuğa dövülmüş ceviz ve tarçın serpilen klasik bir Anadolu sabah tatlısıdır.",
    ingredientsAdd: [
      { name: "Tereyağı", amount: "1", unit: "tatlı kaşığı" },
      { name: "Ceviz", amount: "3", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote: "Bazlamayı kuru tavada hafifçe ısıtın; çok kızartmayın, içi yumuşak kalsın. Tahini pekmez ile karıştırmayın; ayrı sürmek tatlı tuzlu denge için anahtar.",
    servingSuggestion: "Sıcak tostu ortadan dilimleyip tabağa alın; üstüne dövülmüş ceviz ve tarçın serpin, yanında demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Cevizleri kabaca dövün; bazlamaları ortadan ikiye açın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp tereyağını eritin; bazlamaları iç yüzü aşağı yatırıp 1 dakika ısıtın.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Bazlamaları tabağa alıp iç yüzlerine tahin sürün.", timerSeconds: null },
      { stepNumber: 4, instruction: "Üzerlerine pekmezi gezdirin; dövülmüş ceviz ve tarçın serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Bazlamaları katlayıp ortadan dilimleyin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sıcak servis edin; yanına demli çay iyi gider.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "tortillali-ispanak-tava-ispanya-usulu",
    reason: "REWRITE İspanya tortillalı ıspanak tava klasik. DB'de tuz + karabiber + soğan (klasik tortilla con cebolla!) + sarımsak EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Spanish_omelette",
      "https://www.bbcgoodfood.com/recipes/spanish-tortilla",
    ],
    description: "İspanya usulü tortillalı ıspanak tava; klasik tortilla española'nın ıspanaklı varyantı. Patates ve soğan zeytinyağında konfit edilip ıspanak ve sarımsakla buluşturulduktan sonra çırpılmış yumurtayla iki yüzü mühürlenen, dilim dilim servis edilen kalın omlet.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
    ],
    tipNote: "Patatesi ince dilimleyip soğanla zeytinyağında konfit edin; ısı 60-65°C, yağ kızgın değil sadece sıcak. Ispanağı yıkayıp süzdükten sonra ekleyin; aksi halde tava buhar yapar, yumurta yoğunlaşmaz.",
    servingSuggestion: "Tortillayı tabağa alıp 5 dakika dinlendirin; ılık veya oda sıcaklığında dilimleyin, yanına dilim domates, ekmek ve demli çayla İspanya kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri 2-3 mm dilimleyin; soğanı yarım ay doğrayın, sarımsağı ezin, ıspanağı yıkayıp süzün ve iri doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta-kısık ateşte ısıtıp patates ve soğanı 18 dakika konfitleyin (yağ kabarcıkları, ısı 60-65°C); sarımsağı son 2 dakikada ekleyin.", timerSeconds: 1080 },
      { stepNumber: 3, instruction: "Patates karışımını süzgece alıp fazla yağı süzdürün; ıspanağı aynı tavada 2 dakika soldurun.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Yumurtaları derin kapta tuz ve karabiberle çırpın; süzülmüş patates ve ıspanağı yumurtaya katıp 5 dakika dinlendirin.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Tavada 2 yemek kaşığı yağ bırakıp orta ateşte ısıtın; karışımı dökün, kapakla 5 dakika alt yüzü tutturup geniş tabakla çevirin, diğer yüzünü 4 dakika daha pişirin.", timerSeconds: 540 },
      { stepNumber: 6, instruction: "Tabağa alıp 5 dakika dinlendirin; ılık veya oda sıcaklığında dilimleyerek servis edin.", timerSeconds: 300 },
    ],
  },
  {
    type: "rewrite",
    slug: "twaroglu-patates-pancake-polonya-usulu",
    reason: "REWRITE Polonya twaroglu (placki ziemniaczane) patates pancake klasik. DB'de tuz + soğan (Polonya placki essential!) + karabiber + ekşi krema (Polonya servis imzası) EKSİK. Step 7 BOILERPLATE LEAK 'peynirli doku sertleşir' (pancake'te peynir denmez!) FIX. 4 ingredient_add, 7 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Placki_ziemniaczane",
      "https://www.tasteatlas.com/placki-ziemniaczane",
    ],
    description: "Polonya usulü twaroglu patates pancake (placki ziemniaczane); rendelenmiş patatesin twarog (taze peynir), soğan, yumurta ve unla yoğrularak ayçiçek yağında çıtır kenarlı pancake olarak kızartıldığı, ekşi krema (smietana) ile servis edilen klasik kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Ekşi krema", amount: "4", unit: "yemek kaşığı" },
    ],
    tipNote: "Patatesi rendeledikten sonra suyunu sıkın; aksi halde pancake'ler dağılır, çıtır kenar olmaz. Soğan placki ziemniaczane essential; aroması olmadan pancake yavan kalır.",
    servingSuggestion: "Sıcak pancake'leri tabağa alıp üstüne ekşi krema (smietana) yatırın; isteğe bağlı taze dereotu serpin, yanına dilim salatalık koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri rendeleyip iyi süzdürün; soğanı ince rendeleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Süzülen patates, rendelenmiş soğan, twarog, yumurta, un, tuz ve karabiberi geniş kapta yumuşak harç olana kadar karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada ayçiçek yağını orta-yüksek ateşte ısıtın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Harçtan 2 yemek kaşığı alarak tavaya yayıp 4 dakika ilk yüzü çıtır altın renge gelene kadar kızartın.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Pancake'leri çevirip diğer yüzünü 3 dakika daha pişirin; kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Sıcak pancake'leri tabağa alın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Üzerlerine ekşi krema yatırıp dereotu serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
  {
    type: "rewrite",
    slug: "zahterli-susamli-yumurta-ekmegi-kilis-usulu",
    reason: "REWRITE Kilis zahterli susamlı yumurta ekmeği klasik. DB'de süt (essential!) + tuz + karabiber + tereyağı EKSİK. Step 1+5 BOILERPLATE LEAK FIX. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kilis/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/zahterli-yumurta",
    ],
    description: "Kilis usulü zahterli susamlı yumurta ekmeği; bayat ekmek dilimlerinin yumurta-süt karışımına emdirilip zahter ve susamla buluşturularak tereyağında kızartıldığı, çıtır kenarlı kokulu Güneydoğu kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Süt", amount: "0.25", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Tereyağı", amount: "20", unit: "gr" },
    ],
    tipNote: "Yumurtaya süt katın; bayat ekmek karışımı emer, içte yumuşak dış kabukta çıtırlık verir. Susamı yumurtalı karışıma değil ekmeğin DIŞ yüzeyine bulayın; tavada altın kabuk oluşur.",
    servingSuggestion: "Sıcak dilimleri tabağa alıp üstüne ekstra zahter serpin; yanına dilim domates, zeytin ve demli çayla Kilis kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yumurta, süt, tuz ve karabiberi derin kâsede çırpın; karışım pürüzsüzleşene kadar 1 dakika çalışın.", timerSeconds: 60 },
      { stepNumber: 2, instruction: "Bayat ekmekleri yumurtalı karışıma yatırıp 30 saniye bekletin, çevirip diğer yüzünü 30 saniye daha emdirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Süzülen ekmeklerin iki yüzüne zahter ve susam karışımını bulayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada zeytinyağı ve tereyağını orta ateşte birlikte ısıtıp ekmek dilimlerini 6 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Tabağa alıp ekstra zahter serpip sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-42");
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
              paket: "oturum-31-mini-rev-batch-42",
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
