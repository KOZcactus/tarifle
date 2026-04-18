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

/** Locale-specific aliases accepted as equivalent to the TR proper name.
 *  Example: "Pilav" is globally written "Pilaf" (EN) or "Pilaw" (DE) — both
 *  are acceptable and keep the dish recognisable. Only list aliases when the
 *  Latin-alphabet equivalent is genuinely standard in the target language;
 *  otherwise keep the TR form. */
const PROTECTED_ALIAS: Record<string, { en?: string[]; de?: string[] }> = {
  // "Pilav" is globally "Pilaf" (EN) / "Pilaw" (DE). In cuisine-specific
  // contexts (Chinese "fried rice", Japanese "rice bowl"), "Rice"/"Reis" is
  // the standard rendering and still conveys the pilav identity, so we
  // accept it too.
  Pilav: { en: ["Pilaf", "Rice"], de: ["Pilaw", "Pilaf", "Reis"] },
  Humus: { en: ["Hummus"], de: ["Hummus"] },
  Yoğurt: { en: ["Yogurt", "Yoghurt"], de: ["Joghurt"] },
};

/** Slugs where a protected token appears only as a generic modifier and
 *  doesn't need to be preserved in translation. "Lokma" as a dessert must
 *  stay (`lokma-tatlisi`) but in `kakaolu-enerji-lokmalari` ("cocoa energy
 *  bites") or `patates-rosti-lokmalari` ("potato rosti bites") it's just the
 *  Turkish word for "bite/morsel" — "Energy Bites" / "Rosti Bites" are the
 *  natural EN/DE renderings. Listed by token so the skip is surgical. */
const PROTECTED_TOKEN_SKIP_SLUGS: Record<string, ReadonlySet<string>> = {
  Lokma: new Set([
    "kakaolu-enerji-lokmalari",
    "kabak-mucver-lokmalari",
    "patates-rosti-lokmalari",
  ]),
};

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
  // token, the EN and DE titles must contain it (or a locale-appropriate
  // alias, e.g. "Pilav" → "Pilaf"/"Pilaw"). Case-insensitive match.
  const titleTokens = PROTECTED_TR_TOKENS.filter((t) =>
    trTitle.toLocaleLowerCase("tr").includes(t.toLocaleLowerCase("tr")),
  );
  const hasLocaleForm = (localeTitle: string, token: string, locale: "en" | "de"): boolean => {
    const accepted = [token, ...(PROTECTED_ALIAS[token]?.[locale] ?? [])];
    const lower = localeTitle.toLocaleLowerCase();
    return accepted.some((alias) => lower.includes(alias.toLocaleLowerCase()));
  };
  for (const token of titleTokens) {
    if (PROTECTED_TOKEN_SKIP_SLUGS[token]?.has(item.slug)) continue;
    if (!hasLocaleForm(item.en.title, token, "en")) {
      findings.push({
        slug: item.slug,
        severity: "CRITICAL",
        type: "proper-name-lost",
        detail: `EN title "${item.en.title}" lost TR proper name "${token}"`,
      });
    }
    if (!hasLocaleForm(item.de.title, token, "de")) {
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

  // Banned placeholder patterns. Two tiers:
  //   - "hard" patterns (opener fully-generic) → CRITICAL always. Short,
  //     information-dense descriptions are fine; what we're blocking is the
  //     "A Turkish dish." / "Delicious and healthy recipe." tier.
  //   - "soft" opener patterns ("A traditional X …") → CRITICAL only when
  //     the description stays thin (<80 chars). A long description that
  //     happens to start with "A traditional" but then includes specifics is
  //     fine — Codex already did the work.
  const HARD_BANNED = [
    /^a turkish (dish|recipe|food)\s*\.?$/i,
    /^a (delicious|tasty|wonderful) (turkish|recipe|dish)\b/i,
    /\bdelicious and healthy\b/i,
    /\bmust[- ]try\b/i,
    /\btraditional recipe\b/i,
  ];
  const SOFT_OPENER = /^a (traditional|classic|simple|quick) /i;
  for (const p of HARD_BANNED) {
    if (p.test(item.en.description)) {
      findings.push({
        slug: item.slug,
        severity: "CRITICAL",
        type: "placeholder-prose",
        detail: `EN description matches banned pattern: ${p.source}`,
      });
    }
  }
  if (
    SOFT_OPENER.test(item.en.description) &&
    item.en.description.length < 80
  ) {
    findings.push({
      slug: item.slug,
      severity: "CRITICAL",
      type: "placeholder-prose",
      detail: `EN description starts with a generic opener ("A traditional/classic/…") and stays thin (${item.en.description.length} chars). Needs more specifics.`,
    });
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
