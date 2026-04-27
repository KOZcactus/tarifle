/**
 * Tek-seferlik manuel mini-rev batch 8 (oturum 28): 5 Mod K v2
 * MAJOR_ISSUE KRITIK fix. Web research 2 paralel agent + 16+ kaynak
 * (Kultur Portali / Samsun ktb.gov.tr / Kure Ansiklopedi /
 * Turkiye Turizm Ansiklopedisi / SUTSO Cografi Isaret Arsivi /
 * Sanliurfa Gazetesi / Pilar's Chilean Food / Chile Travel /
 * Cooking the Globe / Wikipedia Tostada / Britannica Tostada /
 * Cuban breakfast guides / Hurriyet Lezizz / Sirnak Valiligi).
 *
 * Verdict: 5 REWRITE (3 KRITIK data corruption fix + 2 KRITIK
 * cuisine fix). Paket cl cuisine code (Sili) eklenmesini de
 * kapsar (src/lib/cuisines.ts 9 location, oturum 27 pt pattern).
 *
 *   1. samsun-kaz-tiridi (REWRITE orta): Cografi isaret tescilli
 *      Samsun Kaz Tiridi (Kavak ilcesi 2011 + 2022 ek tescil),
 *      otantik tarif kaz iç yağı + bulgur pilavı + yufka. Mevcut
 *      DB yogurt + tereyagi (Adana/Konya tirit sablonu, Samsun
 *      degil). Kultur Portali ktb.gov.tr resmi. Yogurt + Tereyagi
 *      cikar, Bulgur + Kaz suyu + Tuz ekle, 6 step → 7 step.
 *
 *   2. sanliurfa-borani-pazili (REWRITE buyuk): Cografi isaret
 *      tescil no 316 (Turk Patent 29.12.2017), tam adi Urfa Pencer
 *      Pazi Boranisi. Tescil dosyasinin ayirt edici unsurlari:
 *      kuzu eti + nohut + börülce (lolaz) + isotlu kizarmis bulgur
 *      köftesi + tarcin. Mevcut DB tarif vejetaryen/jenerik (kuzu,
 *      borulce, isot, tarcin, kiyma yok). SUTSO arsivi otoriter.
 *      5 ingredient_add + step replace.
 *
 *   3. santiago-misirli-pastel-de-choclo (REWRITE buyuk + KRITIK
 *      CUISINE FIX mx→cl): Pastel de choclo Sili criolla mutfagi
 *      ulusal klasigi (Pilar Hernandez + Chile Travel resmi). DB
 *      cuisine 'mx' (Meksika!) yanlis. Tarifle CUISINE_CODES'a cl
 *      (Sili) eklendi (oturum 27 pt pattern). Ayrica klasik
 *      bilesenler eksik: tavuk + kuru uzum + fesleğen (puresinde) +
 *      pino bahari (kimyon + paprika) + pudra sekeri ust.
 *
 *   4. sirnak-serbidev-yogurtlu (REWRITE all, KIBE-MUMBAR pattern
 *      data corruption fix): Klasik Serbidev haşlanmış yarma + sulu
 *      cokelek/kurut suyu + tereyaginda kizartilmis pul biberli yağ
 *      (Kultur Portali + Sirnak Valiligi + Hurriyet 3 kaynak). Mevcut
 *      DB tamamen baska sablon (köfteli yogurtlu yemek: dana kıyma,
 *      yumurta, un, sarımsak, kuru nane). 10 mevcut malzemeyi
 *      tamamen sil, 6 yeni klasik malzeme ekle, 7 step → 5 step,
 *      difficulty HARD → EASY, kalori/protein/yag profili dustu,
 *      YUMURTA allergen cikar.
 *
 *   5. siyah-fasulyeli-yumurta-tostada-kuba-usulu (REWRITE light +
 *      KRITIK CUISINE FIX cu→mx, pina-colada/pupusa pattern):
 *      Tostada Mesoamerican/Meksika kokenli (Wikipedia + Britannica),
 *      Kuba'nin "tostada cubana"si tamamen farkli (tereyagli ekmek
 *      dilimi). Mevcut tarif zaten Meksika huevos rancheros tostada
 *      profilinde, sadece cuisine etiketi yanlis. Cuisine cu → mx,
 *      3 ingredient_add (kisnis + queso fresco + salsa), step revize.
 *
 * AuditLog action: MOD_K_MANUAL_REV. Idempotent (description check
 * ile re-run skip). Slug korunur (URL break onleme); pina-colada
 * pattern: cuisine fix + content + slug aynen.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-8.ts
 *   npx tsx scripts/fix-mini-rev-batch-8.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen, Difficulty } from "@prisma/client";
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
  description?: string;
  cuisine?: string;
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
  // ─── REWRITE 1: samsun-kaz-tiridi (CI fix orta) ──────────────
  {
    type: "rewrite",
    slug: "samsun-kaz-tiridi",
    reason:
      "Cografi isaret tescilli Samsun Kaz Tiridi (Kavak ilcesi 2011 ilk + 2022 ek). Otantik tarif: bütün kaz haşlanir, kaz suyuyla bulgur pilavı, yufka aynı yağlı suya batırılıp tepsi, didiklenmiş kaz eti + eritilmis kaz iç yağı. Mevcut DB yogurt + tereyagi (Adana/Konya tirit sablonu, Samsun klasiginde yok). Kultur Portali ktb.gov.tr otoriter. Yogurt + Tereyagi cikar, Bulgur + Kaz suyu + Tuz ekle, 6 step → 7 step, SUT allergen cikar.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/samsun/neyenir/kaz-tiridi-kaz-asma",
      "https://samsun.ktb.gov.tr/TR-280863/samsun-kaz-tiridi.html",
      "https://kureansiklopedi.com/tr/detay/samsun-kaz-tiridi-c8988",
    ],
    description:
      "Samsun Kaz Tiridi (Kaz Asma), Kavak ilçesinin coğrafi işaret tescilli kış yemeğidir: bütün kaz haşlanır, kaz suyuyla bulgur pilavı pişirilir, yufkalar aynı yağlı suya batırılıp tepsiye dizilir, üzerine didiklenmiş kaz eti ve eritilmiş kaz iç yağı yayılır.",
    allergensRemove: [Allergen.SUT],
    ingredientsRemove: ["Yoğurt", "Tereyağı"],
    ingredientsAdd: [
      { name: "Bulgur (köftelik)", amount: "300", unit: "gr" },
      { name: "Kaz suyu (haşlama suyundan)", amount: "600", unit: "ml" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Yufka kaz suyuyla ıslatılırken hamurlaşmaması için suyu azar azar ilave edin. Eritilmiş kaz iç yağı klasik tarifin imzasıdır, tereyağı ile değiştirilirse otantiklik kaybolur.",
    servingSuggestion:
      "Yanında bol soğan ve közlenmiş yeşil biberle, isteğe göre yöresel sarımsaklı yoğurtla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Bütün kazı temizleyip iç yağını ayırın, eti tencereye alıp üzerini geçecek su ekleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Kazı 2 saat kısık ateşte yumuşayana kadar haşlayın, suyunu ve etini ayırın.", timerSeconds: 7200 },
      { stepNumber: 3, instruction: "İç yağı ayrı tavada eritip cızırdayana kadar bekletin, yağı süzüp kenara alın.", timerSeconds: 360 },
      { stepNumber: 4, instruction: "Bulguru sıcak kaz suyunda 20 dakika tane tane pişirin, tuzla terbiye edin.", timerSeconds: 1200 },
      { stepNumber: 5, instruction: "Yufkaları sıcak yağlı kaz suyuna batırıp tepsiye serili dizin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Bulgur pilavını yufka katının üstüne yayın, didiklenmiş kaz etini iri parçalar halinde dağıtın.", timerSeconds: null },
      { stepNumber: 7, instruction: "Eritilmiş kaz yağını üstüne gezdirip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 2: sanliurfa-borani-pazili (CI buyuk fix) ──────
  {
    type: "rewrite",
    slug: "sanliurfa-borani-pazili",
    reason:
      "Cografi isaret tescil no 316 (Turk Patent 29.12.2017, tam ad Urfa Pencer Pazi Boranisi). Tescil dosyasinin ayirt edici unsurlari: kuzu eti + nohut + borulce (lolaz) + isotlu kizarmis bulgur kofteleri + tarcin + sarimsakli yogurt. Mevcut DB tarif vejetaryen/jenerik (kuzu, borulce, isot, tarcin, kiyma eksik), tescil disi. SUTSO arsivi (sutso.org.tr) otoriter, gercek Turk Patent dosyasi. 5 ingredient_add (kuzu kusbasi + kuru borulce + kiyma + isot + tarcin), 6 step → 7 step, cookMinutes 35→50.",
    sources: [
      "https://turkiyeturizmansiklopedisi.com/urfa-sanliurfa-pencer-pazi-boranisi",
      "https://arsiv.sutso.org.tr/cografi-urun/5/sanliurfa-urfa-pencer-pazi-boranisi",
      "https://www.sanliurfagazetesi.com/sanliurfa-mutfaginin-tescilli-lezzeti-urfa-pencer-pazi-boranisi",
    ],
    description:
      "Şanlıurfa Pencer Boranısı, Türk Patent 316 numarayla tescilli coğrafi işaretli bir kış yemeğidir: kuzu eti, pazı sapı, nohut ve börülce ayrı ayrı yumuşatılır, isotlu kızarmış bulgur köfteleri ve sarımsaklı yoğurtla aynı tabakta buluşur.",
    cookMinutes: 50,
    totalMinutes: 85,
    ingredientsAdd: [
      { name: "Kuzu eti (kuşbaşı)", amount: "400", unit: "gr" },
      { name: "Börülce (lolaz, kuru)", amount: "1", unit: "su bardağı" },
      { name: "Kıyma (köfte için)", amount: "150", unit: "gr" },
      { name: "İsot (Urfa biberi)", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tarçın", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "İsot ve tarçın köfteyi diğer borani versiyonlarından ayıran tescil imzasıdır; köfteler haşlanmaz, kızgın yağda altın renge gelene kadar kızartılır.",
    servingSuggestion:
      "Sarımsaklı yoğurt en üstte, pul biberli kızdırılmış tereyağı son anda gezdirilir. Yanında dilimlenmiş soğan ve sumakla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuzu kuşbaşıyı tencerede kendi suyuyla 25 dakika pişirin, suyunu kaybetmesin.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Pazı saplarını ayırıp yıkayın, parmak boyunda doğrayın; haşlanmış nohut ve börülceyi süzün.", timerSeconds: null },
      { stepNumber: 3, instruction: "Bulguru sıcak suyla şişirip kıyma, isot, tarçın, un ve tuzla yoğurun, fındık iriliğinde köfteler yuvarlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Köfteleri kızgın yağda altın renge gelene kadar 8 dakika kızartın, kağıt havluya alın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Pişmiş kuzunun üstüne nohut, börülce ve pazı saplarını ekleyip 15 dakika daha pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Sarımsağı yoğurda ezerek karıştırın, ayrı kasede hazır tutun.", timerSeconds: null },
      { stepNumber: 7, instruction: "Sıcak boraniyi tabağa alın, sarımsaklı yoğurdu kaşıkla yayın, kızarmış köfteleri üstüne dağıtıp pul biberli kızdırılmış tereyağıyla servis edin.", timerSeconds: null },
    ],
  },

  // ─── REWRITE 3: santiago-misirli-pastel-de-choclo (cuisine mx→cl) ──
  {
    type: "rewrite",
    slug: "santiago-misirli-pastel-de-choclo",
    reason:
      "KRITIK CUISINE FIX: mx (Meksika!) → cl (Sili). Pastel de choclo Sili criolla mutfagi ulusal klasigi (Pilar Hernandez Sili'li yemek yazari + Chile Travel resmi turizm portali + Cooking the Globe 3 kaynak). Tarifle CUISINE_CODES'a cl (Sili) eklendi (oturum 27 pt pattern). Klasik bilesenler eksik: tavuk parcalari + kuru uzum + fesleğen (mısır püresinde) + pino bahari (kimyon + paprika) + pudra sekeri ust karamelize. 5 step → 6 step, fırın detayi eklendi.",
    sources: [
      "https://www.chileanfoodandgarden.com/chilean-corn-pie/",
      "https://chile.travel/en/blog/gastronomic-tourism-six-typical-chilean-recipes-to-tour-chile-from-your-kitchen-2/",
      "https://cookingtheglobe.com/pastel-de-choclo-recipe/",
    ],
    cuisine: "cl",
    description:
      "Santiago Mısırlı Pastel de Choclo, Şili criolla mutfağının ulusal klasiği bir fırın yemeğidir: kıymalı pino harcının (soğan, kimyon, paprika) üzerine tavuk, kuru üzüm, siyah zeytin ve haşlanmış yumurta dizilir, üstü fesleğenli tatlı mısır püresiyle kaplanır ve paila kâsede karamelize olana kadar fırınlanır.",
    ingredientsAdd: [
      { name: "Tavuk göğsü (haşlanmış, didiklenmiş)", amount: "300", unit: "gr" },
      { name: "Kuru üzüm", amount: "0.25", unit: "su bardağı" },
      { name: "Taze fesleğen", amount: "6", unit: "yaprak" },
      { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" },
      { name: "Toz tatlı paprika", amount: "1", unit: "çay kaşığı" },
      { name: "Pudra şekeri", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Pino harcının suyu tamamen çekilmeden mısır püresi yayılırsa katmanlar dağılır. Pudra şekeri üst yüzeyi karamelize eder; geleneksel paila (terrakota) kâsede daha iyi sonuç verir.",
    servingSuggestion:
      "Yanında pebre sosu (domates, soğan, kişniş, acı biber) ve domatesli yeşil salatayla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı tereyağında 5 dakika yumuşatın, kimyon ve paprikayı ekleyip 1 dakika kavurun.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "Kıymayı ekleyip suyunu salıp çekene kadar 8 dakika kavurun, tuzla terbiye edin.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Tane mısırı süt ve fesleğenle blenderdan geçirip koyu püre yapın, ayrı tavada 3 dakika kaynatın.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Pino harcını fırın kabına yayın; üstüne didiklenmiş tavuk, halkalanmış zeytin, kuru üzüm ve haşlanmış yumurta dilimlerini yerleştirin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Mısır püresini üstüne yayın, pudra şekeriyle ince serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "190°C fırında 30-35 dakika, üst yüzey altın-karamelize olana kadar pişirin.", timerSeconds: 1950 },
    ],
  },

  // ─── REWRITE 4: sirnak-serbidev-yogurtlu (KIBE-MUMBAR pattern) ──
  {
    type: "rewrite",
    slug: "sirnak-serbidev-yogurtlu",
    reason:
      "KIBE-MUMBAR pattern data corruption fix. Klasik Sirnak Serbidev: haslamis yarma + sulu cokelek/kurut suyu + tereyaginda kizartilmis pul biberli yag (Kultur Portali kulturportali.gov.tr resmi + Sirnak Valiligi sirnak.gov.tr resmi + Hurriyet Lezizz 3 kaynak). Mevcut DB tamamen baska sablon (kofteli yogurtlu yemek: dana kiyma 500gr, ince bulgur, yogurt 3sb, yumurta, un, sarimsak, kuru nane, karabiber). Slug korunur (URL break onleme). 10 mevcut malzeme cikar, 6 yeni klasik ekle, 7 step → 5 step, difficulty HARD → EASY, kalori 460→380, YUMURTA allergen cikar (vejetaryen klasik).",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/sirnak/neyenir/serbidev",
      "https://www.sirnak.gov.tr/yemekler",
      "https://www.hurriyet.com.tr/lezizz/sirnak-yemekleri-sirnakta-ne-yenir-ve-neyi-meshur-sirnak-mutfagi-yemeklerinin-isimleri-ve-listesi-41805684",
    ],
    description:
      "Şırnak Serbidev, haşlanmış yarma üzerine sulandırılmış çökelek peyniri ve tereyağında kavrulmuş pul biber dökülen sade ama karakterli bir Şırnak yöre yemeğidir.",
    difficulty: Difficulty.EASY,
    prepMinutes: 10,
    cookMinutes: 30,
    totalMinutes: 40,
    averageCalories: 380,
    protein: 14,
    carbs: 48,
    fat: 14,
    allergensRemove: [Allergen.YUMURTA],
    ingredientsRemove: [
      "Dana kıyma",
      "İnce bulgur",
      "Yoğurt",
      "Yumurta",
      "Un",
      "Sarımsak",
      "Kuru nane",
      "Karabiber",
    ],
    ingredientsAdd: [
      { name: "Yarma (haşlamalık buğday)", amount: "2", unit: "su bardağı" },
      { name: "Çökelek peyniri", amount: "200", unit: "gr" },
      { name: "Su (yarma için)", amount: "6", unit: "su bardağı" },
      { name: "Tereyağı", amount: "4", unit: "yemek kaşığı" },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Çökeleği sıcak yarma suyuyla sulandırmak topaklanmayı önler ve tabakta sos kıvamı verir.",
    servingSuggestion:
      "Tereyağında kavrulmuş pul biberli yağ üstte, yanında sıcak pide ve sade ayranla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yarmayı 6 su bardağı tuzlu suda 25 dakika tane yumuşayana kadar haşlayın.", timerSeconds: 1500 },
      { stepNumber: 2, instruction: "Çökeleği yarım su bardağı sıcak yarma suyuyla pürüzsüzleşene kadar ezin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Haşlanmış yarmayı geniş servis tabağına yayıp ortasını çukurlaştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Çukura sulandırılmış çökeleği dökün.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tereyağını tavada eritip pul biberi 30 saniye kavurun, yarmanın üstüne gezdirip sıcak servis edin.", timerSeconds: 30 },
    ],
  },

  // ─── REWRITE 5: siyah-fasulyeli-yumurta-tostada-kuba-usulu (cuisine cu→mx) ──
  {
    type: "rewrite",
    slug: "siyah-fasulyeli-yumurta-tostada-kuba-usulu",
    reason:
      "KRITIK CUISINE FIX: cu (Kuba!) → mx (Meksika), pina-colada/pupusa pattern. Tostada Mesoamerican / Meksika kokenli (Wikipedia + Britannica + Cuban breakfast guides 3 kaynak); Kuba'nin 'tostada cubana'si tamamen farkli (tereyagli ekmek dilimi, tortilla degil). Mevcut tarif zaten Meksika huevos rancheros tostada profilinde (siyah fasulye + yumurta + avokado + lime), sadece cuisine etiketi yanlis. Slug korunur (pina-colada/pupusa pattern, oturum 27). 3 ingredient_add (taze kisnis + queso fresco + domates salsa, Meksika imzasi).",
    sources: [
      "https://en.wikipedia.org/wiki/Tostada_(tortilla)",
      "https://www.britannica.com/topic/tostado",
      "https://dishnthekitchen.com/huevos-habaneros-a-cuban-breakfast/",
    ],
    cuisine: "mx",
    description:
      "Meksika usulü siyah fasulyeli yumurta tostada, çıtır mısır tortillanın üstüne ezilmiş siyah fasulye ve sahanda yumurta dizip avokado, queso fresco ve taze kişnişle bitiren güçlü bir kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Taze kişniş", amount: "2", unit: "yemek kaşığı" },
      { name: "Queso fresco veya beyaz peynir", amount: "30", unit: "gr" },
      { name: "Domates salsa", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Tostada tabanını sıcak fırında 2 dakika ısıtmak çıtırlığını korur ve fasulye nemini emmez.",
    servingSuggestion:
      "Café de olla ya da soğuk taze portakal suyuyla servis edin; istenirse acı biberli salsa roja gezdirin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Siyah fasulyeyi lime suyu ve tutam tuzla püre kıvamına gelene kadar ezin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahanda yumurtaları az yağda 4 dakika sarısı akışkan kalacak şekilde pişirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Tostadanın üstüne ezilmiş fasulyeyi yayın, yumurtayı ortaya yerleştirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Dilimlenmiş avokado, ufalanmış queso fresco ve taze kişnişle bitirin; istenirse domates salsa gezdirip hemen servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-8");
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
        description: true,
        cuisine: true,
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
    if (op.description) updateData.description = op.description;
    if (op.cuisine !== undefined) updateData.cuisine = op.cuisine;
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
              paket: "oturum-28-mini-rev-batch-8",
              changes: {
                description_revised: !!op.description,
                cuisine_changed: op.cuisine ? `${recipe.cuisine} -> ${op.cuisine}` : null,
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
    console.log(`✅ ${op.slug}: REWRITE applied${cuisineNote}`);
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
