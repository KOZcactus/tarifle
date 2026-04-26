/**
 * Single source of truth for allergen detection logic.
 *
 * Previously split across:
 *   - src/lib/allergens.ts: simple substring match with TR normalize
 *   - scripts/audit-deep.ts: richer excludePatterns + customMatch
 *
 * Unified here so retrofit, audit, and fix scripts share the same rules.
 *
 * Design:
 *   - Rule = { allergen, keywords, excludePatterns?, customMatch? }
 *   - excludePatterns checked first (short-circuit false)
 *   - customMatch next (short-circuit true)
 *   - keywords checked last with both trLower and asciiNormalize forms
 *
 * ASCII normalize handles Turkish possessive / consonant softening:
 *   "ekmeği" → "ekmegi" → matches keyword "ekmeg"
 *   "yoğurt" → "yogurt"
 */
import type { Allergen } from "@prisma/client";

// ── Turkish-aware string helpers ────────────────────────────────────

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

function asciiNormalize(s: string): string {
  return trLower(s)
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function hasStandaloneWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\s|[,;.!?/()\\-])${escaped}(?:$|\\s|[,;.!?/()\\-])`,
    "i",
  );
  return re.test(` ${text} `);
}

// ── Rule definitions ────────────────────────────────────────────────

export interface AllergenRule {
  allergen: Allergen;
  keywords: string[];
  excludePatterns?: string[];
  customMatch?: (name: string) => boolean;
}

export const ALLERGEN_RULES: AllergenRule[] = [
  {
    allergen: "GLUTEN",
    keywords: [
      "buğday", "bulgur", "yufka", "galeta", "kadayıf", "pide", "lavaş",
      "börek", "irmik", "çavdar", "kepek", "kraker", "bisküvi", "kek",
      "hamur", "simit", "şehriye", "kuş başı", "baklava",
      "yulaf", "granola", "kuskus", "freekeh",
      // TR yoresel ingredient'lar (oturum 23 ek coverage):
      "bazlama", "kete", "revani", "açma", "poğaça", "çörek", "tandır ekmeği",
      "lahmacun hamuru", "pizza tabanı", "lavash", "tortilla ekmeği",
      // Krep / palacsinta: hamur unla yapilir, gluten icerir.
      "krep", "palacsinta", "blini", "panqueca", "crepe",
      "noodle", "wonton", "yakisoba",
      "spagetti", "spaghetti", "penne", "fusilli", "fettuccine",
      "tagliatelle", "tagliolini", "linguine", "rigatoni", "farfalle",
      "lasagna", "lazanya", "udon", "gnocchi", "tortilla", "ravioli",
      "tortellini", "orzo", "pastitsio",
      "tost", "bagel", "milfoy", "pita", "tandir ekmeg",
      "muffin", "kruton", "güllaç", "misugaru",
      // "arpa" intentionally excluded, false positive with "arpacık soğan"
    ],
    excludePatterns: [
      "pirinç unu", "mısır unu", "pirinç eriştesi", "pirinç nişastası",
      "mısır nişastası", "patates nişastası", "tatlı patates nişastası",
      "nohut unu", "badem unu", "hindistan cevizi unu", "karabuğday",
      "yapışkan pirinç unu", "manyok unu", "manyok nişastası",
      "pirinç keki", "pirinç noodle", "cam noodle",
      "mısır tortilla", "tortilla cipsi",
      // Tapyoka = manyoktan elde edilen, gluten-free. "Tapyoka unu"
      // false positive yapiyordu (Brezilya pão de queijo waffle).
      "tapyoka unu", "tapyoka nişastası", "tapyoka",
      // "kek" substring "kekik" (oregano), "kekikli" gibi baharat
      // isimlerinde false positive yapiyordu; kek standalone gluten'li
      // ama kekik gluten icermez. excludePatterns ilk degerlendiriliyor.
      "kekik", "kekikli", "nane kekik", "kekik dali",
      // "çörek" GLUTEN keyword'u "çörekotu" (nigella sativa, gluten-
      // free baharat) icin false positive yapiyordu. Çörekotu Mercimek
      // Çorbasi false positive kalkti.
      "çörekotu", "çörek otu", "corekotu", "corek otu",
      // "Tavuk baget" = tavuk parcasi (ekmek baget degil). Tek basina
      // "baget" ekmek olur ama tavuk + baget kombosu degildir.
      "tavuk baget", "tavuk bageti",
      // NOTE: "ramen noodle" intentionally NOT excluded, wheat-based
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      const ascii = asciiNormalize(name);
      const glutenFreeExempt = [
        "pirinç", "mısır", "patates", "nohut", "badem", "hindistan",
        "karabuğday", "yapışkan", "manyok", "tatlı patates",
      ];
      if (glutenFreeExempt.some((ex) => lower.startsWith(ex))) return false;
      // "Nişasta" tek basina TR mutfaginda neredeyse her zaman misir
      // nisastasi (gluten-free). Bilesik formlar (bugday nisastasi gibi)
      // ayri keyword'le yakalanir. Onceki davranis "lower === 'nişasta'
      // -> true" idi, false positive yapiyordu (Sicak Cikolata).
      if (lower === "nişasta" || lower === "nisasta") return false;
      if (lower.includes("buğday nişastası") || lower.includes("bugday nisastasi")) return true;
      if (lower.includes("nişasta") || lower.includes("nisasta")) return false;
      if (lower.includes("erişte")) {
        const gf = ["pirinç", "cam", "tatlı patates", "soba"];
        return !gf.some((g) => lower.includes(g));
      }
      if (lower.includes("makarna")) return !lower.includes("pirinç");
      if (ascii.includes("ekmek") || ascii.includes("ekmeg")) return true;
      if (hasStandaloneWord(lower, "un")) return true;
      if (lower.endsWith(" unu")) return true;
      return false;
    },
  },
  {
    allergen: "SUT",
    keywords: [
      "yoğurt", "krema", "peynir", "kaymak", "tereyağı", "labne", "lor",
      "kaşar", "ayran", "dondurma", "mozzarella", "parmesan", "ricotta",
      "mascarpone", "feta", "pecorino", "cheddar",
      "kefir", "filmjölk", "smetana", "kırmızı peynir", "krem peynir",
      // TR yoresel sut urunleri (oturum 23 ek coverage):
      "çökelek", "hellim", "çecil", "mihaliç", "tulum peyniri", "ezine peyniri",
      "çiğ süt", "manda yoğurdu", "süzme yoğurt",
    ],
    excludePatterns: [
      "hindistan cevizi sütü", "hindistan cevizi kreması", "badem sütü",
      "yulaf sütü", "pirinç sütü", "soya sütü", "kokos sütü",
      "kokos kreması",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      if (lower.includes("süt")) {
        const plant = ["hindistan", "badem", "yulaf", "pirinç", "soya", "kokos"];
        return !plant.some((p) => lower.includes(p));
      }
      return false;
    },
  },
  {
    allergen: "YUMURTA",
    keywords: ["yumurta", "mayonez"],
  },
  {
    allergen: "KUSUYEMIS",
    keywords: [
      "ceviz", "badem", "fındık", "antep fıstığı", "kaju", "pekan",
      "çam fıstığı", "macadamia", "dolmalık fıstık", "kestane",
    ],
    excludePatterns: [
      "hindistan cevizi", "hindistan cevizi sütü", "hindistan cevizi rendesi",
      "hindistan cevizi yağı", "hindistan cevizi kreması",
      "hindistan cevizi unu",
      // Boşluksuz TR yazimi ("Hindistancevizi sütü", "Hindistancevizi
      // rendesi"). Eski excludePatterns sadece bosluklu varyanti yakaliyordu;
      // mutfaktaki "hindistancevizi" tek kelime yazim KUSUYEMIS false
      // positive yapiyordu (Lamington, Vietnam shaker).
      "hindistancevizi", "hindistancevizi sütü", "hindistancevizi rendesi",
      "hindistancevizi yağı", "hindistancevizi kreması",
      "hindistancevizi unu",
      "kokos", "kestane mantarı", "kestane mantar",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      if (lower.includes("ceviz") && lower.includes("hindistan")) return false;
      if (lower.includes("kestane") && lower.includes("mantar")) return false;
      return false;
    },
  },
  {
    allergen: "YER_FISTIGI",
    keywords: ["yer fıstığı", "fıstık ezmesi"],
  },
  {
    allergen: "SOYA",
    keywords: [
      "soya", "tofu", "miso", "edamame", "gochujang", "chunjang",
      "siyah fasulye ezmesi", "tonkatsu sosu", "japon köri", "misugaru",
    ],
  },
  {
    allergen: "DENIZ_URUNLERI",
    keywords: [
      "balık", "somon", "levrek", "hamsi", "karides", "midye", "kalamar",
      "ahtapot", "karidesli", "palamut", "istavrit",
      "yengeç", "deniz tarağı", "ançüez", "bonito", "istiridye",
      "ton balığı",
      // Generic seafood family wording (from unit tests + UX):
      "deniz ürünleri", "deniz ürünü", "deniz mahsulü", "alabalık",
      "mezgit", "uskumru", "sardalya", "çipura", "ıstakoz",
    ],
  },
  {
    allergen: "SUSAM",
    keywords: ["susam", "tahin", "furikake", "zaatar"],
  },
  {
    allergen: "KEREVIZ",
    keywords: ["kereviz"],
  },
  {
    allergen: "HARDAL",
    keywords: ["hardal"],
  },
];

// ── Public API ──────────────────────────────────────────────────────

/** Check if a single ingredient name triggers an allergen rule. */
export function ingredientMatchesAllergen(
  ingredientName: string,
  rule: AllergenRule,
): boolean {
  const lower = trLower(ingredientName);
  const asciiLower = asciiNormalize(ingredientName);

  if (
    rule.excludePatterns?.some(
      (ex) => lower.includes(ex) || asciiLower.includes(asciiNormalize(ex)),
    )
  ) return false;

  if (rule.customMatch?.(ingredientName)) return true;

  return rule.keywords.some(
    (kw) => lower.includes(kw) || asciiLower.includes(asciiNormalize(kw)),
  );
}

/**
 * Infer the complete allergen set for a recipe from its ingredient names.
 * Returns in canonical ALLERGEN_ORDER (stable UI rendering).
 */
export const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

export function inferAllergensFromIngredients(
  ingredients: readonly { name: string }[],
): Allergen[] {
  const found = new Set<Allergen>();

  // YER_FISTIGI first so it wins over generic "fistik" matching KUSUYEMIS
  const peanutRule = ALLERGEN_RULES.find((r) => r.allergen === "YER_FISTIGI")!;
  const hasPeanut = ingredients.some((i) =>
    ingredientMatchesAllergen(i.name, peanutRule),
  );
  if (hasPeanut) found.add("YER_FISTIGI");

  for (const rule of ALLERGEN_RULES) {
    if (rule.allergen === "YER_FISTIGI") continue;
    for (const ing of ingredients) {
      // If this ingredient triggered the peanut rule, skip tree-nut match
      if (
        rule.allergen === "KUSUYEMIS" &&
        hasPeanut &&
        ingredientMatchesAllergen(ing.name, peanutRule)
      ) {
        continue;
      }
      if (ingredientMatchesAllergen(ing.name, rule)) {
        found.add(rule.allergen);
        break;
      }
    }
  }

  return ALLERGEN_ORDER.filter((a) => found.has(a));
}
