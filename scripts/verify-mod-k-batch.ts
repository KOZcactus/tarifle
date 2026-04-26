/**
 * Mod K (Tarif Kontrol) Codex teslim sonrasi verify pipeline'i.
 * docs/mod-k-batch-N.json'lardaki entry'leri DB'ye karsi dogrular +
 * format integrity + brief §20 kalite kurallari kontrolu yapar +
 * markdown rapor uretir.
 *
 * Apply YAPMAZ. Sadece okur, dogrular, rapor yazar. Apply icin ayri
 * script: apply-mod-k-batch.ts.
 *
 * Cikti:
 *   - docs/mod-k-verify-report.md (markdown rapor: PASS / CORRECTION /
 *     MAJOR_ISSUE counts + issue listesi + ornek 5 entry per kategori)
 *
 * Usage:
 *   npx tsx scripts/verify-mod-k-batch.ts                # tum batch'ler
 *   npx tsx scripts/verify-mod-k-batch.ts --batch 1      # tek batch
 *   npx tsx scripts/verify-mod-k-batch.ts --batch 1,2    # birden cok
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

interface ModKEntry {
  slug: string;
  verdict: "PASS" | "CORRECTION" | "MAJOR_ISSUE";
  issues?: string[];
  corrections?: {
    description?: string;
    ingredients_add?: Array<{ name: string; amount: string; unit: string; group?: string }>;
    ingredients_remove?: string[];
    steps_replace?: Array<{ stepNumber: number; instruction: string; timerSeconds?: number | null }>;
    tipNote?: string;
    prepMinutes?: number;
    cookMinutes?: number;
    totalMinutes?: number;
  };
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
}

interface DbRecipe {
  id: string;
  slug: string;
  description: string;
  tipNote: string | null;
  status: string;
}

interface VerifiedEntry {
  entry: ModKEntry;
  db: DbRecipe | null;
  issues: string[];
  cleanForApply: boolean;
}

const SHISIRME_MAX_RATIO = 1.2; // description/tipNote max %20 uzar
const REASON_MIN = 50;
const REASON_MAX = 300;
const JARGON_YASAK = [
  "emülsiyon", "denatüre", "karamelizasyon", "polifenol", "viskozite",
  "Maillard", "antioksidan", "kapsaisin", "flavonoid", "uçucu yağ",
  "hidrasyon",
];
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const ASCII_FOLD_HINTS = [
  "Tavugu", "yogurt", "yumusatir", "sarimsak", "bekletin", "sicakligi",
  "isiyla", "guzel", "lezzetli", "duzenli",
];

function parseBatchArg(): number[] | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function discoverBatchFiles(filter: number[] | null): string[] {
  const docsDir = path.resolve(process.cwd(), "docs");
  const all = fs
    .readdirSync(docsDir)
    .filter((f) => /^mod-k-batch-\d+\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-k-batch-(\d+)\.json$/);
      return m && set.has(Number.parseInt(m[1], 10));
    })
    .map((f) => path.join(docsDir, f));
}

function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function urlDomain(u: string): string | null {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function hasEmDash(s: string | undefined | null): boolean {
  if (!s) return false;
  return /[\u2014\u2013]/.test(s);
}

function looksAsciiFolded(s: string | undefined | null): boolean {
  if (!s) return false;
  // Hicbir TR karakter yoksa ve cumle yeterince uzunsa supheli
  if (s.length < 30) return false;
  if (TURKISH_CHARS.test(s)) return false;
  // Bilinen ASCII fold hint kelime varsa kesin
  for (const hint of ASCII_FOLD_HINTS) {
    if (s.includes(hint)) return true;
  }
  // 30+ char cumle TR karakter icermiyorsa supheli
  return true;
}

function hasJargon(s: string | undefined | null): string | null {
  if (!s) return null;
  const lower = s.toLocaleLowerCase("tr");
  for (const j of JARGON_YASAK) {
    if (lower.includes(j.toLocaleLowerCase("tr"))) return j;
  }
  return null;
}

function validateEntry(entry: ModKEntry, db: DbRecipe | null): string[] {
  const issues: string[] = [];

  if (!entry.slug || typeof entry.slug !== "string") {
    issues.push("slug yok veya gecersiz");
    return issues;
  }
  if (!entry.verdict || !["PASS", "CORRECTION", "MAJOR_ISSUE"].includes(entry.verdict)) {
    issues.push("verdict yok veya gecersiz (PASS/CORRECTION/MAJOR_ISSUE)");
    return issues;
  }
  if (!db) {
    issues.push("DB'de slug bulunamadi (PUBLISHED filter)");
    return issues;
  }
  if (db.status !== "PUBLISHED") {
    issues.push(`status PUBLISHED degil (${db.status})`);
  }

  // Sources >= 2 farkli domain (PASS dahil)
  if (!Array.isArray(entry.sources) || entry.sources.length < 2) {
    issues.push("sources < 2 (en az 2 farkli domain zorunlu)");
  } else {
    const invalidUrls = entry.sources.filter((u) => !isHttpUrl(u));
    if (invalidUrls.length > 0) {
      issues.push(`gecersiz URL(${invalidUrls.length}): ${invalidUrls.slice(0, 2).join(", ")}`);
    }
    const domains = entry.sources
      .map(urlDomain)
      .filter((d): d is string => d !== null);
    const uniqueDomains = new Set(domains);
    if (uniqueDomains.size < 2) {
      issues.push(`farkli domain < 2 (${[...uniqueDomains].join(", ") || "yok"})`);
    }
  }

  // Confidence
  if (!entry.confidence || !["high", "medium", "low"].includes(entry.confidence)) {
    issues.push("confidence high/medium/low olmali");
  }

  // Reason
  if (!entry.reason || entry.reason.trim().length < REASON_MIN) {
    issues.push(`reason cok kisa (<${REASON_MIN} char)`);
  } else if (entry.reason.length > REASON_MAX) {
    issues.push(`reason cok uzun (>${REASON_MAX} char)`);
  }

  // CORRECTION/MAJOR_ISSUE icin corrections obj zorunlu, en az 1 alan
  if (entry.verdict !== "PASS") {
    if (!entry.corrections || Object.keys(entry.corrections).length === 0) {
      issues.push("CORRECTION/MAJOR_ISSUE icin corrections en az 1 alan icermeli");
    } else {
      // Sisirme yasagi: description ve tipNote max %20 uzar
      if (entry.corrections.description) {
        const newLen = entry.corrections.description.length;
        const oldLen = db.description.length;
        if (oldLen > 0 && newLen > oldLen * SHISIRME_MAX_RATIO) {
          issues.push(`description sisirildi (${oldLen} -> ${newLen}, max ${Math.floor(oldLen * SHISIRME_MAX_RATIO)})`);
        }
      }
      if (entry.corrections.tipNote && db.tipNote) {
        const newLen = entry.corrections.tipNote.length;
        const oldLen = db.tipNote.length;
        if (oldLen > 0 && newLen > oldLen * SHISIRME_MAX_RATIO) {
          issues.push(`tipNote sisirildi (${oldLen} -> ${newLen}, max ${Math.floor(oldLen * SHISIRME_MAX_RATIO)})`);
        }
      }
    }
  }

  // Em-dash + Turkce karakter + jargon check tum string field'larda
  const stringFields: Array<[string, string | undefined]> = [
    ["reason", entry.reason],
    ["corrections.description", entry.corrections?.description],
    ["corrections.tipNote", entry.corrections?.tipNote],
  ];
  for (const step of entry.corrections?.steps_replace ?? []) {
    stringFields.push([`step ${step.stepNumber}.instruction`, step.instruction]);
  }

  for (const [name, val] of stringFields) {
    if (!val) continue;
    if (hasEmDash(val)) issues.push(`em-dash bulundu: ${name}`);
    if (looksAsciiFolded(val)) issues.push(`ASCII fold suphesi (TR karakter eksik): ${name}`);
    const j = hasJargon(val);
    if (j) issues.push(`jargon bulundu (${j}): ${name}`);
  }

  return issues;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  if (!url) {
    console.error("DATABASE_URL yok");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const filter = parseBatchArg();
  const files = discoverBatchFiles(filter);
  if (files.length === 0) {
    console.error("docs/mod-k-batch-N.json bulunamadi");
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Okunan batch dosyalari: ${files.length}`);

  const all: ModKEntry[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (!Array.isArray(data)) {
      console.error(`${path.basename(f)}: array degil, atlandi`);
      continue;
    }
    for (const e of data) all.push(e as ModKEntry);
    console.log(`  ${path.basename(f)}: ${data.length} entry`);
  }
  console.log(`Toplam entry: ${all.length}`);

  // Slug evren
  const slugs = [...new Set(all.map((e) => e.slug).filter(Boolean))];
  const dbRows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, description: true, tipNote: true, status: true },
  });
  const dbMap = new Map<string, DbRecipe>();
  for (const r of dbRows) dbMap.set(r.slug, r as DbRecipe);

  // Verify each
  const verified: VerifiedEntry[] = all.map((entry) => {
    const db = dbMap.get(entry.slug) ?? null;
    const issues = validateEntry(entry, db);
    const cleanForApply = issues.length === 0;
    return { entry, db, issues, cleanForApply };
  });

  // Aggregate
  const passCount = verified.filter((v) => v.entry.verdict === "PASS").length;
  const corrCount = verified.filter((v) => v.entry.verdict === "CORRECTION").length;
  const majorCount = verified.filter((v) => v.entry.verdict === "MAJOR_ISSUE").length;
  const cleanCount = verified.filter((v) => v.cleanForApply).length;
  const blockedCount = verified.length - cleanCount;
  const high = verified.filter((v) => v.entry.confidence === "high").length;
  const medium = verified.filter((v) => v.entry.confidence === "medium").length;
  const low = verified.filter((v) => v.entry.confidence === "low").length;

  // Slug dedup check (across batches)
  const slugCount = new Map<string, number>();
  for (const v of verified) {
    slugCount.set(v.entry.slug, (slugCount.get(v.entry.slug) ?? 0) + 1);
  }
  const duplicateSlugs = [...slugCount.entries()]
    .filter(([, c]) => c > 1)
    .map(([s, c]) => `${s} (x${c})`);

  // Markdown rapor
  const lines: string[] = [];
  lines.push(`# Mod K verify raporu`);
  lines.push("");
  lines.push(`Okunan dosya: ${files.length} batch`);
  lines.push(`Toplam entry: ${all.length}`);
  lines.push("");
  lines.push("## Ozet (verdict)");
  lines.push("");
  lines.push(`- PASS: **${passCount}** (${((passCount / all.length) * 100).toFixed(1)}%)`);
  lines.push(`- CORRECTION: ${corrCount} (${((corrCount / all.length) * 100).toFixed(1)}%)`);
  lines.push(`- MAJOR_ISSUE: ${majorCount} (${((majorCount / all.length) * 100).toFixed(1)}%)`);
  lines.push("");
  lines.push("## Confidence");
  lines.push("");
  lines.push(`- high: ${high}, medium: ${medium}, low: ${low}`);
  lines.push("");
  lines.push("## Format integrity");
  lines.push("");
  lines.push(`- Apply'a hazir (clean format): **${cleanCount}**`);
  lines.push(`- BLOCKED (format issue): ${blockedCount}`);
  if (duplicateSlugs.length > 0) {
    lines.push(`- DUPLICATE slug (batch'ler arasi): ${duplicateSlugs.length}`);
    for (const d of duplicateSlugs) lines.push(`  - \`${d}\``);
  }
  lines.push("");

  if (blockedCount > 0) {
    lines.push("## BLOCKED (format issue, apply yapma)");
    lines.push("");
    lines.push("| Slug | Verdict | Issues |");
    lines.push("|---|---|---|");
    for (const v of verified.filter((x) => x.issues.length > 0)) {
      lines.push(`| \`${v.entry.slug}\` | ${v.entry.verdict} | ${v.issues.join("; ")} |`);
    }
    lines.push("");
  }

  // MAJOR_ISSUE listesi (manuel review zorunlu)
  if (majorCount > 0) {
    lines.push("## MAJOR_ISSUE (manuel review zorunlu)");
    lines.push("");
    for (const v of verified.filter((x) => x.entry.verdict === "MAJOR_ISSUE")) {
      lines.push(`### \`${v.entry.slug}\``);
      lines.push("");
      lines.push(`**Reason**: ${v.entry.reason ?? "(yok)"}`);
      lines.push("");
      if (v.entry.issues) {
        lines.push("**Issues**:");
        for (const i of v.entry.issues) lines.push(`- ${i}`);
        lines.push("");
      }
      if (v.entry.corrections) {
        lines.push("**Corrections** (sample):");
        const c = v.entry.corrections;
        if (c.description) lines.push(`- description: "${c.description.slice(0, 120)}..."`);
        if (c.tipNote) lines.push(`- tipNote: "${c.tipNote.slice(0, 120)}..."`);
        if (c.ingredients_add) lines.push(`- ingredients_add: ${c.ingredients_add.length}`);
        if (c.ingredients_remove) lines.push(`- ingredients_remove: ${c.ingredients_remove.join(", ")}`);
        if (c.steps_replace) lines.push(`- steps_replace: ${c.steps_replace.length}`);
        lines.push("");
      }
    }
  }

  // CORRECTION sample
  if (corrCount > 0) {
    lines.push("## CORRECTION sample (ilk 10)");
    lines.push("");
    lines.push("| Slug | Conf | Issues count | Corrections fields |");
    lines.push("|---|---|---:|---|");
    const sample = verified
      .filter((x) => x.entry.verdict === "CORRECTION")
      .slice(0, 10);
    for (const v of sample) {
      const c = v.entry.corrections ?? {};
      const fields = Object.keys(c).join(", ");
      lines.push(
        `| \`${v.entry.slug}\` | ${v.entry.confidence ?? "?"} | ${v.entry.issues?.length ?? 0} | ${fields} |`,
      );
    }
    lines.push("");
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-k-verify-report.md"),
    lines.join("\n"),
  );

  // Console summary
  console.log("");
  console.log(`PASS: ${passCount} (${((passCount / all.length) * 100).toFixed(1)}%)`);
  console.log(`CORRECTION: ${corrCount}`);
  console.log(`MAJOR_ISSUE: ${majorCount}`);
  console.log(`Format clean: ${cleanCount}`);
  console.log(`BLOCKED: ${blockedCount}`);
  if (duplicateSlugs.length > 0) {
    console.log(`DUPLICATE slug: ${duplicateSlugs.length}`);
  }
  console.log("");
  console.log(`Yazildi: docs/mod-k-verify-report.md`);
  if (blockedCount > 0) {
    console.log("");
    console.log("BLOCKED entry var, apply oncesi raporu inceleyin.");
    process.exit(2);
  }

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
