/**
 * Remove allergen tags that no ingredient actually triggers (per
 * audit-deep.ts' expanded keyword + customMatch + excludePatterns logic).
 *
 * Safety: YUMURTA is excluded by default, some baked-goods recipes have
 * incomplete ingredient lists (egg/süt implicit) and auto-removing YUMURTA
 * would be user-visible allergen downgrade. Run with --include-yumurta
 * when ingredient lists are known-complete.
 *
 *   npx tsx scripts/fix-overtag-allergens.ts                    # dry run
 *   npx tsx scripts/fix-overtag-allergens.ts --apply            # write
 *   npx tsx scripts/fix-overtag-allergens.ts --apply --include-yumurta
 */
import { PrismaClient, type Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const INCLUDE_YUMURTA = process.argv.includes("--include-yumurta");

// ═══════ Mirror of audit-deep.ts ALLERGEN_RULES (simplified) ═══════
//
// This is a standalone implementation so the fix script doesn't depend
// on audit-deep.ts internals. If audit-deep rules change, keep these
// in sync.

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

function asciiNormalize(s: string): string {
  return trLower(s)
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
}

function hasStandaloneWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|\\s|[,;.!?/()\\-])${escaped}(?:$|\\s|[,;.!?/()\\-])`,
    "i",
  );
  return re.test(` ${text} `);
}

interface Rule {
  allergen: Allergen;
  keywords: string[];
  excludePatterns?: string[];
  customMatch?: (name: string) => boolean;
}

const RULES: Rule[] = [
  {
    allergen: "GLUTEN",
    keywords: [
      "buğday","bulgur","yufka","galeta","kadayıf","pide","lavaş","börek",
      "irmik","çavdar","kepek","kraker","bisküvi","kek","hamur","simit",
      "şehriye","kuş başı","baklava","yulaf","granola","kuskus","freekeh",
      "noodle","wonton","yakisoba","spagetti","spaghetti","penne","fusilli",
      "fettuccine","tagliatelle","tagliolini","linguine","rigatoni",
      "farfalle","lasagna","lazanya","udon","gnocchi","tortilla","ravioli",
      "tortellini","orzo","pastitsio","tost","bagel","milfoy","pita",
      "tandir ekmeg","muffin","kruton","güllaç","misugaru",
    ],
    excludePatterns: [
      "pirinç unu","mısır unu","pirinç eriştesi","pirinç nişastası",
      "mısır nişastası","patates nişastası","tatlı patates nişastası",
      "nohut unu","badem unu","hindistan cevizi unu","karabuğday",
      "yapışkan pirinç unu","manyok unu","manyok nişastası","pirinç keki",
      "pirinç noodle","cam noodle","mısır tortilla","tortilla cipsi",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      const ascii = asciiNormalize(name);
      const glutenFreeExempt = [
        "pirinç","mısır","patates","nohut","badem","hindistan",
        "karabuğday","yapışkan","manyok","tatlı patates",
      ];
      if (glutenFreeExempt.some((ex) => lower.startsWith(ex))) return false;
      if (lower.includes("nişasta")) return lower === "nişasta";
      if (lower.includes("erişte")) {
        const gf = ["pirinç","cam","tatlı patates","soba"];
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
      "yoğurt","krema","peynir","kaymak","tereyağı","labne","lor","kaşar",
      "ayran","dondurma","mozzarella","parmesan","ricotta","mascarpone",
      "feta","pecorino","cheddar","kefir","filmjölk","smetana",
      "kırmızı peynir","krem peynir",
    ],
    excludePatterns: [
      "hindistan cevizi sütü","hindistan cevizi kreması","badem sütü",
      "yulaf sütü","pirinç sütü","soya sütü","kokos sütü","kokos kreması",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      if (lower.includes("süt")) {
        const plant = ["hindistan","badem","yulaf","pirinç","soya","kokos"];
        return !plant.some((p) => lower.includes(p));
      }
      return false;
    },
  },
  {
    allergen: "YUMURTA",
    keywords: ["yumurta","mayonez"],
  },
  {
    allergen: "KUSUYEMIS",
    keywords: [
      "ceviz","badem","fındık","antep fıstığı","kaju","pekan","çam fıstığı",
      "macadamia","dolmalık fıstık","kestane",
    ],
    excludePatterns: [
      "hindistan cevizi","hindistan cevizi sütü","hindistan cevizi rendesi",
      "hindistan cevizi yağı","hindistan cevizi kreması","hindistan cevizi unu",
      "kokos","kestane mantarı","kestane mantar",
    ],
    customMatch: (name) => {
      const lower = trLower(name);
      if (lower.includes("ceviz") && lower.includes("hindistan")) return false;
      if (lower.includes("kestane") && lower.includes("mantar")) return false;
      return false; // keyword path handles the positives
    },
  },
  {
    allergen: "YER_FISTIGI",
    keywords: ["yer fıstığı","fıstık ezmesi"],
  },
  {
    allergen: "SOYA",
    keywords: [
      "soya","tofu","miso","edamame","gochujang","chunjang",
      "siyah fasulye ezmesi","tonkatsu sosu","japon köri","misugaru",
    ],
  },
  {
    allergen: "DENIZ_URUNLERI",
    keywords: [
      "balık","somon","levrek","hamsi","karides","midye","kalamar",
      "ahtapot","karidesli","palamut","istavrit","yengeç","deniz tarağı",
      "ançüez","bonito","istiridye","ton balığı",
    ],
  },
  {
    allergen: "SUSAM",
    keywords: ["susam","tahin","furikake","zaatar"],
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

function ingredientMatches(name: string, rule: Rule): boolean {
  const lower = trLower(name);
  const ascii = asciiNormalize(name);
  if (
    rule.excludePatterns?.some(
      (ex) => lower.includes(ex) || ascii.includes(asciiNormalize(ex)),
    )
  ) return false;
  if (rule.customMatch?.(name)) return true;
  return rule.keywords.some(
    (kw) => lower.includes(kw) || ascii.includes(asciiNormalize(kw)),
  );
}

// ═══════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  assertDbTarget("fix-overtag-allergens");
  console.log(
    `🔧 fix-overtag-allergens (${APPLY ? "APPLY" : "DRY RUN"}, yumurta ${INCLUDE_YUMURTA ? "IN" : "EX"}cluded) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      allergens: true,
      ingredients: { select: { name: true } },
    },
  });

  const ALLERGEN_ORDER: Allergen[] = [
    "GLUTEN","SUT","YUMURTA","KUSUYEMIS","YER_FISTIGI",
    "SOYA","DENIZ_URUNLERI","SUSAM","KEREVIZ","HARDAL",
  ];

  let willWrite = 0;
  const byAllergen: Record<string, string[]> = {};

  for (const r of recipes) {
    const current = new Set<Allergen>(r.allergens as Allergen[]);
    const keep = new Set<Allergen>();
    const remove: Allergen[] = [];
    for (const a of current) {
      // Skip YUMURTA removal unless explicitly opted in
      if (a === "YUMURTA" && !INCLUDE_YUMURTA) {
        keep.add(a);
        continue;
      }
      const rule = RULES.find((rr) => rr.allergen === a);
      if (!rule) {
        keep.add(a);
        continue;
      }
      const hasMatch = r.ingredients.some((i) => ingredientMatches(i.name, rule));
      if (hasMatch) {
        keep.add(a);
      } else {
        remove.push(a);
        (byAllergen[a] ??= []).push(r.slug);
      }
    }
    if (remove.length === 0) continue;
    willWrite++;
    const kept = ALLERGEN_ORDER.filter((a) => keep.has(a));
    console.log(
      `  ${r.slug.padEnd(34)} [${[...current].join(",") || "∅"}] → [${kept.join(",") || "∅"}]  (-${remove.join(",-")})`,
    );
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: kept },
      });
    }
  }

  console.log("\n=== Per-allergen removal counts ===");
  for (const [a, slugs] of Object.entries(byAllergen).sort(
    (x, y) => y[1].length - x[1].length,
  )) {
    console.log(`  ${a.padEnd(18)} ${slugs.length} removal(s)`);
  }

  const verb = APPLY ? "Updated" : "Would update";
  console.log(`\n${verb}: ${willWrite} recipe(s)`);
  if (!APPLY) console.log("(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
