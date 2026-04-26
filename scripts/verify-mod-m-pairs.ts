/**
 * Mod M (Marine) Codex teslim sonrasi verify pipeline'i.
 * docs/mod-m-batch-N.json'lardaki marine entry'lerini DB'ye karsi
 * dogrular + format integrity kontrolu yapar + kullaniciya kompakt
 * rapor uretir.
 *
 * Apply YAPMAZ. Sadece okur, dogrular, rapor yazar. Apply icin ayri
 * script: apply-mod-m-batch.ts (verify PASS sonrasi koshulur).
 *
 * Cikti:
 *   - docs/mod-m-verify-report.md (markdown rapor: high/medium/low/skip
 *     count, issue listesi, ornek 5 entry)
 *
 * Usage:
 *   npx tsx scripts/verify-mod-m-pairs.ts                # tum batch'ler
 *   npx tsx scripts/verify-mod-m-pairs.ts --batch 1      # tek batch
 *   npx tsx scripts/verify-mod-m-pairs.ts --batch 1,2    # birden cok
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

interface MarineEntry {
  slug: string;
  marineMinutes?: number;
  marineDescription?: string;
  tipNote_addition?: string;
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
  classification?: "SKIP";
}

interface DbRecipe {
  id: string;
  slug: string;
  title: string;
  status: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  tipNote: string | null;
}

interface VerifiedEntry {
  entry: MarineEntry;
  db: DbRecipe | null;
  issues: string[];
  expectedTotal: number | null;
  cleanForApply: boolean;
}

const MARINE_MIN_MINUTES = 5;
const MARINE_MAX_MINUTES = 10080;
const REASON_MIN = 20;
const REASON_MAX = 400;
const DESC_MIN = 20;
const DESC_MAX = 200;
const TIPNOTE_ADD_MAX = 240;

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
    .filter((f) => /^mod-m-batch-\d+\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-m-batch-(\d+)\.json$/);
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
  // U+2014 em-dash + U+2013 en-dash (AGENTS.md em-dash yasak kurali).
  // Unicode escape kullanildi ki bu script check-emdash.mjs guard'ina
  // takilmasin (script literal em-dash icerse pre-push fail eder).
  return /[\u2014\u2013]/.test(s);
}

function validateMarineEntry(entry: MarineEntry, db: DbRecipe | null): {
  issues: string[];
  expectedTotal: number | null;
} {
  const issues: string[] = [];
  let expectedTotal: number | null = null;

  if (!entry.slug || typeof entry.slug !== "string") {
    issues.push("slug yok veya gecersiz");
    return { issues, expectedTotal };
  }

  if (entry.classification === "SKIP") {
    if (!entry.reason || entry.reason.trim().length < REASON_MIN) {
      issues.push("SKIP icin reason zorunlu (min 20 char)");
    }
    if (entry.reason && entry.reason.length > REASON_MAX) {
      issues.push(`reason cok uzun (>${REASON_MAX} char)`);
    }
    return { issues, expectedTotal };
  }

  if (!db) {
    issues.push("DB'de slug bulunamadi (PUBLISHED filter)");
    return { issues, expectedTotal };
  }
  if (db.status !== "PUBLISHED") {
    issues.push(`status PUBLISHED degil (${db.status})`);
  }

  // marineMinutes
  if (typeof entry.marineMinutes !== "number" || !Number.isFinite(entry.marineMinutes)) {
    issues.push("marineMinutes sayi degil");
  } else if (entry.marineMinutes < MARINE_MIN_MINUTES) {
    issues.push(`marineMinutes ${entry.marineMinutes} cok dusuk (<${MARINE_MIN_MINUTES})`);
  } else if (entry.marineMinutes > MARINE_MAX_MINUTES) {
    issues.push(`marineMinutes ${entry.marineMinutes} cok yuksek (>${MARINE_MAX_MINUTES})`);
  } else {
    expectedTotal = db.prepMinutes + db.cookMinutes + entry.marineMinutes;
    if (expectedTotal > MARINE_MAX_MINUTES) {
      issues.push(`expectedTotal ${expectedTotal} schema cap (${MARINE_MAX_MINUTES}) asar`);
    }
  }

  // sources >= 2 + valid URL + dedup domain
  if (!Array.isArray(entry.sources) || entry.sources.length < 2) {
    issues.push("sources < 2 (en az 2 farkli kaynak zorunlu)");
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

  // confidence
  if (!entry.confidence || !["high", "medium", "low"].includes(entry.confidence)) {
    issues.push("confidence high/medium/low olmali");
  }

  // reason
  if (!entry.reason || entry.reason.trim().length < REASON_MIN) {
    issues.push(`reason cok kisa (<${REASON_MIN} char)`);
  } else if (entry.reason.length > REASON_MAX) {
    issues.push(`reason cok uzun (>${REASON_MAX} char)`);
  }

  // marineDescription opsiyonel ama var ise format
  if (entry.marineDescription !== undefined) {
    const len = entry.marineDescription.trim().length;
    if (len < DESC_MIN || len > DESC_MAX) {
      issues.push(`marineDescription ${len} char (beklenen ${DESC_MIN}-${DESC_MAX})`);
    }
  }

  // tipNote_addition opsiyonel
  if (entry.tipNote_addition !== undefined) {
    const len = entry.tipNote_addition.trim().length;
    if (len > TIPNOTE_ADD_MAX) {
      issues.push(`tipNote_addition cok uzun (${len} > ${TIPNOTE_ADD_MAX})`);
    }
  }

  // em-dash yasak
  for (const field of ["marineDescription", "tipNote_addition", "reason"] as const) {
    if (hasEmDash(entry[field])) {
      issues.push(`em-dash bulundu: ${field}`);
    }
  }

  return { issues, expectedTotal };
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
    console.error("docs/mod-m-batch-N.json bulunamadi");
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Okunan batch dosyalari: ${files.length}`);

  const all: MarineEntry[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (!Array.isArray(data)) {
      console.error(`${path.basename(f)}: array degil, atlandi`);
      continue;
    }
    for (const e of data) all.push(e as MarineEntry);
    console.log(`  ${path.basename(f)}: ${data.length} entry`);
  }
  console.log(`Toplam entry: ${all.length}`);

  // Slug evren
  const slugs = [...new Set(all.map((e) => e.slug).filter(Boolean))];
  const dbRows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      tipNote: true,
    },
  });
  const dbMap = new Map<string, DbRecipe>();
  for (const r of dbRows) dbMap.set(r.slug, r as DbRecipe);

  // Verify each
  const verified: VerifiedEntry[] = all.map((entry) => {
    const db = dbMap.get(entry.slug) ?? null;
    const { issues, expectedTotal } = validateMarineEntry(entry, db);
    const isSkip = entry.classification === "SKIP";
    const cleanForApply = !isSkip && issues.length === 0;
    return { entry, db, issues, expectedTotal, cleanForApply };
  });

  // Aggregate
  const skipCount = verified.filter((v) => v.entry.classification === "SKIP").length;
  const applyClean = verified.filter((v) => v.cleanForApply);
  const high = applyClean.filter((v) => v.entry.confidence === "high").length;
  const medium = applyClean.filter((v) => v.entry.confidence === "medium").length;
  const low = applyClean.filter((v) => v.entry.confidence === "low").length;
  const blocked = verified.filter(
    (v) => v.entry.classification !== "SKIP" && v.issues.length > 0,
  );

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
  lines.push(`# Mod M verify raporu`);
  lines.push("");
  lines.push(`Okunan dosya: ${files.length} batch`);
  lines.push(`Toplam entry: ${all.length}`);
  lines.push("");
  lines.push("## Ozet");
  lines.push("");
  lines.push(`- Apply'a hazir (clean): **${applyClean.length}**`);
  lines.push(`  - high confidence: ${high}`);
  lines.push(`  - medium confidence: ${medium}`);
  lines.push(`  - low confidence: ${low}`);
  lines.push(`- SKIP: ${skipCount}`);
  lines.push(`- BLOCKED (issue var): ${blocked.length}`);
  if (duplicateSlugs.length > 0) {
    lines.push(`- DUPLICATE slug (batch'ler arasi): ${duplicateSlugs.length}`);
    for (const d of duplicateSlugs) lines.push(`  - \`${d}\``);
  }
  lines.push("");

  if (blocked.length > 0) {
    lines.push("## BLOCKED (issue var, apply yapma)");
    lines.push("");
    lines.push("| Slug | Issues |");
    lines.push("|---|---|");
    for (const v of blocked) {
      lines.push(`| \`${v.entry.slug}\` | ${v.issues.join("; ")} |`);
    }
    lines.push("");
  }

  if (skipCount > 0) {
    lines.push("## SKIP (Codex marine icermiyor dedi)");
    lines.push("");
    lines.push("| Slug | Reason |");
    lines.push("|---|---|");
    for (const v of verified.filter((x) => x.entry.classification === "SKIP")) {
      const reason = v.entry.reason ? v.entry.reason.slice(0, 120) : "(reason yok)";
      lines.push(`| \`${v.entry.slug}\` | ${reason} |`);
    }
    lines.push("");
  }

  if (applyClean.length > 0) {
    lines.push("## Apply hazir (sample)");
    lines.push("");
    lines.push("| Slug | Marine min | Eski total | Yeni total | Conf | Sources |");
    lines.push("|---|---:|---:|---:|---|---|");
    const sample = applyClean.slice(0, 10);
    for (const v of sample) {
      const m = v.entry.marineMinutes ?? 0;
      const oldT = v.db?.totalMinutes ?? 0;
      const newT = v.expectedTotal ?? 0;
      const conf = v.entry.confidence ?? "?";
      const srcDomains = (v.entry.sources ?? [])
        .map(urlDomain)
        .filter((d): d is string => d !== null)
        .join(", ");
      lines.push(`| \`${v.entry.slug}\` | ${m} | ${oldT} | ${newT} | ${conf} | ${srcDomains} |`);
    }
    if (applyClean.length > 10) {
      lines.push(`| _...${applyClean.length - 10} entry daha_ | | | | | |`);
    }
    lines.push("");
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-m-verify-report.md"),
    lines.join("\n"),
  );

  // Console summary
  console.log("");
  console.log(`Apply clean: ${applyClean.length} (high: ${high}, medium: ${medium}, low: ${low})`);
  console.log(`SKIP: ${skipCount}`);
  console.log(`BLOCKED: ${blocked.length}`);
  if (duplicateSlugs.length > 0) {
    console.log(`DUPLICATE slug: ${duplicateSlugs.length}`);
  }
  console.log("");
  console.log(`Yazildi: docs/mod-m-verify-report.md`);
  if (blocked.length > 0) {
    console.log("");
    console.log("⚠️  BLOCKED entry var, apply oncesi raporu inceleyin.");
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
