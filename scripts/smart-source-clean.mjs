/**
 * Source-side duplicate cleanup that handles every recipe block shape
 * found in scripts/seed-recipes.ts:
 *
 *   1. Multi-line literal block (`{` alone on line, oldest format):
 *        {
 *          title: "X", slug: "y", ...
 *          ...
 *        },
 *
 *   2. Multi-line literal with title on the open line (~batch 30+):
 *        { title: "X", slug: "y", emoji: "🥩",
 *          translations: { ... },
 *          ...
 *        },
 *
 *   3. Single-line literal (compressed inline, ~batch 25-36):
 *        { title: "X", slug: "y", ..., },
 *
 *   4. Single-line `r({...})` helper call (newest, batch 37+):
 *        r({ title: "X", slug: "y", ... }),
 *
 *   5. Deeper-indent multi-line (6+ spaces, some imported batches):
 *        {
 *          title: "X", slug: "y", ...
 *        },
 *
 * The older `remove-source-slugs.mjs` only handled #4 cleanly; on
 * multi-line blocks it deleted just the title row, leaving orphan
 * lines that broke `tsc`. This script uses indent-aware block matching
 * with brace counting so any of the five shapes works.
 *
 * Usage:
 *   node scripts/smart-source-clean.mjs <slug-list-file> [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const slugFile = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");

if (!slugFile) {
  console.error("Usage: node smart-source-clean.mjs <slug-list-file> [--dry-run]");
  process.exit(1);
}

const SOURCE_FILE = path.resolve(process.cwd(), "scripts/seed-recipes.ts");

const slugs = fs
  .readFileSync(slugFile, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const slugSet = new Set(slugs);

console.log(`Slug count to remove: ${slugs.length}`);
console.log(`Mode: ${dryRun ? "DRY-RUN" : "WRITE"}`);

const lines = fs.readFileSync(SOURCE_FILE, "utf8").split("\n");

const BLOCK_OPEN_RE = /^( +)(r\(\{|\{)/;
const SLUG_RE = /\bslug:\s*["']([^"']+)["']/;

function braceDelta(line) {
  let depth = 0;
  let inStr = false;
  let strChar = null;
  let escape = false;
  for (const ch of line) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (inStr) {
      if (ch === strChar) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = true;
      strChar = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return depth;
}

const removedSingle = [];
const removedMulti = [];
const out = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const open = line.match(BLOCK_OPEN_RE);

  if (!open) {
    out.push(line);
    i++;
    continue;
  }

  const _startedWithR = open[2] === "r({";
  const delta = braceDelta(line);

  if (delta === 0) {
    const m = line.match(SLUG_RE);
    if (m && slugSet.has(m[1])) {
      removedSingle.push(m[1]);
      i++;
      continue;
    }
    out.push(line);
    i++;
    continue;
  }

  let depth = delta;
  let blockSlug = null;
  const m0 = line.match(SLUG_RE);
  if (m0) blockSlug = m0[1];

  let blockEnd = -1;
  for (let j = i + 1; j < lines.length; j++) {
    if (!blockSlug) {
      const mj = lines[j].match(SLUG_RE);
      if (mj) blockSlug = mj[1];
    }
    depth += braceDelta(lines[j]);
    if (depth <= 0) {
      blockEnd = j;
      break;
    }
  }

  if (blockEnd !== -1 && blockSlug && slugSet.has(blockSlug)) {
    removedMulti.push(blockSlug);
    i = blockEnd + 1;
    continue;
  }

  out.push(line);
  i++;
}

const allRemoved = new Set([...removedMulti, ...removedSingle]);
const notFound = slugs.filter((s) => !allRemoved.has(s));

console.log(`\nMulti-line blocks removed:  ${removedMulti.length}`);
console.log(`Single-line entries removed: ${removedSingle.length}`);
console.log(`Total unique slugs removed:  ${allRemoved.size} of ${slugs.length}`);

if (notFound.length > 0) {
  console.log(`\nNot found in source (already absent or different format):`);
  notFound.forEach((s) => console.log(`  - ${s}`));
}

if (dryRun) {
  console.log("\n[dry-run] Source not modified.");
} else {
  fs.writeFileSync(SOURCE_FILE, out.join("\n"));
  console.log(
    `\n✅ scripts/seed-recipes.ts updated (${lines.length} → ${out.length} lines)`,
  );
}
