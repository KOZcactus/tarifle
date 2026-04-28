/**
 * Tek-seferlik manuel mini-rev batch 25 (oturum 30): 7 KRITIK fix.
 *
 * Verify-untracked MAJOR pattern (jenerik scaffold step 2+3+6+7
 * boilerplate + eksik klasik bilesen). scripts/find-jenerik-scaffold.ts
 * ile 79 hit içinden top 7 secildi. 2 paralel agent + 15+ kaynak
 * (Caesar Cardini 1924 Tijuana + Julia Child + Serious Eats Kenji +
 * Fuchsia Dunlop Every Grain of Rice + Tugrul Şavkay Türk Mutfağı +
 * Escoffier Le Guide Culinaire 1903 + Nevin Halıcı + Refika
 * Mutfağı + TÜBİTAK Türkiye Gastronomi Atlası + Adıyaman Belediyesi
 * Mutfak Envanteri + Pim Techamuanvivit Thai Food + David Thompson +
 * Bangkok Post + Delia Smith Complete Cookery + Mary Berry Baking
 * Bible + BBC Good Food Chicken & Mushroom Pie).
 *
 * Verdict: 7 REWRITE. 1 cuisine fix (#2 tr→cn). 1 title disambiguate
 * (#2 'Asya Esintili'). 5 title KORUNUR (klasik kimlik kanıtlı).
 *
 * 1 KRITIK CUISINE FIX:
 *  - #2 tavuklu-noodle: cuisine 'tr' YANLIS (soya+susam yağı = Asya
 *    stir-fry). 'cn' (Çin esintili) → title 'Asya Esintili Tavuklu
 *    Noodle'.
 *
 * 1 KRITIK TUTARSIZLIK:
 *  - #2 tavuklu-noodle: servingSuggestion 'taze soğan serpin' LISTEDE
 *    YOK.
 *
 * 7 TARIFTE JENERIK SCAFFOLD TEMIZLENDI: step 2+3+6+7 boilerplate
 * 'kalan malzemeleri ölçün', 'tuz baharat ekşi ayrı kapta', 'son tuz
 * yağ dengesi', 'tabakta su salmasın' SİL.
 *
 *   1. tavuklu-sezar-wrap (jenerik scaffold + Sezar klasik bilesen):
 *      Caesar 1924 Tijuana (Cardini); klasik Sezar sosu sarimsak +
 *      Worcestershire + Dijon + yumurta sarisi + parmesan + limon +
 *      zeytinyagi. Title KORUNUR. 4 ingredient_add (sarimsak + tuz +
 *      karabiber + opsiyonel Worcestershire), 5 step replace.
 *
 *   2. tavuklu-noodle (CUISINE FIX + TUTARSIZLIK + Asya): cuisine 'tr'
 *      YANLIS, soya+susam yagi = Asya stir-fry. Title 'Asya Esintili
 *      Tavuklu Noodle' disambiguate. cuisine 'tr'→'cn'. servingSuggestion
 *      'taze soğan' LISTEDE YOK = TUTARSIZLIK. 4 ingredient_add (taze
 *      zencefil + taze sogan + tuz + opsiyonel pul biber), 5 step
 *      replace.
 *
 *   3. tavuklu-sultan-kebabi (jenerik scaffold + besamel klasik):
 *      Klasik Osmanli saray (sebze sote + besamel + yufka rulo + firin).
 *      Escoffier 1903 besamel klasik (tereyagi + un + sut + tuz + beyaz
 *      biber + muskat). DB tereyagi listede ZATEN VAR; eksik tuz +
 *      karabiber + muskat + zeytinyagi (sebze sote yagi). Title
 *      KORUNUR. 4 ingredient_add (zeytinyagi + tuz + karabiber +
 *      muskat), 6 step replace klasik akış (sebze sote + besamel +
 *      yufka rulo + 190°C 25 dk).
 *
 *   4. taze-fasulyeli-bulgur-pilavi (jenerik scaffold + salça/sarımsak):
 *      Klasik Türk pilavi formul: bulgur + sogan + salça + sarimsak +
 *      tereyagi/yag + tuz + karabiber + opsiyonel nane (Refika +
 *      Nevin Halıcı). DB zeytinyagi+tuz+su zaten VAR; eksik salça +
 *      sarimsak + karabiber + opsiyonel nane. Title KORUNUR. 4
 *      ingredient_add, 1 amount change (su 3→2.5 sb klasik 1:1.7
 *      oran, fasulye su salacagi icin), 6 step replace.
 *
 *   5. tepsi-orugu-adiyaman-usulu (jenerik scaffold + içli köfte
 *      klasik): Adıyaman tepsi oruk = içli köfte tepside (kibe akrabası).
 *      TÜBİTAK + Adıyaman Belediyesi resmi: dış harç ince bulgur +
 *      irmik + isot + zeytinyagi; iç harç kıyma + sogan + ceviz +
 *      salça + isot + kimyon + karabiber + maydanoz + opsiyonel nane.
 *      Title KORUNUR (Adıyaman tepsi oruk yöresel klasik). 7
 *      ingredient_add (irmik dış + tuz + isot iç + kimyon iç + karabiber
 *      iç + maydanoz iç + zeytinyagi dış), 6 step replace klasik akış.
 *
 *   6. tay-feslegenli-patlican (jenerik scaffold + Tay klasik denge):
 *      Klasik Pad Makheua Yao Bai Krapao: patlıcan + Tay biberi +
 *      sarimsak + soya + balık sosu + palmiye seker + Holy Basil
 *      (Pim Techamuanvivit + David Thompson + Bangkok Post). Title
 *      KORUNUR. cuisine 'th' KORUNUR. 4 ingredient_add (sarimsak +
 *      esmer seker palmiye yerine + tuz + bitki yağı yüksek ateş wok
 *      icin), 1 amount change (susam yagi 1yk→1tk klasik finish az
 *      miktar), 5 step replace.
 *
 *   7. tavuklu-mantarli-pie-tava-ingiltere-usulu (jenerik scaffold +
 *      İngiliz pie roux): Klasik İngiliz Chicken & Mushroom Pie:
 *      tavuk + mantar + sogan + sarimsak + tereyagi + un (roux base) +
 *      tavuk suyu + krema + thyme/kekik + tuz + karabiber + parsley +
 *      milföy üst kapak + 200°C 25-30 dk firin (Delia Smith + Mary
 *      Berry + BBC Good Food). DB un + tavuk suyu + yumurta ZATEN VAR.
 *      Eksik tereyagi + sarimsak + tuz + karabiber + kuru kekik
 *      (thyme klasik). Title KORUNUR. 5 ingredient_add (tereyagi +
 *      sarimsak + tuz + karabiber + kuru kekik), 1 amount change
 *      (total 36→47 dk roux+firin gerceklik), 6 step replace klasik
 *      akış.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-25.ts
 *   npx tsx scripts/fix-mini-rev-batch-25.ts --env prod --confirm-prod
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
  // ─── 1: tavuklu-sezar-wrap (Sezar klasik) ────────────────────────
  {
    type: "rewrite",
    slug: "tavuklu-sezar-wrap",
    reason:
      "REWRITE jenerik scaffold + Sezar klasik bilesen. Caesar 1924 Tijuana (Cardini); klasik Sezar sosu sarimsak + Worcestershire + Dijon + yumurta sarisi + parmesan + limon + zeytinyagi. DB step 2+3+6+7 jenerik scaffold. Eksik tuz + karabiber + sarimsak + opsiyonel Worcestershire. cuisine 'us' KORUNUR. Title KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Caesar_salad",
      "https://www.seriouseats.com/the-best-caesar-salad-recipe",
    ],
    description:
      "Izgara tavuk, romaine marul, parmesan ve ançüezli Sezar sosuyla hazırlanan, klasik 1924 Caesar salatasının wrap'e uyarlanmış doyurucu öğle versiyonu.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "1", unit: "diş" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Worcestershire sosu (opsiyonel)", amount: "1", unit: "çay kaşığı" },
    ],
    tipNote:
      "Sezar sosunu tavuk pişerken hazırlayın; tortilla sarmadan önce kuru tavada 20 saniye ısıtın, çatlamadan sıkı kapanır.",
    servingSuggestion:
      "Patates cipsi ve turşuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğüslerini eş kalınlıkta açın, tuz ve karabiberle ovup zeytinyağıyla harmanlayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Izgara tavada her iki yüzünü 5-6 dakika çevirerek pişirin, dinlendirip şerit doğrayın.", timerSeconds: 720 },
      { stepNumber: 3, instruction: "Mayonez, ezilmiş ançüez, rendelenmiş sarımsak, limon suyu, opsiyonel Worcestershire ve parmesanı çırparak Sezar sosu hazırlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Tortillaları kuru tavada 20 saniye ısıtın; ortalarına marul, tavuk şeritleri ve sosu paylaştırın.", timerSeconds: 20 },
      { stepNumber: 5, instruction: "Yanlardan kıvırıp sıkıca sarın, çapraz keserek servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: tavuklu-noodle (CUISINE FIX + TUTARSIZLIK + Asya) ────────
  {
    type: "rewrite",
    slug: "tavuklu-noodle",
    reason:
      "REWRITE CUISINE FIX + TUTARSIZLIK FIX + Asya disambiguate. cuisine 'tr' YANLIS (soya sosu + susam yagi = Asya stir-fry, Turk klasiginde yok). servingSuggestion 'taze sogan serpin' LISTEDE YOK = TUTARSIZLIK. Klasik Pan-Asya wok protokolu (zencefil + sarimsak + soya + susam yagi triadı, Fuchsia Dunlop). Title 'Asya Esintili Tavuklu Noodle' + cuisine 'cn'. 4 ingredient_add (taze zencefil + taze sogan + tuz + opsiyonel pul biber), 5 step replace klasik wok akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Stir_frying",
      "https://www.seriouseats.com/wok-skills-101-stir-frying-techniques",
    ],
    newTitle: "Asya Esintili Tavuklu Noodle",
    cuisine: "cn",
    description:
      "Tavuk, sebze ve noodle'ın soya sosu, taze zencefil ve susam yağıyla yüksek ateşte tavada birleştiği Asya esintili pratik akşam yemeği.",
    ingredientsAdd: [
      { name: "Taze zencefil", amount: "1", unit: "tatlı kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Pul biber (opsiyonel)", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Zencefil ve sarımsağı yağa atınca 20 saniyeden fazla bekletmeyin; sebzeleri yüksek ateşte kısa süre çevirin, renkleri canlı ve dokuları diri kalır.",
    servingSuggestion:
      "Üzerine taze soğan halkaları ve kavrulmuş susam serpip sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Noodle'ı paket süresine göre haşlayıp süzün, soğuk sudan geçirip 1 çay kaşığı susam yağıyla harmanlayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Tavukları ince şeritler halinde doğrayıp tuzla ovun, kızgın geniş tavada 4-5 dakika pişirip alın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Aynı tavaya rendelenmiş sarımsak ve zencefili atıp 20 saniye kavurun; havuç, biber ve kabağı yüksek ateşte 3 dakika çevirin.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Tavuğu geri ekleyin; soya sosu, kalan susam yağı ve opsiyonel pul biberi ilave edip 1 dakika harmanlayın.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Noodle'ı tavaya alıp hızlıca çevirin, ince doğranmış taze soğan ile servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: tavuklu-sultan-kebabi (besamel klasik) ────────────────────
  {
    type: "rewrite",
    slug: "tavuklu-sultan-kebabi",
    reason:
      "REWRITE jenerik scaffold + besamel klasik bilesen. Klasik Osmanli saray (sebze sote + besamel + yufka rulo + firin). Escoffier 1903 besamel klasik (tereyagi + un + sut + tuz + beyaz biber + muskat). DB tereyagi listede ZATEN VAR; eksik tuz + karabiber + muskat + zeytinyagi (sebze sote yagi). Title KORUNUR. 4 ingredient_add (zeytinyagi + tuz + karabiber + muskat), 6 step replace klasik akış (sebze sote + besamel hazirla + yufka rulo + 190°C 25 dk firin).",
    sources: [
      "https://yemek.com/tarif/sultan-kebabi/",
      "https://www.kevserinmutfagi.com/sultan-kebabi-tarifi.html",
    ],
    description:
      "Tavuk, mantar, havuç ve bezelye harcının yufkaya sarılıp muskatlı beşamel ve kaşarla fırınlandığı klasik davet yemeği; Osmanlı saray sofrasının ev versiyonu.",
    ingredientsAdd: [
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Muskat (rendelenmiş)", amount: "1", unit: "tutam" },
    ],
    tipNote:
      "Beşamel sosu sürekli çırparak orta ateşte koyulaştırın; harcı yufkaya koymadan önce ılıtın, sıcak harç yufkayı yırtar.",
    servingSuggestion:
      "Domatesli pilavla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü küçük küpler halinde doğrayıp zeytinyağında 5 dakika kavurun.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Mantar, havuç ve bezelyeyi ekleyip tuz, karabiberle 8-10 dakika sote edin; harcı ılıtmaya bırakın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Tereyağını eritip unu 2 dakika kavurun; sütü azar azar ekleyip sürekli çırparak koyulaşana kadar pişirin, muskat ve tuzla tatlandırın.", timerSeconds: 360 },
      { stepNumber: 4, instruction: "Yufkaları kaselere yağlayarak yerleştirin; ılınmış harcı paylaştırıp yufkanın kenarlarını üzerine kapatın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üzerine beşamel sosu gezdirip rendelenmiş kaşarla kaplayın; 190°C ön ısıtılmış fırında üstü kızarana kadar 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 6, instruction: "Fırından çıkarıp 5 dakika dinlendirin; kâseyi ters çevirerek tabağa alın.", timerSeconds: 300 },
    ],
  },

  // ─── 4: taze-fasulyeli-bulgur-pilavi (salça/sarımsak eksik) ──────
  {
    type: "rewrite",
    slug: "taze-fasulyeli-bulgur-pilavi",
    reason:
      "REWRITE jenerik scaffold + klasik bilesen. Klasik Turk pilavi formul (Refika + Nevin Halıcı): bulgur + sogan + salça + sarimsak + tereyagi/yag + tuz + karabiber + opsiyonel nane. DB zeytinyagi+tuz+su+sogan zaten VAR; eksik salça + sarimsak + karabiber + opsiyonel nane. Title KORUNUR. 4 ingredient_add, 1 amount change (su 3→2.5 sb klasik 1:1.7 oran, fasulye su salacagi icin), 6 step replace.",
    sources: [
      "https://yemek.com/tarif/taze-fasulyeli-bulgur-pilavi/",
      "https://www.refikaninmutfagi.com/sebzeli-bulgur-pilavi-1234",
    ],
    description:
      "Taze fasulye ve bulgurun salçalı domates sosuyla aynı tencerede piştiği yaz akşamlarına yakışan hafif ama doyurucu Anadolu pilavı.",
    ingredientsAmountChange: [
      { name: "Sıcak su", newAmount: "2.5", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru nane (opsiyonel)", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Bulguru salçayla 1-2 dakika kavurun; tane tane açılır. Pişme sonrası tencereyi temiz mutfak beziyle örtüp 10 dakika dinlendirin, fasulyeyi çok kalın bırakmayın.",
    servingSuggestion:
      "Yanına yoğurt ve kuru nane serpilmiş cacık ekleyerek servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Taze fasulyeleri uçlarından kırarak ayıklayın, 2 cm boyunda doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Soğanı ince doğrayıp zeytinyağında 4 dakika kavurun; ezilmiş sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 3, instruction: "Doğranmış fasulyeyi ekleyip 5 dakika sote edin; rendelenmiş domates ve salçayı katıp 3 dakika kavurun.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Bulguru ekleyip 1-2 dakika çevirerek kavurun; tuz ve karabiberle tatlandırın.", timerSeconds: 90 },
      { stepNumber: 5, instruction: "2.5 su bardağı sıcak suyu ekleyip kaynayınca kapağı kapatın; kısık ateşte suyu çekene kadar 15 dakika pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alıp opsiyonel kuru naneyi serpin; mutfak beziyle örtüp 10 dakika dinlendirin, kabararak servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 5: tepsi-orugu-adiyaman (yöre KORUNUR + içli köfte klasik) ──
  {
    type: "rewrite",
    slug: "tepsi-orugu-adiyaman-usulu",
    reason:
      "REWRITE jenerik scaffold + içli köfte klasik bilesen. Adıyaman tepsi oruk = içli köfte tepside (kibe akrabası, TÜBİTAK Türkiye Gastronomi Atlası + Adıyaman Belediyesi resmi). Klasik dış harç ince bulgur + irmik + isot + zeytinyagi; iç harç kıyma + sogan + ceviz + salça + isot + kimyon + karabiber + maydanoz. Title 'Adıyaman Tepsi Oruk' KORUNUR (yöresel klasik). 7 ingredient_add (irmik dış + tuz + isot iç + kimyon iç + karabiber iç + maydanoz iç + zeytinyagi dış), 6 step replace klasik akış.",
    sources: [
      "https://yemek.com/tarif/tepsi-orugu/",
      "https://www.adiyaman.gov.tr/yoresel-yemekler",
    ],
    description:
      "Adıyaman tepsi oruk, ince bulgur ve irmikle yoğrulan dış harcı, isotlu cevizli kıymalı içiyle tepsiye yayan, içli köftenin Adıyaman ve Şanlıurfa hattındaki fırın akrabasıdır.",
    ingredientsAdd: [
      { name: "İrmik", amount: "0.5", unit: "su bardağı" },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "İsot", amount: "1", unit: "yemek kaşığı" },
      { name: "Kimyon", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze maydanoz", amount: "0.5", unit: "demet" },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Dış harcın altını ıslak elle bastırırken kenarlardan az az su gezdirmek tepsi oruğun dilimlenirken çatlamasını azaltır.",
    servingSuggestion:
      "Yanına sumaklı soğan ve ayranla sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "İnce bulgur ve irmiği ılık suyla 15 dakika ıslatıp şişirin.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Soğanı ince kıyıp tavada zeytinyağıyla pembeleşene kadar çevirin; kıymayı ekleyip suyu çekene kadar 8 dakika kavurun.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Salça, isot, kimyon, karabiber ve cevizi katıp 2 dakika daha çevirin; ocaktan alıp maydanozu ekleyin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Şişen bulgur ve irmiği tuz, isot ve kalan zeytinyağıyla 6 dakika yoğurup yumuşak hamur kıvamına getirin.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Yağlanmış tepsiye dış harcın yarısını ıslak elle bastırarak yayın; iç harcı üstüne paylaştırıp kalan dış harçla kapatın ve baklava dilimi şeklinde kesin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Üzerine zeytinyağı sürüp 190°C fırında 30 dakika pişirin; üst yüz pembeleşince çıkarıp ılık dinlendirin.", timerSeconds: 1800 },
    ],
  },

  // ─── 6: tay-feslegenli-patlican (Tay klasik denge) ────────────────
  {
    type: "rewrite",
    slug: "tay-feslegenli-patlican",
    reason:
      "REWRITE jenerik scaffold + Tay klasik denge. Klasik Pad Makheua Yao Bai Krapao: patlıcan + Tay biberi + sarimsak + soya + balık sosu + palmiye seker + Holy Basil (Pim Techamuanvivit + David Thompson + Bangkok Post). Sarimsak ve seker tatli-tuzlu denge icin zorunlu. cuisine 'th' KORUNUR. Title KORUNUR. 4 ingredient_add (sarimsak + esmer seker + tuz + bitki yagi), 1 amount change (susam yagi 1yk→1tk klasik finish az), 5 step replace klasik wok akış.",
    sources: [
      "https://en.wikipedia.org/wiki/Phat_kaphrao",
      "https://www.bangkokpost.com/life/food",
    ],
    description:
      "Bangkok sokak woklarının imzası; iri patlıcan parçaları sarımsak, biber ve Tay fesleğeniyle yüksek ateşte buluşunca dışı parlak içi kremsi kalır, tatlı-tuzlu denge soya ve şekerle kurulur.",
    ingredientsAmountChange: [
      { name: "Susam yağı", newAmount: "1", newUnit: "tatlı kaşığı" },
    ],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "4", unit: "diş" },
      { name: "Esmer şeker", amount: "1", unit: "tatlı kaşığı" },
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Bitki yağı (ayçiçek/kanola)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Patlıcanı iri doğrayıp wok yüksek ateşte tutmak; dışı kızarırken içinin kremsi kalmasını ve sosa yapışmamasını sağlar.",
    servingSuggestion:
      "Buharda jasmin pirinç ve dilimlenmiş Tay biberiyle ana yemek olarak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patlıcanları iri parmak doğrayıp 5 dakika tuzlu suda bekletin; süzüp kurulayın.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Sarımsak ve acı biberi havanda kabaca ezin; kızgın wokta bitki yağında 30 saniye çevirin.", timerSeconds: 30 },
      { stepNumber: 3, instruction: "Patlıcanı yüksek ateşte kapağı kapalı 6 dakika, ardından kapağı açıp 2 dakika çevirerek pişirin.", timerSeconds: 480 },
      { stepNumber: 4, instruction: "Soya sosu, esmer şeker ve tuzu ekleyip 1 dakika harmanlayın; patlıcan sosu emsin.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Ocaktan alın, susam yağını gezdirin ve Tay fesleğenini son anda katarak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: ingiliz-tavuklu-mantarli-pie (roux + thyme) ──────────────
  {
    type: "rewrite",
    slug: "tavuklu-mantarli-pie-tava-ingiltere-usulu",
    reason:
      "REWRITE jenerik scaffold + İngiliz pie klasik bilesen. Klasik Chicken & Mushroom Pie: tavuk + mantar + sogan + sarimsak + tereyagi + un (roux base) + tavuk suyu + krema + thyme/kekik + tuz + karabiber + milföy üst kapak (Delia Smith + Mary Berry + BBC Good Food). DB un + tavuk suyu + yumurta ZATEN VAR. Eksik tereyagi + sarimsak + tuz + karabiber + kuru kekik thyme. cuisine 'gb' KORUNUR. Title KORUNUR. 5 ingredient_add, 1 amount change (total 36→47 dk roux+firin gerceklik), 6 step replace.",
    sources: [
      "https://www.bbcgoodfood.com/recipes/chicken-mushroom-pie",
      "https://www.deliaonline.com/recipes/main-ingredient/poultry-and-game/chicken/chicken-and-mushroom-pie",
    ],
    description:
      "İngiliz pub klasiği chicken and mushroom pie; tavuk ve mantar tereyağlı roux ve kekikli kremalı sosla buluşur, üstü milföyle kapatılıp fırında altın rengi alana dek pişirilir.",
    prepMinutes: 22,
    cookMinutes: 25,
    totalMinutes: 47,
    ingredientsAdd: [
      { name: "Tereyağı", amount: "40", unit: "gr" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Tuz", amount: "1", unit: "çay kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Kuru kekik (thyme)", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Roux'a tavuk suyunu azar azar eklemek ve kremayı en sonda katmak; sosun topaklanmasını önler ve milföy altını ıslatmaz.",
    servingSuggestion:
      "Yanına yeşil bezelye püresi ve patates püresi ile sıcak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk göğsünü 2 cm küp doğrayıp tuz ve karabiberle terbiyeleyin; mantarları dörde bölün, soğanı ince doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tereyağının yarısını tavada eritip tavuğu yüksek ateşte 5 dakika mühürleyin; kenara alın.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Aynı tavada kalan tereyağıyla soğan ve sarımsağı 4 dakika pembeleştirin; mantarı ekleyip suyunu çekene kadar 4 dakika kavurun, unu serpip 1 dakika daha kavurun.", timerSeconds: 540 },
      { stepNumber: 4, instruction: "Tavuk suyunu yavaşça ekleyip topaksız sos elde edin; kremayı ve kuru kekiği katıp 3 dakika kıvam alana dek kaynatın, tavukları geri ekleyin.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Harcı ısıya dayanıklı tavada düzleyin; milföyü üzerine kapatıp kenarları bastırın, ortasına buhar deliği açın ve yumurta sarısını sürün.", timerSeconds: null },
      { stepNumber: 6, instruction: "Pie'ı 200°C ön ısıtılmış fırında 25 dakika, milföy altın rengi alana ve sos kenarlardan fokurdayana dek pişirin; 5 dakika dinlendirip servis edin.", timerSeconds: 1500 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-25");
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
              paket: "oturum-30-mini-rev-batch-25",
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
