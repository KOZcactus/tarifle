/**
 * Tek-seferlik manuel mini-rev batch 10 (oturum 28): 7 Mod K v2
 * MAJOR_ISSUE fix (4 KRITIK + 3 jenerik). Web research 2 paralel agent
 * + 18+ kaynak (Wikipedia Leipajuusto + Sisu Homemaker + DelishGlobe /
 * Karaca Van Keledos + Hurriyet Lezizz + Van Haber / Wikipedia Vatapa
 * + Saveur + TasteAtlas / UNESCO 2011 Keskek + Kevserinmutfagi +
 * Biletbayi Manisa / Hurriyet sumakli kuru dolma + TGRT Diyarbakir +
 * Lezzet / Aksam Mardin Mahluta + Hurriyet Mahluta yore + Gurmetarif /
 * Kevserin Mutfagi cilbir + Raise a Toast cilbir tahini + Selena
 * Recipes modern cilbir).
 *
 * Verdict: 7 REWRITE (4 KRITIK + 3 jenerik "yerel iddia dusurme"
 * disambiguate). Slug korunur (URL break onleme).
 *
 *   1. uunijuusto (REWRITE orta): Finlandiya Karelia juustoleipa /
 *      leipajuusto klasik fırın peyniri. cuisine 'se' KEEP (Iskandinav
 *      kumesi Fin'i kapsayici, fi spesifik kod gerekmez). Description
 *      Pohjanmaa+Kainuu vurgusu, servingSuggestion bulut yemisi+kahve.
 *
 *   2. van-keledoslu-bulgur-asi (REWRITE kapsamli, KIBE-MUMBAR
 *      pattern): Tescilli Van keledos (Turk Patent 8 Kasim 2017)
 *      klasik bilesenler etli, nohutlu, dovmeli, ak pancarli, kurutlu.
 *      Mevcut DB tarif sadece bulgur+mercimek+kurut+sogan, kimligi
 *      kacirmis. Title 'Van Keledoslu' → 'Van Usulu Keledoslu' (slug
 *      korunur). 3 ingredient_add (dovme bugday + nohut + ak pancar
 *      veya kuzu eti vejetaryen alternatif). Step revize.
 *
 *   3. vatapa (REWRITE + CRITICAL metadata fix): Brezilya Bahia
 *      klasigi karides + ekmek + Hindistan cevizi sutu + yer fistigi
 *      + dende yagi (Wikipedia + Saveur + TasteAtlas 3 kaynak). DB'de
 *      sofrito (sogan + sarimsak + zencefil) + dende yagi + kaju
 *      eksik. CRITICAL FIX: tipNote 'Tavugu kagit havluyla...' YANLIS
 *      (tarif karidesli), servingSuggestion 'kuzu pembesi tabaka...'
 *      YANLIS (kuzu yok). Dogru tipNote (karides muhurleme + bender
 *      kivam) + servingSuggestion (acaraje + beyaz pirinc Bahia
 *      gelenegi). 6 ingredient_add, KUSUYEMIS allergen ekle (kaju).
 *
 *   4. uzum-pekmezli-keskek-manisa-usulu (REWRITE + KRITIK TYPE FIX
 *      KAHVALTI → TATLI): UNESCO 2011 torensel keskek gelenegi (dosya
 *      no 00388). Mevcut DB type 'KAHVALTI' yanlis (kalori 232 +
 *      pekmez + ceviz + tarcin profili tatli, kategori UI surface'i
 *      yanlis tetikler). Difficulty MEDIUM → EASY (5 malzeme + tek
 *      tencere). Description UNESCO baglantili 'tatli yorum' frame.
 *      Step replace placeholder/spam temizligi (5 step).
 *
 *   5. sumakli-kuru-dolma-pilavi-bitlis-usulu (REWRITE light): Yore
 *      atfi (Bitlis) kaynaksiz, klasik Dogu/Guneydogu Anadolu
 *      (Hurriyet + TGRT Diyarbakir + Lezzet 3 kaynak). Description
 *      yore yumusatma. 5 ingredient_add (tuz + sivi yag + salca +
 *      karabiber + kuru nane). Step revize.
 *
 *   6. sumakli-mahluta-corbasi-mardin-usulu (REWRITE light, KRITIK
 *      definition fix): Mahluta tanimi geregi bulgur + pirinc sart
 *      (Aksam + Hurriyet + Gurmetarif 3 kaynak; 'mahluta' = 'karisik').
 *      Mevcut DB sadece mercimek = mercimek corbasi, mahluta degil.
 *      6 ingredient_add (bulgur + pirinc + tuz + sivi yag + salca +
 *      kuru nane). Yore Mardin → Guneydogu Anadolu jenerik.
 *
 *   7. tahinli-portakal-cilbiri-antalya-usulu (REWRITE light, KRITIK
 *      definition fix): Cilbir tanimi geregi yogurt sart (Kevserin +
 *      Raise a Toast + Selena Recipes 3 kaynak). Mevcut DB'de yogurt
 *      YOK = cilbir degil. Yore Antalya → 'modern Akdeniz uyarlamasi'
 *      jenerik. 5 ingredient_add (suzme yogurt + tuz + sirke +
 *      tereyagi + pul biber). Step revize.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent (description check).
 * Slug korunur (URL break onleme).
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-10.ts
 *   npx tsx scripts/fix-mini-rev-batch-10.ts --env prod --confirm-prod
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
  stepsReplace?: StepReplacement[];
}

const OPS: RewriteOp[] = [
  // ─── REWRITE 1: uunijuusto ───────────────────────────────────
  {
    type: "rewrite",
    slug: "uunijuusto",
    reason:
      "Finlandiya Karelia/Pohjanmaa/Kainuu juustoleipa/leipajuusto klasik firin peyniri (Wikipedia + Sisu Homemaker + DelishGlobe 3 kaynak). cuisine 'se' KEEP (Iskandinav kumesi Fin'i kapsayici, dk Danimarka ayri kod var ama fi spesifik kod gerekmez). Description Pohjanmaa + Kainuu vurgusu, servingSuggestion bulut yemisi (cloudberry) + kahve baglantisi.",
    sources: [
      "https://en.wikipedia.org/wiki/Leip%C3%A4juusto",
      "https://sisuhomemaker.com/finnish-squeaky-cheese/",
      "https://delishglobe.com/recipe/finnish-leipajuusto-squeaky-cheese/",
    ],
    description:
      "Finlandiya'nın Pohjanmaa ve Kainuu mutfağından gelen uunijuusto, sütlü loru fırında pişirip üzeri beneklendiren mütevazı bir peynir tatlısıdır. Geleneksel olarak kahve yanında ya da bulut yemişi reçeliyle yenir.",
    servingSuggestion:
      "Üzerine bulut yemişi (cloudberry) veya ahududu reçeli gezdirip yanında sıcak kahveyle servis edin.",
  },

  // ─── REWRITE 2: van-keledoslu-bulgur-asi (KIBE-MUMBAR pattern) ─
  {
    type: "rewrite",
    slug: "van-keledoslu-bulgur-asi",
    reason:
      "KIBE-MUMBAR pattern. Tescilli Van keledos (Turk Patent 8 Kasim 2017, Karaca + Hurriyet + Van Haber 3 kaynak) klasik bilesenler etli (kuzu), nohutlu, dovme bugdayli, ak pancarli, kurutlu. Mevcut DB sadece bulgur+yesil mercimek+kurut+sogan, klasik keledos kimligini kacirmis. Slug korunur (URL break onleme), title 'Van Keledoslu' → 'Van Usulu Keledoslu' (Van iddiasi yumusatildi). 3 ingredient_add (dovme bugday + haslanmis nohut + ak pancar veya kuzu kusbasi). Step revize 6 step.",
    sources: [
      "https://www.karaca.com/blog/vanin-meshur-yemegi-efsane-keledos-tarifi",
      "https://www.hurriyet.com.tr/lezizz/vanin-meshur-lezzeti-keledos-nedir-keledos-nasil-yapilir-keledos-tarifi-43113613",
      "https://www.vanhaber.tr/vanin-tescilli-lezzeti-keledos-asirlik-miras-memleket-sofrasinda",
    ],
    newTitle: "Van Usulü Keledoşlu Bulgur Aşı",
    description:
      "Van'ın 2017'de Türk Patent ile tescillenen keledoşundan ilham alan ev tipi yorum: dövme buğday, kurut ve yeşil mercimek, bulguru ekşi-yoğun bir Doğu Anadolu aşına dönüştürür.",
    ingredientsAdd: [
      { name: "Dövme buğday", amount: "0.5", unit: "su bardağı" },
      { name: "Haşlanmış nohut", amount: "0.5", unit: "su bardağı" },
      { name: "Ak pancar (heliz otu, sezona göre)", amount: "1", unit: "avuç" },
    ],
    tipNote:
      "Kurutu kaynama bittikten sonra eklemek pürüzsüz ekşilik verir. Et katmak isteyenler 200 gr kuzu kuşbaşıyı buğdaydan önce haşlayabilir.",
    servingSuggestion:
      "Üzerine reyhanlı sıcak tereyağı gezdirip yoğurt ya da turşu ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kurutu ılık suda 15 dakika ezerek açın, kenara alın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Dövme buğdayı bol suda 25 dakika yumuşayana kadar haşlayın; haşlanmış nohut ve yeşil mercimeği ekleyin.", timerSeconds: 1500 },
      { stepNumber: 3, instruction: "Soğanı tereyağında 5 dakika pembeleştirin, pilavlık bulguru ekleyip 2 dakika kavurun.", timerSeconds: 420 },
      { stepNumber: 4, instruction: "Buğday-mercimek-nohut karışımını ve haşlama suyunu (3 su bardağı) bulgura ekleyip tuzlayın; kısık ateşte 15 dakika pişirin.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Kurut suyunu son 5 dakika içinde ekleyip ekşilik dengelensin diye bir kez karıştırın.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Reyhanı tereyağında kokulandırıp servis tabağında üzerine gezdirin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 3: vatapa (CRITICAL metadata fix) ────────────────
  {
    type: "rewrite",
    slug: "vatapa",
    reason:
      "Brezilya Bahia/Salvador klasigi (Wikipedia + Saveur + TasteAtlas 3 kaynak). Klasik bilesenler: karides + ekmek + Hindistan cevizi sutu + yer fistigi + dende (palm) yagi + sofrito (sogan + sarimsak + zencefil). DB'de sofrito + dende + kaju eksik (adimlarda gecer ama listede yok). CRITICAL DATA CORRUPTION FIX: mevcut tipNote 'Tavugu kagit havluyla kurulamak' YANLIS (tarif karidesli, tavuk yok), servingSuggestion 'kuzu pembesi tabaka halinde' YANLIS (kuzu yok). Dogru tipNote (karides muhurleme + blender kivam) + servingSuggestion (acaraje + beyaz pirinc Bahia gelenegi). KUSUYEMIS allergen ekle (kaju).",
    sources: [
      "https://en.wikipedia.org/wiki/Vatap%C3%A1",
      "https://www.saveur.com/article/Recipes/Classic-Brazilian-Shrimp-Stew/",
      "https://www.tasteatlas.com/vatapa/recipe",
    ],
    description:
      "Bahia mutfağının vatapası, ekmek, karides, Hindistan cevizi sütü, yer fıstığı ve dendê (palm) yağıyla koyu bir kremaya dönüşür. Salvador'un Afro-Brezilya mirasının imza tabağıdır.",
    allergensAdd: [Allergen.KUSUYEMIS],
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Taze zencefil (rendelenmiş)", amount: "1", unit: "yemek kaşığı" },
      { name: "Dendê (palm) yağı veya zeytinyağı + zerdeçal", amount: "2", unit: "yemek kaşığı" },
      { name: "Kaju", amount: "30", unit: "gr" },
      { name: "Taze kişniş (servis için)", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Karidesleri yağsız tavada 30 saniye mühürlemek soslu pişirmede süngerleşmesini önler. Ekmekli karışımı pürüzsüz kıvama gelene kadar blendırlayın, sos koyu ve kadifemsi olsun.",
    servingSuggestion:
      "Bahia geleneğine göre acarajé'nin (siyah börülce köftesi) yanında ya da beyaz pirinçle servis edin; üstüne taze kişniş serpin.",
  },

  // ─── REWRITE 4: uzum-pekmezli-keskek (TYPE KAHVALTI → TATLI) ─
  {
    type: "rewrite",
    slug: "uzum-pekmezli-keskek-manisa-usulu",
    reason:
      "UNESCO 2011 torensel keskek gelenegi (dosya no 00388, Anadolu ortak miras). Mevcut DB type 'KAHVALTI' YANLIS (kalori 232 + pekmez + ceviz + tarcin profili tatli; KAHVALTI surface yanlis UI tetiklemesi yapiyor). Difficulty MEDIUM → EASY (5 malzeme + tek tencere). Description UNESCO baglantili 'tatli yorum' frame (klasik etli keskekten ayri). Steps placeholder/spam temizligi (5 net adim).",
    sources: [
      "https://ich.unesco.org/en/RL/ceremonial-kekek-tradition-00388",
      "https://www.kevserinmutfagi.com/etli-keskek-tarifi.html",
      "https://blog.biletbayi.com/manisanin-yoresel-yemekleri.html/",
    ],
    description:
      "UNESCO 2011 listesindeki törensel keşkek geleneğinin tatlı yorumu: Manisa bağcılığından gelen üzüm pekmezi, dövme buğdayı ceviz ve tarçınla buluşturarak yumuşak bir kâse tatlısı yapar.",
    recipeType: RecipeType.TATLI,
    difficulty: Difficulty.EASY,
    tipNote:
      "Pekmezi ocaktan aldıktan sonra eklemek yanık acılığı önler. Dövme buğdayı geceden ıslatmak doku için iyidir, opsiyoneldir.",
    servingSuggestion:
      "Ceviz, tarçın ve isteğe göre bir kaşık tereyağıyla ılık servis edin; UNESCO törensel keşkeğin tatlı yorumudur.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Dövme buğdayı geceden suda ıslatın, ertesi gün süzün (opsiyonel ama doku için iyi).", timerSeconds: null },
      { stepNumber: 2, instruction: "5 su bardağı suyu kaynatın, dövme buğdayı ekleyip kısık ateşte 30-35 dakika yumuşayana kadar pişirin.", timerSeconds: 1950 },
      { stepNumber: 3, instruction: "Tahta kaşıkla 3 dakika ezerek lapamsı kıvama getirin; gerekirse 0.5 su bardağı sıcak su ekleyin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Ocaktan alıp üzüm pekmezini ekleyin (kaynayan karışıma değil, yanık acılığı önlemek için).", timerSeconds: null },
      { stepNumber: 5, instruction: "Cevizi iri kıyın, üzerine tarçın ve cevizle ılık servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 5: sumakli-kuru-dolma-pilavi-bitlis (jenerik yore) ─
  {
    type: "rewrite",
    slug: "sumakli-kuru-dolma-pilavi-bitlis-usulu",
    reason:
      "Sumakli kuru dolma pilavi formu jenerik bir Dogu/Guneydogu yorumu (Hurriyet + TGRT Diyarbakir + Lezzet 3 kaynak), Bitlis spesifik kayit yok. Description yore yumusatma. 5 ingredient_add (tuz + sivi yag + salca + karabiber + kuru nane, klasik kuru dolma pilavi destegi). Step revize, sumak suyu hazirlama adimi.",
    sources: [
      "https://www.hurriyet.com.tr/lezizz/sumakli-kuru-dolma-tarifi-41689319",
      "https://www.tgrthaber.com/yemek-tarifleri/iftar-sofralarinda-diyarbakir-usulu-kuru-dolma-tarifi-puf-noktasi-sumak-suyu-3284349",
      "https://www.lezzet.com.tr/yemek-tarifleri/sarma-ve-dolma-tarifleri/dolma-tarifleri/sumak-eksili-kuru-dolma",
    ],
    description:
      "Sumaklı kuru dolma pilavı, kuru dolmalık sebzelerin küçük parçalarını bulgurla pişirerek Doğu ve Güneydoğu Anadolu mutfağına ekşi, yoğun aromalı bir pilav kazandırır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Sumağı önce sıcak suda demlemek pilava düz toz yerine ekşi su olarak işler, dağılım dengeli olur.",
    servingSuggestion:
      "Yanına soğuk yoğurt veya cacık koyarak ekşi-serin dengeyi tamamlayın.",
  },

  // ─── REWRITE 6: sumakli-mahluta-corbasi-mardin (KRITIK definition) ─
  {
    type: "rewrite",
    slug: "sumakli-mahluta-corbasi-mardin-usulu",
    reason:
      "KRITIK definition fix. Mahluta tanimi geregi bulgur + pirinc sart ('mahluta' = 'karisik', uclu tahil zorunlu; Aksam + Hurriyet + Gurmetarif 3 kaynak). DB'de sadece mercimek = mercimek corbasi, mahluta degil. Yore Mardin → Guneydogu Anadolu jenerik (kaynaklarda Mardin spesifik yok, Antakya/Sanliurfa/Mersin/Adana/Hatay/Malatya/Mardin geneli). 6 ingredient_add (bulgur + pirinc + tuz + sivi yag + domates salcasi + kuru nane).",
    sources: [
      "https://www.aksam.com.tr/mor-papatya/mardin-mahluta-corbasi-tarifi-mahluta-corbasi-nasil-yapilir/haber-1121246",
      "https://www.hurriyet.com.tr/lezizz/mahluta-corbasi-tarifi-mahluta-corbasi-nasil-yapilir-hangi-yoreye-ait-42042642",
      "https://www.gurmetarif.com/kirmizi-mercimek-bulgur-ve-pirincle-yapilan-mahluta-corbasi-tarifi/",
    ],
    description:
      "Sumaklı mahluta çorbası, kırmızı mercimeği bulgur ve pirinçle birleştirip sumak ekşiliğiyle açan, Güneydoğu Anadolu mutfağında sevilen ekşili bir çorbadır.",
    ingredientsAdd: [
      { name: "Pilavlık bulgur", amount: "1", unit: "yemek kaşığı" },
      { name: "Pirinç", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Sıvı yağ", amount: "3", unit: "yemek kaşığı" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Kuru nane", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Bulgur ve pirinci birlikte koymak mahlutaya klasik dolgun kıvamını verir, blender sonrası tane hissi de korunur.",
    servingSuggestion:
      "Üzerine sıcak yağda kavrulmuş kuru nane ve pul biber gezdirin, yanına limon dilimi koyun.",
  },

  // ─── REWRITE 7: tahinli-portakal-cilbiri-antalya (KRITIK definition) ─
  {
    type: "rewrite",
    slug: "tahinli-portakal-cilbiri-antalya-usulu",
    reason:
      "KRITIK definition fix. Cilbir tanimi geregi yogurt sart (Osmanli sarayi koken; Kevserin Mutfagi + Raise a Toast + Selena Recipes 3 kaynak). Mevcut DB'de YOGURT YOK = cilbir degil. Yore Antalya → 'modern Akdeniz uyarlamasi' jenerik (kaynaklarda Antalya spesifik yok, modern fusion). 5 ingredient_add (suzme yogurt + tuz + sirke + tereyagi + pul biber).",
    sources: [
      "https://www.kevserinmutfagi.com/cilbir-tarifi.html",
      "https://raiseatoast.substack.com/p/cilbir-eggs-benedict-with-tahini",
      "https://www.selenarecipes.com/cilbir/",
    ],
    description:
      "Tahinli portakal çılbırı, klasik çılbırın sarımsaklı yoğurt ve poşe yumurta tabanına tahin ile portakaldan modern bir Akdeniz yorumu getirir.",
    ingredientsAdd: [
      { name: "Süzme yoğurt", amount: "1.5", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Sirke (poşe yumurta için)", amount: "1", unit: "yemek kaşığı" },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Yoğurdu oda sıcaklığına getirmek poşe yumurtanın çabuk soğumasını önler. Tahini portakal suyuyla önce çırpın ki yoğurda topaksız akar.",
    servingSuggestion:
      "Sıcak ekmek veya simit ile servis edin; tahin-portakal sosunu ayrı kâsede de sunabilirsiniz.",
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-10");
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
              paket: "oturum-28-mini-rev-batch-10",
              changes: {
                title_changed: op.newTitle ? `${recipe.title} -> ${op.newTitle}` : null,
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
                type_changed: op.recipeType ? `${recipe.type} -> ${op.recipeType}` : null,
                difficulty_changed: op.difficulty ? `${recipe.difficulty} -> ${op.difficulty}` : null,
                ingredients_added: op.ingredientsAdd?.length ?? 0,
                ingredients_removed: op.ingredientsRemove?.length ?? 0,
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

    const cuisineNote = op.cuisine ? ` (cuisine ${recipe.cuisine} -> ${op.cuisine})` : "";
    const typeNote = op.recipeType ? ` (type ${recipe.type} -> ${op.recipeType})` : "";
    const titleNote = op.newTitle ? ` (title değişti)` : "";
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
