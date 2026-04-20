/**
 * One-shot: duplicate-merge sonrası seed-recipes.ts'ten loser slug'ları
 * temizle. Olmazsa gelecek seed koşumu silinmiş 166 tarifi geri ekleyip
 * merge'i tersine çevirir.
 *
 * Strateji:
 *   1. docs/duplicate-title-plan-2026-04-20.csv'den tüm loser_slugs listesi
 *   2. seed-recipes.ts içinde her loser için `r({... slug: "LOSER" ...})`
 *      bloğunu sil (single-line r({}) pattern, tüm batch 15+ böyle)
 *   3. Eski multi-line tarif blokları için (`{ slug: "LOSER", ... }`) ayrı
 *      handling: başlangıç `{` ile bitiş `},` arasını sil
 *   4. Stats + dry-run + --apply flag
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __d = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.resolve(__d, "seed-recipes.ts");
const CSV_PATH = path.resolve(__d, "..", "docs", "duplicate-title-plan-2026-04-20.csv");
const APPLY = process.argv.includes("--apply");

function parseLosers(): string[] {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.trim().split("\n").slice(1);
  const losers: string[] = [];
  for (const line of lines) {
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
    const loserSlugsRaw = fields[4];
    if (!loserSlugsRaw) continue;
    const slugs = loserSlugsRaw.replace(/^"|"$/g, "").split("|").filter(Boolean);
    losers.push(...slugs);
  }
  return losers;
}

/** Single-line r({}) pattern (batch 15+ format). */
function removeSingleLineRecipe(source: string, slug: string): { next: string; removed: boolean } {
  // Match:  <indent>r({ ..., slug: "SLUG", ... }),\n
  // slug tam olarak arıyoruz, içine başka slug'lar substring olarak denk
  // gelmesin diye sadece `slug: "X"` tam geçiyor mu bak.
  const re = new RegExp(
    `^\\s*r\\(\\{[^\\n]*?slug:\\s*"${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"[^\\n]*?\\}\\),?\\s*\\n`,
    "m",
  );
  const match = source.match(re);
  if (!match) return { next: source, removed: false };
  return { next: source.replace(re, ""), removed: true };
}

/** Multi-line `{ slug: "SLUG", ... },` pattern (batch 0-3 eski format). */
function removeMultiLineRecipe(source: string, slug: string): { next: string; removed: boolean } {
  // Search `slug: "SLUG"` anchor, geri git `{` bul, ileri git `},` bul.
  const anchor = `slug: "${slug}"`;
  const anchorIdx = source.indexOf(anchor);
  if (anchorIdx === -1) return { next: source, removed: false };

  // Geriye git open brace `{` bulana kadar (aynı satır veya önceki satırlar)
  let start = anchorIdx;
  let braceDepth = 0;
  while (start > 0) {
    const ch = source[start];
    if (ch === "}") braceDepth++;
    else if (ch === "{") {
      if (braceDepth === 0) break;
      braceDepth--;
    }
    start--;
  }
  // start artık `{` pozisyonu. Baştaki whitespace'i de sil.
  while (start > 0 && /\s/.test(source[start - 1]) && source[start - 1] !== "\n") start--;
  // Önceki satır sonunu da sil (tam satır silinsin)
  if (start > 0 && source[start - 1] === "\n") start--;

  // Şimdi sonraki `},` bul (matched closing brace)
  let end = anchorIdx;
  let depth = 0;
  while (end < source.length) {
    const ch = source[end];
    if (ch === "{") depth++;
    else if (ch === "}") {
      if (depth === 0) break;
      depth--;
    }
    end++;
  }
  // end = matching `}`. Sonrasında `,` ve whitespace + newline sil
  while (end < source.length && source[end] !== "\n") end++;
  if (end < source.length && source[end] === "\n") end++;

  return {
    next: source.slice(0, start + 1) + source.slice(end),
    removed: true,
  };
}

function main(): void {
  const losers = parseLosers();
  console.log(`📋 CSV'de ${losers.length} loser slug`);

  let source = fs.readFileSync(SEED_PATH, "utf8");
  const originalLength = source.length;

  let removedSingleLine = 0;
  let removedMultiLine = 0;
  const notFound: string[] = [];

  for (const slug of losers) {
    let result = removeSingleLineRecipe(source, slug);
    if (result.removed) {
      source = result.next;
      removedSingleLine++;
      continue;
    }
    result = removeMultiLineRecipe(source, slug);
    if (result.removed) {
      source = result.next;
      removedMultiLine++;
      continue;
    }
    notFound.push(slug);
  }

  console.log(`\n📊 Removal stats:`);
  console.log(`  Single-line r({}) removed: ${removedSingleLine}`);
  console.log(`  Multi-line {} removed:     ${removedMultiLine}`);
  console.log(`  Not found in source:       ${notFound.length}`);
  console.log(`  Source size delta:         ${originalLength - source.length} bytes`);

  if (notFound.length > 0 && notFound.length <= 20) {
    console.log(`\n  Not-found slugs:\n    ${notFound.slice(0, 20).join("\n    ")}`);
  }

  if (APPLY) {
    fs.writeFileSync(SEED_PATH, source, "utf8");
    console.log(`\n✅ seed-recipes.ts updated`);
  } else {
    console.log(`\n(dry-run, --apply ile yazılır)`);
  }
}

main();
