/**
 * One-way sync: production DB → scripts/seed-recipes.ts (source of truth).
 *
 * 17 Nis turunda ~90 DB değişikliği yapıldı (fix-*.ts script'leri ile):
 * yeni ingredient insert, group update, composite split, tag ekleme/silme,
 * step revise, servingSuggestion revise, time metadata. Bu değişikliklerin
 * büyük kısmı source'ta yok → fresh DB deploy eski yapıyı yazar.
 *
 * Bu script:
 * 1. Her tarif için DB'deki ingredient + step + tag + metadata'yı çeker
 * 2. seed-recipes.ts'teki ilgili tarif bloğunu (slug-based) parse eder
 * 3. Field-by-field diff çıkarır, gerekliyse satırı regenerate eder
 *
 * NOT: Bu ilk iteration sadece RAPOR üretir (dry-run, baskı yok). Gerçek
 * source patch editing için daha dikkatli karşılıklı mapping gerekir —
 * insan onayıyla adım adım uygulanmalı.
 *
 *   npx tsx scripts/sync-source-from-db.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SEED_PATH = path.resolve(__d, "seed-recipes.ts");

interface RecipeSnapshot {
  slug: string;
  title: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  tipNote: string | null;
  servingSuggestion: string | null;
  ingredients: { name: string; amount: string; unit: string; group: string | null; sortOrder: number }[];
  steps: { stepNumber: number; instruction: string; timerSeconds: number | null }[];
}

async function main(): Promise<void> {
  console.log(`📋 sync-source-from-db — source drift raporu\n`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true, title: true,
      prepMinutes: true, cookMinutes: true, totalMinutes: true,
      tipNote: true, servingSuggestion: true,
      ingredients: { select: { name: true, amount: true, unit: true, group: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      steps: { select: { stepNumber: true, instruction: true, timerSeconds: true }, orderBy: { stepNumber: "asc" } },
    },
    orderBy: { slug: "asc" },
  });

  const seedSource = fs.readFileSync(SEED_PATH, "utf8");

  // Simple per-slug check: does source mention this recipe's key fields?
  // We look for "slug: \"<slug>\"" to locate the block, then scan nearby text.
  let slugsNotInSource = 0;
  let driftedSlugs = 0;
  const driftSummary: string[] = [];

  for (const r of recipes) {
    const slugNeedle = `slug: "${r.slug}"`;
    if (!seedSource.includes(slugNeedle)) {
      slugsNotInSource++;
      continue;
    }
    // Extract block: from slug mention to next "slug:" or end of array
    const idx = seedSource.indexOf(slugNeedle);
    // Find the containing recipe object boundaries approximately
    // (brace-depth counting, but tarifler tek satır veya multi-line olabiliyor)
    // Simple heuristic: 2KB window around slug
    const windowStart = Math.max(0, idx - 200);
    const windowEnd = Math.min(seedSource.length, idx + 4000);
    const block = seedSource.slice(windowStart, windowEnd);

    const drifts: string[] = [];

    // Check cookMinutes
    const cookRe = new RegExp(`slug: "${r.slug}"[^}]*?cookMinutes:\\s*(\\d+)`, "s");
    const cookMatch = cookRe.exec(seedSource);
    if (cookMatch && Number(cookMatch[1]) !== r.cookMinutes) {
      drifts.push(`cookMinutes source=${cookMatch[1]} db=${r.cookMinutes}`);
    }

    // Check each ingredient name — are all DB names present in source block?
    for (const ing of r.ingredients) {
      const nameNeedle = `name: "${ing.name}"`;
      if (!block.includes(nameNeedle)) {
        drifts.push(`INGREDIENT MISSING in source: "${ing.name}"`);
      }
    }

    // Check each DB group — is it mentioned in source block?
    const dbGroups = new Set(r.ingredients.map((i) => i.group).filter((g): g is string => g !== null));
    for (const g of dbGroups) {
      const gNeedle = `group: "${g}"`;
      if (!block.includes(gNeedle)) {
        drifts.push(`GROUP MISSING in source: "${g}"`);
      }
    }

    // Check tipNote/servingSuggestion drift
    if (r.tipNote === null && block.includes(`slug: "${r.slug}"`)) {
      // If DB tipNote is null but source has tipNote: "...", drift
      const tipRe = new RegExp(`slug: "${r.slug}"[^}]*?tipNote:\\s*"([^"]+)"`, "s");
      const tipMatch = tipRe.exec(seedSource);
      if (tipMatch) {
        drifts.push(`tipNote db=null source="${tipMatch[1].slice(0, 40)}..."`);
      }
    }

    if (drifts.length > 0) {
      driftedSlugs++;
      driftSummary.push(`\n${r.slug}:`);
      for (const d of drifts) driftSummary.push(`  - ${d}`);
    }
  }

  console.log(`Total recipes in DB: ${recipes.length}`);
  console.log(`Slugs NOT in source: ${slugsNotInSource}`);
  console.log(`Drifted slugs (DB ≠ source): ${driftedSlugs}`);
  console.log(`\n=== DRIFT DETAIL ===`);
  console.log(driftSummary.slice(0, 200).join("\n"));
  if (driftSummary.length > 200) console.log(`\n... ${driftSummary.length - 200} more drift lines`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("sync failed:", e);
  process.exit(1);
});
