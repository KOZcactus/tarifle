/**
 * Import EN/DE translations produced by Codex Max into Recipe.translations.
 *
 * Workflow:
 *   1. `scripts/export-recipes-for-translation.ts` → docs/translations-batch-N.csv
 *   2. Codex Max reads the CSV → writes docs/translations-batch-N.json
 *   3. This script validates the JSON and writes to DB (dev, then prod).
 *
 * Runs dry-run by default. --apply is required to touch the DB.
 * Destructive-script convention: wraps assertDbTarget() so production writes
 * require --confirm-prod.
 *
 *   # Validate a batch (no writes)
 *   npx tsx scripts/import-translations.ts --batch 0
 *
 *   # Write to dev DB after the dry-run looks clean
 *   npx tsx scripts/import-translations.ts --batch 0 --apply
 *
 *   # Later, promote to prod:
 *   # (see docs/PROD_PROMOTE.md — set DATABASE_URL, then)
 *   # npx tsx scripts/import-translations.ts --batch 0 --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force"); // overwrite existing translations

function parseBatchArg(): string {
  const eq = process.argv.find((a) => a.startsWith("--batch="));
  if (eq) return eq.split("=")[1];
  const idx = process.argv.indexOf("--batch");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("Missing --batch N (e.g. --batch 0 for pilot).");
  process.exit(1);
}

/** Locale bundle — Codex produces title + description (required), everything
 *  else optional. Ingredient/step translations are for later batches. */
const localeBundleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(20).max(400),
});

const issueSchema = z.object({
  type: z.enum([
    "ingredient-allergen-mismatch",
    "time-inconsistency",
    "vague-language",
    "composite-ingredient",
    "step-ingredient-missing",
    "calorie-anomaly",
    "other",
  ]),
  detail: z.string().min(3),
});

const translationItemSchema = z.object({
  slug: z.string().min(2).max(200),
  en: localeBundleSchema,
  de: localeBundleSchema,
  issues: z.array(issueSchema).optional(),
});

const translationsFileSchema = z.array(translationItemSchema);

/** Titles that MUST NOT be translated away — the TR proper name has to show
 *  up somewhere in the EN/DE title. Keeps "Adana Kebap" from becoming
 *  "Spicy Meat Skewer". Covers the highest-risk proper names; additional
 *  names live in docs but the script only guards the well-known ones. */
const PROTECTED_TR_TOKENS = [
  "Baklava",
  "Künefe",
  "Kadayıf",
  "Şekerpare",
  "Muhallebi",
  "Güllaç",
  "Revani",
  "Sütlaç",
  "Aşure",
  "Kazandibi",
  "Tulumba",
  "Lokum",
  "Helva",
  "Halva",
  "Lokma",
  "Adana Kebap",
  "Urfa Kebap",
  "İskender",
  "Döner",
  "Şiş Kebap",
  "Köfte",
  "Cağ Kebabı",
  "Beyti",
  "Tantuni",
  "Lahmacun",
  "Pide",
  "Börek",
  "Gözleme",
  "Simit",
  "Poğaça",
  "Çiğköfte",
  "Mantı",
  "Manti",
  "Menemen",
  "Çılbır",
  "Sucuk",
  "Pastırma",
  "Dolma",
  "Sarma",
  "İmam Bayıldı",
  "Karnıyarık",
  "Hünkar Beğendi",
  "Pilav",
  "Ayran",
  "Şalgam",
  "Boza",
  "Salep",
  "Rakı",
  "Kumpir",
  "Tarhana",
];

interface QualityFinding {
  slug: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  type: string;
  detail: string;
}

/**
 * Quality checks per item — run in addition to Zod. Findings are printed in
 * dry-run and summarised at the end of --apply. CRITICAL blocks the write
 * unless --force is passed.
 */
function qualityCheck(
  item: z.infer<typeof translationItemSchema>,
  trTitle: string,
): QualityFinding[] {
  const findings: QualityFinding[] = [];

  // TR slug-based proper name guard — if the TR title contains a protected
  // token, the EN and DE titles must contain it too (case-insensitive match).
  const titleTokens = PROTECTED_TR_TOKENS.filter((t) =>
    trTitle.toLocaleLowerCase("tr").includes(t.toLocaleLowerCase("tr")),
  );
  for (const token of titleTokens) {
    const enHas = item.en.title.toLocaleLowerCase().includes(token.toLocaleLowerCase());
    const deHas = item.de.title.toLocaleLowerCase().includes(token.toLocaleLowerCase());
    if (!enHas) {
      findings.push({
        slug: item.slug,
        severity: "CRITICAL",
        type: "proper-name-lost",
        detail: `EN title "${item.en.title}" lost TR proper name "${token}"`,
      });
    }
    if (!deHas) {
      findings.push({
        slug: item.slug,
        severity: "CRITICAL",
        type: "proper-name-lost",
        detail: `DE title "${item.de.title}" lost TR proper name "${token}"`,
      });
    }
  }

  // Description brevity — Zod min 20, but < 60 almost certainly thin
  if (item.en.description.length < 60) {
    findings.push({
      slug: item.slug,
      severity: "WARNING",
      type: "description-thin",
      detail: `EN description is ${item.en.description.length} chars — likely too brief`,
    });
  }
  if (item.de.description.length < 60) {
    findings.push({
      slug: item.slug,
      severity: "WARNING",
      type: "description-thin",
      detail: `DE description is ${item.de.description.length} chars — likely too brief`,
    });
  }

  // Banned placeholder patterns
  const BANNED_PATTERNS = [
    /^a (delicious|traditional|tasty|wonderful) /i,
    /^a turkish (dish|recipe|food)$/i,
    /\bdelicious and healthy\b/i,
    /\bmust[- ]try\b/i,
    /\btraditional recipe\b/i,
  ];
  for (const p of BANNED_PATTERNS) {
    if (p.test(item.en.description)) {
      findings.push({
        slug: item.slug,
        severity: "CRITICAL",
        type: "placeholder-prose",
        detail: `EN description matches banned pattern: ${p.source}`,
      });
    }
  }

  // Issues from Codex are surfaced as INFO so Kerem sees them during review
  if (item.issues && item.issues.length > 0) {
    for (const issue of item.issues) {
      findings.push({
        slug: item.slug,
        severity: "INFO",
        type: `codex-issue:${issue.type}`,
        detail: issue.detail,
      });
    }
  }

  return findings;
}

async function main() {
  if (APPLY) assertDbTarget("import-translations");

  const batch = parseBatchArg();
  const file = path.resolve(process.cwd(), `docs/translations-batch-${batch}.json`);
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    console.error(
      `Expected Codex Max to have written it. Did you run the export script and give the CSV to Codex?`,
    );
    process.exit(1);
  }

  console.log(`📄 reading ${path.relative(process.cwd(), file)}`);
  const raw = fs.readFileSync(file, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ JSON parse error: ${(e as Error).message}`);
    process.exit(1);
  }

  const zodResult = translationsFileSchema.safeParse(parsed);
  if (!zodResult.success) {
    console.error("❌ Zod validation failed:");
    for (const err of zodResult.error.issues.slice(0, 20)) {
      console.error(`  [${err.path.join(".")}] ${err.message}`);
    }
    if (zodResult.error.issues.length > 20) {
      console.error(`  ... and ${zodResult.error.issues.length - 20} more.`);
    }
    process.exit(1);
  }

  const items = zodResult.data;
  console.log(`✅ Zod schema OK — ${items.length} entries.`);

  // Verify every slug exists, no duplicates, none already have translations
  // (unless --force). Pull in batch so we don't hit N queries.
  const slugs = items.map((i) => i.slug);
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size !== slugs.length) {
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    console.error(`❌ Duplicate slugs in JSON: ${[...new Set(dupes)].join(", ")}`);
    process.exit(1);
  }

  const dbRecipes = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true, translations: true },
  });
  const bySlug = new Map(dbRecipes.map((r) => [r.slug, r]));

  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length > 0) {
    console.error(`❌ ${missing.length} slugs don't exist in DB:`);
    for (const m of missing.slice(0, 10)) console.error(`  ${m}`);
    process.exit(1);
  }

  const alreadyHas = dbRecipes.filter((r) => r.translations !== null).map((r) => r.slug);
  if (alreadyHas.length > 0 && !FORCE) {
    console.error(`❌ ${alreadyHas.length} recipes already have translations. Use --force to overwrite:`);
    for (const s of alreadyHas.slice(0, 10)) console.error(`  ${s}`);
    process.exit(1);
  }

  // Quality sweep
  const findings: QualityFinding[] = [];
  for (const item of items) {
    const dbRow = bySlug.get(item.slug)!;
    findings.push(...qualityCheck(item, dbRow.title));
  }

  const bySeverity = {
    CRITICAL: findings.filter((f) => f.severity === "CRITICAL"),
    WARNING: findings.filter((f) => f.severity === "WARNING"),
    INFO: findings.filter((f) => f.severity === "INFO"),
  };

  console.log("\n📊 Quality summary:");
  console.log(`  🔴 CRITICAL: ${bySeverity.CRITICAL.length}`);
  console.log(`  🟡 WARNING:  ${bySeverity.WARNING.length}`);
  console.log(`  🔵 INFO:     ${bySeverity.INFO.length}`);

  if (bySeverity.CRITICAL.length > 0) {
    console.log("\n🔴 CRITICAL findings:");
    for (const f of bySeverity.CRITICAL.slice(0, 20)) {
      console.log(`  [${f.slug}] ${f.type}: ${f.detail}`);
    }
    if (bySeverity.CRITICAL.length > 20) {
      console.log(`  ... ${bySeverity.CRITICAL.length - 20} more`);
    }
  }

  if (bySeverity.WARNING.length > 0 && bySeverity.WARNING.length <= 30) {
    console.log("\n🟡 WARNING findings:");
    for (const f of bySeverity.WARNING) {
      console.log(`  [${f.slug}] ${f.type}: ${f.detail}`);
    }
  } else if (bySeverity.WARNING.length > 30) {
    console.log(`\n🟡 ${bySeverity.WARNING.length} WARNING findings — first 10:`);
    for (const f of bySeverity.WARNING.slice(0, 10)) {
      console.log(`  [${f.slug}] ${f.type}: ${f.detail}`);
    }
  }

  if (bySeverity.INFO.length > 0 && bySeverity.INFO.length <= 40) {
    console.log("\n🔵 Codex-reported content issues (review separately):");
    for (const f of bySeverity.INFO) {
      console.log(`  [${f.slug}] ${f.type}: ${f.detail}`);
    }
  } else if (bySeverity.INFO.length > 40) {
    console.log(
      `\n🔵 Codex flagged ${bySeverity.INFO.length} content issues — see ${file} for full list.`,
    );
  }

  if (!APPLY) {
    console.log("\nDry-run only — no DB writes. Pass --apply to persist.");
    if (bySeverity.CRITICAL.length > 0) {
      console.log(
        "\nNote: --apply will refuse to proceed while CRITICAL findings exist (use --force to override).",
      );
    }
    return;
  }

  if (bySeverity.CRITICAL.length > 0 && !FORCE) {
    console.error(
      "\n❌ refusing to apply with CRITICAL findings. Fix the JSON or pass --force.",
    );
    process.exit(1);
  }

  // Write phase — one update per recipe, one transaction per batch of 50 to
  // keep Neon round-trips bounded. Use the callback form so we can pass a
  // timeout (array form doesn't accept TransactionOptions on this Prisma
  // build). Each chunk runs serially inside the tx so a failure mid-batch
  // rolls the whole chunk back.
  console.log(`\n📝 applying ${items.length} translations...`);
  let applied = 0;
  const CHUNK = 50;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    await prisma.$transaction(
      async (tx) => {
        for (const item of chunk) {
          await tx.recipe.update({
            where: { slug: item.slug },
            data: {
              translations: {
                en: { title: item.en.title, description: item.en.description },
                de: { title: item.de.title, description: item.de.description },
              },
            },
          });
        }
      },
      { timeout: 60_000 },
    );
    applied += chunk.length;
    console.log(`  ✅ ${applied}/${items.length}`);
  }

  console.log(`\n🎉 done — ${applied} recipes updated.`);
  console.log(
    `\nNext: run \`npx tsx scripts/audit-deep.ts\` to verify nothing broke, then commit docs/translations-batch-${batch}.json + push.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
