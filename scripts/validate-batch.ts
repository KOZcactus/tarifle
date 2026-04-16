/**
 * Pre-flight validator for scripts/seed-recipes.ts. Reads the `recipes`
 * array (imported, no DB side effect) and runs every entry through two
 * layers of checks:
 *
 *   1. Zod — existing `seedRecipeSchema` (structural + enum + ranges).
 *   2. Semantic checks on top of Zod-valid entries:
 *      - Muğlak ifade (biraz / azıcık / ya da tersi / duruma göre /
 *        epey / yeteri kadar)  → ERROR
 *      - "iyice / güzelce" without a concrete metric nearby → WARNING
 *      - Kcal vs 4·P + 4·C + 9·F consistency (±%15)          → WARNING
 *      - Alkollü malzeme var ama "alkollu" tag yok / tersi    → ERROR/WARN
 *      - Slug çakışması (docs/existing-slugs.txt varsa)       → ERROR
 *
 * Does NOT touch the database. No DATABASE_URL required.
 *
 * Why this exists: Codex Zod hatalarını seed çalışırken görüyor ama tüm
 * 500 tarifi yazmadan bir ön rapor almak bizi bir review turu kurtarır.
 * Muğlak ifade / makro sapması / alkol tag tutarsızlığı Zod'da yoktu
 * (semantik kurallar) — bu script onu kapsar.
 *
 * USAGE:
 *   npx tsx scripts/validate-batch.ts
 *   npx tsx scripts/validate-batch.ts --last 50
 *   npx tsx scripts/validate-batch.ts --slugs-file docs/existing-slugs.txt
 *
 * Exit code: 0 if clean or only WARNINGs, 1 if any ERRORs.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { recipes } from "./seed-recipes";
import {
  validateSeedRecipes,
  type SeedRecipe,
} from "../src/lib/seed/recipe-schema";

type Severity = "ERROR" | "WARNING";

export interface Issue {
  severity: Severity;
  field: string;
  message: string;
}

// Normalized (TR→ASCII, lowercased) forbidden phrases. Patterns run over
// normalized input so "Biraz", "BİRAZ", "biraz" all hit with one check.
const ERROR_WORDS = [
  "biraz",
  "azicik",
  "yeteri kadar",
  "epey",
  "ya da tersi",
  "duruma gore",
] as const;

const WARNING_WORDS = ["iyice", "guzelce"] as const;

// Basit alkol tespiti — malzeme isimlerinde geçerse tarifte alkol var
// sayıyoruz. Bunlar normalize edilmiş (aksansız, lowercase) formlarında.
// "gin" (cin) küçük bir false-positive riski taşıyor ama ingredient
// isminde başka bir token olarak yazılıyorsa zaten alkol demektir.
const ALCOHOL_WORDS = [
  "votka",
  "raki",
  "rom",
  "gin",
  "cin",
  "likor",
  "sarap",
  "bira",
  "viski",
  "tekila",
  "brendi",
  "kanyak",
  "prosecco",
  "sampanya",
  "bitters",
  "vermut",
  "kampari",
] as const;

export function normalize(text: string): string {
  // Turkish locale lowercase first — `"İ".toLowerCase()` in the default
  // JS locale produces "i̇" (i + combining dot U+0307) which breaks
  // pattern matching. `toLocaleLowerCase("tr-TR")` maps İ→i, I→ı
  // properly. Then strip the remaining TR accents to ASCII so our
  // regex vocabulary stays plain ASCII.
  return text
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

// Precompiled patterns. `\b` handles single words; multi-word phrases
// like "ya da tersi" still work because `\b` matches at the token
// boundary on either end of the phrase.
function buildPattern(words: readonly string[]): RegExp {
  return new RegExp(`\\b(${words.join("|")})\\b`);
}

export const ERROR_PATTERN = buildPattern(ERROR_WORDS);
export const WARN_PATTERN = buildPattern(WARNING_WORDS);

export function findForbidden(
  text: string | null | undefined,
  pattern: RegExp,
): string | null {
  if (!text) return null;
  const match = pattern.exec(normalize(text));
  return match ? match[1] ?? null : null;
}

function checkProseField(
  field: string,
  text: string | null | undefined,
  issues: Issue[],
): void {
  const errorMatch = findForbidden(text, ERROR_PATTERN);
  if (errorMatch) {
    issues.push({
      severity: "ERROR",
      field,
      message: `muğlak ifade "${errorMatch}" — iki durumu iki ayrı cümlede yaz veya ölçüyü somutlaştır`,
    });
    return; // only flag once per field — first hit is the most actionable
  }
  const warnMatch = findForbidden(text, WARN_PATTERN);
  if (warnMatch) {
    issues.push({
      severity: "WARNING",
      field,
      message: `"${warnMatch}" geçiyor — somut kriter ekle (örn. "elinize yapışmayana kadar 8 dk")`,
    });
  }
}

function checkMacroConsistency(r: SeedRecipe, issues: Issue[]): void {
  const { averageCalories, protein, carbs, fat } = r;
  if (
    averageCalories == null ||
    protein == null ||
    carbs == null ||
    fat == null
  )
    return; // missing data — can't verify

  // Alkollü tariflerde etanol ~7 kcal/gr katkısı 4·P + 4·C + 9·F formülüne
  // girmediğinden kalori her zaman makro toplamından yüksek çıkar. Bu
  // yapısal bir kayma, sapma değil — kontrolü atla.
  if (r.tags.includes("alkollu") || hasAlcoholIngredient(r)) return;

  const expected = 4 * protein + 4 * carbs + 9 * fat;
  const actual = averageCalories;
  if (actual === 0) return;
  const diff = Math.abs(expected - actual) / actual;
  if (diff > 0.15) {
    issues.push({
      severity: "WARNING",
      field: "averageCalories",
      message: `kalori/makro uyumsuz — 4·protein(${protein}) + 4·carbs(${carbs}) + 9·fat(${fat}) = ${Math.round(
        expected,
      )} kcal, averageCalories=${actual} (%${Math.round(
        diff * 100,
      )} fark). Rakamları gözden geçir.`,
    });
  }
}

function hasAlcoholIngredient(r: SeedRecipe): boolean {
  return r.ingredients.some((i) => {
    const n = normalize(i.name);
    return ALCOHOL_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(n));
  });
}

function checkAlcoholTag(r: SeedRecipe, issues: Issue[]): void {
  const hasAlc = hasAlcoholIngredient(r);
  const hasTag = r.tags.includes("alkollu");

  if (hasAlc && !hasTag) {
    issues.push({
      severity: "ERROR",
      field: "tags",
      message: `alkollü malzeme algılandı ama "alkollu" tag'i yok — 18+ yaş gate tetiklenmiyor`,
    });
  } else if (!hasAlc && hasTag) {
    issues.push({
      severity: "WARNING",
      field: "tags",
      message: `"alkollu" tag var ama alkollü malzeme algılanmadı — kontrol et (tag gereksizse kaldır)`,
    });
  }
}

function checkCuisine(r: SeedRecipe, issues: Issue[]): void {
  if (r.cuisine == null) {
    issues.push({
      severity: "WARNING",
      field: "cuisine",
      message: `cuisine alanı boş — retrofit doldurur ama Codex açıkça yazmalı (tr, it, jp, …)`,
    });
  }
}

function checkSlugDuplicate(
  slug: string,
  existingSlugs: Set<string> | null,
  issues: Issue[],
): void {
  if (!existingSlugs) return;
  if (existingSlugs.has(slug)) {
    issues.push({
      severity: "ERROR",
      field: "slug",
      message: `slug "${slug}" zaten DB'de var — yeni slug seç`,
    });
  }
}

export function runSemanticChecks(
  r: SeedRecipe,
  existingSlugs: Set<string> | null = null,
): Issue[] {
  const issues: Issue[] = [];

  checkProseField("description", r.description, issues);
  checkProseField("tipNote", r.tipNote, issues);
  checkProseField("servingSuggestion", r.servingSuggestion, issues);
  r.steps.forEach((s, i) => {
    checkProseField(
      `steps[${i}].instruction (stepNumber=${s.stepNumber})`,
      s.instruction,
      issues,
    );
    checkProseField(
      `steps[${i}].tip (stepNumber=${s.stepNumber})`,
      s.tip,
      issues,
    );
  });

  checkMacroConsistency(r, issues);
  checkAlcoholTag(r, issues);
  checkSlugDuplicate(r.slug, existingSlugs, issues);
  checkCuisine(r, issues);

  return issues;
}

function readExistingSlugs(filePath: string): Set<string> | null {
  try {
    const abs = path.resolve(filePath);
    const text = fs.readFileSync(abs, "utf-8");
    return new Set(
      text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#")),
    );
  } catch (err) {
    console.warn(
      `⚠ slug dosyası "${filePath}" okunamadı — slug çakışma kontrolü atlanıyor. (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
    return null;
  }
}

function parseArgs(argv: string[]): {
  lastN: number | null;
  slugsFile: string | null;
} {
  let lastN: number | null = null;
  let slugsFile: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--last" && argv[i + 1]) {
      const n = parseInt(argv[i + 1] ?? "", 10);
      if (Number.isFinite(n) && n >= 1) lastN = n;
      i++;
    } else if (argv[i] === "--slugs-file" && argv[i + 1]) {
      slugsFile = argv[i + 1] ?? null;
      i++;
    }
  }
  return { lastN, slugsFile };
}

interface Report {
  title: string;
  slug: string;
  zodError: string | null;
  issues: Issue[];
}

export function main(): void {
  const { lastN, slugsFile } = parseArgs(process.argv.slice(2));

  const target =
    lastN != null
      ? recipes.slice(Math.max(0, recipes.length - lastN))
      : recipes;
  const rangeLabel =
    lastN != null
      ? `son ${Math.min(lastN, recipes.length)} tarif`
      : `tüm ${recipes.length} tarif`;

  console.log(`\n🔍 validate-batch — ${rangeLabel} kontrol ediliyor...\n`);

  // 1. Zod layer
  const { valid, errors: zodErrors } = validateSeedRecipes(target);
  const zodByIndex = new Map<number, string>();
  for (const e of zodErrors) zodByIndex.set(e.index, e.message);

  // 2. Semantic layer — runs on Zod-valid entries only (invalid shapes
  // can't be trusted for semantic interpretation; Zod msg is the fix).
  const existingSlugs = slugsFile ? readExistingSlugs(slugsFile) : null;
  const validBySlug = new Map<string, SeedRecipe>();
  for (const v of valid) validBySlug.set(v.slug, v);

  const reports: Report[] = [];

  for (let i = 0; i < target.length; i++) {
    const raw = target[i];
    const zodErr = zodByIndex.get(i) ?? null;
    const title =
      raw && typeof raw === "object" && "title" in raw
        ? String((raw as { title: unknown }).title ?? "<no title>")
        : "<no title>";
    const slug =
      raw && typeof raw === "object" && "slug" in raw
        ? String((raw as { slug: unknown }).slug ?? "<no slug>")
        : "<no slug>";

    if (zodErr) {
      reports.push({ title, slug, zodError: zodErr, issues: [] });
      continue;
    }

    const recipe = validBySlug.get(slug);
    if (!recipe) continue;

    const issues = runSemanticChecks(recipe, existingSlugs);
    if (issues.length > 0) {
      reports.push({ title: recipe.title, slug: recipe.slug, zodError: null, issues });
    }
  }

  // Tally
  let errorCount = 0;
  let warningCount = 0;
  let zodFailCount = 0;
  for (const r of reports) {
    if (r.zodError) zodFailCount++;
    for (const i of r.issues) {
      if (i.severity === "ERROR") errorCount++;
      else warningCount++;
    }
  }

  if (reports.length === 0) {
    console.log(`✅ ${target.length} tarifin tamamı temiz.\n`);
    process.exit(0);
  }

  const failing = reports.filter(
    (r) => r.zodError || r.issues.some((i) => i.severity === "ERROR"),
  );
  const warnOnly = reports.filter(
    (r) =>
      !r.zodError &&
      !r.issues.some((i) => i.severity === "ERROR") &&
      r.issues.some((i) => i.severity === "WARNING"),
  );

  if (failing.length > 0) {
    console.log(`❌ ${failing.length} tarif ERROR içeriyor:\n`);
    for (const r of failing) {
      console.log(`  "${r.title}" (${r.slug})`);
      if (r.zodError) console.log(`    ❌ zod: ${r.zodError}`);
      for (const i of r.issues.filter((x) => x.severity === "ERROR")) {
        console.log(`    ❌ ${i.field}: ${i.message}`);
      }
      for (const i of r.issues.filter((x) => x.severity === "WARNING")) {
        console.log(`    ⚠  ${i.field}: ${i.message}`);
      }
      console.log();
    }
  }

  if (warnOnly.length > 0) {
    console.log(`⚠  ${warnOnly.length} tarif WARNING içeriyor:\n`);
    for (const r of warnOnly) {
      console.log(`  "${r.title}" (${r.slug})`);
      for (const i of r.issues) {
        console.log(`    ⚠  ${i.field}: ${i.message}`);
      }
      console.log();
    }
  }

  const errorTotal = errorCount + zodFailCount;
  const fail = errorTotal > 0;
  console.log(
    `Sonuç: ${fail ? "❌ FAIL" : "⚠  TEMIZ (yalnızca warning)"} — ${errorTotal} ERROR, ${warningCount} WARNING\n`,
  );
  process.exit(fail ? 1 : 0);
}

// Only run when invoked directly. Unit tests import the pure helpers
// (normalize, findForbidden, runSemanticChecks) without triggering main().
const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main();
}
