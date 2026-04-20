/**
 * Cuisine constants and inference logic. Single source of truth for the
 * 14 supported cuisine codes, their labels, and the rule-based inference
 * engine used by `scripts/retrofit-cuisine.ts` to tag existing recipes.
 *
 * Design: `cuisine` is a `String?` on Recipe (not a Prisma enum) so
 * adding new cuisines (Vietnamese, Brazilian, Scandinavian…) does not
 * require a migration, only this file and the Zod schema need updating.
 */

export const CUISINE_CODES = [
  "tr",
  "it",
  "fr",
  "es",
  "gr",
  "jp",
  "cn",
  "kr",
  "th",
  "in",
  "mx",
  "us",
  "me",
  "ma",
  "vn",
  "br",
  "cu",
  "ru",
  "hu",
  "se",
  "pe",
  "gb",
  "pl",
  "au",
] as const;

export type CuisineCode = (typeof CUISINE_CODES)[number];

export const CUISINE_LABEL: Record<CuisineCode, string> = {
  tr: "Türk",
  it: "İtalyan",
  fr: "Fransız",
  es: "İspanyol",
  gr: "Yunan",
  jp: "Japon",
  cn: "Çin",
  kr: "Kore",
  th: "Tay",
  in: "Hint",
  mx: "Meksika",
  us: "ABD",
  me: "Orta Doğu",
  ma: "Kuzey Afrika",
  vn: "Vietnam",
  br: "Brezilya",
  cu: "Küba",
  ru: "Rus",
  hu: "Macar",
  se: "İskandinav",
  pe: "Peru",
  gb: "İngiliz",
  pl: "Polonya",
  au: "Avustralya",
};

/**
 * URL slug map, kod → Türkçe URL parçası. `/mutfak/[slug]` programatik
 * landing route'u bu slug'ları bekler. Label'den türetilmez (Türk → turk
 * gibi noktalama kayıpları riskli); sabit listede tutulur. Yeni cuisine
 * eklenince 4 map'e de entry eklenir (CODE, LABEL, FLAG, SLUG, DESCRIPTION).
 */
export const CUISINE_SLUG: Record<CuisineCode, string> = {
  tr: "turk",
  it: "italyan",
  fr: "fransiz",
  es: "ispanyol",
  gr: "yunan",
  jp: "japon",
  cn: "cin",
  kr: "kore",
  th: "tay",
  in: "hint",
  mx: "meksika",
  us: "abd",
  me: "orta-dogu",
  ma: "kuzey-afrika",
  vn: "vietnam",
  br: "brezilya",
  cu: "kuba",
  ru: "rus",
  hu: "macar",
  se: "iskandinav",
  pe: "peru",
  gb: "ingiliz",
  pl: "polonya",
  au: "avustralya",
};

/** URL slug → kod ters lookup. Slug bilinmiyorsa null. */
export function cuisineCodeBySlug(slug: string): CuisineCode | null {
  const entry = (
    Object.entries(CUISINE_SLUG) as [CuisineCode, string][]
  ).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

/**
 * Mutfak landing sayfaları için TR açıklama metinleri, SEO + kullanıcı
 * değeri. Her biri 2-3 cümle, mutfağın karakteristik vurgusu + Tarifle
 * platformundaki öne çıkan tarif örneği tipinden. Generic "X tarifleri"
 * yerine okunabilir açıklama.
 */
export const CUISINE_DESCRIPTION_TR: Record<CuisineCode, string> = {
  tr: "Türk mutfağı; çorbasından kebabına, zeytinyağlısından tatlısına Anadolu'nun yedi bölgesini bir araya getirir. Ev pişirmesine özgü dengeler, bulgur, yoğurt, acı biber ve tereyağı, her tarifin temelini oluşturur.",
  it: "İtalyan mutfağı sadelikle yoğun tadı aynı anda sunar: pasta, pizza, risotto ve soğuk antipasti. Taze malzeme + az ama doğru baharat Akdeniz lezzet çizgisinin temeli.",
  fr: "Fransız mutfağı tekniği ön plana çıkaran klasikleri barındırır: tereyağlı soslar, hamur işleri, yavaş pişen güveçler. Boeuf bourguignon'dan macaroon'a, mutfak okullarının da referansı.",
  es: "İspanyol mutfağı paellanın safranı, gazpachonun serinliği ve tapasların çeşitliliği ile çalışır. Zeytinyağı, acılı paprika ve deniz ürünleri İber yarımadasının imzası.",
  gr: "Yunan mutfağı Akdeniz'in en saf yüzünü gösterir: tulum peyniri, zeytinyağı, limon, kekik. Moussaka, souvlaki, spanakopita, ev sofralarına hızla uyarlanır.",
  jp: "Japon mutfağı denge ve saygı üzerine kurulu: sushi, ramen, tempura, miso çorbası. Az malzeme + temiz teknik = umami dengesi.",
  cn: "Çin mutfağı sekiz büyük bölgenin yüzlerce tarzını kapsar: mapo tofu, kung pao tavuk, dumpling, fried rice. Wok kullanımı ve soya temelli soslar ortak noktası.",
  kr: "Kore mutfağı fermente lezzetlerin merkezi: kimchi, bibimbap, bulgogi, tteokbokki. Acı biber ezmesi gochujang neredeyse her tarifte yerini alır.",
  th: "Tay mutfağı acı-tatlı-ekşi-tuzlu dengesini tek tabakta kurar: pad thai, green curry, tom yum. Hindistan cevizi sütü, limon otu ve Tay fesleğeni aromaları taşır.",
  in: "Hint mutfağı baharat zenginliğiyle tanınır: butter chicken, biryani, dal, samosa. Her bölgenin kendi masala karışımı var, kuzey kremalı, güney hindistan cevizli.",
  mx: "Meksika mutfağı mısır ve acı biber üzerine kurulu: taco, enchilada, guacamole, pozole. Taze corriander, limon ve chipotle karakterini tamamlar.",
  us: "ABD mutfağı göç eden halkların birleşimini yansıtır: burger, BBQ, mac & cheese, cheesecake. Soul food, Tex-Mex ve New England klasikleri bir arada.",
  me: "Orta Doğu mutfağı zengin baharat + sağlıklı tahıllar: hummus, falafel, tabbouleh, kebap. Zeytinyağı, nar ekşisi, sumak ortak dili.",
  ma: "Kuzey Afrika mutfağı tajine'nin yavaş pişirmesini, kuskusun dokusunu ve harissa'nın acısını bir araya getirir. Fas, Tunus ve Cezayir'in mutfak mirası.",
  vn: "Vietnam mutfağı ferahlık üzerine kurulu: pho, banh mi, bun cha, goi cuon. Taze otlar (nane, coriander, fesleğen) ve balık sosu temel aromalar.",
  br: "Brezilya mutfağı tropikal lezzetler ve Afrika etkisi taşır: feijoada, pão de queijo, moqueca, brigadeiro. Manyok, hindistan cevizi sütü ve dendê yağı karakteristik.",
  cu: "Küba mutfağı İspanyol + Karayip sentezi: ropa vieja, arroz con pollo, yuca con mojo, flan. Sarımsak, kimyon, acı biber ve limon ezmesi (mojo) imzası.",
  ru: "Rus mutfağı soğuk kışlara göre tasarlanmış yoğun tatlar: borscht, pelmeni, blini, stroganoff. Turşulanmış sebzeler, krema ve karabuğday günlük masanın parçası.",
  hu: "Macar mutfağı paprika başkenti: goulash, chicken paprikash, lángos, dobos torte. Dumplings, yoğun soslar ve tatlı-tuzlu denge Orta Avrupa imzası.",
  se: "İskandinav mutfağı sadeliği ve deniz ürünlerini ön plana çıkarır: köttbullar, gravlax, smörgåsbord, kanelbullar. Dereotu, hardal ve soğuk tütsü yaygın.",
  pe: "Peru mutfağı And tarihi + Pasifik sahilini birleştirir: ceviche, lomo saltado, aji de gallina, causa. Limon, acı biber aji ve mor patates karakteristik.",
  gb: "İngiliz mutfağı ev rahatlığı klasikleri: fish and chips, shepherd's pie, full breakfast, scones. Hafta sonu roast dinner ve five o'clock tea geleneksel.",
  pl: "Polonya mutfağı doyurucu ve tahıl-etli: pierogi, bigos, żurek, placki ziemniaczane. Turşulanmış sebzeler, kapuska ve ekşi krema sofranın sabiti.",
  au: "Avustralya mutfağı deniz ürünleri, BBQ kültürü ve güçlü kahve ekosistemi. Meat pie, lamington, avocado toast, Vegemite, İngiliz mirası üzerine modern Avustralya.",
};

/** EN description, aynı set, kısa SEO metni. */
export const CUISINE_DESCRIPTION_EN: Record<CuisineCode, string> = {
  tr: "Turkish cuisine brings Anatolia's seven regions together: soups, kebabs, olive-oil dishes, and desserts. The home-cooking balance of bulgur, yogurt, chili and butter underpins every recipe.",
  it: "Italian cuisine pairs simplicity with deep flavor, pasta, pizza, risotto and cold antipasti. Fresh ingredients and restrained seasoning define the Mediterranean line.",
  fr: "French cuisine centers on technique: buttery sauces, pastries, slow-cooked stews. From boeuf bourguignon to macarons, the reference of culinary schools worldwide.",
  es: "Spanish cuisine delivers paella's saffron, gazpacho's cool and tapas variety. Olive oil, smoked paprika and seafood are the Iberian signature.",
  gr: "Greek cuisine shows the Mediterranean's purest face: feta, olive oil, lemon, oregano. Moussaka, souvlaki, spanakopita, quick to adapt at home.",
  jp: "Japanese cuisine is built on balance and respect: sushi, ramen, tempura, miso soup. Few ingredients + clean technique = the umami equation.",
  cn: "Chinese cuisine covers eight regional styles and hundreds of variants: mapo tofu, kung pao chicken, dumplings, fried rice. The wok and soy-based sauces are the thread.",
  kr: "Korean cuisine is a fermentation hub: kimchi, bibimbap, bulgogi, tteokbokki. The chili paste gochujang appears in nearly every dish.",
  th: "Thai cuisine nails the spicy-sweet-sour-salty balance in one plate: pad thai, green curry, tom yum. Coconut milk, lemongrass and Thai basil carry the aroma.",
  in: "Indian cuisine is defined by spice depth: butter chicken, biryani, dal, samosa. Every region has its own masala, creamy in the north, coconut-forward in the south.",
  mx: "Mexican cuisine is built on corn and chili: tacos, enchiladas, guacamole, pozole. Fresh cilantro, lime and chipotle round out the character.",
  us: "American cuisine reflects the immigration mix: burgers, BBQ, mac & cheese, cheesecake. Soul food, Tex-Mex and New England classics sit side by side.",
  me: "Middle Eastern cuisine ties rich spices with healthy grains: hummus, falafel, tabbouleh, kebabs. Olive oil, pomegranate molasses and sumac are the shared tongue.",
  ma: "North African cuisine joins tajine's slow cook, couscous texture and harissa heat. The culinary heritage of Morocco, Tunisia and Algeria.",
  vn: "Vietnamese cuisine rides on freshness: pho, banh mi, bun cha, goi cuon. Fresh herbs (mint, coriander, basil) and fish sauce form the core.",
  br: "Brazilian cuisine carries tropical and African notes: feijoada, pão de queijo, moqueca, brigadeiro. Cassava, coconut milk and dendê oil are signature.",
  cu: "Cuban cuisine is a Spanish + Caribbean blend: ropa vieja, arroz con pollo, yuca con mojo, flan. Garlic, cumin, chili and citrus mojo are the signature.",
  ru: "Russian cuisine suits cold winters with rich flavors: borscht, pelmeni, blini, stroganoff. Pickled vegetables, cream and buckwheat are on the daily table.",
  hu: "Hungarian cuisine is the paprika capital: goulash, chicken paprikash, lángos, dobos torte. Dumplings, rich sauces and a sweet-salty balance are the Central European stamp.",
  se: "Scandinavian cuisine leans on simplicity and seafood: köttbullar, gravlax, smörgåsbord, kanelbullar. Dill, mustard and cold-smoke are common.",
  pe: "Peruvian cuisine joins Andean heritage with the Pacific coast: ceviche, lomo saltado, aji de gallina, causa. Lime, aji chili and purple potato are core.",
  gb: "British cuisine offers home-comfort classics: fish and chips, shepherd's pie, full breakfast, scones. Weekend roast dinners and five o'clock tea are tradition.",
  pl: "Polish cuisine is hearty and grain-forward: pierogi, bigos, żurek, potato pancakes. Pickles, sauerkraut and sour cream stay on the table.",
  au: "Australian cuisine blends seafood, BBQ culture and strong coffee. Meat pie, lamington, avocado toast, Vegemite, modern Australia on a British base.",
};

export const CUISINE_FLAG: Record<CuisineCode, string> = {
  tr: "🇹🇷",
  it: "🇮🇹",
  fr: "🇫🇷",
  es: "🇪🇸",
  gr: "🇬🇷",
  jp: "🇯🇵",
  cn: "🇨🇳",
  kr: "🇰🇷",
  th: "🇹🇭",
  in: "🇮🇳",
  mx: "🇲🇽",
  us: "🇺🇸",
  me: "🌍",
  ma: "🌍",
  vn: "🇻🇳",
  br: "🇧🇷",
  cu: "🇨🇺",
  ru: "🇷🇺",
  hu: "🇭🇺",
  se: "🇸🇪",
  pe: "🇵🇪",
  gb: "🇬🇧",
  pl: "🇵🇱",
  au: "🇦🇺",
};

// ─── Inference engine ───────────────────────────────────────

/**
 * Slug-level matches, highest confidence. These are dish names that
 * unambiguously belong to a single cuisine. Checked as substring of
 * the recipe slug (lowercase, ASCII, hyphenated).
 */
const SLUG_PATTERNS: readonly { cuisine: CuisineCode; patterns: string[] }[] = [
  // Japanese
  {
    cuisine: "jp",
    patterns: [
      "sushi", "ramen", "tempura", "teriyaki", "miso", "udon", "soba",
      "onigiri", "gyoza", "edamame", "tonkotsu", "takoyaki", "okonomiyaki",
      "katsu", "matcha", "mochi", "yakitori",
    ],
  },
  // Korean
  {
    cuisine: "kr",
    patterns: [
      "kimchi", "bibimbap", "bulgogi", "japchae", "tteokbokki", "gochujang",
      "kimbap", "galbi", "sundubu", "jjigae", "bossam",
    ],
  },
  // Thai
  {
    cuisine: "th",
    patterns: [
      "pad-thai", "tom-yum", "tom-kha", "massaman", "panang", "som-tam",
      "satay", "larb", "khao", "pad-kra",
    ],
  },
  // Indian
  {
    cuisine: "in",
    patterns: [
      "tikka", "masala", "biryani", "dal", "samosa", "naan", "tandoori",
      "paneer", "korma", "vindaloo", "chutney", "lassi", "chai",
      "pakora", "butter-chicken",
    ],
  },
  // Mexican
  {
    cuisine: "mx",
    patterns: [
      "taco", "burrito", "enchilada", "quesadilla", "guacamole", "churro",
      "fajita", "nachos", "pozole", "tamale", "elote", "salsa-verde",
      "mole", "ceviche-meksika",
    ],
  },
  // Italian
  {
    cuisine: "it",
    patterns: [
      "pizza", "risotto", "carbonara", "bolognese", "bruschetta", "tiramisu",
      "panna-cotta", "focaccia", "gnocchi", "lasagna", "minestrone",
      "pesto", "antipasto", "arancini", "osso-buco", "prosciutto",
      "calzone", "cannoli", "affogato", "caprese",
    ],
  },
  // French
  {
    cuisine: "fr",
    patterns: [
      "ratatouille", "quiche", "crepe", "croissant", "souffle", "bouillabaisse",
      "brioche", "bechamel", "bearnaise", "eclair", "macaron", "tarte-tatin",
      "coq-au-vin", "creme-brulee", "gratin", "nicoise",
    ],
  },
  // Spanish
  {
    cuisine: "es",
    patterns: [
      "paella", "gazpacho", "churros", "patatas-bravas", "tortilla-espanola",
      "croquetas", "sangria", "tapas", "pimientos",
    ],
  },
  // Greek
  {
    cuisine: "gr",
    patterns: [
      "moussaka", "tzatziki", "souvlaki", "gyros", "spanakopita",
      "baklava-yunan", "dolma-yunan", "feta", "horiatiki",
    ],
  },
  // Chinese
  {
    cuisine: "cn",
    patterns: [
      "wonton", "dim-sum", "chow-mein", "kung-pao", "mapo-tofu",
      "spring-roll", "char-siu", "pekin", "szechuan", "bao",
      "fried-rice-cin", "dumplings",
    ],
  },
  // American
  {
    cuisine: "us",
    patterns: [
      "burger", "bbq", "mac-and-cheese", "brownie", "pancake",
      "cornbread", "buffalo", "jambalaya", "cajun", "cheesecake",
      "cookie", "smoothie-bowl",
    ],
  },
  // Middle Eastern
  {
    cuisine: "me",
    patterns: [
      "hummus", "falafel", "tabbouleh", "fattoush", "baba-gannush",
      "shawarma", "kibbeh", "muhammara", "labneh", "manakish",
    ],
  },
  // North African
  {
    cuisine: "ma",
    patterns: [
      "shakshuka", "harissa", "couscous", "tagine", "merguez",
      "pastilla", "chermoula", "msemen", "zaalouk",
    ],
  },
  // Vietnamese
  {
    cuisine: "vn",
    patterns: [
      "pho", "banh-mi", "goi-cuon", "bun-cha", "banh-xeo",
      "cha-gio", "com-tam", "bo-luc-lac", "bun-bo", "cao-lau",
      "banh-cuon", "nem", "vietnam",
    ],
  },
  // Brazilian
  {
    cuisine: "br",
    patterns: [
      "feijoada", "pao-de-queijo", "brigadeiro", "coxinha", "moqueca",
      "picanha", "pastel-brezilya", "quindim", "farofa", "acai",
      "caipirinha", "tapioca-brezilya",
    ],
  },
  // Cuban
  {
    cuisine: "cu",
    patterns: [
      "ropa-vieja", "medianoche", "arroz-congri", "tostones",
      "cubano", "mojito", "vaca-frita", "yuca",
    ],
  },
  // Russian
  {
    cuisine: "ru",
    patterns: [
      "borscht", "pelmeni", "olivier", "syrniki", "blini",
      "stroganoff", "pirozhki", "kvass", "shchi",
    ],
  },
  // Hungarian
  {
    cuisine: "hu",
    patterns: [
      "paprikash", "langos", "dobos", "goulash", "gulyas",
      "kurtoskalacs", "lecho", "toltott",
    ],
  },
  // Scandinavian
  {
    cuisine: "se",
    patterns: [
      "gravlax", "smorgasbord", "kanelbulle", "kottbullar",
      "janssons", "raggmunk", "kroppkakor", "semla",
      "lefse", "lutefisk", "smorrebrod", "frikadeller",
      "fleskesteg", "karjalanpiirakka",
    ],
  },
  // Peruvian
  {
    cuisine: "pe",
    patterns: [
      "pisco-sour", "lomo-saltado", "ceviche-peru", "causa",
      "aji-de-gallina", "anticucho",
    ],
  },
  // British
  {
    cuisine: "gb",
    patterns: [
      "london-fog", "limonlu-posset", "posset", "fish-and-chips",
      "shepherds-pie", "scotch-egg", "bangers-and-mash",
      "yorkshire-pudding", "bakewell-tart", "trifle", "toad-in-the-hole",
      "cottage-pie", "sticky-toffee-pudding",
    ],
  },
  // Polish
  {
    cuisine: "pl",
    patterns: [
      "pierogi", "bigos", "zurek", "kielbasa-polonya",
      "golabki-polonya", "barszcz-polonya", "placki-ziemniaczane",
    ],
  },
  // Australian
  {
    cuisine: "au",
    patterns: [
      "pavlova", "lamington", "vegemite",
      "fairy-bread", "anzac-biscuit",
    ],
  },
];

/**
 * Title/description keyword matches, checked against Turkish text.
 * These are nationality adjectives or explicit cuisine references that
 * appear in recipe titles or descriptions.
 */
const TEXT_KEYWORDS: readonly { cuisine: CuisineCode; keywords: string[] }[] = [
  { cuisine: "jp", keywords: ["japon", "japonya"] },
  { cuisine: "kr", keywords: ["kore"] },
  { cuisine: "th", keywords: ["tay", "tayland"] },
  { cuisine: "in", keywords: ["hint", "hindistan"] },
  { cuisine: "mx", keywords: ["meksika"] },
  { cuisine: "it", keywords: ["italyan", "italya"] },
  { cuisine: "fr", keywords: ["fransız", "fransa"] },
  { cuisine: "es", keywords: ["ispanyol", "ispanya"] },
  { cuisine: "gr", keywords: ["yunan", "yunanistan"] },
  { cuisine: "cn", keywords: ["çin"] },
  { cuisine: "us", keywords: ["amerikan", "amerika"] },
  { cuisine: "me", keywords: ["orta doğu", "ortadoğu", "arap", "lübnan", "suriye"] },
  { cuisine: "ma", keywords: ["kuzey afrika", "fas mutfağı", "fas usulü", "tunus", "cezayir"] },
  { cuisine: "vn", keywords: ["vietnam"] },
  { cuisine: "br", keywords: ["brezilya"] },
  { cuisine: "cu", keywords: ["küba"] },
  { cuisine: "ru", keywords: ["rus mutfağı", "rus usulü", "rusya"] },
  { cuisine: "hu", keywords: ["macar", "macaristan"] },
  { cuisine: "se", keywords: ["iskandinav", "isveç", "norveç", "danimarka", "finlandiya"] },
  { cuisine: "pe", keywords: ["peru", "peru usulü", "peru mutfağı"] },
  { cuisine: "gb", keywords: ["ingiliz", "britanya", "britanyalı"] },
  { cuisine: "pl", keywords: ["polonya", "polonyalı", "polish"] },
  { cuisine: "au", keywords: ["avustralya", "avustralyalı"] },
];

interface InferInput {
  title: string;
  slug: string;
  description: string;
  ingredients: readonly { name: string }[];
}

/**
 * Infer the cuisine code for a recipe. Priority:
 * 1. Slug substring match (highest confidence, dish name is unique)
 * 2. Title keyword match (nationality adjective in title)
 * 3. Description keyword match (nationality adjective in body)
 * 4. Default: "tr" (majority of recipes are Turkish)
 */
export function inferCuisineFromRecipe(recipe: InferInput): CuisineCode {
  const slug = recipe.slug.toLowerCase();

  // 1. Slug pattern, most specific. Match against hyphen-delimited
  // segments so "dal" matches "dal" or "dal-xxx" but NOT "hardalli".
  const slugSegments = slug.split("-");
  for (const { cuisine, patterns } of SLUG_PATTERNS) {
    for (const p of patterns) {
      // Multi-segment patterns (e.g. "pad-thai") check contiguous substring
      if (p.includes("-")) {
        if (slug.includes(p)) return cuisine;
      } else {
        // Single-segment: must match a complete slug segment
        if (slugSegments.includes(p)) return cuisine;
      }
    }
  }

  // 2. Title keyword, check nationality adjective
  const titleLower = recipe.title.toLocaleLowerCase("tr-TR");
  for (const { cuisine, keywords } of TEXT_KEYWORDS) {
    for (const kw of keywords) {
      if (titleLower.includes(kw)) return cuisine;
    }
  }

  // 3. Description keyword
  const descLower = recipe.description.toLocaleLowerCase("tr-TR");
  for (const { cuisine, keywords } of TEXT_KEYWORDS) {
    for (const kw of keywords) {
      if (descLower.includes(kw)) return cuisine;
    }
  }

  // 4. Default, Turkish
  return "tr";
}
