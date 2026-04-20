/**
 * Patch scripts/seed-recipes.ts allergens field'ını DB (dev) state'ine
 * göre sync eder. Oturum 11'de yapılan 55 allergen değişikliğini (9
 * fix + 26 remove + 20 fix v2) tek seferde source'a yazar.
 *
 * Strateji: her slug için `slug: "<slug>"` literalini bul, ardından o
 * tarif bloğunun `allergens: [...] as const` (veya `allergens: []` /
 * `allergens: [...]`) pattern'ını locate et. DB allergens array'i source'tan
 * farklıysa replace et. Drift yoksa atla.
 *
 *   npx tsx scripts/patch-source-allergens-from-db.ts             # dry (diff summary)
 *   npx tsx scripts/patch-source-allergens-from-db.ts --apply     # source'ı yaz
 */
import { PrismaClient } from "@prisma/client";
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

const SEED = path.resolve(__d, "seed-recipes.ts");

/** Pattern: allergens: [...] as const  OR  allergens: [] as const
 *  OR  allergens: [...]  OR  allergens: []
 */
const ALLERGENS_RE = /allergens:\s*\[[^\]]*\](?:\s*as\s+const)?/;

function formatAllergens(arr: string[]): string {
  const sorted = [...arr].sort();
  if (sorted.length === 0) return `allergens: [] as const`;
  const body = sorted.map((a) => `"${a}"`).join(", ");
  return `allergens: [${body}] as const`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  assertDbTarget("patch-source-allergens-from-db");

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, allergens: true },
    });
    let text = fs.readFileSync(SEED, "utf-8");

    let patched = 0;
    let inserted = 0;
    let already = 0;
    let missing = 0;
    const samples: string[] = [];

    for (const r of rows) {
      const slugLit = `slug: "${r.slug}"`;
      const slugIdx = text.indexOf(slugLit);
      if (slugIdx < 0) {
        missing++;
        continue;
      }
      // Recipe block boundary. Multi-line blocks (batch 0-11) end with
      // `},\n  {` (next recipe begin); single-line IIFE blocks end with
      // `}),\n`. We use the first `ingredients:` OR `steps:` field
      // occurrence after the slug as a safe upper bound , these fields
      // always come AFTER allergens/tags in the canonical block shape,
      // so we won't miss allergens positioned before them.
      const fromSlug = text.slice(slugIdx);
      const ingIdx = fromSlug.search(/\bingredients:\s*\[/);
      const stepIdx = fromSlug.search(/\bsteps:\s*\[/);
      const endCandidates = [ingIdx, stepIdx].filter((x) => x > 0);
      // Use ingredients/steps start as hard upper bound so we don't leak
      // into the next recipe's allergens field.
      const endIdx = endCandidates.length > 0 ? Math.min(...endCandidates) : 2500;
      const tail = fromSlug.slice(0, Math.min(endIdx, 3000));

      const m = tail.match(ALLERGENS_RE);
      if (!m) {
        // No allergens field in block , batch 0-11 style where allergens
        // was optional. Insert allergens: [...] after the tags: [...]
        // field so block remains valid TS.
        const tagsRe = /(tags:\s*\[[^\]]*\])/;
        const tagsMatch = tail.match(tagsRe);
        if (!tagsMatch || tagsMatch.index === undefined) {
          // Neither tags nor allergens, very unusual; skip
          continue;
        }
        const allergenStr = formatAllergens(r.allergens as string[]);
        if (allergenStr === `allergens: [] as const`) {
          // Don't clutter with empty insert for slugs with no DB allergens
          continue;
        }
        const insertion = `${tagsMatch[0]},\n    ${allergenStr}`;
        const absIdx = slugIdx + tagsMatch.index;
        text =
          text.slice(0, absIdx) +
          insertion +
          text.slice(absIdx + tagsMatch[0].length);
        if (samples.length < 15) {
          samples.push(`${r.slug}  INSERT ${allergenStr}`);
        }
        inserted++;
        continue;
      }
      const oldStr = m[0];
      const newStr = formatAllergens(r.allergens as string[]);
      if (oldStr === newStr) {
        already++;
        continue;
      }
      if (samples.length < 15) {
        samples.push(`${r.slug}  ${oldStr}  →  ${newStr}`);
      }
      const absStart = slugIdx + (m.index ?? 0);
      text =
        text.slice(0, absStart) +
        newStr +
        text.slice(absStart + oldStr.length);
      patched++;
    }

    console.log(
      `\n${apply ? "applying" : "dry-run"}: ${patched} patched, ${inserted} inserted, ${already} already, ${missing} missing (seed'de yok)`,
    );
    if (samples.length > 0) {
      console.log(`\nSamples (ilk 15):`);
      for (const s of samples) console.log(`  ${s}`);
    }

    if (apply && (patched > 0 || inserted > 0)) {
      fs.writeFileSync(SEED, text, "utf-8");
      console.log(`\n  wrote: scripts/seed-recipes.ts`);
    } else if (!apply) {
      console.log(`\nre-run with --apply to write.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
