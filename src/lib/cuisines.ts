/**
 * Cuisine constants and inference logic. Single source of truth for the
 * 14 supported cuisine codes, their labels, and the rule-based inference
 * engine used by `scripts/retrofit-cuisine.ts` to tag existing recipes.
 *
 * Design: `cuisine` is a `String?` on Recipe (not a Prisma enum) so
 * adding new cuisines (Vietnamese, Brazilian, Scandinavian…) does not
 * require a migration — only this file and the Zod schema need updating.
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
};

// ─── Inference engine ───────────────────────────────────────

/**
 * Slug-level matches — highest confidence. These are dish names that
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
];

/**
 * Title/description keyword matches — checked against Turkish text.
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
];

interface InferInput {
  title: string;
  slug: string;
  description: string;
  ingredients: readonly { name: string }[];
}

/**
 * Infer the cuisine code for a recipe. Priority:
 * 1. Slug substring match (highest confidence — dish name is unique)
 * 2. Title keyword match (nationality adjective in title)
 * 3. Description keyword match (nationality adjective in body)
 * 4. Default: "tr" (majority of recipes are Turkish)
 */
export function inferCuisineFromRecipe(recipe: InferInput): CuisineCode {
  const slug = recipe.slug.toLowerCase();

  // 1. Slug pattern — most specific. Match against hyphen-delimited
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

  // 2. Title keyword — check nationality adjective
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

  // 4. Default — Turkish
  return "tr";
}
