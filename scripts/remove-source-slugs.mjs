/**
 * scripts/seed-recipes.ts'ten verilen slug listesini icel satir bazli
 * siler. Her tarif tek satirda (r({...}) veya {...} format), slug ile
 * eslesen satirlari kaldirir.
 *
 * Kullanim:
 *   node scripts/remove-source-slugs.mjs <slug-list-file>
 *
 * Cikti: scripts/seed-recipes.ts in-place edit + silinen satir sayisi.
 */
import fs from "node:fs";
import path from "node:path";

const SLUG_FILE = process.argv[2];
if (!SLUG_FILE) {
  console.error("Usage: node remove-source-slugs.mjs <slug-list-file>");
  process.exit(1);
}

const SOURCE_FILE = path.resolve(process.cwd(), "scripts/seed-recipes.ts");

const slugs = fs
  .readFileSync(SLUG_FILE, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Slug count to remove: ${slugs.length}`);

const lines = fs.readFileSync(SOURCE_FILE, "utf8").split("\n");
const slugSet = new Set(slugs);

let removed = 0;
const kept = [];
const removedSlugs = [];

for (const line of lines) {
  // Match `slug: "xxx"` pattern (with both single and double quote variants)
  const match = line.match(/slug:\s*["']([^"']+)["']/);
  if (match && slugSet.has(match[1])) {
    removed++;
    removedSlugs.push(match[1]);
    continue;
  }
  kept.push(line);
}

fs.writeFileSync(SOURCE_FILE, kept.join("\n"));

console.log(`\nRemoved ${removed} lines (matched ${removed} of ${slugs.length} slugs)`);
const notFound = slugs.filter((s) => !removedSlugs.includes(s));
if (notFound.length > 0) {
  console.log(`Not found in source (already absent or different format):`);
  notFound.forEach((s) => console.log(`  - ${s}`));
}
