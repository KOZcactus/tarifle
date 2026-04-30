/**
 * Empty allergen audit, prod DB'de allergens=[] olan tüm tarifleri tara
 * ve ingredient listesini inferAllergensFromIngredients ile test et. Çıktı:
 *
 *   docs/empty-allergens-plan-2026-04-20.csv
 *     slug, title, cuisine, current_allergens, suggested_allergens,
 *     ingredient_matches, confidence
 *
 * Confidence heuristic:
 *   - high: birden fazla ingredient aynı allergen'i destekliyorsa ya da
 *     brief §5 tablosundan birebir keyword match (tereyagi, irmik, yumurta, vb.)
 *   - medium: tek ingredient tek allergen, keyword net
 *   - low: keyword belirsiz (tek substring match)
 *
 * Usage:
 *   npx tsx scripts/audit-empty-allergens.ts                  # dev
 *   DATABASE_URL=<prod> npx tsx scripts/audit-empty-allergens.ts  # prod (read-only)
 */
import { PrismaClient, Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { inferAllergensFromIngredients, ingredientMatchesAllergen } from "../src/lib/allergen-matching";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Brief §5 "high-confidence" keyword listesi, şüphesiz allergen işareti
// verir. Audit'te tek ingredient'ta high-confidence keyword varsa direkt
// "high" confidence flag.
const HIGH_CONFIDENCE_KEYWORDS: { keyword: string; allergen: Allergen }[] = [
  { keyword: "tereyagi", allergen: "SUT" },
  { keyword: "tereyağı", allergen: "SUT" },
  { keyword: "yogurt", allergen: "SUT" },
  { keyword: "yoğurt", allergen: "SUT" },
  { keyword: "peynir", allergen: "SUT" },
  { keyword: "süt", allergen: "SUT" },
  { keyword: "krema", allergen: "SUT" },
  { keyword: "kaymak", allergen: "SUT" },
  { keyword: "labne", allergen: "SUT" },
  { keyword: "ayran", allergen: "SUT" },
  { keyword: "lor", allergen: "SUT" },
  { keyword: "minci", allergen: "SUT" },
  { keyword: "cokelek", allergen: "SUT" },
  { keyword: "çökelek", allergen: "SUT" },
  { keyword: "yumurta", allergen: "YUMURTA" },
  // NOT: "un" keyword çok broad (pastirmali, tutum, pantuflas, sogan...
  // false positive). Sadece bariz un varyantlarını ekliyoruz: "bugday unu",
  // "misir unu" değil (mısır unu glutensiz), "nohut unu" (gluten-free),
  // çok spesifik. Direkt "buğday unu" tek geçerli keyword.
  { keyword: "bugday unu", allergen: "GLUTEN" },
  { keyword: "buğday unu", allergen: "GLUTEN" },
  { keyword: "tam bugday", allergen: "GLUTEN" },
  { keyword: "tam buğday", allergen: "GLUTEN" },
  { keyword: "irmik", allergen: "GLUTEN" },
  { keyword: "bulgur", allergen: "GLUTEN" },
  { keyword: "yufka", allergen: "GLUTEN" },
  { keyword: "kadayıf", allergen: "GLUTEN" },
  { keyword: "makarna", allergen: "GLUTEN" },
  { keyword: "ekmek", allergen: "GLUTEN" },
  { keyword: "börek", allergen: "GLUTEN" },
  { keyword: "yulaf", allergen: "GLUTEN" },
  { keyword: "firik", allergen: "GLUTEN" },
  { keyword: "cavdar", allergen: "GLUTEN" },
  { keyword: "çavdar", allergen: "GLUTEN" },
  { keyword: "pide", allergen: "GLUTEN" },
  { keyword: "lavas", allergen: "GLUTEN" },
  { keyword: "lavaş", allergen: "GLUTEN" },
  { keyword: "ceviz", allergen: "KUSUYEMIS" },
  { keyword: "badem", allergen: "KUSUYEMIS" },
  { keyword: "fındık", allergen: "KUSUYEMIS" },
  { keyword: "findik", allergen: "KUSUYEMIS" },
  { keyword: "antep fıstığı", allergen: "KUSUYEMIS" },
  { keyword: "antep fistigi", allergen: "KUSUYEMIS" },
  { keyword: "kaju", allergen: "KUSUYEMIS" },
  { keyword: "kestane", allergen: "KUSUYEMIS" },
  { keyword: "yer fıstığı", allergen: "YER_FISTIGI" },
  { keyword: "yer fistigi", allergen: "YER_FISTIGI" },
  { keyword: "fıstık ezmesi", allergen: "YER_FISTIGI" },
  { keyword: "soya sosu", allergen: "SOYA" },
  { keyword: "tofu", allergen: "SOYA" },
  { keyword: "miso", allergen: "SOYA" },
  { keyword: "edamame", allergen: "SOYA" },
  { keyword: "susam", allergen: "SUSAM" },
  { keyword: "tahin", allergen: "SUSAM" },
  { keyword: "balık", allergen: "DENIZ_URUNLERI" },
  { keyword: "somon", allergen: "DENIZ_URUNLERI" },
  { keyword: "karides", allergen: "DENIZ_URUNLERI" },
  { keyword: "midye", allergen: "DENIZ_URUNLERI" },
  { keyword: "hamsi", allergen: "DENIZ_URUNLERI" },
  { keyword: "ton balığı", allergen: "DENIZ_URUNLERI" },
  { keyword: "hardal", allergen: "HARDAL" },
];

// Brief §5 istisnalar, Hindistan cevizi özellikle: coconut/süt/rende KUSUYEMIS değil
// Brief §5 istisnalar: coconut-based ingredient'lerde KUSUYEMIS + SUT
// flag'lenmemeli. Hem "hindistancevizi" (birleşik) hem "hindistan cevizi"
// (ayrık) yazımları exclude'lu; normalize tire/boşluk farkını silmiyor
// çünkü ASCII fold sadece diacritic temizler, whitespace tutar.
// "pina colada" / "coconut" da coconut sayılır.
// Coconut derivatives: süt/krema/yağ/rende hepsi coconut-based, dairy değil,
// tree-nut değil. Tarif herhangi bir coconut ingredient içeriyorsa
// SUT + KUSUYEMIS flag'lerini topluca filtrele.
const EXCLUDE_CONTEXT: { allergen: Allergen; if_contains: string }[] = [
  { allergen: "KUSUYEMIS", if_contains: "hindistancevizi" },
  { allergen: "KUSUYEMIS", if_contains: "hindistan cevizi" },
  { allergen: "KUSUYEMIS", if_contains: "coconut" },
  { allergen: "SUT", if_contains: "hindistancevizi" }, // süt/krema/yağ hepsi
  { allergen: "SUT", if_contains: "hindistan cevizi" },
  { allergen: "SUT", if_contains: "coconut" },
  { allergen: "SUT", if_contains: "badem sutu" },
  { allergen: "SUT", if_contains: "yulaf sutu" },
  { allergen: "SUT", if_contains: "soya sutu" },
  // "tereyağı yerine" deyimi: tarif tereyağı KULLANMIYOR, vegan substitute.
  // Oturum 34: tarka-dal "Tereyağı yerine sıvı yağ" ingredient false positive
  // SUT eklenmesini önerdi, gerçekte tarif vegan. Aynı pattern audit-recipe-
  // quality.ts'te mevcut, burada da yansıt.
  { allergen: "SUT", if_contains: "tereyagi yerine" },
  { allergen: "GLUTEN", if_contains: "kavun cekirdegi" },
  { allergen: "GLUTEN", if_contains: "kabak cekirdegi" },
  { allergen: "GLUTEN", if_contains: "karabugday" },
  { allergen: "GLUTEN", if_contains: "misir unu" }, // mısır glutensiz
  { allergen: "GLUTEN", if_contains: "nohut unu" }, // besan/chickpea glutensiz
  { allergen: "GLUTEN", if_contains: "pirinc unu" }, // pirinç glutensiz
];

interface Finding {
  slug: string;
  title: string;
  cuisine: string | null;
  suggested: Allergen[];
  matches: { allergen: Allergen; ingredient: string; keyword: string }[];
  confidence: "high" | "medium" | "low";
}

function isExcluded(ingredientNames: string[], allergen: Allergen): boolean {
  const joined = ingredientNames
    .join(" ")
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
  return EXCLUDE_CONTEXT.some(
    (e) => e.allergen === allergen && joined.includes(e.if_contains),
  );
}

function matchDetails(
  ingredientNames: string[],
): { allergen: Allergen; ingredient: string; keyword: string }[] {
  const hits: { allergen: Allergen; ingredient: string; keyword: string }[] = [];
  for (const ing of ingredientNames) {
    const normalized = ing
      .toLocaleLowerCase("tr-TR")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u");
    for (const { keyword, allergen } of HIGH_CONFIDENCE_KEYWORDS) {
      const kwNorm = keyword
        .toLocaleLowerCase("tr-TR")
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ş/g, "s")
        .replace(/ü/g, "u");
      if (normalized.includes(kwNorm)) {
        hits.push({ allergen, ingredient: ing, keyword });
      }
    }
  }
  return hits;
}

function pickConfidence(matches: { allergen: Allergen }[]): "high" | "medium" | "low" {
  if (matches.length === 0) return "low";
  const perAllergen = new Map<Allergen, number>();
  for (const m of matches) {
    perAllergen.set(m.allergen, (perAllergen.get(m.allergen) ?? 0) + 1);
  }
  const maxCount = Math.max(...perAllergen.values());
  if (maxCount >= 2) return "high";
  if (matches.length === 1) return "medium";
  return "medium";
}

async function main(): Promise<void> {
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      return "unknown";
    }
  })();
  console.log(`Empty allergen audit, host: ${host}\n`);

  const recipes = await prisma.recipe.findMany({
    where: { allergens: { equals: [] } },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      ingredients: { select: { name: true } },
    },
    orderBy: { slug: "asc" },
  });
  console.log(`Total recipes with empty allergens: ${recipes.length}\n`);

  const findings: Finding[] = [];
  let noMatch = 0;

  for (const r of recipes) {
    const ingredientNames = r.ingredients.map((i) => i.name);
    const rawMatches = matchDetails(ingredientNames);

    // Exclude false positives (Hindistan cevizi, kavun çekirdeği, karabuğday)
    const filtered = rawMatches.filter((m) => !isExcluded(ingredientNames, m.allergen));

    if (filtered.length === 0) {
      noMatch++;
      continue;
    }

    // Deduplicate suggested allergens
    const suggested = [...new Set(filtered.map((m) => m.allergen))];
    findings.push({
      slug: r.slug,
      title: r.title,
      cuisine: r.cuisine,
      suggested,
      matches: filtered,
      confidence: pickConfidence(filtered),
    });
  }

  // Breakdown
  const high = findings.filter((f) => f.confidence === "high").length;
  const medium = findings.filter((f) => f.confidence === "medium").length;
  const low = findings.filter((f) => f.confidence === "low").length;

  console.log(`Breakdown:`);
  console.log(`  high confidence   (birden fazla ingredient destekler): ${high}`);
  console.log(`  medium confidence (tek ingredient net keyword):        ${medium}`);
  console.log(`  low confidence    (belirsiz match):                    ${low}`);
  console.log(`  no match         (gerçek zararsız, [] doğru):          ${noMatch}`);
  console.log(`\nTotal action items: ${findings.length}`);

  // Suggested allergen dağılımı
  const perAllergen = new Map<Allergen, number>();
  for (const f of findings) {
    for (const a of f.suggested) {
      perAllergen.set(a, (perAllergen.get(a) ?? 0) + 1);
    }
  }
  console.log(`\nSuggested allergen dağılımı:`);
  for (const [a, n] of [...perAllergen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${a.padEnd(18)} ${n}`);
  }

  // First 20 high-confidence samples (Kerem için göz atma)
  console.log(`\nİlk 20 HIGH confidence (review için örnek):`);
  for (const f of findings.filter((x) => x.confidence === "high").slice(0, 20)) {
    const keywords = [...new Set(f.matches.map((m) => m.keyword))];
    console.log(`  ${f.slug.padEnd(55)} +${f.suggested.join(",")}  via ${keywords.join(", ")}`);
  }

  // CSV yaz
  const csvPath = path.resolve(__d, "..", "docs", "empty-allergens-plan-2026-04-20.csv");
  const rows = ["slug,title,cuisine,suggested_allergens,ingredient_matches,confidence"];
  for (const f of findings) {
    const matches = f.matches.map((m) => `${m.allergen}:${m.keyword}`).join("|");
    rows.push(
      [
        f.slug,
        `"${f.title.replace(/"/g, '""')}"`,
        f.cuisine ?? "",
        f.suggested.join(";"),
        `"${matches}"`,
        f.confidence,
      ].join(","),
    );
  }
  fs.writeFileSync(csvPath, rows.join("\n") + "\n", "utf8");
  console.log(`\n✅ CSV written: ${csvPath}`);

  // Suppress unused import warning
  void ingredientMatchesAllergen;
  void inferAllergensFromIngredients;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
