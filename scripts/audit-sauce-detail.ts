/**
 * Audit script: find recipes with sauce/component detail gaps.
 *
 * Categories:
 *   A  tipNote or servingSuggestion mentions "sos" / "ayri hazirla" but
 *      steps lack a sauce-making step.
 *   B  Ingredients reference sauce-like items (salca, sos, krema, serbet,
 *      marine, terbiye, besamel) but NO ingredient uses the `group` field.
 *   C  Steps mention "sosu hazirlayIn" / "sosu yapIn" but the step
 *      instruction is < 50 chars (vague).
 *   D  tipNote says "sosu ayri" / "ayri hazirlayin" but steps don't
 *      explain HOW.
 *
 * Run:  npx tsx scripts/audit-sauce-detail.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ── Setup ────────────────────────────────────────────────
neonConfig.webSocketConstructor = ws;

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

function initPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ortam degiskeni tanimli degil!");
  }
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

// ── Helpers ──────────────────────────────────────────────

/** Case-insensitive Turkish-safe test (ASCII-folded). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}

/** Check whether normalized text contains any of the given keywords. */
function containsAny(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((kw) => n.includes(kw));
}

// Keyword lists (already ASCII-folded)
const SAUCE_MENTION_KEYWORDS = [
  "sos",
  "serbet",
  "marine",
  "terbiye",
  "besamel",
  "bechamel",
];

const SAUCE_INGREDIENT_KEYWORDS = [
  "salca",
  "sos",
  "krema",
  "serbet",
  "marine",
  "terbiye",
  "besamel",
  "bechamel",
];

const SAUCE_STEP_KEYWORDS = [
  "sosu hazirlayin",
  "sosu yapin",
  "sosu karistirin",
  "sos hazirlama",
  "sos yapimi",
  "sosu pisirin",
];

const SEPARATE_PREP_KEYWORDS = [
  "ayri hazirla",
  "ayri hazirlayabilirsiniz",
  "ayri hazirlayip",
  "sosu ayri",
  "ayri olarak hazirla",
  "ayri yapilabilir",
];

// ── Main ─────────────────────────────────────────────────

interface RecipeRow {
  slug: string;
  title: string;
  tipNote: string | null;
  servingSuggestion: string | null;
  ingredients: { name: string; group: string | null }[];
  steps: { stepNumber: number; instruction: string }[];
}

async function main() {
  const prisma = initPrisma();

  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        tipNote: true,
        servingSuggestion: true,
        ingredients: {
          select: { name: true, group: true },
          orderBy: { sortOrder: "asc" },
        },
        steps: {
          select: { stepNumber: true, instruction: true },
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    console.log(`\nToplam tarif sayisi: ${recipes.length}\n`);

    const catA: { slug: string; detail: string }[] = [];
    const catB: { slug: string; detail: string }[] = [];
    const catC: { slug: string; detail: string }[] = [];
    const catD: { slug: string; detail: string }[] = [];

    for (const r of recipes as RecipeRow[]) {
      const allStepText = r.steps.map((s) => s.instruction).join(" ");
      const tipNorm = r.tipNote ? normalize(r.tipNote) : "";
      const servNorm = r.servingSuggestion
        ? normalize(r.servingSuggestion)
        : "";
      const tipAndServ = tipNorm + " " + servNorm;

      // ── Category A ──
      // tipNote or servingSuggestion mentions sauce / "ayri hazirla" but
      // steps don't contain a sauce-making step.
      const tipMentionsSauce =
        containsAny(tipAndServ, SAUCE_MENTION_KEYWORDS) ||
        containsAny(tipAndServ, SEPARATE_PREP_KEYWORDS);

      const stepsHaveSauceStep = containsAny(allStepText, [
        ...SAUCE_STEP_KEYWORDS,
        "sos",
        "serbet",
        "marine",
        "terbiye",
        "besamel",
      ]);

      if (tipMentionsSauce && !stepsHaveSauceStep) {
        const matchedIn = containsAny(tipNorm, [
          ...SAUCE_MENTION_KEYWORDS,
          ...SEPARATE_PREP_KEYWORDS,
        ])
          ? "tipNote"
          : "servingSuggestion";
        catA.push({ slug: r.slug, detail: `Mentioned in ${matchedIn}` });
      }

      // ── Category B ──
      // Ingredients reference sauce-like items but NO ingredient has a group.
      const hasGroupedIngredient = r.ingredients.some(
        (i) => i.group !== null && i.group.trim() !== ""
      );
      const hasSauceIngredient = r.ingredients.some((i) =>
        containsAny(i.name, SAUCE_INGREDIENT_KEYWORDS)
      );

      // We also check whether the recipe is truly multi-component by looking
      // for step keywords that suggest sauce preparation.
      const stepsImplyMultiComponent = containsAny(allStepText, [
        ...SAUCE_STEP_KEYWORDS,
        "serbet",
        "marine",
        "terbiye",
        "besamel",
      ]);

      if (
        hasSauceIngredient &&
        stepsImplyMultiComponent &&
        !hasGroupedIngredient
      ) {
        const sauceIngNames = r.ingredients
          .filter((i) => containsAny(i.name, SAUCE_INGREDIENT_KEYWORDS))
          .map((i) => i.name);
        catB.push({
          slug: r.slug,
          detail: `Sauce ingredients: ${sauceIngNames.join(", ")}`,
        });
      }

      // ── Category C ──
      // Steps mention "sosu hazirlayIn" or "sosu yapIn" but instruction < 50 chars.
      for (const step of r.steps) {
        if (containsAny(step.instruction, SAUCE_STEP_KEYWORDS)) {
          if (step.instruction.length < 50) {
            catC.push({
              slug: r.slug,
              detail: `Step ${step.stepNumber} (${step.instruction.length} chars): "${step.instruction.substring(0, 80)}"`,
            });
          }
        }
      }

      // ── Category D ──
      // tipNote says "sosu ayri" / "ayri hazirlayin" but steps don't explain how.
      const tipMentionsSeparatePrep = containsAny(
        tipNorm,
        SEPARATE_PREP_KEYWORDS
      );
      if (tipMentionsSeparatePrep) {
        // Check if steps actually explain sauce preparation
        const stepsExplainSauce = r.steps.some(
          (s) =>
            containsAny(s.instruction, SAUCE_STEP_KEYWORDS) &&
            s.instruction.length >= 50
        );
        if (!stepsExplainSauce) {
          catD.push({
            slug: r.slug,
            detail: `tipNote: "${(r.tipNote ?? "").substring(0, 100)}"`,
          });
        }
      }
    }

    // ── Report ─────────────────────────────────────────
    const totalFlagged = new Set([
      ...catA.map((r) => r.slug),
      ...catB.map((r) => r.slug),
      ...catC.map((r) => r.slug),
      ...catD.map((r) => r.slug),
    ]).size;

    console.log("=".repeat(70));
    console.log("  SAUCE DETAIL AUDIT REPORT");
    console.log("=".repeat(70));
    console.log(`\n  Total recipes scanned : ${recipes.length}`);
    console.log(`  Total flagged (unique): ${totalFlagged}`);
    console.log(`  Category A : ${catA.length} (tip/serving mentions sauce, steps lack sauce step)`);
    console.log(`  Category B : ${catB.length} (multi-component recipe, no ingredient groups)`);
    console.log(`  Category C : ${catC.length} (sauce step too vague, < 50 chars)`);
    console.log(`  Category D : ${catD.length} (tip says "prepare separately", steps don't explain)`);
    console.log();

    if (catA.length > 0) {
      console.log("-".repeat(70));
      console.log("  CATEGORY A: Tip/serving mentions sauce but steps lack sauce step");
      console.log("-".repeat(70));
      for (const item of catA) {
        console.log(`    ${item.slug}  --  ${item.detail}`);
      }
      console.log();
    }

    if (catB.length > 0) {
      console.log("-".repeat(70));
      console.log("  CATEGORY B: Multi-component recipe, no ingredient groups");
      console.log("-".repeat(70));
      for (const item of catB) {
        console.log(`    ${item.slug}  --  ${item.detail}`);
      }
      console.log();
    }

    if (catC.length > 0) {
      console.log("-".repeat(70));
      console.log("  CATEGORY C: Sauce step too vague (< 50 chars)");
      console.log("-".repeat(70));
      for (const item of catC) {
        console.log(`    ${item.slug}  --  ${item.detail}`);
      }
      console.log();
    }

    if (catD.length > 0) {
      console.log("-".repeat(70));
      console.log("  CATEGORY D: Tip says 'prepare separately', steps don't explain");
      console.log("-".repeat(70));
      for (const item of catD) {
        console.log(`    ${item.slug}  --  ${item.detail}`);
      }
      console.log();
    }

    // Overlap analysis
    const slugSets = {
      A: new Set(catA.map((r) => r.slug)),
      B: new Set(catB.map((r) => r.slug)),
      C: new Set(catC.map((r) => r.slug)),
      D: new Set(catD.map((r) => r.slug)),
    };

    const multiCategory: string[] = [];
    for (const slug of totalFlagged > 0
      ? [
          ...new Set([
            ...catA.map((r) => r.slug),
            ...catB.map((r) => r.slug),
            ...catC.map((r) => r.slug),
            ...catD.map((r) => r.slug),
          ]),
        ]
      : []) {
      const cats: string[] = [];
      if (slugSets.A.has(slug)) cats.push("A");
      if (slugSets.B.has(slug)) cats.push("B");
      if (slugSets.C.has(slug)) cats.push("C");
      if (slugSets.D.has(slug)) cats.push("D");
      if (cats.length > 1) {
        multiCategory.push(`${slug} => ${cats.join(", ")}`);
      }
    }

    if (multiCategory.length > 0) {
      console.log("-".repeat(70));
      console.log("  OVERLAP: Recipes flagged in multiple categories");
      console.log("-".repeat(70));
      for (const line of multiCategory) {
        console.log(`    ${line}`);
      }
      console.log();
    }

    console.log("=".repeat(70));
    console.log("  AUDIT COMPLETE");
    console.log("=".repeat(70));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
