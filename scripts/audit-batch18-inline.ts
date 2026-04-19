/**
 * Inline audit for the latest batch seeds. Reads the `recipes` export from
 * `scripts/seed-recipes.ts` (no DB access), filters to the last N entries
 * (= last seeded batch), and runs a keyword-based ingredient → allergen
 * mismatch check that mirrors audit-deep's CRITICAL category.
 *
 * Why a separate script: scripts/audit-deep.ts hangs silently on Windows
 * (no output past the dotenv banner) — root cause not yet isolated. This
 * file-based pass gives a deterministic pre-prod check.
 *
 * Matches brief §9 allergen checklist keyword → required allergen set.
 *
 * Usage:
 *   npx tsx scripts/audit-batch18-inline.ts              # scans last 100
 *   npx tsx scripts/audit-batch18-inline.ts --last 100 --label "batch 19"
 */
import { recipes } from "./seed-recipes";

type Allergen =
  | "GLUTEN"
  | "SUT"
  | "YUMURTA"
  | "KUSUYEMIS"
  | "YER_FISTIGI"
  | "SOYA"
  | "DENIZ_URUNLERI"
  | "SUSAM"
  | "KEREVIZ"
  | "HARDAL";

function trNormalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ş", "s")
    .replaceAll("ü", "u");
}

// Keyword → allergen rules. Match is substring on normalized ingredient
// names. Exclusions prevent false positives (coconut milk is plant-based,
// so "hindistan cevizi" must not trigger KUSUYEMIS).
interface Rule {
  allergen: Allergen;
  keywords: string[];
  // If any of these substrings is present, skip the rule for that ingredient.
  exclusions?: string[];
}

const RULES: Rule[] = [
  {
    allergen: "SUT",
    keywords: [
      "tereyag",
      "sut", // matches "süt" and "sutsuz" — excluded below
      "yogurt",
      "krema",
      "peynir",
      "kasar",
      "kaymak",
      "mozzarella",
      "ricotta",
      "feta",
      "cheddar",
      "parmesan",
      "labne",
      "mascarpone",
      "emmental",
    ],
    exclusions: [
      "hindistan cevizi sut", // coconut milk is plant-based
      "badem sut",
      "soya sut",
      "yulaf sut",
      "sutsuz",
    ],
  },
  {
    allergen: "YUMURTA",
    keywords: ["yumurta"],
  },
  {
    allergen: "DENIZ_URUNLERI",
    keywords: [
      "balik",
      "somon",
      "karides",
      "kalamar",
      "mürekkep",
      "murekkep",
      "istiridye",
      "midye",
      "hamsi",
      "levrek",
      "ton bal",
      "tonbal",
      "istakoz",
      "yengec",
      "ahtapot",
      "uskumru",
      "palamut",
    ],
  },
  {
    allergen: "KUSUYEMIS",
    keywords: [
      "findik",
      "ceviz",
      "badem",
      "antep fistig",
      "kaju",
      "macadamia",
      "pistachio",
      "kestane",
      "pecan",
    ],
    exclusions: ["hindistan cevizi"], // palm family, not tree nut
  },
  {
    allergen: "HARDAL",
    keywords: ["hardal"],
  },
  {
    allergen: "SUSAM",
    keywords: ["susam", "tahin"],
  },
  {
    allergen: "GLUTEN",
    keywords: [
      "bugday",
      "un ", // trailing space — avoid matching "undur", "unlu mamul"
      "ekmek",
      "bulgur",
      "makarna",
      "arpa",
      "cavdar",
      "yulaf",
      "kraker",
      "biskuvi",
      "irmik",
      "galeta",
    ],
  },
  {
    allergen: "SOYA",
    keywords: ["soya", "tofu", "edamame", "miso"],
  },
  {
    allergen: "YER_FISTIGI",
    keywords: ["yer fistig", "peanut"],
  },
];

interface Finding {
  slug: string;
  title: string;
  missing: Allergen[];
  trigger: string[];
}

function auditRecipe(recipe: (typeof recipes)[number]): Finding | null {
  const presentAllergens = new Set<Allergen>(
    (recipe.allergens ?? []) as readonly Allergen[],
  );
  const missing: Allergen[] = [];
  const triggers: string[] = [];

  const ingredientNames = recipe.ingredients.map((i) => trNormalize(i.name));

  for (const rule of RULES) {
    if (presentAllergens.has(rule.allergen)) continue;

    for (const keyword of rule.keywords) {
      const keyNorm = trNormalize(keyword);
      const hit = ingredientNames.find((name) => {
        if (!name.includes(keyNorm)) return false;
        if (rule.exclusions?.some((ex) => name.includes(trNormalize(ex)))) {
          return false;
        }
        return true;
      });
      if (hit) {
        missing.push(rule.allergen);
        triggers.push(`${rule.allergen} ← "${hit}"`);
        break;
      }
    }
  }

  if (missing.length === 0) return null;
  return { slug: recipe.slug, title: recipe.title, missing, trigger: triggers };
}

function parseLast(): number {
  const idx = process.argv.indexOf("--last");
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = Number(process.argv[idx + 1]);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return 100;
}

function parseLabel(): string {
  const idx = process.argv.indexOf("--label");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return "son batch";
}

function main(): void {
  const size = parseLast();
  const label = parseLabel();
  const slice = recipes.slice(-size);
  console.log(`🔍 audit-inline (${label}) — ${slice.length} tarif taranıyor\n`);

  const findings: Finding[] = [];
  for (const r of slice) {
    const finding = auditRecipe(r);
    if (finding) findings.push(finding);
  }

  if (findings.length === 0) {
    console.log(`✅ ${label} — CRITICAL allergen eksiği yok.`);
    return;
  }

  console.log(`⚠  ${findings.length} potansiyel allergen eksiği:\n`);
  for (const f of findings) {
    console.log(`  ${f.title} (${f.slug})`);
    for (const t of f.trigger) {
      console.log(`    • ${t}`);
    }
    console.log("");
  }
}

main();
