/**
 * Tek-seferlik manuel mini-rev batch 12 (oturum 28): 4 KRITIK + 3
 * jenerik. Web research 2 paralel agent + 22+ kaynak. Hepsi 22b/24b
 * yeniden teslim sonrasi cikan yeni MAJOR'lar.
 *
 *   1. mugla-sundirme (KIBE-MUMBAR pattern REWRITE FULL): Sundirme
 *      Fethiye-Mugla yöresel turp otu + sogan + nar eksisi araSicagi
 *      (lezzetler.com + biletbayi.com + tatilbudur.com 3 kaynak). DB
 *      yanlisilikla peynirli kuymak/sunme peyniri yapmis (peynir ad
 *      yorum hatasi). 2 ingredient_remove (Taze peynir + Ekmek) + 6
 *      ingredient_add (Turp otu + Sogan + Sarimsak + Nar eksisi +
 *      Zeytinyagi + Tuz). 5 step replace. Allergens SUT+GLUTEN REMOVE.
 *
 *   2. moqueca-de-banana-brezilya-usulu (REWRITE Bahia disambiguate):
 *      Klasik moqueca de banana plantain (banana-da-terra) + Hindistan
 *      cevizi sutu + dende (Wikipedia + Flavors of Brazil + Beryl
 *      Shereshewsky 3 kaynak). DB sweet banana (cavendish) yanilticidir,
 *      aromatik (sarimsak + kisnis + dende + acı biber + zeytinyagi)
 *      eksik. Title 'Moqueca de Banana (Bahia Usulu)'. 6 ingredient_add,
 *      5 step replace.
 *
 *   3. murtuga-pide-tostu-kars-usulu (REWRITE klasik forma cek):
 *      Murtuga klasik Dogu Anadolu kahvaltısı = un + tereyagi + yumurta
 *      + tuz + uzerine bal/pekmez (Milli Gazete + Türkgün + Van Olay +
 *      Nefis 4 kaynak). 'Pide tost' kombosu kaynaksiz, modern fusion.
 *      Title 'Kars Murtuga'. 1 ingredient_remove (Pide ekmegi) + 3
 *      ingredient_add (Tuz + Bal/pekmez + Ceviz) + amount change (Un 1
 *      yk → 2.5 yk, Tereyagi 20gr → 60gr klasik bol yag). 5 step
 *      replace.
 *
 *   4. palamutlu-pazi-diblesi-samsun-usulu (REWRITE klasik forma cek):
 *      Pazi diblesi klasik Karadeniz pirinc + sebze tabanli, BALIKSIZ
 *      (Yemek.com + samsun.com.tr + ordu.net.tr 3 kaynak). 'Palamutlu'
 *      kombo kaynaksiz, modern fusion. Title 'Samsun Pazi Diblesi'. 1
 *      ingredient_remove (Palamut fileto) + 5 ingredient_add (Yesil
 *      biber + Domates + Pul biber + Karabiber + Sicak su) + amount
 *      change (Pazi 200gr → 500gr ana malzeme, Zeytinyagi 2 → 3 yk).
 *      5 step replace. DENIZ_URUNLERI allergen REMOVE. Difficulty
 *      MEDIUM → EASY.
 *
 *   5. muhallebili-elma-tatlisi-kastamonu-usulu (REWRITE light): Codex
 *      'eksik muhallebi tatlandiricilari' isaret. Muhallebi tanim
 *      geregi vanilya + seker zorunlu (Yemek.com + Nefis Yemek +
 *      KTB Kastamonu 3 kaynak; Kastamonu envanterinde muhallebili elma
 *      yok). 2 ingredient_add (Toz seker + Vanilya). Step 1 revize
 *      (seker+vanilya entegrasyon). Yore Kastamonu kaldir.
 *
 *   6. mugla-susamli-kabak-cicegi-boregi (DESC_ONLY): Mugla envanteri
 *      kabak cicegi DOLMASI klasigi (Hurriyet + BodrumTips + Mugla
 *      Belediyesi 3 kaynak), borek formu kayit yok. Yore Mugla → 'Ege
 *      esintili'. 2 opsiyonel ingredient_add (Dereotu + Taze sogan,
 *      steps'te geciyor listede yok).
 *
 *   7. papatya-limon-serbeti-yalova-usulu (DESC_ONLY): Papatya limon
 *      serbeti modern fitness/sakinlestirici icecek (Lezzet.com.tr +
 *      Yalova yöresel envanter 2 kaynak; Yalova listesinde yok). Yore
 *      Yalova → 'modern jenerik soguk icecek'.
 *
 * Yeni feature: ingredients_amount_change (paketi 12'de eklendi).
 * Ayni isimde ingredient'in miktarini gunceller (remove+add yerine
 * tek operasyon, idempotent).
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description check).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-12.ts
 *   npx tsx scripts/fix-mini-rev-batch-12.ts --env prod --confirm-prod
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
  // ─── 1: mugla-sundirme (KIBE-MUMBAR REWRITE FULL) ───────────
  {
    type: "rewrite",
    slug: "mugla-sundirme",
    reason:
      "KIBE-MUMBAR pattern. Mugla sundirme Fethiye yöresel turp otu + sogan + sarimsak + nar eksisi araSicagi (lezzetler.com + biletbayi.com + tatilbudur.com 3 kaynak). DB peynirli/ekmekli kuymak yorumu YANLIS (sundirme adi turp otunun tavada sünmesinden, peynirden degil). 2 ingredient_remove + 6 ingredient_add, 5 step replace, SUT+GLUTEN allergen REMOVE.",
    sources: [
      "https://lezzetler.com/sundurme-fethiye-mugla-tarif-122432",
      "https://blog.biletbayi.com/muglanin-yoresel-yemekleri.html/",
      "https://www.tatilbudur.com/blog/muglanin-meshur-yemekleri/",
    ],
    description:
      "Muğla sündürme, turp otu, soğan ve nar ekşisinin tavada hafif kıvama kavuşturulduğu Ege yöresel ara sıcağıdır. Adı turp otunun tavada sünmesinden gelir.",
    allergensRemove: [Allergen.SUT, Allergen.GLUTEN],
    ingredientsRemove: ["Taze peynir", "Ekmek"],
    ingredientsAdd: [
      { name: "Turp otu", amount: "500", unit: "gr" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Nar ekşisi", amount: "2", unit: "yemek kaşığı" },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
    ],
    ingredientsAmountChange: [
      { name: "Tereyağı", newAmount: "25", newUnit: "gr" },
    ],
    tipNote:
      "Turp otu suyunu salıp çekmeden tabağa almayın; bu çekilme aşaması sündürmeye o sünme kıvamını verir.",
    servingSuggestion:
      "Sıcak ara sıcak veya yöresel kahvaltı sofrasında ekmek ve zeytinle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Turp otunu yıkayın, kalın saplarını ayırın, kabaca doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Soğanı zeytinyağında 4 dakika hafif kavurun, sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Turp otunu tavaya alın, suyunu salıp çekene kadar 8 dakika orta ateşte karıştırın.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Tuz ve nar ekşisini ekleyin, 2 dakika daha pişirip aroma yoğunlaştırın.", timerSeconds: 120 },
      { stepNumber: 5, instruction: "Sıcak servis edin; yanına ekmek ve domates dilimleyin.", timerSeconds: null },
    ],
  },

  // ─── 2: moqueca-de-banana (Bahia disambiguate) ──────────────
  {
    type: "rewrite",
    slug: "moqueca-de-banana-brezilya-usulu",
    reason:
      "Klasik moqueca de banana plantain (banana-da-terra) + Hindistan cevizi sutu + dende yagi + sofrito (Wikipedia + Flavors of Brazil + Beryl Shereshewsky + Instituto Brasil a Gosto 4 kaynak). DB sweet banana (cavendish) yaniltici, aromatik eksik. Title 'Moqueca de Banana (Bahia Usulu)'. 6 ingredient_add (Sarimsak + Kisnis + Zeytinyagi + Dende + Aci biber + Tuz), 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Moqueca",
      "http://flavorsofbrazil.blogspot.com/2011/12/recipe-plantain-moqueca-moqueca-de.html",
      "https://brasilagosto.org/en/what-is-the-difference-between-the-moqueca-baiana-and-the-moqueca-capixaba/",
    ],
    newTitle: "Moqueca de Banana (Bahia Usulü)",
    description:
      "Moqueca de banana, plantain dilimlerinin domates, hindistan cevizi sütü ve dendê yağında pişirildiği Brezilya'nın Bahia usulü vejetaryen tencere yemeğidir. Plantain bulunamazsa az olgun muz koyu pişirme süresinde kullanılabilir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Taze kişniş", amount: "0.5", unit: "demet" },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Dendê (palm) yağı (opsiyonel)", amount: "1", unit: "yemek kaşığı" },
      { name: "Acı biber (malagueta veya kuş biberi)", amount: "1", unit: "adet" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Türkiye'de plantain bulamazsanız az olgun cavendish muzu seçin ve pişirme süresini 8 dakikaya düşürün; aşırı olgun muz dağılır.",
    servingSuggestion:
      "Beyaz pirinç pilavı, farofa veya pirinç-fasulye eşliğinde sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Plantainleri (veya az olgun muzu) soyup 2 cm verev dilimleyin, lime suyuyla hafifçe ovun.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede zeytinyağında soğan ve sarımsağı 4 dakika hafif kavurun, doğranmış domatesi ve acı biberi ekleyip 6 dakika orta ateşte yumuşatın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Hindistan cevizi sütünü ve tuzu ekleyip kısık ateşte 5 dakika kaynatmadan pişirin.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Plantain dilimlerini sosa yerleştirip kapağı kapatın, 12 dakika kısık ateşte plantain yumuşayana dek pişirin.", timerSeconds: 720 },
      { stepNumber: 5, instruction: "Ateşten almadan dendê yağını ve kıyılmış kişnişi ekleyin, tencereyi sallayarak karıştırın; muzlar dağılmasın. Sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: murtuga-pide-tostu-kars (klasik forma cek) ──────────
  {
    type: "rewrite",
    slug: "murtuga-pide-tostu-kars-usulu",
    reason:
      "Murtuga klasik Dogu Anadolu kahvaltısı = un + tereyagi + yumurta + tuz + uzerine bal/pekmez (Milli Gazete + Türkgün + Van Olay + Nefis 4 kaynak). 'Pide tost' kombosu kaynaksiz, modern fusion icat. Title 'Kars Murtuga'. 1 ingredient_remove (Pide ekmegi) + 3 ingredient_add (Tuz + Bal + Ceviz) + amount change (Un 1 yk → 2.5 yk klasik miktar, Tereyagi 20gr → 60gr klasik bol yag). 5 step replace, prep+cook 5+10=15 dk (tost adımı düştü).",
    sources: [
      "https://www.milligazete.com.tr/haber/20973654/murtuga-nasil-yapilir-tarifi-puf-noktalari",
      "https://www.turkgun.com/yemek-tarifleri/murtuga-tarifi-dogu-anadolunun-efsane-kahvaltiligi/333313",
      "https://www.vanolay.com/murtuga-hangi-yoreye-ait-murtuga-nasil-yapilir",
    ],
    newTitle: "Kars Murtuğa",
    description:
      "Kars murtuğa, tereyağında kavrulan unun yumurtayla birleştiği Doğu Anadolu yöresel kahvaltısı. Üzerine bal veya pekmez gezdirilerek tatlı-tuzlu dengesi yakalanır.",
    prepMinutes: 5,
    cookMinutes: 10,
    totalMinutes: 15,
    ingredientsRemove: ["Pide ekmeği"],
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Bal veya pekmez (üzerine)", amount: "2", unit: "yemek kaşığı" },
      { name: "Ceviz içi (üzerine, opsiyonel)", amount: "1", unit: "yemek kaşığı" },
    ],
    ingredientsAmountChange: [
      { name: "Un", newAmount: "2.5", newUnit: "yemek kaşığı" },
      { name: "Tereyağı", newAmount: "60", newUnit: "gr" },
    ],
    tipNote:
      "Unun rengi açılana kadar kavurmazsanız ham un tadı kalır; aroma çıkana kadar bekleyin.",
    servingSuggestion:
      "Sabah çayıyla, yanına Kars gravyeri veya Van otlu peyniri eşliğinde sıcak sunun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavada tereyağını orta ateşte tamamen eritin, kokusu çıkmaya başlasın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Unu ekleyip tahta kaşıkla sürekli karıştırarak 4-5 dakika rengi açık kahveye dönene kadar kavurun.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Tuzu serpin, ardından yumurtaları doğrudan unun üzerine kırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Spatula veya tahta kaşıkla yumurtayı parçalayarak unla homojen hale getirin, 3 dakika orta-kısık ateşte pişirin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Sıcak servis tabağına alın, üzerine bal veya pekmez gezdirin; isteğe göre ceviz serpin.", timerSeconds: null },
    ],
  },

  // ─── 4: palamutlu-pazi-diblesi-samsun (klasik forma cek) ────
  {
    type: "rewrite",
    slug: "palamutlu-pazi-diblesi-samsun-usulu",
    reason:
      "Pazi diblesi klasik Karadeniz pirinc + sebze tabanli, BALIKSIZ (Yemek.com + samsun.com.tr + ordu.net.tr 3 kaynak; samsun envanterinde palamut + pazi dible kombosu yok). 'Palamutlu' yore yamasi kaynaksiz, modern fusion. Title 'Samsun Pazi Diblesi', palamut REMOVE. 1 ingredient_remove + 5 ingredient_add + 2 amount change (Pazi 200→500gr ana malzeme, Zeytinyagi 2→3 yk). 5 step replace. DENIZ_URUNLERI allergen REMOVE. Difficulty MEDIUM → EASY.",
    sources: [
      "https://yemek.com/tarif/pazi-diblesi/",
      "https://samsun.com.tr/samsun-mutfagi/",
      "https://ordu.net.tr/yazi/95/pazi-diblesi/",
    ],
    newTitle: "Samsun Pazı Diblesi",
    description:
      "Samsun usulü pazı diblesi, taze pazı yapraklarıyla pirincin soğan eşliğinde tencerede pişirildiği Karadeniz'in klasik sebze yemeği. Yanına yoğurt veya turşuyla servis edilir.",
    difficulty: Difficulty.EASY,
    prepMinutes: 12,
    cookMinutes: 22,
    totalMinutes: 34,
    allergensRemove: [Allergen.DENIZ_URUNLERI],
    ingredientsRemove: ["Palamut fileto"],
    ingredientsAdd: [
      { name: "Yeşil biber", amount: "2", unit: "adet" },
      { name: "Domates (rendelenmiş)", amount: "1", unit: "adet" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Sıcak su", amount: "1.5", unit: "su bardağı" },
    ],
    ingredientsAmountChange: [
      { name: "Pazı", newAmount: "500", newUnit: "gr" },
      { name: "Zeytinyağı", newAmount: "3", newUnit: "yemek kaşığı" },
    ],
    tipNote:
      "Pirinci 15 dakika önceden ılık tuzlu suda bekletmek tane tane pişmesini sağlar.",
    servingSuggestion:
      "Sıcak veya ılık sunun; yanına yoğurt ve limon dilimi koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Pazı yapraklarını yıkayın, kalın saplarını ince doğrayın, yapraklarını iri parçalayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede zeytinyağında soğanı 4 dakika kavurun, biberleri ekleyip 2 dakika çevirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Pazı saplarını ve rendelenmiş domatesi ekleyip 3 dakika pişirin, ardından yıkanıp süzülmüş pirinci ilave edin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Pazı yapraklarını ekleyin, tuz, karabiber ve pul biberi serpin, sıcak suyu döküp kapağı kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kısık ateşte 18-20 dakika pirinç ve pazı yumuşayana dek pişirin, 5 dakika dinlendirip servis edin.", timerSeconds: 1140 },
    ],
  },

  // ─── 5: muhallebili-elma-tatlisi (definition fix) ───────────
  {
    type: "rewrite",
    slug: "muhallebili-elma-tatlisi-kastamonu-usulu",
    reason:
      "Muhallebi tanim geregi vanilya + seker zorunlu (Yemek.com + Nefis Yemek + KTB Kastamonu 3 kaynak; Kastamonu envanterinde muhallebili elma yok). DB sade nisastali sut, vanilya+seker eksik. Yore Kastamonu kaldir, jenerik 'Türk evi tatlısı'. 2 ingredient_add (Toz seker + Vanilya), step 1 revize.",
    sources: [
      "https://yemek.com/tarif/muhallebi/",
      "https://www.nefisyemektarifleri.com/elmali-muhallebili-tatli/",
      "https://kastamonu.ktb.gov.tr/TR-340330/kastamonu-mutfagi.html",
    ],
    description:
      "Sütle pişen vanilyalı muhallebinin elma katmanlarıyla buluştuğu klasik bir Türk evi tatlısı; tarçınla ferahlatılan sade bir kapanış.",
    ingredientsAdd: [
      { name: "Toz şeker", amount: "3", unit: "yemek kaşığı" },
      { name: "Vanilya", amount: "1", unit: "paket" },
    ],
    stepsReplace: [
      { stepNumber: 1, instruction: "Sütü tencereye alın, nişasta, şeker ve vanilyayı çırpıcıyla iyice çözüp orta ateşte 8 dakika koyulaşana dek karıştırın.", timerSeconds: 480 },
    ],
  },

  // ─── 6: mugla-susamli-kabak-cicegi-boregi (DESC_ONLY) ───────
  {
    type: "rewrite",
    slug: "mugla-susamli-kabak-cicegi-boregi",
    reason:
      "Mugla envanteri kabak cicegi DOLMASI klasigi (Hurriyet + BodrumTips + Mugla Belediyesi 3 kaynak), borek formu kayit yok. Yore Mugla → 'Ege esintili' jenerik. 2 ingredient_add (Dereotu + Taze sogan; steps'te geciyor listede yoktu).",
    sources: [
      "https://www.hurriyet.com.tr/lezizz/mugla-usulu-kabak-cicegi-dolmasi-tarifi-41559435",
      "https://www.bodrumtips.com/tr/lezzetler/bodrumun-yoresel-yemegi--kabak-cicegi-dolmasi",
      "https://www.mugla.bel.tr/sayfa/yoresel-tatlar",
    ],
    description:
      "Ege esintili bir börek fikri: lor peynirinin tazeliği, kabak çiçeğinin nazik dokusu ve üstündeki susamın hafif çıtırlığıyla yufkada buluşuyor.",
    ingredientsAdd: [
      { name: "Dereotu", amount: "0.5", unit: "demet" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
    ],
  },

  // ─── 7: papatya-limon-serbeti-yalova (DESC_ONLY) ────────────
  {
    type: "rewrite",
    slug: "papatya-limon-serbeti-yalova-usulu",
    reason:
      "Papatya limon serbeti modern fitness/sakinlestirici icecek (Lezzet.com.tr 1 kaynak; Yalova yoresel envanteri papatya serbetini icermiyor: Yeryuzu Duragi + Biletbayi). Yore Yalova → 'modern jenerik soguk icecek'.",
    sources: [
      "https://www.lezzet.com.tr/icecekler/soguk-icecekler/soguk-alkolsuz-icecekler/papatya-serbeti",
      "https://yeryuzuduragi.com/blog/yalova-yoresel-lezzetleri-ve-unlu-restoranlari/",
    ],
    description:
      "Yatıştırıcı papatya kokusunu limonun keskin tazeliğiyle dengeleyen sade bir soğuk şerbet; sıcak günlerde buzla servis edilen ferahlatıcı bir alternatif.",
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-12");
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
        id: true,
        title: true,
        description: true,
        cuisine: true,
        type: true,
        difficulty: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        averageCalories: true,
        protein: true,
        carbs: true,
        fat: true,
        tipNote: true,
        servingSuggestion: true,
        allergens: true,
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
              await tx.recipeIngredient.update({
                where: { id: target.id },
                data,
              });
            }
          }
        }

        if (op.ingredientsAdd && op.ingredientsAdd.length > 0) {
          const remainingIngredients = await tx.recipeIngredient.findMany({
            where: { recipeId: recipe.id },
            select: { name: true, sortOrder: true },
          });
          const maxSort = remainingIngredients.reduce(
            (m, i) => Math.max(m, i.sortOrder),
            0,
          );
          const existingNorm = new Set(remainingIngredients.map((i) => normalize(i.name)));
          let added = 0;
          for (const ing of op.ingredientsAdd) {
            if (existingNorm.has(normalize(ing.name))) continue;
            await tx.recipeIngredient.create({
              data: {
                recipeId: recipe.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
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
                recipeId: recipe.id,
                stepNumber: step.stepNumber,
                instruction: step.instruction,
                timerSeconds: step.timerSeconds ?? null,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            action: "MOD_K_MANUAL_REV",
            userId: null,
            targetType: "recipe",
            targetId: recipe.id,
            metadata: {
              slug: op.slug,
              reason: op.reason,
              sources: op.sources,
              paket: "oturum-28-mini-rev-batch-12",
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
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
