/**
 * Audit over-tagged allergens: allergen flag'i var ama ingredient listesinde
 * eşleşen keyword yok. audit-deep'in gerçek ALLERGEN_RULES + ingredient
 * MatchesAllergen fonksiyonunu kullanır (birebir aynı mantık).
 *
 *   npx tsx scripts/audit-over-tagged-allergens.ts          # summary
 *   npx tsx scripts/audit-over-tagged-allergens.ts --json   # tmp-over-tagged.json
 *   DATABASE_URL=<prod> ... --confirm-prod                  # prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";
import { ALLERGEN_RULES, ingredientMatchesAllergen } from "./audit-deep";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

interface Finding {
  slug: string;
  title: string;
  allergen: string;
  ingredients: string[];
}

async function main() {
  const jsonMode = process.argv.includes("--json");
  assertDbTarget("audit-over-tagged-allergens");
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        allergens: true,
        ingredients: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    const findings: Finding[] = [];
    for (const r of rows) {
      const ingNames = r.ingredients.map((i) => i.name);
      for (const a of r.allergens) {
        const rule = ALLERGEN_RULES.find((x) => x.allergen === a);
        if (!rule) continue;
        const anyMatch = ingNames.some((n) => ingredientMatchesAllergen(n, rule));
        if (!anyMatch) {
          findings.push({
            slug: r.slug,
            title: r.title,
            allergen: a,
            ingredients: ingNames,
          });
        }
      }
    }

    const byAllergen = new Map<string, Finding[]>();
    for (const f of findings) {
      const g = byAllergen.get(f.allergen) ?? [];
      g.push(f);
      byAllergen.set(f.allergen, g);
    }

    if (jsonMode) {
      fs.writeFileSync(
        "tmp-over-tagged.json",
        JSON.stringify(findings, null, 2),
        "utf-8",
      );
      console.log(`Wrote ${findings.length} findings to tmp-over-tagged.json`);
      return;
    }

    console.log(`Total over-tag findings: ${findings.length}\n`);
    const sorted = [...byAllergen.entries()].sort((a, b) => b[1].length - a[1].length);
    for (const [allergen, list] of sorted) {
      console.log(`=== ${allergen} (${list.length} tarif) ===`);
      for (const f of list.slice(0, 15)) {
        const ingShort = f.ingredients.slice(0, 6).join(", ");
        console.log(
          `  ${f.slug.padEnd(60)}  ings: ${ingShort}${f.ingredients.length > 6 ? "..." : ""}`,
        );
      }
      if (list.length > 15) console.log(`  ... (+${list.length - 15} more)`);
      console.log();
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
