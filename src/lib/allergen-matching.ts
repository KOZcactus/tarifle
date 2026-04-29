/**
 * Single source of truth for allergen detection logic across the project.
 *
 * History (oturum 23 birlestirme):
 *   - Earlier split across src/lib/allergens.ts (UI), src/lib/allergen-
 *     matching.ts (yeni unified), scripts/audit-deep.ts (CLI audit + pre-
 *     push guard). audit-deep ve allergen-matching paralel evrildi, drift
 *     riski yarattigindan kalibrasyon iki dosyaya da uygulanmak zorunda
 *     kaliyordu (oturum 23'te firinda-tavuk-baget incidence). Bu dosya
 *     artik tek kaynaktir; audit-deep, allergens, vd. buradan import eder.
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

// ── Turkish-aware string helpers (exported for re-use in audit/seed scripts) ──

export function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

export function asciiNormalize(s: string): string {
  return trLower(s)
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

export function hasStandaloneWord(text: string, word: string): boolean {
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
      // Core wheat + Turkish staples:
      "buğday", "bulgur", "yufka", "galeta", "kadayıf", "pide", "lavaş",
      "börek", "irmik", "çavdar", "kepek", "kraker", "bisküvi", "kek",
      "hamur", "simit", "şehriye", "kuş başı", "baklava",
      // Regional TR wheat derivatives (session 11 + 23 audit):
      "baget", "bazlama", "dövme", "firik", "yarma", "gavut",
      "tarhana", "keşkek", "keşkeklik", "dövülmüş buğday",
      "göce", "gendime", "katmer", "tandır ekmeği", "tandir ekmeg",
      "mantı", "kete", "kavut", "açma", "poğaça", "çörek", "lahmacun hamuru",
      "pizza tabanı",
      // International wheat breads + finished goods:
      "crumpet", "scone", "hurmalı kek", "tunnbröd", "tunnbrod", "kvas",
      "krep", "crepe", "pancake", "palacsinta", "blini", "panqueca",
      "pandispanya", "wrap", "tarhonya", "cornbread", "corn bread",
      "csiga", "pasty", "pierogi",
      // Composite TR desserts (finished goods used as ingredient; oturum 12):
      "revani",
      // Grains + cereals (wheat-contaminated or wheat-derived):
      "yulaf", "granola", "kuskus", "freekeh",
      // Asian noodles/wrappers (mostly wheat-based):
      "noodle", "wonton", "yakisoba",
      // Codex-observed pasta/noodle names that weren't caught by customMatch:
      "spagetti", "spaghetti", "penne", "fusilli", "fettuccine",
      "tagliatelle", "tagliolini", "linguine", "rigatoni", "farfalle",
      "lasagna", "lazanya", "udon", "gnocchi", "tortilla", "ravioli",
      "tortellini", "orzo", "pastitsio",
      // Compound bread names where base "ekmek" substring won't catch:
      "tost", "bagel", "milfoy", "pita", "lavash", "tortilla ekmeği",
      // Regional breads + croutons + muffin variants:
      "muffin", "kruton", "güllaç", "misugaru",
      // NOTE: "ramen noodle" intentionally NOT excluded, actually wheat-based.
      // NOTE: "arpa" intentionally excluded, matches "arpacık soğan" as
      //   substring; real arpa ingredients caught via standalone match in
      //   customMatch (hasStandaloneWord) and via "bulgur"/"un"/"şehriye".
    ],
    excludePatterns: [
      // Gluten-free starch/flour/noodle, do NOT flag as GLUTEN
      "pirinç unu", "mısır unu", "pirinç eriştesi", "pirinç nişastası",
      "mısır nişastası", "patates nişastası", "tatlı patates nişastası",
      "nohut unu", "badem unu", "hindistan cevizi unu", "karabuğday",
      "yapışkan pirinç unu", "manyok unu", "manyok nişastası",
      "tapyoka unu", "tapyoka nişastası", "tapiyoka unu", "tapyoka",
      "hindistancevizi unu",
      "pirinç keki", "mısır yarma", "mısır yarması", "mısır yarmalı",
      // Gluten-free rice/glass noodle variants:
      "pirinç noodle", "cam noodle",
      // Gluten-free tortilla variants (Mexican tortilla chips are corn-based):
      "mısır tortilla", "tortilla cipsi",
      // Herb "kekik" (thyme) is gluten-free, collides with "kek" substring:
      "kekik", "taze kekik", "kuru kekik", "kekik otu",
      // Possessive form "kekiği" (Meksika kekiği = Mexican oregano,
      // Lippia graveolens spice). "kekik" + iyelik eki olarak ortaya
      // çıkar, "kek" yumurtası/glüteniyle ilgisi yok.
      "kekiği", "kekigi",
      // Pirinç krakeri: rice cracker, pirinç bazlı glütensiz. "kraker"
      // keyword'i yakalar ama pirinç bazlı varyant glütensiz.
      "pirinç krakeri", "pirinc krakeri",
      // Çörekotu (nigella sativa) is a spice, gluten-free; collides with
      // "çörek" substring (which IS gluten in standalone form).
      "çörekotu", "çörek otu", "corekotu", "corek otu",
      // "Tavuk baget" = tavuk parcasi (drumstick), gluten yok; "baget"
      // tek basina ekmek baget olur ama tavuk + baget kombosu degildir.
      "tavuk baget", "tavuk bageti",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      const ascii = asciiNormalize(name);
      const glutenFreeExempt = [
        "pirinç", "mısır", "patates", "nohut", "badem", "hindistan",
        "hindistancevizi", "karabuğday", "yapışkan", "manyok",
        "tapyoka", "tapiyoka", "tatlı patates",
      ];
      if (glutenFreeExempt.some((ex) => lower.startsWith(ex))) return false;
      // "Nişasta" tek basina TR mutfaginda neredeyse her zaman misir
      // nisastasi (gluten-free); sadece "buğday nişastası" GLUTEN.
      if (lower.includes("buğday nişastası") || lower.includes("bugday nisastasi")) {
        return true;
      }
      if (lower.includes("nişasta")) return false;
      // "erişte", only GLUTEN if NOT rice/glass/sweet potato noodle
      if (lower.includes("erişte")) {
        const gf = ["pirinç", "cam", "tatlı patates", "soba"];
        return !gf.some((g) => lower.includes(g));
      }
      // "makarna", only GLUTEN if NOT rice-based
      if (lower.includes("makarna")) return !lower.includes("pirinç");
      // "ekmek" + inflected "ekmeği" (ASCII "ekmegi"), GLUTEN
      if (ascii.includes("ekmek") || ascii.includes("ekmeg")) return true;
      // "un" / "arpa" as standalone word (word boundary):
      if (hasStandaloneWord(lower, "un")) return true;
      if (lower.endsWith(" unu")) return true;
      if (hasStandaloneWord(lower, "arpa")) return true;
      return false;
    },
  },
  {
    allergen: "SUT",
    keywords: [
      "yoğurt", "krema", "peynir", "kaymak", "tereyağı", "labne", "lor",
      "kaşar", "ayran", "dondurma", "mozzarella", "parmesan", "ricotta",
      "mascarpone", "feta", "pecorino", "cheddar",
      // Fermented milk products:
      "kefir", "filmjölk", "smetana", "kırmızı peynir", "krem peynir",
      // Turkish curd cheeses + international soft cheeses:
      "çökelek", "kurut", "hellim", "halloumi", "twarog", "tvorog",
      "turos", "turós", "minci", "çecil", "mihaliç",
      "tulum peyniri", "ezine peyniri",
      "çiğ süt", "manda yoğurdu", "süzme yoğurt",
    ],
    excludePatterns: [
      "hindistan cevizi sütü", "hindistan cevizi kreması",
      "badem sütü", "yulaf sütü", "pirinç sütü", "soya sütü",
      "kokos sütü", "kokos kreması",
      // "kurut" substring "kurutulmuş"u yakalar (dried, not dairy):
      "kurutulmuş",
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
    keywords: [
      "yumurta", "mayonez",
      // Egg-containing prepared goods (session 11 audit):
      "beze", "kek küpü", "kek kupu", "pandispanya", "tart hamuru",
      "kek hamuru", "kurabiye hamuru", "krep", "kete",
      // Composite TR desserts with egg:
      "revani", "hazır kek",
      // Composite bakery ingredients (Lamington over-tag dersi):
      "kek", "kurabiye", "muffin",
    ],
    excludePatterns: [
      // "beze" substring "bezelye"yi yakalar, bezelye baklagil (YUMURTA yok):
      "bezelye",
      // "kek" substring "kekik"i yakalar, kekik otu yumurtasiz:
      "kekik", "taze kekik", "kuru kekik", "kekik otu",
      // "kek" substring "keşkek" ve "keşkeklik"i yakalar:
      "keşkek", "keşkeklik", "keşkeklik buğday",
      // "kek" substring "pirinç keki"ni yakalar:
      "pirinç keki",
      // "kete" substring "keten tohumu"nu yakalar:
      "keten", "keten tohumu",
      // Possessive form "kekiği" (Meksika kekiği = Mexican oregano spice).
      // "kekik" iyelik eki, "kek" yumurtasıyla ilgisi yok.
      "kekiği", "kekigi",
    ],
  },
  {
    allergen: "KUSUYEMIS",
    keywords: [
      "ceviz", "badem", "fındık", "antep fıstığı", "kaju", "pekan",
      "çam fıstığı", "macadamia", "dolmalık fıstık", "kestane",
      // Pistacia terebinthus family + prepared nut products:
      "menengiç", "menengic", "turron", "turrón", "nougat",
    ],
    excludePatterns: [
      // Hindistan cevizi (coconut) is NOT a tree nut. Both spaced and
      // conjoined forms appear in DB.
      "hindistan cevizi", "hindistan cevizi sütü", "hindistan cevizi rendesi",
      "hindistan cevizi yağı", "hindistan cevizi kreması",
      "hindistan cevizi unu",
      "hindistancevizi", "hindistancevizi sütü", "hindistancevizi rendesi",
      "hindistancevizi yağı", "hindistancevizi kreması",
      "hindistancevizi unu",
      "kokos",
      // Kestane mantarı is a mushroom, not a chestnut:
      "kestane mantarı", "kestane mantar",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      if (lower.includes("ceviz")) {
        if (lower.includes("hindistan")) return false;
        if (lower.includes("hindistancevizi")) return false;
        return true;
      }
      if (lower.includes("kestane")) {
        if (lower.includes("mantar")) return false;
        return true;
      }
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
      "soya", "tofu", "miso", "edamame",
      // Korean/Japanese soy-based pastes + sauces:
      "gochujang", "chunjang", "siyah fasulye ezmesi",
      "tonkatsu sosu", "japon köri", "misugaru",
    ],
  },
  {
    allergen: "DENIZ_URUNLERI",
    keywords: [
      "balık", "balığı", "somon", "levrek", "hamsi", "karides", "midye", "kalamar",
      "ahtapot", "karidesli", "palamut", "istavrit",
      "yengeç", "deniz tarağı", "ançüez", "bonito", "istiridye",
      // "ton" alone collides with "tonik suyu", use "ton balığı" possessive:
      "ton balığı",
      // Generic seafood family wording:
      "deniz ürünleri", "deniz ürünü", "deniz mahsulü",
      // Regional + international fish names:
      "sardalya", "barramundi", "kefal", "çipura", "cipura", "uskumru",
      "ringa", "lüfer", "lufer", "kılıç", "kilic",
      "morina", "alabalık", "alabalik", "istakoz", "ıstakoz", "mezgit",
    ],
    excludePatterns: [
      // "kefal" substring "kefalotiri" peynirini yakalar (Yunan peyniri):
      "kefalotiri",
    ],
  },
  {
    allergen: "SUSAM",
    keywords: [
      "susam", "tahin", "furikake", "zaatar", "zahter",
      // Sesame-topped breads + spreads:
      "simit", "humus",
    ],
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
  // Defensive: undefined/empty ingredient name (source parse hatası)
  if (!ingredientName || typeof ingredientName !== "string") return false;
  // "X yerine Y" deyimi: tarif X'i KULLANMIYOR, Y'yi kullanıyor. Sadece
  // Y kısmını allergen kontrolüne sok. Örn "Tereyağı yerine sıvı yağ"
  // tarifi tereyağı içermez, sıvı yağ kullanır.
  const yerineMatch = ingredientName.match(/^(.+?)\s+yerine\s+(.+)$/i);
  if (yerineMatch) {
    return ingredientMatchesAllergen(yerineMatch[2], rule);
  }

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
