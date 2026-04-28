/**
 * Tek-seferlik manuel mini-rev batch 16 (oturum 29): 7 KRITIK fix.
 *
 * Web research 2 paralel agent + 25+ kaynak (EFSA / Gida Hatti +
 * Dr. Mehmet Portakal + FIB Haber + Kultur Portali Antalya Piyazi +
 * Antalya CityZone CI + Turkey Travel Planner + Tatilbudur Bingol
 * yemek listesi + Cinili Mutfak Erzurum Ketesi + Kevserin Mutfagi
 * Kars Ketesi + Yemek.com + Gurme Rehberi Rize + Kolay Lezzet
 * Karadeniz fasulye tursusu + Kirazin Mutfagi Rize + Meryem'in
 * Mutfagi karalahana + Kultur Portali Kayseri Nevzine + Yemek.com
 * Kayseri Nevzine + Cumhuriyet Gurme CI 2021 + Polish Your Kitchen
 * powidla + Wikipedia Powidl + Olga Smile Knedle + Polish Feast +
 * KURE Ansiklopedi Ordu Taflan + Otelegidelim Taflan CI +
 * Lezzetler Taflan Kavurmasi + Hurriyet Taflan + Rumma Patates Tava +
 * Onedio Karadeniz Misir Unu).
 *
 * Verdict: 7 REWRITE. 0 cuisine fix (4'ü cuisine korunur, 3'ü zaten
 * Türk yöre). 6 title degisimi (1 cuisine korundu sadece description
 * yumusatma).
 *
 *   1. uzum-hosafi-kayisi-cekirdekli-nevsehir-usulu (GIDA GUVENLIGI
 *      KRITIK + yore yumusatma): Kayisi cekirdegi amigdalin/siyanur
 *      riski (EFSA 2016 yetiskin gunde max 3 kucuk cekirdek; aci ve
 *      tatli ayirt edilemez). TAMAMEN REMOVE. Nevsehir iddiasi
 *      desteklenmiyor (FIB Haber Nevsehir hosafi kuru siyah uzum
 *      eksenli). Title 'Kapadokya Uzum Kayisi Hosafi'. 4 ingredient_
 *      add (kuru kayisi + karanfil + limon kabugu rendesi + tarcin
 *      coklu varyant), 1 ingredient_remove (kayisi cekirdegi). 5 step
 *      replace (jenerik scaffold sil, klasik kuru meyve hosafi akisi).
 *      Cuisine 'tr' KORUNUR.
 *
 *   2. tahinli-nohutlu-piyaz-antalya-usulu (KIBE-MUMBAR disambiguate):
 *      Antalya Iskele Piyazi CI tescil 315 (29.12.2017 mahrec): kuru
 *      fasulye + haslanmis yumurta + tahin tarator (sirke + limon +
 *      sarimsak + tuz). Nohutlu vegan modern uyarlama. Title 'Antalya
 *      Esinli Tahinli Nohut Piyazi (Vegan Uyarlama)'. 4 ingredient_add
 *      (sirke + sarimsak + tuz + zeytinyagi tarator klasik bilesenleri).
 *      5 step replace klasik tarator akisi.
 *
 *   3. sutlu-kete-bingol-usulu (REWRITE Bingol iddia DUSUR + definition
 *      fix): Bingol yoresel envanterinde kete YOK (Tatilbudur 13 yemek
 *      listesi: lol + mastuva + ayran corbasi + tutmac + keledos +
 *      sevzik + gulik + silki tatlisi + yogurtlu sac kavurma; kete
 *      LISTEDE YOK). Kete Dogu Anadolu klasigi (Erzurum + Kars +
 *      Bayburt). Sutlu mayali hamur (Cinili Mutfak + Kevserin Mutfagi).
 *      DB'de YUMURTA + KURU MAYA eksik. Title 'Sutlu Mayali Dogu
 *      Anadolu Ketesi'. 5 ingredient_add (yumurta + kuru maya + tuz +
 *      kavrulmus un ic harc + zeytinyagi/tereyagi sicakta). 1 amount
 *      change (sut 1→1.25 sb mayalandirma icin), 6 step replace.
 *      tipNote/serving 'peynirli doku' boilerplate temizle.
 *
 *   4. tursulu-kavrulmus-lahana-rize-usulu (KIBE-MUMBAR FULL): Rize
 *      tursu kavurmasi RESMI klasigi FASULYE TURSUSU (Gurme Rehberi +
 *      Kolay Lezzet + Kirazin Mutfagi 3 kaynak); beyaz lahana ana
 *      malzeme YANLIS. Title 'Rize Usulu Fasulye Tursusu Kavurmasi'.
 *      1 ingredient_remove (Beyaz lahana ana malzeme), 4 ingredient_
 *      add (tereyagi + sarimsak + kirmizi toz biber + opsiyonel
 *      yumurta varyant), 1 amount change (fasulye tursusu 200→500 gr
 *      ana eksen), 5 step replace + step 6+7 jenerik 'peynirli doku'
 *      boilerplate sil. Cuisine 'tr' KORUNUR.
 *
 *   5. tahin-pekmezli-nevzine-kup-kayseri-usulu (REWRITE disambiguate):
 *      Kayseri Nevzinesi 22 Kasim 2021 Turk Patent CI tescili (Cumhuriyet
 *      Gurme + Kultur Portali + Yemek.com 3 kaynak). Klasik = mayasiz
 *      hamur tepsi + 7cm kareler + ortasina ceviz + 140°C 45 dk +
 *      pekmezli serbet. Kup formati MODERN UYARLAMA. Mevcut DB biskuvi
 *      kirinti baz, klasik degil ama kup uyarlamada kabul edilebilir.
 *      Title 'Kayseri Nevzine Tatlisi (Kup Uyarlama)'. 1 ingredient_
 *      add (tereyagi eritilmis klasik tahin-pekmez sosa zenginlik), 5
 *      step replace + description CI atif.
 *
 *   6. tarcinli-erik-kremasi-polonya-usulu (REWRITE yore yumusat):
 *      Polonya klasik erikli tatlilari powidla (uzun kavurma puresi)
 *      + knedle (eriklı patates kofte) + placek (sutlu kek). Sutlu
 *      'erik kremasi' Polonya kanonu DEGIL (Polish Your Kitchen +
 *      Wikipedia + Olga Smile + Polish Feast). Tarcin + erik + eksi
 *      krema knedle servis klasik. Cuisine 'pl' KORUNUR (esin).
 *      Title 'Tarcinli Erik Kremasi (Polonya Powidla Esinli)'. 1
 *      ingredient_add (eksi krema servis 2 yk), 4 step replace
 *      (powidla pattern: erikleri once kavurarak ezmelesir), description
 *      yumusat.
 *
 *   7. taflan-tursulu-patates-tava-ordu-usulu (REWRITE yore yumusat):
 *      Ordu Taflan Tursusu CI tescilli (KURE Ansiklopedi + Otelegidelim).
 *      Patatesli kombinasyon kanon DEGIL, modern eslik. Karadeniz
 *      patates tava klasigi MISIR UNU + tereyagi (Rumma + Onedio).
 *      Title 'Karadeniz Usulu Misir Unlu Patates Tava (Taflan Tursulu
 *      Eslik)'. 3 ingredient_add (misir unu + tereyagi + iri tuz), 5
 *      step replace klasik patates tava akisi. Cuisine 'tr' KORUNUR.
 *
 * AuditLog action MOD_K_MANUAL_REV. Idempotent.
 *
 * Usage:
 *   npx tsx scripts/fix-mini-rev-batch-16.ts
 *   npx tsx scripts/fix-mini-rev-batch-16.ts --env prod --confirm-prod
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
  // ─── 1: uzum-hosafi-kayisi-cekirdekli-nevsehir (GIDA GUVENLIGI) ──
  {
    type: "rewrite",
    slug: "uzum-hosafi-kayisi-cekirdekli-nevsehir-usulu",
    reason:
      "GIDA GUVENLIGI KRITIK + yore yumusatma. Kayisi cekirdegi amigdalin/siyanur riski (EFSA 2016 yetiskin gunde max 3 kucuk cekirdek; aci ve tatli ayirt edilemez, oran tahmin edilemez). TAMAMEN REMOVE. FIB Haber Nevsehir ramazan hosafi kuru siyah uzum eksenli, kayisi cekirdekli varyant kanitsiz. Title 'Kapadokya Uzum Kayisi Hosafi' (Nevsehir spesifik kalmaz, Ic Anadolu/Kapadokya kategori dogru). 4 ingredient_add (kuru kayisi + karanfil + limon kabugu + tatli kayisi cekirdegi YERINE klasik aroma), 1 ingredient_remove (kayisi cekirdegi). 5 step replace klasik kuru meyve hosafi akisi.",
    sources: [
      "https://www.gidahatti.com/haber/11557619/kayisi-cekirdegi-zehirlenmeye-neden-olabilir",
      "https://www.drmehmetportakal.com/kayisi-cekirdegi-ne-kadar-yenmeli-aci-vs-tatli-cekirdek-farklari/",
      "https://www.fibhaber.com/nevsehirde-ramazan-sofralarinin-bas-taci-hosaf-yuzyillik-lezzet-hosaf-yeniden-bas-taci",
    ],
    newTitle: "Kapadokya Üzüm Kayısı Hoşafı",
    description:
      "Kapadokya'nın kuru üzüm bolluğundan ilham alan klasik Anadolu hoşafı. Kuru üzüm ve kuru kayısı, tarçın çubuğu ve karanfilin ılık aromasında demlenir; limon kabuğu rendesi serinletici bir kapanış verir. Iftar veya yaz akşamlarında soğuk servis edilir.",
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 95,
    ingredientsRemove: ["Kayısı çekirdeği"],
    ingredientsAdd: [
      { name: "Kuru kayısı", amount: "0.5", unit: "su bardağı" },
      { name: "Karanfil", amount: "4", unit: "tane" },
      { name: "Limon kabuğu rendesi", amount: "1", unit: "çay kaşığı" },
      { name: "Toz şeker (opsiyonel)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Kayısı çekirdeği amigdalin içerir, sindirim sırasında siyanüre dönüşebilir; bu tarifte çekirdek kullanılmaz. Hoşaf piştikten sonra ocaktan alıp kapağı kapalı dinlendirin, meyveler suyunu bırakırken aroma da pekişir.",
    servingSuggestion:
      "Buzdolabında 1 saat soğutup ramazan sofrasında veya pilav yanında kâselerle servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kuru üzüm ve kuru kayısıyı ılık suda 10 dakika yıkayıp süzün; kayısıları 1 cm parçalara doğrayın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tencereye 5 su bardağı suyu, kuru üzüm ve kuru kayısıyı alın; orta ateşte kaynama noktasına getirin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Kaynayınca tarçın çubuğu ve karanfili ekleyin, kısık ateşte 20 dakika pişirin; meyveler şişip suyunu bıraksın.", timerSeconds: 1200 },
      { stepNumber: 4, instruction: "Ocağı kapatın, opsiyonel toz şekeri ve limon kabuğu rendesini ilave edin; kapak kapalı 30 dakika dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 5, instruction: "Buzdolabında en az 1 saat soğutup soğuk servis edin; tarçın çubuğu ve karanfilleri tabağa alırken çıkarabilirsiniz.", timerSeconds: 3600 },
    ],
  },

  // ─── 2: tahinli-nohutlu-piyaz-antalya (KIBE-MUMBAR disambiguate) ──
  {
    type: "rewrite",
    slug: "tahinli-nohutlu-piyaz-antalya-usulu",
    reason:
      "KIBE-MUMBAR disambiguate. Antalya Iskele Piyazi CI tescil 315 (29.12.2017 mahrec, Kultur Portali resmi + Antalya CityZone): klasik = kuru fasulye + haslanmis yumurta + tahin tarator (tahin + sirke + limon + sarimsak + kaya tuzu) + domates + sogan + maydanoz + sumak. Nohutlu vegan tarif modern uyarlama (Turkey Travel Planner: yumurtasiz siparis verilebilir, nohutlu varyant kabul ediliyor ama klasik degil). Title 'Antalya Esinli Tahinli Nohut Piyazi (Vegan Uyarlama)'. 4 ingredient_add tarator klasik bilesenleri (sirke + sarimsak + tuz + zeytinyagi). 5 step replace klasik tarator akisi.",
    sources: [
      "https://www.kulturportali.gov.tr/portal/antalyapiyazi",
      "https://antalyacityzone.com/galeri/cografi-isaret-alan-antalya-piyazinin-tarifi/143",
      "https://turkeytravelplanner.com/local-food-in-antalya-tahinili-piyaz/",
    ],
    newTitle: "Antalya Esinli Tahinli Nohut Piyazı (Vegan Uyarlama)",
    description:
      "Antalya İskele Piyazı'nın tahinli tarator sosundan ilham alan vegan uyarlama. Klasik İskele Piyazı (Türk Patent coğrafi işaret tescili 315, 29.12.2017) küçük taneli kuru fasulye ve haşlanmış yumurta üzerine kurulurken, bu versiyon nohutla doyurucu bir alternatif sunar. Tarator sosu Antalya geleneğine sadık: tahin, sirke, limon, sarımsak.",
    ingredientsAdd: [
      { name: "Sirke", amount: "1", unit: "yemek kaşığı" },
      { name: "Sarımsak", amount: "1", unit: "diş" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "Zeytinyağı", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Tarator sosunun kıvamı önemli; tahini önce sirkeyle açıp sonra limon suyu ve birkaç damla suyu damla damla ekleyerek pürüzsüz kıvama getirin, ezilme riskini azaltır.",
    servingSuggestion:
      "Sığ tabağa yayıp üzerine domates küpleri, mor soğan, maydanoz ve sumak serpin; pide veya bulgur pilavı yanında ılık servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Haşlanmış nohudu süzüp ılıklaşmaya bırakın; soğuksa servis öncesi hafif ısıtın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Tarator sosu için tahini bir kâseye alın, sirkeyi ekleyip çırpın; tahin koyulaşıp parlaklaşacaktır.", timerSeconds: null },
      { stepNumber: 3, instruction: "Limon suyu, ezilmiş sarımsak, tuz ve 1-2 yemek kaşığı suyu damla damla ekleyip pürüzsüz akıcı sosa ulaşın; en sonda zeytinyağını yedirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Ilık nohudu sığ servis tabağına yayın, tarator sosunu üzerine eşit gezdirin; ezmeden hafif harmanlayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Üstüne ince doğranmış kırmızı soğan ve maydanoz serpin; 5 dakika oda sıcaklığında dinlendirip servis edin.", timerSeconds: 300 },
    ],
  },

  // ─── 3: sutlu-kete-bingol (Bingol DUSUR + definition fix) ────────
  {
    type: "rewrite",
    slug: "sutlu-kete-bingol-usulu",
    reason:
      "REWRITE Bingol yore iddia DUSUR + definition fix. Bingol yoresel envanterinde kete YOK (Tatilbudur 13 yemek listesi: lol + mastuva + ayran corbasi + tutmac + keledos + sevzik + gulik + silki tatlisi + yogurtlu sac kavurma; kete LISTEDE DEGIL). Kete Dogu Anadolu klasigi (Erzurum + Kars + Bayburt). Sutlu mayali hamur kanonu (Cinili Mutfak Erzurum + Kevserin Mutfagi Kars + Yemek.com); DB'de YUMURTA + KURU MAYA + tuz eksik. Title 'Sutlu Mayali Dogu Anadolu Ketesi'. 5 ingredient_add (kuru maya + yumurta + tuz + kavrulmus un ic + ic icin ek tereyagi), 1 amount change (sut 1→1.25 sb mayalandirma), 6 step replace klasik kete akisi (mayalandirma + ic harc + sarma + 180°C 25 dk firin). tipNote/serving 'peynirli doku' boilerplate temizle.",
    sources: [
      "https://www.tatilbudur.com/blog/bingol-yemekleri-bingol-meshur-yemekleri-listesi/",
      "https://www.cinilimutfak.com/2016/10/erzurum-ketesi.html",
      "https://www.kevserinmutfagi.com/kars-ketesi-tarifi.html",
    ],
    newTitle: "Sütlü Mayalı Doğu Anadolu Ketesi",
    description:
      "Doğu Anadolu kahvaltılarının baş tacı, sütlü mayalı hamuru ve kavrulmuş un iç harcıyla klasik kete. Erzurum, Kars ve Bayburt mutfaklarının ortak mirası; sıcak servis edildiğinde tereyağı aroması içine sinmiş hamur açılır. Sade demli çayla uzun bir kahvaltıyı kaldırır.",
    prepMinutes: 25,
    cookMinutes: 25,
    totalMinutes: 110,
    ingredientsAmountChange: [
      { name: "Süt", newAmount: "1.25", newUnit: "su bardağı" },
    ],
    ingredientsAdd: [
      { name: "Kuru maya", amount: "1", unit: "tatlı kaşığı" },
      { name: "Yumurta", amount: "1", unit: "adet" },
      { name: "Tuz", amount: "0.5", unit: "çay kaşığı" },
      { name: "İç harç için kavrulmuş un", amount: "0.5", unit: "su bardağı" },
      { name: "İç harç için tereyağı", amount: "30", unit: "gr" },
    ],
    tipNote:
      "İç harç için unu tereyağında orta ateşte sürekli karıştırarak ham un kokusu gidene dek kavurun; topaklanmasın diye ılık ekleyin. Hamuru sıcak ortamda mayalandırmak gluten gevşemesini sağlar.",
    servingSuggestion:
      "Sıcakken dilimleyip sade demli çay, beyaz peynir ve zeytin yanında kahvaltıda servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Sütü vücut sıcaklığına ısıtın; içine kuru mayayı ve şekeri ekleyip 5 dakika köpürmesini bekleyin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Geniş kâseye unu, tuzu ve yumurtayı alın; mayalı süt karışımını ve eritilmiş 40 gr tereyağını ilave edin, yumuşak pürüzsüz hamur olana kadar 8 dakika yoğurun.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Hamurun üstünü örtüp ılık ortamda 45 dakika mayalandırın; iki katına çıksın.", timerSeconds: 2700 },
      { stepNumber: 4, instruction: "İç harç için ayrı tavada 30 gr tereyağını eritin, kavrulmuş unu ekleyip orta ateşte 4 dakika sürekli karıştırarak ham un kokusu gidene dek kavurun, ılıklaşmaya bırakın.", timerSeconds: 240 },
      { stepNumber: 5, instruction: "Hamurdan ceviz büyüklüğünde bezeler alıp avuç içinde açın, ortasına 1 yemek kaşığı iç harç koyup kapatın; yağlanmış tepsiye dizin, üzerlerine yumurta sarısı sürün.", timerSeconds: null },
      { stepNumber: 6, instruction: "180°C ısıtılmış fırında 22-25 dakika üstü altın renge dönene kadar pişirin; sıcakken servis edin.", timerSeconds: 1380 },
    ],
  },

  // ─── 4: tursulu-kavrulmus-lahana-rize (KIBE-MUMBAR FULL) ─────────
  {
    type: "rewrite",
    slug: "tursulu-kavrulmus-lahana-rize-usulu",
    reason:
      "KIBE-MUMBAR FULL REWRITE. Rize tursu kavurmasi RESMI klasigi FASULYE TURSUSU (Gurme Rehberi Rize + Kolay Lezzet Karadeniz dort il + Kirazin Mutfagi Rize spesifik 3 kaynak); beyaz lahana ana malzeme YANLIS, kanonsiz. Title 'Rize Usulu Fasulye Tursusu Kavurmasi'. 1 ingredient_remove (Beyaz lahana ana malzeme), 4 ingredient_add (tereyagi + sarimsak + kirmizi toz biber + opsiyonel yumurta varyant), 1 amount change (fasulye tursusu 200→500 gr ana eksen). 5 step replace + step 6+7 jenerik 'peynirli doku' boilerplate sil. tipNote/serving 'peynirli doku' temizle. Cuisine 'tr' KORUNUR.",
    sources: [
      "https://www.gurmerehberi.com/yemek-kulturu/yoresel-mutfaklar/rize-yemekleri",
      "https://www.kolaylezzet.com/kolay-yemek-tarifleri/sebze-yemekleri/148-fasulye-tursusu-kavurmasi-trabzon-giresun-ordu-rize",
      "https://www.kirazinmutfagi.com.tr/tarif/fasulye-tursusu-kavurmasi-rize",
    ],
    newTitle: "Rize Usulü Fasulye Turşusu Kavurması",
    description:
      "Karadeniz'in turşu kültürünü tek tavada toplayan Rize klasiği, fasulye turşusu kavurması. Tereyağında pembeleşen soğanın üstüne süzülmüş fasulye turşusu eklenir, sarımsak ve toz biberle kavrulur. Mısır ekmeği ve ayran yanında ana yemek tadında doyurur.",
    prepMinutes: 10,
    cookMinutes: 15,
    totalMinutes: 25,
    ingredientsRemove: ["Beyaz lahana"],
    ingredientsAmountChange: [
      { name: "Fasulye turşusu", newAmount: "500", newUnit: "gr" },
    ],
    ingredientsAdd: [
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "Sarımsak", amount: "2", unit: "diş" },
      { name: "Kırmızı toz biber", amount: "0.5", unit: "çay kaşığı" },
      { name: "Yumurta (opsiyonel)", amount: "2", unit: "adet" },
    ],
    tipNote:
      "Turşunun tuzu fazlaysa kavurmadan önce 10 dakika soğuk suda bekletip süzün; yoksa yemek aşırı tuzlu çıkar. Tereyağı klasik Karadeniz turşu kavurmasının imzasıdır.",
    servingSuggestion:
      "Sıcakken mısır ekmeği ve taze ayran yanında servis edin; opsiyonel yumurtayı son aşamada üzerine kırıp pişirebilirsiniz.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Fasulye turşusunu süzün; tuzu yoğunsa 10 dakika soğuk suda bekletip tekrar süzün.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Soğanı ince yarım ay doğrayın; sarımsağı ezin.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada tereyağını ve zeytinyağını eritin, soğanı orta ateşte 4 dakika pembeleştirin; sarımsağı ekleyip 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Süzülmüş fasulye turşusunu tavaya ekleyin, kırmızı toz biberi serpin; orta ateşte 8 dakika kavurun, ara sıra karıştırın.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Opsiyonel yumurtayı üzerine kırıp kapağı kapalı 3 dakika daha pişirin (akışkan beyaz seven için 2 dk); sıcak servis edin.", timerSeconds: 180 },
    ],
  },

  // ─── 5: tahin-pekmezli-nevzine-kup-kayseri (disambiguate + CI atif) ─
  {
    type: "rewrite",
    slug: "tahin-pekmezli-nevzine-kup-kayseri-usulu",
    reason:
      "REWRITE disambiguate. Kayseri Nevzinesi 22 Kasim 2021 Turk Patent CI tescili (Cumhuriyet Gurme + Kultur Portali + Yemek.com 3 kaynak). Klasik = mayasiz hamur tepsi + 7cm kareler + ortasina ceviz + 140°C 45 dk + pekmezli serbet (seker + su + pekmez + limon). DB'de biskuvi kirinti baz, klasik nevzine degil ama 'kup uyarlama' formati icin modern varyant kabul edilebilir. Title 'Kayseri Nevzine Tatlisi (Kup Uyarlama)'. 1 ingredient_add (eritilmis tereyagi sosa zenginlik), 5 step replace + description CI atif.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/kayseri/neyenir/nevzine-1",
      "https://yemek.com/tarif/kayseri-nevzine-tatlisi/",
      "https://www.cumhuriyet.com.tr/gurme/kayseri-nin-meshur-lezzeti-nevzine-tatlisi-tarifi-2490640",
    ],
    newTitle: "Kayseri Nevzine Tatlısı (Kup Uyarlama)",
    description:
      "Kayseri Nevzinesi, 22 Kasım 2021'de Türk Patent ve Marka Kurumu tarafından coğrafi işaret tescili alan bayram klasiği. Klasik tarif tahinli mayasız hamuru tepsiye yayıp 7 cm karelere keser, ortasına ceviz koyup pekmezli şerbetle ıslatır. Bu kup uyarlamasında bisküvi kırıntı tabanı kullanır, ceviz ve tahin pekmez sosuyla katmanlandırır.",
    ingredientsAdd: [
      { name: "Eritilmiş tereyağı", amount: "20", unit: "gr" },
    ],
    tipNote:
      "Sosu tatlının üzerine sıcakken gezdirmek bisküvi tabanın yumuşamasını sağlar. Pekmezi kaynatmadan sosa katın, aroması korunur.",
    servingSuggestion:
      "Cam kupta servis edin, üstüne dövülmüş ceviz ve birkaç damla pekmez. Yanında acı Türk kahvesi nevzinin yoğunluğunu dengeler.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Bisküvi kırıntısını eritilmiş tereyağıyla harmanlayıp kupun tabanına bastırın; her kup için 2 yemek kaşığı kırıntı yeterli.", timerSeconds: null },
      { stepNumber: 2, instruction: "Ayrı kâsede tahini ve üzüm pekmezini çırpıcıyla pürüzsüz kremaya kadar karıştırın; gerekirse 1 yemek kaşığı sıcak su ile akıcılaştırın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Bisküvi tabanın üzerine cevizin yarısını serpin, sonra tahin pekmez sosunun üçte ikisini gezdirin.", timerSeconds: null },
      { stepNumber: 4, instruction: "İkinci kat: kalan ceviz ve sosu paylaştırın; yüzeyi düzleyin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kupları buzdolabında en az 30 dakika dinlendirin, tahin sosu oturup tabanı yumuşatsın; soğuk servis edin.", timerSeconds: 1800 },
    ],
  },

  // ─── 6: tarcinli-erik-kremasi-polonya (yumusat + powidla esin) ───
  {
    type: "rewrite",
    slug: "tarcinli-erik-kremasi-polonya-usulu",
    reason:
      "REWRITE yore yumusat + cuisine 'pl' KORUNUR (esin). Polonya klasik erikli tatlilari powidla (uzun kavurma puresi) + knedle (eriklı patates kofte) + placek (sutlu kek). Sutlu 'erik kremasi' Polonya kanonu DEGIL (Polish Your Kitchen + Wikipedia + Polish Feast 3 kaynak). Tarcin + erik + eksi krema knedle servis klasik. Title 'Tarcinli Erik Kremasi (Polonya Powidla Esinli)'. 1 ingredient_add (eksi krema servis 2 yk). 4 step replace (powidla pattern: erikleri once kavurarak hafif ezmelesir, krema icine yedirme).",
    sources: [
      "https://www.polishyourkitchen.com/polish-plum-butter-powidla-ze-sliwek/",
      "https://en.wikipedia.org/wiki/Powidl",
      "https://polishfeast.com/polish-plum-cake/",
    ],
    newTitle: "Tarçınlı Erik Kreması (Polonya Powidła Esinli)",
    description:
      "Polonya mutfağının klasik erik ezmesi powidła'dan ve knedle servis ritüelinden esinlenen modern uyarlama. Geleneksel powidła sade erik ezmesidir; bu tarif eriği önce yavaş kavurarak hafif ezmeleştirir, sonra sütlü krema içine yedirir. Üzerine ekşi krema dokunuşu Polonya servis tarzını çağrıştırır.",
    prepMinutes: 12,
    cookMinutes: 18,
    totalMinutes: 30,
    ingredientsAdd: [
      { name: "Ekşi krema (servis için)", amount: "2", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Erikleri önce kavurarak hafif ezmek powidła pattern'ine uyar, kremaya katılınca su salmaz. Tarçını eriklere kavurma sonunda eklemek aromasını korur.",
    servingSuggestion:
      "Soğuk kâseye alın, üstüne 1 kaşık ekşi krema ve eriklı kavurma yumakla süsleyin; sıcak naleśniki (Polonya krepi) yanında daha klasik durur.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Erikleri çekirdekten ayırıp ince doğrayın; küçük tavada kısık ateşte 6 dakika ara sıra karıştırarak hafif ezmeleştirin (powidła pattern), tarçını son 1 dakikada ekleyin.", timerSeconds: 360 },
      { stepNumber: 2, instruction: "Tencerede sütü, mısır nişastasını ve toz şekeri çırparak homojenleştirin; orta ateşte sürekli karıştırarak 6 dakika koyulaştırın.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Krema kıvam alınca ocaktan alın, kavurulmuş erik karışımının üçte ikisini içine yedirin; kalan eriği üst süs için ayırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Kremayı kâselere paylaştırın, buzdolabında 30 dakika soğutun; servis sırasında üstüne ayırılan eriği ve birer kaşık ekşi krema bırakın.", timerSeconds: 1800 },
    ],
  },

  // ─── 7: taflan-tursulu-patates-tava-ordu (yumusat + misir unu) ───
  {
    type: "rewrite",
    slug: "taflan-tursulu-patates-tava-ordu-usulu",
    reason:
      "REWRITE yore yumusat + Karadeniz patates tava klasik. Ordu Taflan Tursusu CI tescilli (KURE Ansiklopedi + Otelegidelim); patatesli kombinasyon kanon DEGIL, modern eslik. Karadeniz patates tava klasigi MISIR UNU + tereyagi + zeytinyagi (Rumma + Onedio Karadeniz). Title 'Karadeniz Usulu Misir Unlu Patates Tava (Taflan Tursulu Eslik)'. 3 ingredient_add (misir unu + tereyagi + iri tuz), 5 step replace klasik patates tava akisi (misir uniyla bulama + tereyagi+zeytinyagi tava + iki yuz altin). Cuisine 'tr' KORUNUR. Ordu spesifik iddia dusurulur, taflan tursusu yan eslik vurgu.",
    sources: [
      "https://kureansiklopedi.com/tr/detay/ordu-taflan-tursusu-c93c5",
      "https://www.rumma.org/yemekler/kahvaltiliklar/patates-tava-tarifi-misir-unlu-patates-kizartmasi.html/",
      "https://onedio.com/haber/karadeniz-in-nimetlerinden-misir-unu-ile-yapabileceginiz-birbirinden-guzel-11-tarif-963290",
    ],
    newTitle: "Karadeniz Usulü Mısır Unlu Patates Tava (Taflan Turşulu Eşlik)",
    description:
      "Karadeniz mutfağının klasik tava tekniği, mısır ununa bulanmış patatesi tereyağı ve zeytinyağı karışımında altın renginde kızartır. Yanına Ordu'nun coğrafi işaretli taflan turşusunu ekledik; fermente turşunun keskinliği patatesin yumuşaklığını dengeler. Klasik patates tava artı yöresel modern eşlik.",
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    ingredientsAdd: [
      { name: "Mısır unu", amount: "0.5", unit: "su bardağı" },
      { name: "Tereyağı", amount: "30", unit: "gr" },
      { name: "İri tuz", amount: "0.5", unit: "çay kaşığı" },
    ],
    tipNote:
      "Patatesleri mümkün olduğunca ince doğrayın; mısır unu nemi alıp dışı çıtır, içi yumuşak yapar. Taflan turşusunu yanak ısırırcasına az tüketin, tuzu yoğundur.",
    servingSuggestion:
      "Sıcak servis edin; yanına Ordu taflan turşusu, soğuk ayran ve ince dilimlenmiş peynir.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri yıkayıp soyun, mümkün olduğunca ince halka doğrayın (3-4 mm); kâğıt havluyla nemini alın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş kâseye mısır ununu ve iri tuzu alıp karıştırın; patates dilimlerini bu karışımda iyice bulayın.", timerSeconds: null },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtın, tereyağını ekleyip eritin; köpürmesini bekleyin.", timerSeconds: 120 },
      { stepNumber: 4, instruction: "Patatesleri tava tabanına eşit yayın, kapağı kapalı orta-kısık ateşte 8 dakika pişirin; sonra çevirip kapaksız 6 dakika daha kızartın.", timerSeconds: 840 },
      { stepNumber: 5, instruction: "Pul biberi serpip 1 dakika daha tavada bırakın, sıcak servis tabağına alın; kenarına Ordu taflan turşusu yerleştirin.", timerSeconds: 60 },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-16");
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
              paket: "oturum-29-mini-rev-batch-16",
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
