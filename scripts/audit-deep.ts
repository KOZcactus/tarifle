/**
 * Deep database quality audit for Tarifle recipe platform.
 *
 * Fetches ALL published recipes in ONE query with full relations, then
 * runs 7 check categories entirely in-memory: ingredient quality, group
 * consistency, step quality, recipe consistency, duplicate detection,
 * allergen accuracy, and general coverage.
 *
 * Usage:
 *   npx tsx scripts/audit-deep.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Types ───────────────────────────────────────────────────

type Severity = "CRITICAL" | "WARNING" | "INFO";

interface Finding {
  severity: Severity;
  category: string;
  slug: string;
  title: string;
  message: string;
}

// ── Helpers ─────────────────────────────────────────────────

/** Lowercase with Turkish locale for proper İ/I handling. */
function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

/**
 * Normalize Turkish → ASCII for keyword substring matching.
 * Aligned with src/lib/allergens.ts normalise(): catches inflected forms
 * like "ekmeği" (possessive) substring-matching against keyword "ekmeg".
 */
function asciiNormalize(s: string): string {
  return trLower(s)
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

/** Strip parenthesized text and normalize for ingredient dedup. */
function normalizeIngredientName(name: string): string {
  return trLower(name.replace(/\(.*?\)/g, "")).trim();
}

/** Normalize a title for near-duplicate comparison. */
function normalizeTitle(title: string): string {
  let t = trLower(title);
  // Strip noise prefixes that don't signal a distinct recipe ("Ev yapımı X"
  // is the same as "X"). "klasik" is NOT stripped, "Klasik Menemen" is a
  // culturally separate preparation from modern "Menemen" (yeşil biber +
  // zeytinyağı vs sivri biber + tereyağı, etc).
  for (const prefix of ["ev yapımı ", "geleneksel "]) {
    if (t.startsWith(prefix)) {
      t = t.slice(prefix.length);
    }
  }
  return t.trim();
}

/**
 * Extract time mentions from Turkish instruction text.
 * Returns total seconds mentioned, or null if no time found.
 */
function extractTimeFromInstruction(text: string): number | null {
  const lower = trLower(text);
  let totalSeconds = 0;
  let found = false;

  // Match "N dakika" / "N dk" patterns
  const minPatterns = /(\d+)\s*(?:dakika|dk\.?)/g;
  let match: RegExpExecArray | null;
  while ((match = minPatterns.exec(lower)) !== null) {
    totalSeconds += parseInt(match[1], 10) * 60;
    found = true;
  }

  // Match "N saat" only, "sa" short-form removed because "30 saniye"
  // matches "\d+\s*sa" as substring and inflates to hours.
  const hourPatterns = /(\d+)\s*saat\b/g;
  while ((match = hourPatterns.exec(lower)) !== null) {
    totalSeconds += parseInt(match[1], 10) * 3600;
    found = true;
  }

  return found ? totalSeconds : null;
}

/**
 * Check if a word appears as a standalone word in text.
 * Uses word boundary logic adapted for Turkish text.
 */
function hasStandaloneWord(text: string, word: string): boolean {
  // Build a regex with word boundaries
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\s|[,;.!?/()\\-])${escaped}(?:$|\\s|[,;.!?/()\\-])`, "i");
  return re.test(` ${text} `);
}

// ── Allergen keyword maps ───────────────────────────────────

interface AllergenRule {
  allergen: string;
  keywords: string[];
  /** Optional custom match function instead of simple includes. */
  customMatch?: (ingredientName: string) => boolean;
  /** Keywords that should exclude a match (e.g. "mısır nişastası" for GLUTEN). */
  excludePatterns?: string[];
}

const ALLERGEN_RULES: AllergenRule[] = [
  {
    allergen: "GLUTEN",
    keywords: [
      "buğday", "bulgur", "yufka", "galeta", "kadayıf", "pide", "lavaş", "börek",
      // Aligned with src/lib/allergens.ts keyword list (Apr 2026):
      // "arpa" intentionally excluded, matches "arpacık soğan" as substring;
      // real arpa ingredients are caught via "bulgur"/"un"/"şehriye".
      "irmik", "çavdar", "kepek", "kraker", "bisküvi", "kek", "hamur",
      "simit", "şehriye", "kuş başı", "baklava",
      // Grains + cereals (wheat-contaminated or wheat-derived):
      "yulaf", "granola", "kuskus", "freekeh",
      // Asian noodles/wrappers (mostly wheat-based):
      "noodle", "wonton", "yakisoba",
      // Codex-observed pasta/noodle names that weren't caught by customMatch:
      "spagetti", "spaghetti", "penne", "fusilli", "fettuccine", "tagliatelle",
      "tagliolini", "linguine", "rigatoni", "farfalle", "lasagna", "lazanya",
      "udon", "gnocchi", "tortilla", "ravioli", "tortellini", "orzo", "pastitsio",
      // Compound bread names where base "ekmek" substring won't catch:
      "tost", "bagel", "milfoy", "pita", "tandir ekmeg",
      // Regional breads + croutons + muffin variants:
      "muffin", "kruton", "güllaç", "misugaru",
      // Intentionally excluded from keywords: "ramen" (ramen noodle is in
      // excludePatterns as gluten-free flag, actually wheat-based; fix
      // that separately), "soba" (buckwheat, gluten-free).
    ],
    excludePatterns: [
      // Gluten-free starch/flour/noodle, do NOT flag as GLUTEN
      "pirinç unu", "mısır unu", "pirinç eriştesi", "pirinç nişastası",
      "mısır nişastası", "patates nişastası", "tatlı patates nişastası",
      "nohut unu", "badem unu", "hindistan cevizi unu", "karabuğday",
      "yapışkan pirinç unu", "manyok unu", "manyok nişastası",
      "tapyoka unu", "tapyoka nişastası", "tapiyoka unu",
      "hindistancevizi unu",
      "pirinç keki",
      // Gluten-free rice/glass noodle variants:
      "pirinç noodle", "cam noodle",
      // Gluten-free tortilla variants (Mexican tortilla chips are corn-based):
      "mısır tortilla", "tortilla cipsi",
      // Herb "kekik" (thyme) is gluten-free, collides with "kek" substring:
      "kekik", "taze kekik", "kuru kekik", "kekik otu",
      // NOTE: "ramen noodle" intentionally NOT excluded, actually wheat-based.
    ],
    customMatch: (name: string) => {
      const lower = trLower(name);
      const ascii = asciiNormalize(name);
      // Exclude gluten-free items first
      const glutenFreeExempt = [
        "pirinç", "mısır", "patates", "nohut", "badem", "hindistan",
        "hindistancevizi", "karabuğday", "yapışkan", "manyok",
        "tapyoka", "tapiyoka", "tatlı patates",
      ];
      if (glutenFreeExempt.some((ex) => lower.startsWith(ex))) return false;

      // "nişasta", TR mutfağında default mısır nişastası (glutensiz).
      // Buğday nişastası nadirdir, tarif o varyantı kastediyorsa ingredient
      // adı "buğday nişastası" olarak netleştirilmeli.
      if (lower.includes("nişasta")) {
        return false;
      }
      // "erişte", only GLUTEN if NOT rice/glass/sweet potato noodle
      if (lower.includes("erişte")) {
        const gfNoodle = ["pirinç", "cam", "tatlı patates", "soba"];
        if (gfNoodle.some((g) => lower.includes(g))) return false;
        return true;
      }
      // "makarna", only GLUTEN if NOT rice-based
      if (lower.includes("makarna")) {
        if (lower.includes("pirinç")) return false;
        return true;
      }
      // "ekmek" + inflected "ekmeği" (ASCII "ekmegi"), GLUTEN
      if (ascii.includes("ekmek") || ascii.includes("ekmeg")) return true;
      // "un" as standalone word, only if NOT qualified with gluten-free
      if (hasStandaloneWord(lower, "un")) return true;
      if (lower.endsWith(" unu")) return true;
      return false;
    },
  },
  {
    allergen: "SUT",
    keywords: [
      "yoğurt", "krema", "peynir", "kaymak", "tereyağı", "labne", "lor",
      // Aligned with src/lib/allergens.ts + common ingredient names:
      "kaşar", "ayran", "dondurma", "mozzarella", "parmesan", "ricotta",
      "mascarpone", "feta", "pecorino", "cheddar",
      // Fermented milk products (kefir, Swedish filmjölk, Russian smetana):
      "kefir", "filmjölk", "smetana", "kırmızı peynir", "krem peynir",
    ],
    excludePatterns: [
      // Non-dairy "süt", do NOT flag as SUT
      "hindistan cevizi sütü", "hindistan cevizi kreması",
      "badem sütü", "yulaf sütü", "pirinç sütü", "soya sütü",
      "kokos sütü", "kokos kreması",
    ],
    customMatch: (name: string) => {
      const lower = trLower(name);
      // "süt", only dairy if NOT plant-based
      if (lower.includes("süt")) {
        const plantMilk = ["hindistan", "badem", "yulaf", "pirinç", "soya", "kokos"];
        if (plantMilk.some((p) => lower.includes(p))) return false;
        return true;
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
      "çam fıstığı", "macadamia",
      // Turkish nut aliases (dolmalık fıstık = çam fıstığı):
      "dolmalık fıstık",
    ],
    excludePatterns: [
      // Hindistan cevizi (coconut) is NOT a tree nut.
      // Both spaced ("hindistan cevizi") and conjoined ("hindistancevizi")
      // forms appear in DB, cover both.
      "hindistan cevizi", "hindistan cevizi sütü", "hindistan cevizi rendesi",
      "hindistan cevizi yağı", "hindistan cevizi kreması", "hindistan cevizi unu",
      "hindistancevizi", "hindistancevizi sütü", "hindistancevizi rendesi",
      "hindistancevizi yağı", "hindistancevizi kreması", "hindistancevizi unu",
      "kokos",
      // Kestane mantarı is a mushroom, not a chestnut
      "kestane mantarı", "kestane mantar",
    ],
    customMatch: (name: string) => {
      const lower = trLower(name);
      // "ceviz" but NOT "hindistan cevizi" (spaced) or "hindistancevizi" (conjoined)
      if (lower.includes("ceviz")) {
        if (lower.includes("hindistan")) return false;
        if (lower.includes("hindistancevizi")) return false;
        return true;
      }
      // "kestane" but NOT "kestane mantarı"
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
      "balık", "somon", "levrek", "hamsi", "karides", "midye",
      "kalamar", "ahtapot", "karidesli", "palamut", "istavrit",
      // Crustaceans + mollusks + dried fish flakes:
      "yengeç", "deniz tarağı", "ançüez", "bonito", "istiridye",
      // "ton" alone collides with "tonik suyu", use "ton balığı" possessive
      // form "ton balıgı" explicitly to catch "Ton balığı" ingredient:
      "ton balığı",
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

/** Check if an ingredient matches an allergen rule. */
function ingredientMatchesAllergen(
  ingredientName: string,
  rule: AllergenRule
): boolean {
  const lower = trLower(ingredientName);
  const asciiLower = asciiNormalize(ingredientName);

  // Exclude patterns first, check both original and ASCII-normalized forms
  // so "Hindistan cevizi sütü" matches exclude "hindistan cevizi sütü" even
  // when ingredient name has Turkish punctuation/diacritics.
  if (
    rule.excludePatterns?.some(
      (ex) => lower.includes(ex) || asciiLower.includes(asciiNormalize(ex)),
    )
  ) return false;

  // Custom match (e.g. GLUTEN "un" logic, SUT "süt" logic, KUSUYEMIS "ceviz" logic)
  if (rule.customMatch?.(ingredientName)) return true;

  // Keyword substring check, try both forms so "Sandviç ekmeği" (ASCII:
  // "sandvic ekmegi") matches keyword "ekmeg" even though bare "ekmek"
  // wouldn't (k vs g consonant softening).
  return rule.keywords.some(
    (kw) => lower.includes(kw) || asciiLower.includes(asciiNormalize(kw)),
  );
}

// ── Cuisine slug patterns (small unambiguous subset) ────────

const CUISINE_SLUG_CHECKS: { pattern: string; cuisine: string }[] = [
  { pattern: "sushi", cuisine: "jp" },
  { pattern: "ramen", cuisine: "jp" },
  { pattern: "tempura", cuisine: "jp" },
  { pattern: "teriyaki", cuisine: "jp" },
  { pattern: "miso", cuisine: "jp" },
  { pattern: "paella", cuisine: "es" },
  { pattern: "gazpacho", cuisine: "es" },
  { pattern: "kimchi", cuisine: "kr" },
  { pattern: "bibimbap", cuisine: "kr" },
  { pattern: "bulgogi", cuisine: "kr" },
  { pattern: "hummus", cuisine: "me" },
  { pattern: "falafel", cuisine: "me" },
  { pattern: "pad-thai", cuisine: "th" },
  { pattern: "tom-yum", cuisine: "th" },
  { pattern: "tikka", cuisine: "in" },
  { pattern: "biryani", cuisine: "in" },
  { pattern: "tandoori", cuisine: "in" },
  { pattern: "taco", cuisine: "mx" },
  { pattern: "guacamole", cuisine: "mx" },
  { pattern: "burrito", cuisine: "mx" },
  { pattern: "pizza", cuisine: "it" },
  { pattern: "risotto", cuisine: "it" },
  { pattern: "carbonara", cuisine: "it" },
  { pattern: "tiramisu", cuisine: "it" },
  { pattern: "ratatouille", cuisine: "fr" },
  { pattern: "quiche", cuisine: "fr" },
  { pattern: "croissant", cuisine: "fr" },
  { pattern: "baklava", cuisine: "tr" },
  { pattern: "pho", cuisine: "vn" },
  { pattern: "banh-mi", cuisine: "vn" },
  { pattern: "feijoada", cuisine: "br" },
  { pattern: "borscht", cuisine: "ru" },
  { pattern: "goulash", cuisine: "hu" },
];

// ── Type → CategorySlug mapping ─────────────────────────────

// Maps RecipeType → acceptable category slugs. Deliberately permissive:
// some Types legitimately span multiple categories (APERATIF börek is
// both aperatifler and hamur-isleri; SALATA baklagil salata fits both
// salatalar and baklagil-yemekleri). Each listed slug should be a
// culturally-valid placement in Turkish recipe taxonomy.
const TYPE_CATEGORY_MAP: Record<string, string[]> = {
  KOKTEYL: ["kokteyller"],
  CORBA: ["corbalar"],
  TATLI: ["tatlilar", "hamur-isleri"],
  SALATA: ["salatalar", "baklagil-yemekleri"],
  KAHVALTI: ["kahvaltiliklar", "hamur-isleri"],
  APERATIF: [
    "aperatifler",
    "hamur-isleri",        // börek/gözleme/poğaça
    "sebze-yemekleri",     // mezeler: saksuka/imam bayıldı
    "baklagil-yemekleri",  // fava/humus
    "tavuk-yemekleri",     // çerkez tavuğu
  ],
  SOS: ["soslar-dippler"],
  ICECEK: ["icecekler", "smoothie-shake", "kahve-sicak-icecekler"],
  ATISTIRMALIK: ["atistirmaliklar", "hamur-isleri"],
};

// ── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  const findings: Finding[] = [];

  function addFinding(
    severity: Severity,
    category: string,
    slug: string,
    title: string,
    message: string
  ): void {
    findings.push({ severity, category, slug, title, message });
  }

  // ─── Single fetch: ALL published recipes with full relations ───

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    include: {
      ingredients: {
        select: {
          name: true,
          amount: true,
          unit: true,
          sortOrder: true,
          isOptional: true,
          group: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: {
          stepNumber: true,
          instruction: true,
          tip: true,
          timerSeconds: true,
        },
        orderBy: { stepNumber: "asc" },
      },
      tags: {
        select: {
          tag: {
            select: { slug: true, name: true },
          },
        },
      },
      category: {
        select: { name: true, slug: true },
      },
    },
  });

  const totalCount = recipes.length;
  const now = new Date().toISOString();

  console.log("=".repeat(70));
  console.log("  TARIFLE DEEP DATABASE QUALITY AUDIT");
  console.log("=".repeat(70));
  console.log(`  Total published recipes: ${totalCount}`);
  console.log(`  Timestamp: ${now}`);
  console.log("");

  // ── Global collectors for summary stats ───────────────────

  const allUnits = new Map<string, number>();
  const allGroups = new Map<string, number>();
  const difficultyDist = new Map<string, number>();
  const cuisineDist = new Map<string, number>();
  const tipNoteValues = new Map<string, string[]>(); // value -> slugs
  const servingSuggValues = new Map<string, string[]>(); // value -> slugs

  // ═════════════════════════════════════════════════════════════
  // CHECK 1: INGREDIENT QUALITY
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const { slug, title, ingredients } = recipe;

    // 1a. sortOrder gaps
    const orders = ingredients.map((i) => i.sortOrder).sort((a, b) => a - b);
    if (orders.length > 0) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          addFinding(
            "WARNING",
            "INGREDIENT_QUALITY",
            slug,
            title,
            `sortOrder not contiguous 1..${orders.length}: got [${orders.join(",")}]`
          );
          break;
        }
      }
    }

    // 1b. sortOrder duplicates
    const orderSet = new Set(orders);
    if (orderSet.size !== orders.length) {
      const dupes = orders.filter(
        (o, i) => orders.indexOf(o) !== i
      );
      addFinding(
        "WARNING",
        "INGREDIENT_QUALITY",
        slug,
        title,
        `Duplicate sortOrder values: [${[...new Set(dupes)].join(",")}]`
      );
    }

    // 1c. Empty/whitespace ingredient name
    for (const ing of ingredients) {
      if (!ing.name || ing.name.trim().length === 0) {
        addFinding(
          "CRITICAL",
          "INGREDIENT_QUALITY",
          slug,
          title,
          `Empty/whitespace ingredient name at sortOrder=${ing.sortOrder}`
        );
      }
    }

    // 1d. Duplicate ingredient name (normalized). Same name in different
    // groups is legitimate (e.g. "Şeker" in both "Hamur için" and
    // "Şerbet için" for revani-style desserts), dedup key includes group.
    const namesSeen = new Map<string, number>();
    for (const ing of ingredients) {
      const key = `${normalizeIngredientName(ing.name)}::${ing.group ?? ""}`;
      const prev = namesSeen.get(key);
      if (prev !== undefined) {
        addFinding(
          "WARNING",
          "INGREDIENT_QUALITY",
          slug,
          title,
          `Duplicate ingredient name "${ing.name}" in same group at sortOrders ${prev} and ${ing.sortOrder}`
        );
      } else {
        namesSeen.set(key, ing.sortOrder);
      }
    }

    // 1e. Amount empty or "0"
    for (const ing of ingredients) {
      if (!ing.amount || ing.amount.trim() === "" || ing.amount.trim() === "0") {
        addFinding(
          "INFO",
          "INGREDIENT_QUALITY",
          slug,
          title,
          `Ingredient "${ing.name}" has empty/zero amount: "${ing.amount}"`
        );
      }
    }

    // 1f. Collect units for global summary
    for (const ing of ingredients) {
      if (ing.unit && ing.unit.trim()) {
        const u = trLower(ing.unit.trim());
        allUnits.set(u, (allUnits.get(u) ?? 0) + 1);
      }
    }
  }

  // 1f (global). Unit inconsistency check
  const unitPairs: [string, string][] = [
    ["gr", "gram"],
    ["yemek kaşığı", "yemek kasigi"],
    ["çay kaşığı", "cay kasigi"],
    ["ml", "mililitre"],
    ["lt", "litre"],
    ["kg", "kilogram"],
    ["tatlı kaşığı", "tatli kasigi"],
  ];
  for (const [a, b] of unitPairs) {
    if (allUnits.has(a) && allUnits.has(b)) {
      addFinding(
        "WARNING",
        "INGREDIENT_QUALITY",
        "_global_",
        "Unit Inconsistency",
        `Both "${a}" (${allUnits.get(a)}) and "${b}" (${allUnits.get(b)}) exist as units, standardize`
      );
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 2: GROUP CONSISTENCY
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const { slug, title, ingredients } = recipe;

    // Collect groups in this recipe
    const groups = ingredients.map((i) => i.group);
    const distinctGroups = new Set(groups.filter((g) => g !== null));

    // 2a. Partial grouping: recipe uses groups but some items are ungrouped
    if (distinctGroups.size >= 2) {
      const ungrouped = ingredients.filter((i) => i.group === null);
      if (ungrouped.length > 0) {
        addFinding(
          "WARNING",
          "GROUP_CONSISTENCY",
          slug,
          title,
          `Partial grouping: ${distinctGroups.size} group labels but ${ungrouped.length} ingredient(s) ungrouped: ${ungrouped.map((i) => `"${i.name}"`).join(", ")}`
        );
      }
    }

    // 2c. Single-ingredient groups
    const groupCounts = new Map<string, number>();
    for (const ing of ingredients) {
      if (ing.group) {
        groupCounts.set(ing.group, (groupCounts.get(ing.group) ?? 0) + 1);
      }
    }
    for (const [group, count] of groupCounts) {
      if (count === 1) {
        addFinding(
          "WARNING",
          "GROUP_CONSISTENCY",
          slug,
          title,
          `Group "${group}" contains only 1 ingredient, consider removing or merging`
        );
      }
    }

    // Collect all groups for global casing check
    for (const g of distinctGroups) {
      if (g) {
        allGroups.set(g, (allGroups.get(g) ?? 0) + 1);
      }
    }
  }

  // 2b (global). Group casing inconsistency
  const groupsByLower = new Map<string, string[]>();
  for (const g of allGroups.keys()) {
    const lower = trLower(g);
    const existing = groupsByLower.get(lower) ?? [];
    existing.push(g);
    groupsByLower.set(lower, existing);
  }
  for (const [lower, variants] of groupsByLower) {
    if (variants.length > 1) {
      addFinding(
        "WARNING",
        "GROUP_CONSISTENCY",
        "_global_",
        "Group Casing",
        `Group label casing variations for "${lower}": ${variants.map((v) => `"${v}" (${allGroups.get(v)})`).join(", ")}`
      );
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 3: STEP QUALITY
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const { slug, title, steps } = recipe;

    if (steps.length === 0) continue;

    // 3a. stepNumber gaps
    const stepNums = steps.map((s) => s.stepNumber).sort((a, b) => a - b);
    for (let i = 0; i < stepNums.length; i++) {
      if (stepNums[i] !== i + 1) {
        addFinding(
          "WARNING",
          "STEP_QUALITY",
          slug,
          title,
          `stepNumber not contiguous 1..${stepNums.length}: got [${stepNums.join(",")}]`
        );
        break;
      }
    }

    // 3b. stepNumber duplicates
    const stepSet = new Set(stepNums);
    if (stepSet.size !== stepNums.length) {
      const dupes = stepNums.filter((n, i) => stepNums.indexOf(n) !== i);
      addFinding(
        "CRITICAL",
        "STEP_QUALITY",
        slug,
        title,
        `Duplicate stepNumber values: [${[...new Set(dupes)].join(",")}]`
      );
    }

    // 3c. Empty instruction
    for (const step of steps) {
      if (!step.instruction || step.instruction.trim().length === 0) {
        addFinding(
          "CRITICAL",
          "STEP_QUALITY",
          slug,
          title,
          `Step ${step.stepNumber} has empty instruction`
        );
      }
    }

    // 3d. Very short instruction
    for (const step of steps) {
      if (
        step.instruction &&
        step.instruction.trim().length > 0 &&
        step.instruction.trim().length < 15
      ) {
        addFinding(
          "WARNING",
          "STEP_QUALITY",
          slug,
          title,
          `Step ${step.stepNumber} instruction very short (${step.instruction.trim().length} chars): "${step.instruction.trim()}"`
        );
      }
    }

    // 3e. timerSeconds vs instruction mismatch
    for (const step of steps) {
      if (step.timerSeconds && step.timerSeconds > 0) {
        const extracted = extractTimeFromInstruction(step.instruction);
        if (extracted !== null && extracted > 0) {
          const diff = Math.abs(step.timerSeconds - extracted);
          const ratio = diff / Math.max(step.timerSeconds, extracted);
          if (ratio > 0.5) {
            addFinding(
              "WARNING",
              "STEP_QUALITY",
              slug,
              title,
              `Step ${step.stepNumber} timer mismatch: timerSeconds=${step.timerSeconds}s but instruction mentions ~${extracted}s (${Math.round(ratio * 100)}% diff)`
            );
          }
        }
      }
    }

    // 3f. Duplicate consecutive steps
    const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
    for (let i = 1; i < sortedSteps.length; i++) {
      const prevText = trLower(sortedSteps[i - 1].instruction.trim());
      const currText = trLower(sortedSteps[i].instruction.trim());
      if (prevText === currText && prevText.length > 0) {
        addFinding(
          "WARNING",
          "STEP_QUALITY",
          slug,
          title,
          `Steps ${sortedSteps[i - 1].stepNumber} and ${sortedSteps[i].stepNumber} have identical instruction text`
        );
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 4: RECIPE CONSISTENCY
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const {
      slug,
      title,
      prepMinutes,
      cookMinutes,
      totalMinutes,
      servingCount,
      averageCalories,
      protein,
      carbs,
      fat,
      allergens,
      cuisine,
      tipNote,
      servingSuggestion,
      type,
      category,
    } = recipe;

    const tagSlugs = recipe.tags.map((t) => t.tag.slug);

    // 4a. Time consistency
    if (prepMinutes + cookMinutes > totalMinutes + 15) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `prep(${prepMinutes}) + cook(${cookMinutes}) = ${prepMinutes + cookMinutes} exceeds total(${totalMinutes}) by ${prepMinutes + cookMinutes - totalMinutes} min`
      );
    }

    // 4b. Total time extremes. Threshold raised to 36h because legitimate
    // cure/ferment recipes (salt-cured salmon, kvass, sourdough) can list
    // 24-36h total. Anything over 36h is a likely data error.
    if (totalMinutes === 0) {
      addFinding(
        "CRITICAL",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        "totalMinutes is 0"
      );
    } else if (totalMinutes > 2160) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `totalMinutes is ${totalMinutes} (>36 hours)`
      );
    }

    // 4c. Serving count extremes
    if (servingCount === 0) {
      addFinding(
        "CRITICAL",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        "servingCount is 0"
      );
    } else if (servingCount > 20) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `servingCount is ${servingCount} (>20)`
      );
    }

    // 4d. Calorie extremes. Lower bound now 1, plain coffee/tea recipes
    // legitimately list 0-5 kcal. Anything 0 is likely data omission but
    // 3-5 is realistic for unsweetened filtered coffee.
    if (averageCalories !== null) {
      if (averageCalories < 1) {
        addFinding(
          "WARNING",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `averageCalories suspiciously low: ${averageCalories}`
        );
      } else if (averageCalories > 2000) {
        addFinding(
          "WARNING",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `averageCalories suspiciously high: ${averageCalories}`
        );
      }
    }

    // 4e. Macro consistency: |4P + 4C + 9F - kcal| / kcal > 0.20
    // Skip when kcal < 10 (plain coffee/tea/water-based drinks, trace
    // calories don't meaningfully decompose into P/C/F).
    const hasAlkollu = tagSlugs.includes("alkollu");
    if (
      protein !== null &&
      carbs !== null &&
      fat !== null &&
      averageCalories !== null &&
      averageCalories >= 10 &&
      !hasAlkollu
    ) {
      const p = Number(protein);
      const c = Number(carbs);
      const f = Number(fat);
      const computed = 4 * p + 4 * c + 9 * f;
      const diff = Math.abs(computed - averageCalories);
      const ratio = diff / averageCalories;
      if (ratio > 0.2) {
        addFinding(
          "WARNING",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `Macro/calorie mismatch: 4*P(${p})+4*C(${c})+9*F(${f})=${Math.round(computed)} vs kcal=${averageCalories} (${Math.round(ratio * 100)}% off)`
        );
      }
    }

    // 4f. Tag-value mismatches
    if (tagSlugs.includes("30-dakika-alti") && totalMinutes > 30) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `Tagged "30-dakika-alti" but totalMinutes=${totalMinutes}`
      );
    }
    if (
      tagSlugs.includes("dusuk-kalorili") &&
      averageCalories !== null &&
      averageCalories > 400
    ) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `Tagged "dusuk-kalorili" but averageCalories=${averageCalories}`
      );
    }
    if (
      tagSlugs.includes("yuksek-protein") &&
      protein !== null &&
      Number(protein) < 15
    ) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        slug,
        title,
        `Tagged "yuksek-protein" but protein=${protein}g`
      );
    }

    // 4g. Vegan/vegetarian allergen conflicts
    if (tagSlugs.includes("vegan")) {
      const badAllergens = allergens.filter(
        (a) => a === "SUT" || a === "YUMURTA" || a === "DENIZ_URUNLERI"
      );
      if (badAllergens.length > 0) {
        addFinding(
          "CRITICAL",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `Tagged "vegan" but allergens include ${badAllergens.join(", ")}`
        );
      }
    }
    if (tagSlugs.includes("vejetaryen")) {
      if (allergens.includes("DENIZ_URUNLERI")) {
        addFinding(
          "WARNING",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `Tagged "vejetaryen" but allergens include DENIZ_URUNLERI`
        );
      }
    }

    // 4h. Cuisine mismatch via slug patterns
    if (cuisine) {
      const slugLower = slug.toLowerCase();
      const slugSegments = slugLower.split("-");
      for (const { pattern, cuisine: expected } of CUISINE_SLUG_CHECKS) {
        const matched = pattern.includes("-")
          ? slugLower.includes(pattern)
          : slugSegments.includes(pattern);
        if (matched && cuisine !== expected) {
          addFinding(
            "WARNING",
            "RECIPE_CONSISTENCY",
            slug,
            title,
            `Slug contains "${pattern}" (expected cuisine=${expected}) but cuisine="${cuisine}"`
          );
        }
      }
    }

    // 4i. Boilerplate tipNote/servingSuggestion (collect for grouping)
    if (tipNote) {
      const existing = tipNoteValues.get(tipNote) ?? [];
      existing.push(slug);
      tipNoteValues.set(tipNote, existing);
    }
    if (servingSuggestion) {
      const existing = servingSuggValues.get(servingSuggestion) ?? [];
      existing.push(slug);
      servingSuggValues.set(servingSuggestion, existing);
    }

    // 4j. type vs categorySlug mismatch
    const validCategorySlugs = TYPE_CATEGORY_MAP[type];
    // YEMEK is flexible, maps to many categories, so skip
    if (validCategorySlugs && type !== "YEMEK") {
      if (!validCategorySlugs.includes(category.slug)) {
        addFinding(
          "WARNING",
          "RECIPE_CONSISTENCY",
          slug,
          title,
          `type="${type}" expects category in [${validCategorySlugs.join(", ")}] but got "${category.slug}"`
        );
      }
    }

    // Collect distributions
    difficultyDist.set(
      recipe.difficulty,
      (difficultyDist.get(recipe.difficulty) ?? 0) + 1
    );
    cuisineDist.set(
      cuisine ?? "NULL",
      (cuisineDist.get(cuisine ?? "NULL") ?? 0) + 1
    );
  }

  // 4i (deferred). Flag boilerplate tipNote/servingSuggestion.
  // Threshold raised to 6 so authentic cultural notes ("Sarımsaklı
  // yoğurtla servis edin." on 5 mantı/köfte recipes) aren't flagged.
  // Aligned with fix-boilerplate-to-null.ts threshold.
  const BOILERPLATE_THRESHOLD = 6;
  for (const [value, slugs] of tipNoteValues) {
    if (slugs.length >= BOILERPLATE_THRESHOLD) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        "_global_",
        "Boilerplate tipNote",
        `tipNote "${value.slice(0, 80)}${value.length > 80 ? "..." : ""}" appears in ${slugs.length} recipes`
      );
    }
  }
  for (const [value, slugs] of servingSuggValues) {
    if (slugs.length >= BOILERPLATE_THRESHOLD) {
      addFinding(
        "WARNING",
        "RECIPE_CONSISTENCY",
        "_global_",
        "Boilerplate servingSuggestion",
        `servingSuggestion "${value.slice(0, 80)}${value.length > 80 ? "..." : ""}" appears in ${slugs.length} recipes`
      );
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 5: DUPLICATE DETECTION
  // ═════════════════════════════════════════════════════════════

  // 5a. Exact duplicate descriptions
  const descMap = new Map<string, string[]>();
  for (const recipe of recipes) {
    const desc = recipe.description.trim();
    if (desc.length === 0) continue;
    const existing = descMap.get(desc) ?? [];
    existing.push(recipe.slug);
    descMap.set(desc, existing);
  }
  for (const [desc, slugs] of descMap) {
    if (slugs.length > 1) {
      addFinding(
        "WARNING",
        "DUPLICATE_DETECTION",
        slugs[0],
        "Duplicate Description",
        `${slugs.length} recipes share identical description: [${slugs.join(", ")}], "${desc.slice(0, 60)}..."`
      );
    }
  }

  // 5b. Near-duplicate titles (normalize then exact match)
  const titleMap = new Map<string, string[]>();
  for (const recipe of recipes) {
    const norm = normalizeTitle(recipe.title);
    const existing = titleMap.get(norm) ?? [];
    existing.push(recipe.slug);
    titleMap.set(norm, existing);
  }
  for (const [norm, slugs] of titleMap) {
    if (slugs.length > 1) {
      addFinding(
        "WARNING",
        "DUPLICATE_DETECTION",
        slugs[0],
        "Near-Duplicate Title",
        `${slugs.length} recipes share normalized title "${norm}": [${slugs.join(", ")}]`
      );
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 6: ALLERGEN ACCURACY
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const { slug, title, allergens, ingredients } = recipe;
    const allergenSet = new Set(allergens);

    for (const rule of ALLERGEN_RULES) {
      // Check if ANY ingredient matches this allergen
      const matchingIngredients = ingredients.filter((ing) =>
        ingredientMatchesAllergen(ing.name, rule)
      );

      const hasAllergenTag = allergenSet.has(rule.allergen as never);

      // 6a. MISSING: ingredient matches but allergen not tagged
      if (matchingIngredients.length > 0 && !hasAllergenTag) {
        addFinding(
          "CRITICAL",
          "ALLERGEN_ACCURACY",
          slug,
          title,
          `Missing allergen ${rule.allergen}: ingredients [${matchingIngredients.map((i) => `"${i.name}"`).join(", ")}] suggest it should be present`
        );
      }

      // 6b. OVER-TAGGED: allergen tagged but no ingredient matches
      if (hasAllergenTag && matchingIngredients.length === 0) {
        addFinding(
          "WARNING",
          "ALLERGEN_ACCURACY",
          slug,
          title,
          `Over-tagged allergen ${rule.allergen}: no ingredient matches any keyword`
        );
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // CHECK 7: GENERAL
  // ═════════════════════════════════════════════════════════════

  for (const recipe of recipes) {
    const { slug, title, cuisine, emoji } = recipe;
    const tagSlugs = recipe.tags.map((t) => t.tag.slug);

    // 7a. 0 tags
    if (tagSlugs.length === 0) {
      addFinding(
        "WARNING",
        "GENERAL",
        slug,
        title,
        "Recipe has 0 tags"
      );
    }

    // 7b. Null cuisine
    if (cuisine === null) {
      addFinding(
        "WARNING",
        "GENERAL",
        slug,
        title,
        "Recipe has null cuisine"
      );
    }

    // 7c. Null emoji
    if (emoji === null) {
      addFinding(
        "WARNING",
        "GENERAL",
        slug,
        title,
        "Recipe has null emoji"
      );
    }
  }

  // ═════════════════════════════════════════════════════════════
  // REPORT OUTPUT
  // ═════════════════════════════════════════════════════════════

  const criticals = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");
  const infos = findings.filter((f) => f.severity === "INFO");

  // ── Per-category summary ──────────────────────────────────

  const categories = [
    "INGREDIENT_QUALITY",
    "GROUP_CONSISTENCY",
    "STEP_QUALITY",
    "RECIPE_CONSISTENCY",
    "DUPLICATE_DETECTION",
    "ALLERGEN_ACCURACY",
    "GENERAL",
  ];

  console.log("=".repeat(70));
  console.log("  PER-CATEGORY SUMMARY");
  console.log("=".repeat(70));
  for (const cat of categories) {
    const catFindings = findings.filter((f) => f.category === cat);
    const c = catFindings.filter((f) => f.severity === "CRITICAL").length;
    const w = catFindings.filter((f) => f.severity === "WARNING").length;
    const i = catFindings.filter((f) => f.severity === "INFO").length;
    console.log(
      `  ${cat.padEnd(25)} CRITICAL: ${String(c).padStart(3)}  WARNING: ${String(w).padStart(3)}  INFO: ${String(i).padStart(3)}`
    );
  }
  console.log(
    `\n  TOTAL                   CRITICAL: ${String(criticals.length).padStart(3)}  WARNING: ${String(warnings.length).padStart(3)}  INFO: ${String(infos.length).padStart(3)}`
  );

  // ── CRITICAL findings detail ──────────────────────────────

  if (criticals.length > 0) {
    console.log("");
    console.log("=".repeat(70));
    console.log("  CRITICAL FINDINGS");
    console.log("=".repeat(70));
    for (const f of criticals) {
      console.log(`  [CRITICAL] [${f.category}] ${f.slug}`);
      console.log(`             ${f.title}`);
      console.log(`             ${f.message}`);
      console.log("");
    }
  }

  // ── WARNING findings detail ───────────────────────────────

  if (warnings.length > 0) {
    console.log("");
    console.log("=".repeat(70));
    console.log("  WARNING FINDINGS");
    console.log("=".repeat(70));
    for (const f of warnings) {
      console.log(`  [WARNING] [${f.category}] ${f.slug}`);
      console.log(`            ${f.title}`);
      console.log(`            ${f.message}`);
      console.log("");
    }
  }

  // ── INFO findings summary (counts only) ───────────────────

  if (infos.length > 0) {
    console.log("");
    console.log("=".repeat(70));
    console.log("  INFO FINDINGS (counts only)");
    console.log("=".repeat(70));
    // Group by category + message pattern
    const infoCounts = new Map<string, number>();
    for (const f of infos) {
      const key = `[${f.category}] ${f.message.slice(0, 100)}`;
      infoCounts.set(key, (infoCounts.get(key) ?? 0) + 1);
    }
    for (const [key, count] of [...infoCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ${key} (x${count})`);
    }
  }

  // ── Global summaries ──────────────────────────────────────

  console.log("");
  console.log("=".repeat(70));
  console.log("  GLOBAL SUMMARIES");
  console.log("=".repeat(70));

  // Unit distribution (top 30)
  console.log("\n  --- Unit Distribution (top 30) ---");
  const sortedUnits = [...allUnits.entries()].sort((a, b) => b[1] - a[1]);
  for (const [unit, count] of sortedUnits.slice(0, 30)) {
    console.log(`    ${unit.padEnd(25)} ${String(count).padStart(5)}`);
  }
  if (sortedUnits.length > 30) {
    console.log(`    ... and ${sortedUnits.length - 30} more unique units`);
  }

  // Group label distribution
  console.log("\n  --- Group Label Distribution ---");
  const sortedGroups = [...allGroups.entries()].sort((a, b) => b[1] - a[1]);
  for (const [group, count] of sortedGroups) {
    console.log(`    ${group.padEnd(30)} ${String(count).padStart(5)}`);
  }

  // Difficulty distribution
  console.log("\n  --- Difficulty Distribution ---");
  for (const [diff, count] of [...difficultyDist.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(
      `    ${diff.padEnd(10)} ${String(count).padStart(5)} (${((count / totalCount) * 100).toFixed(1)}%)`
    );
  }

  // Cuisine distribution
  console.log("\n  --- Cuisine Distribution ---");
  for (const [c, count] of [...cuisineDist.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(
      `    ${c.padEnd(10)} ${String(count).padStart(5)} (${((count / totalCount) * 100).toFixed(1)}%)`
    );
  }

  // ── Exit code ─────────────────────────────────────────────

  console.log("");
  console.log("=".repeat(70));
  if (criticals.length > 0) {
    console.log(
      `  RESULT: FAIL, ${criticals.length} CRITICAL issue(s) found`
    );
    console.log("=".repeat(70));
    process.exit(1);
  } else {
    console.log("  RESULT: PASS, no CRITICAL issues");
    console.log("=".repeat(70));
  }
}

main()
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
