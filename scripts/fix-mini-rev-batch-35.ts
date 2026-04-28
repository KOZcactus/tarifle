/**
 * Tek-seferlik manuel mini-rev batch 35 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-34 ile
 * aynı audit, paketi 34 sonrası 9 kalan kuyruğun yeni top 1-7).
 * Klasik kanonik kanitli tarifler; jenerik step boilerplate temizle +
 * eksik klasik baharat/aromatik tamamla.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. yagli-kete-tostu-kayseri-usulu (Kayseri): yağlı kete + tulum
 *      peyniri + domates + tereyağı + kekik VAR. DB'de karabiber +
 *      maydanoz garnitür + zeytinyağı EKSİK. Step 1+2+6 BOILERPLATE
 *      LEAK FIX. 3 ingredient_add, 6 step replace.
 *
 *   2. demirhindi-zencefilli-soguk-icecek-sanliurfa-usulu (Şanlıurfa
 *      içecek): demirhindi özü + su + zencefil + buz VAR. DB'de limon
 *      suyu (denge essential!) + toz şeker (tatlı denge) EKSİK. Step
 *      1+2 jenerik scaffold ('servis öncesi hazırlayın' + 'sıvılarını
 *      ve aromatiklerini dengeli karıştırın'). 3 step. 2 ingredient_add,
 *      3 step replace.
 *
 *   3. yag-somunu-durum-konya-usulu (Konya): yağ somunu + kaşar +
 *      domates + tereyağı VAR. DB'de kekik + karabiber + maydanoz
 *      EKSİK. Step 1+2+6 BOILERPLATE LEAK FIX. 3 ingredient_add, 6
 *      step replace.
 *
 *   4. tereyagli-domatesli-bulgur-kayseri-usulu (Kayseri): bulgur +
 *      domates rendesi + tereyağı + su + tuz VAR. DB'de soğan +
 *      karabiber + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold.
 *      3 ingredient_add, 7 step replace.
 *
 *   5. tereyagli-yesil-mercimekli-ic-pilav-osmaniye-usulu (Osmaniye):
 *      pirinç + mercimek + tereyağı + su + tuz VAR. DB'de soğan (iç
 *      pilav essential!) + kuş üzümü (iç pilav klasik!) + tarçın +
 *      karabiber EKSİK. 7 step. Step 6+7 jenerik. 4 ingredient_add,
 *      7 step replace.
 *
 *   6. tereyagli-karalahana-tava-bartin-usulu (Bartın): kara lahana +
 *      mısır unu + tereyağı + su + tuz VAR. DB'de soğan + karabiber
 *      + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold. 3
 *      ingredient_add, 7 step replace.
 *
 *   7. demirhindi-naneli-soguk-icecek-sanliurfa-usulu (Şanlıurfa
 *      içecek): demirhindi özü + su + nane + buz VAR. DB'de limon
 *      suyu + toz şeker EKSİK. 3 step. Step 1+2 jenerik scaffold.
 *      2 ingredient_add, 3 step replace.
 *
 * Toplam: 20 ingredient_add + 39 step replace + 6 BOILERPLATE LEAK
 * FIX (paketi 35 #1, #3 her biri 3 BOILERPLATE).
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
  // ─── 1: yagli-kete-tostu-kayseri-usulu (Kayseri) ──────────────────
  {
    type: "rewrite",
    slug: "yagli-kete-tostu-kayseri-usulu",
    reason:
      "REWRITE jenerik scaffold + Kayseri yağlı kete tostu tamamlama. Klasik formul: yağlı kete + tulum peyniri + domates + tereyağı + kekik VAR. DB'de karabiber + maydanoz garnitür + zeytinyağı EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' + step 2 BOILERPLATE LEAK 'tava 2 dk' + step 6 BOILERPLATE LEAK 'soğursa gevrek kenar' (tost hızlı pişer!). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kayseri/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/kayseri-yagli-ketesi",
    ],
    description:
      "Kayseri sofralarının yağlı kete tostu; kat kat ev keteleri ortadan açılıp tulum peyniri, dilim domates ve kekikle doldurulur, tereyağı ve zeytinyağı kombinasyonuyla tavada altın renge gelene kadar ısıtılır.",
    ingredientsAdd: [
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
      { name: "Zeytinyağı", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tulum peyniri yumuşaması için tostu kapağı kapalı pişirin; aksi halde dış yüz kızarır, peynir hâlâ sert kalır. Yağlı keteyi çok bastırmayın; kat yapısını korumak istersek hafif elle yatırılır.",
    servingSuggestion:
      "Sıcak tostları ortadan dilimleyip tabağa alın; üstüne ince doğranmış maydanoz serpin, yanında demli çay, zeytin ve dilim domatesle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yağlı keteleri ortadan ikiye açın; tulum peynirini ezin, domatesi ince halkalar halinde dilimleyin, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Ezilmiş tulum peyniri, kekik ve karabiberi karıştırarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Açılan ketelerin alt yarısına peynir karışımını eşit yayın; üstüne dilim domates yerleştirip üst yarıyı kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavada tereyağı ve zeytinyağını birlikte orta-kısık ateşte ısıtıp tostları kapağı kapalı 3 dakika ilk yüzü kızartın.", timerSeconds: 180 },
      { stepNumber: 5, instruction: "Tostları çevirip diğer yüzünü 3 dakika daha pişirin; tulum peynirinin yumuşadığını kontrol edin.", timerSeconds: 180 },
      { stepNumber: 6, instruction: "Tabağa alıp ortadan dilimleyin; üzerine maydanoz serpip sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: demirhindi-zencefilli-soguk-icecek-sanliurfa-usulu ────────
  {
    type: "rewrite",
    slug: "demirhindi-zencefilli-soguk-icecek-sanliurfa-usulu",
    reason:
      "REWRITE jenerik scaffold + Şanlıurfa demirhindi içecek tamamlama. Klasik formul: demirhindi özü + su + zencefil + buz VAR. DB'de limon suyu (denge essential!) + toz şeker (tatlı denge) EKSİK. 3 step. Step 1+2 jenerik scaffold ('servis öncesi tüm malzemeyi hazırlayın' + 'sıvılarını ve aromatiklerini dengeli biçimde karıştırın'). Title KORUNUR. cuisine 'tr' KORUNUR. 2 ingredient_add, 3 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/sanliurfa/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/icecek-tarifleri/demirhindi-serbeti",
    ],
    description:
      "Şanlıurfa sofralarının yaz içeceği demirhindi zencefilli serbet; demirhindi özünün soğuk suda toz şeker ve zencefille çözülüp limon suyuyla dengelendiği, üzerine bol buz dökülen ferah ve hafif keskin bir içecektir.",
    ingredientsAdd: [
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Toz şeker", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Demirhindi özünü soğuk değil, ılık suda çözün; aksi halde topak kalır. Toz şekeri buz katmadan ekleyin; soğuk suda erimesi zaman alır.",
    servingSuggestion:
      "Buz dolu uzun bardaklara döküp üstüne ince zencefil rendesi ve birkaç dilim limonla servis edin; istenirse taze nane yaprağıyla taçlandırın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş sürahide demirhindi özünü 1 su bardağı ılık suyla pürüzsüzleşene kadar ezerek çözün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Toz şeker, rendelenmiş zencefil ve limon suyunu ekleyip karıştırın; üzerine kalan 3 su bardağı soğuk suyu ilave edip 3 dakika dinlendirin.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Servis bardaklarına buz koyup hazırlanan içeceği döküp soğuk servis edin; üstüne ince zencefil rendesi serpin.", timerSeconds: null },
    ],
  },

  // ─── 3: yag-somunu-durum-konya-usulu (Konya) ──────────────────────
  {
    type: "rewrite",
    slug: "yag-somunu-durum-konya-usulu",
    reason:
      "REWRITE jenerik scaffold + Konya yağ somunu dürüm tamamlama. Klasik formul: yağ somunu + kaşar + domates + tereyağı VAR. DB'de kekik + karabiber + maydanoz EKSİK. Step 1 BOILERPLATE LEAK 'malzemeleri ölçüp ayrı kaplara' + step 2 BOILERPLATE LEAK 'tava 2 dk' + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (dürüm/somun kenarı yok!). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/konya/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/yag-somunu",
    ],
    description:
      "Konya usulü yağ somunu dürüm; yumuşak somun ekmeğinin ortadan açılıp eritilmiş kaşar peyniri, dilim domates ve kekikle doldurulup tavada hafifçe ısıtılarak hazırlanan, sıcak ve doyurucu bir kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.25", unit: "demet" },
    ],
    tipNote:
      "Yağ somunu çok ısıtıp kabuğunu sertleştirmemek için tavayı kısık ateşte tutun; içerideki kaşar peyniri yumuşadığında dürüm hazırdır. Kaşarı küçük küpler halinde doğrayıp serpin; eşit erimesi için ideal.",
    servingSuggestion:
      "Dürümleri ortadan dilimleyip tabağa alın; üzerine maydanoz serpin, yanına çay ve dilim turşuyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Yağ somunlarını ortadan açın; iç yüzleri yırtılmasın diye bıçağı bastırmadan dilimleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Kaşar peynirini küçük küp doğrayın, domatesi ince dilimleyin, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Her somun ekmeğin alt yarısına kaşar peynirini, üstüne dilim domates yerleştirin; karabiber ve kekiği serpin, üst yarıyı kapatın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada tereyağını orta-kısık ateşte eritip dürümleri yatırın; kapağı kapalı 4 dakika ilk yüzü altın renge gelene kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Dürümleri çevirip diğer yüzünü 4 dakika daha pişirin; kaşar peynirinin yumuşadığını kontrol edin.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Tabağa alıp üzerine maydanoz serpin; ortadan dilimleyerek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: tereyagli-domatesli-bulgur-kayseri-usulu (Kayseri) ────────
  {
    type: "rewrite",
    slug: "tereyagli-domatesli-bulgur-kayseri-usulu",
    reason:
      "REWRITE jenerik scaffold + Kayseri tereyağlı domatesli bulgur tamamlama. Klasik formul: bulgur + domates rendesi + tereyağı + su + tuz VAR. DB'de soğan + karabiber + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kayseri/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-tarifleri/domatesli-bulgur-pilavi",
    ],
    description:
      "Kayseri usulü tereyağlı domatesli bulgur pilavı; rendelenmiş domatesin tereyağında soğan ve pul biberle kavrulup pilavlık bulgura çekildiği, parlak renkli ve tane tane bir İç Anadolu klasiğidir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Domates rendesini kavurma süresini atlamayın; çiğ tat kalmaması için suyu çekene kadar 3-4 dakika çevirin. Bulguru yıkamayın; nişasta tabağı bağlar.",
    servingSuggestion:
      "Servis tabağına paylaştırıp yanına soğuk yoğurt, cacık veya soğan piyazıyla servis edin; üstüne istenirse ekstra pul biber serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın; bulguru ayıklayıp süzgeçten geçirin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tencerede tereyağını orta ateşte eritip soğanı 4 dakika pembeleştirin; bulguru ekleyip 2 dakika çevirin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Domates rendesini ekleyip suyunun keskin kokusu gidene kadar 3 dakika kavurun.", timerSeconds: 180 },
      { stepNumber: 4, instruction: "Tuz, karabiber ve pul biberi ekleyin; sıcak suyu döküp bir kez karıştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapakla kısık ateşte 15 dakika bulgur suyunu çekene kadar pişirin.", timerSeconds: 900 },
      { stepNumber: 6, instruction: "Ocaktan alıp kapağı bezle kapatarak 5 dakika demlendirin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Pilavı taneler ezilmeden hafifçe karıştırıp servis tabağına alın; sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 5: tereyagli-yesil-mercimekli-ic-pilav-osmaniye-usulu ────────
  {
    type: "rewrite",
    slug: "tereyagli-yesil-mercimekli-ic-pilav-osmaniye-usulu",
    reason:
      "REWRITE jenerik scaffold + Osmaniye yeşil mercimekli iç pilav klasik tamamlama. Klasik iç pilav: pirinç + mercimek + tereyağı + soğan + kuş üzümü + iç badem opsiyonel + tarçın + karabiber. DB'de soğan (iç pilav essential!) + kuş üzümü (iç pilav klasik!) + tarçın + karabiber EKSİK. 7 step. Step 6+7 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/osmaniye/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/pilav-tarifleri/ic-pilav",
    ],
    description:
      "Osmaniye usulü tereyağlı yeşil mercimekli iç pilav; pirincin tereyağında karamelize soğan, kuş üzümü ve tarçınla buluşturulup haşlanmış yeşil mercimekle tamamlandığı, hem ana yemek hem dolma harcı olarak iş gören klasik bir iç pilavdır.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Kuş üzümü", amount: "2", unit: "yemek kaşığı" },
      { name: "Tarçın", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Kuş üzümünü ılık suda 10 dakika bekletin; pilavda eşit dağılır ve tatlı denge sağlar. Pirinci 30 dakika ılık tuzlu suda bekletin; nişasta gider, taneler ayrı durur.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üzerine kavrulmuş çam fıstığı serpin; yanına ev yoğurdu veya yeşil salatayla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın; pirinci yıkayıp süzün, kuş üzümünü 10 dakika ılık suda bekletin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tencerede tereyağını orta ateşte eritip soğanı 5 dakika pembeleştirin; süzülmüş pirinci ekleyip 2 dakika çevirin.", timerSeconds: 420 },
      { stepNumber: 3, instruction: "Kuş üzümü, tarçın, tuz ve karabiberi tencereye katıp 30 saniye kavurun.", timerSeconds: 30 },
      { stepNumber: 4, instruction: "Haşlanmış yeşil mercimeği ve sıcak suyu ekleyip bir kez karıştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapakla kısık ateşte 14 dakika pirinç suyunu çekene kadar pişirin.", timerSeconds: 840 },
      { stepNumber: 6, instruction: "Ocaktan alıp kapağı bezle kapatarak 5 dakika demlendirin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Mercimekler ezilmeden hafifçe karıştırıp servis tabağına alın; sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: tereyagli-karalahana-tava-bartin-usulu (Bartın) ───────────
  {
    type: "rewrite",
    slug: "tereyagli-karalahana-tava-bartin-usulu",
    reason:
      "REWRITE jenerik scaffold + Bartın tereyağlı karalahana tava tamamlama. Klasik Karadeniz mısır unlu kaygana: kara lahana + mısır unu + tereyağı + su + tuz VAR. DB'de soğan + karabiber + pul biber EKSİK. 7 step. Step 6+7 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/bartin/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/karalahana-tava",
    ],
    description:
      "Bartın usulü tereyağlı karalahana tava; ince doğranmış karalahananın tereyağında soğan ve pul biberle soldurulup mısır unuyla bağlanan, üst tarafı altın kabuk tutturarak servis edilen Batı Karadeniz tabağıdır.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Karalahanayı haşladıktan sonra iyi süzdürün; aksi halde mısır unu yapışmaz. Mısır ununu suyla pürüzsüzleştirip ekleyin; topaklanmaz.",
    servingSuggestion:
      "Tabağa alıp üzerine pul biberle yağlanmış tereyağı gezdirin; yanına soğuk yoğurt veya cacıkla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Karalahanayı ince doğrayıp tuzlu kaynar suda 4 dakika haşlayın; soğuk sudan geçirip iyi süzdürün.", timerSeconds: 240 },
      { stepNumber: 2, instruction: "Soğanı yemeklik doğrayıp tavada tereyağının yarısında 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Süzülmüş karalahanayı tavaya alıp 2 dakika çevirin; karabiber ve pul biberi serpin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Mısır ununu 1 su bardağı suyla topaksız çırpıp tavaya katın; tuzu ekleyip iyice karıştırın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Karışımı tavaya yayıp kalan tereyağını üzerine gezdirin; kısık ateşte 8 dakika altı tutmadan spatulayla toparlayarak pişirin.", timerSeconds: 480 },
      { stepNumber: 6, instruction: "Tavayı ocaktan alıp 5 dakika dinlendirin; kıvamı oturmasını bekleyin.", timerSeconds: 300 },
      { stepNumber: 7, instruction: "Servis tabağına alıp ekstra pul biber serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: demirhindi-naneli-soguk-icecek-sanliurfa-usulu ────────────
  {
    type: "rewrite",
    slug: "demirhindi-naneli-soguk-icecek-sanliurfa-usulu",
    reason:
      "REWRITE jenerik scaffold + Şanlıurfa demirhindi naneli içecek tamamlama. Klasik formul: demirhindi özü + su + nane + buz VAR. DB'de limon suyu (denge essential!) + toz şeker (tatlı denge) EKSİK. 3 step. Step 1+2 jenerik scaffold ('servis öncesi tüm malzemeyi hazırlayın' + 'sıvılarını ve aromatiklerini dengeli karıştırın'). Title KORUNUR. cuisine 'tr' KORUNUR. 2 ingredient_add, 3 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/sanliurfa/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/icecek-tarifleri/demirhindi-serbeti",
    ],
    description:
      "Şanlıurfa sofralarının yaz içeceği demirhindi naneli serbet; demirhindi özünün soğuk suda toz şeker ve taze naneyle buluşturulup limon suyuyla dengelendiği, üzerine bol buz dökülen ferah ve ekşimsi bir içecektir.",
    ingredientsAdd: [
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı" },
      { name: "Toz şeker", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Naneyi servis bardağında ezin; aromasının yağı dağılır ve içeceğe geçer. Demirhindi özünü soğuk değil, ılık suda çözün; topaklanma engellenir.",
    servingSuggestion:
      "Servis bardaklarına bol buz koyup üzerine içeceği döküp birkaç taze nane yaprağıyla taçlandırın; istenirse limon dilimi koyun.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Geniş sürahide demirhindi özünü 1 su bardağı ılık suyla pürüzsüzleşene kadar ezerek çözün.", timerSeconds: null },
      { stepNumber: 2, instruction: "Toz şeker, ince doğranmış nane ve limon suyunu ekleyin; üzerine kalan 2.5 su bardağı soğuk suyu ilave edip 3 dakika dinlendirin.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Servis bardaklarına buz koyup hazırlanan içeceği döküp soğuk servis edin; üstüne taze nane yaprakları serpin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-35");
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
              paket: "oturum-31-mini-rev-batch-35",
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
