/**
 * Step ↔ Ingredient mismatch detector, independent second-opinion tarama
 * paralel Codex2'nin 27-tarif listesi için.
 *
 * Algorithm: baseline seasoning/kitchen-staple keyword'lerini step
 * instruction'larda ara. Eğer bir baseline step'te geçiyorsa VE tarif'in
 * ingredient listesinde bu baseline'a uyacak bir isim YOKSA → flag.
 *
 * Confidence heuristic:
 *   - HIGH: baseline kök ingredient (tuz/karabiber/un/yağ/su) tüm cooking'de
 *     standart, step'te geçiyor + ingredient'ta yok = net eksik
 *   - REVIEW: context'e bağlı (spesifik baharat, sos, garnish)
 *
 * Word-boundary match ile false positive'leri azaltırız: "su" keyword
 * sadece tam kelime olarak match eder, "sucuk"ta değil.
 *
 *   npx tsx scripts/audit-step-ingredient-mismatch.ts
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

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

interface Baseline {
  /** Step'te aranan pattern (Turkish, lower). */
  stepPattern: RegExp;
  /** Ingredient listesindeki muhtemel karşılık keyword'leri (lower). */
  ingredientKeywords: string[];
  /** Öneri ingredient kaydı. */
  suggested: { name: string; amount: string; unit: string };
  confidence: "high" | "review";
  label: string;
}

// Türkçe locale-aware word boundary regex builder.
// (?:^|[\s,;.!?/()\-"'«»]) + keyword + (?=$|[\s,;.!?/()\-"'«»])
function wb(kw: string): RegExp {
  const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|[\\s,;.!?/()\\-"'«»])${esc}(?=$|[\\s,;.!?/()\\-"'«»]|lı|li|lu|lü|la|le)`,
    "i",
  );
}

const BASELINES: Baseline[] = [
  {
    stepPattern: wb("tuz"),
    ingredientKeywords: ["tuz"],
    suggested: { name: "Tuz", amount: "1", unit: "çay kaşığı" },
    confidence: "high",
    label: "tuz",
  },
  {
    stepPattern: wb("karabiber"),
    ingredientKeywords: ["karabiber"],
    suggested: { name: "Karabiber", amount: "1", unit: "tutam" },
    confidence: "high",
    label: "karabiber",
  },
  {
    stepPattern: /(?:^|[\s,;.!?/()\-"'«»])pul biber(?=$|[\s,;.!?/()\-"'«»]|lı|li|le|la)/i,
    ingredientKeywords: ["pul biber"],
    suggested: { name: "Pul biber", amount: "1", unit: "çay kaşığı" },
    confidence: "high",
    label: "pul biber",
  },
  {
    stepPattern: wb("un"),
    ingredientKeywords: ["un"],
    suggested: { name: "Un", amount: "1", unit: "su bardağı" },
    confidence: "high",
    label: "un",
  },
  {
    stepPattern: wb("su"),
    ingredientKeywords: ["su"],
    suggested: { name: "Su", amount: "1", unit: "su bardağı" },
    // "su" çok jenerik, muhtemelen ingredient'ta "Ilık su" vs. var, false positive riski yüksek
    confidence: "review",
    label: "su",
  },
  {
    stepPattern: wb("sarımsak"),
    ingredientKeywords: ["sarımsak"],
    suggested: { name: "Sarımsak", amount: "2", unit: "diş" },
    confidence: "review",
    label: "sarımsak",
  },
  {
    stepPattern: wb("soğan"),
    ingredientKeywords: ["soğan"],
    suggested: { name: "Soğan", amount: "1", unit: "adet" },
    confidence: "review",
    label: "soğan",
  },
  {
    stepPattern: /(?:^|[\s,;.!?/()\-"'«»])zeytinyağ(?=$|[\s,;.!?/()\-"'«»ıi])/i,
    ingredientKeywords: ["zeytinyağı", "zeytinyağ"],
    suggested: { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı" },
    confidence: "review",
    label: "zeytinyağı",
  },
  {
    stepPattern: /(?:^|[\s,;.!?/()\-"'«»])tereyağ(?=$|[\s,;.!?/()\-"'«»ıi])/i,
    ingredientKeywords: ["tereyağı", "tereyağ"],
    suggested: { name: "Tereyağı", amount: "2", unit: "yemek kaşığı" },
    confidence: "review",
    label: "tereyağı",
  },
  {
    stepPattern: /(?:^|[\s,;.!?/()\-"'«»])sıvı yağ(?=$|[\s,;.!?/()\-"'«»ı])/i,
    ingredientKeywords: ["sıvı yağ", "ayçiçek yağı"],
    suggested: { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı" },
    confidence: "review",
    label: "sıvı yağ",
  },
  {
    stepPattern: wb("yumurta"),
    ingredientKeywords: ["yumurta"],
    suggested: { name: "Yumurta", amount: "1", unit: "adet" },
    confidence: "review",
    label: "yumurta",
  },
  {
    stepPattern: wb("süt"),
    ingredientKeywords: ["süt"],
    suggested: { name: "Süt", amount: "1", unit: "su bardağı" },
    confidence: "review",
    label: "süt",
  },
  {
    stepPattern: wb("limon"),
    ingredientKeywords: ["limon"],
    suggested: { name: "Limon suyu", amount: "1", unit: "yemek kaşığı" },
    confidence: "review",
    label: "limon",
  },
  {
    stepPattern: wb("şeker"),
    ingredientKeywords: ["şeker"],
    suggested: { name: "Şeker", amount: "1", unit: "yemek kaşığı" },
    confidence: "review",
    label: "şeker",
  },
];

function hasIngredientMatch(
  ingredientsText: string,
  ingKeywords: string[],
): boolean {
  const lower = trLower(ingredientsText);
  return ingKeywords.some((kw) => lower.includes(trLower(kw)));
}

interface Finding {
  slug: string;
  title: string;
  stepNumber: number;
  stepSnippet: string;
  missing: string;
  suggested: { name: string; amount: string; unit: string };
  confidence: "high" | "review";
}

async function main(): Promise<void> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      ingredients: { select: { name: true } },
      steps: { select: { stepNumber: true, instruction: true }, orderBy: { stepNumber: "asc" } },
    },
    orderBy: { slug: "asc" },
  });

  const findings: Finding[] = [];

  for (const r of recipes) {
    const ingText = r.ingredients.map((i) => i.name).join(" | ");
    // Track which baselines we've already flagged for this recipe (one per baseline max)
    const flagged = new Set<string>();

    for (const step of r.steps) {
      const instr = step.instruction;
      const instrLower = trLower(instr);

      for (const baseline of BASELINES) {
        if (flagged.has(baseline.label)) continue;
        if (!baseline.stepPattern.test(instrLower)) continue;
        if (hasIngredientMatch(ingText, baseline.ingredientKeywords)) continue;

        flagged.add(baseline.label);
        // Extract surrounding context (30 char window)
        const idx = instrLower.search(baseline.stepPattern);
        const start = Math.max(0, idx - 20);
        const end = Math.min(instrLower.length, idx + baseline.label.length + 30);
        const snippet = instr.slice(start, end).trim();

        findings.push({
          slug: r.slug,
          title: r.title,
          stepNumber: step.stepNumber,
          stepSnippet: snippet,
          missing: baseline.label,
          suggested: baseline.suggested,
          confidence: baseline.confidence,
        });
      }
    }
  }

  // Report
  const high = findings.filter((f) => f.confidence === "high");
  const review = findings.filter((f) => f.confidence === "review");

  console.log("=".repeat(70));
  console.log(`  STEP ↔ INGREDIENT MISMATCH, ${recipes.length} recipes scanned`);
  console.log("=".repeat(70));
  console.log(`  Findings: HIGH ${high.length}  REVIEW ${review.length}  (total ${findings.length})`);

  console.log("\n=== HIGH confidence (baseline staples missing) ===");
  const byMissingHigh = new Map<string, Finding[]>();
  for (const f of high) {
    (byMissingHigh.get(f.missing) ?? byMissingHigh.set(f.missing, []).get(f.missing)!).push(f);
  }
  for (const [m, items] of [...byMissingHigh.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  --- "${m}" eksik (${items.length}) ---`);
    for (const f of items) {
      console.log(`    ${f.slug.padEnd(32)} step ${f.stepNumber}: "${f.stepSnippet.slice(0, 80)}"`);
    }
  }

  console.log("\n=== REVIEW (context-dependent) ===");
  const byMissingReview = new Map<string, Finding[]>();
  for (const f of review) {
    (byMissingReview.get(f.missing) ?? byMissingReview.set(f.missing, []).get(f.missing)!).push(f);
  }
  for (const [m, items] of [...byMissingReview.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  --- "${m}" eksik (${items.length}) ---`);
    for (const f of items.slice(0, 20)) {
      console.log(`    ${f.slug.padEnd(32)} step ${f.stepNumber}: "${f.stepSnippet.slice(0, 80)}"`);
    }
    if (items.length > 20) console.log(`    ... ${items.length - 20} more`);
  }
}

main()
  .catch((err) => {
    console.error("audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
