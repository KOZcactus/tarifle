/**
 * Tek-seferlik manuel mini-rev batch 32 (oturum 31): 7 KRITIK fix.
 *
 * Verify-untracked jenerik scaffold pattern devamı (paketi 25-31 ile
 * aynı audit, paketi 31 sonrası 30 kalan kuyruğun yeni top 1-7).
 * Klasik kanonik kanitli tarifler; jenerik step boilerplate temizle +
 * eksik klasik baharat/aromatik tamamla.
 *
 * Verdict: 7 REWRITE. 0 cuisine fix. 0 title degisimi.
 *
 *   1. tamale (Meksika klasik): masa harina + tavuk suyu + sıvı yağ +
 *      mısır yaprağı + tavuk + kabartma tozu + tuz VAR. DB'de Meksikan
 *      sofrito/salsa essentials sarımsak + kimyon + kuru pul biber
 *      (chili açma) + kişniş garnitür EKSİK. Step 2+6 jenerik scaffold.
 *      4 ingredient_add, 6 step replace.
 *
 *   2. tacu-tacu (Peru klasik): pirinç + fasulye + soğan + zeytinyağı +
 *      yumurta + sarımsak + ají amarillo VAR. DB'de tuz + karabiber +
 *      kimyon (Peru sofrito imzası) + kişniş garnitür EKSİK. Step 5+6
 *      jenerik scaffold. 4 ingredient_add, 6 step replace.
 *
 *   3. pulled-pork-sandvic (US BBQ klasik): dana döş (TR adaptasyonu)
 *      + barbekü sos + sandviç ekmeği + coleslaw VAR. DB'de US BBQ
 *      klasik rub paprika + kahverengi şeker + sarımsak tozu + tuz +
 *      karabiber EKSİK. Step 1-5 hepsi jenerik scaffold (sosunu/bağlayıcı
 *      harç + şekil veren kıvam + dışı kızarana + dinlensin gevrek).
 *      5 ingredient_add, 5 step replace.
 *
 *   4. taze-kekikli-lorlu-omlet-ege-usulu (Ege klasik): yumurta + lor +
 *      taze kekik + zeytinyağı VAR. DB'de tuz + karabiber + taze nane
 *      (Ege otlu imzası) + dereotu opsiyonel EKSİK. Step 1 BOILERPLATE
 *      LEAK 'kuru ve yaş malzemeleri ayırın' (omlette böyle ayrım yok!)
 *      + step 2 jenerik. 4 ingredient_add, 6 step replace.
 *
 *   5. sumakli-patates-asi-afyon-ova-usulu (Afyon yöre): patates +
 *      tereyağı + sumak + tuz VAR. DB'de soğan + maydanoz garnitür +
 *      karabiber + pul biber EKSİK. Step 1-5 hepsi jenerik scaffold.
 *      4 ingredient_add, 5 step replace.
 *
 *   6. susamli-kabak-sote-aksaray-usulu (Aksaray yöre): kabak + sarımsak
 *      + susam + zeytinyağı + tuz VAR. DB'de soğan + karabiber + pul
 *      biber + maydanoz EKSİK. Step 5+6 jenerik scaffold. 4
 *      ingredient_add, 6 step replace.
 *
 *   7. yumurtali-sogan-tavasi-yozgat-usulu (Yozgat yöre): soğan +
 *      yumurta + tereyağı + pul biber VAR. DB'de tuz + karabiber +
 *      maydanoz + sumak (Yozgat imzası) EKSİK. Step 1 BOILERPLATE
 *      LEAK + step 2 jenerik + step 6 jenerik. 4 ingredient_add, 6
 *      step replace.
 *
 * Toplam: 29 ingredient_add + 41 step replace + 4 BOILERPLATE LEAK
 * FIX (paketi 32 #4, #7x3 farklı cümleler birden fazla tarifte).
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
  // ─── 1: tamale (Meksika klasik) ────────────────────────────────────
  {
    type: "rewrite",
    slug: "tamale",
    reason:
      "REWRITE jenerik scaffold + Meksikan tamale klasik baharat. Klasik tamale: masa harina + tavuk suyu + saindoux/sıvı yağ + mısır yaprağı + tavuk dolgusu + kabartma tozu + tuz VAR. DB'de Meksikan salsa/sofrito sarımsak + kimyon + kuru pul biber (chili açma) + kişniş garnitür EKSİK. Step 2+6 jenerik scaffold. Title KORUNUR. cuisine 'mx' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tamale",
      "https://www.mexicoinmykitchen.com/red-chicken-tamales/",
    ],
    description:
      "Meksika sokak ve fiesta sofralarının klasiği tamale; mısır hamuru (masa) tavuk suyu ve yağla yumuşatılıp ıslatılmış mısır yapraklarına sarılır, kimyonlu pul biber sosuyla harmanlanan tavuk dolgusu eklenir ve buharda yavaş yavaş pişirilir.",
    ingredientsAdd: [
      { name: "Sarımsak", amount: "3", unit: "diş" },
      { name: "Kimyon", amount: "1", unit: "tatlı kaşığı" },
      { name: "Kuru pul biber", amount: "1", unit: "tatlı kaşığı" },
      { name: "Kişniş", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Mısır yapraklarını sıcak suda en az 30 dakika bekletin; aksi halde kırılır ve dolgu sırasında yırtılır. Hamur kıvamını kontrol etmek için minik topak suya atın; üste çıkarsa kıvam tutmuştur, dibe inerse 1-2 yemek kaşığı tavuk suyu daha ekleyin.",
    servingSuggestion:
      "Sıcak tamaleleri yapraklarıyla birlikte tabağa alın; üzerine taze kişniş serpip yanına salsa verde, lime dilimi ve crema ile servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Mısır yapraklarını sıcak suda 30 dakika bekletin; haşlanmış tavuğu didikleyin, sarımsağı ezin, kişnişi kıyın.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Küçük tavada 2 yemek kaşığı sıvı yağı ısıtıp ezilmiş sarımsak, kimyon ve kuru pul biberi 1 dakika açın; didiklenmiş tavuğa katıp tuzla harmanlayarak dolguyu hazırlayın.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Geniş kapta masa harina, kabartma tozu ve tuzu karıştırın; sıvı yağı ekleyip parmaklarla ufalayın, ardından sıcak tavuk suyunu yavaş yavaş katarak yumuşak hamur elde edin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Süzülen mısır yaprağının iç yüzüne 2-3 yemek kaşığı hamur yayın, ortasına 1 yemek kaşığı tavuk dolgusu koyun; yaprağın iki kenarını ve alt ucunu içe katlayarak paketi sarın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Tamaleleri buharlı pişirme tenceresine dik dizip kısık ateşte 75 dakika buharda pişirin; ara ara su kontrolü yapın, gerekirse sıcak su ekleyin.", timerSeconds: 4500 },
      { stepNumber: 6, instruction: "Tamaleleri ocaktan alıp 10 dakika kapalı dinlendirin; servis tabağına yapraklarıyla alıp üzerine kişniş serpip sıcak servis edin.", timerSeconds: 600 },
    ],
  },

  // ─── 2: tacu-tacu (Peru klasik) ───────────────────────────────────
  {
    type: "rewrite",
    slug: "tacu-tacu",
    reason:
      "REWRITE jenerik scaffold + Peru tacu-tacu klasik tamamlama. Klasik Lima ev yemeği: pirinç + fasulye + soğan + zeytinyağı + yumurta + sarımsak + ají amarillo VAR. DB'de tuz + karabiber + kimyon (Peru sofrito imzası) + kişniş garnitür EKSİK. Step 5+6 jenerik scaffold. Title KORUNUR. cuisine 'pe' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Tacu_tacu",
      "https://www.peru.travel/en/gastronomy/peruvian-cuisine/tacu-tacu",
    ],
    description:
      "Lima ev sofralarının klasik artık yemeği tacu-tacu; önceki günden kalan pirinç ve fasulyenin sarımsak, soğan, ají amarillo ve kimyondan oluşan kreolize sofritoyla bastırılıp tavada hilal forma sokulması ve üstüne sahanda yumurtayla servis edilmesidir.",
    ingredientsAdd: [
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kimyon", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Kişniş", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Pirinç ve fasulyenin önceden soğumuş olması gerekir; sıcak sıkıştırmaya çalışırsanız tava içinde dağılır. Ají amarillo ezmesini sofritoda direkt çevirin; 1 dakika kavurmak yeterli, fazla ısı kekremsi tat verir.",
    servingSuggestion:
      "Tabağa hilal formdaki tacu-tacuyu alıp üzerine sahanda yumurta yatırın; yanına salsa criolla (soğan-limon-kişniş) ve dilim limon koyup taze kişniş serpin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanı çok ince doğrayın, sarımsağı ezin; kişnişin yapraklarını koparıp ayırın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Geniş tavada zeytinyağını orta ateşte ısıtıp soğanı 5 dakika şeffaflaşana kadar çevirin; sarımsak, ají amarillo ve kimyonu ekleyip 1 dakika daha kavurun.", timerSeconds: 360 },
      { stepNumber: 3, instruction: "Haşlanmış pirinç ve fasulyeyi tavaya alın; tuz ve karabiber katıp tahta spatulayla bastırarak sıkıştırın.", timerSeconds: null },
      { stepNumber: 4, instruction: "Karışımı tavada hilal forma yayıp orta-yüksek ateşte 6 dakika dış yüzü kabuk tutana kadar pişirin, ardından çevirip 4 dakika daha mühürleyin.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Ayrı tavada zeytinyağında yumurtaları sahanda pişirin; sarısı akışkan kalsın.", timerSeconds: null },
      { stepNumber: 6, instruction: "Servis tabağına tacu-tacuyu alıp üzerine sahanda yumurta yerleştirin; taze kişniş yapraklarıyla taçlandırarak sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 3: pulled-pork-sandvic (US BBQ klasik) ───────────────────────
  {
    type: "rewrite",
    slug: "pulled-pork-sandvic",
    reason:
      "REWRITE jenerik scaffold (5 step tümü scaffold) + US BBQ pulled pork rub klasik. Klasik US BBQ pulled pork sandviç (Carolina/Texas tipi): et + brown sugar + paprika + sarımsak tozu + soğan tozu + tuz + karabiber + kekik (rub) + barbekü sos + sandviç ekmeği + coleslaw. DB'de barbekü rub baharatları paprika + kahverengi şeker + sarımsak tozu + tuz + karabiber EKSİK. Step 1-5 hepsi jenerik scaffold ('sosunu veya bağlayıcı harcını' + 'şekil verecek kıvama gelene kadar' + 'dışı kızarana kadar pişsin' + 'gevrek kalsın'). Title KORUNUR. cuisine 'us' KORUNUR. 5 ingredient_add, 5 step replace.",
    sources: [
      "https://en.wikipedia.org/wiki/Pulled_pork",
      "https://www.bbcgoodfood.com/recipes/pulled-pork-sandwiches",
    ],
    description:
      "Amerikan barbekü mutfağının uzun pişen klasiği pulled pork sandviç; eti paprika ve kahverengi şeker rub'ıyla ovup yavaş ısıda pişirip didikleyerek barbekü sosla harmanlamak ve yumuşak ekmek arasında coleslaw'la sunmaktan ibaret.",
    ingredientsAdd: [
      { name: "Tatlı toz biber (paprika)", amount: "2", unit: "yemek kaşığı" },
      { name: "Kahverengi şeker", amount: "2", unit: "yemek kaşığı" },
      { name: "Sarımsak tozu", amount: "1", unit: "yemek kaşığı" },
      { name: "Tuz", amount: "1", unit: "yemek kaşığı" },
      { name: "Karabiber", amount: "1", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Eti pişirmeden 1 saat önce rub'la ovup buzdolabında dinlendirin; baharat ete işler ve dış kabuk daha karakterli olur. Yavaş pişirme şart: 150°C fırında 4-5 saat veya çok kısık ateşte güveçte 5 saat; bu sayede içte dağılan dokuya ulaşılır.",
    servingSuggestion:
      "Sıcak didiklenmiş etin barbekü sosla buluştuğu karışımı yumuşak sandviç ekmeğine yayın, üzerine bol coleslaw alıp kapatın; yanına ev yapımı patates kızartması veya turşu iyi gider.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Eti büyük bloklar halinde 4-5 cm parçalara bölün; paprika, kahverengi şeker, sarımsak tozu, tuz ve karabiberi karıştırarak rub yapın ve etin her tarafına ovun.", timerSeconds: null },
      { stepNumber: 2, instruction: "Eti üzeri kapalı buzdolabında 1 saat dinlendirin; bu sırada fırını 150°C'ye ısıtın.", timerSeconds: 3600 },
      { stepNumber: 3, instruction: "Eti derin güveç veya fırın tepsisine alıp üzerine 1 su bardağı su ekleyin, kapağı kapatıp 4 saat fırında pişirin; her saat başı dipteki suyu üzerine kaşıkla alın.", timerSeconds: 14400 },
      { stepNumber: 4, instruction: "Etin merkezi 90°C'ye ulaşıp çatalla kolayca dağıldığında fırından alın, 15 dakika dinlendirip iki çatalla didikleyin; barbekü sosun yarısını ekleyip harmanlayın.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Sandviç ekmeklerini ortadan açıp alt yarısına bol didiklenmiş et koyun, üzerine kalan barbekü sosu gezdirin ve coleslawı yatırıp üst yarıyı kapatarak sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 4: taze-kekikli-lorlu-omlet-ege-usulu (Ege klasik) ───────────
  {
    type: "rewrite",
    slug: "taze-kekikli-lorlu-omlet-ege-usulu",
    reason:
      "REWRITE jenerik scaffold + Ege otlu omlet klasik tamamlama. Klasik Ege otlu omlet: yumurta + lor + taze kekik + zeytinyağı VAR. DB'de tuz + karabiber + taze nane (Ege otlu sahan imzası) + dereotu opsiyonel EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (omlette böyle ayrım yok!) + step 2 jenerik. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.lezzet.com.tr/yemek-tarifleri/kahvaltilik-tarifleri/otlu-omlet",
      "https://www.kulturportali.gov.tr/turkiye/izmir/neyenir",
    ],
    description:
      "Ege sofralarının kekikli lorlu omleti; yumurtanın taze kekik, nane ve dereotuyla aromatlandırılıp lor peynirinin yumuşak dokusuyla buluşturularak tavada katlanan otlu kahvaltı tabağıdır.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Taze nane", amount: "1", unit: "yemek kaşığı" },
      { name: "Dereotu", amount: "1", unit: "yemek kaşığı" },
    ],
    tipNote:
      "Lor peynirinin nemini tülbentle 5 dakika süzdürün; aksi halde omleti sulandırır. Otları yumurtaya katmadan önce ince kıyın; iri parçalar omletin katlanmasını zorlaştırır.",
    servingSuggestion:
      "Sıcak omleti dilimleyip tabağa alın; yanına dilim domates, beyaz peynir ve sıcak köy ekmeğiyle Ege sabah tabağını tamamlayın.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Taze kekik, nane ve dereotunu ince kıyın; lor peynirini tülbentle süzdürüp çatalla ufalayın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Yumurtaları kâseye kırıp tuz ve karabiberi ekleyin; çırpıcıyla 1 dakika çırpıp ak ve sarıyı tamamen birleştirin.", timerSeconds: 60 },
      { stepNumber: 3, instruction: "Yumurta karışımına kekik, nane ve dereotunu katıp 30 saniye daha çırpın; lor peynirini eklemeden bekletin.", timerSeconds: null },
      { stepNumber: 4, instruction: "Yapışmaz tavada zeytinyağını orta-kısık ateşte ısıtıp yumurta karışımını dökün; tavayı eğerek hamuru eşit yayın.", timerSeconds: null },
      { stepNumber: 5, instruction: "Omletin üstünde minik kabarcıklar oluşmaya başlayınca lor peynirini bir yarısına serpin; 4 dakika alt yüzü tutsa kadar pişirin.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Omleti spatulayla yarı katlayıp 1 dakika daha pişirin; tabağa alıp üstüne biraz daha taze kekik serperek sıcak servis edin.", timerSeconds: 60 },
    ],
  },

  // ─── 5: sumakli-patates-asi-afyon-ova-usulu (Afyon yöre) ──────────
  {
    type: "rewrite",
    slug: "sumakli-patates-asi-afyon-ova-usulu",
    reason:
      "REWRITE jenerik scaffold (5 step tümü scaffold) + Afyon sumaklı patates aşı tamamlama. Klasik formul: haşlanmış patates + tereyağı + sumak + tuz VAR. DB'de soğan + maydanoz garnitür + karabiber + pul biber EKSİK. Step 1-5 hepsi jenerik scaffold ('sosunu veya bağlayıcı harcını' + 'şekil verecek kıvama gelene kadar' + 'dışı kızarana kadar pişsin' + 'gevrek kalsın'). Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 5 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/afyonkarahisar/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/sumakli-patates",
    ],
    description:
      "Afyonkarahisar ovasının sumaklı patates aşı; haşlanan patatesin tereyağı ve eritilmiş soğanla mühürlenip sumakla canlandığı, sade ama parlak bir sıcak aperatif veya yan tabaktır.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Patatesi haşlarken çok pişirmeyin; içerideki dokunun parça parça kalması için 12-14 dakika yeterli. Sumakı ısıyla az temasa sokun; pişmenin son aşamasında ekleyin, kekremsi tat oluşmasın.",
    servingSuggestion:
      "Servis tabağına alıp üstüne bol kıyılmış maydanoz ve ekstra sumak serpin; yanında soğan piyazı veya yoğurtla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Patatesleri kabuğuyla 12 dakika tuzlu suda haşlayıp soyduktan sonra 2 cm küp doğrayın.", timerSeconds: 720 },
      { stepNumber: 2, instruction: "Soğanı yemeklik doğrayıp tavada tereyağında 5 dakika pembeleştirin.", timerSeconds: 300 },
      { stepNumber: 3, instruction: "Haşlanmış patatesi tavaya alıp tuz, karabiber ve pul biberi serpin; 4 dakika orta ateşte çevirerek kabuk tutturun.", timerSeconds: 240 },
      { stepNumber: 4, instruction: "Sumakı serpip 1 dakika daha karıştırarak ocaktan alın.", timerSeconds: 60 },
      { stepNumber: 5, instruction: "Servis tabağına paylaştırıp üstüne maydanoz ve ekstra sumak serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 6: susamli-kabak-sote-aksaray-usulu (Aksaray yöre) ───────────
  {
    type: "rewrite",
    slug: "susamli-kabak-sote-aksaray-usulu",
    reason:
      "REWRITE jenerik scaffold + Aksaray susamlı kabak sote tamamlama. Klasik formul: kabak + sarımsak + susam + zeytinyağı + tuz VAR. DB'de soğan + karabiber + pul biber + maydanoz EKSİK. Step 5+6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/aksaray/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/sebze-yemekleri/susamli-kabak",
    ],
    description:
      "Aksaray usulü susamlı kabak sote; kabak halkalarının sarımsak ve soğanla tavada karamelize olup kavrulmuş susamla taçlanarak hafif çıtır dokulu bir sebze tabağına dönüştürülmesidir.",
    ingredientsAdd: [
      { name: "Soğan", amount: "1", unit: "adet" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Pul biber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
    ],
    tipNote:
      "Susamı ayrı kuru tavada 2 dakika kavurup ekleyin; çıtır dokunun ve aromatik kokunun anahtarı bu adım. Kabağı çok inceltmeyin; 1 cm yarım ay forma sote sırasında dağılmaz.",
    servingSuggestion:
      "Servis tabağına alıp üzerine maydanoz ve fazladan kavrulmuş susam serpin; yanına yoğurt veya bulgur pilavıyla servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Kabakları yıkayıp 1 cm kalınlığında yarım ay doğrayın; soğanı yemeklik, sarımsağı ezin, maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Susamı küçük kuru tavada orta ateşte 2 dakika sallayarak kavurup ayrı bir kâseye alın.", timerSeconds: 120 },
      { stepNumber: 3, instruction: "Geniş tavada zeytinyağını ısıtıp soğanı 4 dakika pembeleştirin; sarımsağı 30 saniye çevirin.", timerSeconds: 270 },
      { stepNumber: 4, instruction: "Kabakları tavaya ekleyip tuz, karabiber ve pul biberi serpin; 8 dakika orta ateşte ara ara çevirerek soteleyin.", timerSeconds: 480 },
      { stepNumber: 5, instruction: "Kavrulmuş susamı katıp 1 dakika daha karıştırarak ocaktan alın.", timerSeconds: 60 },
      { stepNumber: 6, instruction: "Servis tabağına paylaştırıp üzerine maydanoz serperek sıcak servis edin.", timerSeconds: null },
    ],
  },

  // ─── 7: yumurtali-sogan-tavasi-yozgat-usulu (Yozgat yöre) ─────────
  {
    type: "rewrite",
    slug: "yumurtali-sogan-tavasi-yozgat-usulu",
    reason:
      "REWRITE jenerik scaffold + Yozgat yumurtalı soğan tavası tamamlama. Klasik formul: soğan + yumurta + tereyağı + pul biber VAR. DB'de tuz + karabiber + maydanoz garnitür + sumak (Yozgat imzası) EKSİK. Step 1 BOILERPLATE LEAK 'kuru ve yaş malzemeleri ayırın' (sahan'da kuru/yaş yok!) + step 2 jenerik + step 6 jenerik scaffold. Title KORUNUR. cuisine 'tr' KORUNUR. 4 ingredient_add, 6 step replace.",
    sources: [
      "https://www.kulturportali.gov.tr/turkiye/yozgat/neyenir",
      "https://www.lezzet.com.tr/yemek-tarifleri/yoresel-yemekler/sogan-tavasi",
    ],
    description:
      "Yozgat bozkır kahvaltılarının yumurtalı soğan tavası; ince doğranmış soğanın tereyağında karamelize olup pul biberle parlanması ve yumurtanın yarı katı sahan formunda buluşmasıyla tatlı tuzlu dengeli bir tabak çıkar.",
    ingredientsAdd: [
      { name: "Tuz", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Karabiber", amount: "0.5", unit: "tatlı kaşığı" },
      { name: "Maydanoz", amount: "0.5", unit: "demet" },
      { name: "Sumak", amount: "0.5", unit: "tatlı kaşığı" },
    ],
    tipNote:
      "Soğanı orta-kısık ateşte uzun uzadıya pişirin; karamelizasyon tabağın imzasıdır, hızlandırırsanız kavrulup acı tat verir. Yumurtaları sahana kırdıktan sonra fazla karıştırmayın; sarısı ortada parça parça kalsın.",
    servingSuggestion:
      "Sahanı doğrudan sofraya alıp üstüne maydanoz ve ekstra sumak serpin; sıcak köy ekmeğiyle dürüm yaparak servis edin.",
    stepsReplace: [
      { stepNumber: 1, instruction: "Soğanları yarım ay ince doğrayın; maydanozu kıyın.", timerSeconds: null },
      { stepNumber: 2, instruction: "Sahan veya küçük tavada tereyağını orta-kısık ateşte eritip soğanları ekleyin; 8 dakika sıkça çevirerek karamelize edin.", timerSeconds: 480 },
      { stepNumber: 3, instruction: "Pul biberi soğana serpip 30 saniye daha karıştırarak yağda açın.", timerSeconds: 30 },
      { stepNumber: 4, instruction: "Soğanı sahanın çevresine yayıp ortasında çukurlar açın; yumurtaları kırın, üzerlerine tuz ve karabiber serpin.", timerSeconds: null },
      { stepNumber: 5, instruction: "Kapağı kapatıp orta-kısık ateşte 4 dakika beyazlar tutana kadar pişirin; sarısı akışkan kalsın.", timerSeconds: 240 },
      { stepNumber: 6, instruction: "Sahanı ocaktan alıp üzerine maydanoz ve sumak serperek sıcak servis edin.", timerSeconds: null },
    ],
  },
];

function normalize(name: string): string {
  return name.toLocaleLowerCase("tr").trim();
}

async function main(): Promise<void> {
  assertDbTarget("fix-mini-rev-batch-32");
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
              paket: "oturum-31-mini-rev-batch-32",
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
