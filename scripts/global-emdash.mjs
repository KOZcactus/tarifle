import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const EM_DASH = "\u2014";
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "test-results",
  "playwright-report",
  "dist",
  "build",
  ".vercel",
]);
const SKIP_DIR_PATHS = new Set(["prisma/migrations"]);
const SKIP_FILES = new Set([
  "AGENTS.md",
  "docs/CODEX_BATCH_BRIEF.md",
  "docs/EM_DASH_CLEANUP.md",
  "docs/PROJECT_STATUS.md",
  "docs/CHANGELOG.md",
  "scripts/check-emdash.mjs",
  "scripts/global-emdash.mjs",
]);

function norm(p) {
  return p.split(sep).join("/");
}

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = norm(relative(process.cwd(), full));
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_DIR_PATHS.has(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) { walk(full, acc); continue; }
    const ext = entry.slice(entry.lastIndexOf("."));
    if (!EXTENSIONS.has(ext)) continue;
    if (SKIP_FILES.has(rel)) continue;
    const s = readFileSync(full, "utf8");
    if (!s.includes(EM_DASH)) continue;
    const count = (s.match(/\u2014/g) || []).length;
    const next = s
      .replace(/ \u2014 /g, ", ")
      .replace(/\u2014 /g, ", ")
      .replace(/ \u2014/g, ",")
      .replace(/\u2014/g, ",");
    writeFileSync(full, next);
    acc.push({ file: rel, count });
  }
}

const acc = [];
walk(process.cwd(), acc);
const total = acc.reduce((s, a) => s + a.count, 0);
console.log(`Cleaned ${total} em-dashes across ${acc.length} files`);
