import type { Allergen } from "@prisma/client";

/**
 * User-facing labels and emojis for the Allergen enum.
 * Labels are plural-noun form that reads naturally in chip rows ("Süt",
 * "Kuruyemiş") and in "içermesin" filters.
 */
export const ALLERGEN_LABEL: Record<Allergen, string> = {
  GLUTEN: "Gluten",
  SUT: "Süt",
  YUMURTA: "Yumurta",
  KUSUYEMIS: "Kuruyemiş",
  YER_FISTIGI: "Yer fıstığı",
  SOYA: "Soya",
  DENIZ_URUNLERI: "Deniz ürünleri",
  SUSAM: "Susam",
  KEREVIZ: "Kereviz",
  HARDAL: "Hardal",
};

export const ALLERGEN_EMOJI: Record<Allergen, string> = {
  GLUTEN: "🌾",
  SUT: "🥛",
  YUMURTA: "🥚",
  KUSUYEMIS: "🥜",
  YER_FISTIGI: "🥜",
  SOYA: "🫘",
  DENIZ_URUNLERI: "🐟",
  SUSAM: "🌱",
  KEREVIZ: "🥬",
  HARDAL: "🌭",
};

/**
 * Ordered list used for UI chips and filter rows. Stable order = stable
 * visual layout as recipes gain/lose allergens.
 */
export const ALLERGEN_ORDER: readonly Allergen[] = [
  "GLUTEN",
  "SUT",
  "YUMURTA",
  "KUSUYEMIS",
  "YER_FISTIGI",
  "SOYA",
  "DENIZ_URUNLERI",
  "SUSAM",
  "KEREVIZ",
  "HARDAL",
];

/**
 * Normalise an ingredient/name string for keyword matching:
 * lowercase (Turkish-aware) + strip punctuation so "Yoğurt, tam yağlı"
 * matches the same tokens as "yogurt tam yagli".
 *
 * Turkish lowercase trap: "İ" lowercases to "i" under Turkish locale but
 * to "İ" (dot) under default. We use `toLocaleLowerCase("tr-TR")` so
 * names like "İrmik" become "irmik" and match the keyword "irmik".
 *
 * Also strips Turkish diacritics so entries in KEYWORDS can be ASCII-only,
 * which keeps the keyword list easier to scan and removes the risk of
 * typing "ı" vs "i" inconsistencies.
 */
function normalise(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keyword → Allergen map. Keys are normalized Turkish substrings; matching
 * is substring (i.e. "yogurt" matches "tam yagli yogurt"). Order-sensitive
 * only for overlapping keywords — see notes below for two tricky cases:
 *
 *   "fistik":  On its own in Turkish usually means antep fistigi (tree
 *              nut → KUSUYEMIS). "Yer fistigi" and "fistik ezmesi" mean
 *              peanut → YER_FISTIGI. We check yer-fistigi-specific
 *              phrases FIRST in `inferAllergensFromIngredients`.
 *
 *   "kereviz": Celery. Uncommon in home recipes; kept but low volume.
 *
 * The list is intentionally conservative — over-flagging (false positive)
 * is safer than under-flagging for allergen UX, but we still avoid obviously
 * wrong inferences. If the retrofit is noisy the user can override per
 * recipe via Prisma Studio or admin tool later.
 */
const KEYWORDS: Record<Allergen, readonly string[]> = {
  GLUTEN: [
    "un",
    "ekmek",
    "bulgur",
    "irmik",
    "makarna",
    "yufka",
    "baklava",
    "lavas",
    "pide",
    "galeta unu",
    "arpa",
    "cavdar",
    "bugday",
    "kepek",
    "kraker",
    "biskuvi",
    "kek",
    "hamur",
    "borek",
    "simit",
    "sehriye",
    "kus basi",
    "kadayif",
  ],
  SUT: [
    "sut",
    "yogurt",
    "ayran",
    "tereyag",
    "tereyagi",
    "peynir",
    "kasar",
    "lor",
    "labne",
    "krema",
    "kaymak",
    "dondurma",
    "mozzarella",
    "parmesan",
    "cedar",
    "cheddar",
    "ricotta",
    "mascarpone",
    "beyaz peynir",
    "yogurt altyag",
  ],
  YUMURTA: ["yumurta"],
  // Turkish 'fıstık' softens to 'fıstığı' with possessive suffix, which
  // normalises to 'fistigi' (k → g). We list both 'fistik' and 'fistig' so
  // substring match catches bare + inflected forms.
  KUSUYEMIS: [
    "ceviz",
    "badem",
    "findik",
    "kaju",
    "antep fistik",
    "antep fistig",
    "sam fistik",
    "sam fistig",
    "kestane",
    "macadamia",
    "cam fistik",
    "cam fistig",
  ],
  YER_FISTIGI: [
    "yer fistik",
    "yer fistig",
    "fistik ezmesi",
    "fistig ezmesi",
    "peanut",
  ],
  SOYA: ["soya", "edamame", "tofu", "miso", "tempeh"],
  // NOTE: avoid short substring keywords that can collide with non-seafood
  // words. E.g. "ton" alone (for tuna) matches "tonik suyu" — so we only
  // include "ton baligi"/"ton bal" as the tuna trigger. Also include the
  // inflected 'balig' since 'baligi' (possessive) normalises to 'baligi'
  // and we want to match 'ton baligi', 'somon baligi', etc.
  DENIZ_URUNLERI: [
    "balik",
    "balig",
    "somon",
    "levrek",
    "alabalik",
    "alabalig",
    "ton baligi",
    "ton balik",
    "hamsi",
    "karides",
    "midye",
    "ahtapot",
    "kalamar",
    "cipura",
    "istakoz",
    "yengec",
    "istiridye",
    "deniz urun",
    "deniz mahsul",
    "mezgit",
    "uskumru",
    "palamut",
    "sardalya",
  ],
  SUSAM: ["susam", "tahin"],
  KEREVIZ: ["kereviz"],
  HARDAL: ["hardal", "mustard"],
};

/**
 * Infers the allergen set for a recipe from its ingredient names. Pure
 * function — no DB, no IO — so the retrofit script and unit tests exercise
 * the same code path.
 *
 * The function prefers specific matches over broad ones: if the ingredient
 * list contains "yer fistik", only YER_FISTIGI is added (not KUSUYEMIS).
 * For unrelated overlaps each allergen is considered independently.
 */
export function inferAllergensFromIngredients(
  ingredients: readonly { name: string }[],
): Allergen[] {
  const found = new Set<Allergen>();
  const normalized = ingredients.map((i) => normalise(i.name));

  // 1) YER_FISTIGI is checked first so it wins over the generic "fistik"
  //    keyword that would otherwise push peanuts into KUSUYEMIS.
  const hasPeanut = normalized.some((n) =>
    KEYWORDS.YER_FISTIGI.some((k) => n.includes(k)),
  );
  if (hasPeanut) found.add("YER_FISTIGI");

  // 2) All other allergens — iterate in enum order, substring match.
  for (const allergen of ALLERGEN_ORDER) {
    if (allergen === "YER_FISTIGI") continue; // already handled
    for (const n of normalized) {
      // If we already identified a peanut context for THIS ingredient,
      // skip tree-nut matching on it so "yer fistigi" does not also
      // trigger KUSUYEMIS via the generic "fistik" keyword.
      if (
        allergen === "KUSUYEMIS" &&
        hasPeanut &&
        KEYWORDS.YER_FISTIGI.some((k) => n.includes(k))
      ) {
        continue;
      }
      if (KEYWORDS[allergen].some((k) => n.includes(k))) {
        found.add(allergen);
        break; // one hit per allergen is enough; move on
      }
    }
  }

  // Return in canonical order so UI chip rows are stable even if two
  // recipes have the same set in different hit order.
  return ALLERGEN_ORDER.filter((a) => found.has(a));
}
