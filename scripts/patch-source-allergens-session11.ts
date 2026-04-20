/**
 * Patch scripts/seed-recipes.ts allergens for 7 slugs (session 11 fix).
 * Strategy: for each slug, find the slug literal, then replace the first
 * `allergens: [...] as const` that appears AFTER the slug position, up to
 * the nearest closing brace of that recipe. Idempotent (exits 0 with
 * "already patched" if target is already the desired value).
 *
 *   npx tsx scripts/patch-source-allergens-session11.ts            # dry run
 *   npx tsx scripts/patch-source-allergens-session11.ts --apply    # write
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __d = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.resolve(__d, "seed-recipes.ts");

interface Patch {
  slug: string;
  from: string;
  to: string;
}

const PATCHES: Patch[] = [
  {
    slug: "katikli-patates-corbasi-sivas-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["GLUTEN", "SUT"] as const`,
  },
  {
    slug: "yogurtlu-nohut-yahni-konya-ova-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["GLUTEN", "SUT"] as const`,
  },
  {
    slug: "zahterli-yogurt-corbasi-hatay-koy-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["GLUTEN", "SUT"] as const`,
  },
  {
    slug: "ayranli-yesil-mercimek-corbasi-erzurum-yayla-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["GLUTEN", "SUT"] as const`,
  },
  {
    slug: "kurutlu-semizotu-corbasi-erzincan-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["GLUTEN", "SUT"] as const`,
  },
  {
    slug: "cokelekli-biber-dolmasi-mugla-usulu",
    from: `allergens: ["SUT"] as const`,
    to: `allergens: ["SUT", "YUMURTA"] as const`,
  },
  {
    slug: "ayvali-kereviz-guveci-canakkale-usulu",
    from: `allergens: [] as const`,
    to: `allergens: ["KEREVIZ"] as const`,
  },
];

function main() {
  const apply = process.argv.includes("--apply");
  let text = fs.readFileSync(SEED, "utf-8");
  let patched = 0;
  let already = 0;
  let missing = 0;
  for (const p of PATCHES) {
    const slugLit = `slug: "${p.slug}"`;
    const slugIdx = text.indexOf(slugLit);
    if (slugIdx < 0) {
      console.log(`  ⚠  slug not found: ${p.slug}`);
      missing++;
      continue;
    }
    // Search window: slug pos until next recipe record begins.
    // Recipe blocks end with either `},\n` (multi-line) or `}),\n` (r(...))
    // and the next recipe starts with either `  {` or `      r({`.
    // Simplest boundary: first `},\n` OR `}),\n` occurrence after slug.
    const fromSlug = text.slice(slugIdx);
    const endMatch = fromSlug.search(/\},?\r?\n|\}\),\r?\n/);
    const tail = endMatch > 0 ? fromSlug.slice(0, endMatch + 3) : fromSlug.slice(0, 2500);
    if (tail.includes(p.to)) {
      console.log(`  ⏭  already patched: ${p.slug}`);
      already++;
      continue;
    }
    const fromIdx = tail.indexOf(p.from);
    if (fromIdx < 0) {
      console.log(`  ❌ from-pattern not found near slug: ${p.slug}`);
      console.log(`     looking for: ${p.from}`);
      missing++;
      continue;
    }
    const absFromIdx = slugIdx + fromIdx;
    text =
      text.slice(0, absFromIdx) +
      p.to +
      text.slice(absFromIdx + p.from.length);
    console.log(`  ${apply ? "✅" : "•"} ${p.slug}  ${p.from} → ${p.to}`);
    patched++;
  }
  console.log(
    `\n${apply ? "applied" : "dry-run"}: ${patched} patched, ${already} already, ${missing} missing`,
  );
  if (apply && patched > 0) {
    fs.writeFileSync(SEED, text, "utf-8");
    console.log("  wrote: scripts/seed-recipes.ts");
  } else if (!apply) {
    console.log("re-run with --apply to write.");
  }
  if (missing > 0) process.exit(1);
}
main();
