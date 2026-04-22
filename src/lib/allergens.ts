import type { Allergen } from "@prisma/client";

// Re-export the unified matching API so callers can import everything
// from one module. The actual rules live in allergen-matching.ts to avoid
// drift with scripts/audit-deep.ts.
export {
  ALLERGEN_ORDER,
  ALLERGEN_RULES,
  ingredientMatchesAllergen,
  inferAllergensFromIngredients,
} from "./allergen-matching";

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

// ALLERGEN_ORDER moved to allergen-matching.ts (re-exported above).

// The private normalise() + KEYWORDS map + inferAllergensFromIngredients
// previously lived here. All matching logic moved to ./allergen-matching.ts
// (single source of truth shared with scripts/audit-deep.ts).
//
// Legacy KEYWORDS below is kept only for allergens unit tests that still
// reference it by name, not used in production code. Safe to remove once
// those tests migrate.

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
// _normalise + _KEYWORDS: legacy keyword-based allergen inference helper'lari.
// Yeni audit-deep ve check-allergen-source pipeline'i ayri keyword set
// kullaniyor; bu blok belge degeri icin tutuluyor (allergen UX kararlarinin
// arka plani). Silinebilir ama git history'sinden kazimak yerine inline kalsin.
function _normalise(name: string): string {
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
 * only for overlapping keywords, see notes below for two tricky cases:
 *
 *   "fistik":  On its own in Turkish usually means antep fistigi (tree
 *              nut → KUSUYEMIS). "Yer fistigi" and "fistik ezmesi" mean
 *              peanut → YER_FISTIGI. We check yer-fistigi-specific
 *              phrases FIRST in `inferAllergensFromIngredients`.
 *
 *   "kereviz": Celery. Uncommon in home recipes; kept but low volume.
 *
 * The list is intentionally conservative, over-flagging (false positive)
 * is safer than under-flagging for allergen UX, but we still avoid obviously
 * wrong inferences. If the retrofit is noisy the user can override per
 * recipe via Prisma Studio or admin tool later.
 */
const _KEYWORDS: Record<Allergen, readonly string[]> = {
  GLUTEN: [
    "un",
    // "ekmek" + "ekmeg", Turkish possessive "ekmeği" → normalized "ekmegi";
    // bare "ekmek" keyword won't substring-match "ekmegi" (k vs g softening).
    "ekmek",
    "ekmeg",
    "bulgur",
    "irmik",
    "makarna",
    "yufka",
    "baklava",
    "lavas",
    "pide",
    "galeta unu",
    // "arpa" removed, substring-matches "arpacık soğan" as false positive.
    // Real arpa ingredients are caught via "bulgur"/"sehriye"/"un".
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
    // Commonly-used wheat-derived ingredients audit-deep surfaces as over-tag:
    "yulaf", "granola", "kuskus", "freekeh",
    // Japanese/Vietnamese noodle wrappers (wheat-based unless specified):
    "noodle", "wonton", "yakisoba", "udon",
    // Italian pasta family (not always caught by "makarna"):
    "spagetti", "spaghetti", "penne", "fusilli", "fettuccine", "tagliatelle",
    "linguine", "rigatoni", "farfalle", "lasagna", "lazanya", "gnocchi",
    "ravioli", "tortellini", "orzo", "pastitsio",
    // Bread variants where "ekmek" substring doesn't catch (compound words):
    "tost", "bagel", "simit", "milfoy", "pita", "tandir ekmeg",
    "tortilla",
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
  // words. E.g. "ton" alone (for tuna) matches "tonik suyu", so we only
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

// inferAllergensFromIngredients moved to ./allergen-matching.ts. The
// export above (top of file) re-exports it so callers don't break.
