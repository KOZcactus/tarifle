/**
 * Rule-based tipNote + servingSuggestion generator.
 *
 * Amaç: "AI hissi" veren, tarife özgü, kısa ve somut bir ipucu üretmek.
 * Zero-cost, LLM'siz. Deterministic (aynı slug her zaman aynı çıktı).
 *
 * Mimari (3 katman):
 *   1. SIGNAL EXTRACT  : recipe'den ipuçları çıkar (teknik keyword'leri,
 *      protein tipi, pişirme süresi, dokü/tekstür sinyali)
 *   2. TEMPLATE MATCH  : sinyallere karşılık gelen şablon ailelerini seç
 *      (örn. "yoğurt + çorba" ailesi: yoğurdu kesilmekten koruma tipi)
 *   3. VARIATE         : slug seed (djb2 hash) ile şablon ailesinden bir
 *      varyant seç, $1/$2 placeholder'ları ingredient/title ile doldur
 *
 * Fallback: hiç şablon tutmazsa kategori bazlı generic bir cümle (yine de
 * boilerplate'ten farklı, "fırından sıcak servis edin" yerine "kısık
 * ateşte son 3 dakika dinlendirmek dokuyu sadeleştirir" gibi).
 *
 * Kurallar:
 *   - Em-dash (U+2014) yasak (AGENTS.md), yerine virgül, nokta, noktalı virgül
 *   - Boilerplate banned: "servis edin" veya "çok lezzetli olur" gibi
 *     jenerik cümleler ikincil placeholder'da bile kullanılmaz
 *   - TR ton: casual kitchen-counter, 12-22 kelime hedef, imperative'ten kaçın
 */

export interface RecipeSignal {
  slug: string;
  title: string;
  type:
    | "YEMEK"
    | "CORBA"
    | "TATLI"
    | "ICECEK"
    | "KOKTEYL"
    | "KAHVALTI"
    | "APERATIF"
    | "SALATA"
    | "ATISTIRMALIK"
    | "SOS";
  categorySlug: string;
  cuisine: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  prepMinutes: number;
  cookMinutes: number;
  ingredients: string[]; // name only, order-preserved
}

// ── 1. SIGNAL EXTRACT ───────────────────────────────────────────────────

interface ExtractedSignals {
  hasYogurt: boolean;
  hasEgg: boolean;
  hasFlour: boolean;
  hasButter: boolean;
  hasCheese: boolean;
  hasDough: boolean;
  hasMeat: boolean;
  hasChicken: boolean;
  hasFish: boolean;
  hasLegume: boolean;
  hasRice: boolean;
  hasPasta: boolean;
  hasSauce: boolean;
  hasOnion: boolean;
  hasTomato: boolean;
  hasHerb: boolean; // maydanoz, dereotu, nane, fesleğen, kekik
  hasChocolate: boolean;
  hasCaramel: boolean;
  hasAlcohol: boolean;
  hasCoconut: boolean;
  hasCream: boolean;
  technique:
    | "firin"
    | "mangal"
    | "tava"
    | "tencere"
    | "haslama"
    | "kizartma"
    | "buzluk"
    | "soguk"
    | null;
  keyIngredient: string; // ilk non-pantry ingredient
  isShort: boolean; // prep+cook < 20 min
  isLong: boolean; // total >= 60 min
}

const PANTRY = new Set([
  "su",
  "tuz",
  "karabiber",
  "şeker",
  "limon suyu",
  "zeytinyağı",
  "sıvı yağ",
  "sirke",
  "un",
  "buz",
]);

function has(ingredients: string[], ...keywords: string[]): boolean {
  const lower = ingredients.map((i) => i.toLowerCase());
  return lower.some((name) =>
    keywords.some((kw) => name.includes(kw.toLowerCase())),
  );
}

export function extractSignals(r: RecipeSignal): ExtractedSignals {
  const ing = r.ingredients;
  const title = r.title.toLowerCase();
  const cat = r.categorySlug.toLowerCase();

  let technique: ExtractedSignals["technique"] = null;
  if (title.includes("firinda") || title.includes("fırında") || cat.includes("firin")) {
    technique = "firin";
  } else if (title.includes("mangal") || title.includes("kebap") || title.includes("şiş")) {
    technique = "mangal";
  } else if (title.includes("kızartma") || title.includes("citir") || title.includes("çıtır")) {
    technique = "kizartma";
  } else if (title.includes("tava") || title.includes("sote") || title.includes("mücver")) {
    technique = "tava";
  } else if (r.type === "CORBA" || title.includes("yahni") || title.includes("güveç")) {
    technique = "tencere";
  } else if (title.includes("haşlama") || title.includes("compote") || title.includes("komposto")) {
    technique = "haslama";
  } else if (r.type === "TATLI" && (title.includes("dondurma") || title.includes("parfe"))) {
    technique = "buzluk";
  } else if (r.type === "ICECEK" || r.type === "KOKTEYL") {
    technique = "soguk";
  }

  const keyIngredient =
    ing.find((n) => !PANTRY.has(n.toLowerCase())) ?? ing[0] ?? "malzeme";

  return {
    hasYogurt: has(ing, "yoğurt", "ayran"),
    hasEgg: has(ing, "yumurta"),
    hasFlour: has(ing, "un"),
    hasButter: has(ing, "tereyağı"),
    hasCheese: has(ing, "peynir", "beyaz peynir", "kaşar", "feta", "lor", "çökelek", "mozzarella", "ricotta", "parmesan"),
    hasDough: has(ing, "hamur", "maya", "yufka", "börek"),
    hasMeat: has(ing, "kıyma", "kuzu", "dana", "et kuşbaşı", "kuşbaşı"),
    hasChicken: has(ing, "tavuk", "hindi"),
    hasFish: has(ing, "balık", "somon", "levrek", "hamsi", "karides", "midye", "kalamar", "ahtapot"),
    hasLegume: has(ing, "nohut", "mercimek", "fasulye", "börülce", "barbunya"),
    hasRice: has(ing, "pirinç", "bulgur"),
    hasPasta: has(ing, "makarna", "erişte", "mantı", "spagetti", "penne", "noodle"),
    hasSauce: has(ing, "sos", "salça", "domates püresi"),
    hasOnion: has(ing, "soğan", "pırasa", "taze soğan"),
    hasTomato: has(ing, "domates"),
    hasHerb: has(ing, "maydanoz", "dereotu", "nane", "fesleğen", "kekik", "reyhan", "kişniş"),
    hasChocolate: has(ing, "çikolata", "kakao"),
    hasCaramel: title.includes("karamel") || has(ing, "karamel"),
    hasAlcohol: has(ing, "şarap", "rakı", "votka", "cin", "rom", "viski", "bira", "tequila"),
    hasCoconut: has(ing, "hindistancevizi", "hindistan cevizi", "kokos"),
    hasCream: has(ing, "krema", "süt kreması"),
    technique,
    keyIngredient,
    isShort: r.prepMinutes + r.cookMinutes < 20,
    isLong: (r.prepMinutes + r.cookMinutes) >= 60,
  };
}

// ── 2. TEMPLATE MATCH ──────────────────────────────────────────────────

/** Her şablon bir aile; matcher'ı true dönerse uygun. Her ailede 3-5 varyant. */
interface TipNoteRule {
  name: string;
  match: (r: RecipeSignal, s: ExtractedSignals) => boolean;
  variants: string[]; // $KEY = keyIngredient
}

// İpuçları: teknik/kültürel/somut. "iyice" kelimesi ASLA, "servis edin" ASLA.
const TIP_RULES: TipNoteRule[] = [
  {
    name: "yogurt-soup-tempering",
    match: (r, s) => r.type === "CORBA" && s.hasYogurt,
    variants: [
      "Yoğurdu kaseye alıp tencereye iki kepçe sıcak suyla temperleyerek eklemek kesilmesini önler.",
      "Yoğurdu tencereye direkt katmayın, önce biraz sıcak çorbayla yumuşatın, ardından tencereye akıtın.",
      "Yoğurtlu tabanı 70 dereceyi geçmeyen sıcaklıkta tutmak ayrışmayı engeller.",
      "Yoğurdu pişmenin son 3 dakikasında ekleyip tencereyi ocaktan alırsanız dokusu kadifemsi kalır.",
    ],
  },
  {
    name: "flour-roux-lump",
    match: (r, s) => s.hasFlour && (r.type === "CORBA" || s.hasSauce),
    variants: [
      "Unu yağda 2 dakika kavurup sonra sıvı eklemek topaklanmayı engeller, tat da kepek bırakmaz.",
      "Sıvıyı ılık eklemek ve sürekli çırpmak çorbayı pürüzsüz bir dokuda tutar.",
      "Unu soğuk sıvıda çırparak ekleyin, kaynayan tencereye direkt atmaktan kaçının.",
    ],
  },
  {
    name: "dough-rest",
    match: (_, s) => s.hasDough,
    variants: [
      "Hamuru en az 20 dakika dinlendirmek gluteni gevşetir, açımda elastik olmasını sağlar.",
      "Hamuru mutfak beziyle örtüp oda sıcaklığında bekletirseniz daha kolay açılır.",
      "Mayalı hamursa kabardıktan sonra hafifçe yumruk atıp tekrar bekletmek iç dokuyu düzenler.",
    ],
  },
  {
    name: "fry-oil-temperature",
    match: (_, s) => s.technique === "kizartma",
    variants: [
      "Yağ 170 derecede olmalı; soğuk yağa atarsanız malzeme yağ emer, çok kızgın yağda dışı yanar içi çiğ kalır.",
      "Kızartmaya başlamadan önce tahta kaşık ucunu yağa batırın, küçük kabarcıklar çıkıyorsa yağ hazırdır.",
      "Kızartmayı tek seferde doldurmayın, parçalar arasında boşluk bırakmak çıtırlığı korur.",
    ],
  },
  {
    name: "oven-rack-position",
    match: (_, s) => s.technique === "firin",
    variants: [
      "Tepsiyi fırının orta rafında tutmak üst ve alt ısıyı eşit dağıtır, tek tarafın yanmasını engeller.",
      "Fırını 10 dakika önceden ısıtmak ilk parçaların çiğ kalmasını önler.",
      "Son 3 dakikayı üst ızgarada bitirirseniz yüzey altın rengi alır, iç kurumaz.",
    ],
  },
  {
    name: "grill-rest",
    match: (_, s) => s.technique === "mangal",
    variants: [
      "Eti mangaldan aldıktan sonra 4 dakika dinlendirmek sularını içeride tutar, dilimleme kolay olur.",
      "Kömür beyaz küle dönmeden ızgarayı koymayın, alev direkt eti yakar.",
      "Şişleri çok sık çevirmeyin, bir yüzeye 2 dakika temas tat tabakası oluşturur.",
    ],
  },
  {
    name: "meat-cube-sear",
    match: (r, s) => s.hasMeat && r.type !== "KOKTEYL" && r.type !== "TATLI",
    variants: [
      "Kuşbaşıyı yüksek ateşte kısa sürede mühürleyin, sonra ateşi kısın; su bırakmaz, tat daha konsantre olur.",
      "Parçaları tencereye aynı anda doldurmayın; iki etaba bölmek kavurma yerine haşlanma riskini engeller.",
      "Kemikli et kullanıyorsanız kemiği önce yalayıp kavurmak et suyunu derinleştirir.",
      "Eti pişirmeden 20 dakika önce buzdolabından çıkarıp oda sıcaklığına getirmek eşit pişim sağlar.",
      "Tuzlamayı pişirmeden hemen önce yapın, erken tuz et suyunu dışarı çeker ve kavurmayı zorlaştırır.",
      "Pişirme sırasında sık karıştırmaktan kaçının, etin bir yüzeyinin tavaya 2-3 dakika temas etmesi tat tabakası oluşturur.",
      "Eti ocaktan aldıktan sonra alüminyum folyoyla örtüp 5 dakika dinlendirmek suları eşit dağıtır.",
      "Yağlı parçalar için eklenti yağa gerek yok, kendi yağıyla kızarır ve karamelize olur.",
    ],
  },
  {
    name: "chicken-dry",
    match: (_, s) => s.hasChicken,
    variants: [
      "Tavuğu pişirmeden önce kağıt havluyla iyice kurulamak dış yüzeyin kızarmasını sağlar.",
      "Tavuğu tencereye koymadan 15 dakika oda sıcaklığında bekletirseniz eşit pişer, dış kabuk kurumaz.",
      "Tavuğun iç sıcaklığı 74 dereceye ulaştığında pişmiştir; kalın bölgeden termometre ile kontrol edin.",
      "Tavuk göğsünü 20 dakika sütlü marine ile beklettiyseniz pişince kuru ve lifli olmaz.",
      "Derili kısım için ters tarafı aşağı koyup pişirmeye başlayın, yağ yavaş çıkıp derisi çıtır olur.",
      "Kemikli parçaları kemik yüzü üste gelecek şekilde yerleştirin, sular aşağı iner ve eti nemli tutar.",
    ],
  },
  {
    name: "fish-skin-crisp",
    match: (_, s) => s.hasFish,
    variants: [
      "Balığı derisi aşağıda tavaya koyup 3 dakika kıpırdatmadan bırakın; deri ayrılmadan çıtır tabaka oluşur.",
      "Balığı tuzladıktan sonra 10 dakika süzdürmek fazla suyu alır, pişimde yağ sıçramasını azaltır.",
      "Pişirmeden önce balığı oda sıcaklığına getirin; soğuk balık içten pişmeden dışı kurur.",
    ],
  },
  {
    name: "legume-soak-salt",
    match: (_, s) => s.hasLegume,
    variants: [
      "Kuru baklagili gece boyunca ılık suda bekletmek pişme süresini yarıya indirir, gaz yapma etkisini de azaltır.",
      "Tuzu pişmenin sonunda eklemek baklagilin kabuğunun sertleşmesini engeller.",
      "Karbonat eklemek pişmeyi hızlandırır ama az kullanın; fazlası tada sabunumsu bir iz bırakır.",
    ],
  },
  {
    name: "rice-pilaf-fluff",
    match: (_, s) => s.hasRice,
    variants: [
      "Pirinci pişmeden önce ılık tuzlu suda 20 dakika bekletmek taneleri ayrıştırır, pilav dağılmaz.",
      "Pilavı ateşten alınca kapağın altına temiz bir bez koyup 10 dakika dinlendirmek nemi alır, taneler kabarır.",
      "Pirinç sıvı oranı 1'e 1,5; fazla su taneyi yapıştırır, az su iç kısmı çiğ bırakır.",
    ],
  },
  {
    name: "pasta-al-dente",
    match: (_, s) => s.hasPasta,
    variants: [
      "Makarnayı paket süresinin 1 dakika eksiğinde süzüp sosla birlikte pişirirseniz al dente dokusu korunur.",
      "Haşlama suyunu atmadan bir kepçe ayırın; sosa ekleyip soslu kıvamı açar, makarnaya yapışır.",
      "Tuzu makarnayı eklemeden suya atın; suyun yemek kaşığıyla bir kaşık tuzlanması yeterlidir.",
    ],
  },
  {
    name: "dessert-chill-set",
    match: (r, s) => r.type === "TATLI" && (s.hasCream || s.hasYogurt || s.hasEgg),
    variants: [
      "Tatlıyı buzdolabında en az 3 saat dinlendirmek kıvamı oturmasını sağlar, dilimlerken dağılmaz.",
      "Kremayı çırpmadan önce çanağı 10 dakika buzdolabına almak hacim kazanımını arttırır.",
      "Şerbeti soğuk, tatlıyı sıcak kullanın; tersi şerbeti yüzeyde bırakır, iç kurur.",
    ],
  },
  {
    name: "chocolate-temper",
    match: (_, s) => s.hasChocolate,
    variants: [
      "Çikolatayı benmari ile eritin; direkt ocağa koyarsanız 55 dereceyi aşar ve kakao yağı ayrışır.",
      "Erimiş çikolataya soğuk sıvı damlatmayın; karışım hemen kristalleşir, pürüzlü olur.",
      "Kalıpta soğumaya bırakırken kabı hafifçe tezgaha vurmak hava kabarcıklarını yüzeye çıkarır.",
    ],
  },
  {
    name: "caramel-dry-watch",
    match: (_, s) => s.hasCaramel,
    variants: [
      "Karameli karıştırmadan, tencereyi sallayarak renk alın; karıştırmak şekerin kristalleşmesine yol açar.",
      "Şeker amberleşmeye başladığında ateşi hemen kısın; renk saniyeler içinde yanığa döner.",
      "Karameli sıvıya eklerken sıçramaması için eldiven takın, önce azar azar ısınmış sıvı ekleyin.",
    ],
  },
  {
    name: "cocktail-dilution",
    match: (r, _) => r.type === "KOKTEYL",
    variants: [
      "Buzu bir bütün büyük küp olarak kullanırsanız kokteyl yavaş seyrelir, tat sürgününden kaçarsınız.",
      "Shake yapıyorsanız en az 12 saniye; kısa shake ne soğutur ne karıştırır.",
      "Kırılmış buz koktelin sulanma hızını arttırır; gin-tonic gibi uzun içeceklerde katı küp tercih edin.",
    ],
  },
  {
    name: "beverage-infusion",
    match: (r, _) => r.type === "ICECEK",
    variants: [
      "Meyveyi şekerle önce 10 dakika bekletmek suyunu bırakmasını sağlar, içeceğin özü koyulaşır.",
      "İçeceği servis etmeden önce süzüp berrak tutmak sunumu düzenler; tortu bardağın dibinde kalır.",
      "Soğuk servis edilecekse karışımı buzdolabında en az 2 saat dinlendirmek aromanın oturmasını sağlar.",
    ],
  },
  {
    name: "stew-simmer-low",
    match: (r, s) => r.type === "YEMEK" && s.technique === "tencere",
    variants: [
      "Ağır ağır ve kısık ateşte pişirmek dokuyu yumuşatır; kaynama kabarıkları küçük olmalı.",
      "Tencereye kapak koyarken hafif aralık bırakın; basınç yerine buhar yönetimi sağlar, taşmayı engeller.",
      "Pişmenin son 10 dakikasını kapaksız sürdürürseniz sıvı koyulaşır, tat yoğunlaşır.",
    ],
  },
  {
    name: "salad-chill",
    match: (r, _) => r.type === "SALATA" || r.categorySlug.includes("salata"),
    variants: [
      "Malzemeleri doğrayıp sosu en son ekleyin; önce karıştırırsanız salatalık ve domates su bırakır, kase sulanır.",
      "Tuzu servise yakın serpmek yaprakların dirilik kazanmasını sağlar; erken tuzlamak yaprakları soldurur.",
      "Soğuk servis için malzemeleri doğramadan önce buzlu suda 2 dakika bekletin, çıtırlık korunur.",
      "Limon ve zeytinyağını ayrı kasede çırpıp emülsiyon haline getirip salataya döküm yapmak dağılımı dengeler.",
    ],
  },
  {
    name: "herb-finish",
    match: (r, s) => s.hasHerb && r.type !== "SALATA",
    variants: [
      "Taze otları pişmenin son dakikasında ekleyin; uzun ısı maydanoz, dereotu, nane gibi otların aromasını söndürür.",
      "Ot saplarını atmayın, pişme suyuna atıp çıkarırsanız tada arka plan katar.",
      "Otları kıymadan önce çok kuru olmasına dikkat edin; ıslak yaprak aroma yerine acılık bırakır.",
    ],
  },
  {
    name: "egg-scramble-low",
    match: (_, s) => s.hasEgg,
    variants: [
      "Yumurtayı kısık ateşte sürekli karıştırmak kremamsı dokuyu verir; yüksek ateş hücreleri sertleştirir.",
      "Yumurtayı sıvı yerine bir parça tereyağda pişirmek iç dokuyu nemli tutar.",
      "Tuzu yumurta piştikten sonra eklemek dokusunu yumuşak bırakır, çiğken tuzlamak nemi çeker.",
    ],
  },
  {
    name: "fallback-short",
    match: (_, s) => s.isShort,
    variants: [
      "Hazırlık kısa olsa da malzemeleri soğuk sudan geçirmeden önce kuru alır, tavaya sapa sapa değil tek tabakada serersiniz.",
      "Kısa süreli pişimde ateşi ortaya almak çiğ kalmayı engeller, yüksek ateş dışı yakar.",
      "Mise en place hazır tutulursa kısa süreli tariflerde lezzet dengesi kurulur, karışım bekletmeden tamamlanır.",
    ],
  },
  {
    name: "fallback-long",
    match: (_, s) => s.isLong,
    variants: [
      "Uzun pişimde ara ara karıştırmak tabanın tutmasını ve karamel tabakanın yanmasını engeller.",
      "Uzun pişimin ortasında tuz tadına bakıp son damlayı ayarlayın; buharlaşma sıvıyı yoğunlaştırır.",
      "Uzun süreli tencere yemekleri bir gün dinlendirilince tat daha belirgin olur, ertesi gün servis daha doyurucu.",
    ],
  },
  {
    name: "fallback-generic",
    match: () => true,
    variants: [
      "Pişmeye başlamadan önce tüm malzemeleri doğrayıp tezgahta dizmek tat dengesini bozmadan akışı korur.",
      "Ocaktan aldıktan sonra 3 dakika dinlendirmek aroma bileşenlerinin birleşmesine zaman tanır.",
      "Tuzu parça parça ekleyip ara tadışlar almak son adımda fazla tuzdan dönüşsüz sonuca kapı kapatır.",
    ],
  },
];

interface ServRule {
  name: string;
  match: (r: RecipeSignal, s: ExtractedSignals) => boolean;
  variants: string[];
}

const SERV_RULES: ServRule[] = [
  // Type-based rules FIRST (specific content class beats ingredient hints)
  {
    name: "soup-basic",
    match: (r, _) => r.type === "CORBA",
    variants: [
      "Yanına limon dilimi ve közlenmiş biber, üstünde bir fiske pul biberle sıcak tabakta verin.",
      "Çorbayı derin kaseye boşaltıp üzerine eritilmiş tereyağında kavurulmuş nane dökün.",
      "Yanına ızgara lavaş veya simit dilimleri ve soğuk cacık koyarak tamamlayın.",
      "Küçük bir kase yoğurt, yanında maydanoz yaprakları ve bir limon dilimiyle sunun.",
      "Taze doğranmış dereotu ve bir damla zeytinyağıyla sunum kurun, yanına kıtır ekmek iliştirin.",
      "Çorbayı ince uzun kaselere alıp yanına turşu tabağı koyun, küçük bir kase pul biber ayrı dursun.",
      "Üzerine rendelenmiş eski kaşar ve ince doğranmış taze nane yerleştirerek sunum kurun.",
      "Yanına çıtır bruşetta ve sarımsaklı yoğurt sosu koyup kışlık tabak kurgulayın.",
      "Porselen derin kaseye boşaltıp kenarına haşlanmış bir dilim yumurta ve taze soğan koyun.",
    ],
  },
  {
    name: "dessert-chilled",
    match: (r, _) => r.type === "TATLI",
    variants: [
      "Buzdolabından çıkarıp 10 dakika oda sıcaklığında bekletip yanına bir fincan Türk kahvesiyle sunun.",
      "Tabak kenarına taze meyve dilimleri ve bir yaprak nane yerleştirip soğuk olarak verin.",
      "Üstüne bir parça fıstık tozu veya ince tarçın gezdirip porselen tabakta servis yapın.",
      "Soğuk servis etmeden önce küçük dilimlere bölün; tabağın yanına sade bir kaşık krema koyun.",
      "Üstüne iri kıyılmış çiğ fındık ve bir damla gül suyuyla sunum kurun.",
      "Altına bir kaşık vişne reçeli, yanına soğuk süt bardağı koyarak çocuklu sofralara hazırlayın.",
      "Buzdolabında bekletmiş tabakta tek porsiyon olarak, yanına demli ıhlamur fincanıyla verin.",
      "Üstüne ince çekilmiş kakao ve iri kıyılmış Antep fıstığı gezdirip küçük porsiyon tabağında sunun.",
      "Yanına kuru incir dilimi ve bir kaşık yoğurtla kontrastlı tadım tabağı oluşturun.",
    ],
  },
  {
    name: "beverage-cold",
    match: (r, _) => r.type === "ICECEK" || r.type === "KOKTEYL",
    variants: [
      "Yüksek ince bardakta buzla birlikte verin, bardağın kenarını limon kabuğuyla gezdirip süsleyin.",
      "Kısa genişçe bir bardakta, üstüne taze meyve veya otlardan bir tutamla sunun.",
      "Şeffaf sürahide sunmak içeceğin rengini öne çıkarır, bardakları yanına ayrı dizin.",
      "Bardağın ağzını tuz veya şekerle kaplayıp (rim) süsleyin, içine dik bir kamış koyun.",
      "Tahta tepsiye buzlu bardağı, yanına limon dilimleri ve taze nane sapıyla sunum kurun.",
      "Soğuk içecek için 1 saat önceden bardakları buzdolabında bekletin; sıcak camda aroma zayıflar.",
      "Kısa köpüklü bardakta, üstüne ince rende muskat gezdirip Avrupai bir sunum verin.",
      "Üzerine bir dilim taze zencefil ve küçük bir yaprak fesleğen ekleyip aromayı canlandırın.",
    ],
  },
  {
    name: "breakfast",
    match: (r, _) => r.type === "KAHVALTI" || r.categorySlug.includes("kahvalti"),
    variants: [
      "Taze ekmek, zeytin ve beyaz peynirle birlikte tabakta verin; yanına demli çay eşlik etsin.",
      "Kahvaltı tabağında domates, salatalık, yeşillik ve bir fincan sade kahveyle tamamlayın.",
      "Sıcak servis edip yanına bal, kaymak ve tereyağlı simit dilimleri koyun.",
      "Sahan tabakta, yanına taze kıyılmış nane ve bir kase zeytinyağlı yoğurtla verin.",
      "Tahta tepsiye yerleştirip bir sürahi portakal suyu ve karmaşık tane ekmek dilimleri ekleyin.",
      "Yanına közlenmiş biber, salatalık turşusu ve sıcak çörek dilimleriyle serpintisiz sunum kurun.",
      "Kişi başı küçük tava, yanında taze maydanoz ve dilimlenmiş tereyağıyla geleneksel kahvaltı kurgula.",
      "Tabakta yumurta, peynir, bal-kaymak üçlüsü ve bir bardak sıcak sahlep eşlik ettiğinde tamamlanır.",
    ],
  },
  {
    name: "salad-plate",
    match: (r, _) => r.type === "SALATA" || r.categorySlug.includes("salata"),
    variants: [
      "Derin cam kasede, üzerine bir fiske pul biber ve birkaç damla nar ekşisi gezdirerek servise çıkarın.",
      "Tabakta kümeler halinde dizip üzerine iri dilimlenmiş zeytin ve beyaz peynir ekleyerek sunun.",
      "Soğuk servis için 10 dakika buzdolabında dinlendirin, yanına lavaş ekmek koyun.",
      "Üzerine ince dilimlenmiş turp ve maydanoz yapraklarıyla yaz tabaklarına uygun sunum kurun.",
      "Tabağı tahta masaya koyup yanına ince dilimlenmiş limon ve bir kase sarımsaklı yoğurt iliştirin.",
      "Servis öncesi üzerine sumak ve ince kıyılmış soğan serpip ekşi-tuzlu tabaka oluşturun.",
      "Geniş tabakta tek katman halinde dizip, yanına sıcak pide ve bir kase zeytinyağıyla Akdeniz usulü sunun.",
      "Kenara iri kıyılmış ceviz içi ve nar taneleri ekleyerek kış salatası sunumu hazırlayın.",
    ],
  },
  {
    name: "aperatif-mezze",
    match: (r, _) =>
      r.type === "APERATIF" ||
      r.categorySlug.includes("meze") ||
      r.categorySlug.includes("aperatif"),
    variants: [
      "Tabakta küçük kaselerde veya ayrı bölümlerde sunun; yanına limon dilimi, taze ekmek ve bir kase zeytin yerleştirin.",
      "Oda sıcaklığında servis edin, tadını öne çıkarır; yanına kıtır ekmek veya lavaş dilimleri koyun.",
      "Üzerine sızma zeytinyağı ve pul biber gezdirip küçük derin tabakta mezelik sunum kurun.",
      "Ahşap tepside 3-4 meze bir arada sunmak için yanına acılı ezme ve kısırla eşleştirin.",
      "Üzerine kavrulmuş çam fıstığı ve taze kıyılmış dereotu serpip Ege sofrası kurgusu yapın.",
      "Yanına turşu tabağı, zeytin ezmesi ve sıcak ekmekle meyhane usulü sofra tamamlayın.",
      "Küçük cam kaselerde tabağın ortasına yerleştirip etrafına közlenmiş sebze dilimleri dizin.",
    ],
  },
  // Ingredient/technique-based rules AFTER (for YEMEK/SOS/ATISTIRMALIK types)
  {
    name: "grill-meat",
    match: (_, s) => s.hasMeat && s.technique === "mangal",
    variants: [
      "Lavaş üzerine yerleştirip üzerine sumaklı soğan, közlenmiş biber ve maydanozla birlikte verin.",
      "Yanına ayran ve roka salatası eşlik ederse mangal aroması dengelenir.",
      "Közlenmiş domates ve ince bulgur pilavıyla tabakta sunum kurun.",
    ],
  },
  {
    name: "chicken-main",
    match: (_, s) => s.hasChicken,
    variants: [
      "Pirinç pilavı veya buharı çekmiş bulgurla birlikte, yanında limonlu yeşillik karışımıyla tamamlayın.",
      "Tabakta pembesi tabaka halinde dilimleyip üstüne pişme suyundan iki kaşık dökün.",
      "Yanına patates püresi ve karamelize soğan koyarak tavuk ızgarayı öne çıkarın.",
      "Sıcak lavaşa sararak dürüm usulü yapın, yanına sumaklı soğan ve közlenmiş biberle sunun.",
      "Tavuğu sıcak sosunun içinde bırakıp yanına ince kesilmiş yeşil yaprak salatayla verin.",
      "Pilav tabağının üstüne yerleştirip kenarına kızarmış pide dilimleri koyun.",
    ],
  },
  {
    name: "fish-plate",
    match: (_, s) => s.hasFish,
    variants: [
      "Taze limon ve roka ile soğumadan masaya götürün, yanına ılık patates eşlik etsin.",
      "Deniz tuzu, zeytinyağı ve doğranmış dereotu üzerine gezdirip limon dilimleriyle süsleyin.",
      "Pilav yerine buğulanmış yeşil fasulyeyle tamamlayın, tabak hafif kalsın.",
      "Yanına mevsim salatası ve kısırla verin; beyaz porselen tabakta renk kontrastı güzel durur.",
      "Üzerine ince dilimlenmiş soğan ve nar taneleriyle İstanbul meyhanesi sunumu hazırlayın.",
      "Domatesli pilavla ve közlenmiş yeşil biberle birlikte, yanında bir kase yoğurtla tamamlayın.",
    ],
  },
  {
    name: "legume-bowl",
    match: (_, s) => s.hasLegume,
    variants: [
      "Yanına bulgur pilavı ve turşu koyarak derin kasede verin; üzerine pul biber gezdirin.",
      "Üzerine yoğurt kaşığı ve bol maydanozla birlikte ılıklığında sunun.",
      "Yanına karamelize soğan ve ızgara ekmek dilimleriyle destekleyin, protein dengesi kurulsun.",
      "Sıcak pide dilimleri ve közlenmiş biberle, üstüne bir kaşık tereyağı gezdirerek tamamlayın.",
      "Limon dilimi ve taze nane yapraklarını iliştirip derin çorba kasesine koyun.",
      "Yanına közlenmiş domates ve sumaklı soğan eklemek ekşi-tuzlu dengeyi kurar.",
    ],
  },
  {
    name: "pasta-plate",
    match: (_, s) => s.hasPasta,
    variants: [
      "Rendelenmiş parmesan ve taze fesleğen yapraklarıyla sıcak servis edin.",
      "Yanına yeşil yapraklı bir salata koyun, üzerine bol zeytinyağı ve balzamik gezdirin.",
      "Tabağın yanına bir parça kıtır ekmek koyup sosun sıyrılmasını tamamlayın.",
      "Derin çanakta, üzerine bir fiske pul biber ve ince kıyılmış maydanoz ekleyip sıcak sunun.",
      "Yanına sarımsaklı kıtır ekmek ve soğuk beyaz şarap eşliğinde akşam tabağı kurun.",
      "Porselen tabakta, üzerine ince rende kaşar ve bir damla zeytinyağıyla tamamlayın.",
    ],
  },
  {
    name: "rice-side",
    match: (_, s) => s.hasRice,
    variants: [
      "Yanına cacık ve közlenmiş biber, üstüne tereyağında kavrulmuş fıstıkla tabakta verin.",
      "Derin kaseye boşaltıp küçük bir kase yoğurt ve maydanoz dalıyla sunun.",
      "Kıtır soğan halkaları ve limon dilimleriyle yanından çevirerek servis yapın.",
      "Üzerine kavrulmuş dolmalık fıstık ve kuş üzümü serpip Osmanlı sofrası sunumu hazırlayın.",
      "Yanına közlenmiş sivri biber ve tuzlu yoğurtla ılık servis için tabakta düzenleyin.",
      "Üzerine ince dilimlenmiş taze soğan ve bir kaşık tereyağı gezdirerek parlaklık verin.",
    ],
  },
  {
    name: "vegetable-fallback",
    match: (r, _) => r.categorySlug.includes("sebze"),
    variants: [
      "Yanına yoğurt veya cacık ve birkaç dilim limonla, hafif ılık serin.",
      "Taze dereotu ve zeytinyağıyla porselen tabakta soğuk tüketin; lezzet ertesi gün daha derin olur.",
      "Sıcak pide veya lavaşla birlikte tabakta sunun, üstüne bir kaşık tahin tarator düşünülebilir.",
      "Geniş servis tabağında, üstüne sızma zeytinyağı ve limon kabuğu rendesi gezdirerek ılık servis edin.",
      "Yanına kısa kırılmış arpa ekmeği ve bir kase sarımsaklı yoğurtla Ege sunumu hazırlayın.",
      "Soğuk bekletip ertesi gün derin tabağa alıp üzerine taze fesleğen yaprağı ekleyerek servis edin.",
    ],
  },
  {
    name: "fallback-warm",
    match: () => true,
    variants: [
      "Taze dilimlenmiş ekmek ve yanında mevsim yeşillikleriyle derin tabakta verin.",
      "Servis tabağının kenarına limon dilimi ve maydanoz dalları yerleştirerek renk ekleyin.",
      "Porselen tabakta, üzerine bir tutam taze ot ve zeytinyağı gezdirerek ılık sunun.",
      "Yanına sıcak ekmek ve bir kase turşu iliştirip geleneksel tabağa dönüştürün.",
      "Üzerine taze soğan halkaları ve ince kıyılmış maydanozla renk katarak tabağı tamamlayın.",
      "Kenara közlenmiş biber ve ince dilimlenmiş limon koyarak ev sofrası tabağı kurgulayın.",
      "Geniş porselen tabakta, yanına yoğurtlu bir sos ve bir bardak ayran eşliğinde servis yapın.",
    ],
  },
];

// ── 3. VARIATE ─────────────────────────────────────────────────────────

/** djb2 hash, deterministic seed. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic variant pick. Seed slug + rule + first 2 ingredient
 * names ile zenginleştirilir; bu aynı rule'a düşen tariflerin
 * ingredient karışımına göre farklı variant'a düşmesini sağlar,
 * uniform dağılımı iyileştirir.
 */
function pickVariant(
  slug: string,
  name: string,
  variants: string[],
  salt: string = "",
): string {
  const seed = djb2(slug + "::" + name + "::" + salt);
  return variants[seed % variants.length];
}

// ── Public API ─────────────────────────────────────────────────────────

export interface GenerateResult {
  tipNote: string;
  tipRule: string;
  servingSuggestion: string;
  servRule: string;
}

export function generate(r: RecipeSignal): GenerateResult {
  const s = extractSignals(r);

  let tipRule = "fallback-generic";
  let tipVariants = TIP_RULES[TIP_RULES.length - 1].variants;
  for (const rule of TIP_RULES) {
    if (rule.match(r, s)) {
      tipRule = rule.name;
      tipVariants = rule.variants;
      break;
    }
  }

  let servRule = "fallback-warm";
  let servVariants = SERV_RULES[SERV_RULES.length - 1].variants;
  for (const rule of SERV_RULES) {
    if (rule.match(r, s)) {
      servRule = rule.name;
      servVariants = rule.variants;
      break;
    }
  }

  // Salt = first 2 ingredient names (when present), improves dispersion
  // for recipes landing in the same rule family.
  const salt = (r.ingredients.slice(0, 2).join("|") || "none").toLowerCase();

  return {
    tipNote: pickVariant(r.slug, tipRule, tipVariants, salt),
    tipRule,
    servingSuggestion: pickVariant(r.slug, servRule, servVariants, salt),
    servRule,
  };
}
