/**
 * Patch scripts/seed-recipes.ts: set isFeatured=true for the 63 slugs
 * boosted by boost-featured.ts (session 11).
 *
 *   npx tsx scripts/patch-source-featured-session11.ts            # dry run
 *   npx tsx scripts/patch-source-featured-session11.ts --apply    # write
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __d = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.resolve(__d, "seed-recipes.ts");
const SLUGS_FILE = path.resolve(__d, "..", "tmp-featured-boost-slugs.json");

function main() {
  const apply = process.argv.includes("--apply");
  const slugs = JSON.parse(fs.readFileSync(SLUGS_FILE, "utf-8")) as string[];
  let text = fs.readFileSync(SEED, "utf-8");
  let patched = 0;
  let already = 0;
  let missing = 0;

  for (const slug of slugs) {
    const slugLit = `slug: "${slug}"`;
    const slugIdx = text.indexOf(slugLit);
    if (slugIdx < 0) {
      console.log(`  ⚠  slug not found: ${slug}`);
      missing++;
      continue;
    }
    // Recipe record search window: slug pos to next `},` or `}),\n`
    const fromSlug = text.slice(slugIdx);
    const endMatch = fromSlug.search(/\},?\r?\n|\}\),\r?\n/);
    const tailLen = endMatch > 0 ? endMatch + 3 : 3000;
    const tail = fromSlug.slice(0, tailLen);

    // Already patched?
    if (tail.includes("isFeatured: true")) {
      console.log(`  ⏭  already true: ${slug}`);
      already++;
      continue;
    }

    const falseIdx = tail.indexOf("isFeatured: false");
    if (falseIdx < 0) {
      console.log(`  ❌ isFeatured: false NOT found in recipe block: ${slug}`);
      missing++;
      continue;
    }
    const absIdx = slugIdx + falseIdx;
    text =
      text.slice(0, absIdx) +
      "isFeatured: true" +
      text.slice(absIdx + "isFeatured: false".length);
    console.log(`  ${apply ? "✅" : "•"} ${slug}`);
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
