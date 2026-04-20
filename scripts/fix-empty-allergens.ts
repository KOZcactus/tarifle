/**
 * Empty allergen fix, CSV'deki high + medium confidence önerilerini
 * DB'ye uygular. 43 tarif × 1-2 allergen (brief §5 high-confidence
 * keyword match, §5 istisnaları filtrelenmiş). Idempotent: mevcutta
 * allergen zaten varsa atlar.
 *
 * Input: docs/empty-allergens-plan-2026-04-20.csv
 * Output: DB update + özet log
 *
 * Usage:
 *   npx tsx scripts/fix-empty-allergens.ts                  # dry-run
 *   npx tsx scripts/fix-empty-allergens.ts --apply          # dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-empty-allergens.ts --apply --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const CSV_PATH = path.resolve(__d, "..", "docs", "empty-allergens-plan-2026-04-20.csv");

interface PlanRow {
  slug: string;
  suggested: Allergen[];
  confidence: "high" | "medium" | "low";
}

function parseCsv(): PlanRow[] {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.trim().split("\n").slice(1); // skip header
  const rows: PlanRow[] = [];
  for (const line of lines) {
    // Simple CSV parse, the "matches" column has pipe-separated values
    // wrapped in quotes; naive split by comma respecting quoted fields.
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else current += ch;
    }
    fields.push(current);
    const [slug, , , suggestedRaw, , confidenceRaw] = fields;
    if (!slug || !suggestedRaw) continue;
    rows.push({
      slug,
      suggested: suggestedRaw.split(";").filter(Boolean) as Allergen[],
      confidence: confidenceRaw as "high" | "medium" | "low",
    });
  }
  return rows;
}

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("fix-empty-allergens");

  const plan = parseCsv();
  const actionable = plan.filter(
    (p) => p.confidence === "high" || p.confidence === "medium",
  );
  console.log(
    `📋 ${plan.length} plan row, ${actionable.length} actionable (high+medium)\n`,
  );

  let updated = 0;
  let alreadyClean = 0;
  let notFound = 0;

  for (const p of actionable) {
    const r = await prisma.recipe.findUnique({
      where: { slug: p.slug },
      select: { id: true, allergens: true, title: true },
    });
    if (!r) {
      notFound++;
      console.log(`  ⚠️  ${p.slug} DB'de yok (muhtemelen dev vs prod drift)`);
      continue;
    }
    const existing = new Set(r.allergens);
    const toAdd = p.suggested.filter((a) => !existing.has(a));
    if (toAdd.length === 0) {
      alreadyClean++;
      continue;
    }
    const next = [...r.allergens, ...toAdd];
    console.log(`  🔧 ${p.slug}: +${toAdd.join(",")} (${p.confidence})`);
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: next },
      });
      updated++;
    }
  }

  console.log(
    `\n📊 özet, updated=${updated}, alreadyClean=${alreadyClean}, notFound=${notFound} (apply=${APPLY})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
