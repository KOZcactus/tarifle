/**
 * Patch scripts/seed-recipes.ts: DB → source field sync.
 *
 * 17 Nis turunda ~90 DB değişikliği source'a yansımadı. Bu script her
 * tarif için:
 *   - ingredients array'i DB'den regenerate eder (tek-satır format)
 *   - steps array'i DB'den regenerate eder
 *   - cookMinutes / tipNote / servingSuggestion field'larını update eder
 *
 * Strateji: Source'ta "slug: \"<slug>\"" ile bloğu locate et, sonra
 * ilgili field'ın başlangıç/bitiş pozisyonlarını bul, aradaki içeriği
 * DB snapshot'ıyla değiştir. String manipülasyonu regex'ten daha güvenli.
 *
 *   npx tsx scripts/patch-source-from-db.ts              # dry run (diff özeti)
 *   npx tsx scripts/patch-source-from-db.ts --apply      # source'ı yaz
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const seedPathArgIdx = process.argv.indexOf("--seed-path");
const SEED_PATH = seedPathArgIdx !== -1
  ? path.resolve(process.cwd(), process.argv[seedPathArgIdx + 1])
  : path.resolve(__d, "seed-recipes.ts");

// Optional --slugs a,b,c filter (or --slugs-file path). Limits patches
// to a specific set, default (unfiltered) rewrites every drifted recipe,
// which can produce a massive format-only diff when source is multi-line.
const slugFileArgIdx = process.argv.indexOf("--slugs-file");
const slugInlineArgIdx = process.argv.indexOf("--slugs");
let TARGET_SLUGS: Set<string> | null = null;
if (slugFileArgIdx !== -1) {
  const p = process.argv[slugFileArgIdx + 1];
  TARGET_SLUGS = new Set(
    fs.readFileSync(p, "utf8").trim().split(/\s+/).filter(Boolean),
  );
} else if (slugInlineArgIdx !== -1) {
  const list = process.argv[slugInlineArgIdx + 1];
  TARGET_SLUGS = new Set(list.split(",").map((s) => s.trim()).filter(Boolean));
}

// ── Helpers ─────────────────────────────────────────────────────────

/** JSON.stringify with TS-style quoting (double quote is fine). */
function q(s: string): string {
  return JSON.stringify(s);
}

function formatIngredient(i: {
  name: string; amount: string; unit: string | null;
  sortOrder: number; group: string | null; isOptional: boolean;
}): string {
  const parts = [
    `name: ${q(i.name)}`,
    `amount: ${q(i.amount)}`,
    `unit: ${q(i.unit ?? "")}`,
    `sortOrder: ${i.sortOrder}`,
  ];
  if (i.group) parts.push(`group: ${q(i.group)}`);
  if (i.isOptional) parts.push(`isOptional: ${i.isOptional}`);
  return `{ ${parts.join(", ")} }`;
}

function formatStep(s: {
  stepNumber: number; instruction: string; tip: string | null;
  timerSeconds: number | null;
}): string {
  const parts = [
    `stepNumber: ${s.stepNumber}`,
    `instruction: ${q(s.instruction)}`,
  ];
  if (s.tip) parts.push(`tip: ${q(s.tip)}`);
  if (s.timerSeconds !== null) parts.push(`timerSeconds: ${s.timerSeconds}`);
  return `{ ${parts.join(", ")} }`;
}

/**
 * Legacy IIFE block format (batch 12-27+): ingredients + steps string
 * arrays, helpers (ing/st/r) parse at runtime.
 *
 *   ing(["Un|1|yemek kaşığı", "Su|2|su bardağı"]) pipe-splits
 *   st(["Adım.", "Başka adım.||600"]) double-pipe for optional timer
 *
 * Object array format (batch 0-11): direct { name, amount, ... } literals
 * consumed without helpers. Detect format per-block to avoid corrupting
 * legacy IIFE blocks with object arrays (batch 27 v1 crash was root cause).
 */
function formatIngredientLegacy(i: {
  name: string; amount: string; unit: string | null;
  sortOrder: number; group: string | null; isOptional: boolean;
}): string {
  // Legacy pipe format: "name|amount|unit" only. group/isOptional NOT
  // representable; legacy IIFE ing() helper has no fields for them and
  // object-literal fallback breaks the IIFE's strict helper return type.
  // Drop these flags silently; they're rare and the DB retains them.
  return q(`${i.name}|${i.amount}|${i.unit ?? ""}`);
}

function formatStepLegacy(s: {
  stepNumber: number; instruction: string; tip: string | null;
  timerSeconds: number | null;
}): string {
  // Legacy "instruction" or "instruction||timerSeconds" format.
  // tip NOT representable in legacy IIFE st() helper; drop silently.
  if (s.timerSeconds !== null) {
    return q(`${s.instruction}||${s.timerSeconds}`);
  }
  return q(s.instruction);
}

/**
 * Detect whether a slug's current array block is legacy (string array) or
 * object array format. Returns "legacy" if first non-whitespace char after
 * opening `[` is `"`, "object" if `{`, unknown otherwise.
 */
function detectArrayFormat(
  source: string,
  slug: string,
  fieldName: "ingredients" | "steps",
): "legacy" | "object" | "unknown" {
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = source.indexOf(slugMarker);
  if (slugIdx === -1) return "unknown";
  const fieldMarker = `${fieldName}: [`;
  const fieldIdx = source.indexOf(fieldMarker, slugIdx);
  if (fieldIdx === -1) return "unknown";
  const after = source.slice(fieldIdx + fieldMarker.length, fieldIdx + fieldMarker.length + 200);
  const trimmed = after.replace(/^\s+/, "");
  if (trimmed.startsWith("\"")) return "legacy";
  if (trimmed.startsWith("{")) return "object";
  if (trimmed.startsWith("]")) return "unknown"; // empty array
  return "unknown";
}

/**
 * Find the top-level closing bracket matching the opening at `openIdx`.
 * Works with nested objects (tracks depth of `{` and `[`).
 */
function findMatchingCloseBracket(source: string, openIdx: number): number {
  let depth = 0;
  let inString: false | '"' | "'" | "`" = false;
  let escape = false;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === inString) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Replace the `<fieldName>: [...]` or `<fieldName>: "..."` right after the
 * slug marker. Returns new source string + whether a change happened.
 */
function patchArrayField(
  source: string, slug: string, fieldName: "ingredients" | "steps",
  newContent: string,
): { source: string; changed: boolean } {
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = source.indexOf(slugMarker);
  if (slugIdx === -1) return { source, changed: false };

  const fieldMarker = `${fieldName}: [`;
  // Find the next "<field>: [" after the slug (within the same recipe object)
  const fieldIdx = source.indexOf(fieldMarker, slugIdx);
  if (fieldIdx === -1) return { source, changed: false };

  // Guard: make sure we didn't jump past this recipe's closing `}`
  // Check that between slugIdx and fieldIdx there's no ", {" at depth 0
  // (would signal next recipe). Simplest heuristic: check distance.
  const betweenText = source.slice(slugIdx, fieldIdx);
  // If "]," appears then "{" starts a new recipe, suspicious
  const newRecipeRe = /\]\s*,\s*\n?\s*\{/;
  if (newRecipeRe.test(betweenText)) {
    return { source, changed: false };
  }

  const openBracketIdx = fieldIdx + fieldMarker.length - 1;
  const closeBracketIdx = findMatchingCloseBracket(source, openBracketIdx);
  if (closeBracketIdx === -1) return { source, changed: false };

  const before = source.slice(0, fieldIdx);
  const after = source.slice(closeBracketIdx + 1);
  const replacement = `${fieldName}: ${newContent}`;
  const newSource = before + replacement + after;

  // Check if actually changed
  const oldContent = source.slice(fieldIdx, closeBracketIdx + 1);
  return { source: newSource, changed: oldContent !== replacement };
}

/**
 * Patch a scalar numeric field like cookMinutes.
 */
function patchScalarField(
  source: string, slug: string, fieldName: string,
  newValue: number | string,
): { source: string; changed: boolean } {
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = source.indexOf(slugMarker);
  if (slugIdx === -1) return { source, changed: false };

  const re = new RegExp(`(${fieldName}:\\s*)[^,}]+`);
  const sliceEnd = Math.min(source.length, slugIdx + 3000);
  const slice = source.slice(slugIdx, sliceEnd);
  const match = re.exec(slice);
  if (!match) return { source, changed: false };

  const before = source.slice(0, slugIdx + match.index);
  const after = source.slice(slugIdx + match.index + match[0].length);
  const newValStr = typeof newValue === "number" ? String(newValue) : q(newValue);
  const replacement = `${fieldName}: ${newValStr}`;
  if (match[0] === replacement) return { source, changed: false };
  return { source: before + replacement + after, changed: true };
}

/**
 * Patch nullable string field (tipNote, servingSuggestion). If newValue is
 * null, replace with "null".
 */
function patchNullableStringField(
  source: string, slug: string, fieldName: string,
  newValue: string | null,
): { source: string; changed: boolean } {
  const slugMarker = `slug: "${slug}"`;
  const slugIdx = source.indexOf(slugMarker);
  if (slugIdx === -1) return { source, changed: false };

  // Match tipNote: "..." or tipNote: null
  const re = new RegExp(`(${fieldName}:\\s*)(?:"(?:[^"\\\\]|\\\\.)*"|null)`);
  const sliceEnd = Math.min(source.length, slugIdx + 5000);
  const slice = source.slice(slugIdx, sliceEnd);
  const match = re.exec(slice);
  if (!match) return { source, changed: false };

  const before = source.slice(0, slugIdx + match.index);
  const after = source.slice(slugIdx + match.index + match[0].length);
  const newValStr = newValue === null ? "null" : q(newValue);
  const replacement = `${fieldName}: ${newValStr}`;
  if (match[0] === replacement) return { source, changed: false };
  return { source: before + replacement + after, changed: true };
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  assertDbTarget("patch-source-from-db");
  console.log(
    `📋 patch-source-from-db (${APPLY ? "APPLY" : "DRY RUN"})\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true, title: true,
      prepMinutes: true, cookMinutes: true, totalMinutes: true,
      tipNote: true, servingSuggestion: true,
      ingredients: {
        select: { name: true, amount: true, unit: true, sortOrder: true, group: true, isOptional: true },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: { stepNumber: true, instruction: true, tip: true, timerSeconds: true },
        orderBy: { stepNumber: "asc" },
      },
    },
    orderBy: { slug: "asc" },
  });

  let source = fs.readFileSync(SEED_PATH, "utf8");
  let patches = 0;
  const changedSlugs = new Set<string>();
  const notInSource: string[] = [];

  for (const r of recipes) {
    if (TARGET_SLUGS && !TARGET_SLUGS.has(r.slug)) continue;
    const slugMarker = `slug: "${r.slug}"`;
    if (!source.includes(slugMarker)) {
      notInSource.push(r.slug);
      continue;
    }

    // 1. ingredients array, format-aware (legacy IIFE string array vs
    // batch 0-11 object array). Legacy format crash'i önleniyor (batch 27 v1).
    const ingFmt = detectArrayFormat(source, r.slug, "ingredients");
    const ingFormatter = ingFmt === "legacy" ? formatIngredientLegacy : formatIngredient;
    const ingStr = `[${r.ingredients.map(ingFormatter).join(", ")}]`;
    const ingRes = patchArrayField(source, r.slug, "ingredients", ingStr);
    if (ingRes.changed) {
      source = ingRes.source;
      changedSlugs.add(r.slug);
      patches++;
    }

    // 2. steps array, format-aware
    const stepFmt = detectArrayFormat(source, r.slug, "steps");
    const stepFormatter = stepFmt === "legacy" ? formatStepLegacy : formatStep;
    const stepStr = `[${r.steps.map(stepFormatter).join(", ")}]`;
    const stepRes = patchArrayField(source, r.slug, "steps", stepStr);
    if (stepRes.changed) {
      source = stepRes.source;
      changedSlugs.add(r.slug);
      patches++;
    }

    // 3. scalar fields
    for (const fName of ["prepMinutes", "cookMinutes", "totalMinutes"] as const) {
      const val = r[fName];
      const res = patchScalarField(source, r.slug, fName, val);
      if (res.changed) {
        source = res.source;
        changedSlugs.add(r.slug);
        patches++;
      }
    }

    // 4. nullable string fields (tipNote / servingSuggestion)
    for (const fName of ["tipNote", "servingSuggestion"] as const) {
      const val = r[fName];
      const res = patchNullableStringField(source, r.slug, fName, val);
      if (res.changed) {
        source = res.source;
        changedSlugs.add(r.slug);
        patches++;
      }
    }
  }

  console.log(`Recipes in DB: ${recipes.length}`);
  console.log(`Slugs not in source: ${notInSource.length}`);
  if (notInSource.length > 0) {
    console.log(`  (${notInSource.slice(0, 10).join(", ")}${notInSource.length > 10 ? "…" : ""})`);
  }
  console.log(`Patches applied: ${patches} across ${changedSlugs.size} recipes`);
  console.log(`Changed slugs: ${[...changedSlugs].slice(0, 30).join(", ")}${changedSlugs.size > 30 ? ` + ${changedSlugs.size - 30}` : ""}`);

  if (APPLY && patches > 0) {
    fs.writeFileSync(SEED_PATH, source, "utf8");
    console.log(`\n✅ Wrote ${SEED_PATH} (${patches} patches)`);
  } else if (!APPLY) {
    console.log(`\n(dry run, re-run with --apply to write file)`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("patch failed:", e);
  process.exit(1);
});
