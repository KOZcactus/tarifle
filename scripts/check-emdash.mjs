#!/usr/bin/env node
/**
 * Em-dash (U+2014) ve en-dash (U+2013) guard.
 *
 * Kural: AGENTS.md "Em-dash yasak". Kullanıcıya görünen veya kurallı
 * dokümantasyonda bu karakter kullanılmıyor; virgül, nokta, parantez
 * veya noktalı virgül tercih edilir.
 *
 * İstisna dosyalar (kural açıklaması veya tarihsel kayıt, em-dash
 * karakterini göstermek zorunda veya eski commit başlıkları):
 *   - AGENTS.md
 *   - docs/CODEX_BATCH_BRIEF.md
 *   - docs/EM_DASH_CLEANUP.md
 *   - docs/PROJECT_STATUS.md (commit başlıklarında tarihsel)
 *   - docs/CHANGELOG.md (tarihsel kayıt)
 *
 * Tarama kapsamı: .ts, .tsx, .js, .jsx, .json, .md, .mdx. Skipped: node_modules,
 * .next, .git, test-results, playwright-report, prisma/migrations.
 *
 * Exit 0 temiz, exit 1 eşleşme bulundu. Pre-push hook'tan çağrılır.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const EM_DASH = "\u2014";
// U+2013 en-dash range separator olarak legitimate (`1–2`, `2.7–3.3 s`),
// bu yüzden yasak listesinde değil. Yasak sadece em-dash.
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
const SKIP_FILES = new Set([
  "AGENTS.md",
  "docs/CODEX_BATCH_BRIEF.md",
  "docs/EM_DASH_CLEANUP.md",
  "docs/PROJECT_STATUS.md",
  "docs/CHANGELOG.md",
  "docs/BLOG_CONTENT_GUIDE.md",
  // Untracked session brief copy files (user's manual paste of session
  // intro message). These are local scratch references, gitignored
  // intent. Em-dash here is from the user-pasted brief, not new content.
  "NEW_SESSION_MESSAGE.md",
]);
// prisma/migrations içinde geçmiş migration SQL'leri em-dash'siz ama
// Prisma generated tiplerde şüphe yok; yine de klasörü atlayalım.
const SKIP_DIR_PATHS = new Set(["prisma/migrations"]);

// Gitignored scratch file prefixes (Codex/Kerem tmp work files).
// Keep in sync with .gitignore patterns `tmp_*`, `tmp-*`, `.tmp*`.
function isScratchFile(entry) {
  return (
    entry.startsWith(".tmp") ||
    entry.startsWith("tmp_") ||
    entry.startsWith("tmp-")
  );
}

function walk(dir, hits) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(process.cwd(), full).replace(/\\/g, "/");
    if (SKIP_DIRS.has(entry)) continue;
    if (SKIP_DIR_PATHS.has(rel)) continue;
    if (isScratchFile(entry)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, hits);
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf("."));
    if (!EXTENSIONS.has(ext)) continue;
    if (SKIP_FILES.has(rel)) continue;
    const content = readFileSync(full, "utf8");
    if (!content.includes(EM_DASH)) continue;
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (line.includes(EM_DASH)) {
        hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120) });
      }
    });
  }
}

const hits = [];
walk(process.cwd(), hits);

if (hits.length === 0) {
  process.exit(0);
}

console.error(`❌ pre-push: em-dash (U+2014) guard ${hits.length} eşleşme buldu:`);
for (const h of hits.slice(0, 20)) {
  console.error(`   ${h.file}:${h.line}  ${h.text}`);
}
if (hits.length > 20) {
  console.error(`   ... ve ${hits.length - 20} eşleşme daha.`);
}
process.exit(1);
