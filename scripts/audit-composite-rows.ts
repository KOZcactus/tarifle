/**
 * Composite-row detector — virgülle birleşik ingredient satırlarını
 * tespit eder (Codex2'nin 24-row bulgusu için independent tarama).
 *
 * Pattern: ingredient.name içinde 1+ virgül varsa multi-item composite.
 * Örnek: "Tuz, şeker, maydanoz" → 3 ayrı ingredient olarak split edilmeli.
 *
 * Strategy heuristic:
 *   - AUTO: 2-3 kısa staple (tuz/karabiber/pul biber/kimyon), amount
 *     eşit dağıtılabilir veya tek amount için tekrarlanabilir
 *   - MANUAL: karmaşık karışım (sebze, et, farklı form), split ratio
 *     tarifi bilen biri tarafından kararlaştırılmalı
 *
 *   npx tsx scripts/audit-composite-rows.ts
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

// AUTO kriteri: ingredient parts hepsi seasoning/staple mı + amount tek
// değer mi? (örn. "1 çay kaşığı" tüm parts için eşit veya bölünebilir)
const STAPLE_KEYWORDS = new Set([
  "tuz", "karabiber", "pul biber", "kimyon", "kekik", "nane", "sumak",
  "köri", "zerdeçal", "tarçın", "karanfil", "yenibahar", "defne yaprağı",
  "muskat", "baharat", "baharatlar", "pudra şeker", "toz şeker",
  "maydanoz", "dereotu", "fesleğen", "roka", "taze soğan",
]);

function isStapleOnly(parts: string[]): boolean {
  return parts.every((p) => {
    const lower = trLower(p.trim());
    return [...STAPLE_KEYWORDS].some((kw) => lower.includes(kw));
  });
}

interface Finding {
  slug: string;
  title: string;
  rawName: string;
  parts: string[];
  amount: string;
  unit: string;
  strategy: "auto" | "manual";
  reason: string;
}

async function main(): Promise<void> {
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      ingredients: {
        select: {
          name: true,
          amount: true,
          unit: true,
          group: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { slug: "asc" },
  });

  const findings: Finding[] = [];
  const bySlug = new Map<string, number>();

  for (const r of recipes) {
    for (const ing of r.ingredients) {
      if (!ing.name.includes(",")) continue;
      const parts = ing.name.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length < 2) continue;

      const staples = isStapleOnly(parts);
      const hasAmount = ing.amount && ing.amount.trim() && ing.amount !== "0";
      const hasUnit = ing.unit && ing.unit.trim();

      let strategy: "auto" | "manual";
      let reason: string;
      if (staples && hasAmount && hasUnit) {
        strategy = "auto";
        reason = `hepsi seasoning staple + tek amount "${ing.amount} ${ing.unit}" bölünebilir`;
      } else if (staples && !hasAmount && !hasUnit) {
        strategy = "auto";
        reason = "hepsi seasoning staple + amount/unit zaten boş — tatmin için eşit varsayılır";
      } else if (staples) {
        strategy = "auto";
        reason = "hepsi seasoning staple";
      } else {
        strategy = "manual";
        reason = parts.map((p) => `"${p}"`).join(" + ") + " — farklı form/miktar";
      }

      findings.push({
        slug: r.slug,
        title: r.title,
        rawName: ing.name,
        parts,
        amount: ing.amount ?? "",
        unit: ing.unit ?? "",
        strategy,
        reason,
      });
      bySlug.set(r.slug, (bySlug.get(r.slug) ?? 0) + 1);
    }
  }

  // Report
  const auto = findings.filter((f) => f.strategy === "auto");
  const manual = findings.filter((f) => f.strategy === "manual");

  console.log("=".repeat(70));
  console.log(`  COMPOSITE ROW DETECTION — ${recipes.length} recipes scanned`);
  console.log("=".repeat(70));
  console.log(
    `  Findings: AUTO ${auto.length}  MANUAL ${manual.length}  (${findings.length} rows across ${bySlug.size} recipes)`,
  );

  console.log("\n=== AUTO split strategy ===");
  for (const f of auto) {
    console.log(
      `  ${f.slug.padEnd(28)} "${f.rawName}" (${f.amount} ${f.unit})`,
    );
    console.log(`    → split: ${f.parts.join(" | ")}`);
    console.log(`    reason: ${f.reason}`);
  }

  console.log("\n=== MANUAL split strategy ===");
  for (const f of manual) {
    console.log(
      `  ${f.slug.padEnd(28)} "${f.rawName}" (${f.amount} ${f.unit})`,
    );
    console.log(`    → candidates: ${f.parts.join(" | ")}`);
    console.log(`    reason: ${f.reason}`);
  }
}

main()
  .catch((err) => {
    console.error("audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
