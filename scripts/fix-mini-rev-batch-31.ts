/**
 * Tek-seferlik manuel mini-rev batch 31 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-30 ile
 * aynı audit, paketi 30 sonrası 37 kalan kuyruğun yeni top 1-7).
 * Klasik kanonik kanitli tarifler; jenerik step 1/2/6/7 boilerplate
 * temizle + eksik klasik baharat/aromatik tamamla + 1 jenerik
 * 'Baharatlar' malzeme remove.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tandir-ekmeginde-kavurmali-yumurta-van-usulu (Van klasik
 *      kavurmalı sahan): kavurma + yumurta + tereyağı + tandır ekmeği.
 *      DB'de tuz + karabiber + taze soğan + pul biber (Van imzası)
 *      EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın'
 *      (yumurtalı sahan'da kuru/yaş yok!) + step 2 jenerik. 4
 *      ingredient_add, 6 step replace.
 *
 *   2. zahterli-katmer-durum-hatay-usulu (Hatay zahter klasik): un +
 *      zahter (yöre bahar karışımı) + zeytinyağı + beyaz peynir + su.
 *      DB'de tuz + susam (zahter destek) + ezilmiş ceviz (Hatay imzası)
 *      EKSİK. Step 1 BOILERPLATE LEAK + step 6 BOILERPLATE LEAK
 *      'soğursa gevrek kenarlar yumuşar' (katmer/durum kenarı yok!).
 *      3 ingredient_add, 6 step replace.
 *
 *   3. teriyaki-tavuk (Japon klasik): tavuk + soya + mirin + sake +
 *      bal + zencefil + sarımsak + susam VAR. DB'de tuz + karabiber +
 *      sıvı yağ (kızartma) + taze soğan garnitür EKSİK. Step 6+7
 *      jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'servis öncesi
 *      dinlendirin tabakta su salıp'). 7 step. 4 ingredient_add, 7
 *      step replace.
 *
 *   4. yumurtali-ispanak-tava (klasik ıspanak yumurtalı sahan): ıspanak
 *      + yumurta + sarımsak + zeytinyağı VAR. DB'de tuz + karabiber +
 *      soğan + pul biber EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş
 *      malzemeleri ayırın' (sahan'da kuru/yaş yok!) + step 2 jenerik
 *      + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar'
 *      (sahan'da kenar yok!). 4 ingredient_add, 6 step replace.
 *
 *   5. tereyagli-mantar-eriste-erzurum-usulu (Erzurum klasik tereyağlı
 *      erişte): erişte + kültür mantarı + tereyağı + karabiber + tuz
 *      VAR. DB'de sarımsak + maydanoz garnitür + soğan EKSİK. Step
 *      6+7 jenerik scaffold. 7 step. 3 ingredient_add, 7 step replace.
 *
 *   6. visneli-syrniki-rus-usulu (Rus klasik syrniki): tvorog (lor) +
 *      yumurta + un + sıvı yağ kızartma VAR. DB'de toz şeker (Rus
 *      syrniki essential, olmadan tatsız!) + tuz tutamı + vanilya
 *      EKSİK. Step 1 BOILERPLATE LEAK + step 6 BOILERPLATE LEAK
 *      'soğursa gevrek kenarlar yumuşar' (syrniki dış kabuk değil
 *      yumuşak peynirli disk). 3 ingredient_add, 6 step replace.
 *
 *   7. tavuk-sote (klasik): tavuk + soğan + biber + domates + patates
 *      + sıvı yağ + tuz VAR. DB'de jenerik 'Baharatlar' (1 tatlı kaşığı,
 *      somut değil) listede; bunu REMOVE + sarımsak + domates salçası
 *      + karabiber + pul biber + kekik + maydanoz EKSİK. Step 2+6
 *      jenerik scaffold. 1 ingredient_remove + 6 ingredient_add, 6
 *      step replace.
 *
 * Toplam: 27 ingredient_add + 1 ingredient_remove + 44 step replace
 * + 5 BOILERPLATE LEAK FIX (paketi 31 #1, #2x2, #4x2, #6x2 farklı
 * cümleler birden fazla tarifte) + 1 jenerik 'Baharatlar' temizleme.
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
  // ─── 1: tandir-ekmeginde-kavurmali-yumurta-van-usulu (Van) ────────
  {
    type: "rewrite",
    slug: "tandir-ekmeginde-kavurmali-yumurta-van-usulu",
    reason:
      "REWRITE jenerik scaffold + Van kavurmalı sahan klasik baharat. Klasik Van sahanı: dana kavurma + yumurta + tereyağı + tandır ekmeği + tuz + karabiber + taze soğan + pul biber (Van imzası). DB'de tuz + karabiber + taze soğan + pul biber EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (yumurtalı sahan'da kuru/yaş yok!) + step 2 jenerik. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/van/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/kavurmali-yumurta",
    ],
    description:
      "Van sofralarının kavurmalı yumurta sahanı; dana kavurmasının yağında erimesi, yumurtanın sahanda yarı katı pişmesi ve sıcak tandır ekmeğinin altına yatırılmasıyla kahvaltıya güçlü bir karakter katar.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Kavurmayı kendi yağında ısıtıp tereyağını sonra ekleyin; tereyağı yanmaz, kavurma kremalaşır. Yumurtaları sahana kırdıktan sonra fazla karıştırmayın; sarısı parça parça kalsın.",
    servingSuggestion:
      "Sıcak tandır ekmeği dilimleriyle, yanına ince doğranmış taze soğan ve bir kase ev yoğurduyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sahan veya küçük dökme demir tavayı orta ateşte ısıtın; kavurmayı içine alıp 4 dakika kendi yağında ısıtın.", timerSeconds: 240 },
      { stepNumber: 2, instruction: "Tereyağını ekleyip 30 saniye eritin; pul biberi serpip 10 saniye yağda açın.", timerSeconds: 40 },
      { stepNumber: 3, instruction: "Yumurtaları doğrudan sahana kırın; tuz ve karabiberi üzerine serpin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kapağı kapatıp orta-kısık ateşte 4 dakika beyazlar tutana kadar pişirin; sarısı akışkan kalsın.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Sahanı ocaktan alıp üzerine ince halkalar halinde doğranmış taze soğanı serpin.", timerSeconds: null },
      { stepNumber: 6, instruction: "Sahanın altına ya da yanına sıcak tandır ekmeği koyup hemen servis edin.", timerSeconds: null },
    ],
  },

  // ─── 2: zahterli-katmer-durum-hatay-usulu (Hatay zahter) ──────────
  {
    type: "rewrite",
    slug: "zahterli-katmer-durum-hatay-usulu",
    reason:
      "REWRITE jenerik scaffold + Hatay zahterli katmer durum klasik tamamlama. Klasik Antakya zahterli ekmek/katmer: un + zahter (kekik+sumak+susam yöre karışımı) + zeytinyağı + beyaz peynir + su + tuz + susam + ezilmiş ceviz (Hatay imzası tamamlayıcı). DB'de tuz + susam (zahter destek) + ezilmiş ceviz EKSİK. Step 1 BOILERPLATE LEAK 'malzemeleri ölçüp ayrı kaplara' jenerik + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (katmer dürümünde kenar yok!). Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/hatay/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/hatay-zahterli-ekmek",
    ],
    description:
      "Hatay sofralarının zahterli katmer dürümü; ince açılan hamura zeytinyağı, zahter, beyaz peynir ve ezilmiş cevizden oluşan harç sürülüp katmer yapılarak tavada iki yüzü çıtırlaştırılır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Susam", amount: "1", unit: "yemek kaşığı" },
      { name: "Ezilmiş ceviz", amount: "3", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Zahter karışımını zeytinyağıyla 5 dakika önceden buluşturun; aroma derinleşir. Hamuru yufka inceliğinde açıp katlamadan önce kenarlarını ince zeytinyağıyla yağlayın; pişerken ayrılmaz.",
    servingSuggestion:
      "Sıcak servis edin; yanına demli çay, zeytin tabağı ve domates dilimleri iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Un, tuz ve suyu yoğurma kabında 6 dakika çalışıp pürüzsüz hamur elde edin; üzerini örtüp 15 dakika dinlendirin.", timerSeconds: 1260 },
      { stepNumber: 2, instruction: "Beyaz peyniri çatalla ezip ezilmiş ceviz, zahter ve 1 yemek kaşığı zeytinyağıyla harmanlayarak iç harcı hazırlayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Hamuru 4 bezeye bölüp her birini yufka inceliğinde açın; kalan zeytinyağıyla yüzeyini yağlayın.", timerSeconds: null },
      { stepNumber: 4, instruction: "İç harcı hamurun bir kısmına yayıp katmer formunda dörde katlayın; üst yüzüne susam serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Yapışmaz tavayı orta-kısık ateşte ısıtıp katmerleri 10 dakika iki yüzü altın renge gelene kadar pişirin.", timerSeconds: 600 },
      { stepNumber: 6, instruction: "Tavadan alıp 1 dakika dinlendirin; dürüm formunda sarıp ortadan dilimleyerek sıcak servis edin.", timerSeconds: 60 },
    ],
  },

  // ─── 3: teriyaki-tavuk (Japon klasik) ─────────────────────────────
  {
    type: "rewrite",
    slug: "teriyaki-tavuk",
    reason:
      "REWRITE jenerik scaffold + Japon teriyaki tavuk klasik tamamlama. Klasik teriyaki: tavuk kalça + soya + mirin + sake + bal/şeker + zencefil + sarımsak + susam VAR (8 malzeme dolu). DB'de tuz + karabiber + sıvı yağ (kızartma için) + taze soğan garnitür (Japon imzası negi) EKSİK. Step 6+7 jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). 7 step. Title KORUNUR. cuisine 'jp' KORUNUR. 4 ingredient_add, 7 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Teriyaki",
      "https://www.justonecookbook.com/teriyaki-chicken/",
    ],
    description:
      "Japon ev mutfağının teriyaki tavuğu; tavuk kalçanın derili yüzünden mühürlenip soya, mirin, sake ve balla parlak şuruplaşan teriyaki sosa banılarak servis edildiği klasik tabaktır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Sıvı yağ", amount: "1", unit: "yemek kaşığı" },
      { name: "Taze soğan", amount: "2", unit: "dal" },
    ],
    tipNote:
      "Tavuğu derili yüzünden başlatın; yağı kendi salar, kabuk çıtırlaşır. Sosu kaynamadan ekleyin; aksi takdirde bal yanar ve acımtırak tat verir.",
    servingSuggestion:
      "Buharda pirinç pilavı üzerinde dilimleyerek servis edin; üstüne kavrulmuş susam ve ince halka taze soğan serpin, yanında tatakyuri salatası iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuk kalçaları kâğıt havluyla kurulayıp tuz ve karabiberle iki yüzünü ovun; sosu hazırlamak için soya, mirin, sake ve balı küçük kâsede çırpın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada sıvı yağı ısıtıp tavukları derili yüz aşağı dizip orta-yüksek ateşte 6 dakika kabuk tutturun.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Tavuğu çevirip diğer yüzünü 4 dakika daha pişirin; ezilmiş sarımsak ve rendelenmiş zencefili tavaya ekleyin, 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Sos karışımını tavaya dökün; orta ateşte tavukları 6 dakika çevirerek koyu parlak şurup kıvamını yakalayın.", timerSeconds: 360 },
      { stepNumber: 5, instruction: "Tavukları tahtaya alıp 3 dakika dinlendirin; tavada kalan sosu kıvamı koyulaşana kadar 1 dakika daha kaynatın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Tavukları 1.5 cm dilimleyip servis tabağına alın; üzerine tavadaki teriyaki sosu gezdirip susam ve ince halka taze soğan serpin.", timerSeconds: null },
      { stepNumber: 7, instruction: "Buharda pirinç pilavıyla sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: yumurtali-ispanak-tava (klasik sahan) ─────────────────────
  {
    type: "rewrite",
    slug: "yumurtali-ispanak-tava",
    reason:
      "REWRITE jenerik scaffold + klasik ıspanak yumurtalı sahan tamamlama. Klasik sahan: ıspanak + yumurta + sarımsak + zeytinyağı + soğan + tuz + karabiber + pul biber. DB'de tuz + karabiber + soğan + pul biber EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (yumurta sahanında kuru/yaş yok!) + step 2 jenerik + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (sahan kenarı yok!). Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/yumurtali-ispanak",
      "https://www.bbcgoodfood.com/recipes/spinach-eggs",
    ],
    description:
      "Yumurtalı ıspanak tava; soğan ve sarımsakla soldurulan ıspanağın üstüne yumurta kırılıp kapaklı sahanda yarı katı pişirildiği, akşamdan sabaha taşınabilen pratik bir kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Ispanağı yıkadıktan sonra iyice süzdürün; fazla su sahanda buhar yapıp yumurta dokusunu bozar. Yumurtaları kırdıktan sonra kapağı 4-5 dakika kapalı tutun; sarı akışkan, beyaz tutan dokuya gelir.",
    servingSuggestion:
      "Sahanı doğrudan sofraya alıp sıcak köy ekmeğiyle dürüm yaparak ya da çatalla servis edin; yanına bir bardak demli çay iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin, ıspanağı yıkayıp süzün ve iri doğrayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahan veya küçük tavada zeytinyağını orta ateşte ısıtıp soğanı 4 dakika pembeleştirin.", timerSeconds: 240 },
      { stepNumber: 3, instruction: "Sarımsağı ekleyip 30 saniye çevirin; ıspanağı katın, tuz ve pul biberi serpip 3 dakika sönene kadar soteleyin.", timerSeconds: 210 },
      { stepNumber: 4, instruction: "Ispanağı sahanın çevresine yayıp ortasında çukurlar açın; yumurtaları kırın, üzerlerine karabiberi serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı kapatıp orta-kısık ateşte 5 dakika beyazlar tutana kadar pişirin; sarısı akışkan kalsın.", timerSeconds: 300 },
      { stepNumber: 6, instruction: "Sahanı ocaktan alıp doğrudan sıcak servis edin; yanında ekmek ve çay alın.", timerSeconds: null },
    ],
  },

  // ─── 5: tereyagli-mantar-eriste-erzurum-usulu (Erzurum) ───────────
  {
    type: "rewrite",
    slug: "tereyagli-mantar-eriste-erzurum-usulu",
    reason:
      "REWRITE jenerik scaffold + Erzurum tereyağlı mantar erişte klasik tamamlama. Klasik Erzurum sade tabağı: erişte + kültür mantarı + tereyağı + karabiber + tuz VAR. DB'de sarımsak + maydanoz garnitür + soğan EKSİK. Step 6+7 jenerik scaffold ('son tuz/yağ/ekşi dengesi' + 'tabakta su salıp'). 7 step. Title KORUNUR. cuisine 'tr' KORUNUR. 3 ingredient_add, 7 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/erzurum/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/tereyagli-eriste",
    ],
    description:
      "Erzurum sofralarının tereyağlı mantar eriştesi; ev eriştesini kültür mantarı, tereyağı ve sarımsakla tavada buluşturarak sade ve sıcak bir kış tabağına dönüştürür.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Soğan", amount: "1", unit: "adet" },
    ],
    tipNote:
      "Mantarı tavaya kalabalık atmayın; suyunu salıp kavrulmaz. Kerelerde kavurmak kabuk tutmasını sağlar. Tereyağını mantar tamamen pişip kabuk tuttuktan sonra ekleyin; aksi halde yanar.",
    servingSuggestion:
      "Servis tabağına alıp üstüne ince doğranmış maydanoz serpin; yanına ev yoğurdu veya cacıkla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Erişteyi tuzlu kaynar suda 8 dakika haşlayıp süzün; kenara alın.", timerSeconds: 480 },
      { stepNumber: 2, instruction: "Soğanı yemeklik doğrayın, sarımsağı ezin, mantarı dilimleyin, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağı veya tereyağının yarısını ısıtıp mantarı 5 dakika kabuk tutana kadar kavurun; tabağa alın.", timerSeconds: 300 },
      { stepNumber: 4, instruction: "Aynı tavada kalan tereyağını eritip soğanı 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 5, instruction: "Mantarı tavaya geri alıp tuz ve karabiberi serpin; süzülen erişteyi katıp 1 dakika harmanlayın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Servis tabağına paylaştırıp üstüne maydanoz serpin.", timerSeconds: null },
      { stepNumber: 7, instruction: "Sıcak servis edin; yanına yoğurt veya cacıkla denkleştirin.", timerSeconds: null },
    ],
  },

  // ─── 6: visneli-syrniki-rus-usulu (Rus klasik) ────────────────────
  {
    type: "rewrite",
    slug: "visneli-syrniki-rus-usulu",
    reason:
      "REWRITE jenerik scaffold + Rus syrniki klasik tatlandırma. Klasik Rus syrniki: tvorog (lor) + yumurta + un + sıvı yağ kızartma + toz şeker (essential, olmadan tatsız!) + tuz tutamı + vanilya + ekşi krema/reçel sos. DB'de toz şeker (Rus syrniki essential) + tuz + vanilya EKSİK. Step 1 BOILERPLATE LEAK 'malzemeleri ölçüp ayrı kaplara' jenerik + step 6 BOILERPLATE LEAK 'soğursa gevrek kenarlar yumuşar' (syrniki yumuşak peynirli disk, gevrek değil!). Title KORUNUR. cuisine 'ru' KORUNUR. 3 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Syrniki",
      "https://www.bbcgoodfood.com/recipes/russian-cottage-cheese-pancakes-syrniki",
    ],
    description:
      "Vişneli syrniki, Rus mutfağının klasik kahvaltı tatlısı; lor benzeri tvorogun yumurta, un, toz şeker ve vanilyayla yoğrulup küçük diskler halinde tereyağında kızartılması ve vişne sosuyla servis edilmesidir.",
    ingredientsAdd: [
      { name: "Toz şeker", amount: "2", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "tutam" },
      { name: "Vanilya", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Tvorog veya lor peynirinin nemini iki kat tülbentle 10 dakika süzdürün; aksi halde diskler dağılır. Disk şekillendirirken avucunuzu unlayın; yapışmadan kalır ve daha düzgün form alır.",
    servingSuggestion:
      "Sıcak diskleri tabağa alıp üzerine vişne sosu gezdirin; yanında bir kaşık ekşi krema veya pudra şekeriyle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Lor peynirini iki kat tülbentle 10 dakika süzdürüp fazla suyunu alın; pürüzsüzleştirmek için çatalla ezin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Süzülen lora yumurtayı, toz şekeri, tuzu ve vanilyayı ekleyip karıştırın; un ekleyerek ele yapışmayan yumuşak hamur elde edin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Avucunuzu unlayıp hamuru 8 küçük disk halinde şekillendirin; her birini 1.5 cm kalınlıkta tutun.", timerSeconds: null },
      { stepNumber: 4, instruction: "Geniş tavada sıvı yağı orta-kısık ateşte ısıtıp diskleri 4 dakika ilk yüzü altın renge gelene kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Diskleri çevirip diğer yüzünü 4 dakika daha kızartın; kâğıt havluya alıp fazla yağı süzdürün.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Servis tabağına alıp üzerine vişne sosu gezdirin; sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: tavuk-sote (klasik, jenerik 'Baharatlar' temizleme) ───────
  {
    type: "rewrite",
    slug: "tavuk-sote",
    reason:
      "REWRITE jenerik scaffold + jenerik 'Baharatlar' (1 tatlı kaşığı, somut değil) malzemeyi REMOVE + klasik tavuk sote ek baharat. Klasik: tavuk + soğan + biber + domates + patates VAR. DB'de jenerik 'Baharatlar' var, somut baharat yok; bunu remove + sarımsak + domates salçası + karabiber + pul biber + kekik + maydanoz garnitür EKSİK. Step 2 jenerik scaffold + step 6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 1 ingredient_remove + 6 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/tavuk-tarifleri/tavuk-sote",
      "https://www.bbcgoodfood.com/recipes/chicken-saute",
    ],
    description:
      "Sebzeli tavuk sote; tavuk parçalarını sarımsak, salça ve baharatlarla mühürleyip soğan, biber, domates ve patatesle tek tavada buluşturarak doyurucu, evimsi bir akşam yemeği kuran klasik tabaktır.",
    ingredientsRemove: ["Baharatlar"],
    ingredientsAdd: [
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kekik", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Salçayı yağda 2 dakika kavurmadan suyu eklemeyin; aksi halde çiğ tat kalır. Patatesi sotenin başında değil, soğanla birlikte ekleyip kalın doğrayın; içi pişerken dışı dağılmaz.",
    servingSuggestion:
      "Servis tabağına paylaştırıp üzerine bol kıyılmış maydanoz serpin; yanında pirinç pilavı veya bulgur pilavıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Tavuğu kuşbaşı kesin; soğanı yemeklik, biberleri 2 cm kare, patatesleri 1.5 cm küp doğrayın, sarımsağı ezin, domatesleri rendeleyin.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada sıvı yağı orta-yüksek ateşte ısıtıp tavuğu 6 dakika her yüzünü mühürleyin.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Soğanı ekleyip 4 dakika pembeleştirin, sarımsağı 30 saniye çevirin; salçayı katıp 2 dakika kavurun.", timerSeconds: 390 },
      { stepNumber: 4, instruction: "Patates ve biberleri tavaya alıp 5 dakika çevirin; tuz, karabiber, pul biber ve kekiği ekleyin.", timerSeconds: 300 },
      { stepNumber: 5, instruction: "Rendelenmiş domatesi katıp kapakla kısık ateşte 18 dakika patates yumuşayana kadar pişirin.", timerSeconds: 1080 },
      { stepNumber: 6, instruction: "Servis tabağına paylaştırıp üzerine bol kıyılmış maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-31");
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
              paket: "oturum-31-mini-rev-batch-31",
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
