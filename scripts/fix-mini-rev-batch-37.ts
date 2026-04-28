/**
 * Tek-seferlik manuel mini-rev batch 37 (oturum 31 ek): 7 KRITIK fix.
 *
 * YENİ AUDIT METODOLOJİ KEŞFİ (oturum 31 ek): paketi 25-36 ile %100
 * kapanan 13-pattern boilerplate kuyruğundan SONRA, scripts/find-new-
 * boilerplate-patterns.ts ile 8 yeni boilerplate pattern keşfedildi:
 *
 *   - "ılık tabaklara alın, yanında çayla" (25 hit)
 *   - "son dokusunu kontrol edip tabaklayın" (21 hit)
 *   - "ritim bozulmasın" (16 hit)
 *   - "gluten gevşesin" (15 hit)
 *   - "akışı için" (9 hit, slug-leak indirect)
 *   - "sıcak servis kıvamı korur" (9 hit)
 *   - "sıcak adımlarda arama yapılmasın" (6 hit)
 *   - "akışında kullanılacak tava" (2 hit)
 *
 * 8 pattern find-jenerik-scaffold.ts'e eklendi (kalıcı genişletme,
 * 13 → 21 pattern). >=2 pattern içeren 20 yeni slug = paketi 37+
 * adayları.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. yumurtali-kenger-kavurmasi-elazig-usulu (Elazığ, 4 pattern!):
 *      kenger otu + yumurta + zeytinyağı + tuz + tandır ekmeği VAR.
 *      DB'de tereyağı + karabiber + taze soğan EKSİK. Step 1 'ritim
 *      bozulmasın' + step 2 jenerik 'tava 2 dk' + step 6 'ılık
 *      tabaklara alın yanında çayla' + step 7 'son dokusunu kontrol
 *      edip tabaklayın sıcak servis kıvamı korur' BOILERPLATE LEAK
 *      x4. 3 ingredient_add, 7 step replace.
 *
 *   2. pamonha (Brezilya, 3 pattern): taze mısır + süt + şeker +
 *      tereyağı + mısır taneleri + mısır yaprağı VAR. DB'de tuz +
 *      hindistan cevizi sütü (Brezilya klasik tatlandırma) EKSİK.
 *      Step 1 'akışı için pişirme başlayınca ritim bozulmasın' + step
 *      5 'ılık tabaklara' BOILERPLATE LEAK x2. 2 ingredient_add, 5
 *      step replace.
 *
 *   3. tavali-katmer-kayseri-usulu (Kayseri, 3 pattern): un + su +
 *      tereyağı + kaymak + tuz VAR. DB'de yumurta sarısı (yağlama) +
 *      pudra şekeri (servis tatlı varyant) EKSİK. Step 1 'akışında
 *      kullanılacak tava + ritim bozulmasın' + step 2 jenerik tava +
 *      step 7 'ılık tabaklara' BOILERPLATE LEAK x3. 2 ingredient_add,
 *      7 step replace.
 *
 *   4. lorlu-enginar-boregi-urla-usulu (Urla/Ege, 3 pattern): yufka +
 *      enginar kalbi + lor + zeytinyağı VAR. DB'de yumurta (harç) +
 *      süt (üst sürme) + tuz + karabiber + dereotu (Urla otlu imzası)
 *      EKSİK. Step 1 'akışı için ritim bozulmasın' + step 3 SLUG LEAK
 *      'Lorlu Enginar Böreği için hazır tutun' (jenerik tekrar) +
 *      step 5 'ılık tabaklara' BOILERPLATE LEAK x2 + 1 SLUG LEAK
 *      benzeri. 5 ingredient_add, 5 step replace.
 *
 *   5. ricottali-misir-boregi-avustralya-usulu (Avustralya, 2 pattern):
 *      milföy + mısır + ricotta + yumurta + karabiber VAR. DB'de tuz
 *      + frenk soğanı (chives, Avustralya brunch klasik garnitür) +
 *      süt (üst sürme) EKSİK. Step 1 servis tabağı + step 4 SLUG LEAK
 *      'ricottali-misir-boregi-avustralya-usulu akışı için' (slug
 *      DB'ye yazılmış!) + step 5 'ılık tabaklara' BOILERPLATE LEAK x2
 *      + 1 SLUG LEAK. 3 ingredient_add, 5 step replace.
 *
 *   6. tea-eggs-cin-atistirmalik-usulu (Çin, 2 pattern): yumurta +
 *      siyah çay + soya sosu + yıldız anason + su + tarçın + tuz +
 *      şeker (8 dolu!) VAR. DB'de karanfil (Çin tea egg klasik bahar)
 *      + koyu soya sosu (renk için) EKSİK. Step 1 'eksik ölçü
 *      kalmasın' + step 3 SLUG LEAK 'tea-eggs-cin-atistirmalik-usulu
 *      akışı için' + step 6 'son dokusunu kontrol edip tabaklayın'
 *      BOILERPLATE LEAK x2 + 1 SLUG LEAK. 2 ingredient_add, 6 step
 *      replace.
 *
 *   7. rommegrot (İskandinav klasik, 2 pattern): ekşi krema + un +
 *      süt + tarçın VAR. DB'de tereyağı (klasik smjør, üst gezdirme
 *      essential!) + tuz tutamı + toz şeker EKSİK. Step 1 'sıcak
 *      adımlarda arama yapılmasın' + step 5 'son dokusunu kontrol
 *      edip tabaklayın sıcak servis dokuyu korur' BOILERPLATE LEAK
 *      x2. 3 ingredient_add, 5 step replace.
 *
 * Toplam: 20 ingredient_add + 40 step replace + 17 BOILERPLATE LEAK
 * FIX (yeni 8 pattern dahil) + 3 SLUG LEAK FIX (#4 lorlu-enginar
 * 'Lorlu Enginar Böreği için hazır tutun' + #5 ricottali-misir
 * 'ricottali-misir-boregi-avustralya-usulu akışı için' + #6 tea-eggs
 * 'tea-eggs-cin-atistirmalik-usulu akışı için').
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
  // ─── 1: yumurtali-kenger-kavurmasi-elazig-usulu (4 pattern!) ──────
  {
    type: "rewrite",
    slug: "yumurtali-kenger-kavurmasi-elazig-usulu",
    reason:
      "REWRITE 4 BOILERPLATE LEAK FIX (yeni audit pattern keşfi top hit, 4 pattern içeren tek slug) + Elazığ kenger kavurması klasik tamamlama. Klasik formul: kenger otu + yumurta + zeytinyağı + tuz + tandır ekmeği VAR. DB'de tereyağı (klasik kavurma) + karabiber + taze soğan EKSİK. Step 1 'ritim bozulmasın' + step 2 jenerik 'tava 2 dk ısıtın' + step 6 'ılık tabaklara alın yanında çayla' + step 7 'son dokusunu kontrol edip tabaklayın sıcak servis kıvamı korur' BOILERPLATE LEAK x4. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/elazig/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/kenger-kavurmasi",
    ],
    description:
      "Elazığ sofralarının yumurtalı kenger kavurması; ilkbaharda toplanan kenger otunun zeytinyağı ve tereyağı kombinasyonunda taze soğanla soldurulup yumurtayla yarı katı kıvamda tutulması ve sıcak tandır ekmeğiyle servis edilmesidir.",
    ingredientsAdd: [
      { name: "Tereyağı", amount: "20", unit: "gr" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
    ],
    tipNote:
      "Kenger otunun sert lif kısmını ayıklayın; aksi halde tavada uzun pişme ister, yumurta tutmadan otsu yapı kalır. Tereyağı ve zeytinyağını birlikte kullanın; tereyağı yanmaz, kenger aroması derinleşir.",
    servingSuggestion:
      "Sahanı doğrudan sofraya alıp üzerine ince halka taze soğan serpin; sıcak tandır ekmeği veya yufka ekmeğiyle dürüm yaparak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kenger otunu ayıklayıp sert lifleri ayırın; iri parçaları 3 cm boyunda doğrayın, taze soğanı halka kesin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp tereyağını eritin; köpük çekildiğinde taze soğanı 2 dakika çevirin.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Kenger otunu tavaya ekleyip tuz ve karabiberi serpin; orta ateşte 5 dakika ara ara çevirerek soldurun.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Otları tavanın çevresine yayıp ortasında çukurlar açın; yumurtaları doğrudan içine kırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı kapatıp orta-kısık ateşte 4 dakika beyazlar tutana kadar pişirin; sarısı akışkan kalsın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Sahanı ocaktan alıp 1 dakika dinlendirin.", timerSeconds: 60 },
      { stepNumber: 7, instruction: "Sıcak tandır ekmeğiyle hemen servis edin; üzerine ekstra taze soğan ve karabiber serpin.", timerSeconds: null },
    ],
  },

  // ─── 2: pamonha (Brezilya, 3 pattern) ─────────────────────────────
  {
    type: "rewrite",
    slug: "pamonha",
    reason:
      "REWRITE 2 BOILERPLATE LEAK FIX + Brezilya pamonha klasik tamamlama. Klasik Brezilya pamonha (Goiás/Minas Gerais): taze mısır + süt + şeker + tereyağı + mısır taneleri + mısır yaprağı VAR. DB'de tuz + hindistan cevizi sütü (Brezilya klasik tatlandırma destek) EKSİK. Step 1 'pamonha akışı için pişirme başlayınca ritim bozulmasın' + step 5 'ılık tabaklara alın yanında çayla' BOILERPLATE LEAK x2. Title KORUNUR. cuisine 'br' KORUNUR. 2 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Pamonha",
      "https://www.tudogostoso.com.br/receita/pamonha-tradicional",
    ],
    description:
      "Brezilya'nın Goiás ve Minas Gerais'inden gelen pamonha; taze mısır kocanlarının rendelenip süt, hindistan cevizi sütü, tereyağı ve şekerle yumuşak hamur kıvamına getirilmesi, mısır yapraklarına paketlenip kaynar suda haşlanmasıyla hazırlanan klasik tatlı/tuzlu sokak yemeğidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Hindistan cevizi sütü", amount: "100", unit: "ml" },
    ],
    tipNote:
      "Mısır yapraklarını sıcak suda 30 dakika bekletin; aksi halde paketleme sırasında kırılır. Karışım çok akışkan görünüyorsa 1-2 yemek kaşığı mısır unu ekleyebilirsiniz; kıvam tutarlı olur.",
    servingSuggestion:
      "Pamonhaları yapraklarıyla birlikte tabağa alıp servis edin; tatlı varyantta üstüne tereyağı ve şeker, tuzlu varyantta beyaz peynir veya pancetta dilimleriyle eşleştirin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Mısır yapraklarını sıcak suda 30 dakika bekletin; bu sırada mısırları rendeleyip taneleri ezin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Rendelenmiş mısırı süt, hindistan cevizi sütü, eritilmiş tereyağı, şeker ve tuzla geniş kapta karıştırın; pürüzsüz hamur kıvamı oluşana kadar 2 dakika çırpın.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Süzülen mısır yapraklarına 2-3 yemek kaşığı karışım yatırıp orta üstüne kalan mısır tanelerinden serpin; yapraklarını sarıp ip veya başka yaprak şeritle bağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tencerede su kaynatıp pamonha paketlerini batırın; orta ateşte 35 dakika haşlayın, su seviyesini koruyun.", timerSeconds: 2100 },
      { stepNumber: 5, instruction: "Süzgeçle çıkarıp 5 dakika dinlendirin; yapraklarını açıp tatlı veya tuzlu eşliğiyle servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 3: tavali-katmer-kayseri-usulu (Kayseri, 3 pattern) ──────────
  {
    type: "rewrite",
    slug: "tavali-katmer-kayseri-usulu",
    reason:
      "REWRITE 3 BOILERPLATE LEAK FIX + Kayseri tavalı katmer tamamlama. Klasik formul: un + su + tereyağı + kaymak + tuz VAR. DB'de yumurta sarısı (yağlama+parlatma yağ kıvamı) + pudra şekeri (tatlı varyant servis) EKSİK. Step 1 'akışında kullanılacak tava + ritim bozulmasın' + step 2 jenerik 'tava 2 dk' + step 7 'ılık tabaklara alın yanında çayla' BOILERPLATE LEAK x3. Title KORUNUR. cuisine 'tr' KORUNUR. 2 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kayseri/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/hamur-isleri/tavali-katmer",
    ],
    description:
      "Kayseri usulü tavalı katmer; ince hamurun eritilmiş tereyağıyla katlanıp tavada iki yüzü altın renge gelene kadar pişirildiği, kaymak ve pudra şekeri eşliğinde servis edilen sade bir kahvaltı tatlısıdır.",
    ingredientsAdd: [
      { name: "Yumurta sarısı", amount: "1", unit: "adet" },
      { name: "Pudra şekeri", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Hamuru en az 15 dakika dinlendirin; gluten gevşer, açma sırasında yırtılmaz. Tereyağını her katmanda yeniden sürün; tek seferde değil, kat kat lazım. Üst yüze yumurta sarısı sürmek pişerken parlak kabuk oluşturur.",
    servingSuggestion:
      "Sıcak katmerleri dilimleyip tabağa alın; üstüne kaymak yatırıp pudra şekeri serpin, yanına demli çayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, su ve tuzla pürüzsüz hamur yoğurun; üzerini örtüp 15 dakika dinlendirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Tereyağını ayrı kapta eritip kenara alın; yumurta sarısını çırpıp hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru 4 bezeye bölüp her birini yufka inceliğinde açın; üzerini eritilmiş tereyağıyla yağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yağlanmış hamurları katlayarak katmer formuna sokun; üst yüzlerini yumurta sarısıyla fırçalayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp katmerleri 10 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 600 },
      { stepNumber: 6, instruction: "Tavadan alıp 1 dakika dinlendirin; üçgen dilimleyin.", timerSeconds: 60 },
      { stepNumber: 7, instruction: "Sıcak servis tabağına alıp üstüne kaymak yatırın, pudra şekeri serpip demli çayla servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: lorlu-enginar-boregi-urla-usulu (Urla, 3 pattern) ─────────
  {
    type: "rewrite",
    slug: "lorlu-enginar-boregi-urla-usulu",
    reason:
      "REWRITE 2 BOILERPLATE LEAK FIX + 1 SLUG LEAK FIX + Urla otlu lorlu enginar böreği klasik tamamlama. Klasik Ege otlu börek: yufka + enginar kalbi + lor + zeytinyağı VAR. DB'de yumurta (harç bağlayıcı) + süt (üst sürme) + tuz + karabiber + dereotu (Urla otlu imzası) EKSİK. Step 1 'akışı için ritim bozulmasın' + step 3 SLUG LEAK 'Lorlu Enginar Böreği için hazır tutun' (jenerik tekrar) + step 5 'ılık tabaklara' BOILERPLATE LEAK x2 + 1 SLUG-benzeri tekrar. Title KORUNUR. cuisine 'tr' KORUNUR. 5 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/izmir/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/borek-tarifleri/enginarli-borek",
    ],
    description:
      "Urla'nın Ege otlu mutfağından gelen lorlu enginar böreği; ince yufkalara enginar kalbi, lor peyniri ve dereotuyla hazırlanan harç sürülüp katlanmasıyla yapılır, üzerine yumurta-süt karışımı sürülerek fırında çıtırlaştırılır.",
    ingredientsAdd: [
      { name: "Yumurta", amount: "2", unit: "adet" },
      { name: "Süt", amount: "0.5", unit: "su bardağı" },
      { name: "Dereotu", amount: "0.5", unit: "demet" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Enginar kalbi taze yoksa donmuş kullanın; pişirmeden önce mutlaka çözüp suyunu alın. Dereotu son anda kıyın; uçucu aroması korunur, harç parlak yeşil kalır.",
    servingSuggestion:
      "Böreği üçgen dilimleyip tabağa alın; yanına dilim domates, taze maydanoz ve bir kase yoğurtla Ege kahvaltı sofrasını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Enginar kalplerini ince doğrayın; lor peynirini çatalla ezip dereotu, tuz, karabiber ve 1 yemek kaşığı zeytinyağıyla harmanlayarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yumurtanın 1 tanesinin sarısını ayırıp süte katarak üst sürme karışımı çırpın; kalan yumurtayı iç harca ekleyip karıştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Yufkayı ortadan ikiye kesip her parçaya iç harcı eşit yayıp doğranmış enginar parçalarını üstüne yerleştirin; rulo veya üçgen formunda sarın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Hazır böreği yağlanmış tepsiye dizip üzerlerini yumurta-süt karışımıyla fırçalayın; 200°C ısıtılmış fırında 22 dakika altın renge gelene kadar pişirin.", timerSeconds: 1320 },
      { stepNumber: 5, instruction: "Fırından çıkan böreği 5 dakika dinlendirip dilimleyerek sıcak servis edin; yanına yoğurt iyi gider.", timerSeconds: 300 },
    ],
  },

  // ─── 5: ricottali-misir-boregi-avustralya-usulu (2 pattern) ───────
  {
    type: "rewrite",
    slug: "ricottali-misir-boregi-avustralya-usulu",
    reason:
      "REWRITE 2 BOILERPLATE LEAK FIX + 1 SLUG LEAK FIX + Avustralya brunch ricottalı mısır böreği klasik. Klasik Avustralya brunch tabağı: milföy + mısır + ricotta + yumurta + karabiber VAR. DB'de tuz + frenk soğanı (chives, Avustralya brunch klasik garnitür) + süt (üst sürme) EKSİK. Step 1 'servis tabağını ve yan malzemeleri' + step 4 SLUG LEAK 'ricottali-misir-boregi-avustralya-usulu akışı için' (slug DB'ye yazılmış!) + step 5 'ılık tabaklara' BOILERPLATE LEAK x2 + 1 SLUG LEAK. Title KORUNUR. cuisine 'au' KORUNUR. 3 ingredient_add, 5 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/sweetcorn-ricotta-tart",
      "https://www.taste.com.au/recipes/corn-ricotta-tart",
    ],
    description:
      "Avustralya brunch sofralarının ricottalı mısır böreği; milföy hamuruna taze mısır taneleri, ricotta peyniri, yumurta ve frenk soğanından oluşan dolgu yatırılıp 200°C fırında üst yüzü altın renk alana kadar pişirilen, dilim halinde servis edilen brunch tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Frenk soğanı", amount: "2", unit: "yemek kaşığı" },
      { name: "Süt", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Milföy hamurunu kalıba yerleştirdikten sonra çatalla delikler açın; pişerken kabarmaz ve dolgu eşit oturur. Mısır tanelerini taze veya donmuş kullanabilirsiniz; konserve mısır kullanırsanız iyi süzdürün.",
    servingSuggestion:
      "Böreği üçgen dilimleyip tabağa alın; yanına yeşillikli salata, dilim domates ve avokado dilimleriyle Avustralya brunch tabağını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Milföy hamurunu 26 cm tart kalıbına yerleştirip kenarlarını bastırın; çatalla taban deliklerini açın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kapta ricotta peynirini çatalla ezin; 1 yumurta, frenk soğanı, tuz ve karabiberle harmanlayıp pürüzsüzleştirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Mısır tanelerini ricotta karışımına katıp tart kalıbına eşit yayın; üzerine kalan yumurtayı sütle çırpıp gezdirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "200°C ısıtılmış fırında 24 dakika üst yüzü altın renge gelene kadar pişirin.", timerSeconds: 1440 },
      { stepNumber: 5, instruction: "Fırından çıkan böreği 5 dakika dinlendirip dilimleyerek sıcak servis edin; yanına yeşillikli salata yatırın.", timerSeconds: 300 },
    ],
  },

  // ─── 6: tea-eggs-cin-atistirmalik-usulu (Çin, 2 pattern) ──────────
  {
    type: "rewrite",
    slug: "tea-eggs-cin-atistirmalik-usulu",
    reason:
      "REWRITE 2 BOILERPLATE LEAK FIX + 1 SLUG LEAK FIX + Çin tea eggs klasik tamamlama. Klasik Çin atıştırmalık (茶葉蛋): yumurta + siyah çay + soya sosu + yıldız anason + su + tarçın + tuz + şeker (8 dolu!) VAR. DB'de karanfil (Çin tea egg klasik bahar 5-spice destek) + koyu soya sosu (renk için) EKSİK. Step 1 'eksik ölçü kalmasın diye kapları sıraya' + step 3 SLUG LEAK 'tea-eggs-cin-atistirmalik-usulu akışı için' (slug DB'ye yazılmış!) + step 6 'son dokusunu kontrol edip tabaklayın' BOILERPLATE LEAK x2 + 1 SLUG LEAK. Title KORUNUR. cuisine 'cn' KORUNUR. 2 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tea_egg",
      "https://thewoksoflife.com/chinese-tea-eggs/",
    ],
    description:
      "Çin sokak ve ev sofralarının klasik atıştırmalığı tea eggs (茶葉蛋); haşlanan yumurtaların kabukları çatlatılıp siyah çay, soya sosu, yıldız anason, tarçın ve karanfilden oluşan aromalı pişirme suyunda 35 dakika daha demlendirilerek mermer desenli ve baharat kokulu hâle getirilmesidir.",
    ingredientsAdd: [
      { name: "Karanfil", amount: "3", unit: "adet" },
      { name: "Koyu soya sosu", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Yumurtaların kabuklarını çatlatmak için kaşığın arkasını hafifçe vurun; çatlak küçük olmalı, soyulmamalı. Çatlak ne kadar bol ve çapraz olursa, mermer deseni o kadar belirgin çıkar.",
    servingSuggestion:
      "Yumurtaları kabuklarıyla birlikte servis tabağına alın; soyulduğunda mermer deseni görünür. Yanına dilim limon, taze kişniş ve sıcak çayla atıştırmalık olarak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş tencerede 6 yumurtayı kaynar suya alıp 8 dakika haşlayın; soğuk suya alıp ılındıktan sonra kabuklarını kaşık arkasıyla hafifçe çatlatın (soymadan).", timerSeconds: 480 },
      { stepNumber: 2, instruction: "Ayrı tencerede 4 su bardağı suyu kaynatıp siyah çay, soya sosu, koyu soya sosu, yıldız anason, tarçın çubuğu, karanfil, tuz ve şekeri ekleyip 5 dakika kaynatarak aromalı pişirme suyunu hazırlayın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Çatlatılmış yumurtaları aromalı suya bırakın; çay ve soya pişirme suyunun rengine geçmesini sağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kapakla kısık ateşte 35 dakika pişirin; ara ara yumurtaları çevirin, renk eşit dağılsın.", timerSeconds: 2100 },
      { stepNumber: 5, instruction: "Ocaktan alıp yumurtaları pişirme suyunda 1 saat veya buzdolabında geceleterek demlendirin (uzun demlendirme = derin renk + aroma).", timerSeconds: 3600 },
      { stepNumber: 6, instruction: "Yumurtaları sudan çıkarıp kabuklarını soyun; mermer deseni belirgin çıkar, dilim limon ve taze kişnişle servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: rommegrot (İskandinav klasik, 2 pattern) ──────────────────
  {
    type: "rewrite",
    slug: "rommegrot",
    reason:
      "REWRITE 2 BOILERPLATE LEAK FIX + İskandinav rømmegrøt klasik tamamlama. Klasik Norveç (İskandinav umbrella) tabağı: ekşi krema + un + süt + tarçın VAR. DB'de tereyağı (klasik smjør, üst gezdirme essential!) + tuz tutamı + toz şeker EKSİK. Step 1 'sıcak adımlarda arama yapılmasın' + step 5 'son dokusunu kontrol edip tabaklayın sıcak servis dokuyu korur' BOILERPLATE LEAK x2. Title KORUNUR. cuisine 'se' KORUNUR (İskandinav umbrella). 3 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/R%C3%B8mmegr%C3%B8t",
      "https://www.northwildkitchen.com/rommegrot-norwegian-sour-cream-porridge/",
    ],
    description:
      "İskandinav (Norveç orijinli) klasik kahvaltı/şenlik tabağı rømmegrøt; ekşi krema ve sütle yavaş pişen un lapasının üstüne eritilmiş tereyağı (smjør) gezdirilip tarçın ve toz şeker serpilerek servis edilmesidir.",
    ingredientsAdd: [
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Toz şeker", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Ekşi kremayı yüksek ısıda kaynatmayın; aksi halde kesilir. Unu eklemeden önce ekşi kremanın doğal yağı ayrılana kadar kısık ateşte 5 dakika pişirin (smjør'un kaynağı). Tereyağı servis öncesi mutlaka eritilmiş şekilde gezdirilir; lapanın üstünde altın havuz oluşturur.",
    servingSuggestion:
      "Sıcak lapayı servis kâsesine alıp üstüne eritilmiş tereyağı gezdirin; tarçın ve toz şeker serperek servis edin. Yanında demli kahve, çay veya bir bardak süt iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Ekşi kremayı geniş tencerede orta-kısık ateşte 5 dakika ısıtıp doğal yağının ayrılmasını bekleyin; ayrılan yağı (smjør) ayrı kâseye alıp ılık tutun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Kalan ekşi kremaya unu eleyerek azar azar ekleyip çırpıcıyla 3 dakika çırpın; topaklanma engellemek için ateşi kısın.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Sütü ince akıtarak ekleyip toz şeker ve tuzu katın; 8 dakika kısık ateşte sürekli karıştırarak lapa kıvamına getirin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Tereyağını ayrı küçük tavada eritip kenara alın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Lapayı servis kâsesine alıp üstüne ayrılan smjør ve eritilmiş tereyağı gezdirin; tarçın ve ekstra toz şeker serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-37");
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
              paket: "oturum-31-mini-rev-batch-37-NEW-PATTERN",
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
